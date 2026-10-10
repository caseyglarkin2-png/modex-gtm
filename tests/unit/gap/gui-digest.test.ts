// @vitest-environment node
/**
 * GUI-11 (the Gmail action UI audit, 2026-10-10): the digest template. Every prose line is cleaned (no [[wiki]] syntax,
 * no URL cut mid-way); an item's line and card lines say a state word once; the count basis says its units; the
 * content (intelligence, pursued, plan items) comes before the bookkeeping (how the digest was composed, the
 * producers' coverage, the retained list, the counts); a classifier-only source label reads as the producer's own
 * claim; the HTML is one column, table-free, 640px wide with 16px side padding, and a day of 13 items and 6 records
 * stays well under Gmail's 102 KB clip.
 */
import { describe, expect, it } from 'vitest';
import { renderBriefing, itemCardLines, itemLine, type BriefingIntel } from '@/lib/gap/work/briefing';
import type { IntelItem } from '@/lib/gap/work/intel';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';

const NOW = new Date('2026-10-09T11:30:00Z');
const token = (seed: string) => Buffer.from(`${seed}:`.repeat(24)).toString('base64url').slice(0, 180);
const links = {
  start: `https://modex-gtm.vercel.app/gap/start?t=${token('start')}`,
  work: 'https://modex-gtm.vercel.app/gap/',
  item: (it: PlanItem) => `https://modex-gtm.vercel.app/gap/item?t=${token(it.token)}`,
  decide: (key: string, d: string) => `https://modex-gtm.vercel.app/gap/decide?t=${token(`${key}|${d}`)}`,
  account: (name: string) => `https://modex-gtm.vercel.app/gap/accounts/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
  deal: (name: string) => `https://modex-gtm.vercel.app/gap/accounts/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/?view=brief`,
  intelligence: 'https://modex-gtm.vercel.app/gap/intelligence/',
};
const item = (over: Partial<PlanItem> & { key: string; rank: number; accountName: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, token: 'a'.repeat(32), ...over });
const plan = (items: PlanItem[], counts: Partial<DayPlan['counts']> = {}): DayPlan => ({ day: '2026-10-09', plannedAt: '2026-10-09T11:00:00.000Z', fresh: true, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0, ...counts }, items });
const intelItem = (over: Partial<IntelItem> & { kind: IntelItem['kind']; id: string; title: string }): IntelItem => ({ key: `${over.kind}:${over.id}`, source: 'news.example', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'news.example, published Jun 24, 2026. Historical observation.', accountName: null, accountHint: null, relevance: null, categories: [], person: null, decisions: ['pursue', 'skip', 'dismiss', 'more'], rank: 0, ...over });
const substance = (over: Partial<NonNullable<IntelItem['substance']>> = {}): NonNullable<IntelItem['substance']> => ({ producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerRunId: 'run-1', producerItemId: 'x', recordKind: 'observation', text: 'Kodiak and Charger announced the operation October 8. '.repeat(14), sources: [{ url: 'https://www.nasdaq.com/press-release/kodiak-charger', publisher: 'Nasdaq', label: 'Kodiak-Charger announcement' }, { url: 'https://www.trucknews.com/x', publisher: null, label: 'Truck News' }, { url: 'https://www.laredoedc.org/site-selection/international-trade/', publisher: null, label: 'Laredo trade data' }], sourceRecordIds: [], eventDate: '2026-10-08', reportedOn: '2026-10-09', reportedOnBasis: 'stated', importedAt: '2026-10-09T17:00:00.000Z', producerStatus: null, uncertainty: 'Score: 28/30. Confidence: HIGH on the supervised operation; LOW on driverless timing and scale.', interpretation: 'Why now and buyer read: a live operating deployment, not only a pilot announcement.', personHints: [], suggestions: 0, revisions: 0, ...over });

/** The receipt's day, at size: 13 plan items with cards, 6 records (5 with substance), 5 people, thousands retained. */
function fullDay() {
  const names = ['PepsiCo', 'Kroger', 'Boston Beer', 'Kenco', 'Swire', 'Dole', 'General Mills', 'Lazer Logistics', 'X-Rite', 'Gusto', "Southern Glazer's", 'Tractor Supply', 'Primo'];
  const kinds: PlanItem['kind'][] = ['ready', 'commitment', 'reply', 'follow_up', 'deal', 'ready', 'commitment', 'follow_up', 'review', 'ready', 'follow_up', 'deal', 'ready'];
  const items = names.map((accountName, i) => item({
    key: `${kinds[i]}:${accountName}:2026-10-09`, rank: i, accountName, kind: kinds[i], stateKind: kinds[i] === 'deal' || kinds[i] === 'commitment' ? 'in_deal' : kinds[i] === 'reply' ? 'replied' : kinds[i] === 'follow_up' ? 'follow_up' : 'ready',
    title: kinds[i] === 'deal' ? `Next step on the deal: Send the pilot scope to ${accountName}` : kinds[i] === 'commitment' ? 'Send the dock comparison' : kinds[i] === 'reply' ? 'Someone replied' : kinds[i] === 'follow_up' ? `Follow up with the operator at ${accountName} when they are back` : 'Ready for a first touch',
    why: kinds[i] === 'ready' ? 'A prepared first touch' : `Due today per [[RETIREMENT-HANDOFF]] since Oct 2 https://${accountName.toLowerCase().replace(/[^a-z]/g, '')}.com/some/long/pa...`,
    person: { name: `Person ${i} Surname`, title: i % 2 ? 'VP Operations' : 'Director, Transportation' }, token: String(i).padStart(32, 'f'),
    context: { motion: i % 3 ? `Deal: YardFlow - ${accountName}` : 'Ready for a first touch', lastExchange: `They said: can you send me the dock schedule template by Friday? (${accountName}, Oct 8)`, nextAction: 'Send it from the deal brief. Then confirm the pilot scope with operations and the gate team before Friday.', source: 'the recorded buyer words', date: '2026-10-08T13:00:00.000Z' },
  }));
  const records: IntelItem[] = [
    intelItem({ kind: 'signal', id: 'r1', title: 'Kodiak reaches Laredo, but not yet Mexico', line: 'Yards First Brief reported it Oct 9, 2026 (NEW). Unverified present-day status.', substance: substance() }),
    intelItem({ kind: 'signal', id: 'r2', title: 'X-Rite: 45-yard shipper network', accountName: 'X-Rite', line: 'Clawd signal hunter reported it Oct 10, 2026 (the capture date; the report states none) (relevance 20). Unverified present-day status.', substance: substance({ producer: 'clawd', producerLabel: 'Clawd signal hunter', text: 'X-Rite: 45-yard shipper network', sources: [{ url: 'https://xrite.com/', publisher: null, label: 'fit_rationale' }], uncertainty: "Relevance 20 by Clawd's classifier; not verified by GAP.", interpretation: 'Clawd classified it: facility_expansion, urgency ambient', reportedOnBasis: 'captured' }) }),
    intelItem({ kind: 'signal', id: 'r3', title: 'Charger adds a Dallas terminal per [[Yards First]] brief', line: 'Yards First Brief reported it Oct 9, 2026. Unverified present-day status.', substance: substance({ producerItemId: 'y' }) }),
    intelItem({ kind: 'signal', id: 'r4', title: 'Gusto consolidates its network', line: 'Freight X Signal Desk reported it Oct 9, 2026. See https://gusto.com/some/pa...', substance: substance({ producer: 'freight_x_signal_desk', producerLabel: 'Freight X Signal Desk', producerItemId: 'z' }) }),
    intelItem({ kind: 'trigger', id: '93', title: 'PEP 10-Q (2026-10-08) mentions: capital expenditure', accountName: 'PepsiCo', line: 'clawd, published Oct 8, 2026. Unverified present-day status. Themes: network capex, facility expansion.' }),
    intelItem({ kind: 'knowledge', id: 'kn1', title: 'YMX<>FR', line: 'A Fireflies call Oct 6, 2026 with jhiller@ymxlogistics.com, on the vault. The summary is advisory; the verbatim is on the note.', substance: substance({ producer: 'vault', producerLabel: 'the vault', producerItemId: 'kn1', sources: [], uncertainty: 'The Fireflies summary is advisory; the verbatim transcript on the note is the ground truth.', interpretation: null }), decisions: [] }),
  ];
  const people: IntelItem[] = Array.from({ length: 5 }, (_, k) => intelItem({ kind: 'person', id: `p${k}@example.com`, title: `Person ${k} at Account ${k}`, accountName: k < 2 ? 'Kenco' : null, accountHint: k < 2 ? null : `account${k}.com`, line: `Wrote to us Sep ${20 + k}, 2026 (${k + 1} messages), last about "Re: referral request"; not a GAP contact yet. Previously contacted, a response. Review before outreach: purpose unknown: review before any outreach.`, opportunity: k < 2 ? 'open' : 'none', person: { email: `p${k}@example.com`, name: `Person ${k}`, title: 'VP', lastWroteAt: '2026-09-24T00:00:00.000Z', messages: k + 1, deals: k < 2 ? [{ id: 'd1', name: 'YardFlow - Kenco', stage: 'Presentation scheduled', nextStep: 'Send the comparison before the presentation and confirm the attendees.' }] : [] } }));
  const intel: BriefingIntel = {
    signals: records.filter((r) => r.kind === 'signal'),
    reports: records.filter((r) => r.kind === 'signal' && r.substance),
    knowledge: records.filter((r) => r.kind === 'knowledge'),
    triggers: records.filter((r) => r.kind === 'trigger'),
    people,
    totals: { signals: 3_300, triggers: 500, people: 69, reports: 0, knowledge: 6 },
    angles: {},
    coverage: { sources: 'Sources: Yards First Brief reports through Oct 9, 2026, imported Oct 9, 2026 (83 items); Clawd signal hunter reports through Oct 10, 2026, imported Oct 9, 2026 (500 items); the vault reports through Oct 9, 2026 (7434 notes).', unavailable: 'our Gmail Sent (this process has no sender credential; production reads it).' },
    shownBefore: [],
    pursued: [{ key: 'signal:p1', taskId: 'at_test', writer: null, kind: 'signal', title: 'Kenco opens new innovation lab', accountName: 'Kenco', accountHint: null, url: null, decision: 'pursue', decidedAt: '2026-10-08T15:00:00.000Z', status: 'ready', error: null, angle: { whyItMatters: 'My guess is the lab standardizes the warehouses while the yards run on radio, per [[Kenco|the account note]].', starters: ['How does the gate know where a trailer goes?'], roles: ['VP Operations'], accounts: ['Kenco'], peopleNamed: [{ personaId: 1, name: 'Dave Kiesling', title: 'VP Operations' }], proposedAction: 'email', caveat: null, sourceLine: 'freightwaves.com' } }],
  };
  return { items, intel };
}

describe('GUI-11: the digest template', () => {
  const { items, intel } = fullDay();
  const out = renderBriefing({ plan: plan(items, { waiting: 4, parked: 12, snoozed: 1 }), dayToken: 'tok', links, commandsEnabled: true, legacyDigest: false, intel }, NOW);
  const t = out.text;

  it('every prose line is cleaned: no wiki syntax, no URL cut mid-way, in text and HTML', () => {
    for (const body of [t, out.html]) {
      expect(body).not.toContain('[[');
      expect(body).not.toContain(']]');
      expect(body).not.toMatch(/https?:\/\/\S*\.\.\./);
    }
    expect(t).toContain('2. Kroger: Send the dock comparison. Person 1 Surname (VP Operations). Due today per RETIREMENT-HANDOFF since Oct 2.');
    expect(t).toContain('- Kenco: Kenco opens new innovation lab. The angle: My guess is the lab standardizes the warehouses while the yards run on radio, per the account note.');
    expect(t).toContain('- No account yet: Gusto consolidates its network. Freight X Signal Desk reported it Oct 9, 2026. See\n');
    expect(t).toContain('Charger adds a Dallas terminal per Yards First brief.');
  });

  it('an item says a state word once: the item line is deduplicated by sentence and a card line that repeats it is dropped', () => {
    const dup = item({ key: 'ready:PepsiCo:2026-10-09', rank: 0, accountName: 'PepsiCo', title: 'Ready for a first touch', why: 'Ready for a first touch', person: { name: 'Karen Ortiz', title: null }, context: { motion: 'Ready for a first touch', lastExchange: null, nextAction: 'Ready for a first touch', source: 'the pack', date: null } });
    expect(itemLine(dup, 1)).toBe('1. PepsiCo: Ready for a first touch. Karen Ortiz.');
    expect(itemCardLines(dup)).toEqual(['Next: Ready for a first touch.', 'Source: the pack.']);
    expect(t).toContain('1. PepsiCo: Ready for a first touch. Person 0 Surname (Director, Transportation). A prepared first touch.');
    // Item 1's block runs to the next numbered item line (the sections list 1, 6, 10 and 13 together).
    const startAt = t.indexOf('\n1. PepsiCo:');
    const nextItem = /\n\d+\. /g;
    nextItem.lastIndex = startAt + 1;
    const endAt = nextItem.exec(t)?.index ?? t.length;
    const pepsi = t.slice(startAt, endAt);
    expect(pepsi.match(/Ready for a first touch/g), `the state once under item 1: ${pepsi}`).toHaveLength(1);
    expect((t.match(/\n1\. PepsiCo: Ready for a first touch/g) ?? []).length).toBe(1);
  });

  it('the count basis says its units, with thousands separators, and the subject keeps its short form', () => {
    expect(out.subject).toBe('GAP today, Fri Oct 9: 13 to execute, 11 to decide [GAP#tok]');
    expect(t.split('\n')[1]).toBe('13 plan items to execute, in this order (the list START, NEXT and ITEM walk); 11 intelligence items to decide, 6 of them records and 5 people; 3,800 more retained records are on the Intelligence page, not in this email; 64 more people who wrote in are on Work.');
    expect(t).toContain('Intelligence worth a look (6 of 3,806). Any age, for your call; Pursue and GAP develops the angle.');
    expect(t).toContain('Waiting on them: 4 accounts. Parked (research, holds, set aside): 12 accounts. Snoozed: 1 account.');
  });

  it('content first, bookkeeping after: the intelligence items, the pursued, the plan items, then how the email was composed, the coverage, the retained list, the counts, the commands', () => {
    const at = (s: string) => { const i = t.indexOf(s); expect(i, s).toBeGreaterThanOrEqual(0); return i; };
    const intelHead = at('Intelligence worth a look (6 of 3,806)');
    const firstRecord = at('- No account yet: Kodiak reaches Laredo, but not yet Mexico.');
    const people = at('Prospects to reengage (5 of 69).');
    const pursued = at('Pursued (1): what GAP prepared on your decisions.');
    const begin = at('Begin with item 1, PepsiCo: Ready for a first touch.');
    const lastItem = at('13. Primo: Ready for a first touch.');
    const how = at('How this email was composed: 4 from your briefs, 1 trigger, 1 from the vault; 3,800 more waiting.');
    const coverage = at('Sources: Yards First Brief reports through Oct 9, 2026, imported Oct 9, 2026 (83 items);');
    const retained = at('Everything retained, with filters: https://modex-gtm.vercel.app/gap/intelligence/');
    const counts = at('Waiting on them: 4 accounts.');
    const commands = at('To work from your inbox, reply with START');
    expect([intelHead, firstRecord, people, pursued, begin, lastItem, how, coverage, retained, counts, commands]).toEqual([...[intelHead, firstRecord, people, pursued, begin, lastItem, how, coverage, retained, counts, commands]].sort((a, b) => a - b));
    expect(t).toContain('Not read this time: our Gmail Sent (this process has no sender credential; production reads it).');
    expect(out.html.indexOf('How this email was composed:')).toBeGreaterThan(out.html.indexOf('13. Primo') > 0 ? out.html.indexOf('13. Primo') : out.html.indexOf('Primo'));
  });

  it('a classifier-only source label is the producer\'s own claim, no link; a real source stays a link', () => {
    const xrite = t.slice(t.indexOf('- X-Rite: X-Rite: 45-yard shipper network.'), t.indexOf('- Charger adds'));
    expect(xrite).toContain("Sources: the producer's own claim (no source link).");
    expect(xrite).not.toContain('fit_rationale');
    expect(xrite).not.toContain('https://xrite.com/');
    expect(out.html).toContain("Sources: the producer&#39;s own claim (no source link).".replace('&#39;', "'"));
    expect(out.html).not.toContain('<a href="https://xrite.com/">');
    expect(t).toContain('Sources: Kodiak-Charger announcement https://www.nasdaq.com/press-release/kodiak-charger; Truck News https://www.trucknews.com/x; Laredo trade data https://www.laredoedc.org/site-selection/international-trade/.');
    expect(out.html).toContain('<a href="https://www.nasdaq.com/press-release/kodiak-charger">Kodiak-Charger announcement</a>');
  });

  it('the HTML is one column, table-free, 640px at most with 16px side padding, wraps long links, and a full day stays under 95 KB', () => {
    expect(out.html.startsWith('<div style="max-width:640px;margin:0 auto;padding:0 16px;')).toBe(true);
    expect(out.html).toContain('overflow-wrap:anywhere');
    expect(out.html).not.toMatch(/<table|<td|<tr|<colgroup/i);
    // No fixed width anywhere (max-width is the only width rule), so the column shrinks to 360px.
    expect(out.html).not.toMatch(/(?<!max-)width\s*[:=]\s*["']?\d+px/i);
    expect(out.html).not.toMatch(/\swidth="/i);
    const bytes = Buffer.byteLength(out.html, 'utf8');
    expect(bytes, `html bytes ${bytes}`).toBeLessThan(95 * 1024);
    expect(Buffer.byteLength(t, 'utf8')).toBeLessThan(95 * 1024);
    // The links of the day are real-length signed tokens: the size test is honest about them.
    expect((out.html.match(/\/gap\/decide\?t=/g) ?? []).length).toBeGreaterThanOrEqual(36);
    expect((out.html.match(/\/gap\/item\?t=/g) ?? []).length).toBe(13);
  });

  it('no body line starts with a command word or a selection, in text', () => {
    for (const l of t.split('\n')) {
      expect(l, l).not.toMatch(/^(START|APPROVE|REVISE|SKIP|DEFER|DONE|NEXT|HELP)\b/i);
      expect(l, l).not.toMatch(/^(item\b|(open|send\s+me)\s*#?\s*\d)/i);
    }
  });

  it('a day with no intelligence and no retained records says the plan alone; a single item and a single record use singular units', () => {
    const one = renderBriefing({ plan: plan([items[0]]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: { signals: [fullDay().intel.signals[0]], triggers: [], people: [], totals: { signals: 1, triggers: 0, people: 0 }, angles: {} } }, NOW);
    expect(one.text.split('\n')[1]).toBe('1 plan item to execute, in this order (the list START, NEXT and ITEM walk); 1 intelligence item to decide, 1 of them record and 0 people.');
    const none = renderBriefing({ plan: plan([items[0]]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(none.text.split('\n')[1]).toBe('1 plan item to execute, in this order (the list START, NEXT and ITEM walk).');
    expect(none.text).not.toContain('How this email was composed');
  });
});
