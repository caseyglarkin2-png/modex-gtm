/**
 * R63-A B3: the tomorrow preview (/gap/?day=tomorrow) planned outreach that must not happen: Costco and Sysco "Ready
 * for a first touch"; Nfi "1 person, ready for outreach" though the buyer replied today and is owed a case study;
 * Walmart "1 person, ready for outreach" after its do not contact was recorded. The preview read the remembered
 * summaries at tomorrow's time (they aged out) and fell back to lane cards that knew no conversation. It now starts
 * from what the workspace says now, and Work (today and tomorrow alike) holds a cold-work card for a recorded
 * conversation the way the page's approach does; the closure holds (R63-B S12) apply to the preview too.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { closureOf } from '@/lib/gap/opportunity/active-opportunity';
import { opportunityHoldOf } from '@/lib/gap/work/opportunity-holds';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
import type { NextCandidate } from '@/lib/gap/routing/next-up';

const TODAY = new Date('2026-10-07T22:10:00Z');
const TOMORROW_8AM = new Date('2026-10-08T12:00:00Z');
const NFI = 'Nfi Scratch Co r63';
const WALMART = 'Walmart Scratch Co r63';
const COSTCO = 'Costco Scratch Co r63';
const SYSCO = 'Sysco Scratch Co r63';
const decide = (accountName: string): NextCandidate => ({ accountName, lane: 'review', title: 'Decide the angle', detail: '1 person, ready for outreach.', href: '/gap?lane=review', sortKey: [accountName] });
const won = closureOf([{ id: '7101', name: `${COSTCO} yard network`, stage: 'closedwon', won: true, closedAt: '2026-09-15T16:00:00.000Z' }], null);
const lost = closureOf([{ id: '7201', name: `${SYSCO} pilot`, stage: 'closedlost', won: false, closedAt: '2026-09-01T16:00:00.000Z' }], null);
const input = (now: Date): WorkInput => ({
  now,
  candidates: [decide(NFI), decide(WALMART)],
  replies: [],
  motions: [],
  held: new Map(),
  inDeals: { status: 'complete', accounts: [] },
  dbState: new Map([[COSTCO, { sendable: true, chosen: { name: 'Val Scratch', title: null } }], [SYSCO, { sendable: true, chosen: { name: 'Lee Scratch', title: null } }]]),
  opportunityHolds: new Map([[COSTCO, opportunityHoldOf({ status: 'CLEAR', companyIds: ['c1'], closure: won })!], [SYSCO, opportunityHoldOf({ status: 'CLEAR', companyIds: ['c1'], closure: lost })!]]),
  conversations: new Map([
    [NFI, { who: 'person1@nfi-scratch-co-r63.example.com', name: 'Person1 Scratch', responseClass: 'problem_confirmed', at: '2026-10-07T21:55:00.000Z' }],
    [WALMART, { who: 'doug@walmart-scratch-co-r63.example.com', name: 'Doug Scratch', responseClass: 'do_not_contact', at: '2026-10-07T21:58:00.000Z' }],
  ]),
});
const cards = (now: Date) => Object.fromEntries(workDay(input(now)).cards.map((c) => [c.accountName, [c.state, c.why]]));

describe('R63-A B3: tomorrow goes through the same stop rules as today', () => {
  for (const [label, now] of [['today', TODAY], ['the tomorrow preview', TOMORROW_8AM]] as const) {
    it(`${label}: no outreach to a held account, a live conversation or a recorded do not contact`, () => {
      const c = cards(now);
      expect(c[COSTCO][0]).toBe('Held: a customer (closed won)');
      expect(c[SYSCO][0]).toBe('Held: parked after a lost deal');
      expect(c[NFI]).toEqual(['Held: in conversation with Person1 Scratch', 'Person1 Scratch: they confirmed the problem (Oct 7, 2026). Work it from that conversation (answer them, keep what you owe), never a cold first touch.']);
      expect(c[WALMART]).toEqual(['Held: do not contact', 'Do not contact: Doug Scratch asked not to be contacted (Oct 7, 2026). Nothing goes to them from here.']);
      expect(JSON.stringify(c)).not.toMatch(/Ready for a first touch|ready for outreach|Decide the angle/);
    });
  }

  it('a live (unrecorded) reply stays the account\'s card; a research card is untouched', () => {
    const i = input(TOMORROW_8AM);
    const day = workDay({ ...i, candidates: [{ accountName: NFI, lane: 'research', title: 'Judge 1 verified fact', detail: 'Research.', href: '/gap?lane=research', sortKey: [NFI] }], replies: [{ accountName: WALMART, contactEmail: 'ann@walmart-scratch-co-r63.example.com', subject: 'Re: trailer turns', snippet: 'Can you send the case study by Friday?', receivedAt: '2026-10-07T21:00:00.000Z', id: 'm1', fromName: 'Ann Scratch' }] });
    const by = Object.fromEntries(day.cards.map((c) => [c.accountName, c.stateKind]));
    expect(by[WALMART]).toBe('replied');
    expect(by[NFI]).toBe('research');
  });

  it('the preview reads the remembered summaries as of now, never at tomorrow\'s time', () => {
    const page = readFileSync('src/app/gap/page.tsx', 'utf8');
    expect(page).toContain('loadPursuitSummaries(prisma, data.workAccounts, realNow)');
    expect(page).not.toContain('loadPursuitSummaries(prisma, data.workAccounts, now)');
  });
});
