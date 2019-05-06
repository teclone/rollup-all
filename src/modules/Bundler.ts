import * as path from 'path';
import * as fs from 'fs';
import {copy, value as pickValue, isString, camelCase} from '@forensic-js/utils';
import { Config, UserConfig, CommonConfig, LibConfig, DistConfig, Module, Build } from '../@types';
import defualtConfig from '../.buildrc';
import { COMMON_CONFIGS } from '../Constants';
import {mkDirSync, isProdEnv, getEntryPath} from '@forensic-js/node-utils';

export default class Bundler {

    private plugins: object[] = [];

    private pluginsWithUglifier: object[] = [];

    private entryPath: string = '';

    private config: Config = defualtConfig;


    /**
     * @param uglifierPlugin uglifier plugin if uglify settings is enabled
     * @param otherPlugins array of other plugins
     * @param config path to user defined build config or the user defined config object
     */
    constructor(uglifierPlugin: object | null, otherPlugins: object[], config: string | UserConfig) {
        this.plugins = otherPlugins;
        this.pluginsWithUglifier = [...otherPlugins];

        if (uglifierPlugin) {
            this.pluginsWithUglifier.push(uglifierPlugin);
        }

        this.entryPath = getEntryPath();
        this.config = this.resolveConfig(this.entryPath, config);
    }

    /**
     * resolves the pattern into a regex object
     *@param {Array|string|RegExp} patterns - array of patterns or string pattern
     *@param {Array} regexStore - array to store regex objects
    */
    private resolveRegex(patterns: (string|RegExp)[]) {
        return patterns.map(pattern => {
            if (isString(pattern)) {
                if (pattern === '*') {
                    return new RegExp('.*');
                }
                else {
                    pattern = pattern.replace(/\./g, '\\.').replace(/\*{2}/g, '.*')
                        .replace(/\*/g, '[^/]+');
                    return new RegExp(pattern, 'i');
                }
            }
            else {
                return pattern;
            }
        });
    }

    private pickConfig(prop: keyof CommonConfig, targetConfig: LibConfig | DistConfig,
        config: Config) {
        if (prop !== 'include' && prop !== 'exclude') {
            targetConfig[prop] = pickValue(prop, targetConfig, config[prop]);
        }
        else {
            targetConfig[prop] = this.resolveRegex(pickValue(prop, targetConfig, config[prop]));
        }
    }

    /**
     * resolves the config object
     */
    private resolveConfig(entryPath: string , config: string | UserConfig): Config {
        if (isString(config)) {
            const absPath = path.resolve(entryPath, config);
            try {
                config = require(absPath) as UserConfig;
            }
            catch(ex){
                console.info(`Proceeding with default config options. "${config}" did not match any file`);
                config = {};
            }
        }
        const resolvedConfig: Config = copy({}, defualtConfig, config as Config);

        //resolve lib config
        COMMON_CONFIGS.forEach(prop => {
            this.pickConfig(prop, resolvedConfig.libConfig, resolvedConfig);
            this.pickConfig(prop, resolvedConfig.distConfig, resolvedConfig);
        });

        //enable output compression if running in production environment
        if (isProdEnv()) {
            resolvedConfig.libConfig.uglify = true;
            resolvedConfig.distConfig.uglify = true;
        }
        return resolvedConfig;
    }

    /**
     * copies the file from the src to the destination
    */
    private copyFile(src: string, filePath: string) {
        const dest = path.resolve(this.entryPath, filePath);
        mkDirSync(dest);

        fs.copyFileSync(src, dest);
    }

    /**
     * generates build export for each module
    */
    private getExports(exportStore: Build[], modules: Module[], config: DistConfig | LibConfig) {
        let src = null;
        const regexMatches = function (regex) {
            return regex.test(src);
        };

        for (const {isAsset, filePath, oldRelativePath, newRelativePath, isTypeDefinitionFile, name} of modules) {
            src = filePath;
            if (isAsset) {
                this.copyFile(filePath, path.join(config.outDir, oldRelativePath));
            }
            else if (isTypeDefinitionFile && config.copyTypings) {
                this.copyFile(filePath, path.join(config.typingsDir, oldRelativePath));
            }
            else if (config.include.some(regexMatches) &&
                (config.exclude.length === 0 || !config.exclude.some(regexMatches))) {
                exportStore.push({
                    input: filePath,
                    output: {
                        file: path.join(config.outDir, newRelativePath),
                        format: config.format,
                        name: camelCase(name),
                        interop: config.interop,
                        sourcemap: config.sourcemap,
                        globals: this.config.globals
                    },
                    plugins: config.uglify? this.pluginsWithUglifier : this.plugins,
                    external: () => {
                        return config.format === 'cjs';
                    },
                    watch: this.config.watch
                });
            }
        }
    }

    /**
     * gets all modules
    */
    private getModules(modules: Module[], resolvedPath: string, mainModuleFileName: string,
        mainModuleName: string, currentRelativeDir: string, fileExtensions: string[]) {

        const files = fs.readdirSync(resolvedPath);
        for (const file of files) {

            const filePath = path.join(resolvedPath, file);
            if (fs.statSync(filePath).isDirectory()) {
                this.getModules(
                    modules, filePath, mainModuleFileName, mainModuleName,
                    path.join(currentRelativeDir, file), fileExtensions
                );
            }
            else {
                const extname = path.extname(file);
                const baseName = path.basename(file, extname);

                const tdTester = /\.d\.ts$/i; //type definition tester

                const isAsset = !fileExtensions.includes(extname) && ! tdTester.test(file);
                const isTypeDefinitionFile = tdTester.test(file);

                const oldRelativePath = path.join(currentRelativeDir, file);
                const newRelativePath = path.join(currentRelativeDir, baseName + '.js');

                modules.push({
                    oldRelativePath,
                    newRelativePath,
                    isAsset,
                    isTypeDefinitionFile,
                    filePath,
                    name: oldRelativePath === mainModuleFileName? mainModuleName : baseName
                });
            }
        }
        return modules;
    }

    /**
     * returns the resolved config object
     */
    getConfig() {
        return this.config;
    }

    /**
     * runs the process
    */
    process() {

        const startAt = path.resolve(this.entryPath, this.config.srcDir);
        const config = this.config;
        const modules = this.getModules(
            [], startAt, config.mainModuleFileName, config.mainModuleName, '', config.fileExtensions
        );

        const exportStore: Build[] = [];
        if (config.libConfig.enabled) {
            this.getExports(exportStore, modules, config.libConfig);
        }
        if (config.distConfig.enabled) {
            this.getExports(exportStore, modules, config.distConfig);
        }
        return exportStore;
    }
}