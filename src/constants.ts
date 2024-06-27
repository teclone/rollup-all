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
