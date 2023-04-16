import { GlobalsOption, Plugin } from 'rollup';

export type BuildFormat = 'cjs' | 'esm' | 'iife' | 'umd';

export type BuildEnvironment = 'development' | 'production' | 'uni';

export type Sourcemap = true | false | 'inline';

export interface Config {
  formats: BuildFormat[];

  /**
   * if true, output logs are not logged
   */
  silent?: boolean;

  /**
   * the code src directory to be used, if not, it uses the globally defined src
   */
  src?: string;

  /**
   * out folder
   */
  out?: string;

  /**
   * plugins to apply
   */
  plugins?: Plugin[];

  /**
   * defaults to index.js
   */
  entryFile?: string;

  /**
   * defaults to project package name pascal-cased
   */
  moduleName?: string;

  /**
   * allowed file extensions. defaults to .js, .ts, .jsx, .tsx
   */
  extensions?: string[];

  /**
   * defines file patterns to process for all builds
   */
  include?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to exclude for all builds.
   * excluded files are treated as assets
   */
  exclude?: (string | RegExp)[];

  /**
   * boolean indicating if the interop rollup setting should be enabled for all builds
   */
  interop?: boolean;

  /**
   * boolean indicating if sourcemap should be generated for all builds,
   * can be true, false, or 'inline', defaults to true
   */
  sourcemap?: true | false | 'inline';

  /**
   * indicates if minified build should be generated,
   * applies to dist builds only
   */
  minify?: boolean;

  /**
   * rollup watch config
   */
  watch?: object;

  /**
   * rollup globals config
   */
  globals?: GlobalsOption;

  /**
   * applies to dist builds
   */
  envs?: BuildEnvironment[];

  /**
   * babel presets
   */
  babelPresets?: any[];

  /**
   * babel plugins
   */
  babelPlugins?: any[];
}

export interface Module {
  // id for indexing this file
  id: number;

  /**
   * directory location of file relative to src
   */
  locationRelativeToSrc: string;

  /**
   * file absolute location
   */
  location: string;

  /**
   * file base name
   */
  baseName: string;

  // file name
  fileName: string;

  /**
   * file module name
   */
  moduleName: string;

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
  buildFiles: Module[];
  copyFiles: Module[];
}
