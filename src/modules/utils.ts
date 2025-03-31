import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import image from '@rollup/plugin-image';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import shebang from 'rollup-plugin-preserve-shebang';
import { BuildFormat, Config } from '../@types';
import path from 'path';
import fs from 'fs';
import { Plugin } from 'rollup';
import { getClosestPackageDir } from '../utils/getClosestPackageDir';

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

export const getRollupPlugins = (opts: {
  minify: boolean;
  format: BuildFormat;

  extensions: string[];

  babelPresets: Config['defaults']['babelPresets'];
  babelPlugins: Config['defaults']['babelPlugins'];

  plugins: Plugin[];
}) => {
  const { extensions, format, plugins, minify, babelPlugins, babelPresets } =
    opts;
  const internalNodeModulesDir = getClosestPackageDir(__dirname);
  const isDistBuild = format === 'umd' || format === 'iife';

  return [
    resolve({
      extensions,
    }),

    commonjs({
      include: 'node_modules/**',
    }),
    babel({
      // we do not want to use any local babelrc
      babelrc: false,

      presets: [
        // here we are including babel preset env,
        [
          resolveDependency(internalNodeModulesDir, '@babel/preset-env'),
          {
            // we do not want babel to change es modules to another module type
            // so that rollup can be able to process it
            modules: false,

            // this defines babel preset shipped plugins to exclude, see
            // https://github.com/babel/babel/blob/master/packages/babel-compat-data/scripts/data/plugin-features.js
            //for all the included plugins
            exclude: [],

            /**
             * this means that babel will not add corejs polyfills
             * nor tranform entry file import of core-js into individual polyfills.
             */
            useBuiltIns: false,
          },
        ],

        // support for typescript
        [
          resolveDependency(internalNodeModulesDir, '@babel/preset-typescript'),
          {
            allowDeclareFields: true,
          },
        ],

        // support for react
        [
          resolveDependency(internalNodeModulesDir, '@babel/preset-react'),
          {
            runtime: 'automatic',
          },
        ],

        ...babelPresets,
      ],

      // plugins
      plugins: [
        ...babelPlugins,

        // use babel runtime in non dist builds
        !isDistBuild
          ? [
              resolveDependency(
                internalNodeModulesDir,
                '@babel/plugin-transform-runtime'
              ),
              {
                useESModules: format === 'es',
                regenerator: true,
              },
            ]
          : null,

        // replace environment variables in dist builds
        isDistBuild ? ['transform-inline-environment-variables'] : null,
      ].filter(Boolean),

      // runtime for library builds are bundled for bundled builds
      babelHelpers: isDistBuild ? 'bundled' : 'runtime',

      // do not process node module files, it is believed that all files in the node modules directory has been properly worked on
      exclude: '**/node_modules/**',

      extensions,
    }),

    // handle json imports
    json(),

    // handle image imports
    image(),

    // applies to esm and cjs builds
    shebang(),

    // handle dynamic import vars
    dynamicImportVars(),

    // minification
    minify && terser(),

    ...plugins,
  ];
};
