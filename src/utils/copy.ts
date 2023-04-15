import { isObject } from './isObject';

/**
 * copies the objects into the target object, without creating references, unlike Object.assign
 */
export const copy = <T extends object, O extends object>(
  target: T,
  ...objects: O[]
): T & {
  [P in keyof O]: O[P];
} => {
  const isValidKey = (key) => {
    return (
      key !== '__proto__' &&
      key !== 'constructor' &&
      key !== 'prototype' &&
      key !== 'theming'
    );
  };

  const cloneEach = (dest: any, value: any) => {
    if (Array.isArray(value)) {
      return value.map((current) => cloneEach(null, current));
    }

    if (isObject(value)) {
      return copy(isObject(dest) ? dest : {}, value);
    }

    return value;
  };

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    if (isObject(object)) {
      const keys = Object.keys(object);
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        if (isValidKey(key)) {
          target[key as any] = cloneEach(target[key as any], object[key]);
        }
      }
    }
  }

  return target as T & { [P in keyof O]: O[P] };
};
