import * as path from 'path';
import * as fs from 'fs';
import { copy, isString, camelCase } from '@forensic-js/utils';
import {
  Config,
  UserConfig,
  CommonConfig,
  DistConfig,
  Module,
  CJSConfig,
  ESMConfig,
  ModuleFiles,
  GeneralConfig
} from '../@types';
import { config as defualtConfig } from '../config';
import { COMMON_CONFIGS, REGEX_FIELDS } from '../constants';
import { mkDirSync, getEntryPath } from '@forensic-js/node-utils';
import { rollup } from 'rollup';
import { getRollupPlugins } from './utils';
import chalk from 'chalk';

const allExternal = () => true;
const returnNull = () => null;

const log = console.log;

class Bundler {
  private entryPath: string = '';

  private config: Config = defualtConfig;

  private generalConfig: GeneralConfig = {};

  /**
   * @param plugins array of extra plugins to be applied
   * @param config path to user defined build config or the user defined config object
   */
  constructor(generalConfig: GeneralConfig = {}) {
    this.entryPath = getEntryPath();
    this.generalConfig = generalConfig;

    this.config = this.resolveConfig(
      this.entryPath,
      generalConfig.config ?? {}
    );
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

  private mergeConfig(
    prop: keyof CommonConfig,
    config: Config,
    target: CJSConfig | ESMConfig | DistConfig
  ) {
    const configValue = config[prop];
    const targetValue = target[prop];

    if (targetValue === undefined) {
      target[prop as string] = configValue;
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
  private resolveConfig(entryPath: string, config: UserConfig): Config {
    const packageFile = this.loadFile(entryPath, 'package.json');
    const resolvedConfig: Config = copy({}, defualtConfig, config as Config);

    //resolve module name
    resolvedConfig.moduleName =
      resolvedConfig.moduleName || camelCase(packageFile.name ?? 'Unknown');

    //resolve configs config
    COMMON_CONFIGS.forEach(prop => {
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.cjsConfig);
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.distConfig);
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.esmConfig);
    });

    /**
     * resolve regex fields
     */
    REGEX_FIELDS.forEach(field => {
      const values = resolvedConfig[field] as Array<string | RegExp>;
      resolvedConfig[field] = values.map(this.resolveRegex);
    });

    return resolvedConfig;
  }

  /**
   * copies the file from the src to the destination
   */
  private copyFile(src: string, filePath: string) {
    return new Promise((resolve, reject) => {
      const dest = path.resolve(this.entryPath, filePath);
      mkDirSync(dest);
      fs.copyFile(src, dest, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * parses all files into module targets
   * @param modules
   * @param resolvedPath
   * @param entryFile
   * @param moduleName
   * @param currentRelativeDir
   * @param extensions
   */
  private getModules(
    modules: Module[],
    resolvedPath: string,
    entryFile: string,
    moduleName: string,
    currentRelativeDir: string,
    extensions: string[]
  ): Promise<Module[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(resolvedPath, (err, files) => {
        if (err) {
          return reject(err);
        }

        const promises: Promise<any>[] = [];
        for (const file of files) {
          const filePath = path.join(resolvedPath, file);
          if (fs.statSync(filePath).isDirectory()) {
            promises.push(
              this.getModules(
                modules,
                filePath,
                entryFile,
                moduleName,
                path.join(currentRelativeDir, file),
                extensions
              )
            );
          } else {
            const firstDotPos =
              file.charAt(0) === '.' ? file.indexOf('.', 1) : file.indexOf('.');
            const baseName =
              firstDotPos > -1 ? file.substring(0, firstDotPos) : file;
            const extname = firstDotPos > -1 ? file.substring(firstDotPos) : '';

            const oldRelativePath = path.join(currentRelativeDir, file);
            const newRelativePath = path.join(
              currentRelativeDir,
              baseName + '.js'
            );

            modules.push({
              id: modules.length + 1,
              ext: extname,
              oldRelativePath,
              newRelativePath,
              filePath,
              name: oldRelativePath === entryFile ? moduleName : baseName,
              isBuildFile: extensions.includes(extname)
            });
          }
        }
        Promise.all(promises).then(() => resolve(modules));
      });
    });
  }

  private async getModulesFiles(): Promise<ModuleFiles> {
    const startAt = path.resolve(this.entryPath, this.config.srcDir);
    const config = this.config;

    const modules = await this.getModules(
      [],
      startAt,
      config.entryFile,
      config.moduleName,
      '',
      config.extensions
    );

    const result: ModuleFiles = {
      assetFiles: [],
      buildFiles: [],
      typeDefinitionFiles: []
    };

    let src = '';
    const regexMatches = regex => regex.test(src);

    for (const current of modules) {
      const { ext, isBuildFile, oldRelativePath } = current;
      const isTypeDefinitionFile = ext === '.d.ts';
      const isAssetFile = !isTypeDefinitionFile && !isBuildFile;

      src = oldRelativePath;
      if (isTypeDefinitionFile && config.cjsConfig.enabled) {
        result.typeDefinitionFiles.push(current);
      } else if (isAssetFile && config.assets.some(regexMatches)) {
        result.assetFiles.push(current);
      } else if (
        isBuildFile &&
        (config.include.length === 0 || config.include.some(regexMatches)) &&
        (config.exclude.length === 0 || !config.exclude.some(regexMatches))
      ) {
        result.buildFiles.push(current);
      }
    }
    return result;
  }

  handleWarnings(warning) {
    console.log(warning.message);
  }

  handleErrors(ex) {
    console.log(ex);
  }

  runBuild(
    promises: Promise<any>[],
    moduleFiles: ModuleFiles,
    config: DistConfig | CJSConfig | ESMConfig
  ) {
    const { assetFiles, typeDefinitionFiles, buildFiles } = moduleFiles;
    if (config.enabled) {
      log(chalk.yellow(`generating ${config.format} builds...\n`));

      const plugins = getRollupPlugins(
        this.config,
        this.generalConfig,
        config.format === 'esm'
      );
      const external =
        config.format === 'iife' || config.format === 'umd'
          ? config.externals
          : allExternal;
      buildFiles.forEach(({ filePath, newRelativePath, oldRelativePath }) => {
        promises.push(
          rollup({
            input: filePath,
            plugins,
            external
          }).then(bundler =>
            bundler
              .write({
                file: path.resolve(
                  this.entryPath,
                  config.outDir,
                  newRelativePath
                ),
                format: config.format,
                interop: config.interop,
                sourcemap: config.sourcemap
              })
              .then(returnNull)
          )
        );
      });

      assetFiles.forEach(assetFile => {
        promises.push(
          this.copyFile(
            assetFile.filePath,
            path.resolve(
              this.entryPath,
              config.outDir,
              assetFile.oldRelativePath
            )
          )
        );
      });

      typeDefinitionFiles.forEach(typeDefinitionFile => {
        promises.push(
          this.copyFile(
            typeDefinitionFile.filePath,
            path.resolve(
              this.entryPath,
              config.outDir,
              typeDefinitionFile.oldRelativePath
            )
          )
        );
      });
    }
  }

  /**
   * runs the process
   */
  async process() {
    let promises: Promise<any>[] = [];

    // assemble module files
    const moduleFiles = await this.getModulesFiles();

    this.runBuild(promises, moduleFiles, this.config.cjsConfig);
    this.runBuild(promises, moduleFiles, this.config.esmConfig);
    this.runBuild(promises, moduleFiles, this.config.distConfig);

    await Promise.all(promises);
  }
}

export { Bundler };
