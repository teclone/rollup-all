#!/usr/bin/env node
const args = require('args');
const { resolve } = require('path');
const process = require('process');

const parseBoolean = (value) => {
  return value === '' || value === true || value === 'true' || value === '1';
};

/**
 *
 * @param {string} fieldName the field name
 * @param {string[]} allowedValues - array of allowed values
 * @returns
 */
const createListParser = (fieldName, allowedValues = []) => {
  return (value) => {
    const values =
      value && typeof value === 'string'
        ? value.split(/\s*,\s*/gim).filter(Boolean)
        : [];

    if (!allowedValues.length) {
      return values;
    }

    const allowed = new Set(allowedValues);

    values.forEach((value) => {
      if (!allowed.has(value)) {
        throw new Error(
          `Value for ${fieldName} must be one of ${allowedValues}. ${value} is not an acceptable value`
        );
      }
    });

    return values;
  };
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
    init: createListParser('formats', ['cjs', 'es', 'iife', 'umd']),
  },

  {
    name: 'envs',
    description: 'build envs',
    init: createListParser('envs'),
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
  },

  {
    name: 'out',
    description: 'defines code build output directory',
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
        : '../build/cjs/index.js'
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

  const pkgName = pkgFile.name;

  const resolvedConfig = {
    ...config,
    ...flags,
    moduleName:
      config.moduleName ||
      camelCase(pkgName.includes('/') ? pkgName.split('/').pop() : pkgName),
  };

  if (flags.debug) {
    console.log('running in debug mode', 'parsed flags: ', flags);
  }

  const bundler = new Bundler(resolvedConfig);

  return bundler.process();
};

run();
