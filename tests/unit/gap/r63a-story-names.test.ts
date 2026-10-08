/**
 * R63-A B4: the Nfi story credited the reply to the wrong person: "Person6 Scratch, Director, Yard Operations replied
 * on Oct 7" though Person1 wrote it (the name key dropped digits, so every "PersonN Scratch" was one person, and the
 * last one won). The matrix (acceptB) found the same surface: "buyer said, ben@deals-scope-co-....example.com, Oct 7".
 * The story names a reply's sender by the message's from address resolved to the person on record, and a buyer
 * statement's speaker by the person on record at its address, never by an address.
 */
import { describe, expect, it } from 'vitest';
import { mergeTouches } from '@/lib/gap/story/touches';
import { loadAccountInputs } from '@/lib/gap/account-intel/load';

const NOW = new Date('2026-10-07T22:00:00Z');
const PEOPLE = [
  { name: 'Person1 Scratch', title: 'VP Transportation', email: 'person1@nfi-scratch-co-r63.example.com' },
  { name: 'Person6 Scratch', title: 'Director, Yard Operations', email: 'person6@nfi-scratch-co-r63.example.com' },
];
const reply = (from: string, address: string | null) => ({ from, at: '2026-10-07T19:49:00.000Z', snippet: 'Hi Casey, the detention charges are killing us.', kind: 'human' as const, label: 'Someone replied', address });

describe('R63-A B4: the story names the person who actually replied', () => {
  it('by the message\'s from address, then by a name with its digits; never the account\'s other person', () => {
    const byAddress = mergeTouches({ history: [], firstTouches: [], clawd: null, replies: [reply('Person1 Scratch', 'person1@nfi-scratch-co-r63.example.com')], people: PEOPLE, now: NOW });
    expect(byAddress[0]).toMatchObject({ kind: 'reply', name: 'Person1 Scratch', title: 'VP Transportation', address: 'person1@nfi-scratch-co-r63.example.com' });
    // A display name that matches nobody on record still names the sender by the address.
    const signed = mergeTouches({ history: [], firstTouches: [], clawd: null, replies: [reply('Pat from Nfi', 'person1@nfi-scratch-co-r63.example.com')], people: PEOPLE, now: NOW });
    expect(signed[0]).toMatchObject({ name: 'Person1 Scratch', title: 'VP Transportation' });
    const byName = mergeTouches({ history: [], firstTouches: [], clawd: null, replies: [reply('Person1 Scratch', null)], people: PEOPLE.map(({ name, title }) => ({ name, title })), now: NOW });
    expect(byName[0]).toMatchObject({ name: 'Person1 Scratch', title: 'VP Transportation' });
  });

  it('a buyer statement and the recorded conversation name the person on record at the address, never the address', async () => {
    const empty = { findMany: async () => [], findUnique: async () => null, findFirst: async () => null, count: async () => 0 };
    const own = {
      $queryRaw: async () => [{ name: 'Deals Scope Co' }],
      account: { findUnique: async () => ({ name: 'Deals Scope Co', tier: null, priority_band: null, vertical: null, parent_brand: null, hubspot_company_id: null }), findMany: async () => [] },
      persona: { ...empty, findMany: async () => [{ id: 2, name: 'Ben Scratch', title: 'Director, Columbus DC', email: 'ben@deals-scope-co.example.com', do_not_contact: false }] },
      buyerInputData: { ...empty, findMany: async () => [
        { id: 'b1', type: 'metric', normalized_summary: 'We pay about forty thousand a month in detention.', raw_buyer_language: 'We pay about forty thousand a month in detention.', contact_email: 'BEN@deals-scope-co.example.com', captured_at: new Date('2026-10-07T13:00:00Z'), human_confirmed: true, supersedes_id: null, confirmed_at: new Date('2026-10-07T13:00:00Z'), hypothesis_id: null, metadata: null },
        { id: 'b2', type: 'impact', normalized_summary: 'Drivers wait.', raw_buyer_language: 'Drivers wait.', contact_email: 'kwhite@deals-scope-co.example.com', captured_at: new Date('2026-10-07T13:00:00Z'), human_confirmed: true, supersedes_id: null, confirmed_at: new Date('2026-10-07T13:00:00Z'), hypothesis_id: null, metadata: null },
      ] },
      conversationDisposition: { ...empty, findMany: async () => [{ account_name: 'Deals Scope Co', contact_email: 'ben@deals-scope-co.example.com', response_class: 'problem_confirmed', created_at: new Date('2026-10-07T13:00:00Z') }] },
    };
    const p = new Proxy(own, { get: (t, k) => (k in t ? t[k as keyof typeof t] : typeof k === 'string' && !k.startsWith('$') && k !== 'then' ? empty : undefined) }) as never;
    const i = await loadAccountInputs(p, 'Deals Scope Co', NOW);
    expect(i?.bids.map((b) => b.who)).toEqual(['Ben Scratch', 'kwhite']);
    expect(JSON.stringify(i?.bids)).not.toMatch(/"who":"[^"]*@/);
    expect(i?.conversation?.who).toBe('Ben Scratch');
  });
});
