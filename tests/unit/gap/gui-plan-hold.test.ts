// @vitest-environment node
/**
 * IW15 at plan time (Casey, 2026-10-10: the subject, the plan state, the digest and the assignment describe ONE held
 * state): a ready item whose pack names a different person than the card is titled held on the plan itself. And the
 * story's reply excerpt is cut at a word, never mid-word.
 */
import { describe, expect, it } from 'vitest';
import { applyRecipientHolds, heldTitle, type PlanItem } from '@/lib/gap/work/plan';
import { cutWords } from '@/lib/gap/story/touches';

const item = (over: Partial<PlanItem> & { key: string }): PlanItem => ({ rank: 0, accountName: 'PepsiCo', kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch: Tom Kamantauskas', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: { name: 'Tom Kamantauskas', title: 'Senior Director' }, refs: { decisionId: 'dec-1' }, token: 'a'.repeat(32), ...over });

describe('applyRecipientHolds', () => {
  it('a pack addressed to Shawn on Tom\'s card: the title says held and the hold names the recipient; the same person (written differently) is no hold', async () => {
    const [held] = await applyRecipientHolds({}, [item({ key: 'first_touch:dec-1' })], async () => ({ name: 'Shawn Miller', email: 'shawn.miller@pepsico.com' }));
    expect(held.title).toBe('Held: the prepared email names Shawn Miller, not Tom Kamantauskas');
    expect(held.hold).toEqual({ reason: 'recipient_mismatch', recipient: 'Shawn Miller' });
    expect(held.stateKind).toBe('ready');
    expect(heldTitle('Shawn Miller', 'Tom Kamantauskas')).toBe(held.title);
    const [same] = await applyRecipientHolds({}, [item({ key: 'first_touch:dec-1' })], async () => ({ name: 'Kamantauskas, Tom', email: null }));
    expect(same.hold).toBeUndefined();
    expect(same.title).toBe('Ready for a first touch: Tom Kamantauskas');
  });

  it('a failed or empty pack read, a card with no person, or a non-ready item leaves the item as it is', async () => {
    const [fail] = await applyRecipientHolds({}, [item({ key: 'a' })], async () => { throw new Error('boom'); });
    expect(fail.hold).toBeUndefined();
    const [none] = await applyRecipientHolds({}, [item({ key: 'b' })], async () => null);
    expect(none.hold).toBeUndefined();
    const [noPerson] = await applyRecipientHolds({}, [item({ key: 'c', person: null })], async () => ({ name: 'Shawn Miller', email: null }));
    expect(noPerson.hold).toBeUndefined();
    const [deal] = await applyRecipientHolds({}, [item({ key: 'd', kind: 'deal', stateKind: 'in_deal', title: 'In a deal' })], async () => ({ name: 'Shawn Miller', email: null }));
    expect(deal.hold).toBeUndefined();
    expect(deal.title).toBe('In a deal');
  });
});

describe('cutWords', () => {
  it('cuts at a word with an ellipsis, drops a quoted header after their own words, and leaves a short reply whole', () => {
    const long = 'Hey Casey, good to hear from you. Honestly, I have only met him once on video a few years back, so I would not be the right person to make the introduction, but I can ask around our transportation group and see who owns the yard side of things at the Chattanooga campus these days.';
    const cut = cutWords(long);
    expect(cut.length).toBeLessThanOrEqual(204);
    expect(cut.endsWith('...')).toBe(true);
    expect(cut).not.toMatch(/\s\S{1,2}\.\.\.$/);
    expect(cut.replace(/\.\.\.$/, '')).toBe(long.slice(0, cut.length - 3).trimEnd());
    expect(cutWords('stop From: Casey Larkin Sent: Monday, October 5, 2026 9:34 AM To: Tim Cooper')).toBe('stop');
    expect(cutWords('Poking holes in the Primo record now.')).toBe('Poking holes in the Primo record now.');
  });
});
