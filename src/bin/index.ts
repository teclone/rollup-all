import { getEntryPath } from '@forensic-js/node-utils';
import { loadFile } from '../modules/utils';
import { GeneralConfig } from '../@types';
import { Bundler } from '../modules/Bundler';

const entryPath = getEntryPath();

const options = loadFile(entryPath, 'rollup.config.js') as GeneralConfig;

const bunder = new Bundler(options);

bunder.process();
