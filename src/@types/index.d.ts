export declare interface CommonConfig {

    /**
     * boolean value indicating if build is enabled. default value is true for lib build
     * but false for dist build
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
    include?: (string|RegExp)[];

    /**
     * defines specific string of file patterns to ignore for the build.
     * by default, type definition files are ignore
     */
    exclude?: (string|RegExp)[];

    /**
     * boolean value indicating if files that are not part of the listed allowed
     * fileExtensions and are not type definition files should be copied over for the build
     */
    copyAssets?: boolean;

    /**
     * boolean indicating if generated output files should be uglified for the build,
     * you must pass in an uglifier plugin if set to true
     */
    uglify?: boolean;

    /**
     * boolean indicating if the interop rollup setting should be enabled for the build
     */
    interop?: boolean;

    /**
     * boolean indicating if sourcemap should be generated for the build,
     * can be true, false, or 'inline'
     */
    sourcemap?: true | false | 'inline';

    /**
     * boolean value indicating if typescript type definition files should be copied to the
     * specified typings directory. defaults to true
     */
    copyTypings?: boolean;

    /**
     * defines folder to copy all type definition files to, if the copy typings option
     * is set to true. defaults to 'lib/typings' for lib build and 'dist/typings' for dist build
     */
    typingsDir?: string;
}

export declare interface LibConfig extends CommonConfig {
    /**
     * boolean indicating if lib builds should be generated
     */
    enabled: boolean,

    /**
     * build format to use. must be 'cjs'
     */
    format: 'cjs';

    /**
     * specifies build output directory. defaults to 'lib'
     */
    outDir: string;

    /**
     * boolean value indicating if typescript type definition files should be copied to the
     * specified typings directory
     */
    copyTypings: boolean;

    /**
     * defines folder to copy all type definition files to, if the copy typings option
     * is set to true
     */
    typingsDir: string;
}

export declare interface DistConfig extends CommonConfig {
    /**
     * boolean indicating if distribution builds should be generated
     */
    enabled: boolean,

    /**
     * build format to use. defaults to 'iife'
     */
    format: 'iife' | 'umd';

    /**
     * specifies build output directory. defaults to 'dist'
     */
    outDir: string;

    /**
     * boolean value indicating if typescript type definition files should be copied to the
     * specified typings directory
     */
    copyTypings: boolean;

    /**
     * defines folder to copy all type definition files to, if the copy typings option
     * is set to true
     */
    typingsDir: string;
}

export declare interface Config {
    /**
     * defines code src directory, defaults to 'src'
     */
    srcDir: string;

    mainModuleFileName: string;

    mainModuleName: string;

    /**
     * allowed file extensions
     */
    fileExtensions: string[];

    /**
     * defines specifie string of file patterns to process for all builds
     */
    include: (string|RegExp)[];

    /**
     * defines specific string of file patterns to ignore for all builds.
     * by default, type definition files are ignore
     */
    exclude: (string|RegExp)[];

    /**
     * boolean value indicating if files that are not part of the listed allowed
     * fileExtensions and are not type definition files should be copied over for all builds
     */
    copyAssets: boolean;

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
     * defines config settings for generating distributed codes. such as browser iife outputs
     */
    distConfig: DistConfig;

    /**
     * defines config settings for generating lib codes. output format is cjs.
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

export declare interface UserConfig extends CommonConfig {
    /**
     * defines code src directory, defaults to 'src'
     */
    srcDir?: string;

    mainModuleFileName?: string;

    mainModuleName?: string;

    /**
     * allowed file extensions
     */
    fileExtensions?: string[];

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
     * defines config settings for generating distributed codes. such as browser iife outputs
     */
    distConfig?: UserDistConfig;

    /**
     * defines config settings for generating lib codes. output format is cjs.
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
     * boolean indicating if file is an asset file
     */
    isAsset: boolean;

    /**
     * boolean indicating if file is a type definition file
     */
    isTypeDefinitionFile: boolean;

    /**
     * file absolute path
     */
    filePath: string;

    /**
     * file module name
     */
    name: string;
}

export declare interface Build {
    input: string;
    output: {
        file: string;
        format: string;
        name: string;
        interop: boolean;
        sourcemap: true | false | 'inline';
        globals: object;
    },
    plugins: object[];
    watch: object;
    external: () => boolean;
}