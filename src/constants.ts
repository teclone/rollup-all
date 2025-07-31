import { BuildFormat } from './@types';

export const BASE_ASSET_EXTENSIONS = [
  '.json',
  '.png',
  '.jpeg',
  '.jpg',
  '.gif',
  '.svg',
  '.css',
  '.scss',
  '.sass',
];

export const formats: BuildFormat[] = ['cjs', 'es', 'iife', 'umd'];

export const EXCLUDE_FILES_EXT_REGEX =
  /\.(spec|test|stories|tests|specs|cy|snap)(\.[\w-_]+)*$/i;
