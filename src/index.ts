import { GeneralConfig } from './@types';

export const config = (options: GeneralConfig) => {
  return options || {};
};

export type { GeneralConfig };
