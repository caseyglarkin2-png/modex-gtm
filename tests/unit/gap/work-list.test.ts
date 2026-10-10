/**
 * UX-08 WORK LIST: one card per account in the NEXT UP order; replies classified before they rank (a human reply
 * heads the list, an opt-out never does, an automatic reply is not work); a held account is never a cold action and
 * lists last under In a deal; the chip counts are the filtered contents (N4); search keeps the order.
 */
import { describe, expect, it } from 'vitest';
import { buildWorkList, filterWork, snoozedWork, workCounts, workDay, type WorkInput } from '@/lib/gap/work/list';
import type { WorkOutcome } from '@/lib/gap/work/outcome';
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
  // Batch item 8: research and holds are parked (never "needs you"), listed after every card that needs the seller; the
  // opt-out to record is admin only the seller can do, so it needs the seller and sits after the decide card.
  it('one card per account, the human reply first, then ready, decide, the cold follow-up (A2, 2026-10-09: evidence ranks the executable work, and a follow-up on a cold touch with no reply ever is the lowest of it), the opt-out (admin, never cold work); then parked: research, deals last', () => {
    const cards = buildWorkList(input());
    expect(cards.map((c) => [c.accountName, c.stateKind])).toEqual([
      ['NFI Industries', 'replied'],
      ['PepsiCo', 'ready'],
      ['General Mills', 'decide'],
      ['H-E-B', 'follow_up'],
      ['Walmart Inc.', 'opted_out'],
      ['Tyson Foods', 'research'],
      ['Dollar General', 'unknown_deal'],
      ['Kroger', 'in_deal'],
    ]);
    expect(cards.every((c) => c.source === 'cockpit')).toBe(true);
    expect(new Set(cards.map((c) => c.accountName)).size).toBe(cards.length);
    expect(cards.map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(cards[0].href).toBe('/gap/accounts/nfi-industries?from=work&i=0');
  });
  it('a reply IS the account card: a review one-off at Walmart never erases yesterday\'s stop, and the human reply at NFI beats its research chore', () => {
    const cards = buildWorkList(input({ candidates: [...input().candidates, cand('review', 'Walmart Inc.', 'Decide the Walmart Inc. hypothesis', [-1, 1]), cand('research', 'NFI Industries', 'Research NFI Industries', [-1, 1])] }));
    const walmart = cards.find((c) => c.accountName === 'Walmart Inc.')!;
    expect(walmart.stateKind).toBe('opted_out');
    expect(walmart.next?.label).toBe('Record the opt-out');
    expect(walmart.blocker).toMatch(/They asked not to be contacted: record it/);
    expect(cards.filter((c) => c.accountName === 'Walmart Inc.')).toHaveLength(1);
    expect(cards[0]).toMatchObject({ accountName: 'NFI Industries', stateKind: 'replied' });
  });
  it('replies are classified before they rank: the opt-out never heads the list over real work, and says what to do; with only research and holds left it is the one thing that needs the seller; the automatic reply is not work', () => {
    const cards = buildWorkList(input());
    const walmart = cards.find((c) => c.accountName === 'Walmart Inc.')!;
    expect(cards[0].accountName).not.toBe('Walmart Inc.');
    const onlyAdmin = buildWorkList(input({ candidates: [cand('research', 'Tyson Foods', 'Research Tyson Foods', [-1, 2])], replies: [{ accountName: 'Walmart Inc.', contactEmail: 'timothy.cooper@walmart.com', subject: null, snippet: 'stop', receivedAt: '2026-10-05T14:00:00Z' }] }));
    expect(onlyAdmin.map((c) => c.accountName)).toEqual(['Walmart Inc.', 'Tyson Foods', 'Dollar General', 'Kroger']);
    expect(walmart.state).toBe('Opted out');
    expect(walmart.why).toMatch(/^timothy\.cooper@walmart\.com wrote Oct 5: "stop"\. They asked not to be contacted: record it as do not contact\./);
    // R60, capture once: the opt-out is recorded in Capture opened on the reply (its one entry), never a lane.
    expect(walmart.next?.label).toBe('Record the opt-out');
    expect(walmart.next?.href).toMatch(/^\/gap\/capture\?account=Walmart\+Inc\.&.*context=email&from=reply%3A/);
    expect(walmart.capture).toBeNull();
    expect(cards.some((c) => c.accountName === 'FedEx')).toBe(false);
    const nfi = cards[0];
    expect(nfi.state).toBe('Someone replied');
    expect(nfi.blocker).toMatch(/A reply is waiting to be recorded/);
    expect(nfi.next?.label).toBe('Log what they said');
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
    // R60: a lane link never reaches a card: it opens the account, where NEXT holds the move.
    expect(ready.next).toEqual({ label: 'Contact Karen Darling', href: '/gap/accounts/pepsico' });
  });
  it('an unavailable In Deals read claims nothing about deals; a held card still holds', () => {
    const cards = buildWorkList(input({ inDeals: { status: 'unavailable', accounts: [] } }));
    const kroger = cards.find((c) => c.accountName === 'Kroger')!;
    expect(kroger.stateKind).toBe('in_deal');
    expect(kroger.why).toBe('A current card holds this account for an open deal.');
  });
});

describe('a cold load agrees with the workspace (Pass A blocker)', () => {
  it('a deal account takes the hold card whatever research chore the lanes hold', () => {
    const cards = buildWorkList(input({ candidates: [cand('research', 'Kraft Heinz', 'Judge 1 verified fact at Kraft Heinz', [-5, 1])], inDeals: { status: 'complete', accounts: [{ accountName: 'Kraft Heinz', deals: [{ name: 'Kraft Heinz Company - Pilot', stage: 'Solution' }] }] }, held: new Map() }));
    const kh = cards.find((c) => c.accountName === 'Kraft Heinz')!;
    expect(kh).toMatchObject({ stateKind: 'in_deal', lane: 'deals' });
    expect(kh.next?.label).toBe('Open the deal brief');
    expect(cards.filter((c) => c.accountName === 'Kraft Heinz')).toHaveLength(1);
  });
  it('a recorded chosen person with a usable thesis is READY on a cold load; a cold-touch card with no usable thesis is research, never choose who', () => {
    const cards = buildWorkList(input({
      candidates: [cand('research', 'FedEx', 'Research FedEx', [-1, 1]), cand('ready', 'The Home Depot', 'Contact someone', [Number.MAX_SAFE_INTEGER, 2, 1])],
      motions: [{ accountName: 'The Home Depot', state: 'needs_owner', primary: null, next: null }],
      dbState: new Map([
        ['FedEx', { sendable: true, chosen: { name: 'Glen Chaffee', title: 'Managing Director' } }],
        ['The Home Depot', { sendable: false, chosen: null }],
      ]),
    }));
    const fedex = cards.find((c) => c.accountName === 'FedEx')!;
    expect(fedex).toMatchObject({ stateKind: 'ready', state: 'Ready for a first touch: Glen Chaffee', person: { name: 'Glen Chaffee', title: 'Managing Director' } });
    expect(fedex.next).toEqual({ label: 'Prepare the first touch', href: '/gap/accounts/fedex' });
    const thd = cards.find((c) => c.accountName === 'The Home Depot')!;
    expect(thd).toMatchObject({ stateKind: 'research', lane: 'research', state: 'Research: no usable angle to open on yet' });
    expect(thd.next).toEqual({ label: 'Open the account', href: '/gap/accounts/the-home-depot' });
    expect(cards.findIndex((c) => c.accountName === 'FedEx')).toBeLessThan(cards.findIndex((c) => c.accountName === 'The Home Depot'));
    // A reply, an opt-out or a hold still wins over the database's READY.
    const held = buildWorkList(input({ candidates: [], dbState: new Map([['Walmart Inc.', { sendable: true, chosen: { name: 'Doug Estrada', title: null } }], ['Kroger', { sendable: true, chosen: { name: 'Joey Maggard', title: null } }]]) }));
    expect(held.find((c) => c.accountName === 'Walmart Inc.')?.stateKind).toBe('opted_out');
    expect(held.find((c) => c.accountName === 'Kroger')?.stateKind).toBe('in_deal');
  });
});

describe('the canonical pursuit state overrides the cockpit lane on the card', () => {
  it('a fresh summary rewrites the whole card (state, why from NEXT, person, action to the workspace): FedEx READY with Glen, PepsiCo in a deal, H-E-B held with no action', () => {
    const base = input({ candidates: [cand('research', 'FedEx', 'Research FedEx', [-1, 1]), cand('ready', 'PepsiCo', 'Contact Karen Darling', [Number.MAX_SAFE_INTEGER, 1, 5]), cand('research', 'H-E-B', 'Judge 2 verified facts at H-E-B', [-2, 1])] });
    const summaries = new Map([
      ['FedEx', { accountName: 'FedEx', state: 'ready' as const, stateLine: 'Ready for a first touch: Glen Chaffee', person: { name: 'Glen Chaffee', title: 'Managing Director' }, blocker: null, coldTouchAllowed: true, nextText: 'Prepare the first touch to Glen Chaffee.', at: NOW.toISOString() }],
      ['PepsiCo', { accountName: 'PepsiCo', state: 'in_deal' as const, stateLine: 'In a deal', person: null, blocker: 'Work the deal.', coldTouchAllowed: false, nextText: 'Work the deal (Pilot), never a cold first touch.', at: NOW.toISOString() }],
      ['H-E-B', { accountName: 'H-E-B', state: 'held' as const, stateLine: 'Held: family hold', person: null, blocker: 'A sibling account is in motion: no cold touch here until it clears.', coldTouchAllowed: false, nextText: null, at: NOW.toISOString() }],
    ]);
    const cards = buildWorkList({ ...base, summaries });
    const fedex = cards.find((c) => c.accountName === 'FedEx')!;
    expect(fedex).toMatchObject({ stateKind: 'ready', lane: 'ready', state: 'Ready for a first touch: Glen Chaffee', why: 'Prepare the first touch to Glen Chaffee.', person: { name: 'Glen Chaffee', title: 'Managing Director' }, source: 'pursuit', blocker: null });
    expect(fedex.next).toEqual({ label: 'Prepare the first touch', href: '/gap/accounts/fedex' });
    expect(fedex.why).not.toMatch(/missing evidence|Research FedEx/);
    const pepsi = cards.find((c) => c.accountName === 'PepsiCo')!;
    expect(pepsi).toMatchObject({ stateKind: 'in_deal', lane: 'deals', source: 'pursuit', why: 'Work the deal (Pilot), never a cold first touch.' });
    expect(pepsi.next).toEqual({ label: 'Open the deal brief', href: '/gap/accounts/pepsico?view=brief' });
    const heb = cards.find((c) => c.accountName === 'H-E-B')!;
    expect(heb).toMatchObject({ stateKind: 'held', lane: 'deals', state: 'Held: family hold', why: 'A sibling account is in motion: no cold touch here until it clears.' });
    expect(heb.next).toBeNull();
    expect(heb.blocker).toBeNull(); // said once
    expect(cards.findIndex((c) => c.accountName === 'FedEx')).toBeLessThan(cards.findIndex((c) => c.accountName === 'PepsiCo'));
  });
  it('a stale READY summary never lifts a hold: a deal, an unknown or a held card stands unless the summary is itself a hold', () => {
    const ready = (name: string) => [name, { accountName: name, state: 'ready' as const, stateLine: `Ready for a first touch: Someone`, person: { name: 'Someone', title: null }, blocker: null, coldTouchAllowed: true, nextText: 'Prepare the first touch to Someone.', at: NOW.toISOString() }] as const;
    const cards = buildWorkList(input({ summaries: new Map([ready('Kroger'), ready('Dollar General')]) }));
    expect(cards.find((c) => c.accountName === 'Kroger')).toMatchObject({ stateKind: 'in_deal', source: 'cockpit' });
    expect(cards.find((c) => c.accountName === 'Dollar General')).toMatchObject({ stateKind: 'unknown_deal', source: 'cockpit' });
    expect(cards.every((c) => !(['in_deal', 'unknown_deal', 'held'].includes(c.stateKind) && /first touch/i.test(c.next?.label ?? '')))).toBe(true);
    const dealSummary = buildWorkList(input({ summaries: new Map([['Kroger', { accountName: 'Kroger', state: 'in_deal' as const, stateLine: 'In a deal: YardFlow - Kroger', person: null, blocker: 'Work the deal.', coldTouchAllowed: false, nextText: 'Work the deal (YardFlow - Kroger), never a cold first touch.', at: NOW.toISOString() }]]) }));
    expect(dealSummary.find((c) => c.accountName === 'Kroger')).toMatchObject({ stateKind: 'in_deal', source: 'pursuit', why: 'Work the deal (YardFlow - Kroger), never a cold first touch.' });
  });
  it('a relationship-led account offers the warm touch, never the first touch', () => {
    const cards = buildWorkList(input({ candidates: [cand('research', 'Tyson Foods', 'Research Tyson Foods', [-1, 1])], summaries: new Map([['Tyson Foods', { accountName: 'Tyson Foods', state: 'ready' as const, stateLine: 'Relationship-led: Ryan Heman', person: { name: 'Ryan Heman', title: null }, blocker: null, coldTouchAllowed: true, nextText: 'Log the warm touch with Ryan Heman; a cold email to anyone else waits for their answer.', at: NOW.toISOString() }]]) }));
    expect(cards.find((c) => c.accountName === 'Tyson Foods')?.next).toEqual({ label: 'Log the warm touch', href: '/gap/capture?account=Tyson%20Foods' });
  });
  it('a stale READY summary never overwrites a reply that landed after it; a replied summary does', () => {
    const base = input({ candidates: [cand('research', 'Walmart Inc.', 'Research Walmart Inc.', [-1, 1])] });
    const ready = { accountName: 'Walmart Inc.', state: 'ready' as const, stateLine: 'Ready for a first touch: Doug Estrada', person: { name: 'Doug Estrada', title: null }, blocker: null, coldTouchAllowed: true, nextText: 'Prepare the first touch to Doug Estrada.', at: NOW.toISOString() };
    const stale = buildWorkList({ ...base, summaries: new Map([['Walmart Inc.', ready]]) }).find((c) => c.accountName === 'Walmart Inc.')!;
    expect(stale.stateKind).toBe('opted_out');
    expect(stale.next?.label).toBe('Record the opt-out');
    const replied = { ...ready, state: 'replied' as const, stateLine: 'Someone replied', nextText: 'Read the reply and record what they said.' };
    const fresh = buildWorkList({ ...base, summaries: new Map([['Walmart Inc.', replied]]) }).find((c) => c.accountName === 'Walmart Inc.')!;
    expect(fresh).toMatchObject({ stateKind: 'replied', source: 'pursuit', why: 'Read the reply and record what they said.' });
  });
});

describe('counts and filters', () => {
  it('the chip counts are the filtered contents; the filter and the search keep the Work order', () => {
    const cards = buildWorkList(input());
    const counts = workCounts(cards);
    expect(counts).toEqual({ all: 8, commitments: 0, replies: 2, follow_up: 1, ready: 1, review: 1, research: 1, deals: 2 });
    for (const f of ['commitments', 'replies', 'follow_up', 'ready', 'review', 'research', 'deals'] as const) expect(filterWork(cards, f, '')).toHaveLength(counts[f]);
    expect(filterWork(cards, 'all', 'pep').map((c) => c.accountName)).toEqual(['PepsiCo']);
    expect(filterWork(cards, 'replies', 'WAL').map((c) => c.accountName)).toEqual(['Walmart Inc.']);
    expect(filterWork(cards, 'all', '').map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('outcomes on the Work list (R14)', () => {
  const o = (accountName: string, kind: WorkOutcome['kind'], until: string, reason: string | null = null): [string, WorkOutcome] => [accountName, { accountName, kind, reason, until, by: 'casey@freightroll.com', at: '2026-10-06T14:00:00Z' }];
  it('a snoozed account leaves the list and is counted in the footer; a skipped or logged one drops to the end with its line; a reply or an opt-out is never hidden by a seller note', () => {
    const outcomes = new Map([o('PepsiCo', 'snoozed', '2026-10-09T12:00:00Z', 'travel'), o('H-E-B', 'skipped', '2026-10-07T04:00:00Z'), o('General Mills', 'logged', '2026-10-07T04:00:00Z', 'called Jo'), o('NFI Industries', 'snoozed', '2026-10-20T12:00:00Z'), o('Walmart Inc.', 'skipped', '2026-10-07T04:00:00Z')]);
    const cards = buildWorkList(input({ outcomes }));
    const names = cards.map((c) => c.accountName);
    expect(names).not.toContain('PepsiCo');
    // The reply (NFI) and the opt-out (Walmart) stay where the buyer's move puts them.
    expect(names[0]).toBe('NFI Industries');
    expect(cards.find((c) => c.accountName === 'Walmart Inc.')?.outcome).toBeUndefined();
    // Skipped and logged accounts come after research, before the deals, with their lines.
    const heb = cards.find((c) => c.accountName === 'H-E-B')!;
    const mills = cards.find((c) => c.accountName === 'General Mills')!;
    expect(heb.outcome?.line).toBe('Skipped for today, you, today.');
    expect(mills.outcome?.line).toBe('Logged outside GAP (called Jo), you, today.');
    expect(names.indexOf('Tyson Foods')).toBeLessThan(names.indexOf('H-E-B'));
    expect(names.indexOf('H-E-B')).toBeLessThan(names.indexOf('Kroger'));
    // The footer lists the snoozed accounts that left, by date.
    expect(snoozedWork(outcomes, cards, NOW)).toEqual([{ accountName: 'PepsiCo', line: 'Snoozed until Oct 9 (travel), you, today.', until: '2026-10-09T12:00:00Z' }]);
    // Without outcomes nothing changes.
    expect(buildWorkList(input()).map((c) => c.outcome)).toEqual(buildWorkList(input()).map(() => undefined));
  });
});

describe('a motion in flight on the Work list (R14, as ranked by R41)', () => {
  // R41 changed one R14 rule on purpose: a first touch that WENT OUT is waiting on the buyer (then on the follow-up's
  // interval), so it is listed under Waiting, counted, and no longer a card that inflates "needs you". An outstanding
  // GAP draft is still work (send or discard it) and stays a card.
  it('a proven send is WAITING (never a cold READY, never dropped); an outstanding draft is a card; a reply or a hold still wins the account', () => {
    const inMotion = new Map([
      ['PepsiCo', { state: 'sent' as const, at: '2026-10-06T14:00:00Z', person: { name: 'Karen Darling', title: 'Senior Director - PBNA Transportation' } }],
      ['Mondelez', { state: 'drafted' as const, at: '2026-10-06T13:00:00Z', person: { name: 'Pat Lee', title: null } }],
      ['Kroger', { state: 'sent' as const, at: '2026-10-05T14:00:00Z', person: null }],
      ['NFI Industries', { state: 'sent' as const, at: '2026-10-05T14:00:00Z', person: null }],
    ]);
    const day = workDay(input({ inMotion }));
    const names = day.cards.map((c) => c.accountName);
    expect(names).not.toContain('PepsiCo');
    expect(day.waiting.find((w) => w.accountName === 'PepsiCo')).toMatchObject({ kind: 'motion', title: 'First touch out to Karen Darling', line: 'Sent Oct 6; waiting on their reply. The next person unlocks after 5 business days without one.' });
    const mondelez = day.cards.find((c) => c.accountName === 'Mondelez')!;
    expect(mondelez.state).toBe('A GAP draft to Pat Lee is outstanding');
    expect(mondelez.tier).toBe('ready');
    // The reply at NFI wins over the motion; Kroger is held by its deal: the motion never lifts the hold.
    expect(names.indexOf('NFI Industries')).toBe(0);
    expect(day.cards.find((c) => c.accountName === 'NFI Industries')?.stateKind).toBe('replied');
    expect(day.cards.find((c) => c.accountName === 'Kroger')?.stateKind).toBe('in_deal');
    expect(day.waiting.map((w) => w.accountName)).toEqual(['PepsiCo']);
    // Batch item 8: Tyson (research), Dollar General and Kroger (holds) are parked, never "needs you".
    expect(day.counts).toMatchObject({ needsYou: 5, parked: 3, waiting: 1 });
    // A READY summary read before the touch is stale against it: still waiting. One read after it agrees: waiting.
    const stale = new Map([['PepsiCo', { accountName: 'PepsiCo', state: 'ready' as const, stateLine: 'Ready for a first touch: Karen Darling', person: { name: 'Karen Darling', title: null }, blocker: null, coldTouchAllowed: true, nextText: 'Prepare the first touch to Karen Darling.', at: '2026-10-06T13:50:00Z' }]]);
    expect(workDay(input({ inMotion, summaries: stale })).cards.map((c) => c.accountName)).not.toContain('PepsiCo');
    const fresh = new Map([['PepsiCo', { ...stale.get('PepsiCo')!, state: 'in_motion' as const, stateLine: 'First touch in motion: Karen Darling', nextText: 'Karen Darling has the first touch.', at: '2026-10-06T14:10:00Z' }]]);
    expect(workDay(input({ inMotion, summaries: fresh })).waiting.map((w) => w.accountName)).toEqual(['PepsiCo']);
    // A newer summary that says the account is held (a conversation the motion saw) brings the card back.
    const heldNow = new Map([['PepsiCo', { ...stale.get('PepsiCo')!, state: 'replied' as const, stateLine: 'Someone replied: Karen Darling', blocker: 'Paused: Karen Darling answered.', at: '2026-10-06T15:00:00Z' }]]);
    const back = workDay(input({ inMotion, summaries: heldNow }));
    expect(back.cards.find((c) => c.accountName === 'PepsiCo')?.stateKind).toBe('replied');
    expect(back.waiting.map((w) => w.accountName)).toEqual([]);
  });
});

describe('paused reply (Casey, 2026-10-10): the card says the reply on record and the paused first touch, apart, and keeps the message', () => {
  const NFI_WORDS = 'Send me the two-site comparison and we can talk Thursday.';
  const RECEIVED = `A reply from ops@nfiindustries.com on Oct 6 was received ("${NFI_WORDS}").`;
  const PAUSED = 'The proposed first touch to Sam Ortiz is paused by the send gate: the reply is not recorded yet; nothing was sent.';
  const pausedMotion = { accountName: 'NFI Industries', state: 'paused_reply', primary: null, next: { name: 'Sam Ortiz', title: 'VP Transportation', unlock: "after ops@nfiindustries.com's reply is triaged in Replies" }, pausedBy: { from: 'ops@nfiindustries.com', receivedAt: '2026-10-06T09:00:00.000Z', snippet: NFI_WORDS, id: 'm-nfi' } };

  it('a reply row under the hold: the state, the why (received, their words) and the blocker (paused, nothing sent) are two sentences; the message panel stays; never "Someone replied" alone', () => {
    const card = buildWorkList(input({ motions: [...input().motions, pausedMotion] })).find((c) => c.accountName === 'NFI Industries')!;
    expect(card.stateKind).toBe('replied');
    expect(card.state).toBe('Reply on record: ops@nfiindustries.com, Oct 6. First touch to Sam Ortiz paused, nothing sent');
    expect(card.why).toBe(RECEIVED);
    expect(card.blocker).toBe(PAUSED);
    expect(card.paused).toMatchObject({ reply: { from: 'ops@nfiindustries.com', words: NFI_WORDS }, proposed: { kind: 'first_touch', to: 'Sam Ortiz' }, reason: 'reply_unrecorded' });
    expect(card.reply?.snippet).toBe(NFI_WORDS);
    expect(`${card.state} ${card.why} ${card.blocker}`).not.toMatch(/Someone replied/);
    // No hold, no pause: the reply alone, as before.
    const plain = buildWorkList(input()).find((c) => c.accountName === 'NFI Industries')!;
    expect(plain.paused).toBeUndefined();
    expect(plain.state).toBe('Someone replied');
    expect(plain.blocker).toBe('A reply is waiting to be recorded.');
  });

  it("the workspace's pause speaks over a card with no message panel (the gate saw a domain the reply list does not), and a summary remembered before the fix never undoes the card's own pause", () => {
    const paused = { accountName: 'PepsiCo', reply: { name: 'Karen Darling', from: 'karen.darling@pepsico.com', at: '2026-10-06T13:00:00.000Z', words: 'We are moving the Plano DC first.', id: 'm-karen' }, proposed: { kind: 'first_touch' as const, to: 'Shawn Miller' }, reason: 'reply_unrecorded' as const };
    const summary = new Map([['PepsiCo', { accountName: 'PepsiCo', state: 'replied' as const, stateLine: 'Reply on record: Karen Darling, Oct 6. First touch to Shawn Miller paused, nothing sent', person: { name: 'Karen Darling', title: null }, blocker: 'x', coldTouchAllowed: false, nextText: "Read Karen Darling's reply of Oct 6 and record what they said.", paused, at: '2026-10-06T14:30:00Z' }]]);
    const card = buildWorkList(input({ summaries: summary })).find((c) => c.accountName === 'PepsiCo')!;
    expect(card.source).toBe('pursuit');
    expect(card.state).toBe('Reply on record: Karen Darling, Oct 6. First touch to Shawn Miller paused, nothing sent');
    expect(card.why).toBe('A reply from Karen Darling on Oct 6 was received ("We are moving the Plano DC first.").');
    expect(card.blocker).toBe('The proposed first touch to Shawn Miller is paused by the send gate: the reply is not recorded yet; nothing was sent.');
    expect(card.paused).toEqual(paused);
    const older = new Map([['NFI Industries', { accountName: 'NFI Industries', state: 'replied' as const, stateLine: 'Someone replied: ops@nfiindustries.com', person: { name: 'ops@nfiindustries.com', title: null }, blocker: 'Paused: ops@nfiindustries.com at NFI Industries wrote in on 2026-10-06.', coldTouchAllowed: false, nextText: 'Read the reply.', at: '2026-10-06T14:30:00Z' }]]);
    const nfi = buildWorkList(input({ motions: [...input().motions, pausedMotion], summaries: older })).find((c) => c.accountName === 'NFI Industries')!;
    expect(nfi.state).toBe('Reply on record: ops@nfiindustries.com, Oct 6. First touch to Sam Ortiz paused, nothing sent');
    expect([nfi.why, nfi.blocker]).toEqual([RECEIVED, PAUSED]);
  });
});
