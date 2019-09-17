import * as path from 'path';
import * as fs from 'fs';
import { copy, pickValue, isString, camelCase, isArray, isBoolean } from '@forensic-js/utils';
import { Config, UserConfig, CommonConfig, LibConfig, DistConfig, Module, Build } from '../@types';
import defualtConfig from '../.buildrc';
import { COMMON_CONFIGS, REGEX_FIELDS } from '../Constants';
import { mkDirSync, isProdEnv, getEntryPath } from '@forensic-js/node-utils';

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
  private resolveRegex(pattern: string | RegExp) {
    if (isString(pattern)) {
      if (pattern === '*') {
        return new RegExp('^.*$', 'i');
      } else {
        pattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*{2}/g, '.*')
          .replace(/\*/g, '[^/]+');
        return new RegExp('^' + pattern + '$', 'i');
      }
    } else {
      return pattern;
    }
  }

  private mergeConfig(prop: keyof CommonConfig, config: Config, target: LibConfig | DistConfig) {
    const configValue = config[prop];
    const targetValue = target[prop];

    if (targetValue === undefined) {
      target[prop as string] = configValue;
    } else if (isString(targetValue) || isBoolean(targetValue) || !isArray(targetValue)) {
      target[prop as string] = targetValue;
    } else {
      target[prop as string] = [...configValue, ...targetValue];
    }

    if (REGEX_FIELDS.includes(prop)) {
      target[prop as string] = (target[prop as string] as (string | RegExp)[]).map(this.resolveRegex);
    }
  }

  /**
   * loads the given file and returns the result
   * @param file
   */
  private loadFile(entryPath: string, file: string) {
    try {
      return require(path.resolve(entryPath, file));
    } catch (ex) {
      return {};
    }
  }

  /**
   * resolves the config object
   */
  private resolveConfig(entryPath: string, config: string | UserConfig): Config {
    const packageFile = this.loadFile(entryPath, 'package.json');
    config = isString(config) ? this.loadFile(entryPath, config) : config;

    const resolvedConfig: Config = copy({}, defualtConfig, config as Config);

    //resolve module name
    resolvedConfig.moduleName = resolvedConfig.moduleName || camelCase(packageFile.name);

    //resolve lib config
    COMMON_CONFIGS.forEach(prop => {
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.libConfig);
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.distConfig);
    });

    //for lib config, add all per dependencies as externals
    if (packageFile.peerDependencies) {
      Object.keys(packageFile.peerDependencies).forEach(key => resolvedConfig.libConfig.externals.push(key));
    }

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
    const regexMatches = regex => regex.test(src);

    for (const { ext, isBuildFile, filePath, oldRelativePath, newRelativePath, name } of modules) {
      src = oldRelativePath;
      const isTypeDefinitionFile = ext === '.d.ts';

      if ((isTypeDefinitionFile && config.copyTypings) || (!isBuildFile && config.assets.some(regexMatches))) {
        this.copyFile(filePath, path.join(config.outDir, oldRelativePath));
      } else if (
        isBuildFile &&
        (config.include.length === 0 || config.include.some(regexMatches)) &&
        (config.exclude.length === 0 || !config.exclude.some(regexMatches))
      ) {
        exportStore.push({
          input: filePath,
          output: {
            file: path.resolve(this.entryPath, config.outDir, newRelativePath),
            format: config.format,
            name: camelCase(name),
            interop: config.interop,
            sourcemap: config.sourcemap,
            globals: this.config.globals,
          },
          plugins: config.uglify ? this.pluginsWithUglifier : this.plugins,
          external: config.externals,

          // external: (id, parent, isResolved) => {
          //   console.log(id);
          //   return config.format === 'cjs';
          // },
          watch: this.config.watch,
        });
      }
    }
  }

  /**
   * gets all modules
   */
  private getModules(
    modules: Module[],
    resolvedPath: string,
    entryFile: string,
    moduleName: string,
    currentRelativeDir: string,
    fileExtensions: string[]
  ) {
    const files = fs.readdirSync(resolvedPath);
    for (const file of files) {
      const filePath = path.join(resolvedPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        this.getModules(modules, filePath, entryFile, moduleName, path.join(currentRelativeDir, file), fileExtensions);
      } else {
        const firstDotPos = file.charAt(0) === '.' ? file.indexOf('.', 1) : file.indexOf('.');
        const baseName = firstDotPos > -1 ? file.substring(0, firstDotPos) : file;
        const extname = firstDotPos > -1 ? file.substring(firstDotPos) : '';

        const oldRelativePath = path.join(currentRelativeDir, file);
        const newRelativePath = path.join(currentRelativeDir, baseName + '.js');

        modules.push({
          ext: extname,
          oldRelativePath,
          newRelativePath,
          filePath,
          name: oldRelativePath === entryFile ? moduleName : baseName,
          isBuildFile: fileExtensions.includes(extname),
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
    const modules = this.getModules([], startAt, config.entryFile, config.moduleName, '', config.fileExtensions);

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
