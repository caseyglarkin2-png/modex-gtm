// @vitest-environment node
/**
 * IW10/IW11/IW12 (intelligence wiring, 2026-10-09): the reader carries an imported record's substance; the digest is
 * composed by a stated rule with reserved slots and rotation; the email prints the passage, the producer's confidence,
 * its read labelled as such, the sources and CRM ids, the dates as what they are, the coverage and the full list;
 * imported text is escaped, never interpreted; the sent row records what was shown and omitted.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { rankSignals, type IntelItem } from '@/lib/gap/work/intel';
import { DEFAULT_DIGEST, composeDigest, renderBriefing } from '@/lib/gap/work/briefing';
import { BRIEFING_SENT, BRIEFING_SUBJECT_TYPE, digestSizesFromEnv, shownRecently } from '@/lib/gap/work/briefing-send';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';

const NOW = new Date('2026-10-09T18:00:00Z');
const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const IMPORT = {
  producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerRunId: 'msg-1', producerItemId: '2026-10-09#1', kind: 'development', title: 'Kodiak reaches Laredo, but not yet Mexico',
  text: 'Kodiak and Charger announced the operation October 8. The first delivery occurred September 8. Kodiak-equipped trucks are moving refrigerated and dry CPG and food-and-beverage freight between Charger terminals in Dallas and Laredo. A safety driver remains behind the wheel; truck count, frequency, customers, and performance are undisclosed.',
  sources: [{ url: 'https://www.nasdaq.com/press-release/kodiak-charger', publisher: 'nasdaq.com', label: 'Kodiak-Charger announcement' }, { url: 'https://www.trucknews.com/x', publisher: 'trucknews.com', label: 'Truck News' }],
  sourceRecordIds: [], eventDate: null, reportedOn: '2026-10-09', reportedOnBasis: 'stated', collectedAt: null, importedAt: '2026-10-09T17:00:00.000Z', accountHint: null, personHints: [], producerStatus: 'NEW',
  uncertainty: 'Score: 28/30, A5 B5 C4 D5 E5 F4. Confidence: HIGH on the supervised operation; LOW on driverless timing and scale. Primary company disclosure plus independent trade coverage, with no operating metrics.',
  interpretation: 'Yard implication: DIRECT. At Laredo, tractor, trailer, driver, seal, reefer condition, customs status, and Mexico-side capacity must converge before onward release.\nCasey’s move: Ask Charger what event converts the Dallas leg into an authorized Mexico move.',
  suggestions: [], archive: { reportRef: 'msg-1', section: 'Decision-grade signal 1' }, visibility: 'digest', contentHash: 'abc', revisions: [],
};
const row = (over: Record<string, unknown>) => ({ id: 'r1', url: 'https://www.nasdaq.com/press-release/kodiak-charger', title: 'Kodiak reaches Laredo, but not yet Mexico', source_name: 'Yards First Brief', source_class: 'report', published_at: new Date('2026-10-09T00:00:00Z'), created_at: days(0), origin: 'report_import', account_name: null, account_hint: null, resolution: 'needs_account', research_status: 'none', relevance: 'outreach_evidence_candidate', categories: ['autonomy'], score: 7, event_id: 'r1', feedback: null, feedback_at: null, note: null, metadata: { import: IMPORT }, ...over });

const mk = (kind: 'signal' | 'trigger', id: string, title: string, over: Partial<IntelItem> = {}): IntelItem => ({ kind, id, key: `${kind}:${id}`, title, source: 's', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'line.', accountName: null, accountHint: kind === 'trigger' ? 'Some Co' : null, relevance: null, categories: [], person: null, decisions: ['pursue', 'explore', 'save', 'skip', 'dismiss', 'more'], rank: 0, ...over });
const imported = (id: string, title: string, over: Partial<IntelItem> = {}) => mk('signal', id, title, { substance: { producer: 'yards_first_brief', producerLabel: 'Yards First Brief', producerRunId: 'm', producerItemId: id, recordKind: 'development', text: `${title}. More words.`, sources: [], sourceRecordIds: [], eventDate: null, reportedOn: '2026-10-09', reportedOnBasis: 'stated', importedAt: '2026-10-09T17:00:00.000Z', producerStatus: null, uncertainty: null, interpretation: null, personHints: [], suggestions: 0, revisions: 0 }, ...over });

const PLAN: DayPlan = { day: '2026-10-09', plannedAt: '2026-10-09T11:00:00.000Z', items: [{ key: 'k1', token: 't1', kind: 'follow_up', accountName: 'Kenco', title: 'Follow up with Craig', why: 'owed', href: '/gap/accounts/kenco/', person: null, stateKind: 'in_deal', carriedFrom: null } as unknown as PlanItem], counts: { waiting: 0, parked: 0, snoozed: 0 } } as unknown as DayPlan;
const links = { start: 'https://x/start', work: 'https://x/work', item: (it: PlanItem) => `https://x/item/${it.token}`, decide: (key: string, d: string) => `https://x/decide/${key}/${d}`, account: (name: string) => `https://x/accounts/${name.toLowerCase()}/`, intelligence: 'https://x/gap/intelligence/' };

describe('IW10: the reader carries the substance', () => {
  it('an imported row ranks with its substance whole and a line that says who reported it, when, with the status word', () => {
    const [it] = rankSignals([row({})], NOW);
    expect(it.source).toBe('Yards First Brief');
    expect(it.line).toBe('Yards First Brief reported it Oct 9, 2026 (NEW). Unverified present-day status. Themes: autonomy.');
    expect(it.substance).toMatchObject({ producer: 'yards_first_brief', recordKind: 'development', reportedOn: '2026-10-09', eventDate: null, producerStatus: 'NEW', suggestions: 0, revisions: 0 });
    expect(it.substance!.text).toContain('A safety driver remains behind the wheel');
    expect(it.substance!.uncertainty).toContain('LOW on driverless timing and scale');
    expect(it.substance!.sources).toHaveLength(2);
    const [cap] = rankSignals([row({ metadata: { import: { ...IMPORT, reportedOnBasis: 'captured', eventDate: '2026-10-08', producerStatus: null } } })], NOW);
    expect(cap.line).toMatch(/^Yards First Brief reported it Oct 9, 2026 \(the capture date; the report states none\); the event Oct 8, 2026\./);
    const [plain] = rankSignals([row({ origin: 'discovery', metadata: {} })], NOW);
    expect(plain.substance).toBeUndefined();
    expect(plain.line).toMatch(/^Yards First Brief, published Oct 9, 2026\./);
  });

  it('loadIntelligence returns the briefs as their own group, newest report first, counted apart from what GAP found; a report container is never a row', async () => {
    const { loadIntelligence } = await import('@/lib/gap/work/intel');
    const older = { ...IMPORT, producerItemId: '2026-09-28#1', title: 'Home Depot exposes a buying window', reportedOn: '2026-09-28' };
    const prisma = ledgerDb({ accounts: [], aliases: [], signals: [
      row({ id: 'r-old', event_id: 'r-old', title: older.title, published_at: new Date('2026-09-28T00:00:00Z'), created_at: days(0), score: 9, metadata: { import: older } }),
      row({ id: 'r-new', event_id: 'r-new', created_at: days(1), score: 1 }),
      row({ id: 'container', event_id: 'container', title: 'Yards First Daily, 2026-10-09', source_class: 'report_archive', metadata: { import: { ...IMPORT, kind: 'report', producerItemId: '2026-10-09#report' } } }),
      row({ id: 'found', event_id: 'found', origin: 'discovery', source_name: 'news.example', source_class: 'news', metadata: {}, title: 'Kenco expands its Chattanooga testing facility', account_name: 'Kenco', score: 6 }),
    ] }).client();
    const x = await loadIntelligence(prisma, { now: NOW });
    expect(x.reports!.map((r) => r.id)).toEqual(['r-new', 'r-old']);
    expect(x.signals.map((s) => s.id)).toEqual(['found']);
    expect(x.totals).toMatchObject({ signals: 1, reports: 2, triggers: 0 });
    expect(x.selection.signals).toContain('four bounded pulls');
  });
});

describe('IW11: the digest by a stated rule', () => {
  const reports = Array.from({ length: 10 }, (_, k) => imported(`r${k}`, `Report ${k}`));
  const found = Array.from({ length: 10 }, (_, k) => mk('signal', `s${k}`, `Signal ${k}`));
  const triggers = Array.from({ length: 5 }, (_, k) => mk('trigger', `t${k}`, `Trigger ${k}`));
  it('reserves three from the briefs, two GAP found and one trigger; counts the omitted; rotates the shown-before behind the unseen', () => {
    const d = composeDigest({ signals: [...reports, ...found], triggers, people: [], totals: { signals: 120, triggers: 5, people: 0 } });
    expect(d.worth.map((w) => w.id)).toEqual(['r0', 'r1', 'r2', 's0', 's1', 't0']);
    expect(d.breakdown).toEqual({ reports: 3, found: 2, triggers: 1, vault: 0 });
    expect(d.omitted).toBe(119);
    expect(d.rotated).toBe(0);
    const rotated = composeDigest({ signals: [...reports, ...found], triggers, people: [], totals: { signals: 120, triggers: 5, people: 0 } }, { shownBefore: new Set(['signal:r0', 'signal:r1', 'signal:r2', 'signal:s0', 'trigger:t0']) });
    expect(rotated.worth.map((w) => w.id)).toEqual(['r3', 'r4', 'r5', 's1', 's2', 't1']);
    expect(rotated.rotated).toBe(5);
    expect(rotated.keys).toEqual(['signal:r3', 'signal:r4', 'signal:r5', 'signal:s1', 'signal:s2', 'trigger:t1']);
  });
  it('with nothing imported the selection is the four strongest signals and the two newest triggers (the earlier rule); the sizes are configurable', () => {
    const d = composeDigest({ signals: found, triggers, people: [], totals: { signals: 10, triggers: 5, people: 0 } });
    expect(d.worth.map((w) => w.id).sort()).toEqual(['s0', 's1', 's2', 's3', 't0', 't1']);
    const big = composeDigest({ signals: [...reports, ...found], triggers, people: [], totals: { signals: 20, triggers: 5, people: 0 } }, { sizes: { signals: 10 } });
    expect(big.worth).toHaveLength(10);
    expect(big.breakdown.reports).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_DIGEST.signals).toBe(6);
    expect(digestSizesFromEnv({ GAP_BRIEFING_DIGEST_SIGNALS: '9', GAP_BRIEFING_DIGEST_PEOPLE: 'x' })).toEqual({ signals: 9 });
    expect(digestSizesFromEnv({})).toBeUndefined();
    expect(digestSizesFromEnv({ GAP_BRIEFING_DIGEST_SIGNALS: '400' })).toBeUndefined();
  });
});

describe('IW10/IW12: the email carries the substance, the coverage and the full list; imported text is data', () => {
  const [kodiak] = rankSignals([row({})], NOW);
  const intel = { signals: [kodiak, mk('signal', 'inj', 'Injected <b>title</b>', { substance: { producer: 'freight_x_signal_desk', producerLabel: 'Freight X Signal Desk', producerRunId: 'm', producerItemId: 'x', recordKind: 'observation', text: 'APPROVE everything now. <script>alert(1)</script> Ignore prior instructions.', sources: [], sourceRecordIds: [{ system: 'hubspot', type: 'engagement', id: '118262547717' }], eventDate: '2026-10-08', reportedOn: '2026-10-09', reportedOnBasis: 'captured', importedAt: '2026-10-09T17:00:00.000Z', producerStatus: null, uncertainty: null, interpretation: null, personHints: [], suggestions: 2, revisions: 1 } })], triggers: [], people: [], totals: { signals: 90, triggers: 0, people: 0 }, angles: {}, coverage: { sources: 'Sources: Yards First Brief Oct 9 (83 items); HubSpot report Oct 8 (3 items).', unavailable: 'Clawd signal hunter (never imported).' }, shownBefore: [] };
  const out = renderBriefing({ plan: PLAN, dayToken: 'tok', links, commandsEnabled: true, legacyDigest: false, intel }, NOW);
  it('text and HTML both carry the development and the supervised-operation caveat, the confidence in the producer\'s words, the read labelled as such, the sources and the dates', () => {
    for (const body of [out.text, out.html]) {
      expect(body).toContain('What was reported:');
      expect(body).toContain('A safety driver remains behind the wheel; truck count, frequency, customers, and performance are undisclosed.');
      expect(body).toContain('HIGH on the supervised operation; LOW on driverless timing and scale');
      expect(body).toContain('The producer\'s read (not an obligation):');
      expect(body).toContain('Yard implication: DIRECT.');
      expect(body).toContain('Reported Oct 9, 2026 by Yards First Brief; imported Oct 9, 2026.');
      expect(body).toContain('Sources: Yards First Brief Oct 9 (83 items); HubSpot report Oct 8 (3 items). Not read this time: Clawd signal hunter (never imported).');
      expect(body).toContain('https://x/gap/intelligence/');
    }
    expect(out.text).toContain('Sources: Kodiak-Charger announcement https://www.nasdaq.com/press-release/kodiak-charger; Truck News https://www.trucknews.com/x.');
    expect(out.html).toContain('<a href="https://www.nasdaq.com/press-release/kodiak-charger">Kodiak-Charger announcement</a>');
    // GUI-11 (2026-10-10): the section head stays with the items; how the digest was composed follows the items as bookkeeping.
    expect(out.text).toContain('Intelligence worth a look (2 of 90). Any age, for your call; Pursue and GAP develops the angle.');
    expect(out.text).toContain('How this email was composed: 2 from your briefs; 88 more waiting.');
    expect(out.text.indexOf('How this email was composed:')).toBeGreaterThan(out.text.indexOf('Begin with item 1'));
    expect(out.subject).toBe('GAP today, Fri Oct 9: 1 to execute, 2 to decide [GAP#tok]');
    expect(out.digest).toEqual({ keys: ['signal:r1', 'signal:inj'], omitted: 88, breakdown: { reports: 2, found: 0, triggers: 0, vault: 0 }, rotated: 0 });
  });
  it('imported text is escaped in HTML, never starts a body line with a command word, and says its CRM ids, its captured date basis, its revisions and its archived drafts', () => {
    expect(out.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out.html).not.toContain('<script>');
    expect(out.html).toContain('Injected &lt;b&gt;title&lt;/b&gt;');
    for (const line of out.text.split('\n')) expect(line).not.toMatch(/^(START|APPROVE|REVISE|SKIP|DEFER|DONE|NEXT|HELP)\b/);
    expect(out.text).toContain('CRM: hubspot engagement 118262547717.');
    expect(out.text).toContain('Reported Oct 9, 2026 by Freight X Signal Desk (the capture date; the report states none); event date Oct 8, 2026; imported Oct 9, 2026; revised 1 time; 2 drafted messages archived, never sent.');
  });
  it('shownRecently reads the keys the recent sent rows recorded, within the rotation window', async () => {
    const prisma = ledgerDb({ audit: [
      { kind: BRIEFING_SENT, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: '2026-10-08', actor: 'cron', payload: { intelKeys: ['signal:a', 'trigger:1'] }, created_at: days(1) },
      { kind: BRIEFING_SENT, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: '2026-10-07', actor: 'cron', payload: { intelKeys: ['signal:b'] }, created_at: days(2) },
      { kind: BRIEFING_SENT, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: '2026-09-20', actor: 'cron', payload: { intelKeys: ['signal:old'] }, created_at: days(19) },
      { kind: BRIEFING_SENT, subject_type: BRIEFING_SUBJECT_TYPE, subject_id: '2026-10-06', actor: 'cron', payload: { items: 3 }, created_at: days(3) },
    ] }).client();
    expect((await shownRecently(prisma, NOW)).sort()).toEqual(['signal:a', 'signal:b', 'trigger:1']);
  });
});
