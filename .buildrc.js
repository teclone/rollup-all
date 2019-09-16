module.exports = {
  /**
   * defines code src directory
   */
  srcDir: 'src',

  entryFile: 'index.ts',

  /**
   * boolean indicating if sourcemap should be generated, can be true, false, or 'inline'
   */
  sourcemap: true,

  externals: ['fs', 'path'],

  /**
   * defines config settings for generating distributed codes. such as browser iife outputs
   */
  distConfig: {
    enabled: false,
  },

  /**
   * defines config settings for generating lib codes. output format is cjs.
   */
  libConfig: {
    enabled: true,
  },
};
