#!/usr/bin/env node
const getEntryPath = require('@forensic-js/node-utils').getEntryPath;
const loadFile = require('../lib/modules/utils').loadFile;
const Bundler = require('../lib/modules/Bundler').Bundler;

const entryPath = getEntryPath();

const options = loadFile(entryPath, 'rollup.config.js');

const bunder = new Bundler(options);

bunder.process();
