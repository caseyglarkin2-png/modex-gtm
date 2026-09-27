/**
 * Release B read-only review follow-ups (red team T2/T4 hardening).
 *
 *  #2 the person lock covers BOTH identities: two persona rows sharing one
 *     mailbox take the same address lock, and the second claim is refused
 *  #3 drafts are claimed under the person lock like a direct send; an
 *     outstanding draft is seen INSIDE the lock; a draft whose Gmail answer
 *     was lost leaves an open claim, never an invisible orphan
 *  #6 a token failure happens before anything exists: the claim is released
 */
import { describe, expect, it, vi } from 'vitest';
import { claimSendKey, personSendHistory, personStepKey } from '@/lib/gap/execution/person-history';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';
import { DIRECT_RELEASED, DRAFT_CLAIMED, DRAFTED, isDefinitelyNotSent, lockPerson } from '@/lib/gap/execution/draft-ledger';
import type { ExecutionReceipt } from '@/lib/gap/execution/contract';
import { NOW, baseDeps, db, gmailFake, prismaOf } from './fixtures/seller-db';

const JOEY = 'joey.maggard@kroger.com';
const ACTOR = 'casey@freightroll.com';

function lockKeys(p: any): string[] {
  return p.$executeRaw.mock.calls.map((c: any[]) => c.slice(1).join(''));
}

describe('#2 the person lock covers persona AND address', () => {
  it('two persona rows sharing one mailbox take the same address lock, in a fixed order', async () => {
    const p: any = { $executeRaw: vi.fn(async () => 1) };
    await lockPerson(p, 1886, ' Joey.Maggard@Kroger.com ');
    await lockPerson(p, 2001, JOEY);
    const keys = lockKeys(p);
    expect(keys.filter((k) => k === `gap_send_addr:${JOEY}`)).toHaveLength(2);
    expect(keys).toContain('gap_send_persona:1886');
    expect(keys).toContain('gap_send_persona:2001');
    // fixed order within each call (sorted), so two lockers never deadlock
    expect(keys.slice(0, 2)).toEqual([...keys.slice(0, 2)].sort());
  });

  it('a claim through the duplicate persona row is refused once the first persona claimed the step', async () => {
    const d = db();
    d.personas.push({ ...d.personas[0], id: 2001 });
    d.decisions.push({ ...d.decisions[0], id: 'dec-dup', persona_id: 2001 });
    const prisma = prismaOf(d);
    const a = await claimSendKey(prisma, { key: personStepKey(1886, JOEY, 0), decisionId: 'dec-joey', personaId: 1886, recipient: JOEY, stepIndex: 0, actor: ACTOR, now: NOW });
    const b = await claimSendKey(prisma, { key: personStepKey(2001, JOEY, 0), decisionId: 'dec-dup', personaId: 2001, recipient: JOEY, stepIndex: 0, actor: ACTOR, now: NOW });
    expect(a).toEqual({ claimed: true });
    expect(b).toEqual({ claimed: false, state: 'unresolved' });
  });
});

describe('#3 drafts are claimed under the person lock', () => {
  it('an outstanding draft is seen INSIDE the lock: a direct claim for that step is refused as drafted', async () => {
    const d = db();
    d.audit.push({ id: 'dr', kind: DRAFTED, subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: NOW, payload: { gmailDraftId: 'r1', stepIndex: 0, recipient: JOEY, personaId: 1886, createdAt: NOW.toISOString(), contentHash: 'x' } });
    const r = await claimSendKey(prismaOf(d), { key: personStepKey(1886, JOEY, 0), decisionId: 'dec-joey', personaId: 1886, recipient: JOEY, stepIndex: 0, actor: ACTOR, now: NOW });
    expect(r).toEqual({ claimed: false, state: 'drafted' });
  });

  it('CREATE GMAIL DRAFT writes a draft claim first, and its DRAFTED row closes it', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const r = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, baseDeps(d));
    expect(r).toMatchObject({ ok: true, alreadyDrafted: false });
    const claim = d.audit.find((a) => a.kind === DRAFT_CLAIMED)!;
    const drafted = d.audit.find((a) => a.kind === DRAFTED)!;
    expect(drafted.payload.claimKey).toBe(claim.payload.idempotencyKey);
    const h = await personSendHistory(prisma, 1886, JOEY);
    expect(h.unresolvedClaims).toHaveLength(0);
    expect(h.drafts).toHaveLength(1);
  });

  it('a draft whose Gmail answer was lost leaves an OPEN claim: the next draft and a direct send are both refused', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    gmail.createGmailDraft = vi.fn(async () => {
      throw new Error('socket hang up');
    }) as any;
    const lost = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, baseDeps(d, 'pass', gmail));
    expect(lost).toMatchObject({ ok: false, reason: 'gmail_refused' });
    expect(d.audit.some((a) => a.kind === DIRECT_RELEASED)).toBe(false);

    const again = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: new Date(NOW.getTime() + 60_000) }, baseDeps(d));
    expect(again).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });

    const direct = vi.fn();
    const send = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, { ...baseDeps(d), activeOpportunity: async () => false, directAdapter: direct as any });
    expect(send).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(direct).not.toHaveBeenCalled();
  });

  it('a draft Gmail provably refused (suppression, before the wire) releases its claim', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    gmail.createGmailDraft = vi.fn(async () => {
      throw new Error('Cross-plane suppression refused this send: joey is do-not-contact');
    }) as any;
    await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, baseDeps(d, 'pass', gmail));
    expect(d.audit.filter((a) => a.kind === DIRECT_RELEASED)).toHaveLength(1);
    expect((await personSendHistory(prisma, 1886, JOEY)).unresolvedClaims).toHaveLength(0);
  });
});

describe('#6 a token failure is definitive: nothing was sent', () => {
  it('Gmail token unavailable (invalid_grant, token timeout) releases the claim; a 5xx or an unknown outcome does not', () => {
    expect(isDefinitelyNotSent('Gmail token unavailable: invalid_grant')).toBe(true);
    expect(isDefinitelyNotSent('Gmail token unavailable: no token within 10000ms')).toBe(true);
    expect(isDefinitelyNotSent('Gmail draft create failed (400): bad')).toBe(true);
    expect(isDefinitelyNotSent('Gmail draft create failed (503): later')).toBe(false);
    expect(isDefinitelyNotSent('Gmail send outcome unknown: no answer within 25000ms')).toBe(false);
    expect(isDefinitelyNotSent('Token has been expired or revoked.')).toBe(false);
  });

  it('a send refused with a token failure releases the claim, and a later retry sends once', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const deps = (adapter: any) => ({ ...baseDeps(d), activeOpportunity: async () => false, directAdapter: adapter });
    const pv = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, deps(vi.fn()));
    if (!pv.ok || !('preview' in pv)) throw new Error(JSON.stringify(pv));
    const confirm = { contentHash: pv.preview.contentHash, recipient: JOEY };
    const tokenFail = vi.fn(async (intent: any): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: 'Gmail token unavailable: invalid_grant' }));
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(tokenFail))).toMatchObject({ ok: false, reason: 'send_refused' });
    const ok = vi.fn(async (intent: any): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'sent', engineId: 'm', threadId: 't', createdAt: intent.now, sentAt: intent.now }));
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(ok))).toMatchObject({ ok: true, alreadySent: false });
    expect(ok).toHaveBeenCalledTimes(1);
  });
});
