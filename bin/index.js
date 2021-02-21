#!/usr/bin/env node
const args = require('args');

args.options([
  {
    name: 'dir',
    description: 'defines the directory to locate the cjs build output',
    defaultValue: '../build',
  },
  {
    name: 'silent',
    description: 'defines if build output logs should be sent to the console',
    defaultValue: undefined,
  },
  {
    name: 'prod',
    description:
      'defines if process.env should be set to production before the build starts',
    defaultValue: true,
  },
  {
    name: 'dev',
    description:
      'defines if process.env should be set to development before the build starts, defaults to false',
    defaultValue: false,
  },
]);

const run = () => {
  const flags = args.parse(process.argv);

  const getEntryPath = require('@teclone/node-utils').getEntryPath;

  const prevEnv = process.env.NODE_ENV;

  if (flags.dev) {
    process.env.NODE_ENV = 'development';
  } else {
    process.env.NODE_ENV = 'production';
  }

  const loadFile = require(`${flags.dir}/modules/utils`).loadFile;
  const Bundler = require(`${flags.dir}/modules/Bundler`).Bundler;

  const entryPath = getEntryPath();
  const options = loadFile(entryPath, 'rollup.config.js');

  console.info(`generating ${process.env.NODE_ENV} builds....`);

  const bunder = new Bundler(options, {
    generateOutputLogs: flags.silent !== true,
  });

  return bunder.process().then(() => {
    process.env.NODE_ENV = prevEnv;
  });
};

run().then(() => {
  return process.exit(0);
});
