import { Config } from './@types';

export const config: Config = {
  defaults: {
    src: './src',

    out: './build',

    entryFile: './index',

    /**
     * allowed file extensions
     */
    extensions: ['.js', '.ts', '.jsx', '.tsx'],

    /**
     * boolean indicating if the interop rollup setting should be enabled
     */
    interop: true,

    /**
     * boolean indicating if sourcemap should be generated, can be true, false, or 'inline'
     */
    sourcemap: true,

    /**
     * applies to umd and iife builds
     */
    globals: {},

    babelPlugins: [],

    babelPresets: [],

    exclude: [],

    include: [],

    plugins: [],
  },

  /**
   * cjs build config
   */
  cjs: {
    enabled: true,
    out: './build/cjs',
  },

  /**
   * es build config
   */
  es: {
    enabled: true,
    out: './build/es',
  },

  /**
   * iife build config, disabled by default
   */
  iife: {
    enabled: false,
    out: './build/iife',
    src: './src',

    // defines outputs
    outputs: [
      ['development', 'minified'],
      ['production', 'minified'],
    ],

    minifiedSuffix: 'min',
  },

  /**
   * umd build config, disabled by default
   */
  umd: {
    enabled: false,
    out: './build/umd',
    src: './src',

    // defines outputs
    outputs: [
      ['development', 'minified'],
      ['production', 'minified'],
    ],
    minifiedSuffix: 'min',
  },
};
