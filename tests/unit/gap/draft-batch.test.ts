import { describe, expect, it, vi } from 'vitest';
import { reconcilePendingDrafts } from '@/lib/gap/execution/draft-batch';
import { DRAFTED, DRAFT_DISCARDED, DRAFT_SENT } from '@/lib/gap/execution/draft-ledger';

const NOW = new Date('2026-09-26T12:00:00Z');

function store(n: number) {
  const audit: any[] = [];
  for (let i = 0; i < n; i += 1) {
    audit.push({ id: `e${i}`, kind: DRAFTED, subject_type: 'routing_decision', subject_id: `dec-${i}`, created_at: new Date(NOW.getTime() - (n - i) * 60_000), payload: { gmailDraftId: `r-${i}`, recipient: `p${i}@x.com`, createdAt: new Date(NOW.getTime() - 3_600_000).toISOString(), senderIdentity: 'casey@yardflow.ai', gmailThreadId: `t-${i}`, contentHash: 'h' } });
  }
  const prisma = {
    gapAuditEvent: {
      findMany: vi.fn(async ({ where }: any) =>
        audit
          .filter((a) => a.subject_type === where.subject_type && where.kind.in.includes(a.kind) && (!where.subject_id || a.subject_id === where.subject_id) && (!where.created_at || a.created_at >= where.created_at.gte))
          .sort((a, b) => (where.subject_id ? b.created_at - a.created_at : a.created_at - b.created_at)),
      ),
      create: vi.fn(async ({ data }: any) => {
        audit.push({ id: `n${audit.length}`, created_at: new Date(NOW.getTime() + audit.length), ...data });
        return { id: `n${audit.length}` };
      }),
    },
    routingDecision: { updateMany: vi.fn(), update: vi.fn() },
  };
  return { audit, prisma };
}

const YF = () => ({ serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai' });

describe('reconcilePendingDrafts (passive, cron)', () => {
  it('is bounded: reads the ledger, then checks at most `limit` drafts', async () => {
    const { prisma } = store(40);
    const getDraftState = vi.fn(async () => ({ exists: true as const, messageId: 'm' }));
    const r = await reconcilePendingDrafts(prisma, { now: NOW, limit: 25 }, { gapSender: YF, getDraftState });
    expect(r).toMatchObject({ pending: 40, checked: 25, stillDrafted: 25, sent: 0, errors: [] });
    expect(getDraftState).toHaveBeenCalledTimes(25);
  });

  it('records a sent fate once; the next run finds nothing pending for it (idempotent)', async () => {
    const { prisma, audit } = store(1);
    const deps = {
      gapSender: YF,
      getDraftState: vi.fn(async () => ({ exists: false as const })),
      getThread: vi.fn(async () => [{ id: 'm-sent', labelIds: ['SENT'], internalDate: new Date(NOW.getTime() - 1_800_000), to: 'p0@x.com', from: 'casey@yardflow.ai' }]),
    };
    expect(await reconcilePendingDrafts(prisma, { now: NOW }, deps)).toMatchObject({ checked: 1, sent: 1 });
    expect(audit.filter((a) => a.kind === DRAFT_SENT)).toHaveLength(1);
    expect(await reconcilePendingDrafts(prisma, { now: NOW }, deps)).toMatchObject({ pending: 0, checked: 0 });
    expect(audit.filter((a) => a.kind === DRAFT_SENT)).toHaveLength(1);
    expect(deps.getDraftState).toHaveBeenCalledTimes(1);
  });

  it('never fabricates a human action and never touches routing decisions', async () => {
    const { prisma } = store(3);
    await reconcilePendingDrafts(prisma, { now: NOW }, { gapSender: YF, getDraftState: async () => ({ exists: false }), getThread: async () => [] });
    expect(prisma.routingDecision.updateMany).not.toHaveBeenCalled();
    expect(prisma.routingDecision.update).not.toHaveBeenCalled();
  });

  it('an unreadable Gmail is counted, writes nothing, and does not stop the batch', async () => {
    const { prisma, audit } = store(3);
    const r = await reconcilePendingDrafts(prisma, { now: NOW }, { gapSender: YF, getDraftState: async () => { throw new Error('503'); } });
    expect(r.errors).toHaveLength(3);
    expect(audit.some((a) => a.kind === DRAFT_SENT || a.kind === DRAFT_DISCARDED)).toBe(false);
  });

  it('the module source has no send path', async () => {
    const src = (await import('node:fs')).readFileSync('src/lib/gap/execution/draft-batch.ts', 'utf8');
    expect(src).not.toMatch(/sendViaGmail|sendGmailDraft|createGmailDraft|messages\/send|drafts\/send/);
  });
});
