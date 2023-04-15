#!/usr/bin/env node
const args = require('args');
const { resolve } = require('path');
const process = require('process');

const parseBoolean = (value) => {
  return value === '' || value === true || value === 'true' || value === '1';
};

const assignDefaultBooleanValue = (flags, property, defaultValue) => {
  if (typeof flags[property] === 'undefined') {
    flags[property] = defaultValue;
  }
};

args.options([
  {
    name: 'silent',
    description: 'defines if build output logs should be sent to the console',
    init: parseBoolean,
  },

  {
    name: 'formats',
    description: 'defines desired build formats',
    defaultValue: 'cjs, esm',
    init: (value) => value.split(/\s*,\s*/gim),
  },

  {
    name: 'envs',
    description: 'build envs',
    defaultValue: 'production, development',
    init: (value) => value.split(/\s*,\s*/gim),
  },

  {
    name: 'debug',
    description: 'run in debug mode',
    init: parseBoolean,
  },

  {
    name: 'sourcemap',
    description: 'defines if sourcemap should be generated, defaults to true',
    init: parseBoolean,
  },

  {
    name: 'src',
    description: 'defines code src directory',
    defaultValue: 'src',
  },

  {
    name: 'out',
    description: 'defines code build output directory',
    defaultValue: './',
  },
]);

const run = () => {
  const entryPath = process.cwd();
  const configFilePath = resolve(entryPath, 'rollup.config.js');

  // inspect package.json file
  let pkgFile;
  try {
    pkgFile = require(resolve(entryPath, 'package.json'));
  } catch (ex) {
    console.error(
      'Build failed. cannot locate a package.json file in entry directory'
    );
    process.exit(1);
  }

  // get bundler
  let Bundler;
  let camelCase;

  try {
    moduleExports = require(resolve(
      __dirname,
      pkgFile.name === '@teclone/rollup-all'
        ? '../temp/index.js'
        : '../cjs/index.js'
    ));

    camelCase = moduleExports.camelCase;
    Bundler = moduleExports.Bundler;
  } catch (ex) {
    console.error('Build failed. cannot locate bundler module');
    process.exit(1);
  }

  // resolve config
  let config = {};
  try {
    config = require(configFilePath);
  } catch (ex) {
    console.log(
      'Proceeding with no custom defined build config file (rollup.config.js)'
    );
  }

  const flags = args.parse(process.argv);

  assignDefaultBooleanValue(flags, 'debug', false);
  assignDefaultBooleanValue(flags, 'sourcemap', true);

  const { envs, formats, sourcemap, out, src } = flags;
  const pkgName = pkgFile.name;

  const resolvedConfig = {
    ...config,
    envs,
    formats,
    sourcemap,
    moduleName:
      config.moduleName ||
      camelCase(pkgName.includes('/') ? pkgName.split('/').pop() : pkgName),
    out,
    src,
  };

  if (flags.debug) {
    console.log('running in debug mode', 'parsed flags: ', flags);
  }

  const bundler = new Bundler(resolvedConfig);

  return bundler.process();
};

run();
