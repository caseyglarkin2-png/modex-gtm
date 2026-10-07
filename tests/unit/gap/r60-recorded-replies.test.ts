/**
 * R60 capture once, found on the production-build walk: Work's two-minute read kept a reply's "Log what they said"
 * card after the reply was logged through Capture. Work now reads, on every load, which remembered replies carry a
 * confirmed disposition; they leave Work, and a remembered "replied" summary no longer speaks for an account where
 * nothing waits.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadRecordedReplyIds, withoutRecordedReplies } from '@/lib/gap/work/recorded-replies';
import { workDay } from '@/lib/gap/work/list';

const NOW = new Date('2026-10-07T15:00:00Z');
const reply = (id: string, accountName: string) => ({ id, accountName, contactEmail: `${id}@example.com`, subject: 'Re', snippet: 'Can you send the case study by Friday?', receivedAt: '2026-10-07T12:00:00Z' });

describe('R60: a reply logged through Capture leaves Work on the next load', () => {
  it('the live read asks for confirmed dispositions on the remembered replies only, once', async () => {
    const calls: unknown[] = [];
    const prisma = { conversationDisposition: { findMany: async (q: unknown) => (calls.push(q), [{ source_id: 'm1' }]) } };
    expect([...(await loadRecordedReplyIds(prisma, ['m1', 'm2', 'm1', '']))]).toEqual(['m1']);
    expect(calls).toEqual([{ where: { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: ['m1', 'm2'] }, human_confirmed: true }, select: { source_id: true } }]);
    expect((await loadRecordedReplyIds(prisma, [])).size).toBe(0);
    expect(calls).toHaveLength(1);
  });

  it('a recorded reply leaves; a stale replied summary is dropped only where nothing else waits', () => {
    const replies = [reply('m1', 'Nfi Co'), reply('m2', 'Fedex Co'), reply('m3', 'Fedex Co')];
    const summaries = new Map([['Nfi Co', { state: 'replied' }], ['Fedex Co', { state: 'replied' }], ['Kroger Co', { state: 'in_deal' }]]);
    const out = withoutRecordedReplies(replies, summaries, new Set(['m1', 'm2']));
    expect(out.replies.map((r) => r.id)).toEqual(['m3']);
    expect([...out.summaries!.keys()]).toEqual(['Fedex Co', 'Kroger Co']);
    expect(withoutRecordedReplies(replies, summaries, new Set()).replies).toHaveLength(3);
  });

  it('Work built from what is left offers no reply card for the logged reply', () => {
    const before = workDay({ now: NOW, candidates: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, replies: [reply('m1', 'Nfi Co')] });
    expect(before.cards.find((c) => c.accountName === 'Nfi Co')?.next?.label).toBe('Log what they said');
    const live = withoutRecordedReplies([reply('m1', 'Nfi Co')], undefined, new Set(['m1']));
    const after = workDay({ now: NOW, candidates: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, replies: live.replies });
    expect(after.cards.find((c) => c.accountName === 'Nfi Co')).toBeUndefined();
  });

  it('the Work page reads it live, in the same wave, and builds the cards from what is left', () => {
    const page = readFileSync('src/app/gap/page.tsx', 'utf8');
    expect(page).toMatch(/loadRecordedReplyIds\(prisma, data\.workInput\.replies\.map/);
    expect(page).toMatch(/const day = workDay\(\{ \.\.\.data\.workInput, replies: live\.replies,/);
  });
});
