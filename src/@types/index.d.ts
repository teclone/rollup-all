import { GlobalsOption, Plugin } from 'rollup';

export type BuildFormat = 'cjs' | 'es' | 'iife' | 'umd';

export type BuildEnvironment = 'development' | 'production' | 'uni';

export type Sourcemap = true | false | 'inline';

export interface FormatConfig {
  moduleName?: string;

  src?: string;

  out?: string;

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
   * babel presets
   */
  babelPresets?: any[];

  /**
   * babel plugins
   */
  babelPlugins?: any[];

  /**
   * defaults to index.ts
   */
  entryFile?: string;

  /**
   * rollup globals config
   */
  globals?: GlobalsOption;

  plugins?: Plugin[];

  /**
   * applies to distribution builds only
   * for iife and umd, two builds will be generated per file per environment,
   * first file is the non minified, the second is the minified version
   */
  outputs?: Array<[BuildEnvironment, 'minified' | 'unminified']>;

  /**
   * suffix to be added to minified outputs for iife and umd builds
   *
   * if set to false, there will be no suffix added
   */
  minifiedSuffix?: string | false;
}

export type Config = {
  /**
   * formats to build
   */
  formats?: Array<BuildFormat>;

  /**
   * if true, output logs are not logged
   */
  silent?: boolean;
} & Partial<{
  [p in BuildFormat | 'defaults']: FormatConfig;
}>;

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

  /**
   * boolean indicating if file is an asset file
   */
  isAssetFile: boolean;

  /**
   * boolean indicating if file is a type definition file
   */
  isTypeDefinitionFile?: boolean;
}

export interface ModuleFiles {
  buildFiles: Module[];
  copyFiles: Module[];
}
