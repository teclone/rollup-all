import { existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * returns the closest entry dir for the given path,
 * including the given path that has a package.json file
 * @param startPath
 * @returns
 */
export const getClosestPackageDir = (startPath?: string) => {
  /* istanbul ignore if */
  let mainFileName = startPath;

  /* istanbul ignore else */
  if (!startPath) {
    mainFileName = process.cwd();
  }

  let currentPath: string = mainFileName;
  let result = '';

  while (currentPath && currentPath !== '/') {
    if (existsSync(join(currentPath, 'package.json'))) {
      result = currentPath;
      break;
    }
    currentPath = resolve(currentPath, '../');
  }
  return result;
};
