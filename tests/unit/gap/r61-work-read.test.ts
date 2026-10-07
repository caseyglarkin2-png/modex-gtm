// @vitest-environment node
/**
 * R61: Work's two-minute read, rebuilt, took 67.6 s under production-like latency on the corpus: about 180 send-gate
 * reads one after another (one per Work account, 40 s) and up to twenty cards' next touches one after another (about
 * twenty round trips each, 20 s). Pins: the send gate for every Work account is ONE read, with the same rule; the
 * next touches run a few at a time; one failure never stops the others.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mapLimit } from '@/lib/gap/work/map-limit';
import { loadSendableTheses, loadSendableThesesFor } from '@/lib/gap/pursuit/load';
import { TOUCH_EVALUATION_CONCURRENCY } from '@/lib/gap/routing/queue';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('mapLimit: a few at a time, in order, each on its own', () => {
  it('never more than the limit at once, every item done, results in item order, a failure kept as its own', async () => {
    let running = 0;
    let peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      running += 1;
      peak = Math.max(peak, running);
      await tick();
      running -= 1;
      if (n === 4) throw new Error('four failed');
      return n * 10;
    });
    expect(peak).toBe(3);
    expect(out.map((r) => (r.status === 'fulfilled' ? r.value : (r.reason as Error).message))).toEqual([10, 20, 30, 'four failed', 50, 60, 70]);
    expect(await mapLimit([], 5, async () => 1)).toEqual([]);
  });
});

describe('the send gate for many accounts is one read', () => {
  const NOW = new Date('2026-10-07T12:00:00Z');
  // A thesis is sendable when its primary signal is a verified, dated, quoted, external-ok fact; the gate's own rule
  // decides. Here every row lacks signals, so the gate refuses them all: what is pinned is the shape of the read.
  const prisma = () => {
    const calls: unknown[] = [];
    return {
      calls,
      prospectingHypothesis: {
        findMany: async (q: { where: { account_name: unknown } }) => {
          calls.push(q.where.account_name);
          return [
            { id: 'h1', account_name: 'Acme Co', observation: 'x', metadata: null, signals: [] },
            { id: 'h2', account_name: 'Beta Co', observation: 'y', metadata: null, signals: [] },
          ];
        },
      },
    };
  };
  it('every Work account is asked in one read and every named account gets an answer', async () => {
    const p = prisma();
    const m = await loadSendableThesesFor(p, ['Acme Co', 'Beta Co', 'Gamma Co', 'Acme Co'], NOW);
    expect(p.calls).toEqual([{ in: ['Acme Co', 'Beta Co', 'Gamma Co'] }]);
    expect([...m.keys()]).toEqual(['Acme Co', 'Beta Co', 'Gamma Co']);
    expect([...m.values()].every((s) => s instanceof Set)).toBe(true);
    const one = prisma();
    expect(await loadSendableTheses(one, 'Acme Co', NOW)).toEqual(new Set());
    expect(one.calls).toEqual(['Acme Co']);
  });
  it('Work reads the send gate for its accounts once, never in a loop', () => {
    const page = readFileSync('src/app/gap/page.tsx', 'utf8');
    expect(page).toMatch(/const sendableAll = await loadSendableThesesFor\(prisma, workAccounts, now\)/);
    expect(page).not.toMatch(/for \(const name of workAccounts\) \{\s*const sendable = await/);
  });
});

describe('the cards\' next touches run a few at a time', () => {
  it('the queue evaluates them through mapLimit at the pool\'s width, never one after another', () => {
    const queue = readFileSync('src/lib/gap/routing/queue.ts', 'utf8');
    expect(TOUCH_EVALUATION_CONCURRENCY).toBe(5);
    expect(queue).toMatch(/await mapLimit\(withHistory\.slice\(0, MAX_TOUCH_EVALUATIONS\), TOUCH_EVALUATION_CONCURRENCY,/);
    expect(queue).not.toMatch(/for \(const \[n, item\] of withHistory\.entries\(\)\)/);
  });
});
