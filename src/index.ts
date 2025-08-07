import { Config } from './@types';

export const createConfig = (config: Config) => {
  return config || {};
};

export { Bundler } from './modules/Bundler';
export * from './utils/camelCase';
export * from './utils/getClosestPackageDir';
export * from './utils/isCallable';
export * from './utils/isObject';
export * from './utils/isRegex';
