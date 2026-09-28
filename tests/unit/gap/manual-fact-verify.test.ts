/**
 * Phase 2 A1: a PUBLIC fact Casey types (URL + sentence + date) goes through
 * the SAME verification contract research uses (research/run.ts
 * verifyCandidate): re-fetch the source, find the quote verbatim, dated,
 * physical-network change, page names the account. Pass -> an evidence_record
 * signal carrying the verified stamp, which the evidence gate accepts. Fail ->
 * context only, with the reason, and the gate refuses it. Operator knowledge
 * never becomes quotable.
 */
import { describe, expect, it, vi } from 'vitest';
import { verifyPublicFact } from '@/lib/gap/research/manual-fact';
import { outreachFactRefusal } from '@/lib/gap/research/evidence-gate';

const NOW = new Date('2026-09-28T15:00:00.000Z');
const URL_ = 'https://news.example/pepsico-gatik';
const QUOTE = 'PepsiCo will expand its autonomous freight program to a new distribution center in Texas this year.';
const PAGE = `PepsiCo news. ${QUOTE} More detail about the rollout.`;

function db() {
  let n = 0;
  const id = (p: string) => `${p}${++n}`;
  const t: Record<string, any[]> = { runs: [], records: [], signals: [], audit: [] };
  const prisma: any = {
    researchRun: {
      create: vi.fn(async ({ data }: any) => { const r = { id: id('run'), ...data }; t.runs.push(r); return { id: r.id }; }),
      update: vi.fn(async ({ where, data }: any) => Object.assign(t.runs.find((r) => r.id === where.id), data)),
    },
    evidenceRecord: {
      upsert: vi.fn(async ({ where, create }: any) => {
        const k = where.account_name_claim_hash_source_url_observed_at;
        let r = t.records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url);
        if (!r) { r = { id: id('ev'), ...create }; t.records.push(r); }
        return r;
      }),
      findUnique: vi.fn(async ({ where }: any) => { const k = where.account_name_claim_hash_source_url_observed_at; return t.records.find((x) => x.claim_hash === k.claim_hash && x.source_url === k.source_url) ?? null; }),
    },
    prospectingSignal: {
      findUnique: vi.fn(async ({ where }: any) => t.signals.find((s) => s.source_kind === where.source_kind_source_id.source_kind && s.source_id === where.source_kind_source_id.source_id) ?? null),
      create: vi.fn(async ({ data }: any) => { const s = { id: id('sig'), ...data }; t.signals.push(s); return s; }),
    },
    gapAuditEvent: { create: vi.fn(async ({ data }: any) => { t.audit.push(data); return { id: id('a') }; }) },
  };
  return { prisma, t };
}

const input = (over: Partial<Parameters<typeof verifyPublicFact>[1]> = {}) => ({
  accountName: 'PepsiCo',
  personaId: null,
  url: URL_,
  title: 'PepsiCo expands autonomous freight',
  excerpt: QUOTE,
  publishedAt: new Date('2026-08-26T00:00:00Z'),
  actor: 'casey@freightroll.com',
  now: NOW,
  ...over,
});

describe('verifyPublicFact: one verification contract for hand-added public facts', () => {
  it('URL + exact eligible quote -> VERIFIED evidence_record signal the evidence gate accepts', async () => {
    const { prisma, t } = db();
    const r = await verifyPublicFact(prisma, input(), { fetchText: async () => PAGE });
    expect(r.verified).toBe(true);
    const s = t.signals.find((x) => x.id === (r as { signalId: string }).signalId);
    expect(s).toMatchObject({ source_kind: 'evidence_record', evidence_text: QUOTE, evidence_url: URL_, account_name: 'PepsiCo', external_ok: true });
    expect(s.metadata).toMatchObject({ verified: 'excerpt_found_at_source', provider: 'manual' });
    expect(outreachFactRefusal(s, 'PepsiCo')).toBeNull();
    expect(t.audit.map((a) => a.kind)).toContain('research.manual_fact');
  });

  it('URL + quote NOT found at the source -> context only, never verified, and the gate refuses it', async () => {
    const { prisma, t } = db();
    const r = await verifyPublicFact(prisma, input(), { fetchText: async () => 'PepsiCo news with other words entirely.' });
    expect(r).toMatchObject({ verified: false, reason: 'excerpt_not_found_at_source' });
    const s = t.signals.find((x) => x.id === (r as { signalId: string }).signalId);
    expect(s.source_kind).toBe('manual');
    expect(s.metadata?.verified).toBeUndefined();
    expect(outreachFactRefusal(s, 'PepsiCo')).not.toBeNull();
    expect(t.signals.some((x) => x.metadata?.verified)).toBe(false);
  });

  it.each([
    ['no publication date', { publishedAt: null }, 'no_publication_date'],
    ['not a physical-network change', { excerpt: 'PepsiCo reported strong quarterly results and raised guidance.' }, 'not_a_physical_operations_fact'],
    ['no quote at all', { excerpt: '' }, 'no_excerpt'],
  ] as const)('%s -> context only (%s)', async (_label, over, reason) => {
    const { prisma, t } = db();
    const page = `PepsiCo. ${String((over as { excerpt?: string }).excerpt ?? QUOTE)}`;
    const r = await verifyPublicFact(prisma, input(over as never), { fetchText: async () => page });
    expect(r).toMatchObject({ verified: false, reason });
    expect(t.signals.some((x) => x.metadata?.verified)).toBe(false);
  });

  it('a page that does not name the account is refused, even with the quote on it', async () => {
    const { prisma } = db();
    const q = 'The company will expand its autonomous freight program to a new distribution center in Texas this year.';
    const r = await verifyPublicFact(prisma, input({ excerpt: q }), { fetchText: async () => `Some other company. ${q}` });
    expect(r).toMatchObject({ verified: false, reason: 'page_does_not_name_account' });
  });

  it('an unreadable source is context only with the fetch reason', async () => {
    const { prisma } = db();
    const r = await verifyPublicFact(prisma, input(), { fetchText: async () => { throw new Error('fetch 403'); } });
    expect(r).toMatchObject({ verified: false, reason: 'source_unreadable:fetch 403' });
  });
});
