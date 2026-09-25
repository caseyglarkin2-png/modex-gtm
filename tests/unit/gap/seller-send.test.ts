import { describe, expect, it, vi } from 'vitest';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';
import { DIRECT_CLAIMED, DIRECT_RELEASED, DIRECT_SENT, DRAFTED } from '@/lib/gap/execution/draft-ledger';
import type { ExecutionReceipt } from '@/lib/gap/execution/contract';
import { NOW, baseDeps, db, prismaOf, type Db } from './fixtures/seller-db';

const YF = { serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai', displayName: 'Casey Larkin' };
const SIG = '<div>Casey Larkin · <b>Founding AE</b>, YardFlow by FreightRoll</div>';

/** The fixture plus what a send touches: an advisory lock that really serializes, EmailLog, human_action. */
function sendPrisma(d: Db) {
  const p: any = prismaOf(d);
  let lock: Promise<unknown> = Promise.resolve();
  p.$executeRaw = vi.fn(async () => 1);
  p.$transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const run = lock.then(() => fn(p));
    lock = run.catch(() => undefined);
    return run;
  });
  p.emailLog = { create: vi.fn(async () => ({ id: 1 })) };
  const acted = new Set<string>();
  p.routingDecision.updateMany = vi.fn(async ({ where, data }: any) => {
    if (acted.has(where.id)) return { count: 0 };
    acted.add(where.id);
    d.decisions.find((x) => x.id === where.id).human_action = data.human_action;
    return { count: 1 };
  });
  p.gapAuditEvent.findMany = vi.fn(async ({ where }: any) =>
    d.audit.filter((a) => a.subject_type === where.subject_type && a.subject_id === where.subject_id && (typeof where.kind === 'string' ? a.kind === where.kind : where.kind.in.includes(a.kind))),
  );
  return p;
}

function adapter(outcome: Partial<ExecutionReceipt> | Error = {}) {
  return vi.fn(async (intent: any): Promise<ExecutionReceipt> => {
    if (outcome instanceof Error) return { engine: 'gmail_direct', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: outcome.message };
    return { engine: 'gmail_direct', status: 'sent', engineId: 'msg-1', threadId: 'thr-1', createdAt: intent.now, sentAt: intent.now, ...outcome };
  });
}

const deps = (d: Db, direct = adapter(), extra: Record<string, unknown> = {}) => ({
  ...baseDeps(d, 'pass'),
  gapSender: () => YF,
  signature: async () => SIG,
  activeOpportunity: async () => false,
  directAdapter: direct as any,
  ...extra,
});

const ACTOR = 'casey@freightroll.com';

async function preview(prisma: any, d: Db, dd = deps(d)) {
  const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, dd);
  if (!r.ok || !('preview' in r)) throw new Error(`expected a preview, got ${JSON.stringify(r)}`);
  return r.preview;
}

describe('SEND FROM YARDFLOW: preview and confirmation', () => {
  it('preview shows the final email from casey@yardflow.ai with the canonical signature and sends nothing', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const pv = await preview(prisma, d, deps(d, direct));
    expect(pv).toMatchObject({ from: 'casey@yardflow.ai', fromName: 'Casey Larkin', to: 'joey.maggard@kroger.com', toName: 'joey maggard', subject: 'Doors versus spots' });
    expect(pv.body).toMatch(/^Hi Joey,/);
    expect(pv.body).toContain('Founding AE');
    expect(pv.body).not.toContain('Casey Larkin, YardFlow by FreightRoll\n\nCasey');
    expect(pv.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(direct).not.toHaveBeenCalled();
    expect(d.audit.some((a) => a.kind === DIRECT_CLAIMED)).toBe(false);
  });

  it('CONFIRM + SEND sends ONE email as HUMAN_APPROVED_1TO1 bound to the confirmed recipient and content; records truth and human_action=emailed', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const pv = await preview(prisma, d, deps(d, direct));
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.contentHash, recipient: pv.to } }, deps(d, direct));
    expect(r).toMatchObject({ ok: true, alreadySent: false, humanAction: 'recorded' });
    expect(direct).toHaveBeenCalledTimes(1);
    const [intent, wire] = direct.mock.calls[0] as any[];
    expect(intent).toMatchObject({ engine: 'gmail_direct', actorKind: 'human', mode: 'live', senderIdentity: 'casey@yardflow.ai' });
    expect(wire).toMatchObject({ to: 'joey.maggard@kroger.com', purpose: 'HUMAN_APPROVED_1TO1', humanConfirmation: { actor: ACTOR, recipient: 'joey.maggard@kroger.com', contentHash: pv.contentHash }, sender: YF });
    expect(wire.cc).toBeUndefined();
    expect(wire.html).toContain('Founding AE');
    const sent = d.audit.find((a) => a.kind === DIRECT_SENT)!;
    expect(sent.payload).toMatchObject({ engine: 'gmail_direct', gmailSentMessageId: 'msg-1', gmailThreadId: 'thr-1', recipient: 'joey.maggard@kroger.com', senderIdentity: 'casey@yardflow.ai', contentHash: pv.contentHash, sequenceVersionId: 'ver-hc', stepIndex: 0, routingDecisionId: 'dec-joey', hypothesisId: 'hyp-kr', confirmedBy: ACTOR });
    expect(d.decisions.find((x) => x.id === 'dec-joey').human_action).toBe('emailed');
    expect(d.audit.find((a) => a.kind === 'decision.human_action')!.payload).toMatchObject({ action: 'emailed', source: 'confirmed_direct_send', gmailSentMessageId: 'msg-1' });
    expect(prisma.emailLog.create).toHaveBeenCalledTimes(1);
    expect(d.audit.some((a) => a.kind === DRAFTED)).toBe(false);
  });

  it('no confirm, no send: a request without confirmation is a preview only', async () => {
    const d = db();
    const direct = adapter();
    await preview(sendPrisma(d), d, deps(d, direct));
    expect(direct).not.toHaveBeenCalled();
  });

  it('copy or recipient changed after confirmation: refused, Gmail never called', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const pv = await preview(prisma, d, deps(d, direct));
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: 'f'.repeat(64), recipient: pv.to } }, deps(d, direct))).toMatchObject({ ok: false, reason: 'copy_changed_since_review' });
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.contentHash, recipient: 'someone.else@kroger.com' } }, deps(d, direct))).toMatchObject({ ok: false, reason: 'recipient_changed_since_review' });
    expect(direct).not.toHaveBeenCalled();
  });
});

describe('idempotency: a double click, a retry or a refresh sends exactly once', () => {
  it('second click after success answers ALREADY SENT with time and message id, no Gmail call', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const pv = await preview(prisma, d, deps(d, direct));
    const confirm = { contentHash: pv.contentHash, recipient: pv.to };
    await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct));
    const again = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct));
    expect(again).toMatchObject({ ok: true, alreadySent: true, sent: { gmailSentMessageId: 'msg-1', sentAt: NOW.toISOString() } });
    expect(direct).toHaveBeenCalledTimes(1);
  });

  it('two concurrent confirms (double click) call Gmail once', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const pv = await preview(prisma, d, deps(d, direct));
    const confirm = { contentHash: pv.contentHash, recipient: pv.to };
    const [a, b] = await Promise.all([
      sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct)),
      sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct)),
    ]);
    expect(direct).toHaveBeenCalledTimes(1);
    expect([a, b].filter((x) => x.ok && 'alreadySent' in x && x.alreadySent === false)).toHaveLength(1);
    expect(d.audit.filter((x) => x.kind === DIRECT_SENT)).toHaveLength(1);
  });

  it('a lost Gmail answer leaves the claim unresolved: the retry is refused, never resent', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const lost = adapter(new Error('fetch failed: socket hang up'));
    const pv = await preview(prisma, d, deps(d, lost));
    const confirm = { contentHash: pv.contentHash, recipient: pv.to };
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, lost))).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    const retry = adapter();
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, retry))).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(retry).not.toHaveBeenCalled();
  });

  it('a gate that provably refused before the wire releases the claim, so a later retry may send once', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const halted = adapter(new Error('Canonical autonomy refused this send: global autonomy halted'));
    const pv = await preview(prisma, d, deps(d, halted));
    const confirm = { contentHash: pv.contentHash, recipient: pv.to };
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, halted))).toMatchObject({ ok: false, reason: 'send_refused', detail: expect.stringContaining('global autonomy halted') });
    expect(d.audit.some((a) => a.kind === DIRECT_RELEASED)).toBe(true);
    const ok = adapter();
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, ok))).toMatchObject({ ok: true, alreadySent: false });
    expect(ok).toHaveBeenCalledTimes(1);
  });
});

describe('click-time gates are re-run (never trust the rendered card)', () => {
  const confirmFor = async (d: Db) => {
    const prisma = sendPrisma(d);
    const pv = await preview(prisma, d);
    return { prisma, confirm: { contentHash: pv.contentHash, recipient: pv.to } };
  };

  it('do-not-contact set after the preview: refused', async () => {
    const d = db();
    const { prisma, confirm } = await confirmFor(d);
    d.personas[0].do_not_contact = true;
    const direct = adapter();
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct))).toMatchObject({ ok: false, reason: 'persona_do_not_contact' });
    expect(direct).not.toHaveBeenCalled();
  });

  it('an invalid address, a hypothesis no longer active, or an active opportunity: refused', async () => {
    for (const mutate of [
      (d: Db) => { d.personas[0].email_valid = false; },
      (d: Db) => { d.hypotheses[0].status = 'approved'; },
    ]) {
      const d = db();
      const { prisma, confirm } = await confirmFor(d);
      mutate(d);
      const direct = adapter();
      const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct));
      expect(r.ok).toBe(false);
      expect(direct).not.toHaveBeenCalled();
    }
    const d = db();
    const { prisma, confirm } = await confirmFor(d);
    const direct = adapter();
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct, { activeOpportunity: async () => true }))).toMatchObject({ ok: false, reason: 'active_opportunity' });
    expect(direct).not.toHaveBeenCalled();
  });

  it('the compiler rejects the copy: refused, nothing sent', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, { ...deps(d, direct), compile: baseDeps(d, 'reject').compile });
    expect(r).toMatchObject({ ok: false, reason: 'copy_rejected' });
    expect(direct).not.toHaveBeenCalled();
  });

  it('the sequence stopped (buyer replied) before a follow-up: refused', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, stepIndex: 1 }, deps(d, direct, { nextTouch: async () => ({ state: 'stopped', reason: 'replied', detail: 'Buyer replied.', sent: [] }) }));
    expect(r).toMatchObject({ ok: false, reason: 'sequence_stopped' });
    expect(direct).not.toHaveBeenCalled();
  });
});

describe('CRM logging: exactly one method, never a BCC, never a resend', () => {
  it('connected inbox: receipt records crm_log_method=connected_inbox with the HubSpot contact; the wire carries NO cc and NO bcc', async () => {
    process.env.GAP_CRM_LOG_METHOD = 'connected_inbox';
    try {
      const d = db();
      const prisma = sendPrisma(d);
      const direct = adapter();
      const pv = await preview(prisma, d, deps(d, direct));
      expect(pv.crmLogging).toBe('on');
      await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.contentHash, recipient: pv.to } }, deps(d, direct));
      const [, wire] = direct.mock.calls[0] as any[];
      expect(wire.bcc).toBeUndefined();
      expect(wire.cc).toBeUndefined();
      expect(d.audit.find((a) => a.kind === DIRECT_SENT)!.payload).toMatchObject({ crmLogMethod: 'connected_inbox', crmLogStatus: 'expected', hubspotContactId: '217681150841' });
    } finally {
      delete process.env.GAP_CRM_LOG_METHOD;
    }
  });

  it('unknown HubSpot contact or no configured method: HubSpot UNAVAILABLE, recorded truthfully as none, the email still sends once', async () => {
    process.env.GAP_CRM_LOG_METHOD = 'connected_inbox';
    try {
      const d = db();
      d.personas[0].hubspot_contact_id = null;
      const prisma = sendPrisma(d);
      const direct = adapter();
      const pv = await preview(prisma, d, deps(d, direct));
      expect(pv.crmLogging).toBe('unavailable');
      await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.contentHash, recipient: pv.to } }, deps(d, direct));
      expect(direct).toHaveBeenCalledTimes(1);
      expect(d.audit.find((a) => a.kind === DIRECT_SENT)!.payload).toMatchObject({ crmLogMethod: 'none', crmLogStatus: 'none' });
    } finally {
      delete process.env.GAP_CRM_LOG_METHOD;
    }
  });

  it('a failed post-send write (ledger/CRM side) never causes a second Gmail call', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const direct = adapter();
    const pv = await preview(prisma, d, deps(d, direct));
    const create = prisma.gapAuditEvent.create;
    prisma.gapAuditEvent.create = vi.fn(async (args: any) => {
      if (args.data.kind === DIRECT_SENT) throw new Error('db down');
      return create(args);
    });
    const confirm = { contentHash: pv.contentHash, recipient: pv.to };
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct));
    expect(r).toMatchObject({ ok: true, alreadySent: false, ledgerError: 'db down' });
    prisma.gapAuditEvent.create = create;
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, deps(d, direct))).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(direct).toHaveBeenCalledTimes(1);
  });
});
