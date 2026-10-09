/**
 * IW09/IW10: the Clawd export mapper and its import. The mapper on three items (one with raw_text.summary, one with
 * nothing but a title, one candidate); the mapped sample lands through importIntelligenceBatch on the in-memory ledger
 * with the cursor on the ledger row; a second import is duplicates; a relevance-45 item lands (no threshold anywhere).
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { CLAWD_PRODUCER, CLAWD_REPORT_REF, datePart, mapClawdPage, mapClawdSignal, type ClawdExportItem } from '@/lib/gap/signals/clawd-export';
import { importIntelligenceBatch } from '@/lib/gap/signals/intelligence-import';
import { INTEL_IMPORTED_EVENT, REPORT_IMPORT_ORIGIN, importOf, intelligenceIdentityHash, validateIntelligenceRecord } from '@/lib/gap/signals/intelligence-record';

const NOW = new Date('2026-10-09T15:00:00.000Z');
const OPTS = { capturedOn: '2026-10-09', runId: 'clawd-export:2026-10-09T15:00:00.000Z' };

const withSummary: ClawdExportItem = {
  signal_id: 'a1b2c3d4e5f6',
  title: 'Acme Logistics deploys yard management system across 12 DCs',
  url: 'https://www.freightwaves.com/news/acme-yms?utm_source=rss',
  source: 'rss:freightwaves',
  company: 'Acme Logistics',
  domain: 'acmelogistics.com',
  vendor: 'Kaleris',
  customer: 'Acme Logistics',
  intent_category: 'yard_automation',
  urgency: 'warm',
  relevance: 72,
  keyword_score: 9,
  cluster_id: 'acme-deploys-yard',
  published: '2026-10-07T14:30:00+00:00',
  fetched_at: '2026-10-08T06:15:12+00:00',
  classified: true,
  matched_keywords: ['yard management system', 'kaleris'],
  tags: ['rss'],
  raw_text: { summary: 'Acme Logistics will roll out a Kaleris yard management system at twelve distribution centers by spring.', body: 'A longer body that loses to the summary.' },
};

const titleOnly: ClawdExportItem = {
  signal_id: 'ffffffffffff',
  title: 'Dock scheduling pilot noted in a regional carrier update',
  url: '',
  source: 'web:search',
  company: '',
  domain: '',
  relevance: 45,
  keyword_score: 3,
  cluster_id: '',
  published: null,
  fetched_at: null,
  classified: false,
  matched_keywords: [],
  tags: [],
  raw_text: {},
};

const candidate: ClawdExportItem = {
  signal_id: '0123456789ab',
  title: 'Warehouse automation vendor names new regional sales lead',
  url: 'https://news.example.com/story/777',
  source: 'news:google',
  company: 'Example Automation',
  domain: '',
  intent_category: 'vendor_news',
  urgency: 'cold',
  relevance: 24,
  keyword_score: 3,
  cluster_id: 'vendor-names-lead',
  published: '2018-05-02T00:00:00+00:00',
  fetched_at: '2026-10-08T06:15:12+00:00',
  classified: true,
  matched_keywords: ['warehouse automation'],
  tags: [],
  raw_text: { excerpt: 'The vendor said the hire supports its yard and dock product line.' },
  candidate: true,
  dropped_reason: 'relevance_below_40',
  captured_at: '2026-10-08T06:16:00+00:00',
};

describe('IW09: the Clawd export mapper', () => {
  it('maps a classified item with raw_text.summary into a development record with its dates, source and labels', () => {
    const r = mapClawdSignal(withSummary, OPTS);
    expect(r).not.toBeNull();
    expect(r).toMatchObject({
      producer: CLAWD_PRODUCER,
      producerRunId: OPTS.runId,
      producerItemId: 'a1b2c3d4e5f6',
      kind: 'development',
      title: 'Acme Logistics deploys yard management system across 12 DCs',
      text: 'Acme Logistics will roll out a Kaleris yard management system at twelve distribution centers by spring.',
      sources: [{ url: 'https://www.freightwaves.com/news/acme-yms?utm_source=rss', publisher: 'www.freightwaves.com', label: 'rss:freightwaves' }],
      eventDate: '2026-10-07',
      reportedOn: '2026-10-08',
      reportedOnBasis: 'stated',
      collectedAt: '2026-10-08T06:15:12.000Z',
      accountHint: 'Acme Logistics',
      producerStatus: 'relevance 72',
      interpretation: 'Clawd classified it: yard_automation, urgency warm, keywords yard management system, kaleris',
      uncertainty: "Relevance 72 by Clawd's classifier; not verified by GAP.",
      archive: { reportRef: CLAWD_REPORT_REF, section: 'acme-deploys-yard' },
      visibility: 'digest',
    });
    // the contract accepts it as handed in, and strips the tracking parameter from the source
    const v = validateIntelligenceRecord(r);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.record.sources[0].url).toBe('https://www.freightwaves.com/news/acme-yms');
  });

  it('maps a title-only item into an observation whose text is the title, reported on the capture day, with no interpretation', () => {
    const r = mapClawdSignal(titleOnly, OPTS);
    expect(r).toMatchObject({
      kind: 'observation',
      title: titleOnly.title,
      text: titleOnly.title,
      sources: [],
      eventDate: null,
      reportedOn: '2026-10-09',
      reportedOnBasis: 'captured',
      collectedAt: null,
      accountHint: null,
      producerStatus: 'relevance 45',
      interpretation: null,
      archive: { reportRef: CLAWD_REPORT_REF, section: null },
      visibility: 'digest',
    });
    expect(validateIntelligenceRecord(r).ok).toBe(true);
  });

  it('maps a candidate row with its flag in the status, a historical event date kept as stated, and digest visibility all the same', () => {
    const r = mapClawdSignal(candidate, OPTS);
    expect(r).toMatchObject({
      kind: 'development',
      text: 'The vendor said the hire supports its yard and dock product line.',
      eventDate: '2018-05-02',
      reportedOn: '2026-10-08',
      accountHint: 'Example Automation',
      producerStatus: 'relevance 24, candidate',
      interpretation: 'Clawd classified it: vendor_news, urgency cold, keywords warehouse automation',
      uncertainty: "Relevance 24 by Clawd's classifier; not verified by GAP.",
      visibility: 'digest',
    });
  });

  it('answers null for an item with neither title nor text, a domain alone makes a development, and an unscored item says so', () => {
    expect(mapClawdSignal({ signal_id: 'x', title: '', raw_text: { summary: '   ' } }, OPTS)).toBeNull();
    expect(mapClawdSignal({ signal_id: '', title: 'No id' }, OPTS)).toBeNull();
    expect(mapClawdSignal({ signal_id: 'd', title: 'Domain only', domain: 'kenco.com' }, OPTS)).toMatchObject({ kind: 'development', accountHint: 'kenco.com' });
    expect(mapClawdSignal({ signal_id: 'u', title: 'Unscored', relevance: null }, OPTS)).toMatchObject({ producerStatus: 'relevance not scored', uncertainty: "Not scored by Clawd's classifier; not verified by GAP." });
    expect(mapClawdPage([withSummary, { signal_id: 'empty', title: '' }, titleOnly], OPTS)).toMatchObject({ skipped: 1 });
    expect(datePart('2026-10-08T06:15:12+00:00')).toBe('2026-10-08');
    expect(datePart('2026-13-40')).toBeNull();
    expect(datePart('')).toBeNull();
  });

  it('is deterministic: the same item maps to the same record', () => {
    expect(mapClawdSignal(withSummary, OPTS)).toEqual(mapClawdSignal({ ...withSummary }, { ...OPTS }));
  });
});

describe('IW10: the mapped sample through the import', () => {
  it('lands the three records once with the cursor on the ledger row, a second import is duplicates, and relevance 45 and 24 land like 72', async () => {
    const db = ledgerDb({ accounts: ['Acme Logistics'], aliases: [] });
    const prisma = db.client();
    const { records } = mapClawdPage([withSummary, titleOnly, candidate], OPTS);
    expect(records).toHaveLength(3);

    const first = await importIntelligenceBatch(prisma, { records, actor: 'test', now: NOW, runId: OPTS.runId, cursor: '2026-10-08T06:15:12+00:00|9123', producer: CLAWD_PRODUCER, producerState: { status: 'ok' } });
    expect(first).toMatchObject({ accepted: 3, duplicates: 0, revised: 0, invalid: 0 });

    const rows = await prisma.gapSignal.findMany({ where: { origin: REPORT_IMPORT_ORIGIN } });
    expect(rows).toHaveLength(3);
    const byItem = new Map<string, Record<string, unknown>>(rows.map((r: Record<string, unknown>) => [String(r.url_hash), r]));
    const acme = byItem.get(intelligenceIdentityHash(CLAWD_PRODUCER, 'a1b2c3d4e5f6')) as Record<string, unknown>;
    expect(acme).toMatchObject({ source_name: 'Clawd signal hunter', submitted_by: `import:${CLAWD_PRODUCER}`, account_hint: 'Acme Logistics', account_name: 'Acme Logistics', url: 'https://www.freightwaves.com/news/acme-yms' });
    expect((acme.published_at as Date).toISOString()).toBe('2026-10-07T00:00:00.000Z');
    expect(importOf(acme.metadata)).toMatchObject({ producerStatus: 'relevance 72', visibility: 'digest', archive: { reportRef: CLAWD_REPORT_REF } });

    const fortyFive = byItem.get(intelligenceIdentityHash(CLAWD_PRODUCER, 'ffffffffffff')) as Record<string, unknown>;
    expect(fortyFive).toBeTruthy();
    expect(importOf(fortyFive.metadata)).toMatchObject({ producerStatus: 'relevance 45', visibility: 'digest' });
    const twentyFour = byItem.get(intelligenceIdentityHash(CLAWD_PRODUCER, '0123456789ab')) as Record<string, unknown>;
    expect(importOf(twentyFour.metadata)).toMatchObject({ producerStatus: 'relevance 24, candidate', eventDate: '2018-05-02', visibility: 'digest' });

    const ledger = await prisma.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT } });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ subject_type: 'producer', subject_id: CLAWD_PRODUCER, payload: { runId: OPTS.runId, cursor: '2026-10-08T06:15:12+00:00|9123', accepted: 3, duplicates: 0, producerState: { status: 'ok' } } });

    const again = await importIntelligenceBatch(prisma, { records: mapClawdPage([withSummary, titleOnly, candidate], OPTS).records, actor: 'test', now: new Date(NOW.getTime() + 60_000), runId: `${OPTS.runId}-2`, cursor: null, producer: CLAWD_PRODUCER });
    expect(again).toMatchObject({ accepted: 0, duplicates: 3, revised: 0, invalid: 0 });
    expect(await prisma.gapSignal.count({ where: { origin: REPORT_IMPORT_ORIGIN } })).toBe(3);
    expect(await prisma.gapAuditEvent.count({ where: { kind: INTEL_IMPORTED_EVENT } })).toBe(2);
  });
});
