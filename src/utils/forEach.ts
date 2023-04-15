/**
 * run a sequential for each callback on anything, including promises
 * @param items
 * @param runner
 */
export const forEach = <T>(
  items: T[],
  runner: (item: T, index: number, items: T[]) => any
) => {
  const run = (index: number) => {
    if (items.length === index) {
      return;
    }
    const result = runner(items[index], index, items);
    if (result instanceof Promise) {
      return result.then(() => run(index + 1));
    }
    return result;
  };

  return run(0);
};
