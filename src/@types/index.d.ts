export declare interface CommonConfig {
  /**
   * boolean value indicating if build is enabled. default value is false
   */
  enabled?: boolean;

  /**
   * specifies build output directory. defaults to 'lib' for lib build but defaults to
   * 'dist' for distribution build
   */
  outDir?: string;

  /**
   * defines specific string of file patterns to process for the build
   */
  include?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to ignore for the build.
   * by default, type definition files are ignore
   */
  exclude?: (string | RegExp)[];

  /**
   * array of asset files to copy over during the build
   */
  assets?: (string | RegExp)[];

  /**
   * boolean indicating if generated output files should be uglified,
   * you must pass in an uglifier plugin if set to true
   */
  uglify?: boolean;

  /**
   * boolean indicating if the interop rollup setting should be enabled for the build
   */
  interop?: boolean;

  /**
   * boolean indicating if sourcemap files should be generated
   */
  sourcemap?: true | false | 'inline';

  /**
   * boolean value indicating if typescript type definition files should be copied over during the build. defaults to true
   */
  copyTypings?: boolean;

  /**
   * list of external modules for the specific build, by default, peer dependencie modules are auto included as externals for lib builds
   */
  externals?: string[];
}

export declare interface LibConfig extends CommonConfig {
  /**
   * build format to use. must be 'cjs'
   */
  format: 'cjs';
}

export declare interface DistConfig extends CommonConfig {
  /**
   * build format to use. defaults to 'iife'
   */
  format: 'iife' | 'umd';
}

export declare interface Config {
  /**
   * defines code src directory, defaults to 'src'
   */
  srcDir: string;

  /**
   * defaults to index.js
   */
  entryFile: string;

  /**
   * defaults to project package name camel-cased
   */
  moduleName: string;

  /**
   * allowed file extensions. defaults to .js, .ts
   */
  fileExtensions: string[];

  /**
   * defines specific string of file patterns to process for all builds
   */
  include: (string | RegExp)[];

  /**
   * defines specific string of file patterns to ignore for all builds.
   */
  exclude: (string | RegExp)[];

  /**
   * defines specific string of file patterns to copy over for all builds.
   */
  assets: (string | RegExp)[];

  /**
   * boolean indicating if generated output files should be uglified for all builds,
   * you must pass in an uglifier plugin if set to true
   */
  uglify: boolean;

  /**
   * boolean indicating if the interop rollup setting should be enabled for all builds
   */
  interop: boolean;

  /**
   * boolean indicating if sourcemap should be generated for all builds,
   * can be true, false, or 'inline'
   */
  sourcemap: true | false | 'inline';

  /**
   * rollup watch config, you must pass in the --watch command line argument for this to
   * work
   */
  watch: object;

  /**
   * rollup globals config
   */
  globals: object;

  /**
   * list of external modules for all builds
   */
  externals: string[];

  /**
   * defines config settings for generating distributed codes
   */
  distConfig: DistConfig;

  /**
   * defines config settings for generating lib files
   */
  libConfig: LibConfig;
}

declare interface UserDistConfig extends CommonConfig {
  /**
   * build format to use. defaults to 'iife'
   */
  format?: 'iife' | 'umd';
}

declare interface UserLibConfig extends CommonConfig {
  /**
   * build format to use. must be 'cjs'
   */
  format?: 'cjs';
}

export declare interface UserConfig {
  /**
   * defines code src directory, defaults to 'src'
   */
  srcDir?: string;

  /**
   * defaults to index.js
   */
  entryFile?: string;

  /**
   * defaults to project package.json name camel-cased
   */
  moduleName?: string;

  /**
   * allowed file extensions. defaults to .js, .ts
   */
  fileExtensions?: string[];

  /**
   * defines specific string of file patterns to process for all builds. defaults to everything
   */
  include?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to ignore for all builds. defaults to nothing
   */
  exclude?: (string | RegExp)[];

  /**
   * defines specific string of file patterns to copy over for all builds.
   */
  assets?: (string | RegExp)[];

  /**
   * boolean indicating if generated output files should be uglified for all builds,
   * you must pass in an uglifier plugin if set to true
   */
  uglify?: boolean;

  /**
   * boolean indicating if the interop rollup setting should be enabled for all builds
   */
  interop?: boolean;

  /**
   * boolean indicating if sourcemap should be generated for all builds,
   * can be true, false, or 'inline'
   */
  sourcemap?: true | false | 'inline';

  /**
   * rollup watch config, you must pass in the --watch command line argument for this to
   * work
   */
  watch?: object;

  /**
   * rollup globals config
   */
  globals?: object;

  /**
   * list of external modules for all builds
   */
  externals?: string[];

  /**
   * defines config settings for generating distributed codes.
   */
  distConfig?: UserDistConfig;

  /**
   * defines config settings for generating lib codes.
   */
  libConfig?: UserLibConfig;
}

export declare interface Module {
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

  ext: string;

  isBuildFile: boolean;
}

/**
 * build object export format
 */
type ExternalCallBack = (id: string, parent: string, isResolved: boolean) => boolean;

export declare interface Build {
  input: string;
  output: {
    file: string;
    format: string;
    name: string;
    interop: boolean;
    sourcemap: true | false | 'inline';
    globals: object;
  };
  plugins: object[];
  watch: object;
  external: string[] | ExternalCallBack;
}
