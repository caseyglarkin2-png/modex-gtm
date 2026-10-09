/**
 * IW05: all retained intelligence is reachable. Deterministic paging over shared timestamps (no duplicate, no skip,
 * the last record reached), the filters agree with the rows and with `total`, the archive is hidden unless asked and
 * flagged when shown, a decided row is recoverable, triggers page on their own cursor, the excerpt is cut at a
 * sentence end under 400 characters, and the browse touches no model beyond the four it needs.
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { browseIntelligence, decodeCursor, encodeCursor, excerptOf, BrowseCursorError, type BrowseItem } from '@/lib/gap/signals/intelligence-browse';
import { importOf, intelligenceIdentityHash, REPORT_ARCHIVE_CLASS } from '@/lib/gap/signals/intelligence-record';
import { PROSPECT_DECISION } from '@/lib/gap/work/intel';

const NOW = new Date('2026-10-09T18:00:00.000Z');
const day = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function imported(i: number, over: Partial<Row> = {}, rec: Record<string, unknown> = {}): Row {
  const producer = (rec.producer as string) ?? 'yards_first_brief';
  const itemId = (rec.producerItemId as string) ?? `item-${i}`;
  return {
    id: `sig${String(i).padStart(4, '0')}`,
    url: `https://news.example.com/${i}`,
    url_hash: intelligenceIdentityHash(producer, itemId),
    title: `Development ${i}`,
    source_name: 'Yards First Brief',
    published_at: new Date('2026-10-08T00:00:00.000Z'),
    origin: 'report_import',
    source_class: 'report',
    note: null,
    account_hint: null,
    account_name: 'Kenco',
    candidates: null,
    resolution: 'resolved',
    resolution_basis: 'explicit_account',
    research_status: 'none',
    relevance: 'account_context',
    categories: ['YARD'],
    score: 10,
    event_id: null,
    feedback: null,
    feedback_at: null,
    submitted_by: `import:${producer}`,
    metadata: {
      import: {
        producer,
        producerLabel: producer === 'yards_first_brief' ? 'Yards First Brief' : producer,
        producerRunId: 'run-2026-10-09',
        producerItemId: itemId,
        kind: 'development',
        title: `Development ${i}`,
        text: `Kenco opened a yard in Ohio. The site runs two shifts. Trucks queue on the street.`,
        sources: [{ url: `https://news.example.com/${i}`, publisher: 'news.example.com', label: null }],
        sourceRecordIds: [{ system: 'hubspot', type: 'company', id: '12345' }],
        eventDate: '2026-10-08',
        reportedOn: '2026-10-09',
        reportedOnBasis: 'stated',
        collectedAt: null,
        importedAt: '2026-10-09T12:00:00.000Z',
        accountHint: 'Kenco',
        personHints: [],
        producerStatus: 'NEW',
        uncertainty: 'Single source.',
        interpretation: 'Worth a note to the ops lead.',
        suggestions: ['A post draft'],
        archive: { reportRef: 'run-2026-10-09', section: 'Developments' },
        visibility: 'digest',
        contentHash: 'h',
        revisions: [],
        ...rec,
      },
    },
    created_at: day(1),
    updated_at: day(1),
    ...over,
  };
}

/** A client that records every model name touched. */
function recording(client: Record<string, unknown>): { prisma: Record<string, unknown>; touched: Set<string> } {
  const touched = new Set<string>();
  const prisma = new Proxy(client, {
    get(target, prop) {
      if (typeof prop === 'string') touched.add(prop);
      return Reflect.get(target, prop);
    },
  });
  return { prisma, touched };
}

async function allPages(prisma: unknown, opts: { limit: number; filters?: Parameters<typeof browseIntelligence>[1]['filters'] }): Promise<{ pages: number; items: BrowseItem[] }> {
  const items: BrowseItem[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const r = await browseIntelligence(prisma, { now: NOW, limit: opts.limit, cursor, filters: opts.filters });
    items.push(...r.items);
    cursor = r.next;
    pages += 1;
    if (pages > 50) throw new Error('paging never ended');
  } while (cursor);
  return { pages, items };
}

describe('IW05 paging', () => {
  it('601 rows over five shared timestamps page to the end with every id exactly once and record 601 reached', async () => {
    const stamps = [day(0), day(1), day(2), day(3), day(4)];
    const signals = Array.from({ length: 601 }, (_, k) => imported(k + 1, { created_at: stamps[k % 5] }));
    const db = ledgerDb({ signals }, NOW);
    const { pages, items } = await allPages(db.client(), { limit: 200 });
    expect(pages).toBe(4);
    expect(items).toHaveLength(601);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size, 'no duplicate').toBe(601);
    expect(ids).toContain('sig0601');
    // Newest first, and within a timestamp the higher id first: a deterministic order the cursor can resume from.
    const createdOf = new Map(signals.map((s) => [s.id as string, new Date(s.created_at).getTime()]));
    for (let k = 1; k < items.length; k += 1) {
      const a = items[k - 1];
      const b = items[k];
      const ta = createdOf.get(a.id)!;
      const tb = createdOf.get(b.id)!;
      expect(ta >= tb, 'created_at desc').toBe(true);
      if (ta === tb) expect(a.id > b.id, 'id desc inside a timestamp').toBe(true);
    }
  });

  it('the limit is bounded (1..200, default 50) and total counts the filtered rows, not the page', async () => {
    const db = ledgerDb({ signals: Array.from({ length: 70 }, (_, k) => imported(k + 1)) }, NOW);
    const def = await browseIntelligence(db.client(), { now: NOW });
    expect(def.items).toHaveLength(50);
    expect(def.total).toBe(70);
    expect(def.next).not.toBeNull();
    const big = await browseIntelligence(db.client(), { now: NOW, limit: 9999 });
    expect(big.items).toHaveLength(70);
    expect(big.next).toBeNull();
    const one = await browseIntelligence(db.client(), { now: NOW, limit: 0 });
    expect(one.items).toHaveLength(1);
  });

  it('the cursor round-trips and a damaged one is refused, never silently restarted', () => {
    const c = encodeCursor('2026-10-09T18:00:00.000Z', 'sig0042');
    expect(decodeCursor(c)).toEqual({ at: new Date('2026-10-09T18:00:00.000Z'), id: 'sig0042' });
    expect(() => decodeCursor('not-a-cursor')).toThrow(BrowseCursorError);
    expect(() => decodeCursor(Buffer.from('2026-10-09T18:00:00.000Z|', 'utf8').toString('base64url'))).toThrow(BrowseCursorError);
    expect(() => decodeCursor(Buffer.from('yesterday|sig1', 'utf8').toString('base64url'))).toThrow(BrowseCursorError);
  });
});

describe('IW05 filters', () => {
  function seed() {
    const signals = [
      imported(1),
      imported(2, {}, { producer: 'freight_x_signal_desk', producerLabel: 'Freight X Signal Desk', producerItemId: 'fx-2' }),
      imported(3, { account_name: null, account_hint: 'PepsiCo', resolution: 'needs_account' }, { accountHint: 'PepsiCo' }),
      imported(4, { feedback: 'use', feedback_at: day(1) }),
      imported(5, { feedback: 'skip', feedback_at: day(40) }),
      imported(6, { feedback: 'skip', feedback_at: day(2) }),
      imported(7, { source_class: REPORT_ARCHIVE_CLASS, relevance: 'research_lead' }, { kind: 'report', producerItemId: 'report-7' }),
      imported(8, { resolution: 'rejected' }),
      imported(9, { origin: 'casey_share', source_class: 'news', submitted_by: 'casey@freightroll.com', metadata: null, title: 'A share', account_name: 'Kenco' }),
      imported(10, { created_at: day(20) }),
    ];
    const audit = [{ id: 'ev1', kind: PROSPECT_DECISION, actor: 'casey', subject_type: 'intel', subject_id: 'signal:sig0010', payload: { decision: 'pursue' }, created_at: day(0) }];
    return ledgerDb({ signals, audit, accounts: ['Kenco'] }, NOW);
  }
  const ids = (r: { items: BrowseItem[] }) => r.items.map((i) => i.id).sort();

  it('default: the archive (report containers, rejected rows) is out; everything else, decided or not, is in', async () => {
    const r = await browseIntelligence(seed().client(), { now: NOW });
    expect(ids(r)).toEqual(['sig0001', 'sig0002', 'sig0003', 'sig0004', 'sig0005', 'sig0006', 'sig0009', 'sig0010']);
    expect(r.total).toBe(8);
    expect(r.applied).toEqual({ kind: 'signal', decided: 'all', archive: false });
    expect(r.items.every((i) => !i.archived)).toBe(true);
  });

  it('archive: true shows the report container and the rejected row, flagged', async () => {
    const r = await browseIntelligence(seed().client(), { now: NOW, filters: { archive: true } });
    expect(r.total).toBe(10);
    expect(r.items.find((i) => i.id === 'sig0007')).toMatchObject({ archived: true, recordKind: 'report' });
    expect(r.items.find((i) => i.id === 'sig0008')).toMatchObject({ archived: true, resolution: 'rejected' });
  });

  it('producer and origin filter by the import identity', async () => {
    const fx = await browseIntelligence(seed().client(), { now: NOW, filters: { producer: 'Freight X Signal Desk' } });
    expect(ids(fx)).toEqual(['sig0002']);
    expect(fx.total).toBe(1);
    expect(fx.applied.producer).toBe('freight_x_signal_desk');
    expect(fx.items[0]).toMatchObject({ producer: 'freight_x_signal_desk', producerLabel: 'Freight X Signal Desk', producerItemId: 'fx-2' });
    const share = await browseIntelligence(seed().client(), { now: NOW, filters: { origin: 'casey_share' } });
    expect(ids(share)).toEqual(['sig0009']);
    expect(share.items[0]).toMatchObject({ producer: null, producerLabel: null, excerpt: null, sources: [], title: 'A share' });
  });

  it('account matches the resolved name or the hint, case-insensitively', async () => {
    const pep = await browseIntelligence(seed().client(), { now: NOW, filters: { account: 'pepsico' } });
    expect(ids(pep)).toEqual(['sig0003']);
    expect(pep.items[0]).toMatchObject({ accountName: null, accountHint: 'PepsiCo' });
    const kenco = await browseIntelligence(seed().client(), { now: NOW, filters: { account: 'KENCO' } });
    expect(kenco.total).toBe(7);
  });

  it('decided follows the Work rule: feedback decides, an expired skip does not, a ledger decision does; a decided row is recoverable', async () => {
    const decided = await browseIntelligence(seed().client(), { now: NOW, filters: { decided: 'decided' } });
    expect(ids(decided)).toEqual(['sig0004', 'sig0006', 'sig0010']);
    expect(decided.total).toBe(3);
    expect(decided.items.every((i) => i.decided)).toBe(true);
    expect(decided.items.find((i) => i.id === 'sig0004')?.feedback).toBe('use');
    const undecided = await browseIntelligence(seed().client(), { now: NOW, filters: { decided: 'undecided' } });
    expect(ids(undecided)).toEqual(['sig0001', 'sig0002', 'sig0003', 'sig0005', 'sig0009']);
    expect(undecided.total).toBe(5);
    expect(undecided.items.every((i) => !i.decided)).toBe(true);
  });

  it('since is a day floor on created_at', async () => {
    const r = await browseIntelligence(seed().client(), { now: NOW, filters: { since: '2026-10-01' } });
    expect(ids(r)).not.toContain('sig0010');
    expect(r.total).toBe(7);
    const bad = await browseIntelligence(seed().client(), { now: NOW, filters: { since: 'last week' } });
    expect(bad.applied.since).toBeUndefined();
    expect(bad.total).toBe(8);
  });

  it('an item carries the record contract and the truth label, and the imported text is handed back as data', async () => {
    const r = await browseIntelligence(seed().client(), { now: NOW, filters: { producer: 'yards_first_brief', account: 'Kenco', decided: 'undecided' } });
    const it = r.items.find((i) => i.id === 'sig0001')!;
    expect(it).toMatchObject({
      key: 'signal:sig0001',
      kind: 'signal',
      title: 'Development 1',
      url: 'https://news.example.com/1',
      origin: 'report_import',
      recordKind: 'development',
      excerpt: 'Kenco opened a yard in Ohio. The site runs two shifts. Trucks queue on the street.',
      sources: [{ url: 'https://news.example.com/1', publisher: 'news.example.com', label: null }],
      sourceRecordIds: [{ system: 'hubspot', type: 'company', id: '12345' }],
      eventDate: '2026-10-08',
      reportedOn: '2026-10-09',
      publishedAt: '2026-10-08T00:00:00.000Z',
      publishedDateOnly: true,
      importedAt: '2026-10-09T12:00:00.000Z',
      accountName: 'Kenco',
      accountHint: null,
      truth: 'unverified_status',
      decided: false,
      archived: false,
      producerStatus: 'NEW',
      uncertainty: 'Single source.',
      interpretation: 'Worth a note to the ops lead.',
      suggestions: 1,
      revisions: 0,
    });
    expect(importOf(seed().store.gapSignal[0].metadata)?.suggestions).toEqual(['A post draft']);
  });
});

describe('IW05 triggers', () => {
  function seed() {
    const seen = new Date('2026-10-07T12:00:00.000Z');
    const triggers = [
      { id: 1, url_hash: 'a', account_slug: 'kenco', account_name: 'Kenco', title: 'Kenco expands', url: 'https://x.example.com/1', source: 'news', score: 40, categories: ['YARD'], published_at: new Date('2026-10-06T00:00:00.000Z'), first_seen_at: seen, dismissed: false },
      { id: 2, url_hash: 'b', account_slug: 'acme', account_name: 'Acme Foods', title: 'Acme automates', url: 'https://x.example.com/2', source: 'news', score: 30, categories: [], published_at: null, first_seen_at: seen, dismissed: false },
      { id: 3, url_hash: 'c', account_slug: 'kenco', account_name: 'Kenco', title: 'Old news', url: 'https://x.example.com/3', source: 'web', score: 10, categories: [], published_at: new Date('2026-06-01T00:00:00.000Z'), first_seen_at: seen, dismissed: false },
      { id: 4, url_hash: 'd', account_slug: 'kenco', account_name: 'Kenco', title: 'Dismissed', url: 'https://x.example.com/4', source: 'news', score: 10, categories: [], published_at: null, first_seen_at: new Date('2026-10-05T12:00:00.000Z'), dismissed: true },
      { id: 5, url_hash: 'e', account_slug: 'acme', account_name: 'Acme Foods', title: 'Acme hires', url: 'https://x.example.com/5', source: 'x', score: 20, categories: ['HIRING'], published_at: null, first_seen_at: new Date('2026-10-08T12:00:00.000Z'), dismissed: false },
    ];
    const audit = [{ id: 'ev1', kind: PROSPECT_DECISION, actor: 'casey', subject_type: 'intel', subject_id: 'trigger:3', payload: { decision: 'dismiss' }, created_at: day(0) }];
    return ledgerDb({ triggers, audit, accounts: ['Kenco'] }, NOW);
  }

  it('pages pounceTrigger rows on (first_seen_at desc, id desc) with their own cursor; a company that is not a GAP account is a hint', async () => {
    const { pages, items } = await allPages(seed().client(), { limit: 2, filters: { kind: 'trigger' } });
    expect(pages).toBe(2);
    expect(items.map((i) => i.key)).toEqual(['trigger:5', 'trigger:3', 'trigger:2', 'trigger:1']);
    expect(items[0]).toMatchObject({ kind: 'trigger', accountName: null, accountHint: 'Acme Foods', origin: 'pounce', truth: 'unverified_status', categories: ['HIRING'] });
    expect(items[1]).toMatchObject({ accountName: 'Kenco', truth: 'historical_observation', decided: true });
    expect(items[3]).toMatchObject({ accountName: 'Kenco', publishedAt: '2026-10-06T00:00:00.000Z', publishedDateOnly: true });
  });

  it('decided, archive and account apply to triggers; producer and origin do not', async () => {
    const und = await browseIntelligence(seed().client(), { now: NOW, filters: { kind: 'trigger', decided: 'undecided', producer: 'x', origin: 'y' } });
    expect(und.items.map((i) => i.id)).toEqual(['5', '2', '1']);
    expect(und.total).toBe(3);
    expect(und.applied).toEqual({ kind: 'trigger', decided: 'undecided', archive: false });
    const dec = await browseIntelligence(seed().client(), { now: NOW, filters: { kind: 'trigger', decided: 'decided' } });
    expect(dec.items.map((i) => i.id)).toEqual(['3']);
    const arch = await browseIntelligence(seed().client(), { now: NOW, filters: { kind: 'trigger', archive: true } });
    expect(arch.total).toBe(5);
    expect(arch.items.find((i) => i.id === '4')).toMatchObject({ archived: true });
    const acme = await browseIntelligence(seed().client(), { now: NOW, filters: { kind: 'trigger', account: 'acme foods' } });
    expect(acme.items.map((i) => i.id)).toEqual(['5', '2']);
  });

  it('a signal cursor handed to the trigger kind is refused', async () => {
    await expect(browseIntelligence(seed().client(), { now: NOW, cursor: encodeCursor(NOW, 'sig0001'), filters: { kind: 'trigger' } })).rejects.toThrow(BrowseCursorError);
  });
});

describe('IW05 excerpt', () => {
  it('is cut at the last sentence end inside 400 characters and never exceeds 400', () => {
    const sentence = 'Kenco opened a yard in Ohio that runs two shifts and queues trucks on the street. ';
    const text = sentence.repeat(12);
    const e = excerptOf(text)!;
    expect(e.length).toBeLessThanOrEqual(400);
    expect(e.endsWith('.')).toBe(true);
    expect(e).toBe(sentence.repeat(4).trim());
    const noEnds = 'word '.repeat(200);
    const w = excerptOf(noEnds)!;
    expect(w.length).toBeLessThanOrEqual(400);
    expect(w.endsWith('word')).toBe(true);
    expect(excerptOf('  Short.  ')).toBe('Short.');
    expect(excerptOf('line one\n\nline two')).toBe('line one line two');
    expect(excerptOf('')).toBeNull();
    expect(excerptOf(null)).toBeNull();
  });
});

describe('IW05 reads', () => {
  it('touches gapSignal, pounceTrigger, gapAuditEvent and account only', async () => {
    const db = ledgerDb({ signals: [imported(1)], triggers: [{ id: 1, url_hash: 'a', account_slug: 'kenco', account_name: 'Kenco', title: 't', url: 'https://x.example.com/1', source: 'news', score: 1, categories: [], published_at: null, first_seen_at: day(1), dismissed: false }], accounts: ['Kenco'] }, NOW);
    const { prisma, touched } = recording(db.client() as unknown as Record<string, unknown>);
    await browseIntelligence(prisma, { now: NOW });
    await browseIntelligence(prisma, { now: NOW, filters: { kind: 'trigger', archive: true } });
    expect([...touched].sort()).toEqual(['account', 'gapAuditEvent', 'gapSignal', 'pounceTrigger']);
  });
});
