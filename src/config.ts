import { Config } from './@types';

export const config: Config = {
  formats: ['cjs', 'es'],

  src: 'src',

  out: './build',

  plugins: [],

  entryFile: 'index',

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
   * boolean indicating if the interop rollup setting should be enabled
   */
  interop: true,

  /**
   * boolean indicating if sourcemap should be generated, can be true, false, or 'inline'
   */
  sourcemap: true,

  /**
   * minify
   */
  minify: true,

  /**
   * rollup watch config, you must pass in the --watch command line argument for this to
   * work
   */
  watch: {},

  /**
   * rollup globals config, applies to dist builds
   */
  globals: {},

  envs: ['development', 'production'],
};
