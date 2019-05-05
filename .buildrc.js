module.exports = {
    /**
     * defines code src directory
     */
    srcDir: 'src',

    mainModuleFileName: 'index.ts',

    mainModuleName: 'RollupAll',

    /**
     * boolean value indicating if files that are not part of the listed allowed
     * fileExtensions and are not type definition files should be copied over
     */
    copyAssets: true,

    /**
     * boolean indicating if sourcemap should be generated, can be true, false, or 'inline'
     */
    sourcemap: true,

    /**
     * defines config settings for generating distributed codes. such as browser iife outputs
     */
    distConfig: {
        enabled: false
    },

    /**
     * defines config settings for generating lib codes. output format is cjs.
     */
    libConfig: {
        enabled: true
    }
}