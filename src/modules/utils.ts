import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import { Config, GeneralConfig } from '../@types';
import { isProdEnv } from '@forensic-js/node-utils';
import path from 'path';

/**
 * loads the given file and returns the result
 * @param file
 */
export const loadFile = (entryPath: string, file: string) => {
  try {
    return require(path.resolve(entryPath, file)).default;
  } catch (ex) {
    return {};
  }
};

export const getBabelPlugins = (extraPlugins: Array<any> = []) => {
  return [
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: true
      }
    ],
    '@babel/proposal-class-properties',
    '@babel/proposal-object-rest-spread',
    ['@babel/plugin-proposal-nullish-coalescing-operator'],
    ['@babel/plugin-proposal-optional-chaining'],
    ...extraPlugins
  ];
};

export const getBabelPresets = (extraPresets: Array<any> = []) => {
  return [
    [
      '@babel/env',
      {
        modules: false
      }
    ],
    '@babel/preset-typescript',
    ...extraPresets
  ];
};

export const getRollupPlugins = (
  config: Config,
  generalConfig: GeneralConfig
) => {
  return [
    resolve({
      extensions: config.extensions
    }),

    commonjs({
      include: 'node_modules/**'
    }),

    babel({
      babelrc: false,

      presets: getBabelPresets(generalConfig?.babelConfig?.presets),

      plugins: getBabelPlugins(generalConfig?.babelConfig?.plugins),

      exclude: 'node_modules/**',

      extensions: config.extensions,

      runtimeHelpers: true
    }),

    json(),

    config.uglify && isProdEnv() && terser(),

    ...config.plugins
  ];
};
