/**
 * R61: run an async step over many items a few at a time, in order of the items, never one after another. A list of
 * twenty cards each needing twenty round trips took twenty times as long when awaited in a loop. Each step's result
 * (or its error) is its own; one failure never stops the others. Client safe (no imports).
 */
export async function mapLimit<T, R>(items: readonly T[], limit: number, step: (item: T, index: number) => Promise<R>): Promise<Array<PromiseSettledResult<R>>> {
  const out: Array<PromiseSettledResult<R>> = new Array(items.length);
  let next = 0;
  const width = Math.max(1, Math.min(Math.floor(limit) || 1, items.length));
  const worker = async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= items.length) return;
      try {
        out[i] = { status: 'fulfilled', value: await step(items[i], i) };
      } catch (reason) {
        out[i] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: width }, worker));
  return out;
}
