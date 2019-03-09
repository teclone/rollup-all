import path from 'path';
import fs from 'fs';

import Util from './Util.js';
import _config from '../.buildrc.json';


/**
 *@typedef {Object} Module
 *@property {string} relPath - module relative path
 *@property {string} absPath - module absolute path
 *@property {boolean} isAsset - boolean indicating if module is an asset file
 *@property {string} name - module export name
 */
export default class Bundler {

    /**
     *@param {Object} [uglifierPlugin=null] - uglifier plugin to use
     *@param {Array} [otherPlugins=[]] - array of other plugins to use. defaults to empty array
     *@param {string} [configPath='.buildrc.json'] - config file location relative url
    */
    constructor(uglifierPlugin, otherPlugins, configPath) {
        this.configPath = configPath ? configPath : '.buildrc.json';
        this.plugins = Util.isArray(otherPlugins) ? otherPlugins : [];
        this.pluginsWithUglifer = uglifierPlugin ? [...this.plugins, uglifierPlugin] : null;
    }

    /**
     * return class identity
    */
    get [Symbol.toStringTag]() {
        return 'Bundler';
    }

    /**
     * returns the config for the given file
     *@param {boolean} _uglify - boolean value indicating if file should be minified
     *@param {Object} options - object options
     *@param {string} options.format - the expected output format
     *@param {string} options.src - the file source directory
     *@param {string} options.dest - the file destination directory, omit the .js extension
     *@param {string} name - the file module name
     *@param {Array} externals - array of module externals
     *@returns {Object}
    */
    getConfig(uglify, options, name, externals) {
        return {
            input: options.src,
            output: {
                file: options.dest,
                format: options.format,
                name: Util.camelCase(name),
                interop: options.interop,
                sourcemap: options.sourcemap,
                globals: options.globals
            },
            plugins: uglify ? this.pluginsWithUglifier : this.plugins,
            external: externals,
            watch: options.watch
        };
    }

    /**
     * copies the file from the src to the destination
     *@param {string} src - the src file
     *@param {string} dest - the file destination
    */
    copyFile(src, dest) {
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir))
            Util.mkDirSync(dir);

        fs.copyFileSync(src, dest);
    }

    /**
     * returns the allowed exports for each build kind
     *@param {Array} exportStore - array to store in the exports
     *@param {Object} options - options object
     *@param {string} options.outDir - the out directory for the build kind
     *@param {string} options.format - the output format for all included modules in this build
     *@param {boolean} options.uglify - boolean value indicating if modules should be uglified
     *@param {Module[]} modules - the modules list to build from
     *@param {Array} externalModules - array of external modules
     *@param {RegExp[]} includes - array of regex objects that specifies modules to include
     *@param {RegExp[]} excludes - array of regex objects that specifies modules to exclude
    */
    getExports(exportStore, options, modules, externalModules, includes, excludes) {
        let src = null,
            regexMatches = function (regex) {
                return regex.test(src);
            },
            filterExternalModules = function (externalModule) {
                return externalModule !== src;
            };

        for (const _module of modules) {

            src = _module.absPath;
            const dest = path.join(options.outDir, _module.relPath);

            if (!includes.some(regexMatches) || excludes.some(regexMatches))
                continue;

            if (_module.isAsset) {
                this.copyFile(_module.absPath, dest);
                continue;
            }

            const externals = externalModules.filter(filterExternalModules);
            exportStore.push(this.getConfig(options.uglify, {
                src: src,
                dest: dest,
                format: options.format,
                interop: options.interop,
                sourcemap: options.sourcemap,
                ext: _module.ext
            }, _module.name, externals));
        }
    }

    /**
     * returns array of mapped external modules
     *@param {Module[]} modules - array of modules
     *@returns {string[]}
    */
    getExternalModules(modules) {
        return modules.map(current => current.absPath);
    }

    /**
     * gets all modules
     *@param {Array} modules - array to store modules
     *@param {string} resolvedPath - the resolved root module directory to iterate
     *@param {string} mainModuleFileName - the file name of the main module as set in the config
     * file
     *@param {string} mainModuleName - the global module name for the main export file. applies
     * to iife builds
     *@param {string} relDir - current directory relative to src directory
     *@param {Array} fileExtensions - array of supported file extensions. file extensions not
     * included here are regarded as asset files
     *@returns {Module[]}
    */
    getModules(modules, resolvedPath, mainModuleFileName, mainModuleName, relDir,
        fileExtensions) {
        const files = fs.readdirSync(resolvedPath);
        for (const file of files) {
            const filePath = path.join(resolvedPath, file);

            if (fs.statSync(filePath).isDirectory()) {
                this.getModules(
                    modules, filePath, mainModuleFileName, mainModuleName,
                    path.join(relDir, file), fileExtensions
                );
            }
            else {
                const extname = path.extname(file);
                const baseName = path.basename(file, extname);

                const isAsset = !fileExtensions.includes(extname);

                const oldRelPath = path.join(relDir, file);
                const relPath = path.join(relDir, baseName + '.js');

                modules.push({
                    relPath: isAsset ? oldRelPath : relPath,
                    name: oldRelPath === mainModuleFileName ? mainModuleName : baseName,
                    isAsset,
                    absPath: filePath
                });
            }
        }
        return modules;
    }

    /**
     * resolves the pattern into a regex object
     *@param {Array|string|RegExp} patterns - array of patterns or string pattern
     *@param {Array} regexStore - array to store regex objects
    */
    resolveRegex(patterns, regexStore) {
        if (typeof patterns === 'string') {
            if (patterns === '*') {
                regexStore.push(new RegExp('.*'));
            }
            else {
                patterns = patterns.replace(/\./g, '\\.').replace(/\*{2}/g, '.*')
                    .replace(/\*/g, '[^/]+');
                regexStore.push(new RegExp(patterns, 'i'));
            }
        }

        else if (patterns instanceof RegExp) {
            regexStore.push(patterns);
        }

        else if (Util.isArray(patterns)) {
            for (let pattern of patterns)
                this.resolveRegex(pattern, regexStore);
        }

        return regexStore;
    }

    /**
     * returns the entry path
    */
    getEntryPath(mainFileName) {
        if (mainFileName.indexOf('node_modules') > 0)
            return mainFileName.split('/node_modules')[0];

        let currentPath = path.join(mainFileName, '../'),
            rightPath = '';
        while (currentPath !== '/') {
            if (fs.existsSync(currentPath + '/package.json')) {
                rightPath = currentPath;
                break;
            }
            currentPath = path.join(currentPath, '../');
        }
        return rightPath;
    }

    /**
     * picks config value for the given property on cofig, else picks from the fallback config
    */
    pickConfig(prop, config, fallbackConfig) {
        if (typeof config[prop] !== 'undefined') {
            return config[prop];
        }
        else {
            return fallbackConfig[prop];
        }
    }

    /**
     * runs the process
     *@returns {Array}
    */
    process() {
        //resolve user defined settings
        let entryPath = '';

        /* istanbul ignore else */
        if (require.main)
            entryPath = this.getEntryPath(require.main.filename);
        else
            entryPath = this.getEntryPath(__dirname);

        let config = null;

        if (fs.existsSync(path.join(entryPath, this.configPath)))
            config = Util.mergeObjects(_config, require(path.join(entryPath, this.configPath)));
        else
            config = _config;

        //extract lib and dist configs
        const libConfig = config.libConfig,
            distConfig = config.distConfig,

            //define includes and excludes regex
            includes = this.resolveRegex(config.include, []),
            excludes = this.resolveRegex(config.exclude, []),


            //get modules & extend external modules
            modules = this.getModules(
                [],
                path.resolve(entryPath, config.srcDir),
                config.mainModuleFileName,
                config.mainModuleName,
                '',
                config.fileExtensions
            ),

            //define the exportStore
            exportStore = [];

        if (libConfig.enabled) {
            const externalModules = [
                ...config.externalModules,
                ...this.getExternalModules(modules)
            ];
            this.getExports(
                exportStore,
                {
                    outDir: path.resolve(entryPath, libConfig.outDir),

                    format: libConfig.format,

                    uglify: Util.isProdEnv() || libConfig.uglify,

                    copyAssets: this.pickConfig('copyAssets', libConfig, config),

                    interop: this.pickConfig('interop', libConfig, config),

                    sourcemap: this.pickConfig('sourcemap', libConfig, config),

                    globals: this.pickConfig('globals', libConfig, config),

                    watch: this.pickConfig('watch', libConfig, config)
                },
                modules,
                externalModules,
                libConfig.include ? this.resolveRegex(libConfig.include, []) : includes,
                libConfig.exclude ? this.resolveRegex(libConfig.exclude, []) : excludes
            );
        }

        if (distConfig.enabled) {
            this.getExports(
                exportStore,
                {
                    outDir: path.join(entryPath, distConfig.outDir),

                    format: distConfig.format,

                    uglify: Util.isProdEnv() || distConfig.uglify,

                    copyAssets: this.pickConfig('copyAssets', distConfig, config),

                    interop: this.pickConfig('interop', distConfig, config),

                    sourcemap: this.pickConfig('sourcemap', distConfig, config),

                    globals: this.pickConfig('globals', distConfig, config),

                    watch: this.pickConfig('watch', distConfig, config),
                },
                modules,
                [],
                distConfig.include ? this.resolveRegex(distConfig.include, []) : includes,
                distConfig.exclude ? this.resolveRegex(distConfig.exclude, []) : excludes
            );
        }

        return exportStore;
    }
}