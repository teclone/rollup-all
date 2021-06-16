import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import shebang from 'rollup-plugin-preserve-shebang';
import {
  Config,
  GeneralConfig,
  DistConfig,
  ESMConfig,
  CJSConfig,
  BabelPresetsConfig,
  BabelPluginsConfig,
} from '../@types';
import { getEntryPath } from '@teclone/node-utils';

import path from 'path';
import fs from 'fs';

const resolveDependency = (dir: string, name: string) => {
  const dependencyPath = path.resolve(dir, 'node_modules', name);
  try {
    const stat = fs.statSync(dependencyPath);
    if (stat && stat.isDirectory()) {
      return dependencyPath;
    }
  } catch (ex) {}
  return name;
};

/**
 * loads the given file and returns the result
 * @param file
 */
export const loadFile = (entryPath: string, file: string) => {
  try {
    return require(path.resolve(entryPath, file));
  } catch (ex) {
    return {};
  }
};

export const getBabelPlugins = (
  pluginsConfig: BabelPluginsConfig,
  internalNodeModulesDir: string,
  useESModules: boolean
) => {
  return [
    /**
     * all these are now available by default in babel preset env
     */
    [
      resolveDependency(
        internalNodeModulesDir,
        '@babel/plugin-transform-typescript'
      ),
      {
        allowDeclareFields: true,
      },
    ],
    resolveDependency(
      internalNodeModulesDir,
      '@babel/plugin-proposal-class-properties'
    ),
    resolveDependency(
      internalNodeModulesDir,
      '@babel/plugin-proposal-object-rest-spread'
    ),
    [
      resolveDependency(
        internalNodeModulesDir,
        '@babel/plugin-proposal-nullish-coalescing-operator'
      ),
    ],
    [
      resolveDependency(
        internalNodeModulesDir,
        '@babel/plugin-proposal-optional-chaining'
      ),
    ],
    ...(pluginsConfig?.plugins || []),
    [
      resolveDependency(
        internalNodeModulesDir,
        '@babel/plugin-transform-runtime'
      ),
      {
        useESModules,
      },
    ],
  ];
};

export const getBabelPresets = (
  presetsConfig: BabelPresetsConfig,
  internalNodeModulesDir: string
) => {
  return [
    // here we are including babel preset env
    [
      resolveDependency(internalNodeModulesDir, '@babel/preset-env'),
      {
        // we do not want babel to change es modules to another module type
        // so that rollup can be able to process it
        modules: false,

        // this defines babel preset shipped plugins to exclude, see
        // https://github.com/babel/babel/blob/master/packages/babel-compat-data/scripts/data/plugin-features.js
        //for all the included plugins
        exclude: presetsConfig?.exclude || [],
      },
    ],

    // support for typescript
    resolveDependency(internalNodeModulesDir, '@babel/preset-typescript'),

    // support for react
    [
      resolveDependency(internalNodeModulesDir, '@babel/preset-react'),
      {
        development: process.env.BABEL_ENV === 'development',
        runtime: 'automatic',
      },
    ],

    // user defined preset.
    ...(presetsConfig?.presets || []),
  ];
};

export const getRollupPlugins = (
  mainConfig: Config,
  buildConfig: DistConfig | ESMConfig | CJSConfig,
  generalConfig: GeneralConfig
) => {
  const internalNodeModulesDir = getEntryPath(__dirname);

  return [
    resolve({
      extensions: mainConfig.extensions,
    }),

    commonjs({
      include: 'node_modules/**',
    }),

    babel({
      // we do not want to use any local babelrc
      babelrc: false,

      plugins: getBabelPlugins(
        generalConfig?.babelConfig?.pluginsConfig || {},
        internalNodeModulesDir,
        buildConfig.format === 'esm'
      ),

      presets: getBabelPresets(
        generalConfig?.babelConfig?.presetsConfig || {},
        internalNodeModulesDir
      ),

      // we are using runtime because it is assumed you are building a library
      // this should be made configurable
      babelHelpers: 'runtime',

      // do not process node module files, it is believed that all files in the node modules directory has been properly worked on
      exclude: 'node_modules/**',

      extensions: mainConfig.extensions,
    }),

    json(),

    shebang(),

    buildConfig.uglify && terser(),

    ...mainConfig.plugins,
  ];
};
