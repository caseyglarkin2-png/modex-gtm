// @vitest-environment node
/**
 * R61: Work's motion read checked each account's recent replies one account after another; they run a few at a time
 * now, and a failed read still fails the whole hold read (the caller holds every READY card: fail closed).
 */
import { describe, expect, it, vi } from 'vitest';

let running = 0;
let peak = 0;
const replied = vi.fn(async (_p: unknown, email: string) => {
  running += 1;
  peak = Math.max(peak, running);
  await new Promise((r) => setTimeout(r, 5));
  running -= 1;
  if (email === 'boom@c.example.com') throw new Error('read failed');
  return email === 'ann@a.example.com' ? { from_email: 'ann@a.example.com', received_at: new Date('2026-10-07T12:00:00Z') } : null;
});
vi.mock('@/lib/gap/replies/account-reply', () => ({ accountRepliedRecently: (...a: [unknown, string]) => replied(...a) }));

import { loadReplyHolds } from '@/lib/gap/motion/load';

describe('loadReplyHolds', () => {
  const NOW = new Date('2026-10-07T15:00:00Z');
  it('checks the accounts a few at a time and keeps each account\'s own answer', async () => {
    const accounts = new Map(Array.from({ length: 8 }, (_, i) => [`Acct ${i}`, i === 0 ? 'ann@a.example.com' : `p${i}@b.example.com`] as const));
    const holds = await loadReplyHolds({}, accounts, NOW);
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThanOrEqual(5);
    expect([...holds]).toEqual([['Acct 0', { from: 'ann@a.example.com', receivedAt: '2026-10-07T12:00:00.000Z' }]]);
  });
  it('a failed read fails the whole hold read, as before', async () => {
    await expect(loadReplyHolds({}, new Map([['A', 'ok@a.example.com'], ['C', 'boom@c.example.com']]), NOW)).rejects.toThrow('read failed');
  });
});
