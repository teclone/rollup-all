import { Config } from './@types';

export const config: Config = {
  defaults: {
    enabled: true,

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
     * minify
     */
    minify: true,

    globals: {},

    babelPlugins: [],

    babelPresets: [],

    exclude: [],

    include: [],

    plugins: [],
  },

  cjs: {
    enabled: true,
    out: './build/cjs',
  },

  es: {
    enabled: true,
    out: './build/es',
  },

  iife: {
    enabled: false,
    out: './build/iife',
  },

  umd: {
    enabled: false,
    out: './build/umd',
  },
};
