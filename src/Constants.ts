import { CommonConfig } from './@types';

export const COMMON_CONFIGS: (keyof CommonConfig)[] = [
  'assets',
  'include',
  'exclude',
  'sourcemap',
  'uglify',
  'interop',
  'externals',
];

export const REGEX_FIELDS: (keyof CommonConfig)[] = ['assets', 'include', 'exclude'];
