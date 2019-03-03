/**
 * Utility module
 * this module defines a bunch of utility functions that will be relevant to most other modules
*/
import fs from 'fs';
import path from 'path';

let toString = Object.prototype.toString;

export default {
    /**
     * tests if a variable is a number
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isNumber(variable) {
        return typeof variable === 'number' && !isNaN(variable) && isFinite(variable);
    },

    /**
     * tests if a variable is a function
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isCallable(variable) {
        return (toString.call(variable) === '[object Function]' || variable instanceof Function) && !(variable instanceof RegExp);
    },

    /**
     * tests if a variable is an array
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isArray(variable) {
        return toString.call(variable) === '[object Array]' || variable instanceof Array;
    },

    /**
     * tests if a variable is an object
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isObject(variable) {
        return typeof variable === 'object' && variable !== null;
    },

    /**
     * tests if a variable is a plain object literal
     *@param {*} variable - variable to test
     *@returns {boolean}
    */
    isPlainObject(variable) {
        if (this.isObject(variable)) {
            let prototypeOf = Object.getPrototypeOf(variable);
            return prototypeOf === null || prototypeOf === Object.getPrototypeOf({});
        }
        return false;
    },

    /**
     * converts the letters into camel like cases
     *@param {string} value - the string word to convert
     *@param {string|RegExp} [delimiter=/[-_]/] - a delimiter string or regex pattern used in
     * finding split segments
     *@returns {string}
    */
    camelCase(value, delimiter = /[-_]/) {
        value = value.toString();
        let tokens = value.split(delimiter).map((token, idx) => {
            return idx === 0? token : token[0].toUpperCase() + token.substring(1);
        });
        return tokens.join('');
    },

    /**
     * performs a deep merge of all comma seperated list of objects and returns a new object
     *@param {...Object} objects - comma separated list of objects to merge
     *@returns {Object}
    */
    mergeObjects(...objects) {
        /**
         * runs the process
         *@param {Object} dest - the destination object
         *@param {Object} src - the src object
         *@returns {Object}
        */
        function run(dest, src) {
            let keys = Object.keys(src);
            for (let key of keys) {
                let value = src[key];

                if (typeof dest[key] === 'undefined') {
                    dest[key] = this.isPlainObject(value)? run.call(this, {}, value) : value;
                }
                else if (this.isPlainObject(value)) {
                    dest[key] = this.isPlainObject(dest[key])?
                        run.call(this, dest[key], value) : run.call(this, {}, value);
                }
                else {
                    dest[key] = value;
                }
            }
            return dest;
        }

        let dest = {};
        for (let object of objects) {
            if (!this.isPlainObject(object))
                continue;
            dest = run.call(this, dest, object);
        }
        return dest;
    },

    /**
     * creates a directory recursively and synchronously
     *@param {string} dir - the directory to create
     *@returns {boolean}
    */
    mkDirSync(dir) {
        if (typeof dir !== 'string')
            throw new TypeError('argument one is not a string');
        if (dir === '/' || dir === '' || fs.existsSync(dir))
            return false;

        //search backwards
        dir = dir.replace(/\/+$/, '');
        let existingPath = '',
            testPath = dir;
        while (existingPath === '' && testPath !== '/') {
            testPath = path.join(testPath, '../');
            if (fs.existsSync(testPath))
                existingPath = testPath;
        }

        let pathTokens = dir.split(existingPath)[1].split('/');
        for (let pathToken of pathTokens) {
            existingPath = path.join(existingPath, '/', pathToken);
            fs.mkdirSync(existingPath);
        }
        return true;
    },

    /**
     * returns true if running in production environment
     *@returns {boolean}
     */
    isProdEnv() {
        return process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase().indexOf('prod') === 0;
    },

    /**
     * returns true if running in development environment
     *@returns {boolean}
     */
    isDevEnv() {
        return !this.isProdEnv();
    }
};