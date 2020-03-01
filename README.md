# @teclone/rollup-all

[![Build Status](https://travis-ci.org/teclone/rollup-all.svg?branch=master)](https://travis-ci.org/teclone/rollup-all)
[![Coverage Status](https://coveralls.io/repos/github/teclone/rollup-all/badge.svg?branch=master)](https://coveralls.io/github/teclone/rollup-all?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/%40teclone%2Frollup-all.svg)](https://badge.fury.io/js/%40teclone%2Frollup-all)
![npm](https://img.shields.io/npm/dt/%40teclone%2Frollup-all.svg)

## Overview

**@teclone/rollup-all** is an out of the box package for building all your shiny Javascript/Typescript library source codes in one parsing, allowing you to generate commonjs, es module, and browser builds at once. It is very configurable and runs asynchronously.

It allows you to configure the build process, letting you define what should be included and excluded in the build, if sourcemap should be generated, if minified versions of the build should be generated, if **asset and type definition files** should be copied over, and lots more...

It comes with all needed configurations already done for you, including support for typescript projects. It uses Rollup's [JavaScript API](https://rollupjs.org/guide/en/#javascript-api) to automate the build process.

## Getting Started

```bash
npm install --save-dev @teclone/rollup-all
```

Next, add the build script to your package.json file

```json
{
  "scripts": {
    "build": "@teclone/rollup-all"
  }
}
```

## Advanced Configuration

In case you need to do some other configurations, such as passing extra babel presets, babel plugins, rollup plugins, and build config, then you can create
a `rollup.config.js` file at the root of your project. Like shown below:

```typescript
const { config } = require('@teclone/rollup-all');
module.exports = config(options);
```

The above code is the way to configure the build process. The good thing is that it is self documented, because it is a typescript project, and has typings generated.

Below is a brief documentation of the options object.

### The Options Object

The options object takes two objects, `config` and `babelConfig`.

1. **Babel Config**

Babel config object takes presets array and plugins array. These are added to the already existing presets and plugins used internally.

By default, The following presets are added automatically:

1. [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)
2. [@babel/preset-typescript](https://babeljs.io/docs/en/babel-preset-typescript)

The following babel plugins are added automatically:

1. [@babel/plugin-proposal-class-properties](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)
2. [@babel/plugin-proposal-nullish-coalescing-operator](https://babeljs.io/docs/en/babel-plugin-proposal-nullish-coalescing-operator)
3. [@babel/plugin-proposal-object-rest-spread](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread)
4. [@babel/plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)
5. [@babel/runtime](https://babeljs.io/docs/en/babel-runtime)

6. **Config**

The config object is where you configure build specific options, and also where you extend the rollup plugins. it accepts a plugins array, that are added
to the already used plugins. Below is a list of already added plugins

1. `rollup-plugin-babel`
2. `@rollup/plugin-commonjs`
3. `@rollup/plugin-node-resolve`
4. `rollup-plugin-terser`
5. `@rollup/plugin-json`

The config option takes other configuration options, such as `sourcemap` option, `interop`, `uglify`, `assets` array, `distConfig` options (where you can configure options specifically for browser builds, such as externals). etc. Note that `distConfig.enabled` options is set to false by default.

## Contributing

We welcome your own contributions, ranging from code refactoring, documentation improvements, new feature implementations, bugs/issues reporting, etc. **Thanks in advance!!!**
