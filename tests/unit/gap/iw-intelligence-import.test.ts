// @vitest-environment node
/**
 * IW02 (intelligence wiring, 2026-10-09): the batch import. Pinned: the same batch twice makes one row per item
 * (duplicates, not copies); a changed item is a revision that keeps the previous hash; a bad item is reported by
 * index and its neighbours land; an unresolved item lands without an account, a url or a fact; a report container
 * is archived, never a digest row; the import writes no Slack, HubSpot, research or fetch (the client has none);
 * one ledger row per producer says the run and the counts; a Casey disposition on a row survives a revision.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { importIntelligenceBatch } from '@/lib/gap/signals/intelligence-import';
import { INTEL_IMPORTED_EVENT, REPORT_ARCHIVE_CLASS, REPORT_IMPORT_ORIGIN, importOf, intelligenceIdentityHash } from '@/lib/gap/signals/intelligence-record';

const NOW = new Date('2026-10-09T18:00:00Z');
const kodiak = {
  producer: 'yards_first_brief', producerRunId: 'msg-1', producerItemId: '2026-10-09#1', kind: 'development', title: 'Kodiak reaches Laredo, but not yet Mexico',
  text: 'Kodiak and Charger announced the operation October 8. The first delivery occurred September 8. A safety driver remains behind the wheel; truck count, frequency, customers, and performance are undisclosed.',
  sources: [{ url: 'https://www.nasdaq.com/press-release/kodiak-charger?utm_source=chatgpt.com', publisher: 'nasdaq.com', label: 'Kodiak-Charger announcement' }],
  reportedOn: '2026-10-09', uncertainty: 'Confidence: HIGH on the supervised operation; LOW on driverless timing and scale.', interpretation: 'Casey’s move: Ask Charger what event converts the Dallas leg into an authorized Mexico move.',
};
const seven = { producer: 'yards_first_brief', producerRunId: 'msg-1', producerItemId: '2026-10-09#2', kind: 'development', title: '7-Eleven says it outsourced too much', text: 'Management is considering bringing parts of its supply chain in-house. No function, site, partner, budget, or deadline was named.', reportedOn: '2026-10-09', uncertainty: 'Confidence: MEDIUM.' };
const container = { producer: 'yards_first_brief', producerRunId: 'msg-1', producerItemId: '2026-10-09#report', kind: 'report', title: 'Yards First Daily, 2026-10-09', text: '# Yards First Daily | October 9, 2026 ...', reportedOn: '2026-10-09' };
const subzero = { producer: 'codex_hubspot_report', producerRunId: 'msg-2', producerItemId: '2026-10-08#250520610151', kind: 'engagement', title: 'Mark Marshall — SUBZERO', text: 'Mark accepted the demo and then offered to talk immediately about WI dock-scheduling workflow details for a custom pilot demo.', sourceRecordIds: [{ system: 'hubspot', type: 'contact', id: '250520610151' }, { system: 'hubspot', type: 'engagement', id: '118262547717' }], eventDate: '2026-10-08', reportedOn: '2026-10-08', accountHint: 'SUBZERO', personHints: ['Mark Marshall'] };

describe('IW02: the batch import', () => {
  it('lands every valid record once, reports the bad one by index, archives the container, and writes one ledger row per producer', async () => {
    const db = ledgerDb({ accounts: ['Sub-Zero Group', 'Kenco'], aliases: [{ account_name: 'Sub-Zero Group', alias: 'SUBZERO', normalized_alias: 'subzero', status: 'confirmed' }] });
    // Every model the import touches is recorded: the rows, the ledger and the account resolver's tables, nothing else.
    const touched = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = new Proxy(db.client() as Record<string, unknown>, { get(t, p) { touched.add(String(p)); return Reflect.get(t, p); } });
    const r = await importIntelligenceBatch(prisma, { records: [kodiak, seven, { producer: 'yards_first_brief', producerRunId: 'msg-1', producerItemId: 'x', kind: 'rumour', title: 't', reportedOn: '2026-10-09' }, container, subzero], actor: 'test', now: NOW });
    expect(r).toMatchObject({ accepted: 4, duplicates: 0, revised: 0, invalid: 1 });
    expect(r.items[2]).toMatchObject({ index: 2, outcome: 'invalid', reason: 'kind_unknown' });
    const rows = await prisma.gapSignal.findMany({});
    expect(rows).toHaveLength(4);
    const k = rows.find((x: { title: string }) => x.title.startsWith('Kodiak'))!;
    expect(k).toMatchObject({ origin: REPORT_IMPORT_ORIGIN, source_class: 'report', research_status: 'none', note: null, url: 'https://www.nasdaq.com/press-release/kodiak-charger', url_hash: intelligenceIdentityHash('yards_first_brief', '2026-10-09#1'), submitted_by: 'import:yards_first_brief', event_id: k.id, resolution: 'needs_account', account_name: null });
    expect(k.published_at.toISOString()).toBe('2026-10-09T00:00:00.000Z');
    const imp = importOf(k.metadata)!;
    expect(imp.text).toContain('A safety driver remains behind the wheel');
    expect(imp.uncertainty).toContain('LOW on driverless timing and scale');
    expect(imp.interpretation).toContain('Casey’s move');
    expect(imp.importedAt).toBe(NOW.toISOString());
    expect(imp.revisions).toEqual([]);
    // The unresolved, url-less 7-Eleven item lands with nothing but its words.
    const s = rows.find((x: { title: string }) => x.title.startsWith('7-Eleven'))!;
    expect(s).toMatchObject({ url: null, account_name: null, resolution: 'needs_account' });
    // The container is the archive, never a digest row.
    expect(rows.find((x: { title: string }) => x.title.startsWith('Yards First Daily'))).toMatchObject({ source_class: REPORT_ARCHIVE_CLASS, relevance: 'research_lead' });
    // The engagement record resolves its account from the hint (an alias), keeps the event date and the CRM ids.
    const z = rows.find((x: { title: string }) => x.title.startsWith('Mark Marshall'))!;
    expect(z).toMatchObject({ account_name: 'Sub-Zero Group', resolution: 'resolved', account_hint: 'SUBZERO' });
    expect(z.published_at.toISOString()).toBe('2026-10-08T00:00:00.000Z');
    expect(importOf(z.metadata)!.sourceRecordIds).toContainEqual({ system: 'hubspot', type: 'engagement', id: '118262547717' });
    const ledger = await prisma.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT } });
    expect(ledger.map((l: { subject_id: string; payload: Record<string, unknown> }) => [l.subject_id, l.payload.accepted, l.payload.invalid, l.payload.runId, l.payload.reportedOnTo])).toEqual([
      ['yards_first_brief', 3, 1, 'msg-1', '2026-10-09'],
      ['codex_hubspot_report', 1, 0, 'msg-2', '2026-10-08'],
    ]);
    expect([...touched].filter((k) => !k.startsWith('$') && k !== 'then').sort()).toEqual(['account', 'canonicalAccountLink', 'gapAccountAlias', 'gapAuditEvent', 'gapSignal']);
  });

  it('the same batch twice is duplicates; a changed item is a revision with the previous hash kept and the disposition untouched', async () => {
    const db = ledgerDb({ accounts: [], aliases: [] });
    const prisma = db.client();
    await importIntelligenceBatch(prisma, { records: [kodiak, seven], actor: 'test', now: NOW });
    const again = await importIntelligenceBatch(prisma, { records: [kodiak, seven], actor: 'test', now: new Date(NOW.getTime() + 3_600_000) });
    expect(again).toMatchObject({ accepted: 0, duplicates: 2, revised: 0, invalid: 0 });
    expect(await prisma.gapSignal.count({})).toBe(2);
    // Casey saved the Kodiak item as context; the producer then revised its passage.
    const k = (await prisma.gapSignal.findMany({}))[0];
    await prisma.gapSignal.update({ where: { id: k.id }, data: { feedback: 'good_context', feedback_by: 'casey' } });
    const later = new Date(NOW.getTime() + 7_200_000);
    const rev = await importIntelligenceBatch(prisma, { records: [{ ...kodiak, text: `${kodiak.text} Kodiak later disclosed four trucks.` }], actor: 'test', now: later });
    expect(rev).toMatchObject({ accepted: 0, duplicates: 0, revised: 1 });
    const after = (await prisma.gapSignal.findUnique({ where: { id: k.id } }))!;
    expect(after.feedback).toBe('good_context');
    const imp = importOf(after.metadata)!;
    expect(imp.text).toContain('four trucks');
    expect(imp.importedAt).toBe(NOW.toISOString());
    expect(imp.revisions).toHaveLength(1);
    expect(imp.revisions[0].replacedAt).toBe(later.toISOString());
    expect(await prisma.gapSignal.count({})).toBe(2);
  });

  it('a source url already captured from elsewhere groups the imported row into that event; a producer mismatch is invalid', async () => {
    const db = ledgerDb({ accounts: [], aliases: [], signals: [{ id: 'share1', url: 'https://www.nasdaq.com/press-release/kodiak-charger', url_hash: '0d8d6cb4a2e1dd77d07ad4d4a0d5c0b73c3a0b0e4b4a4e8b9d7d8b6e3f3f9a1c', title: 'Kodiak and Charger', source_name: 'nasdaq.com', source_class: 'news', published_at: NOW, created_at: NOW, origin: 'casey_share', account_name: null, account_hint: null, resolution: 'needs_account', research_status: 'none', relevance: 'research_lead', categories: [], score: null, event_id: 'share1', feedback: null, feedback_at: null, note: null, submitted_by: 'casey', metadata: {} }] });
    const prisma = db.client();
    const { normalizeSignalUrl, signalUrlHash } = await import('@/lib/gap/signals/intake');
    await prisma.gapSignal.update({ where: { id: 'share1' }, data: { url_hash: signalUrlHash(normalizeSignalUrl('https://www.nasdaq.com/press-release/kodiak-charger')!) } });
    const r = await importIntelligenceBatch(prisma, { records: [kodiak, subzero], actor: 'test', now: NOW, producer: 'yards_first_brief' });
    expect(r).toMatchObject({ accepted: 1, invalid: 1 });
    expect(r.items[1]).toMatchObject({ outcome: 'invalid', reason: 'producer_mismatch' });
    const k = (await prisma.gapSignal.findMany({ where: { origin: REPORT_IMPORT_ORIGIN } }))[0];
    expect(k.event_id).toBe('share1');
  });
});
