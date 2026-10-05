/**
 * DISCARD ONE GAP-CREATED GMAIL DRAFT (owner resolution, 2026-10-05): the server proves GAP created it (ledger row,
 * decision, recipient, mailbox agree) before the one draft id is deleted; a draft Gmail no longer has goes to
 * reconciliation, never "discarded" by inference; the reason is truthful; nothing else in Gmail is touched.
 */
import { describe, expect, it, vi } from 'vitest';
import { discardGapDraft } from '@/lib/gap/execution/draft-discard';

const NOW = new Date('2026-10-05T16:00:00Z');
const SENDER = { refreshToken: 'r', userEmail: 'casey@yardflow.ai', displayName: 'Casey' } as const;
const DRAFTED = { engine: 'gmail_draft', status: 'drafted', routingDecisionId: 'dec-1', hypothesisId: 'h1', personaId: 928, accountName: 'PepsiCo', recipient: 'michelle.schlie@pepsico.com', senderIdentity: 'casey@yardflow.ai', subject: 'Doors versus spots', contentHash: 'x', bodySnapshot: 'b', sequenceVersionId: 'v', compileId: 'c', gmailDraftId: 'r7108052208134565800', gmailDraftMessageId: 'm1', gmailThreadId: 't1', createdAt: '2026-10-05T00:26:16.378Z' };

function db(rows: Array<{ id: string; kind: string; payload: any; created_at: Date }> = [{ id: 'e1', kind: 'execution.gmail_drafted', payload: DRAFTED, created_at: new Date('2026-10-05T00:26:29Z') }]) {
  const ledger = [...rows];
  const prisma = {
    gapAuditEvent: {
      findMany: vi.fn(async ({ where }: any) => ledger.filter((r) => r.kind && where.kind.in.includes(r.kind) && where.subject_id === 'dec-1')),
      create: vi.fn(async ({ data }: any) => { ledger.push({ id: `e${ledger.length + 1}`, kind: data.kind, payload: data.payload, created_at: NOW }); return { id: `e${ledger.length}` }; }),
    },
    routingDecision: { findUnique: vi.fn(async ({ where }: any) => (where.id === 'dec-1' ? { id: 'dec-1', account_name: 'PepsiCo', persona_id: 928 } : null)) },
  };
  return { prisma, ledger };
}
const input = { decisionId: 'dec-1', gmailDraftId: 'r7108052208134565800', recipient: 'michelle.schlie@pepsico.com', reason: 'stale_pre_operator_who_draft' as const, actor: 'casey@yardflow.ai', now: NOW };

describe('discardGapDraft', () => {
  it('deletes exactly the ledger draft and appends the discarded fate with a truthful reason', async () => {
    const { prisma, ledger } = db();
    const deleteDraft = vi.fn(async () => 'deleted' as const);
    const r = await discardGapDraft(prisma, input, { gapSender: () => SENDER, getDraftState: async () => ({ exists: true, messageId: 'm1' }), deleteDraft });
    expect(r).toMatchObject({ ok: true, action: 'discarded', gmailDraftId: 'r7108052208134565800', recipient: 'michelle.schlie@pepsico.com' });
    expect(deleteDraft).toHaveBeenCalledWith('r7108052208134565800', SENDER);
    const fate = ledger.find((e) => e.kind === 'execution.gmail_draft_discarded')!;
    expect(fate.payload).toMatchObject({ status: 'discarded', gmailDraftId: 'r7108052208134565800', reason: 'stale_pre_operator_who_draft', discardedBy: 'casey@yardflow.ai', recipient: 'michelle.schlie@pepsico.com', accountName: 'PepsiCo', personaId: 928 });
    expect(JSON.stringify(fate.payload)).not.toMatch(/unsubscribe/i);
  });
  it('an unknown draft id, a wrong recipient, a mismatched decision or an invalid reason refuses before Gmail is read', async () => {
    const { prisma } = db();
    const getDraftState = vi.fn();
    const deleteDraft = vi.fn();
    const deps = { gapSender: () => SENDER, getDraftState, deleteDraft };
    expect(await discardGapDraft(prisma, { ...input, gmailDraftId: 'r999' }, deps)).toMatchObject({ ok: false, reason: 'draft_not_found' });
    expect(await discardGapDraft(prisma, { ...input, recipient: 'someone.else@pepsico.com' }, deps)).toMatchObject({ ok: false, reason: 'recipient_mismatch' });
    expect(await discardGapDraft(prisma, { ...input, reason: 'because' as never }, deps)).toMatchObject({ ok: false, reason: 'invalid_reason' });
    const mism = db([{ id: 'e1', kind: 'execution.gmail_drafted', payload: { ...DRAFTED, personaId: 916 }, created_at: NOW }]);
    expect(await discardGapDraft(mism.prisma, input, deps)).toMatchObject({ ok: false, reason: 'draft_mismatch' });
    expect(getDraftState).not.toHaveBeenCalled();
    expect(deleteDraft).not.toHaveBeenCalled();
  });
  it('the wrong mailbox, or no GAP mailbox, refuses; nothing is deleted', async () => {
    const { prisma } = db();
    const deleteDraft = vi.fn();
    expect(await discardGapDraft(prisma, input, { gapSender: () => null, deleteDraft })).toMatchObject({ ok: false, reason: 'gap_sender_unconfigured' });
    expect(await discardGapDraft(prisma, input, { gapSender: () => ({ ...SENDER, userEmail: 'casey@freightroll.com' }), deleteDraft })).toMatchObject({ ok: false, reason: 'sender_mailbox_mismatch' });
    expect(deleteDraft).not.toHaveBeenCalled();
  });
  it('a draft Gmail no longer has is reconciled, never read as discarded: a SENT message records sent', async () => {
    const { prisma, ledger } = db();
    const deleteDraft = vi.fn();
    const reconcile = vi.fn(async () => ({ ok: true as const, gmailDraftId: 'r7108052208134565800', fate: 'sent' as const, changed: true, sent: { sentAt: '2026-10-05T01:00:00Z' } as never }));
    const r = await discardGapDraft(prisma, input, { gapSender: () => SENDER, getDraftState: async () => ({ exists: false }), deleteDraft, reconcile });
    expect(r).toMatchObject({ ok: true, action: 'reconciled', fate: 'sent' });
    expect(r.ok && r.action === 'reconciled' && r.detail).toMatch(/SENT 2026-10-05T01:00:00Z; recorded as sent, nothing discarded/);
    expect(deleteDraft).not.toHaveBeenCalled();
    expect(ledger.some((e) => e.kind === 'execution.gmail_draft_discarded')).toBe(false);
  });
  it('an already sent or discarded draft is a no-op that says so', async () => {
    const { prisma } = db([
      { id: 'e1', kind: 'execution.gmail_drafted', payload: DRAFTED, created_at: NOW },
      { id: 'e2', kind: 'execution.gmail_draft_sent', payload: { gmailDraftId: DRAFTED.gmailDraftId, gmailSentMessageId: 's1', sentAt: '2026-10-05T01:00:00Z' }, created_at: NOW },
    ]);
    const r = await discardGapDraft(prisma, input, { gapSender: () => SENDER, getDraftState: vi.fn(), deleteDraft: vi.fn() });
    expect(r).toMatchObject({ ok: true, action: 'none', fate: 'sent' });
  });
  it('an unreadable Gmail writes nothing and says so', async () => {
    const { prisma, ledger } = db();
    const r = await discardGapDraft(prisma, input, { gapSender: () => SENDER, getDraftState: async () => { throw new Error('503'); }, deleteDraft: vi.fn() });
    expect(r).toMatchObject({ ok: false, reason: 'gmail_unreadable' });
    expect(ledger).toHaveLength(1);
  });
});

describe('the client bundle never reaches node:crypto through the discard reasons (build trap, 2026-10-05)', () => {
  it('the reasons module has no imports, and the panel reads only that module', async () => {
    const { readFileSync } = await import('node:fs');
    const reasons = readFileSync('src/lib/gap/execution/draft-discard-reasons.ts', 'utf8');
    expect(reasons).not.toMatch(/^\s*import /m);
    const panel = readFileSync('src/components/gap/outstanding-draft-panel.tsx', 'utf8');
    expect(panel).toMatch(/from '@\/lib\/gap\/execution\/draft-discard-reasons'/);
    expect(panel).not.toMatch(/from '@\/lib\/gap\/execution\/draft-discard'/);
  });
});
