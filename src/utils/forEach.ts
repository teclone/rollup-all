/**
 * run a sequential for each callback on any array, including promises
 * @param items
 * @param callback
 */
export const forEach = <T>(
  items: T[],
  callback: (item: T, index: number, items: T[], abort: () => void) => any
) => {
  let _abort = false;

  const abort = () => {
    _abort = true;
  };

  const run = (index: number) => {
    const next = () => !_abort && run(index + 1);
    if (items.length === index) {
      return;
    }
    const result = callback(items[index], index, items, abort);
    if (result instanceof Promise) {
      return result.then(next);
    } else {
      next();
    }
  };

  return run(0);
};
