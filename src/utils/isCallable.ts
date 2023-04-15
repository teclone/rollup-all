/**
 * test if argument is a function
 */
export const isCallable = (arg: any): arg is Function => {
  return (
    (Object.prototype.toString.call(arg) === '[object Function]' ||
      arg instanceof Function) &&
    !(arg instanceof RegExp)
  );
};
