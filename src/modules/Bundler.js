import path from 'path';
import fs from 'fs';

import Util from './Util.js';
import _config from '../.buildrc.json';

export default class Bundler {

    /**
     *@param {Object} [uglifierPlugin=null] - uglifier plugin to use
     *@param {Array} [otherPlugins=[]] - array of other plugins to use. defaults to empty array
     *@param {string} [configPath='.buildrc.json'] - config file location relative url
    */
    constructor(uglifierPlugin, otherPlugins, configPath) {
        this.plugins = Util.isArray(otherPlugins)? otherPlugins : [];
        this.pluginsWithUglifer = uglifierPlugin? [...this.plugins, uglifierPlugin] : null;
        this.configPath = typeof configPath === 'string'? configPath : '.buildrc.json';
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
                file: options.dest + (uglify? '.min' : '') + options.ext,
                format: options.format,
                name: Util.camelCase(name),
                interop: options.interop,
                sourcemap: options.sourcemap
            },
            plugins: uglify? this.pluginsWithUglifer : this.plugins,
            external: externals
        };
    }

    /**
     * copies the file from the src to the destination
     *@param {string} src - the src file
     *@param {string} dest - the file destination
    */
    copyFile(src, dest) {
        let dir = path.dirname(dest);
        if (!fs.existsSync(dir))
            Util.mkDirSync(dir);

        fs.writeFileSync(dest, fs.readFileSync(src));
    }

    /**
     * returns the allowed exports for each build kind
     *@param {Array} exportStore - array to store in the exports
     *@param {Object} options - options object
     *@param {string} options.outDir - the out directory for the build kind
     *@param {string} options.format - the output format for all included modules in this build
     *@param {boolean} options.uglify - boolean value indicating if modules should be uglified
     *@param {boolean} options.uglifyOnly - boolean value indicating if only uglified outputs should
     * be produced
     *@param {Array} modules - the modules list to build from
     *@param {Array} externalModules - array of external modules
     *@param {RegExp[]} includes - array of regex objects that specifies modules to include
     *@param {RegExp[]} excludes - array of regex objects that specifies modules to exclude
    */
    getExports(exportStore, options, modules, externalModules, includes, excludes) {
        let src = null,
            regexMatches = function(regex) {
                return regex.test(src);
            },
            filterExternalModules = function(externalModule) {
                return externalModule !== src;
            };

        for (let _module of modules) {
            src = _module.absPath + _module.ext;
            if (!includes.some(regexMatches) || excludes.some(regexMatches))
                continue;

            let dest = path.join(options.outDir, _module.relPath);
            if (_module.isAsset) {
                if (options.copyAssets)
                    this.copyFile(src, dest);
                continue;
            }

            let externals = externalModules.filter(filterExternalModules);

            if(!options.uglifyOnly)
                exportStore.push(this.getConfig(false, {
                    src: src,
                    dest: dest,
                    format: options.format,
                    interop: options.interop,
                    sourcemap: options.sourcemap,
                    ext: _module.ext
                }, _module.name, externals));

            if (this.pluginsWithUglifer !== null && (options.uglifyOnly || options.uglify))
                exportStore.push(this.getConfig(true, {
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
     *@param {Array} modules - array of modules
    */
    getExternalModules(modules) {
        return modules.map(current => current.absPath + current.ext);
    }

    /**
     * gets all modules
     *@param {Array} modules - array to store modules
     *@param {string} resolvedPath - the resolved root module directory to iterate
     *@param {string} mainModuleFileName - the file name of the main module as set in the config
     * file
     *@param {string} mainModuleName - the global module name for the main export file. applies
     * to iife builds
     *@param {Array} srcPaths - array of paths relative to the source directory
     *@param {Array} fileExtensions - array of supported file extensions. files not included here
     * are regarded as asset files
     *@returns {Array}
    */
    getModules(modules, resolvedPath, mainModuleFileName, mainModuleName, srcPaths,
        fileExtensions) {
        let files = fs.readdirSync(resolvedPath);
        for (let file of files) {
            let filePath = path.join(resolvedPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.getModules(modules, filePath, mainModuleFileName, mainModuleName,
                    [...srcPaths, file], fileExtensions);
                continue;
            }

            let baseName = '', extname = path.extname(file);
            for (const fileExtension of fileExtensions) {
                if (fileExtension === extname) {
                    baseName = path.basename(file, fileExtension);
                    break;
                }
            }

            modules.push({
                name: file === mainModuleFileName && baseName? mainModuleName : baseName,
                ext: baseName? extname : '',
                relPath: [...srcPaths, baseName || file].join('/'),
                absPath: path.join(resolvedPath, baseName || file),
                isAsset: baseName? false : true
            });
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
        let libConfig = config.libConfig,
            distConfig = config.distConfig,

            //define includes and excludes regex
            includes = this.resolveRegex(config.include, []),
            excludes = this.resolveRegex(config.exclude, []),

            //get modules & extend external modules
            modules = this.getModules(
                [],
                path.resolve(path.join(entryPath, config.srcDir)),
                config.mainModuleFileName,
                config.mainModuleName,
                [],
                config.fileExtensions
            ),
            externalModules = [...config.externalModules, ...this.getExternalModules(modules)],

            //define the exportStore
            exportStore = [];

        if (!libConfig.disabled)
            this.getExports(
                exportStore,
                {
                    outDir: path.join(entryPath, libConfig.outDir),
                    format: libConfig.format,

                    uglifyOnly: typeof libConfig.uglifyOnly !== 'undefined'?
                        libConfig.uglifyOnly : config.uglifyOnly,
                    uglify: libConfig.uglify? true : config.uglify,

                    copyAssets: typeof libConfig.copyAssets !== 'undefined'?
                        libConfig.copyAssets : config.copyAssets,

                    interop: typeof libConfig.interop !== 'undefined'?
                        libConfig.interop : config.interop,

                    sourcemap: typeof libConfig.sourcemap !== 'undefined'?
                        libConfig.sourcemap : config.sourcemap
                },
                modules,
                externalModules,
                libConfig.include? this.resolveRegex(libConfig.include, []) : includes,
                libConfig.exclude? this.resolveRegex(libConfig.exclude, []) : excludes
            );

        if (!distConfig.disabled)
            this.getExports(
                exportStore,
                {
                    outDir: path.join(entryPath, distConfig.outDir),
                    format: distConfig.format,

                    uglifyOnly: typeof distConfig.uglifyOnly !== 'undefined'?
                        distConfig.uglifyOnly : config.uglifyOnly,
                    uglify: distConfig.uglify? true : config.uglify,

                    copyAssets: typeof distConfig.copyAssets !== 'undefined'?
                        distConfig.copyAssets : config.copyAssets,

                    interop: typeof distConfig.interop !== 'undefined'?
                        distConfig.interop : config.interop,

                    sourcemap: typeof distConfig.sourcemap !== 'undefined'?
                        distConfig.sourcemap : config.sourcemap
                },
                modules,
                [],
                distConfig.include? this.resolveRegex(distConfig.include, []) : includes,
                distConfig.exclude? this.resolveRegex(distConfig.exclude, []) : excludes
            );

        return exportStore;
    }
}