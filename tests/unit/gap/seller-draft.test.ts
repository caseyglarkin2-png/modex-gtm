import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { DRAFTED, DRAFT_DISCARDED, DRAFT_REFUSED, DRAFT_SENT, listDraftRecords } from '@/lib/gap/execution/draft-ledger';
import { observeDraft, reconcileDraft } from '@/lib/gap/execution/draft-reconcile';
import { SEED_FAMILIES } from '@/lib/gap/sequences/families';
import type { CompileResult } from '@/lib/gap/compiler/compile';

const NOW = new Date('2026-09-25T15:00:00.000Z');
const HC = SEED_FAMILIES.find((f) => f.key === 'hidden_capacity')!;

interface Db {
  decisions: any[];
  hypotheses: any[];
  personas: any[];
  versions: any[];
  families: any[];
  compiles: any[];
  approvals: any[];
  audit: any[];
}

function db(): Db {
  return {
    decisions: [
      { id: 'dec-joey', lane: 'work_queue', action: 'enroll_gap_sequence', hypothesis_id: 'hyp-kr', persona_id: 1886, account_name: 'Kroger', rule_id: 'enroll', inputs_snapshot: { target: 'modex_queue' }, created_at: NOW },
      { id: 'dec-jason', lane: 'work_queue', action: 'research_required', hypothesis_id: null, persona_id: 1788, account_name: 'Kroger', rule_id: 'no_hypothesis', inputs_snapshot: {}, created_at: NOW },
      { id: 'dec-gm', lane: 'blocked', action: 'do_not_contact', hypothesis_id: null, persona_id: 7, account_name: 'General Mills', rule_id: 'suppressed', inputs_snapshot: {}, created_at: NOW },
    ],
    hypotheses: [
      {
        id: 'hyp-kr',
        account_name: 'Kroger',
        status: 'active',
        primary_persona_id: 1886,
        problem_family: 'hidden_capacity',
        problem_hypothesis: 'My guess is that physical handoffs constrain production capacity at Kroger.',
        observation: 'KR 10-Q (2026-06-26) mentions: capital expenditure [S:sig-1].',
        sequence_version_id: null,
        sequence_family_id: null,
        falsification_questions: [],
        signals: [{ signal: { id: 'sig-1', title: 'KR 10-Q mentions capital expenditure', evidence_url: 'https://sec.gov/x', external_ok: true, observed_at: NOW, freshness_expires_at: null, source_type: 'filing', metadata: null } }],
        events: [],
      },
    ],
    personas: [
      { id: 1886, name: 'joey maggard', title: 'corporate supply chain planning manager', email: 'joey.maggard@kroger.com', phone: '+15137624000', linkedin_url: 'http://www.linkedin.com/in/joey-maggard', hubspot_contact_id: '217681150841', account_name: 'Kroger', do_not_contact: false, email_valid: true, email_status: 'unverified' },
      { id: 1788, name: 'jason gaiser', title: null, email: 'jason.gaiser@kroger.com', phone: null, linkedin_url: null, hubspot_contact_id: null, account_name: 'Kroger', do_not_contact: false, email_valid: true, email_status: 'unverified' },
    ],
    versions: [{ id: 'ver-hc', family_id: 'fam-hc', version: 1, status: 'draft', steps: HC.steps, family: { id: 'fam-hc', name: 'Hidden Capacity', engine: 'modex_draft_queue' } }],
    families: [{ id: 'fam-hc', problem_family: 'hidden_capacity', engine: 'modex_draft_queue', archived_at: null, created_at: NOW }],
    compiles: [],
    approvals: [],
    audit: [],
  };
}

function prismaOf(d: Db) {
  let n = 0;
  const id = (p: string) => `${p}-${++n}`;
  return {
    routingDecision: {
      findUnique: vi.fn(async ({ where }: any) => d.decisions.find((x) => x.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => {
        if (where.created_at?.gt) {
          return d.decisions.filter((x) => x.persona_id === where.persona_id && x.created_at > where.created_at.gt).sort((a, b) => b.created_at - a.created_at)[0] ?? null;
        }
        return d.decisions.find((x) => x.hypothesis_id === where.hypothesis_id && x.action === where.action) ?? null;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
      update: vi.fn(),
    },
    prospectingHypothesis: { findUnique: vi.fn(async ({ where }: any) => d.hypotheses.find((x) => x.id === where.id) ?? null) },
    persona: { findUnique: vi.fn(async ({ where }: any) => d.personas.find((x) => x.id === where.id) ?? null) },
    sequenceVersion: {
      findUnique: vi.fn(async ({ where }: any) => d.versions.find((x) => x.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: any) => d.versions.find((x) => x.family_id === where.family_id) ?? null),
    },
    sequenceFamily: { findMany: vi.fn(async ({ where }: any) => d.families.filter((f) => f.problem_family === where.problem_family)) },
    gapCompile: {
      findMany: vi.fn(async ({ where }: any) =>
        d.compiles
          .filter((c) => c.hypothesis_id === where.hypothesis_id && c.sequence_version_id === where.sequence_version_id && c.step_index === where.step_index)
          .sort((a, b) => b.created_at - a.created_at),
      ),
      findUnique: vi.fn(async ({ where }: any) => d.compiles.find((c) => c.id === where.id) ?? null),
      update: vi.fn(async () => ({})),
    },
    sendApprovalRequest: {
      findFirst: vi.fn(async ({ where }: any) => {
        const tag = where.risk_reasons.has;
        return d.approvals.filter((a) => a.risk_reasons.includes(tag) && (!where.status || a.status === where.status)).at(-1) ?? null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const row = { id: id('apr'), ...data };
        d.approvals.push(row);
        return row;
      }),
    },
    gapAuditEvent: {
      create: vi.fn(async ({ data }: any) => {
        const row = { id: id('evt'), created_at: new Date(NOW.getTime() + n), ...data };
        d.audit.push(row);
        return { id: row.id };
      }),
      findMany: vi.fn(async ({ where }: any) =>
        d.audit
          .filter((a) => a.subject_type === where.subject_type && a.subject_id === where.subject_id && where.kind.in.includes(a.kind))
          .sort((a, b) => b.created_at - a.created_at),
      ),
    },
  };
}

/** A compile stand-in that records the row the way compile() persists it. */
function fakeCompile(d: Db, verdict: 'pass' | 'review_required' | 'reject') {
  return vi.fn(async (input: any): Promise<CompileResult> => {
    const row = {
      id: `cmp-${d.compiles.length + 1}`,
      hypothesis_id: input.hypothesisId,
      sequence_version_id: input.sequenceVersionId,
      step_index: input.stepIndex,
      verdict,
      created_at: NOW,
      inputs_snapshot: { subject: input.subject, body: input.body },
    };
    d.compiles.push(row);
    return {
      id: row.id,
      verdict,
      checks: verdict === 'reject' ? [{ code: 'C01', passed: false, severity: 'reject', detail: 'x', span: null }] : [],
      critic: verdict === 'pass' ? ({ ok: true, verdict: 'pass' } as any) : ({ ok: false, reason: 'critic_unconfigured' } as any),
      wordCount: 60,
      ctaFamily: null,
      allowedCtaFamily: 'gap_question' as any,
      evidenceIdsUsed: [],
      compilerVersion: 'test',
      hypothesisId: input.hypothesisId,
      stepIndex: 0,
    };
  });
}

function gmailFake() {
  return {
    createGmailDraft: vi.fn(async () => ({ provider: 'gmail' as const, draftId: 'r-draft-1', messageId: 'm-draft-1', threadId: 't-1' })),
    sendGmailDraft: vi.fn(async () => {
      throw new Error('must never be called');
    }),
    sendViaGmail: vi.fn(async () => {
      throw new Error('must never be called');
    }),
  };
}

const baseDeps = (d: Db, verdict: 'pass' | 'review_required' | 'reject' = 'pass', gmail = gmailFake()) => ({
  compile: fakeCompile(d, verdict),
  gmail,
  senderAddress: () => 'casey@freightroll.com',
  gapSender: () => null,
  signature: async () => null,
  nextTouch: async () => ({ state: 'not_started' as const }),
  unsubscribeUrl: (e: string) => `https://modex-gtm.vercel.app/unsubscribe?email=${encodeURIComponent(e)}&token=t`,
});

describe('createSellerGmailDraft', () => {
  it('Joey: creates exactly one Gmail DRAFT and a truthful drafted receipt; never sends; never records a human action', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey@freightroll.com', now: NOW }, baseDeps(d, 'pass', gmail));

    expect(r.ok).toBe(true);
    if (!r.ok || 'checked' in r) throw new Error('expected a draft');
    expect(r.alreadyDrafted).toBe(false);
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
    expect(gmail.sendGmailDraft).not.toHaveBeenCalled();
    expect(gmail.sendViaGmail).not.toHaveBeenCalled();

    const payload = (gmail.createGmailDraft.mock.calls[0] as any)[0];
    expect(payload.to).toBe('joey.maggard@kroger.com');
    expect(payload.subject).toBe('Doors versus spots');
    expect(payload.text).toMatch(/^Hi Joey,/);
    expect(payload.text).not.toMatch(/\[\[SRC:|\[S:|\{\{/);
    expect(payload.html).toContain('Unsubscribe');
    expect(payload.headers['List-Unsubscribe']).toContain('/unsubscribe?email=joey.maggard%40kroger.com');

    expect(r.receipt).toMatchObject({
      engine: 'gmail_draft',
      status: 'drafted',
      routingDecisionId: 'dec-joey',
      hypothesisId: 'hyp-kr',
      personaId: 1886,
      accountName: 'Kroger',
      recipient: 'joey.maggard@kroger.com',
      senderIdentity: 'casey@freightroll.com',
      gmailDraftId: 'r-draft-1',
      gmailDraftMessageId: 'm-draft-1',
      gmailThreadId: 't-1',
      sequenceVersionId: 'ver-hc',
      compileId: 'cmp-1',
    });
    expect(r.receipt.contentHash).toMatch(/^[0-9a-f]{64}$/);
    const drafted = d.audit.filter((a) => a.kind === DRAFTED);
    expect(drafted).toHaveLength(1);
    expect(drafted[0]).toMatchObject({ subject_type: 'routing_decision', subject_id: 'dec-joey' });
    expect(d.audit.some((a) => a.kind === DRAFT_SENT)).toBe(false);
    expect(prisma.routingDecision.updateMany).not.toHaveBeenCalled();
    expect(prisma.routingDecision.update).not.toHaveBeenCalled();
  });

  it('a second click on the same copy returns the existing draft instead of filling the mailbox', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    const again = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(again.ok && !('checked' in again) && again.alreadyDrafted).toBe(true);
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
  });

  it('copy that needs review opens an approval request and drafts nothing; once approved, the same copy drafts without recompiling', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    const deps = baseDeps(d, 'review_required', gmail);
    const r = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, deps);
    expect(r).toMatchObject({ ok: false, reason: 'copy_review_required', compileId: 'cmp-1' });
    expect(!r.ok && r.approvalRequestId).toBeTruthy();
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();

    d.approvals[0].status = 'approved';
    const r2 = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, deps);
    expect(r2.ok).toBe(true);
    expect(deps.compile).toHaveBeenCalledTimes(1);
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
  });

  it('a still-pending review on the exact copy refuses without recompiling and without a draft', async () => {
    const d = db();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    const deps = baseDeps(d, 'review_required', gmail);
    await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, deps);
    const r = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, deps);
    expect(r).toMatchObject({ ok: false, reason: 'copy_review_required', compileId: 'cmp-1' });
    expect(deps.compile).toHaveBeenCalledTimes(1);
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it('checkOnly compiles and gates the copy but never drafts', async () => {
    const d = db();
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW, checkOnly: true }, baseDeps(d, 'pass', gmail));
    expect(r).toEqual({ ok: true, checked: true, compileId: 'cmp-1' });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
    expect(d.audit.some((a) => a.kind === DRAFTED)).toBe(false);
  });

  it('an email card superseded by a newer research decision for the same person refuses (Joey after R12b)', async () => {
    const d = db();
    d.decisions.push({ id: 'dec-joey-new', lane: 'work_queue', action: 'research_required', hypothesis_id: 'hyp-kr', persona_id: 1886, account_name: 'Kroger', rule_id: 'evidence_thin', inputs_snapshot: {}, created_at: new Date(NOW.getTime() + 60_000) });
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(r).toMatchObject({ ok: false, reason: 'decision_superseded' });
    expect(!r.ok && r.detail).toContain('evidence_thin');
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it('rejected copy never drafts and names the failing checks', async () => {
    const d = db();
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'reject', gmail));
    expect(r).toMatchObject({ ok: false, reason: 'copy_rejected' });
    expect(!r.ok && r.failedChecks?.[0]).toContain('C01');
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it.each([
    ['dec-gm', 'decision_blocked'],
    ['dec-jason', 'not_an_email_action'],
    ['nope', 'decision_not_found'],
  ])('%s is refused (%s) with no Gmail call', async (decisionId, reason) => {
    const d = db();
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId, actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(r).toMatchObject({ ok: false, reason });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it('re-reads the persona and hypothesis at click time: a fresh DNC or a paused hypothesis refuses', async () => {
    const d1 = db();
    d1.personas[0].do_not_contact = true;
    expect(await createSellerGmailDraft(prismaOf(d1), { decisionId: 'dec-joey', actor: 'c', now: NOW }, baseDeps(d1))).toMatchObject({ reason: 'persona_do_not_contact' });
    const d2 = db();
    d2.hypotheses[0].status = 'paused';
    expect(await createSellerGmailDraft(prismaOf(d2), { decisionId: 'dec-joey', actor: 'c', now: NOW }, baseDeps(d2))).toMatchObject({ reason: 'hypothesis_not_active' });
    const d3 = db();
    d3.personas[0].email = null;
    expect(await createSellerGmailDraft(prismaOf(d3), { decisionId: 'dec-joey', actor: 'c', now: NOW }, baseDeps(d3))).toMatchObject({ reason: 'no_email' });
  });

  it('a wire-gate refusal inside createGmailDraft (suppression) is reported and leaves no drafted receipt', async () => {
    const d = db();
    const gmail = gmailFake();
    gmail.createGmailDraft.mockRejectedValueOnce(new Error('Cross-plane suppression refused this send: modex_do_not_contact'));
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d, 'pass', gmail));
    expect(r).toMatchObject({ ok: false, reason: 'gmail_refused' });
    expect(!r.ok && r.detail).toContain('suppression refused');
    expect(d.audit.filter((a) => a.kind === DRAFTED)).toHaveLength(0);
    expect(d.audit.filter((a) => a.kind === DRAFT_REFUSED)).toHaveLength(1);
  });

  it('the module cannot reach a send: no messages.send / drafts.send / sendViaGmail / sendGmailDraft in its source', () => {
    for (const f of ['src/lib/gap/execution/seller-draft.ts', 'src/lib/gap/execution/draft-reconcile.ts', 'src/app/api/gap/decisions/[id]/gmail-draft/route.ts']) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/sendViaGmail|sendGmailDraft|sendDraftedGmailAdapter|gmailDirectAdapter|messages\/send|drafts\/send/);
    }
  });
});

describe('GAP drafts use the casey@yardflow.ai identity end to end (closeout)', () => {
  const YF = { serviceAccountJson: '{"client_email":"x","private_key":"y"}', userEmail: 'casey@yardflow.ai', displayName: 'Casey Larkin' };

  it('hands the GAP sender to Gmail and records casey@yardflow.ai as the sender identity', async () => {
    const d = db();
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d, 'pass', gmail), gapSender: () => YF });
    expect(r.ok && !('checked' in r) && r.receipt.senderIdentity).toBe('casey@yardflow.ai');
    expect((gmail.createGmailDraft.mock.calls[0] as any)[0].sender).toEqual(YF);
  });

  it('reconciles against the SAME mailbox, and refuses if the GAP mailbox changed since the draft', async () => {
    const d = db();
    const prisma = prismaOf(d);
    await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, { ...baseDeps(d), gapSender: () => YF });
    const getDraftState = vi.fn(async () => ({ exists: true as const, messageId: 'm' }));
    const ok = await reconcileDraft(prisma, { decisionId: 'dec-joey', gmailDraftId: 'r-draft-1', actor: 'c', now: NOW }, { gapSender: () => YF, getDraftState });
    expect(ok).toMatchObject({ ok: true, fate: 'drafted' });
    expect((getDraftState.mock.calls[0] as unknown[])[1]).toEqual(YF);
    const moved = await reconcileDraft(prisma, { decisionId: 'dec-joey', gmailDraftId: 'r-draft-1', actor: 'c', now: NOW }, { gapSender: () => null, envMailbox: () => 'casey@freightroll.com', getDraftState });
    expect(moved).toMatchObject({ ok: false, reason: 'sender_mailbox_mismatch' });
    expect(getDraftState).toHaveBeenCalledTimes(1);
  });
});

describe('signature (verified 2026-09-25: Gmail does NOT add the signature to API-created drafts)', () => {
  const SIG = '<div dir="ltr">Casey Larkin &middot; Sales<br>YardFlow by FreightRoll<br>c. 410-236-7434 &middot; <a href="https://yardflow.ai">yardflow.ai</a></div>';

  it('the real Gmail signature replaces the template sign-off, once, in both parts', async () => {
    const d = db();
    const gmail = gmailFake();
    await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW }, { ...baseDeps(d, 'pass', gmail), signature: async () => SIG });
    const p = (gmail.createGmailDraft.mock.calls[0] as any)[0];
    expect(p.html).toContain('<div class="gmail_signature">' + SIG + '</div>');
    expect(p.html).not.toContain('Casey Larkin, YardFlow by FreightRoll');
    expect(p.text).toContain('410-236-7434');
    expect(p.text).not.toContain('Casey Larkin, YardFlow by FreightRoll');
    expect(p.html.indexOf('gmail_signature')).toBeLessThan(p.html.indexOf('Unsubscribe'));
  });

  it('an unreadable signature leaves the rendered copy (with its plain sign-off) untouched', async () => {
    const d = db();
    const gmail = gmailFake();
    await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW }, { ...baseDeps(d, 'pass', gmail), signature: async () => null });
    const p = (gmail.createGmailDraft.mock.calls[0] as any)[0];
    expect(p.text).toContain('Casey Larkin, YardFlow by FreightRoll');
    expect(p.html).not.toContain('gmail_signature');
  });
});

describe('follow-up touches (multi-touch manual loop)', () => {
  const sentTouch = { stepIndex: 0, sentAt: '2026-09-24T15:00:00.000Z', subject: 'Doors versus spots', gmailSentMessageId: 'm0', gmailThreadId: 't1' };
  const due = { state: 'due' as const, stepIndex: 1, dueAt: '2026-09-30T15:00:00.000Z', sent: [sentTouch], threadFrom: sentTouch, pendingDraftId: null };
  function cleanStep1(d: Db) {
    const steps = JSON.parse(JSON.stringify(HC.steps));
    steps.steps[1].templates.bodyTemplate = 'Hi {{first_name}},\nFollowing up on the question about empty doors.\n\nMy guess is the lot, not the doors, sets the pace.\n\nWorth a short scorecard?\n\nCasey Larkin, YardFlow by FreightRoll';
    d.versions[0].steps = steps;
  }

  it('a DUE touch 2 drafts in the SAME Gmail thread with In-Reply-To from Gmail truth, and records step + parent message', async () => {
    const d = db();
    cleanStep1(d);
    const gmail = gmailFake();
    const getMessageHeaders = vi.fn(async () => ({ messageIdHeader: '<abc@mail.gmail.com>', subject: 'Doors versus spots' }));
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW, stepIndex: 1 }, { ...baseDeps(d, 'pass', gmail), nextTouch: async () => due, getMessageHeaders });
    expect(r.ok && !('checked' in r) && r.receipt).toMatchObject({ stepIndex: 1, inReplyToGmailMessageId: 'm0', subject: 'Re: Doors versus spots' });
    const p = (gmail.createGmailDraft.mock.calls[0] as any)[0];
    expect(p.threadId).toBe('t1');
    expect(p.subject).toBe('Re: Doors versus spots');
    expect(p.headers).toMatchObject({ 'In-Reply-To': '<abc@mail.gmail.com>', References: '<abc@mail.gmail.com>' });
    expect(p.headers.Subject).toBeUndefined();
    expect(getMessageHeaders).toHaveBeenCalledWith('m0', undefined);
  });

  it('no thread id on record: a fresh message with the step subject, never a guessed thread', async () => {
    const d = db();
    cleanStep1(d);
    const gmail = gmailFake();
    const noThread = { ...due, threadFrom: { ...sentTouch, gmailThreadId: null } };
    await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW, stepIndex: 1 }, { ...baseDeps(d, 'pass', gmail), nextTouch: async () => noThread });
    const p = (gmail.createGmailDraft.mock.calls[0] as any)[0];
    expect(p.threadId).toBeUndefined();
    expect(p.subject).toBe(HC.steps.steps[1].templates!.subjectTemplate);
  });

  it.each([
    [{ state: 'waiting', stepIndex: 1, dueAt: '2026-09-30T15:00:00.000Z', sent: [], threadFrom: {}, pendingDraftId: null }, 'touch_not_due'],
    [{ state: 'stopped', reason: 'replied', detail: 'Buyer replied.', sent: [] }, 'sequence_stopped'],
    [{ state: 'stopped', reason: 'do_not_contact', detail: 'DNC', sent: [] }, 'sequence_stopped'],
    [{ state: 'unknown', detail: 'thread unreadable', sent: [] }, 'reply_truth_unavailable'],
  ])('touch 2 when next-touch is %j is refused (%s) with no Gmail call', async (touch, reason) => {
    const d = db();
    cleanStep1(d);
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW, stepIndex: 1 }, { ...baseDeps(d, 'pass', gmail), nextTouch: async () => touch as any });
    expect(r).toMatchObject({ ok: false, reason });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it('a second first touch is refused once touch 1 was sent', async () => {
    const d = db();
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW }, { ...baseDeps(d, 'pass', gmail), nextTouch: async () => due });
    expect(r).toMatchObject({ ok: false, reason: 'first_touch_already_sent' });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });

  it("the seed family's touch 2 cites fixture evidence about another company ('Fontana'): refused, never drafted", async () => {
    const d = db();
    const gmail = gmailFake();
    const r = await createSellerGmailDraft(prismaOf(d), { decisionId: 'dec-joey', actor: 'c', now: NOW, stepIndex: 1 }, { ...baseDeps(d, 'pass', gmail), nextTouch: async () => due });
    expect(r).toMatchObject({ ok: false, reason: 'template_citations_unresolved' });
    expect(!r.ok && r.detail).toContain('hc_ev_2');
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
  });
});

describe('draft -> sent reconciliation', () => {
  const drafted = { recipient: 'joey.maggard@kroger.com', createdAt: NOW.toISOString() };
  const msg = (over: Partial<{ id: string; labelIds: string[]; internalDate: Date; to: string }>) => ({
    id: 'm-sent-9',
    labelIds: ['SENT'],
    internalDate: new Date(NOW.getTime() + 60_000),
    to: 'Joey Maggard <joey.maggard@kroger.com>',
    from: 'casey@freightroll.com',
    ...over,
  });

  it('observeDraft: existing draft is still drafted; gone + SENT to the recipient is sent; gone + nothing is discarded', () => {
    expect(observeDraft(drafted, { exists: true, messageId: 'm' }, [msg({})])).toEqual({ fate: 'drafted' });
    expect(observeDraft(drafted, { exists: false }, [msg({})])).toMatchObject({ fate: 'sent', sentMessageId: 'm-sent-9' });
    expect(observeDraft(drafted, { exists: false }, [msg({ labelIds: ['INBOX'] })])).toEqual({ fate: 'discarded' });
    expect(observeDraft(drafted, { exists: false }, [msg({ to: 'someone@else.com' })])).toEqual({ fate: 'discarded' });
    expect(observeDraft(drafted, { exists: false }, [msg({ internalDate: new Date(NOW.getTime() - 3_600_000) })])).toEqual({ fate: 'discarded' });
  });

  it('reconcileDraft records the SENT fate with a NEW message id, keeps the draft id, and touches no human action', async () => {
    const d = db();
    const prisma = prismaOf(d);
    await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d));
    const r = await reconcileDraft(
      prisma,
      { decisionId: 'dec-joey', gmailDraftId: 'r-draft-1', actor: 'casey', now: new Date(NOW.getTime() + 120_000) },
      { gapSender: () => null, envMailbox: () => 'casey@freightroll.com', getDraftState: async () => ({ exists: false }), getThread: async () => [msg({})] },
    );
    expect(r).toMatchObject({ ok: true, fate: 'sent', changed: true });
    expect(r.ok && r.sent).toMatchObject({ gmailDraftId: 'r-draft-1', gmailSentMessageId: 'm-sent-9', gmailThreadId: 't-1', engine: 'gmail_direct' });
    expect(r.ok && r.sent?.gmailSentMessageId).not.toBe('r-draft-1');
    const records = await listDraftRecords(prisma, 'dec-joey');
    expect(records[0].fate).toBe('sent');
    expect(prisma.routingDecision.updateMany).not.toHaveBeenCalled();

    const again = await reconcileDraft(prisma, { decisionId: 'dec-joey', gmailDraftId: 'r-draft-1', actor: 'casey', now: NOW }, { gapSender: () => null, envMailbox: () => 'casey@freightroll.com', getDraftState: async () => { throw new Error('should not read'); } });
    expect(again).toMatchObject({ ok: true, fate: 'sent', changed: false });
  });

  it('an unreadable Gmail writes nothing (never reads as discarded)', async () => {
    const d = db();
    const prisma = prismaOf(d);
    await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: NOW }, baseDeps(d));
    const r = await reconcileDraft(prisma, { decisionId: 'dec-joey', gmailDraftId: 'r-draft-1', actor: 'casey', now: NOW }, { gapSender: () => null, envMailbox: () => 'casey@freightroll.com', getDraftState: async () => { throw new Error('500'); } });
    expect(r).toMatchObject({ ok: false, reason: 'gmail_unreadable' });
    expect(d.audit.some((a) => a.kind === DRAFT_DISCARDED || a.kind === DRAFT_SENT)).toBe(false);
  });
});
