/**
 * Stabilization B: VERIFY means "check this source". Casey pressing Verify (a source card) or Research (Signal
 * intake) never creates a Pounce trigger, a Slack ping or HubSpot trigger heat, whatever the check finds. The
 * automatic discovery path keeps its existing promotion rules.
 */
import { describe, expect, it, vi } from 'vitest';
import { promoteSignal } from '@/lib/gap/signals/promote';
import { applySignalOp } from '@/lib/gap/signals/ops';
import { applySourceOp } from '@/lib/gap/sources/source-ops';
import { normalizeSignalUrl, signalUrlHash } from '@/lib/gap/signals/intake';

const NOW = new Date('2026-10-01T12:00:00Z');
const base = { id: 's1', url: 'https://www.freightwaves.com/news/x', title: 'PepsiCo opens a new distribution center in Texas', account_name: 'PepsiCo', resolution: 'resolved', research_status: 'fact_found', promoted_trigger_id: null, feedback: null, event_id: null, published_at: new Date('2026-09-28T00:00:00Z'), origin: 'discovery', created_at: NOW };

function db(row: Record<string, unknown>) {
  const r: Record<string, unknown> = { ...row };
  const prisma = {
    gapSignal: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; url_hash?: string } }) => (where.id === r.id || where.url_hash === r.url_hash ? r : null)),
      findFirst: vi.fn(async () => null),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => Object.assign(r, data)),
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
    },
    gapAuditEvent: { create: vi.fn(async () => ({ id: 'a' })) },
    account: { findFirst: vi.fn(async () => ({ name: 'PepsiCo' })) },
    pounceTrigger: { findMany: vi.fn(async () => []), findUnique: vi.fn(async () => null) },
  };
  return { r, prisma };
}

describe('Verify has no side effects', () => {
  it('a source Casey verified is never promoted to Pounce, Slack or HubSpot, even when the check finds a fact', async () => {
    const { r, prisma } = db({ ...base, research_status: 'none', metadata: {}, url_hash: signalUrlHash(normalizeSignalUrl(base.url)!) });
    const v = await applySourceOp(prisma as never, { accountName: 'PepsiCo', url: base.url, op: 'verify', actor: 'casey@freightroll.com', now: NOW });
    expect(v).toMatchObject({ ok: true, researchStatus: 'queued' });
    expect((r.metadata as { manualVerify?: { by: string } }).manualVerify?.by).toBe('casey@freightroll.com');
    r.research_status = 'fact_found'; // the strict check later verified a fact
    const ingest = vi.fn();
    expect(await promoteSignal(prisma as never, 's1', { ingest, now: NOW })).toEqual({ ok: false, reason: 'manual_verify' });
    expect(ingest).not.toHaveBeenCalled();
  });

  it('Research from Signal intake is the same check: no promotion', async () => {
    const { r, prisma } = db({ ...base, research_status: 'none', metadata: { clustered: true } });
    const res = await applySignalOp(prisma as never, { id: 's1', actor: 'casey@freightroll.com', now: NOW, op: 'research' });
    expect(res.ok).toBe(true);
    expect(r.metadata).toMatchObject({ clustered: true, manualVerify: { by: 'casey@freightroll.com' } });
    r.research_status = 'fact_found';
    const ingest = vi.fn();
    expect(await promoteSignal(prisma as never, 's1', { ingest, now: NOW })).toEqual({ ok: false, reason: 'manual_verify' });
    expect(ingest).not.toHaveBeenCalled();
  });
  // Automatic discovery keeps its rule: pinned by signal-resolve-research.test.ts (a verified signal enters ingestTriggers).
});
