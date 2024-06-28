# @teclone/rollup-all

[![Build Status](https://travis-ci.org/teclone/rollup-all.svg?branch=master)](https://travis-ci.org/teclone/rollup-all)
[![Coverage Status](https://coveralls.io/repos/github/teclone/rollup-all/badge.svg?branch=master)](https://coveralls.io/github/teclone/rollup-all?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/%40teclone%2Frollup-all.svg)](https://badge.fury.io/js/%40teclone%2Frollup-all)
![npm](https://img.shields.io/npm/dt/%40teclone%2Frollup-all.svg)

**@teclone/rollup-all** is a package for generating javascript/typescript library builds with typescript definition file support.

This package does the heavy lifting and builds on top of [Rollupjs](https://rollupjs.org/) and [Babel](https://babeljs.io/) making it possible to generate `cjs`, `es`, `umd` and `iife` builds at once.

## Motivation for this package

The Javascript ecosystem is diverse, and every changing with new language proposals. There is big need to support older environments while writing in modern Javascript syntax.

Library developers face the problem of shipping modern Javascript codes to formats that are compatible with NodeJs, browsers and bundle tools (webpack) in the leanest forms.

Moreso, there is need to generate typescript definition files for most projects (javascript and typescript projects alike), sourcemaps, minification, production build, development build, resolution of dynamic imports, etc.

This library allows you to generate commonjs, es module, and browser builds at once with sourcemaps and typescript definition files. It is very configurable.

This package automates the whole process with the right configurations and makes it easy to get all target build formats generated in one command with configurability in mind.

it generates typescript definition files for what is built, by leveraging typescript build api.

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
- `es`: Es module build, the output of this build is compatibile with modern bundle tools such as webpack
- `umd`: Browser bundle compatible with umd loaders,
- `iife`: Browser bundle

### Configurations

It is possible to configure the build process via a config file or via cli options. To configure the build via a config file, create a `rollup.config.js` file in the project's root directory

```javascript
const { createConfig } = require('@teclone/rollup-all');
module.exports = createConfig({
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
    enabled: true,
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
});
```

#### Cli options

The following options can be parsed to the cli binary

- **--sourcemap**: `boolean`: to generate sourcemaps, default is `true`
- **--src**: `string`: your code's src folder: default value is `src`

### Environment and minified builds

When generating distribution builds, aka `umd` and `iife`, it is desirable to have separate development and production build with minified and non minified versions.

The build filename format for dist builds is `[filename].[env].[min]?.js`;

Production build will strip out all development related codes based on evaluation of `process.env.NODE.ENV`.

for instance, the code sample below will be removed in production builds

```javascript
if (process.env.NODE_ENV === 'development') {
  // code snippets here
}
```

This configuration is achieved using the output option as shown below

```typescript
const { createConfig } = require('@teclone/rollup-all');
module.exports = createConfig({
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
      ['uni', 'minified'],

      ['development', 'unminified'],
      ['production', 'unminified'],
      ['uni', 'unminified'],
    ],

    minifiedSuffix: 'min',
  },
});
```
