import * as path from 'path';
import * as fs from 'fs';

export const mkDirSync = (dirPath: string): void => {
    const extname = path.extname(dirPath);
    dirPath = extname !== ''? path.dirname(dirPath) : dirPath;
    if (!fs.existsSync(dirPath)) {
        let existingPath = '';
        let current = dirPath;
        while (existingPath === '' && current !== '/' && current !== '') {
            current = path.join(current, '../');
            if (fs.existsSync(current)) {
                existingPath = current;
            }
        }

        dirPath.split(existingPath)[1].split('/').forEach(pathToken => {
            existingPath = path.join(existingPath, pathToken);
            fs.mkdirSync(existingPath);
        });
    }
};

/**
 * returns true if running in production environment
 */
export const isProdEnv = (): boolean => {
    return process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase().indexOf('prod') === 0;
};

/**
 * returns true if running in development environment
 */
export const isDevEnv = (): boolean => {
    return !isProdEnv();
};