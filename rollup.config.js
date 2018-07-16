import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import {uglify} from 'rollup-plugin-uglify';

import bundler from './src/main.js';

export default bundler.getExports(uglify(), [
    resolve(),
    babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
    })
]);