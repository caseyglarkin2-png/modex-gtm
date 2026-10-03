/**
 * Click test round 3 (2026-10-03), verified live on production before the fix:
 *   - a relationship WHO said only "Ryan Heman / You have a way in: Inland26 contact (field guide note, Sep 24)":
 *     no employer, no title, and "Inland26" never said it is a conference Casey attended
 *   - WHY NOW led with a closure "announced this week" published 50 days ago (Sources calls it past the window)
 *   - machine words in seller copy: "Hiring signal (V2):", a "(2)" filing index
 *   - the same filing sentence twice in BRIEF ("(2) Divestitures During ..." and "(2) During ...")
 */
import { describe, expect, it } from 'vitest';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';
import { projectEngagement, projectRelationship, type AccountContext } from '@/lib/gap/context/context';
import { projectNow } from '@/lib/gap/context/now';
import { projectBrief } from '@/lib/gap/context/brief';

const NOW = new Date('2026-10-03T12:00:00Z');
const fact = { id: 'f1', quote: 'Acme Foods will open a new distribution center in Reno in 2027.', url: 'https://news.example/reno', title: 'news', publishedAt: '2026-09-20T00:00:00Z', expiresAt: '2027-01-08T00:00:00Z', continuity: 'event' as const, currentness: null };
const person = { id: 1, name: 'Rick Barrett', title: 'Director of Transportation', doNotContact: false, hasEmail: true, emailStatus: 'valid' };
const inputs = (over: Partial<AccountInputs> = {}): AccountInputs => ({
  account: { name: 'Acme Foods', tier: null, priorityBand: null, vertical: 'cpg', parentBrand: null, hubspotCompanyId: '42' },
  aliases: [], domains: ['acmefoods.com'], siblings: [], watched: true, watchReasons: ['priority'],
  facts: [fact], signals: [], lastResearch: null, hypotheses: [], bids: [], personas: [person], candidates: [], memberships: [], firstTouches: [], conversation: null,
  opportunity: { status: 'CLEAR', detail: '', deals: [] }, pack: null, microsite: null, facilityFact: null, roi: null,
  ...over,
});
const ctx = (): AccountContext => ({
  relationship: projectRelationship({ restriction: null, account: { best_intro_path: null, owner: 'Casey' }, personas: [], memberships: [], meetings: [], emails: [], now: NOW }),
  engagement: projectEngagement([], NOW), history: [], assets: [], legacyNote: null,
});
const view = (over: Partial<AccountInputs> = {}) => { const i = inputs(over); return projectNow(buildAccountBrief(i, NOW), ctx(), i, NOW); };

const met = (name: string, title: string | null = null) => ({ sourceName: 'Inland26 · Chicago', sourceType: 'conference', relationshipContext: 'Inland26 contact (field guide note, Sep 24)', personName: name, title, company: 'Acme Foods' });

describe('a relationship WHO says who they are and how Casey knows them', () => {
  it('names the employer and the event, flags a missing title, and names the others met there', () => {
    const v = view({ facts: [], memberships: [met('Ryan Heman'), met('Todd Skidmore'), met('Damian Elsken')] });
    expect(v.who?.name).toBe('Ryan Heman');
    expect(v.who?.why).toBe('You met them at Inland26 · Chicago (a conference); works at Acme Foods. Title not on record: confirm it before you write.');
    expect(v.next.text).toBe('Reach out to Ryan Heman (Acme Foods), who you met at Inland26 · Chicago, and ask for their perspective. Also met there: Todd Skidmore, Damian Elsken. GAP drafts nothing yet.');
  });
  it('prefers the person met whose title is on record, and shows that title', () => {
    const v = view({ facts: [], memberships: [met('Ryan Heman'), met('Todd Skidmore', 'Director of Logistics')] });
    expect(v.who).toMatchObject({ name: 'Todd Skidmore', title: 'Director of Logistics' });
    expect(v.who?.why).not.toMatch(/Title not on record/);
  });
});

describe('WHY NOW is inside the catalyst window', () => {
  it('a checked event published more than 45 days ago is not WHY NOW', () => {
    const old = { ...fact, id: 'f2', quote: 'Acme Foods announced this week that it will close its Eagle Mountain facility.', publishedAt: '2026-08-14T00:00:00Z' };
    const v = view({ facts: [fact, old] });
    expect(v.whyNow.map((l) => l.text).join(' ')).not.toMatch(/Eagle Mountain/);
    expect(v.whyNow.map((l) => l.text).join(' ')).toMatch(/Reno/);
  });
});

describe('no machine words in seller copy', () => {
  it('drops "(V2)" and a filing index; keeps the source host of a signal', () => {
    const sig = { id: 's1', title: 'Hiring signal (V2): Acme Careers posting R-1, Transportation Engineering, yard modernization (careers.acmefoods.com)', url: 'https://careers.acmefoods.com/x', publishedAt: '2026-10-01T00:00:00Z', capturedAt: '2026-10-01T00:00:00Z', note: null } as never;
    const filing = { ...fact, id: 'f3', quote: '(2) During the fourth quarter, Acme Foods agreed to open a cross-dock in Ohio.', publishedAt: '2026-09-25T00:00:00Z' };
    const v = view({ facts: [fact, filing], signals: [sig] });
    const text = v.whyNow.map((l) => l.text).join(' | ');
    expect(text).not.toMatch(/\(V\d\)|\(2\)/);
    expect(text).toMatch(/yard modernization \(careers\.acmefoods\.com\)$/);
    expect(text).toMatch(/Hiring signal: Acme Careers posting/);
    expect(text).toMatch(/During the fourth quarter, Acme Foods agreed/);
  });
});

describe('BRIEF says one filing sentence once', () => {
  it('two extractions of the same sentence (one with a heading word) collapse to one', () => {
    const a = { ...fact, id: 'f4', quote: '(2) Divestitures During the fourth quarter of fiscal 2026, we entered into a definitive agreement to sell our business in Brazil to a coffee company.', publishedAt: '2026-09-23T00:00:00Z' };
    const b = { ...a, id: 'f5', quote: '(2) During the fourth quarter of fiscal 2026, we entered into a definitive agreement to sell our business in Brazil to a coffee company.' };
    const i = inputs({ facts: [fact, a, b] });
    const br = projectBrief(buildAccountBrief(i, NOW), ctx(), i, NOW);
    const all = JSON.stringify(br);
    expect(all.match(/sell our business in Brazil/g)?.length).toBe(1);
  });
});

describe('fit evidence is cut at a word, never mid-word', () => {
  it('a long fact quote ends on a whole word and an ellipsis', async () => {
    const { accountFit } = await import('@/lib/gap/account-intel/build');
    const long = { ...fact, id: 'f6', quote: 'Acme Foods has announced the sudden closure of its beef plant in Joslin, Illinois, throwing more than 2,500 union workers out of work.' };
    const ev = accountFit(inputs({ facts: [long] }), NOW).evidence.find((e) => e.startsWith('fact:'))!;
    expect(ev).toBe('fact: Acme Foods has announced the sudden closure of its beef plant in Joslin, Illinois,…');
  });
});
