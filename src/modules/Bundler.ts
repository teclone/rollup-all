import * as path from 'path';
import * as fs from 'fs';
import { ExternalOption } from 'rollup';
import {
  Config,
  Module,
  ModuleFiles,
  BuildEnvironment,
  BuildFormat,
} from '../@types';
import { config as defaultConfig } from '../config';
import { rollup } from 'rollup';
import { getRollupPlugins } from './utils';
import chalk from 'chalk';
import globToRegex from 'glob-to-regexp';
import * as ts from 'typescript';
import { copy } from '../utils/copy';
import { camelCase } from '../utils/camelCase';
import { rimrafSync } from 'rimraf';
import { forEach } from '../utils/forEach';
import { BASE_ASSET_EXTENSIONS } from '../constants';

const allExternal = () => true;

const log = console.log;

class Bundler {
  private entryPath: string = '';

  private config: Config = defaultConfig;

  private src: string;
  private out: string;

  private entryFile: string;

  constructor(givenConfig: Config = {} as Config) {
    this.entryPath = process.cwd();

    const config = copy({}, defaultConfig, givenConfig);
    config.assetExtensions = BASE_ASSET_EXTENSIONS.concat(
      config.assetExtensions || []
    ).map((ext) => ext.toLowerCase());

    // resolve entry file
    config.src = path.resolve(this.entryPath, config.src);
    config.entryFile = path.resolve(config.src, config.entryFile);

    // resolve includes and excludes
    config.include = (config.include || []).map(this.resolveRegex);

    config.exclude = (config.exclude || []).map(this.resolveRegex);

    this.src = config.src;
    this.out = path.resolve(this.entryPath, config.out);

    this.entryFile = config.entryFile;

    this.config = config;
  }

  /**
   * resolves the pattern into a regex object
   *@param {Array|string|RegExp} patterns - array of patterns or string pattern
   *@param {Array} regexStore - array to store regex objects
   */
  private resolveRegex(pattern: string | RegExp) {
    if (typeof pattern === 'string') {
      return globToRegex(pattern, {
        extended: true,
        globstar: true,
        flags: 'i',
      });
    } else {
      return pattern;
    }
  }

  /**
   * parses all files into module targets
   */
  private getModules(
    modules: Module[],
    resolvedPath: string,
    currentRelativeDir: string
  ): Promise<Module[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(resolvedPath, (err, files) => {
        if (err) {
          return reject(err);
        }

        const promises: Promise<any>[] = [];

        for (let i = 0; i < files.length; i++) {
          const fileName = files[i];
          if (fileName.startsWith('.') || ['node_modules'].includes(fileName)) {
            continue;
          }

          const filePath = path.join(resolvedPath, fileName);

          if (fs.statSync(filePath).isDirectory()) {
            promises.push(
              this.getModules(
                modules,
                filePath,
                path.join(currentRelativeDir, fileName)
              )
            );
          } else {
            let baseName = '';
            let extName = '';

            const fileNameSegments = fileName.split('.');
            baseName = fileNameSegments[0];

            if (fileNameSegments.length > 1) {
              extName = '.' + fileNameSegments.slice(1).join('.').toLowerCase();
            }

            const dirName = resolvedPath;

            const isTypeDefinitionFile = extName === '.d.ts';

            const filePathWithoutExtension = path.join(dirName, baseName);

            const isBuildFile =
              !isTypeDefinitionFile && this.config.extensions.includes(extName);

            const isEntryFile =
              isBuildFile &&
              (this.entryFile === filePath ||
                this.entryFile === filePathWithoutExtension);

            const isAssetFile =
              !isTypeDefinitionFile &&
              !isBuildFile &&
              this.config.assetExtensions.includes(extName);

            modules.push({
              id: modules.length + 1,
              ext: extName,

              locationRelativeToSrc: currentRelativeDir,

              moduleName: isEntryFile
                ? this.config.moduleName
                : camelCase(baseName),

              isBuildFile,
              isAssetFile,
              isTypeDefinitionFile,
              baseName,
              fileName,
              location: filePath,
            });
          }
        }
        Promise.all(promises).then(() => resolve(modules));
      });
    });
  }

  /**
   * assembles files for the current build
   * @param config
   * @param buildConfig
   */
  private filterFiles(modules: Module[]): ModuleFiles {
    const result: ModuleFiles = {
      buildFiles: [],
      copyFiles: [],
    };

    const { config } = this;

    for (let i = 0; i < modules.length; i++) {
      const current = modules[i];

      // if file is excluded, return
      const oldRelativePath = path.join(
        current.locationRelativeToSrc,
        current.fileName
      );

      if (
        config.exclude.length &&
        config.exclude.some((regex: RegExp) => regex.test(oldRelativePath))
      ) {
        continue;
      }

      // if file is not included in the list of included, return
      if (
        config.include.length &&
        !config.include.some((regex: RegExp) => regex.test(oldRelativePath))
      ) {
        continue;
      }

      if (current.isBuildFile) {
        result.buildFiles.push(current);
      } else if (current.isAssetFile || current.isTypeDefinitionFile) {
        result.copyFiles.push(current);
      }
    }
    return result;
  }

  /**
   * build files for a given format
   */
  private buildFiles(
    outFolder: string,
    fileModules: Module[],
    opts: { format: BuildFormat; env: BuildEnvironment; minify?: boolean }
  ) {
    const {
      interop,
      sourcemap,
      plugins: extraPlugins,
      extensions,
      silent,

      babelPlugins = [],
      babelPresets = [],
    } = this.config;

    const { format, env, minify } = opts;

    let externals: ExternalOption = [];

    switch (format) {
      case 'cjs':
      case 'es':
        externals = allExternal;
        break;

      case 'iife':
      case 'umd':
        externals = Object.keys(this.config.globals);
        break;
    }

    const plugins = getRollupPlugins({
      extensions,
      format,
      minify,
      env,
      plugins: extraPlugins,

      babelPlugins,
      babelPresets,
    });

    const envPrefix = env !== 'uni' ? env : '';
    log(
      chalk.gray(
        [
          'Generating',
          format,
          minify ? 'minified' : '',
          envPrefix,
          'build...\n',
        ]
          .filter(Boolean)
          .join(' ')
      )
    );

    return Promise.all(
      fileModules.map((fileModule) => {
        const oldRelativePath = path.join(
          fileModule.locationRelativeToSrc,
          fileModule.fileName
        );

        const newRelativePath = path.join(
          fileModule.locationRelativeToSrc,
          [fileModule.baseName, envPrefix, minify ? 'min' : '', 'js']
            .filter(Boolean)
            .join('.')
        );

        const out = path.join(outFolder, newRelativePath);

        return rollup({
          input: fileModule.location,
          plugins,
          external: externals,

          onwarn: (warning, warn) =>
            console.warn(warning.message, fileModule.location),
        })
          .then((bundler) => {
            bundler.write({
              file: out,
              format,
              interop,
              sourcemap,
              exports: 'auto',
              globals: this.config.globals,
              name: fileModule.moduleName,
              inlineDynamicImports: format === 'iife' || format === 'umd',
            });
          })
          .then(() => {
            if (!silent) {
              log(chalk.green(`${oldRelativePath} >> ${out}\n`));
            }
            return null;
          });
      })
    );
  }

  /**
   * builds typescript definition file
   * @param outFolder
   * @param fileModules
   * @returns
   */
  private buildTypeDefinitionFiles(
    outFolder: string,
    fileModules: Module[],
    format: BuildFormat
  ) {
    const processedTDFiles = new Set();

    log(chalk.gray(`Generating ${format} typescript definition files...\n`));

    return new Promise((resolve, reject) => {
      let rejected = false;

      // run with try catch block
      const run = (callback) => {
        try {
          callback();
        } catch (ex) {
          rejected = true;
          reject(ex);
        }
      };

      // write to filesytem and index
      const onEmit = (filename, content) =>
        run(() => {
          const out = path.join(outFolder, filename.split(this.src)[1]);
          processedTDFiles.add(out);
          fs.mkdirSync(path.dirname(out), { recursive: true });
          fs.writeFileSync(out, content);
        });

      for (let i = 0; i < fileModules.length; i++) {
        const fileModule = fileModules[i];
        if (rejected) {
          break;
        }

        const tsdOut = path.join(
          outFolder,
          fileModule.locationRelativeToSrc,
          fileModule.baseName + '.d.ts'
        );

        if (processedTDFiles.has(tsdOut)) {
          continue;
        }

        run(() => {
          const program = ts.createProgram([fileModule.location], {
            declaration: true,
            emitDeclarationOnly: true,
          });

          program.emit(undefined, onEmit, undefined, true);
        });
      }

      resolve(true);
    });
  }

  /**
   * copies the file from the src to the destination
   */
  private copyFiles(
    outFolder: string,
    fileModules: Module[],
    format: BuildFormat
  ) {
    log(chalk.gray(`Copying ${format} asset files to ${outFolder}...\n`));
    return Promise.all(
      fileModules.map((fileModule) => {
        const dest = path.resolve(
          outFolder,
          fileModule.locationRelativeToSrc,
          fileModule.fileName
        );

        return new Promise((resolve, reject) => {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFile(fileModule.location, dest, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(null);
            }
          });
        });
      })
    );
  }

  /**
   * runs the process
   */
  async process() {
    const { formats, envs, minify } = this.config;

    const modules = await this.getModules([], this.src, '');

    const { buildFiles, copyFiles } = this.filterFiles(modules);

    forEach(formats, async (format) => {
      const outFolder = path.join(this.out, format);

      log(chalk.blueBright(`Starting asynchronous ${format} build...\n`));

      // remove build out folder
      rimrafSync(outFolder);

      if (format === 'cjs' || format === 'es') {
        await Promise.all([
          this.copyFiles(outFolder, copyFiles, format),
          this.buildFiles(outFolder, buildFiles, {
            format,
            env: 'uni',
            minify: false,
          }),
          this.buildTypeDefinitionFiles(outFolder, buildFiles, format),
        ]);
        return;
      }

      await forEach(envs, async (env) => {
        process.env.NODE_ENV = env;
        await this.buildFiles(outFolder, buildFiles, {
          format,
          env,
          minify: false,
        });

        if (minify) {
          await this.buildFiles(outFolder, buildFiles, {
            format,
            env,
            minify: true,
          });
        }
      });
    });
  }
}

export { Bundler };
