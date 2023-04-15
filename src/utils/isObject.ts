import { isCallable } from './isCallable';
import { isRegex } from './isRegex';

export const isObject = (arg) => {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    arg !== undefined &&
    !isRegex(arg) &&
    !isCallable(arg)
  );
};
