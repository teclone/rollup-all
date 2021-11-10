import { Plugin } from "rollup";

export interface CommonConfig {
  /**
   * boolean value indicating if build is enabled. default value is false
   */
  enabled?: boolean;

  /**
   * specifies build output directory. defaults to 'cjs', 'dist' and 'esm' for the specific builds
   */
  outDir?: string;

  /**
   * base path is used to specifies path that should be dropped from the output path
   */
  basePath?: string;

  /**
   * defines specific string of file patterns to process for the build
   */
  include?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to ignore for the build.
   */
  exclude?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to copy over for the builds.
   */
  assets?: (string | RegExp)[];

  /**
   * boolean indicating if rollup plugin terser should be applied to the build, when in production mode
   * default to false
   */
  uglify?: boolean;

  /**
   * boolean indicating if the interop rollup setting should be enabled for the build
   */
  interop?: boolean;

  /**
   * boolean indicating if sourcemap files should be generated
   */
  sourcemap?: true | false | "inline";
}

export interface CJSConfig extends CommonConfig {
  /**
   * build format to use. must be 'cjs'
   */
  format?: "cjs";
}

export interface ESMConfig extends CommonConfig {
  /**
   * build format to use. must be 'esm'
   */
  format?: "esm";
}

export interface DistConfig extends CommonConfig {
  /**
   * build format to use. defaults to 'iife'
   */
  format?: "iife" | "umd";

  /**
   * list of modules to regard as external, defaults to empty array
   */
  externals: string[];
}

export interface Config {
  /**
   * plugins to apply
   */
  plugins?: Plugin[];

  /**
   * defines code src directory, defaults to 'src'
   */
  srcDir?: string;

  /**
   * defaults to index.js
   */
  entryFile?: string;

  /**
   * defaults to project package name camel-cased
   */
  moduleName?: string;

  /**
   * allowed file extensions. defaults to .js, .ts, .jsx, .tsx
   */
  extensions?: string[];

  /**
   * defines specific string of file patterns to process for all builds
   */
  include?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to ignore for all builds.
   */
  exclude?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to copy over for all builds.
   */
  assets?: (string | RegExp)[];

  /**
   * boolean indicating if the interop rollup setting should be enabled for all builds
   */
  interop?: boolean;

  /**
   * boolean indicating if sourcemap should be generated for all builds,
   * can be true, false, or 'inline', defaults to true
   */
  sourcemap?: true | false | "inline";

  /**
   * boolean indicating if rollup plugin terser should be applied to the build, when in production mode
   * default to false
   */
  uglify?: boolean;

  /**
   * rollup watch config
   */
  watch?: object;

  /**
   * rollup globals config
   */
  globals?: object;

  /**
   * defines config settings for generating distributed browser codes
   */
  distConfig?: DistConfig;

  /**
   * defines config settings for generating cjs files, for node js or comonjs modules
   */
  cjsConfig?: CJSConfig;

  /**
   * defines config settings for generating esm files, es modules
   */
  esmConfig?: ESMConfig;
}

export interface Module {
  // id for indexing this file
  id: number;

  /**
   * module old relative path, as it is relative to the src directory
   */
  oldRelativePath: string;

  /**
   * module new relative path, the difference is that the module file extension is now .js
   */
  newRelativePath: string;

  /**
   * file absolute path
   */
  filePath: string;

  /**
   * file module name
   */
  name: string;

  /**
   * file extension
   */
  ext: string;

  /**
   * boolean indicating if file is a build file
   */
  isBuildFile: boolean;
}

export interface ModuleFiles {
  assetFiles: Module[];
  buildFiles: Module[];
  typeDefinitionFiles: Module[];
}

export interface BabelPresetsConfig {
  presets?: any[];
  exclude?: Array<string | RegExp>;
  include?: Array<string | RegExp>;
}

export interface BabelPluginsConfig {
  plugins?: any[];
}

export interface GeneralConfig {
  config?: Config;
  babelConfig?: {
    presetsConfig?: BabelPresetsConfig;
    pluginsConfig?: BabelPluginsConfig;
  };
}

export interface BundlerOptions {
  generateOutputLogs: boolean;
}
