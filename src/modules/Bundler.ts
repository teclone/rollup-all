import * as path from 'path';
import * as fs from 'fs';
import { ExternalOption } from 'rollup';
import {
  Config,
  Module,
  ModuleFiles,
  BuildEnvironment,
  BuildFormat,
  FormatConfig,
} from '../@types';
import { config as defaultConfig } from '../config';
import { rollup } from 'rollup';
import { getRollupPlugins } from './utils';
import chalk from 'chalk';
import globToRegex from 'glob-to-regexp';
import * as ts from 'typescript';
import { copy } from '../utils/copy';
import { camelCase } from '../utils/camelCase';
import { forEach } from '../utils/forEach';
import { formats } from '../constants';

const allExternal = () => true;

const log = console.log;

const resolveFormatConfig = (config: FormatConfig, entryPath: string) => {
  const resolveRegex = (pattern: string | RegExp) => {
    if (typeof pattern === 'string') {
      return globToRegex(pattern, {
        extended: true,
        globstar: true,
        flags: 'i',
      });
    } else {
      return pattern;
    }
  };

  config.src = path.resolve(entryPath, config.src);
  config.out = path.resolve(entryPath, config.out);
  config.entryFile = path.resolve(config.src, config.entryFile);

  config.include = (config.include || []).map(resolveRegex);
  config.exclude = (config.exclude || []).map(resolveRegex);

  return config;
};

class Bundler {
  private entryPath: string = '';

  private config: Config = defaultConfig;

  constructor(givenConfig: Config = {} as Config) {
    this.entryPath = process.cwd();

    const config = copy({}, defaultConfig, givenConfig) as Config;

    formats.forEach((format) => {
      config[format] = resolveFormatConfig(
        { ...config.defaults, ...config[format] },
        this.entryPath
      );
    });

    this.config = config;
  }

  /**
   * parses all files into module targets
   */
  private getModules(
    modules: Module[],
    config: FormatConfig,
    src: string,
    currentRelativeDir: string
  ): Promise<Module[]> {
    const ignore = new Set(['node_modules', '..', '.']);

    return new Promise((resolve, reject) => {
      fs.readdir(src, (err, files) => {
        if (err) {
          return reject(err);
        }

        const promises: Promise<any>[] = [];

        for (let i = 0; i < files.length; i++) {
          const fileName = files[i];

          if (ignore.has(fileName)) {
            continue;
          }

          const filePath = path.join(src, fileName);

          if (fs.statSync(filePath).isDirectory()) {
            promises.push(
              this.getModules(
                modules,
                config,
                filePath,
                path.join(currentRelativeDir, fileName)
              )
            );
          } else {
            let baseName = '';
            let extName = '';

            const fileNameSegments = fileName.split('.');

            const isTestFile =
              /\.(spec|test|stories|tests|specs|cy)\.[\w-_]+$/i.test(fileName);
            const isTypeDefinitionFile = fileName.endsWith('.d.ts');

            if (fileNameSegments.length > 1) {
              extName = '.' + fileNameSegments.pop();
            }
            baseName = fileNameSegments.join('.');

            const dirName = src;

            const filePathWithoutExtension = path.join(dirName, baseName);

            const isBuildFile =
              !isTypeDefinitionFile &&
              !isTestFile &&
              config.extensions.includes(extName);

            const isEntryFile =
              isBuildFile &&
              (config.entryFile === filePath ||
                config.entryFile === filePathWithoutExtension);

            const isAssetFile =
              !isTypeDefinitionFile && !isBuildFile && !isTestFile;

            modules.push({
              id: modules.length + 1,
              ext: extName,

              locationRelativeToSrc: currentRelativeDir,

              moduleName: isEntryFile ? config.moduleName : camelCase(baseName),

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
  private filterFiles(modules: Module[], config: FormatConfig): ModuleFiles {
    const result: ModuleFiles = {
      buildFiles: [],
      copyFiles: [],
    };

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
    fileModules: Module[],
    config: FormatConfig,
    opts: { format: BuildFormat; env?: BuildEnvironment; minify?: boolean }
  ) {
    const { silent } = this.config;
    const {
      interop,
      sourcemap,
      plugins: extraPlugins,
      extensions,
      babelPlugins = [],
      babelPresets = [],
      globals,
      out: outFolder,
    } = config;

    const { format, env, minify } = opts;

    let externals: ExternalOption = [];

    switch (format) {
      case 'cjs':
      case 'es':
        externals = allExternal;
        break;

      case 'iife':
      case 'umd':
        externals = Object.keys(globals || {});
        break;
    }

    const plugins = getRollupPlugins({
      extensions,
      format,
      minify,
      plugins: extraPlugins,
      babelPlugins,
      babelPresets,
    });

    log(
      chalk.gray(
        ['Generating', format, minify ? 'minified' : '', env, 'build...\n']
          .filter(Boolean)
          .join(' ')
      )
    );

    let envSuffix = '';
    switch (env) {
      case 'development':
        if (config.devBuildSuffix !== false) {
          envSuffix = config.devBuildSuffix ?? 'development';
        }
        break;

      case 'production':
        if (config.prodBuildSuffix !== false) {
          envSuffix = config.prodBuildSuffix ?? 'production';
        }
        break;
    }

    let minifySuffix = '';
    if (minify && config.minifiedSuffix !== false) {
      minifySuffix = config.minifiedSuffix ?? 'min';
    }

    return Promise.all(
      fileModules.map((fileModule) => {
        const oldRelativePath = path.join(
          fileModule.locationRelativeToSrc,
          fileModule.fileName
        );

        const newRelativePath = path.join(
          fileModule.locationRelativeToSrc,
          [fileModule.baseName, envSuffix, minifySuffix, 'js']
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
              globals: globals || {},
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
    fileModules: Module[],
    config: FormatConfig,
    format: BuildFormat
  ) {
    const processedTDFiles = new Set();

    const options = {
      declaration: true,
      emitDeclarationOnly: true,
    };

    log(chalk.gray(`Generating ${format} typescript definition files...\n`));

    // write to filesytem and index
    return new Promise((resolve, reject) => {
      const host = ts.createCompilerHost(options);

      host.writeFile = (filename: string, contents: string) => {
        const out = path.join(config.out, filename.split(config.src)[1]);
        processedTDFiles.add(out);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, contents);
      };

      const program = ts.createProgram(
        fileModules.map((current) => current.location),
        options,
        host
      );
      program.emit();
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
    const config = this.config;

    forEach(config.formats, async (format) => {
      const formatConfig = config[format];

      const modules = await this.getModules(
        [],
        formatConfig,
        formatConfig.src,
        ''
      );
      const { buildFiles, copyFiles } = this.filterFiles(modules, formatConfig);

      const outFolder = formatConfig.out;

      log(chalk.blueBright(`Starting asynchronous ${format} build...\n`));

      if (format === 'cjs' || format === 'es') {
        await Promise.all([
          this.copyFiles(outFolder, copyFiles, format),
          this.buildFiles(buildFiles, formatConfig, {
            format,
            minify: false,
          }),
          this.buildTypeDefinitionFiles(buildFiles, formatConfig, format),
        ]);
        return;
      }

      const outputs = formatConfig.outputs ?? [
        ['development', 'minified'],
        ['production', 'minified'],
      ];

      for (const [env, minifyOption] of outputs) {
        process.env.NODE_ENV = env;
        await Promise.all([
          this.copyFiles(outFolder, copyFiles, format),
          this.buildFiles(buildFiles, formatConfig, {
            format,
            env,
            minify: minifyOption === 'minified',
          }),
          this.buildTypeDefinitionFiles(buildFiles, formatConfig, format),
        ]);
      }
    });
  }
}

export { Bundler };
