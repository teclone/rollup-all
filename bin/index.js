#!/usr/bin/env node
const args = require('args');

args.options([
  {
    name: 'dir',
    description: 'defines the directory to locate the cjs build output',
    defaultValue: '../build'
  }
]);

const flags = args.parse(process.argv);
const getEntryPath = require('@forensic-js/node-utils').getEntryPath;
const loadFile = require(`${flags.dir}/modules/utils`).loadFile;
const Bundler = require(`${flags.dir}/modules/Bundler`).Bundler;

const entryPath = getEntryPath();
const options = loadFile(entryPath, 'rollup.config.js');

const bunder = new Bundler(options);
bunder.process();
