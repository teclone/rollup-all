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

            let dest = options.outDir + '/' + _module.relPath;
            if (_module.isAsset) {
                if (options.copyAssets) {
                    const dir = path.dirname(dest);
                    if (!fs.existsSync(dir))
                        fs.mkdirSync(dir);

                    fs.writeFileSync(dest, fs.readFileSync(src));
                }
                continue;
            }

            let externals = externalModules.filter(filterExternalModules);
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
            let filePath = resolvedPath + '/' + file;
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
                absPath: resolvedPath + '/' + (baseName || file),
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
        let entryPath = this.getEntryPath(require.main.filename),
        config = null;

        if (fs.existsSync(entryPath + '/' + this.configPath))
            config = Object.assign({}, _config, require(entryPath + '/' + this.configPath));
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

        return exportStore;
    }
}