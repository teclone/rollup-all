import { Config } from './@types';
export const config: Config = {
  plugins: [],

  srcDir: 'src',

  entryFile: 'index.js',

  moduleName: '',

  /**
   * allowed file extensions
   */
  extensions: ['.js', '.ts', '.jsx', '.tsx'],

  /**
   * defines string of file patterns to process
   */
  include: [],

  /**
   * defines string of file patterns to ignore. by default, type definition files are ignore
   */
  exclude: [],

  /**
   * list of asset files to copy over
   */
  assets: ['assets/**'],

  /**
   * boolean indicating if the interop rollup setting should be enabled
   */
  interop: true,

  /**
   * boolean indicating if sourcemap should be generated, can be true, false, or 'inline'
   */
  sourcemap: true,

  /**
   * boolean indicating if rollup plugin terser should be applied to the build, when in production mode
   * default to false
   */
  uglify: false,

  /**
   * rollup watch config, you must pass in the --watch command line argument for this to
   * work
   */
  watch: {},

  /**
   * rollup globals config
   */
  globals: {},

  /**
   * defines config settings for generating lib codes. output format is cjs.
   */
  cjsConfig: {
    /**
     * defines if lib is enabled
     */
    enabled: true,

    /**
     * defines output directory
     */
    outDir: 'build',

    format: 'cjs'
  },

  /**
   * defines config settings for generating esm codes. output format is esm.
   */
  esmConfig: {
    /**
     * defines if esm module is enabled
     */
    enabled: true,

    /**
     * defines output directory
     */
    outDir: 'build/esm',

    format: 'esm'
  },

  /**
   * defines config settings for generating distributed codes. such as browser iife outputs
   */
  distConfig: {
    /**
     * defines if dist is enabled
     */
    enabled: false,

    /**
     * defines output directory
     */
    outDir: 'build/dist',

    /**
     * build format to use.
     */
    format: 'iife',

    externals: []
  }
};
