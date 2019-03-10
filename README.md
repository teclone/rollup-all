# Rollup-all

[![Build Status](https://travis-ci.org/harrison-ifeanyichukwu/rollup-all.svg?branch=master)](https://travis-ci.org/harrison-ifeanyichukwu/rollup-all)
[![Coverage Status](https://coveralls.io/repos/github/harrison-ifeanyichukwu/rollup-all/badge.svg?branch=master)](https://coveralls.io/github/harrison-ifeanyichukwu/rollup-all?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/rollup-all.svg)](https://badge.fury.io/js/rollup-all)
![npm](https://img.shields.io/npm/dt/rollup-all.svg)

## Overview

Rollup-all is a lightweight, extensive and configurable npm package for building all your shiny new JavaScript Library source codes in one parse using [rollup.js](https://rollupjs.org/guide/en).

It enables you to generate separate project [lib and dist builds](https://stackoverflow.com/questions/39553079/difference-between-lib-and-dist-folders-when-packaging-library-using-webpack) using any of the supported [rollup.js build formats](https://rollupjs.org/guide/en#big-list-of-options) including support for minification.

It allows you to configure the build process, letting you define what should be included and excluded in the build, if sourcemap should be generated, if minified versions of the build should be generated, if asset files should be copied over, and lots more...

## What's New

The latest version of this project can copy asset files to any deep length.

The latest version also checks for `process.env.NODE_ENV`, and will minify build if running in production environment, ignoring config settings.

**Minified files no longer has .min extension attached, that is to say, there is no separate file created for a minified build anymore. We decided to just generate one output file, to keep things consistent.**

## Getting Started

The api call is like shown below:

```javascript
rollupAll.getExports(uglifierPlugin, otherPlugins, configPath);
```

npm install it:

```bash
npm install --save-dev rollup-all
```

To start using the module, you have to modify your project's [rollup.js config file](https://rollupjs.org/guide/en#using-config-files) (`rollup.config.js` or any name you gave it) as like shown below, calling the api:

```javascript
/**
 * import all plugins. just a sample. your project may
 * not use all the plugins shown below
*/
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import {uglify} from 'rollup-plugin-uglify';

import rollupAll from 'rollup-all';

/**
 * run all plugins and store results in an array.
 *  do not include the uglifier plugin here.
*/
const plugins = [
    resolve(),
    babel({
        exclude: 'node_modules/**'
    })
];

/**
 * if there is a custom build config file
 * you defined, and it is not named .buildrc.json
 * or placed in the root directory,
 * then specify the relative path here
*/
const configPath = '';

/**
 * call the api and export the result.
 * if you are not using any uglifier
 * pass in null as second paramter
*/
export default rollupAll.getExports(uglify(), plugins, configPath);
```

> **Note**: if you are not using any [uglifier](https://github.com/rollup/rollup/wiki/Plugins#output--prettifying) plugin, pass in `null` as the first parameter. Note also that you must execute all plugins before passing it to the api call.

## How It Works

Rollup-all uses an internal `.buildrc.json` file that defines default build configurations for your project. the full config options is as shown below:

```json
{
    "srcDir": "src",

    "mainModuleFileName": "index.js",

    "mainModuleName": "Module",

    "fileExtensions": [".js"],

    "exclude": [],

    "include": ["*"],

    "copyAssets": false,

    "uglify": false,

    "interop": false,

    "sourcemap": true,

    "watch": {},

    "globals": {},

    "distConfig": {
        "enabled": false,
        "format": "iife",
        "outDir": "dist"
    },

    "libConfig": {
        "enabled": false,
        "format": "cjs",
        "outDir": "lib"
    }
}
```

You can override these options by creating and placing a `.buildrc.json` file in your project's root directory. You can even name it any other thing or place it anywhere provided you supply the file's relative path as a third parameter during the [api call](#getting-started).

## Working with Config Options

The config options has three sections:

1. Global config options

2. Dist specific build options

3. Lib specific build options

These makes it easy to similar build options in the global section and different build options that are specific for each build kind.

### Config Options Explained

> Options with ending asterisks can be defined locally on the `distConfig` and `libConfig` sections.

- **srcDir**: defines the relative path to your project's source folder. Defaults to `src`.

- **mainModuleFileName**: defines the projects main file name such as `index.js`, `main.js`, `entry.js`. Defaults to `index.js`.

- **mainModuleName**: defines the globally exposed module name. this applies specifically to projects that has `iife` dist builds. e.g, `JQuery` for jquery, `React` for react, `FJS` for forensic-js, etc.

- **fileExtensions**: defines an array of project src code file extensions, such as `.jsx`, `.js` , `.ts`, `.tsx`, etc. Defaults to `[".js"]`. Every other file within the src directory are regarded as asset files.

- **exclude***: defines a list of modules to exclude from the build. This option can be defined specifically for a particular build as well. entries can be strings or regex. e.g `"src/modules/*.js"` ignores every .js file in the modules directory. `"src/**/*.js"` ignores all .js files in the src directory. `"*"` ignores all files. It defaults to an empty array.

- **include***: defines a list of modules to include in the build. This option can be defined specifically for a particular build as well. entries can be strings or regex. Defaults to `["*"]`, which includes everything.

- **copyAssets***: defines if asset files should be copied over during the build process. Asset files are files whose extensions are not part of the **fileExtensions** entry options.

- **uglify***: defines if the build should be minified. **when running in production environment, this value is automatically set to true**. When set to true, you should also supply an uglifier plugin for it to work. It ignores the option if no uglifier plugin is supplied. Default value is `false`.

- **interop***: defines if the `rollup.js` interop functionality should be enabled. Defuaults to `false`.

- **sourcemap***: defines if the build should produce source maps. value can be `true`, `"inline"` or `false`. Default value is `true` which causes source map files to be generated.

- **globals***: as per [rollup.js](https://rollupjs.org/guide/en#output-globals-g-globals) docs, this is an object of `id: name` pairs, used for `umd/iife` builds. Defaults to empty object `{}`

- **watch***: as per [rollup.js](https://rollupjs.org/guide/en#watch-options) docs, this option only takes effect when running Rollup with the --watch flag.

- **distConfig.outDir** - defines the output directory for your `dist` build. Defaults to `"dist"`.

- **distConfig.enabled** - defines if the disttribution build is enabled. Defaults to `false`.

- **distConfig.format** - defines the build format for the distributed code. Defaults to `"iife"`. Most distributed codes are always in the `"iife"` browser format.

- **libConfig.outDir** - defines the output directory for your `library` build. Defaults to `"lib"`. Note that lib build are always on **cjs** format, you cannot override this.

- **libConfig.enabled** - defines if lib build is enabled. Defaults to `false`.

## Examples

- **Copying Asset files during Build**

    We can copy asset files that our modules use when running the build process as shown below:

    ```json
    {
        "libConfig" {
            "enabled": true,
            "copyAssets": true
        }
    }
    ```

- **Generating minified builds**

    We can also decide to minify the build output. You must pass in an [uglifier plugin](https://github.com/rollup/rollup/wiki/Plugins#output--prettifying) as first parameter to the API for this to work. Below, we uglify only the `dist` build.

    ```json
    {
        "distConfig": {
            "uglify": true
        },
        "libConfig": {
            "uglify": false
        }
    }
    ```

- **Using the Watch option**

    To run build and watch for file changes, you can create two separate npm scripts as shown below:

    ```json
        ...,
        "scripts": {
            "build": "BABEL_ENV=build rollup --config",
            "watch-build": "npm run build -- --watch"
        },
        ...
    ```

    Then you can run the commands depending on what you need.

    ```bash
    npm run watch-build #build and watch for changes
    ```

## Contributing

We welcome your own contributions, ranging from code refactoring, documentation improvements, new feature implementations, bugs/issues reporting, etc. we recommend you follow the steps below to actively contribute to this project

1. Decide on what to help us with

2. Fork this repo to your machine

3. Implement your ideas, and once stable

4. Create a pull request, explaining your improvements/features

All future contributors will be included below and immensely appreciated. We look forward to your contributions.

## About Project Maintainers

This project is maintained by [harrison ifeanyichukwu](mailto:harrisonifeanyichukwu@gmail.com), a young, passionate full stack web developer, an [MDN](https://developer.mozilla.org/en-US/profiles/harrison-feanyichukwu) documentator, maintainer of w3c [xml-serializer](https://www.npmjs.com/package/@harrison-ifeanyichukwu/xml-serializer) project, node.js [R-Server](https://github.com/harrison-ifeanyichukwu/r-server) and other amazing projects.

He is available for hire, ready to work on amazing `PHP`,  `Node.js`,  `React`,  `Angular`,  `HTML5`,  `CSS` and database projects. Looks forward to hearing from you soon!!!
