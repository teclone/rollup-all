# Rollup-all

## Overview

Rollup-all is a lightweight, extensive and configurable npm package for building all your ESNext source codes in one parse using [rollup.js](https://rollupjs.org/guide/en).

It enables you to generate separate project [lib and dist builds](https://stackoverflow.com/questions/39553079/difference-between-lib-and-dist-folders-when-packaging-library-using-webpack) using any of the supported [rollup.js build formats](https://rollupjs.org/guide/en#big-list-of-options).

It also allows you to configure the build process, letting you define what should be included and excluded in the build, if sourcemap should be generated, if minified or only minified versions of the build should be generated, and lots more.

These options are achieved when you create and place an optional [.buildrc.json](BUILDRC_CONFIG.md) in your project root diretory. You may even name it anything or place it in any other path, so long as you provide the file's relative path during the [api call](#getting_started).

## Getting Started

The api call is like shown below:

```javascript
rollupAll.getExports(uglifierPlugin, otherPlugins, configPath);
```

npm install it:

```bash
npm install --save-dev rollup-all
```

Modify `rollup.config.js` file as like shown below:

```javascript
/**
 * import all plugins. just a sample. your project may
 * not use all the plugins shown below
*/
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import uglifier from 'rollup-plugin-uglify';

/**
 * run all plugins and store results in an array.
 *  do not include the uglifier plugin here.
*/
let plugins = [
    resolve(),
    babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
    }),
    json(),
];

/**
 * if there is a custom build config file
 * you defined, and it is not named .buildrc.json
 * or placed in the root directory,
 * then specify the relative path here
*/
let configPath = '';

/**
 * call the api and export the result.
 * if you are not using any uglifier
 * pass in null as second paramter
*/
export default rollupAll.getExports(uglifier(), plugins, configPath);
```

## How It Works

Rollup-all uses an internal `.buildrc.json` file that defines default build configurations for your project. the full config options is as shown below:

```json
{
    "srcDir": "src",

    "mainModuleFileName": "main.js",

    "mainModuleName": "Module",

    "fileExtensions": [".js"],

    "externalModules": [],

    "exclude": [],

    "include": ["*"],

    "copyAssets": false,

    "uglify": false,

    "uglifyOnly": false,

    "interop": false,

    "sourcemap": true,

    "distConfig": {
        "disabled": false,
        "format": "iife",
        "outDir": "dist"
    },

    "libConfig": {
        "disabled": false,
        "format": "cjs",
        "outDir": "lib"
    }
}
```

## Working with Config Options

You can override these options by creating and placing a `.buildrc.json` file right in your project root directory. You can even name it any other thing or place it anywhere provided you supply the file's relative path as a third parameter during the [api call](#getting_started).

The following config options shown below can be defined specifically on the distConfig or libConfig section, hence, overriding their global counterpaths:

```json
{
    "exclude": [],

    "include": ["*"],

    "copyAssets": false,

    "uglify": false,

    "uglifyOnly": false,

    "interop": false,

    "sourcemap": true
}
```

### Specifying externalModules

To specify external modules that your project uses, and that should not be bundled into your build, such as node.js inbuilt packages, and other third party npm packages, we can do it like below:

```json
{
    "externalModules": ["fs", "path", "crypto", "lodash"]
}
```

### Disable a specific build

Not all projects are meant to be have dist builds, some projects are only done for the node.js environment, and such should have only a lib build. We can disable the dist build as shown below:

```json
{
    "distConfig": {
        "disabled": true
    }
}
```

### Copy Asset file during Build

We can copy asset files that our modules use when running the build process as shown below:

```json
{
    "copyAssets": true,
    "distConfig": {
        "copyAssets": false
    }
}
```

### Generate Minified Builds Too

We can also generate separate minified builds for all modules during the build process. Minified builds are named with `.min` format. We can even decide to generate only minified builds. You must pass in an [uglifier plugin](https://github.com/rollup/rollup/wiki/Plugins#output--prettifying) as first parameter to the API for this to work.

```json
{
    "uglify": true,
    "uglifyOnly": true,
    "distConfig": {
        "uglify": false,
        "uglifyOnly": false
    }
}
```

The config above uglifies `lib` builds but not `dist` builds.