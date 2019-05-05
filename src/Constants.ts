import { CommonConfig } from './@types';

export const COMMON_CONFIGS: (keyof CommonConfig)[] = [
    'copyAssets', 'include', 'exclude', 'sourcemap', 'uglify', 'interop'
];