/**
 * Bounded concurrency for routing reads (debt burn, 2026-09-26).
 *
 * `createLimiter(n)` returns a gate that runs at most `n` tasks at once and
 * starts queued tasks in call order. Results keep the caller's order because
 * the caller holds one promise per task. Nothing here retries or swallows an
 * error: a rejected task rejects its own promise only.
 */

export type Limiter = <T>(task: () => Promise<T>) => Promise<T>;

export function createLimiter(concurrency: number): Limiter {
  const max = Math.max(1, Math.trunc(concurrency));
  let active = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    active -= 1;
    queue.shift()?.();
  };
  return <T>(task: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const start = () => {
        active += 1;
        Promise.resolve()
          .then(task)
          .then(resolve, reject)
          .finally(next);
      };
      if (active < max) start();
      else queue.push(start);
    });
}

/** Reject after `ms` with `Error(label)`; the task itself keeps running and its result is ignored. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
