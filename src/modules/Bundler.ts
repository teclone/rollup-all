import * as path from "path";
import * as fs from "fs";
import { copy, isString, camelCase } from "@teclone/utils";
import {
  Config,
  CommonConfig,
  DistConfig,
  Module,
  CJSConfig,
  ESMConfig,
  ModuleFiles,
  GeneralConfig,
  BundlerOptions,
} from "../@types";
import { config as defaultConfig } from "../config";
import { COMMON_CONFIGS, REGEX_FIELDS } from "../constants";
import { mkDirSync, getEntryPath } from "@teclone/node-utils";
import { rollup } from "rollup";
import { getRollupPlugins } from "./utils";
import chalk from "chalk";
import globToRegex from "glob-to-regexp";

const allExternal = () => true;

const log = console.log;

class Bundler {
  private entryPath: string = "";

  private config: Config = defaultConfig;

  private generalConfig: GeneralConfig = {};

  private bundlerOptions: BundlerOptions;

  constructor(
    generalConfig: GeneralConfig = {},
    bundlerOptions: BundlerOptions
  ) {
    this.entryPath = getEntryPath();
    this.generalConfig = generalConfig;

    this.config = this.resolveConfig(
      this.entryPath,
      generalConfig.config ?? {}
    );

    this.bundlerOptions = bundlerOptions;
  }

  /**
   * resolves the pattern into a regex object
   *@param {Array|string|RegExp} patterns - array of patterns or string pattern
   *@param {Array} regexStore - array to store regex objects
   */
  private resolveRegex(pattern: string | RegExp) {
    if (isString(pattern)) {
      return globToRegex(pattern, {
        extended: true,
        globstar: true,
        flags: "i",
      });
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
  private resolveConfig(entryPath: string, config: Config): Config {
    const packageFile = this.loadFile(entryPath, "package.json");
    const resolvedConfig: Config = copy({}, defaultConfig, config as Config);

    //resolve module name
    resolvedConfig.moduleName =
      resolvedConfig.moduleName || camelCase(packageFile.name ?? "Unknown");

    //resolve configs config
    COMMON_CONFIGS.forEach((prop) => {
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.cjsConfig);
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.distConfig);
      this.mergeConfig(prop, resolvedConfig, resolvedConfig.esmConfig);
    });

    const { esmConfig, distConfig, cjsConfig } = resolvedConfig;

    /**
     * resolve regex fields
     */
    REGEX_FIELDS.forEach((field) => {
      esmConfig[field] = (resolvedConfig[field] as Array<string | RegExp>)
        .concat(esmConfig[field] || [])
        .map(this.resolveRegex);

      distConfig[field] = (resolvedConfig[field] as Array<string | RegExp>)
        .concat(distConfig[field] || [])
        .map(this.resolveRegex);

      cjsConfig[field] = (resolvedConfig[field] as Array<string | RegExp>)
        .concat(cjsConfig[field] || [])
        .map(this.resolveRegex);
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
      fs.copyFile(src, dest, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(null);
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
            const firstDotPos = file.startsWith(".")
              ? file.indexOf(".", 1)
              : file.indexOf(".");
            const baseName =
              firstDotPos > -1 ? file.substring(0, firstDotPos) : file;
            const extname = firstDotPos > -1 ? file.substring(firstDotPos) : "";

            const oldRelativePath = path.join(currentRelativeDir, file);
            const newRelativePath = path.join(
              currentRelativeDir,
              baseName + ".js"
            );

            modules.push({
              id: modules.length + 1,
              ext: extname,
              oldRelativePath,
              newRelativePath,
              filePath,
              name:
                oldRelativePath === entryFile
                  ? moduleName
                  : camelCase(baseName),
              isBuildFile: extensions.includes(extname),
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
  private filterFiles(
    modules: Module[],
    buildConfig: CJSConfig | ESMConfig | DistConfig
  ): ModuleFiles {
    const result: ModuleFiles = {
      assetFiles: [],
      buildFiles: [],
      typeDefinitionFiles: [],
    };

    let src = "";

    const regexMatches = (regex) => {
      return regex.test(path.join(src));
    };

    for (const current of modules) {
      const { ext, isBuildFile, oldRelativePath } = current;
      const isTypeDefinitionFile = ext === ".d.ts";
      const isAssetFile = !isTypeDefinitionFile && !isBuildFile;

      src = oldRelativePath;
      if (isTypeDefinitionFile) {
        result.typeDefinitionFiles.push(current);
      } else if (isAssetFile && buildConfig.assets.some(regexMatches)) {
        result.assetFiles.push(current);
      } else if (
        isBuildFile &&
        (buildConfig.include.length === 0 ||
          buildConfig.include.some(regexMatches)) &&
        (buildConfig.exclude.length === 0 ||
          !buildConfig.exclude.some(regexMatches))
      ) {
        result.buildFiles.push(current);
      }
    }
    return result;
  }

  /**
   * resolve output path, taking care of the base path
   * @param outdir
   * @param filePath
   * @param basePath
   * @returns
   */
  getOutputPath(outdir: string, filePath: string, basePath: string = "") {
    const resolvedBasePath =
      basePath.replace(/^\/+/, "").replace(/\/+$/, "") + "/";

    if (filePath.startsWith(resolvedBasePath)) {
      return path.resolve(
        this.entryPath,
        outdir,
        filePath.split(resolvedBasePath).slice(0).join("")
      );
    } else {
      return path.resolve(this.entryPath, outdir, filePath);
    }
  }

  /**
   * runs a specific build
   * @param modules
   * @param mainConfig
   * @param config
   */
  runBuild(
    modules: Module[],
    mainConfig: Config,
    config: DistConfig | CJSConfig | ESMConfig
  ) {
    const moduleFiles = this.filterFiles(modules, config);
    const promises: Array<Promise<any>> = [];
    const { assetFiles, typeDefinitionFiles, buildFiles } = moduleFiles;

    log(chalk.yellow(`generating ${config.format} builds...\n`));

    const plugins = getRollupPlugins(mainConfig, config, this.generalConfig);
    const externals =
      config.format === "iife" || config.format === "umd"
        ? config.externals
        : allExternal;

    const onError = (ex) => {
      console.error(ex?.message || ex);
    };

    buildFiles.forEach(
      ({ filePath, newRelativePath, oldRelativePath, name }) => {
        const out = this.getOutputPath(
          config.outDir,
          newRelativePath,
          config.basePath
        );
        promises.push(
          rollup({
            input: filePath,
            plugins,
            external: externals,
            onwarn: (warning, warn) => console.log(warning.message, filePath),
          })
            .then((bundler) =>
              bundler.write({
                file: out,
                format: config.format,
                interop: config.interop,
                sourcemap: config.sourcemap,
                name,
              })
            )
            .then(() => {
              if (this.bundlerOptions.generateOutputLogs) {
                log(chalk.green(`${oldRelativePath} ... ${out} \n`));
              }
              return null;
            })
            .catch(onError)
        );
      }
    );

    assetFiles.forEach((assetFile) => {
      const out = this.getOutputPath(
        config.outDir,
        assetFile.oldRelativePath,
        config.basePath
      );
      promises.push(this.copyFile(assetFile.filePath, out));
    });

    typeDefinitionFiles.forEach(({ oldRelativePath, filePath }) => {
      const out = this.getOutputPath(
        config.outDir,
        oldRelativePath,
        config.basePath
      );
      promises.push(this.copyFile(filePath, out));
    });

    return Promise.all(promises);
  }

  /**
   * runs the process
   */
  async process() {
    const config = this.config;
    const startAt = path.resolve(this.entryPath, config.srcDir);

    const modules = await this.getModules(
      [],
      startAt,
      config.entryFile,
      config.moduleName,
      "",
      config.extensions
    );

    //run cjs build
    if (config.cjsConfig.enabled) {
      await this.runBuild(modules, config, config.cjsConfig);
    }

    // run esm build
    if (config.esmConfig.enabled) {
      await this.runBuild(modules, config, config.esmConfig);
    }

    // run dist build
    if (config.distConfig.enabled) {
      await this.runBuild(modules, config, config.distConfig);
    }
  }
}

export { Bundler };
