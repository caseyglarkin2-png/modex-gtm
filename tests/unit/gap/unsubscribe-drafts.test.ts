/**
 * Ops closeout (item 8): an unsubscribe invalidates the GAP-created Gmail
 * drafts still addressed to that recipient. The send gate already refuses an
 * unsubscribed recipient, but a draft sitting in Gmail is a human bypass: one
 * click on Send in Gmail and it goes.
 *
 * Only drafts GAP itself created and can positively identify (a DRAFTED
 * ledger row for this recipient whose gmailDraftId has no SENT/DISCARDED fate)
 * are touched. Gmail failing never fails the unsubscribe: it leaves a
 * reconciliation row.
 */
import { describe, expect, it, vi } from 'vitest';
import { DRAFTED, DRAFT_DISCARDED, DRAFT_SENT, listDraftRecords } from '@/lib/gap/execution/draft-ledger';
import { DRAFT_INVALIDATION_PENDING, invalidateGapDraftsFor } from '@/lib/gap/execution/unsubscribe-drafts';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { recordUnsubscribe } from '@/lib/email/unsubscribe';
import { NOW, db, prismaOf, baseDeps } from './fixtures/seller-db';

const JOEY = 'joey.maggard@kroger.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'x', displayName: 'Casey Larkin' };

function drafted(decisionId: string, gmailDraftId: string, recipient = JOEY) {
  return { id: `ev-${gmailDraftId}`, kind: DRAFTED, subject_type: 'routing_decision', subject_id: decisionId, created_at: new Date(NOW.getTime() - 3_600_000), payload: { engine: 'gmail_draft', status: 'drafted', routingDecisionId: decisionId, recipient, personaId: 1886, gmailDraftId, stepIndex: 0 } };
}
function fateRow(kind: string, decisionId: string, gmailDraftId: string) {
  return { id: `ev-${kind}-${gmailDraftId}`, kind, subject_type: 'routing_decision', subject_id: decisionId, created_at: NOW, payload: { routingDecisionId: decisionId, gmailDraftId, status: kind === DRAFT_SENT ? 'sent' : 'discarded' } };
}

describe('invalidateGapDraftsFor', () => {
  it('an outstanding GAP draft for the recipient is deleted in the GAP mailbox and ledgered DISCARDED (reason recipient_unsubscribed)', async () => {
    const d = db();
    d.audit.push(drafted('dec-joey', 'r-1'));
    const prisma = prismaOf(d);
    const deleteDraft = vi.fn(async () => 'deleted' as const);
    const out = await invalidateGapDraftsFor(prisma, 'Joey.Maggard@Kroger.com', { deleteDraft, sender: SENDER, now: NOW });
    expect(out).toEqual({ found: 1, deleted: 1, pending: 0 });
    expect(deleteDraft).toHaveBeenCalledWith('r-1', SENDER);
    const discarded = d.audit.filter((e) => e.kind === DRAFT_DISCARDED);
    expect(discarded).toHaveLength(1);
    expect(discarded[0].payload).toMatchObject({ gmailDraftId: 'r-1', routingDecisionId: 'dec-joey', reason: 'recipient_unsubscribed' });
    expect((await listDraftRecords(prisma, 'dec-joey'))[0].fate).toBe('discarded');
  });

  it('a draft already sent or discarded, and a draft to someone else, are never touched', async () => {
    const d = db();
    d.audit.push(drafted('dec-joey', 'r-sent'), fateRow(DRAFT_SENT, 'dec-joey', 'r-sent'));
    d.audit.push(drafted('dec-joey', 'r-gone'), fateRow(DRAFT_DISCARDED, 'dec-joey', 'r-gone'));
    d.audit.push(drafted('dec-jason', 'r-other', 'jason.gaiser@kroger.com'));
    const deleteDraft = vi.fn(async () => 'deleted' as const);
    const out = await invalidateGapDraftsFor(prismaOf(d), JOEY, { deleteDraft, sender: SENDER, now: NOW });
    expect(out).toEqual({ found: 0, deleted: 0, pending: 0 });
    expect(deleteDraft).not.toHaveBeenCalled();
  });

  it('Gmail failing never throws: a reconciliation row is left and the draft is NOT marked discarded', async () => {
    const d = db();
    d.audit.push(drafted('dec-joey', 'r-1'));
    const out = await invalidateGapDraftsFor(prismaOf(d), JOEY, { deleteDraft: vi.fn(async () => { throw new Error('Gmail drafts.delete failed (503)'); }), sender: SENDER, now: NOW });
    expect(out).toEqual({ found: 1, deleted: 0, pending: 1 });
    expect(d.audit.some((e) => e.kind === DRAFT_DISCARDED)).toBe(false);
    const pending = d.audit.filter((e) => e.kind === DRAFT_INVALIDATION_PENDING);
    expect(pending).toHaveLength(1);
    expect(pending[0].payload).toMatchObject({ gmailDraftId: 'r-1', recipient: JOEY, reason: 'gmail_error' });
    expect(String(pending[0].payload.detail)).toContain('503');
  });

  it('a draft Gmail no longer has (sent or deleted by hand) is NOT assumed discarded: reconciliation decides', async () => {
    const d = db();
    d.audit.push(drafted('dec-joey', 'r-1'));
    const out = await invalidateGapDraftsFor(prismaOf(d), JOEY, { deleteDraft: vi.fn(async () => 'not_found' as const), sender: SENDER, now: NOW });
    expect(out).toEqual({ found: 1, deleted: 0, pending: 1 });
    expect(d.audit.some((e) => e.kind === DRAFT_DISCARDED)).toBe(false);
    expect(d.audit.find((e) => e.kind === DRAFT_INVALIDATION_PENDING)?.payload).toMatchObject({ reason: 'draft_not_found_reconcile' });
  });

  it('no GAP mailbox configured: nothing is deleted from any other mailbox; a reconciliation row is left', async () => {
    const d = db();
    d.audit.push(drafted('dec-joey', 'r-1'));
    const deleteDraft = vi.fn(async () => 'deleted' as const);
    const out = await invalidateGapDraftsFor(prismaOf(d), JOEY, { deleteDraft, sender: null, now: NOW });
    expect(out).toEqual({ found: 1, deleted: 0, pending: 1 });
    expect(deleteDraft).not.toHaveBeenCalled();
    expect(d.audit.find((e) => e.kind === DRAFT_INVALIDATION_PENDING)?.payload).toMatchObject({ reason: 'no_gap_mailbox' });
  });
});

describe('end to end: GAP draft -> unsubscribe -> DNC -> draft invalidated -> future send refused', () => {
  it('holds even when Gmail cleanup fails', async () => {
    for (const gmail of ['works', 'fails'] as const) {
      const d = db();
      d.audit.push(drafted('dec-joey', 'r-1'));
      const prisma = prismaOf(d);
      const unsubscribed = new Set<string>();
      prisma.unsubscribedEmail = {
        findUnique: vi.fn(async ({ where }: any) => (unsubscribed.has(where.email) ? { id: 'u', email: where.email } : null)),
        findFirst: vi.fn(async ({ where }: any) => (unsubscribed.has(String(where.email.equals).toLowerCase()) ? { id: 'u' } : null)),
        create: vi.fn(async ({ data }: any) => { unsubscribed.add(data.email); return { id: 'u', ...data }; }),
      };
      prisma.persona.updateMany = vi.fn(async ({ where }: any) => {
        let n = 0;
        for (const p of d.personas) if (p.email?.toLowerCase() === String(where.email.equals).toLowerCase()) { p.do_not_contact = true; n += 1; }
        return { count: n };
      });
      prisma.persona.findFirst = vi.fn(async () => null);
      const deleteDraft = gmail === 'works' ? vi.fn(async () => 'deleted' as const) : vi.fn(async () => { throw new Error('timeout'); });

      const result = await recordUnsubscribe(prisma, { email: JOEY, source: 'unsubscribe_link', hubspot: { enabled: false }, gapDrafts: { invalidate: (p, e) => invalidateGapDraftsFor(p, e, { deleteDraft, sender: SENDER, now: NOW }) } });
      expect(result.created).toBe(true);
      expect(d.personas.find((p) => p.id === 1886).do_not_contact).toBe(true);
      expect(result.gapDrafts).toEqual(gmail === 'works' ? { found: 1, deleted: 1, pending: 0 } : { found: 1, deleted: 0, pending: 1 });

      const again = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d));
      expect(again).toMatchObject({ ok: false, reason: 'persona_do_not_contact' });
    }
  });
});
