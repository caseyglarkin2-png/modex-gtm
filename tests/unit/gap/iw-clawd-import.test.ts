// @vitest-environment node
/**
 * The recurring Clawd import (2026-10-09). Pinned: pages follow the stored cursor and stop at the bound; candidates
 * are asked for; a relevance-45 item lands (no threshold); the ledger row carries the page cursor; a second run with
 * the same export is duplicates, never copies; a network failure is retried once, then recorded as a failed row that
 * health reads, and the next run resumes from the last good cursor; a refused token is not retried; nothing but the
 * rows and the ledger is written.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { runClawdImport, storedClawdCursor } from '@/lib/gap/signals/clawd-import';
import { INTEL_IMPORTED_EVENT } from '@/lib/gap/signals/intelligence-record';

const NOW = new Date('2026-10-09T20:00:00Z');
const item = (n: number, over: Record<string, unknown> = {}) => ({ signal_id: `sig-${n}`, title: `Signal ${n}`, url: `https://news.example/${n}`, source: 'news', company: n % 2 ? 'Kenco' : null, domain: n % 2 ? 'kencogroup.com' : null, vendor: null, customer: null, intent_category: 'facility_expansion', urgency: 'medium', relevance: 45, keyword_score: 2, cluster_id: null, published: '2026-10-08T12:00:00Z', fetched_at: `2026-10-09T0${n % 9}:00:00Z`, classified: true, matched_keywords: ['yard'], tags: [], raw_text: { summary: `Summary ${n}` }, ...over });
const page = (items: unknown[], next: string | null) => ({ items, next, count: items.length, source: 'postgres' });

function fetchOf(pages: Record<string, unknown>, calls: string[]): typeof fetch {
  return (async (url: string | URL) => {
    const u = new URL(String(url));
    calls.push(u.search);
    const after = u.searchParams.get('after') ?? '';
    const body = pages[after];
    if (body instanceof Error) throw body;
    if (body === 401) return new Response('{}', { status: 401 });
    return new Response(JSON.stringify(body ?? page([], null)), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
}

describe('the recurring Clawd import', () => {
  it('pages from the stored cursor, bounded, candidates included; a relevance-45 item lands; the ledger carries the cursor; a second run is duplicates', async () => {
    const prisma = ledgerDb({ accounts: ['Kenco'], aliases: [] }).client();
    const calls: string[] = [];
    const pages = { '': page([item(1), item(2)], 'c1'), c1: page([item(3), item(4, { candidate: true, relevance: 12 })], 'c2'), c2: page([item(5)], 'c3'), c3: page([item(6)], null) };
    const r = await runClawdImport(prisma, { now: NOW, baseUrl: 'https://clawd.example', token: 't', fetchImpl: fetchOf(pages, calls), maxPages: 3 });
    expect(r).toMatchObject({ ok: true, pages: 3, items: 5, accepted: 5, duplicates: 0, more: true, cursorFrom: null, cursorTo: 'c3' });
    expect(calls[0]).toContain('include=candidates');
    expect(calls[0]).not.toContain('min_relevance');
    expect(await storedClawdCursor(prisma)).toBe('c3');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await prisma.gapSignal.findMany({});
    expect(rows).toHaveLength(5);
    expect(rows.find((x) => x.title === 'Signal 1')).toMatchObject({ account_name: 'Kenco', origin: 'report_import' });
    expect(rows.find((x) => x.title === 'Signal 4')!.metadata.import.producerStatus).toBe('relevance 12, candidate');
    // The next run resumes at c3 and finds the last page; then the same export again is duplicates.
    const r2 = await runClawdImport(prisma, { now: NOW, baseUrl: 'https://clawd.example', token: 't', fetchImpl: fetchOf(pages, calls), maxPages: 3 });
    expect(r2).toMatchObject({ ok: true, pages: 1, accepted: 1, more: false });
    const again = await runClawdImport(prisma, { now: NOW, baseUrl: 'https://clawd.example', token: 't', fetchImpl: fetchOf({ c3: page([item(1), item(2), item(3)], null) }, calls), maxPages: 3 });
    expect(again).toMatchObject({ ok: true, accepted: 0, duplicates: 3 });
    expect(await prisma.gapSignal.count({})).toBe(6);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ledger: any[] = await prisma.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT } });
    expect(ledger.every((l) => l.subject_id === 'clawd_signal_hunter')).toBe(true);
    expect(ledger[0].payload.cursor).toBe('c1');
  });

  it('a network failure is retried once then recorded as a failed row; the next run resumes from the last good cursor; a refused token is not retried', async () => {
    const prisma = ledgerDb({ accounts: [], aliases: [] }).client();
    const calls: string[] = [];
    let flaky = 0;
    const pages: Record<string, unknown> = { '': page([item(1)], 'c1') };
    const fetchImpl = (async (url: string | URL) => {
      const u = new URL(String(url));
      calls.push(u.search);
      if ((u.searchParams.get('after') ?? '') === 'c1') { flaky += 1; throw new Error('socket hang up'); }
      return new Response(JSON.stringify(pages[u.searchParams.get('after') ?? '']), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await runClawdImport(prisma, { now: NOW, baseUrl: 'https://clawd.example', token: 't', fetchImpl, maxPages: 3, retryDelayMs: 1 });
    expect(r).toMatchObject({ ok: false, kind: 'network', pages: 1, cursorFrom: null });
    expect(flaky).toBe(2);
    const ledger = await prisma.gapAuditEvent.findMany({ where: { kind: INTEL_IMPORTED_EVENT }, orderBy: { created_at: 'asc' } });
    expect(ledger).toHaveLength(2);
    expect(ledger[1].payload.producerState).toMatchObject({ status: 'failed' });
    expect(ledger[1].payload.cursor).toBe('c1');
    expect(await storedClawdCursor(prisma)).toBe('c1');
    const refused = await runClawdImport(prisma, { now: NOW, baseUrl: 'https://clawd.example', token: 'bad', fetchImpl: fetchOf({ c1: 401 }, calls), maxPages: 1 });
    expect(refused).toMatchObject({ ok: false, kind: 'auth' });
    expect(calls.filter((c) => c.includes('after=c1')).length).toBe(3);
  });
});
