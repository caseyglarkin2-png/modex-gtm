// @vitest-environment node
/**
 * IW01/IW03 (intelligence wiring, 2026-10-09): the record contract and the three report parsers, on the actual
 * captured reports (tests/fixtures/gap/intelligence). Pinned: a hypothetical item with no URL, no account and no
 * fact survives validation; the Kodiak limitations, the 7-Eleven uncertainty and the Sub-Zero / World Market
 * evidence ids stay visible; interpretation and drafted messages are kept apart from the substance; no citation
 * marker or entity wrapper leaks; an undated issue says its date was the capture's.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { intelligenceContentHash, intelligenceIdentityHash, validateIntelligenceRecord } from '@/lib/gap/signals/intelligence-record';
import { parseHubSpotActivityReport, parseSignalDeskReport, parseYardsFirstReport } from '@/lib/gap/signals/report-parsers';

const fx = (name: string) => readFileSync(path.join(process.cwd(), 'tests/fixtures/gap/intelligence', name), 'utf8');
const OPTS = { runId: 'run-1', capturedOn: '2026-10-09' };

describe('IW01: the record contract', () => {
  it('a hypothetical, unresolved item with no url, no account and no fact validates; the refusals name the field', () => {
    const r = validateIntelligenceRecord({ producer: 'Yards First Brief', producerRunId: 'r', producerItemId: 'x#1', kind: 'development', title: 'Maybe', text: 'Management is considering it. No site or budget named.', reportedOn: '2026-10-09' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record).toMatchObject({ producer: 'yards_first_brief', producerLabel: 'Yards First Brief', sources: [], accountHint: null, eventDate: null, visibility: 'digest', reportedOnBasis: 'stated' });
    expect(validateIntelligenceRecord({ producerRunId: 'r', producerItemId: 'x', kind: 'development', title: 't', reportedOn: '2026-10-09' })).toEqual({ ok: false, reason: 'producer_required' });
    expect(validateIntelligenceRecord({ producer: 'p', producerRunId: 'r', producerItemId: 'x', kind: 'rumour', title: 't', reportedOn: '2026-10-09' })).toEqual({ ok: false, reason: 'kind_unknown' });
    expect(validateIntelligenceRecord({ producer: 'p', producerRunId: 'r', producerItemId: 'x', kind: 'development', title: 't', reportedOn: 'Oct 9' })).toEqual({ ok: false, reason: 'reported_on_not_a_date' });
    expect(validateIntelligenceRecord({ producer: 'p', producerRunId: 'r', producerItemId: 'x', kind: 'development', title: 't', reportedOn: '2026-10-09', sources: [{ url: 'javascript:alert(1)' }] })).toEqual({ ok: false, reason: 'bad_source_url' });
    expect(validateIntelligenceRecord({ producer: 'p', producerRunId: 'r', producerItemId: 'x', kind: 'development', reportedOn: '2026-10-09' })).toEqual({ ok: false, reason: 'title_or_text_required' });
  });

  it('identity is producer + item id; the content hash changes with the substance, not with the import time', () => {
    expect(intelligenceIdentityHash('yards_first_brief', '2026-10-09#1')).toBe(intelligenceIdentityHash('yards_first_brief', '2026-10-09#1'));
    expect(intelligenceIdentityHash('yards_first_brief', '2026-10-09#1')).not.toBe(intelligenceIdentityHash('freight_x_signal_desk', '2026-10-09#1'));
    const base = { title: 't', text: 'a', sources: [], sourceRecordIds: [], eventDate: null, reportedOn: '2026-10-09', uncertainty: null, interpretation: null, suggestions: [], producerStatus: null, accountHint: null, personHints: [] };
    expect(intelligenceContentHash(base)).toBe(intelligenceContentHash({ ...base }));
    expect(intelligenceContentHash(base)).not.toBe(intelligenceContentHash({ ...base, text: 'b' }));
  });
});

describe('IW03: Yards First Brief', () => {
  const r = parseYardsFirstReport(fx('yards-first-2026-10-09.md'), OPTS);
  it('reads the stated date, one container and the three decision-grade signals with their status words', () => {
    expect(r.reportedOn).toBe('2026-10-09');
    expect(r.reportedOnBasis).toBe('stated');
    expect(r.records[0]).toMatchObject({ kind: 'report', visibility: 'archive', producerItemId: '2026-10-09#report', title: 'Yards First Daily, 2026-10-09' });
    expect(r.records.slice(1).map((x) => [x.producerItemId, x.producerStatus, x.title])).toEqual([
      ['2026-10-09#1', 'NEW', 'Kodiak reaches Laredo, but not yet Mexico'],
      ['2026-10-09#2', 'NEW', '7-Eleven says it outsourced too much'],
      ['2026-10-09#3', 'NEW', 'Metsä returns 260,000 tons of pulsed freight to Philadelphia'],
    ]);
  });
  it('the Kodiak item keeps the development verbatim with its limitations, the confidence apart, the sources, and the commentary apart', () => {
    const k = r.records[1];
    expect(k.text).toContain('Kodiak and Charger announced the operation October 8. The first delivery occurred September 8.');
    expect(k.text).toContain('A safety driver remains behind the wheel; truck count, frequency, customers, and performance are undisclosed.');
    expect(k.text).not.toMatch(/chatgpt-content-reference|\*\*/);
    expect(k.uncertainty).toContain('Confidence: HIGH on the supervised operation; LOW on driverless timing and scale');
    expect(k.uncertainty).toContain('Score: 28/30');
    expect(k.sources?.map((s) => s.publisher)).toEqual(['nasdaq.com', 'trucknews.com', 'laredoedc.org']);
    expect(k.sources?.[0].url).toBe('https://www.nasdaq.com/press-release/kodiak-ai-and-charger-usa-launch-autonomous-trucking-between-dallas-and-laredo-2026');
    expect(k.interpretation).toContain('Yard implication: DIRECT');
    expect(k.interpretation).toContain('Casey’s move: Ask Charger');
    expect(k.interpretation).not.toContain('safety driver remains');
    expect(k.eventDate ?? null).toBeNull();
    expect(k.archive).toEqual({ reportRef: 'run-1', section: 'Decision-grade signal 1' });
  });
  it('the 7-Eleven item keeps what was not named; the Metsä item keeps its tonnage', () => {
    expect(r.records[2].text).toContain('No function, site, partner, budget, or deadline was named.');
    expect(r.records[2].uncertainty).toContain('Confidence: MEDIUM');
    expect(r.records[2].sources?.[0].url).toBe('https://www.reuters.com/business/7-elevens-us-arm-looks-move-supply-chain-in-house-inflation-bites-2026-10-09/');
    expect(r.records[3].text).toContain('260,000 metric tons annually');
  });
  it('an earlier issue with one multi-paragraph development, "Direct sources" and different commentary labels', () => {
    const s = parseYardsFirstReport(fx('yards-first-2026-09-28.md'), { runId: 'run-9', capturedOn: '2026-10-09' });
    expect(s.reportedOn).toBe('2026-09-28');
    expect(s.records).toHaveLength(2);
    const hd = s.records[1];
    expect(hd.title).toBe('Home Depot exposes a $15 million logistics-systems buying window');
    expect(hd.text.split('\n\n')).toHaveLength(3);
    expect(hd.text).toContain('414,000-square-foot');
    expect(hd.sources).toHaveLength(5);
    expect(hd.uncertainty).toContain('Score: 30/30');
    expect(hd.interpretation).toContain('Enterprise buyer read:');
  });
});

describe('IW03: Freight X Signal Desk', () => {
  const r = parseSignalDeskReport(fx('signal-desk-2026-10-09.md'), OPTS);
  it('the three moves and the other conversation are observations; the reserve posts are archived; drafts are suggestions, never substance', () => {
    expect(r.reportedOn).toBe('2026-10-09');
    const items = r.records.slice(1);
    expect(items.map((x) => [x.producerStatus, x.visibility])).toEqual([
      ['POST THIS', 'digest'],
      ['REPLY HERE', 'digest'],
      ['RELATIONSHIP MOVE', 'digest'],
      ['reserve post', 'archive'],
      ['conversation', 'digest'],
    ]);
    const post = items[0];
    expect(post.text).toContain('granted Aurora Innovation and other qualifying Level 4 operators a five-year exemption allowing cab-mounted warning beacons');
    expect(post.text).not.toMatch(/entity\[|:::writing|chatgpt-content-reference/);
    expect(post.suggestions?.[0]).toContain('---option Carrier Capacity');
    expect(post.text).not.toContain('Schneider cut its approved brokerage carrier list');
    expect(post.sources?.some((s) => s.url === 'https://www.fmcsa.dot.gov/regulations/federal-register-documents/2026-20734')).toBe(true);
    expect(post.interpretation).toContain('Action: POST the first option on X.');
    const reply = items[1];
    expect(reply.personHints).toEqual(['Thomas A. Moore']);
    expect(reply.text).toContain('a transportation plan isn\'t finished merely because software approves it');
    expect(reply.suggestions).toHaveLength(1);
    expect(reply.interpretation).toContain('Action: REPLY + FOLLOW.');
    expect(items[2].personHints).toEqual(['Andrew Leto']);
    const other = items[4];
    expect(other.title).toBe('FreightCaviar: Schneider\'s shrinking carrier network');
    expect(other.text).toContain('reducing its approved brokerage carrier network from 60,000 to 14,000');
    for (const it of r.records) expect(JSON.stringify([it.text, it.title, it.interpretation])).not.toMatch(/entity\["/);
  });
  it('an issue that states no date takes the capture date and says so; blockquoted drafts are suggestions; the people are hints', () => {
    const s = parseSignalDeskReport(fx('signal-desk-undated.md'), { runId: 'msg-7e22', capturedOn: '2026-10-09' });
    expect(s.reportedOn).toBe('2026-10-09');
    expect(s.reportedOnBasis).toBe('captured');
    const items = s.records.slice(1);
    expect(items[0].producerItemId).toMatch(/^msg-7e22#1-/);
    expect(items[0].suggestions?.[0]).toContain('physical AI needs physical APIs');
    expect(items[0].text).not.toContain('physical AI needs physical APIs');
    expect(items[0].text).toContain('PrePass and Kodiak are integrating');
    expect(items[0].personHints).toEqual(['Don Burnette']);
    expect(items[1].personHints).toEqual(['Mike Ernst']);
    expect(items[1].text).toContain('$4.49 million');
    expect(items[2].personHints).toEqual(['Chas Wurster']);
  });
});

describe('IW03: Codex HubSpot Activity & Engagement report', () => {
  const r = parseHubSpotActivityReport(fx('hubspot-2026-10-08.md'), { runId: 'msg-032a', capturedOn: '2026-10-09' });
  it('reads the report date, the three engagement records with their CRM ids, dates, labels and what is not verified', () => {
    expect(r.reportedOn).toBe('2026-10-08');
    const [, sub, wm, lz] = r.records;
    expect(sub).toMatchObject({ kind: 'engagement', title: 'Mark Marshall — SUBZERO', accountHint: 'SUBZERO', personHints: ['Mark Marshall'], eventDate: '2026-10-08', producerStatus: 'active evaluation', producerItemId: '2026-10-08#250520610151' });
    expect(sub.sourceRecordIds).toEqual([{ system: 'hubspot', type: 'contact', id: '250520610151' }, { system: 'hubspot', type: 'engagement', id: '118262547717' }]);
    expect(sub.text).toBe('Mark accepted the demo and then offered to talk immediately or at 07:15 CT about WI dock-scheduling workflow details for a custom pilot demo.');
    expect(sub.interpretation).toBe('Next: reconnect promptly and obtain appointment/dock-rule data for the WI pilot.');
    expect(sub.uncertainty).toContain('high confidence');
    expect(sub.sources?.map((s) => s.label)).toEqual(['HubSpot contact record', 'HubSpot engagement (evidence)']);
    expect(wm).toMatchObject({ accountHint: 'World Market', personHints: ['Jarrod Black'] });
    expect(wm.sourceRecordIds).toContainEqual({ system: 'hubspot', type: 'engagement', id: '118263986727' });
    expect(wm.uncertainty).toContain('the company association is not verified');
    expect(wm.text).toContain('Accepted the demo and Oct. 8 demo-debrief invitation.');
    expect(lz).toMatchObject({ title: 'Lazerspot — David Stringer', accountHint: null, personHints: [], eventDate: '2026-10-02' });
    expect(lz.sourceRecordIds).toEqual([{ system: 'hubspot', type: 'engagement', id: '117919515409' }]);
    expect(lz.uncertainty).toContain('Jake/shared context');
    expect(lz.text).toContain('David returned a signed MNDA and asked for the counter.');
  });
  it('the container keeps the scope, the data gap and the inbox directive as a suggestion, never an obligation', () => {
    const c = r.records[0];
    expect(c.kind).toBe('report');
    expect(c.uncertainty).toContain('Data gap: email-contact/company associations are not complete');
    expect(c.uncertainty).toContain('Scope: completed day Oct. 8');
    expect(c.suggestions?.[0]).toContain('Sub-Zero pilot call needs follow-up');
    expect(c.text).toContain('**66** verified external commercial sent-email records');
  });
});
