/**
 * UX-08 WORK LIST: one card per account in the NEXT UP order; replies classified before they rank (a human reply
 * heads the list, an opt-out never does, an automatic reply is not work); a held account is never a cold action and
 * lists last under In a deal; the chip counts are the filtered contents (N4); search keeps the order.
 */
import { describe, expect, it } from 'vitest';
import { buildWorkList, filterWork, workCounts, type WorkInput } from '@/lib/gap/work/list';
import type { NextCandidate } from '@/lib/gap/routing/next-up';

const NOW = new Date('2026-10-06T15:00:00Z');
const cand = (lane: NextCandidate['lane'], accountName: string, title: string, sortKey: Array<number | string>, over: Partial<NextCandidate> = {}): NextCandidate => ({ lane, accountName, title, detail: `${accountName}: ${title.toLowerCase()}.`, href: `/gap?lane=${lane}`, sortKey, ...over });
const input = (over: Partial<WorkInput> = {}): WorkInput => ({
  now: NOW,
  candidates: [
    cand('ready', 'PepsiCo', 'Contact Karen Darling', [Number.MAX_SAFE_INTEGER, 1, 5]),
    cand('research', 'PepsiCo', 'Research PepsiCo', [-2, 1]),
    cand('review', 'General Mills', 'Decide the General Mills thesis', [-3, 1]),
    cand('follow_up', 'H-E-B', 'Follow up with Mark', [1_759_000_000_000]),
    cand('research', 'Tyson Foods', 'Find verified evidence for the Tyson Foods thesis', [-1, 2]),
    cand('ready', 'Kroger', 'Contact Joey Maggard', [Number.MAX_SAFE_INTEGER, 1, 6]),
  ],
  replies: [
    { accountName: 'Walmart Inc.', contactEmail: 'timothy.cooper@walmart.com', subject: null, snippet: 'stop', receivedAt: '2026-10-05T14:00:00Z' },
    { accountName: 'FedEx', contactEmail: 'courtney.keen@fedex.com', subject: 'Automatic reply: Network 2.0', snippet: 'I am out of the office with limited access to email', receivedAt: '2026-06-02T14:00:00Z' },
    { accountName: 'NFI Industries', contactEmail: 'ops@nfiindustries.com', subject: 'Re: yards', snippet: 'Send me the two-site comparison and we can talk Thursday.', receivedAt: '2026-10-06T09:00:00Z' },
  ],
  motions: [
    { accountName: 'PepsiCo', state: 'ready', primary: { name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' }, next: null },
    { accountName: 'Kroger', state: 'ready', primary: { name: 'Joey Maggard', title: null }, next: null },
  ],
  inDeals: { status: 'complete', accounts: [{ accountName: 'Kroger', deals: [{ name: 'Kroger yard pilot', stage: 'Proposal' }] }] },
  held: new Map([['Kroger', 'active_opportunity'], ['Dollar General', 'opportunity_unknown']]),
  ...over,
});

describe('buildWorkList', () => {
  it('one card per account, the human reply first, then follow up, ready, decide, research, the opt-out after research (admin, never cold work), deals last', () => {
    const cards = buildWorkList(input());
    expect(cards.map((c) => [c.accountName, c.stateKind])).toEqual([
      ['NFI Industries', 'replied'],
      ['H-E-B', 'follow_up'],
      ['PepsiCo', 'ready'],
      ['General Mills', 'decide'],
      ['Tyson Foods', 'research'],
      ['Walmart Inc.', 'opted_out'],
      ['Dollar General', 'unknown_deal'],
      ['Kroger', 'in_deal'],
    ]);
    expect(cards.every((c) => c.source === 'cockpit')).toBe(true);
    expect(new Set(cards.map((c) => c.accountName)).size).toBe(cards.length);
    expect(cards.map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(cards[0].href).toBe('/gap/accounts/nfi-industries?from=work&i=0');
  });
  it('replies are classified before they rank: the opt-out never heads the list, even when nothing else is ready, and says what to do; the automatic reply is not work', () => {
    const cards = buildWorkList(input());
    const walmart = cards.find((c) => c.accountName === 'Walmart Inc.')!;
    expect(cards[0].accountName).not.toBe('Walmart Inc.');
    const onlyAdmin = buildWorkList(input({ candidates: [cand('research', 'Tyson Foods', 'Research Tyson Foods', [-1, 2])], replies: [{ accountName: 'Walmart Inc.', contactEmail: 'timothy.cooper@walmart.com', subject: null, snippet: 'stop', receivedAt: '2026-10-05T14:00:00Z' }] }));
    expect(onlyAdmin.map((c) => c.accountName)).toEqual(['Tyson Foods', 'Walmart Inc.', 'Dollar General', 'Kroger']);
    expect(walmart.state).toBe('Opted out');
    expect(walmart.why).toMatch(/^timothy\.cooper@walmart\.com wrote Oct 5: "stop"\. They asked not to be contacted: record it as do not contact\./);
    expect(walmart.next).toEqual({ label: 'Record the opt-out', href: '/gap?lane=replies' });
    expect(cards.some((c) => c.accountName === 'FedEx')).toBe(false);
    const nfi = cards[0];
    expect(nfi.state).toBe('Someone replied');
    expect(nfi.blocker).toMatch(/No cold email to anyone here until it is recorded/);
    expect(nfi.next?.label).toBe('Read the reply and record what they said');
  });
  it('a held account is never a cold action: Kroger lists In a deal with the deal brief, its READY card dropped; UNKNOWN is a caution with no action', () => {
    const cards = buildWorkList(input());
    const kroger = cards.find((c) => c.accountName === 'Kroger')!;
    expect(kroger.lane).toBe('deals');
    expect(kroger.why).toBe('Open HubSpot deal: "Kroger yard pilot" (Proposal).');
    expect(kroger.next).toEqual({ label: 'Open the deal brief', href: '/gap/accounts/kroger?view=brief' });
    expect(kroger.blocker).toMatch(/No cold first touch while the deal is open/);
    expect(cards.filter((c) => c.accountName === 'Kroger')).toHaveLength(1);
    const dg = cards.find((c) => c.accountName === 'Dollar General')!;
    expect(dg.state).toBe('Held: HubSpot could not be checked');
    expect(dg.next).toBeNull();
    expect(dg.blocker).toMatch(/Check HubSpot directly/);
  });
  it('the ready card names the motion primary as the next person; a candidate that fails its gate is skipped', () => {
    const cards = buildWorkList(input({ candidates: [cand('ready', 'PepsiCo', 'Contact Karen Darling', [1], { failsGate: true }), cand('research', 'PepsiCo', 'Research PepsiCo', [-2, 1])] }));
    const pepsi = cards.find((c) => c.accountName === 'PepsiCo')!;
    expect(pepsi.stateKind).toBe('research');
    const ready = buildWorkList(input()).find((c) => c.accountName === 'PepsiCo')!;
    expect(ready.person).toEqual({ name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' });
    expect(ready.next).toEqual({ label: 'Contact Karen Darling', href: '/gap?lane=ready' });
  });
  it('an unavailable In Deals read claims nothing about deals; a held card still holds', () => {
    const cards = buildWorkList(input({ inDeals: { status: 'unavailable', accounts: [] } }));
    const kroger = cards.find((c) => c.accountName === 'Kroger')!;
    expect(kroger.stateKind).toBe('in_deal');
    expect(kroger.why).toBe('A current card holds this account for an open deal.');
  });
});

describe('the canonical pursuit state overrides the cockpit lane on the card', () => {
  it('FedEx reads READY with Glen from a fresh summary while the cockpit only had research; a hold from the read removes the cold action', () => {
    const base = input({ candidates: [cand('research', 'FedEx', 'Research FedEx', [-1, 1]), cand('ready', 'PepsiCo', 'Contact Karen Darling', [Number.MAX_SAFE_INTEGER, 1, 5])] });
    const summaries = new Map([
      ['FedEx', { accountName: 'FedEx', state: 'ready' as const, stateLine: 'Ready for a first touch: Glen Chaffee', person: { name: 'Glen Chaffee', title: 'Managing Director' }, blocker: null, coldTouchAllowed: true, at: NOW.toISOString() }],
      ['PepsiCo', { accountName: 'PepsiCo', state: 'in_deal' as const, stateLine: 'In a deal', person: null, blocker: 'Work the deal.', coldTouchAllowed: false, at: NOW.toISOString() }],
    ]);
    const cards = buildWorkList({ ...base, summaries });
    const fedex = cards.find((c) => c.accountName === 'FedEx')!;
    expect(fedex).toMatchObject({ stateKind: 'ready', lane: 'ready', state: 'Ready for a first touch: Glen Chaffee', person: { name: 'Glen Chaffee', title: 'Managing Director' }, source: 'pursuit' });
    const pepsi = cards.find((c) => c.accountName === 'PepsiCo')!;
    expect(pepsi).toMatchObject({ stateKind: 'in_deal', lane: 'deals', source: 'pursuit' });
    expect(pepsi.next).toEqual({ label: 'Open the deal brief', href: '/gap/accounts/pepsico?view=brief' });
    expect(cards.findIndex((c) => c.accountName === 'FedEx')).toBeLessThan(cards.findIndex((c) => c.accountName === 'PepsiCo'));
  });
});

describe('counts and filters', () => {
  it('the chip counts are the filtered contents; the filter and the search keep the Work order', () => {
    const cards = buildWorkList(input());
    const counts = workCounts(cards);
    expect(counts).toEqual({ all: 8, replies: 2, follow_up: 1, ready: 1, review: 1, research: 1, deals: 2 });
    for (const f of ['replies', 'follow_up', 'ready', 'review', 'research', 'deals'] as const) expect(filterWork(cards, f, '')).toHaveLength(counts[f]);
    expect(filterWork(cards, 'all', 'pep').map((c) => c.accountName)).toEqual(['PepsiCo']);
    expect(filterWork(cards, 'replies', 'WAL').map((c) => c.accountName)).toEqual(['Walmart Inc.']);
    expect(filterWork(cards, 'all', '').map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
