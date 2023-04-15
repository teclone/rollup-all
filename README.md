# @teclone/rollup-all

[![Build Status](https://travis-ci.org/teclone/rollup-all.svg?branch=master)](https://travis-ci.org/teclone/rollup-all)
[![Coverage Status](https://coveralls.io/repos/github/teclone/rollup-all/badge.svg?branch=master)](https://coveralls.io/github/teclone/rollup-all?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/%40teclone%2Frollup-all.svg)](https://badge.fury.io/js/%40teclone%2Frollup-all)
![npm](https://img.shields.io/npm/dt/%40teclone%2Frollup-all.svg)

**@teclone/rollup-all** is a package for generating javascript/typescript library builds with typescript definition file support.

This package does the heavy lifting and builds on top of [Rollupjs](https://rollupjs.org/) and [Babel](https://babeljs.io/) making it possible to generate `cjs`, `esm`, `umd` and `iife` builds at once.

## Motivation for this package

The Javascript ecosystem is diverse, and every changing with new language proposals. There is big need to support older environments while writing in modern Javascript syntax.

Library developers face the problem of shipping modern Javascript codes to formats that are compatible with NodeJs, browsers and bundle tools (webpack) in the leanest forms.

Moreso, there is need to generate typescript definition files for most projects (javascript and typescript projects alike), sourcemaps, minification, production build, development build, resolution of dynamic imports, etc.

library source codes in one parsing, allowing you to generate commonjs, es module, and browser builds at once. It is very configurable and runs asynchronously.

This package automates the whole process with the right configurations and makes it easy to get all target build formats generated in one command with configurability in mind.

### Installation with npm

```bash
npm install --save-dev @teclone/rollup-all
```

### Installation with yarn

```bash
yarn add --dev @teclone/rollup-all
```

### Run via cli

```bash
npx rollup-all
```

### Run as npm/yarn script

add a build script to package.json

```json
{
  "scripts": {
    "build": "rollup-all"
  }
}
```

You can now run it as npm or yarn command

```bash
yarn rollup-all
```

### Supported build Formats:

The following build formats are supported:

- `cjs`: Commonjs build, this output of this build is compatible with Nodejs.
- `esm`: Es module build, the output of this build is compatibile with modern bundle tools such as webpack
- `umd`: Browser bundle compatible with umd loaders,
- `iife`: Browser bundle

**NB**: By default, output directory name matches the format name and are placed inside the project's root folder.

### Configurations

It is possible to configure the build process via a config file or via cli options. To configure the build via a config file, create a `rollup.config.js` file in the project's root directory

```javascript
const { createConfig } = require('./temp');
module.exports = createConfig({
  /**
   * build formats to generate
   */
  formats: ['cjs', 'esm', 'iife', 'umd'],

  src: 'src',

  /**
   * folder to put all builds, defaults to root folder
   *
   * for instance cjs builds will be put inside ${out}/cjs/
   */
  out: './',

  /**
   * extra rollup js plugins
   */
  plugins: [],

  /**
   * entry file for umd/iife build
   */
  entryFile: 'index.js',

  /**
   * package export name for umd/iife,
   *
   * this is the name of the package as it will be accessed in browser windows (window.moduleName)
   */
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
   * package imports that should not be bundled in a umd/iife, treated as externals
   */
  globals: {},

  /**
   * applies to dist builds (umd, iife), if true, a separate [filename].[env].min.js build will be
   * generated for each file.
   */
  minify: true,

  /**
   * development and production builds can be genereted for umd/iife builds
   *
   * the advantage is that development specific codes (process.env.NODE_ENV === 'development') will be removed in production build
   */
  envs: ['development', 'production'],
});
```

#### Cli options

The following options can be parsed to the cli binary

- **--sourcemap**: `boolean`: to generate sourcemaps, default is `true`
- **--envs**: `development|production`: comma separated list of environment based builds. it only applies to distribution build formats, `umd` and `iife`. default is `development,production`
- **--src**: `string`: your code's src folder: default value is `src`
- **--out**: `string`: folder to place all builds, default is root directory `./`

### Environment and minified builds

When generating distribution builds, aka `umd` and `iife`, it is desirable to have separate development and production build with minified and non minified versions.

The build filename format for dist builds is `[filename].[env].[min]?.js`;

Production build will strip out all development related codes, and vice versa.

for instance, the code sample below will be removed in production builds

```javascript
if (process.env.NODE_ENV === 'development') {
  // code snippets here
}
```

This is taken care of automatically with the help of [babel-plugin-transform-inline-environment-variables](https://babeljs.io/docs/babel-plugin-transform-inline-environment-variables)
