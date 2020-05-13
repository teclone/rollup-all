import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import { Config, GeneralConfig, DistConfig, ESMConfig, CJSConfig } from '../@types';
import { getEntryPath } from '@teclone/node-utils';

import path from 'path';
import fs from 'fs';

const resolveDependency = (dir: string, name: string) => {
  const dependencyPath = path.resolve(dir, 'node_modules/', name);
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
  extraPlugins: Array<any> = [],
  internalNodeModulesDir: string,
  useESModules: boolean,
) => {
  return [
    [
      resolveDependency(internalNodeModulesDir, '@babel/plugin-transform-runtime'),
      {
        useESModules,
      },
    ],
    resolveDependency(internalNodeModulesDir, '@babel/plugin-proposal-class-properties'),
    resolveDependency(
      internalNodeModulesDir,
      '@babel/plugin-proposal-object-rest-spread',
    ),
    [
      resolveDependency(
        internalNodeModulesDir,
        '@babel/plugin-proposal-nullish-coalescing-operator',
      ),
    ],
    [
      resolveDependency(
        internalNodeModulesDir,
        '@babel/plugin-proposal-optional-chaining',
      ),
    ],
    ...extraPlugins,
  ];
};

export const getBabelPresets = (
  extraPresets: Array<any> = [],
  internalNodeModulesDir: string,
) => {
  return [
    [
      resolveDependency(internalNodeModulesDir, '@babel/preset-env'),
      {
        modules: false,
      },
    ],
    resolveDependency(internalNodeModulesDir, '@babel/preset-typescript'),
    ...extraPresets,
  ];
};

export const getRollupPlugins = (
  mainConfig: Config,
  buildConfig: DistConfig | ESMConfig | CJSConfig,
  generalConfig: GeneralConfig,
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
      babelrc: false,

      presets: getBabelPresets(
        generalConfig?.babelConfig?.presets || [],
        internalNodeModulesDir,
      ),

      plugins: getBabelPlugins(
        generalConfig?.babelConfig?.plugins || [],
        internalNodeModulesDir,
        buildConfig.format === 'esm',
      ),

      exclude: 'node_modules/**',

      extensions: mainConfig.extensions,

      runtimeHelpers: true,
    }),

    json(),

    buildConfig.uglify && terser(),

    ...mainConfig.plugins,
  ];
};
