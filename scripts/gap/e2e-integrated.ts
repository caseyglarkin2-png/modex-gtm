/**
 * GAP red team remediation: the FINAL INTEGRATED REGRESSION (T1-T10), one
 * scenario against a SCRATCH database, through the real services:
 *
 *   VERIFIED FACT              -> hypothesis eligible (approve, activate)
 *   KEYWORD ONLY               -> cannot approve; routes research only
 *   APPROVED VALID HYPOTHESIS  -> routes to an email
 *   REAL SEND                  -> execution ledger -> routing cooldown -> honest Learning denominator
 *   PERSON WITH PRIOR STEP 0   -> no step 0 again on a new card
 *   PERSON WITH OUTSTANDING DRAFT -> direct send refused
 *   UNSUBSCRIBE                -> DNC -> future send stopped
 *   HARD BOUNCE                -> bad-address truth -> sequence stopped
 *   BUYER REPLY                -> sequence held -> human disposition required
 *   NO ANSWER CALL             -> retryable until the cap, no buyer truth
 *
 *   DATABASE_URL=postgresql://...@127.0.0.1:55432/gap_finish_e2e \
 *   GAP_OS_ENABLED=true GAP_HYPOTHESIS_ENABLED=true GAP_ROUTING_ENABLED=true \
 *   GAP_MESSAGE_COMPILER_ENABLED=true GAP_REPLY_CLASSIFICATION_ENABLED=true \
 *   npx tsx scripts/gap/e2e-integrated.ts
 *
 * Rails: scratch database only (exit 2 otherwise); every credential scrubbed
 * from the environment; every Gmail call goes to an in-process fake that
 * records what it was asked to do; every recipient is a reserved
 * example.com address. Nothing can leave the machine. Every row the run
 * creates is deleted in the finally block and the leftovers asserted zero.
 *
 * Writes docs/gap/integrated-e2e-latest.md (no secrets) on every run.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { registerSignal } from '../../src/lib/gap/signals/registry';
import { proposeHypothesis, transitionHypothesis } from '../../src/lib/gap/hypothesis/service';
import { citedQuote } from '../../src/lib/gap/research/propose';
import { createFamily } from '../../src/lib/gap/sequence/family';
import { createVersion } from '../../src/lib/gap/sequence/version';
import { seedFamilyByKey } from '../../src/lib/gap/sequences/families';
import { runRouting, type HubSpotSnapshotProvider } from '../../src/lib/gap/routing/run';
import { assembleRoutingInputs, isSkip } from '../../src/lib/gap/routing/inputs';
import { routePersona } from '../../src/lib/gap/routing/route';
import { staticSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { prepareSellerEmail, createSellerGmailDraft, type SellerDraftDeps } from '../../src/lib/gap/execution/seller-draft';
import { sendSellerEmail, type SellerSendDeps } from '../../src/lib/gap/execution/seller-send';
import { computeNextTouch } from '../../src/lib/gap/execution/next-touch';
import { recordUnsubscribe } from '../../src/lib/email/unsubscribe';
import { pollGapMailbox, GAP_MAILBOX_WATERMARK_KEY } from '../../src/lib/gap/replies/gap-mailbox';
import type { MailboxMessage } from '../../src/lib/email/gmail-inbox';
import { recordDisposition } from '../../src/lib/gap/disposition/service';
import { buildExecutionLearning } from '../../src/lib/gap/learning/execution';
import { loadAgreementReport } from '../../src/lib/gap/routing/agreement-query';
import type { ExecutionReceipt } from '../../src/lib/gap/execution/contract';
import { DIRECT_SENT } from '../../src/lib/gap/execution/draft-ledger';
import type { CriticClient } from '../../src/lib/gap/critic-client';

// ---------------------------------------------------------------------------
// Rails
// ---------------------------------------------------------------------------

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const REPORT_PATH = path.join('docs', 'gap', 'integrated-e2e-latest.md');
const SCRUBBED_ENV = ['HUBSPOT_ACCESS_TOKEN', 'MC_API_TOKEN', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN', 'GAP_GMAIL_SERVICE_ACCOUNT_JSON', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;
const ACTOR = 'casey@freightroll.com';
const MAILBOX = 'casey@yardflow.ai';

class StepFailure extends Error {
  constructor(public readonly step: string, message: string) {
    super(message);
  }
}
const lines: Array<{ step: string; status: 'PASS' | 'FAIL'; detail: string }> = [];
function pass(step: string, detail: string): void {
  lines.push({ step, status: 'PASS', detail });
  console.log(`PASS ${step}: ${detail}`);
}
function expect(step: string, condition: boolean, detail: string): void {
  if (condition) return;
  lines.push({ step, status: 'FAIL', detail });
  console.log(`FAIL ${step}: ${detail}`);
  throw new StepFailure(step, detail);
}
/** The refusal reason of a service result, when it has one. */
const why = (r: unknown): string | undefined => (r as { reason?: string }).reason;

function errorText(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as { message?: unknown; meta?: unknown };
  return [e.message, e.meta ? JSON.stringify(e.meta) : ''].filter(Boolean).join(' ');
}
function describeDatabase(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return '<unparseable>';
  }
}

// ---------------------------------------------------------------------------
// In-process fakes: the only "network" this run has
// ---------------------------------------------------------------------------

const outbox: Array<{ kind: 'direct' | 'draft'; to: string; subject: string }> = [];
const criticPass: CriticClient = { score: async () => ({ ok: true, verdict: 'pass', score: 100, findings: [] }) } as unknown as CriticClient;
const gapSender = () => ({ userEmail: MAILBOX, serviceAccountJson: '{}' }) as never;

function sellerDeps(tag: string, threadFor: (to: string) => string): SellerSendDeps {
  let n = 0;
  const deps: SellerSendDeps & SellerDraftDeps = {
    critic: criticPass,
    gapSender,
    senderAddress: () => MAILBOX,
    signature: async () => null,
    activeOpportunity: async () => false,
    // Ops closeout 19: the scratch run has no real mailbox; nothing unrecorded sits in Sent.
    mailboxSentTo: async () => [],
    unsubscribeUrl: (e: string) => `https://modex-gtm.vercel.app/unsubscribe/?email=${encodeURIComponent(e)}&token=e2e`,
    getMessageHeaders: async () => null,
    nextTouch: (p, d, now) => computeNextTouch(p, d, now, { gapSender, getThread: async () => [] }),
    gmail: {
      createGmailDraft: (async (input: { to: string; subject: string }) => {
        n += 1;
        outbox.push({ kind: 'draft', to: input.to, subject: input.subject });
        return { provider: 'gmail' as const, draftId: `${tag}-draft-${n}`, messageId: `${tag}-draftmsg-${n}`, threadId: threadFor(input.to) };
      }) as never,
      sendGmailDraft: (async () => {
        throw new Error('sendGmailDraft must never be called in this run');
      }) as never,
      sendViaGmail: (async () => {
        throw new Error('sendViaGmail must never be called in this run (the direct adapter is faked)');
      }) as never,
    },
    directAdapter: (async (intent: { now: Date }, wire: { to: string; subject: string }) => {
      n += 1;
      outbox.push({ kind: 'direct', to: wire.to, subject: wire.subject });
      const receipt: ExecutionReceipt = { engine: 'gmail_direct', status: 'sent', engineId: `${tag}-sent-${n}`, threadId: threadFor(wire.to), createdAt: intent.now, sentAt: intent.now } as ExecutionReceipt;
      return receipt;
    }) as never,
  };
  return deps;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!SCRATCH_URL.test(databaseUrl)) {
    console.error(`refusing to run: DATABASE_URL must be the scratch database (got ${describeDatabase(databaseUrl)})`);
    return 2;
  }
  for (const k of SCRUBBED_ENV) delete process.env[k];
  for (const k of ['GAP_AUTO_ENROLL_ENABLED', 'GAP_AUTO_ENROLL_SHADOW_ENABLED', 'GAP_HUBSPOT_MIRROR_ENABLED', 'GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED'] as const) delete process.env[k];
  // A scratch-only signing secret so the (faked) sends can carry a real one-click unsubscribe link.
  process.env.UNSUBSCRIBE_SECRET = 'gap-integrated-scratch-only';
  for (const k of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED'] as const) process.env[k] = 'true';

  const prisma = new PrismaClient();
  const runStart = new Date(Date.now() - 1000);
  const now = new Date();
  const tag = `gapint-${Date.now()}`;
  const gitSha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();
  const accountName = `GAP Integrated Co ${tag.slice(-8)}`;
  const keywordAccount = `GAP Integrated Keyword Co ${tag.slice(-8)}`;
  const companyId = `${tag}-co`;
  const keywordCompanyId = `${tag}-kco`;
  const email = (who: string) => `${who}+${tag}@example.com`;
  const people = ['sam', 'dana', 'uma', 'bo', 'rita', 'cal'] as const;
  const created = { familyId: '', decisionIds: [] as string[], messageIds: [] as string[], threadIds: [] as string[], runIds: [] as string[], emails: [...people.map(email), email('kai')], watermark: undefined as string | null | undefined };
  const threadFor = (to: string) => {
    const t = `${tag}-thr-${to.split('+')[0]}`;
    if (!created.threadIds.includes(t)) created.threadIds.push(t);
    return t;
  };
  const deps = sellerDeps(tag, threadFor);
  let failure: StepFailure | null = null;
  const counts: Record<string, string | number> = {};

  try {
    const priorWatermark = await prisma.systemConfig.findUnique({ where: { key: GAP_MAILBOX_WATERMARK_KEY } });
    created.watermark = priorWatermark?.value ?? null;

    // 1. Seed: two accounts, seven reserved example.com people, one family and version.
    await prisma.account.create({ data: { rank: 9993, name: accountName, vertical: 'cpg', hubspot_company_id: companyId, tier: 'Tier 1' } });
    await prisma.account.create({ data: { rank: 9994, name: keywordAccount, vertical: 'cpg', hubspot_company_id: keywordCompanyId, tier: 'Tier 1' } });
    const persona: Record<string, number> = {};
    for (const who of [...people, 'kai'] as const) {
      const row = await prisma.persona.create({
        data: { persona_id: `${tag}-${who}`, account_name: who === 'kai' ? keywordAccount : accountName, priority: 'P1', name: `${who[0].toUpperCase()}${who.slice(1)} Tester`, title: 'VP Distribution', seniority: 'vp', email: email(who), email_valid: true, is_contact_ready: true, do_not_contact: false, hubspot_contact_id: `${tag}-${who}` },
        select: { id: true },
      });
      persona[who] = row.id;
    }
    const seed = seedFamilyByKey('hidden_capacity')!;
    const family = await createFamily(prisma, { name: `GAP INT Hidden Capacity ${tag}`, engine: 'modex_draft_queue', program: 'gap-integrated', accountName, problemFamily: seed.problemFamily, persona: seed.persona, createdBy: ACTOR });
    expect('1 seed', family.ok, `createFamily -> ${JSON.stringify(family)}`);
    if (!family.ok) throw new Error('unreachable');
    created.familyId = family.id;
    const version = await createVersion(prisma, family.id, seed.steps, { createdBy: ACTOR, changeNote: 'integrated regression' });
    expect('1 seed', version.ok, `createVersion -> ${JSON.stringify(version)}`);
    pass('1 seed', `accounts ${accountName} and ${keywordAccount}, people ${Object.keys(persona).join(', ')} at example.com, family ${family.id} (single-touch Hidden Capacity seed copy)`);

    // 2. VERIFIED FACT -> hypothesis eligible.
    const filed = `(filed ${now.toISOString().slice(0, 10)})`;
    const factText = `${accountName} will open a new distribution center in Columbus, Ohio with 40 dock doors.`;
    const factTitle = `${accountName} 10-Q ${filed}`;
    const hypothesis: Record<string, string> = {};
    for (const who of people) {
      const sig = await registerSignal(prisma, { accountName, hubspotCompanyId: companyId, personaId: persona[who], sourceKind: 'evidence_record', sourceId: `${tag}:fact:${who}`, type: 'site_expansion', title: factTitle, sourceType: 'public_primary', evidenceUrl: `https://example.com/${tag}/10q`, evidenceText: factText, externalOk: true, observedAt: now, confidence: 80, metadata: { verified: 'excerpt_found_at_source' }, registeredBy: ACTOR });
      const proposed = await proposeHypothesis(prisma, {
        accountName,
        primaryPersonaId: persona[who],
        persona: seed.persona,
        problemFamily: seed.problemFamily,
        observation: citedQuote(factTitle, factText, sig.id, accountName),
        problemHypothesis: 'My guess is the new site moves the constraint to the yards, where trailers wait for a door.',
        rootCauseHypotheses: ['Trailer location is tracked on paper or radio'],
        impactHypotheses: ['Doors wait for trailers'],
        falsificationQuestions: ['When a door frees up, how does the driver find the next trailer?'],
        whatANoMeans: 'The yards already keep pace by system.',
        confidence: 0,
        signalIds: [sig.id],
        primarySignalId: sig.id,
        createdBy: ACTOR,
      });
      expect('2 verified fact', proposed.ok, `propose (${who}) -> ${JSON.stringify(proposed)}`);
      if (!proposed.ok) throw new Error('unreachable');
      for (const action of ['submit', 'approve', 'activate'] as const) {
        const r = await transitionHypothesis(prisma, proposed.id, action, { now, actor: ACTOR });
        expect('2 verified fact', r.ok, `${action} (${who}) -> ${JSON.stringify(r)}`);
      }
      hypothesis[who] = proposed.id;
    }
    pass('2 verified fact', `${people.length} hypotheses citing one verified, dated, quoted fact each: submitted, approved and activated`);

    // 3. KEYWORD ONLY -> cannot approve; routes research only.
    const kw = await registerSignal(prisma, { accountName: keywordAccount, hubspotCompanyId: keywordCompanyId, personaId: persona.kai, sourceKind: 'pounce_trigger', sourceId: `${tag}:kw`, type: 'site_expansion', title: `${keywordAccount} 10-Q mentions: capital expenditure`, sourceType: 'public_secondary', evidenceUrl: `https://example.com/${tag}/kw`, externalOk: true, observedAt: now, confidence: 50, registeredBy: ACTOR });
    const kwHyp = await proposeHypothesis(prisma, {
      accountName: keywordAccount,
      primaryPersonaId: persona.kai,
      persona: seed.persona,
      problemFamily: seed.problemFamily,
      observation: `${keywordAccount} 10-Q mentions capital expenditure [S:${kw.id}].`,
      problemHypothesis: 'My guess is capital spend means new doors.',
      rootCauseHypotheses: ['Unknown'],
      impactHypotheses: ['Unknown'],
      falsificationQuestions: ['Is any of the spend on the yards?'],
      whatANoMeans: 'No.',
      confidence: 0,
      signalIds: [kw.id],
      primarySignalId: kw.id,
      createdBy: ACTOR,
    });
    expect('3 keyword only', kwHyp.ok, `propose keyword -> ${JSON.stringify(kwHyp)}`);
    if (!kwHyp.ok) throw new Error('unreachable');
    await transitionHypothesis(prisma, kwHyp.id, 'submit', { now, actor: ACTOR });
    const kwApprove = await transitionHypothesis(prisma, kwHyp.id, 'approve', { now, actor: ACTOR });
    expect('3 keyword only', !kwApprove.ok && why(kwApprove) === 'evidence_insufficient', `approve keyword-only -> ${JSON.stringify(kwApprove)}, expected evidence_insufficient`);
    const kwInputs = await assembleRoutingInputs(prisma, { accountName: keywordAccount, personaId: persona.kai, now, suppression: staticSuppressionReader('clear'), hubspotSnapshot: { tam: 'in', tamTier: 'A', contacts: { [`${tag}-kai`]: { qualVerdict: 'qualified' } } } });
    expect('3 keyword only', !isSkip(kwInputs), `keyword inputs skipped: ${JSON.stringify(kwInputs)}`);
    if (isSkip(kwInputs)) throw new Error('unreachable');
    const kwRoute = routePersona(kwInputs);
    const kwAction = kwRoute.kind === 'decision' ? kwRoute.decision.action : kwRoute.kind;
    expect('3 keyword only', kwAction === 'research_required', `keyword person routed ${JSON.stringify(kwRoute.kind === 'decision' ? { action: kwRoute.decision.action, rule: kwRoute.decision.ruleId } : kwRoute)}, expected research, never an email`);
    pass('3 keyword only', `approve refused evidence_insufficient; the person routes ${kwAction} (${kwRoute.kind === 'decision' ? kwRoute.decision.ruleId : ''}), never an email`);

    // 4. APPROVED VALID HYPOTHESIS -> route.
    const snapshot: HubSpotSnapshotProvider = async () => ({ tam: 'in', tamTier: 'A', contacts: Object.fromEntries(people.map((w) => [`${tag}-${w}`, { qualVerdict: 'qualified' }])) });
    const runId = `${tag}-run-1`;
    created.runIds.push(runId);
    const run1 = await runRouting(prisma, { now, runId, accountNames: [accountName], personaIds: [persona.sam], actor: ACTOR }, { suppression: staticSuppressionReader('clear'), hubspotSnapshot: snapshot, top100: null });
    const samCard = await prisma.routingDecision.findFirst({ where: { run_id: runId, persona_id: persona.sam }, select: { id: true, action: true, rule_id: true, lane: true } });
    expect('4 route', !!samCard && (samCard.action === 'enroll_gap_sequence' || samCard.action === 'one_off_email'), `sam's card ${JSON.stringify(samCard)} (run ${JSON.stringify({ decisions: run1.decisions, byRule: run1.byRule, skips: run1.skips })}), expected an email recommendation`);
    created.decisionIds.push(samCard!.id);
    pass('4 route', `sam's approved hypothesis routes ${samCard!.action} (${samCard!.rule_id}) in shadow routing run ${runId}`);

    // 5. REAL SEND -> execution ledger -> routing cooldown -> honest Learning denominator.
    const send = async (decisionId: string) => {
      const preview = await sendSellerEmail(prisma, { decisionId, actor: ACTOR, now }, deps);
      if (!preview.ok || !('preview' in preview)) return preview;
      return sendSellerEmail(prisma, { decisionId, actor: ACTOR, now, confirm: { contentHash: preview.preview.contentHash, recipient: preview.preview.to } }, deps);
    };
    const sent = await send(samCard!.id);
    expect('5 real send', sent.ok && 'sent' in sent && !!sent.sent, `send -> ${JSON.stringify(sent)}`);
    const ledger = await prisma.gapAuditEvent.findMany({ where: { subject_type: 'routing_decision', subject_id: samCard!.id, kind: DIRECT_SENT }, select: { payload: true } });
    expect('5 real send', ledger.length === 1 && (ledger[0].payload as { evidenceTier?: string }).evidenceTier === 'VERIFIED_FACT', `ledger ${JSON.stringify(ledger)}`);
    const samAfter = await assembleRoutingInputs(prisma, { accountName, personaId: persona.sam, now, suppression: staticSuppressionReader('clear'), hubspotSnapshot: await snapshot(accountName, companyId) });
    expect('5 real send', !isSkip(samAfter) && samAfter.comms.lastOutboundAt !== null, `routing inputs after the send: ${JSON.stringify(isSkip(samAfter) ? samAfter : samAfter.comms)}`);
    if (isSkip(samAfter)) throw new Error('unreachable');
    const samReroute = routePersona(samAfter);
    const samAction = samReroute.kind === 'decision' ? samReroute.decision.action : samReroute.kind;
    expect('5 real send', samAction !== 'enroll_gap_sequence' && samAction !== 'one_off_email', `after the send sam routes ${samAction}, expected no email (cooldown / sequence complete)`);
    pass('5 real send', `one DIRECT_SENT ledger row (evidence tier VERIFIED_FACT), the fake Gmail transport the only recipient; routing now reads lastOutboundAt and routes ${samAction} (${samReroute.kind === 'decision' ? samReroute.decision.ruleId : ''}), never a second email`);

    // 6. PERSON WITH PRIOR STEP 0 -> no step 0 again on a new card.
    const samCard2 = await prisma.routingDecision.create({ data: { run_id: `${tag}-run-2`, mode: 'shadow', account_name: accountName, persona_id: persona.sam, hypothesis_id: hypothesis.sam, action: 'enroll_gap_sequence', lane: 'work_queue', rule_id: 'enroll', priority: 0, explain: {}, inputs_snapshot: { target: 'modex_queue' } }, select: { id: true } });
    created.decisionIds.push(samCard2.id);
    created.runIds.push(`${tag}-run-2`);
    const again = await prepareSellerEmail(prisma, { decisionId: samCard2.id, actor: ACTOR, now, stepIndex: 0, mode: 'send' }, deps);
    expect('6 prior step 0', !again.ok && (why(again) === 'first_touch_already_sent' || why(again) === 'step_already_sent'), `step 0 on a NEW card for sam -> ${JSON.stringify(again)}`);
    pass('6 prior step 0', `a new card for the same person refuses step 0: ${again.ok ? '' : why(again)}`);

    // Cards for everyone else (the router's email recommendation, recorded directly).
    const card: Record<string, string> = {};
    for (const who of ['dana', 'uma', 'bo', 'rita'] as const) {
      const c = await prisma.routingDecision.create({ data: { run_id: `${tag}-run-2`, mode: 'shadow', account_name: accountName, persona_id: persona[who], hypothesis_id: hypothesis[who], action: 'enroll_gap_sequence', lane: 'work_queue', rule_id: 'enroll', priority: 0, explain: {}, inputs_snapshot: { target: 'modex_queue' } }, select: { id: true } });
      card[who] = c.id;
      created.decisionIds.push(c.id);
    }

    // 7. PERSON WITH OUTSTANDING DRAFT -> direct send refused.
    const draft = await createSellerGmailDraft(prisma, { decisionId: card.dana, actor: ACTOR, now }, deps);
    expect('7 outstanding draft', draft.ok, `draft -> ${JSON.stringify(draft)}`);
    const danaSend = await send(card.dana);
    expect('7 outstanding draft', !danaSend.ok && why(danaSend) === 'draft_outstanding', `direct send with a draft outstanding -> ${JSON.stringify(danaSend)}`);
    pass('7 outstanding draft', `a Gmail draft is outstanding for dana; the direct send is refused draft_outstanding`);

    // 8. UNSUBSCRIBE -> DNC -> future send stopped.
    const unsub = await recordUnsubscribe(prisma, { email: email('uma'), source: 'unsubscribe_link', reason: 'integrated regression', hubspot: { enabled: false } });
    const uma = await prisma.persona.findUnique({ where: { id: persona.uma }, select: { do_not_contact: true } });
    const umaSend = await prepareSellerEmail(prisma, { decisionId: card.uma, actor: ACTOR, now, mode: 'send' }, deps);
    expect('8 unsubscribe', uma?.do_not_contact === true && !umaSend.ok && (why(umaSend) === 'persona_do_not_contact' || why(umaSend) === 'recipient_unsubscribed'), `unsubscribe ${JSON.stringify(unsub)}, persona ${JSON.stringify(uma)}, send -> ${JSON.stringify(umaSend)}`);
    pass('8 unsubscribe', `one-click unsubscribe wrote the canonical row, do_not_contact is set, and the next send is refused ${umaSend.ok ? '' : why(umaSend)}`);

    // 9. HARD BOUNCE -> bad-address truth -> sequence stopped.
    const boSent = await send(card.bo);
    expect('9 hard bounce', boSent.ok && 'sent' in boSent, `send to bo -> ${JSON.stringify(boSent)}`);
    const dsn: MailboxMessage = {
      id: `${tag}-dsn`, threadId: threadFor(email('bo')), rfcMessageId: null, fromEmail: 'mailer-daemon@googlemail.com', fromName: 'Mail Delivery Subsystem', subject: 'Delivery Status Notification (Failure)', snippet: '', bodyText: '', rawText: '', bodyHtml: '',
      deliveryStatus: `Final-Recipient: rfc822; ${email('bo')}\nAction: failed\nStatus: 5.1.1\nDiagnostic-Code: smtp; 550 5.1.1 user unknown`, labelIds: ['INBOX'], receivedAt: new Date(now.getTime() + 60_000), headers: { 'Content-Type': 'multipart/report; report-type=delivery-status' },
    };
    // 10's reply is delivered in the same mailbox read.
    const ritaSent = await send(card.rita);
    expect('10 buyer reply', ritaSent.ok && 'sent' in ritaSent, `send to rita -> ${JSON.stringify(ritaSent)}`);
    const reply: MailboxMessage = {
      id: `${tag}-reply`, threadId: threadFor(email('rita')), rfcMessageId: `<${tag}@example.com>`, fromEmail: email('rita'), fromName: 'Rita Tester', subject: 'Re: Doors versus spots', snippet: 'We do see that at Columbus.', bodyText: 'We do see that at Columbus. Who else deals with it?', rawText: 'We do see that at Columbus. Who else deals with it?', bodyHtml: '',
      deliveryStatus: null, labelIds: ['INBOX'], receivedAt: new Date(now.getTime() + 120_000), headers: {},
    };
    created.messageIds.push(dsn.id, reply.id);
    const mailbox = [dsn, reply];
    const intake = await pollGapMailbox(prisma, { now: new Date(now.getTime() + 180_000) }, { listIds: async () => ({ ids: mailbox.map((m) => m.id), windowEnd: null }), fetch: async (id) => mailbox.find((m) => m.id === id)!, mailbox: MAILBOX });
    const bo = await prisma.persona.findUnique({ where: { id: persona.bo }, select: { email_status: true, do_not_contact: true } });
    const boNext = await computeNextTouch(prisma, card.bo, new Date(now.getTime() + 10 * 86_400_000), { gapSender, getThread: async () => [] });
    expect('9 hard bounce', intake.hardBounces === 1 && bo?.email_status === 'hard_bounce' && bo.do_not_contact === true && boNext.state === 'stopped', `intake ${JSON.stringify(intake)}, persona ${JSON.stringify(bo)}, next touch ${JSON.stringify(boNext)}`);
    pass('9 hard bounce', `the 5.1.1 notice wrote hard_bounce + do_not_contact for bo (never a reply), and bo's next touch is stopped (${boNext.state === 'stopped' ? boNext.reason : ''})`);

    // 10. BUYER REPLY -> sequence held -> human disposition required.
    const ritaNext = await computeNextTouch(prisma, card.rita, new Date(now.getTime() + 10 * 86_400_000), { gapSender, getThread: async () => [] });
    const ritaHyp = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesis.rita }, select: { status: true } });
    const ritaInputs = await assembleRoutingInputs(prisma, { accountName, personaId: persona.rita, now: new Date(now.getTime() + 180_000), suppression: staticSuppressionReader('clear'), hubspotSnapshot: await snapshot(accountName, companyId) });
    expect('10 buyer reply', intake.replies === 1 && intake.inboundMessagesCreated === 1 && ritaNext.state === 'stopped' && ritaHyp?.status === 'active' && !isSkip(ritaInputs) && ritaInputs.comms.undispositionedInbound === true, `intake ${JSON.stringify(intake)}, next ${JSON.stringify(ritaNext)}, hypothesis ${JSON.stringify(ritaHyp)}, comms ${JSON.stringify(isSkip(ritaInputs) ? ritaInputs : ritaInputs.comms)}`);
    const ritaRoute = !isSkip(ritaInputs) ? routePersona(ritaInputs) : null;
    expect('10 buyer reply', !!ritaRoute && ritaRoute.kind === 'decision' && ritaRoute.decision.ruleId === 'reply_pending' && ritaRoute.decision.lane === 'reply_triage', `rita routed ${JSON.stringify(ritaRoute && ritaRoute.kind === 'decision' ? { rule: ritaRoute.decision.ruleId, lane: ritaRoute.decision.lane } : ritaRoute)}, expected reply_pending in the reply_triage lane`);
    const confirmed = await recordDisposition(prisma, { hypothesisId: hypothesis.rita, personaId: persona.rita, contactEmail: email('rita'), channel: 'email', responseClass: 'problem_confirmed', buyerLanguage: 'We do see that at Columbus.', source: { kind: 'inbound_message', id: reply.id }, actor: ACTOR, actorKind: 'human', now: new Date(now.getTime() + 200_000) });
    const ritaAfter = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesis.rita }, select: { status: true } });
    expect('10 buyer reply', confirmed.ok && ritaAfter?.status !== 'active', `human disposition -> ${JSON.stringify(confirmed)}, hypothesis ${JSON.stringify(ritaAfter)}`);
    pass('10 buyer reply', `rita's reply became an InboundMessage and held the sequence (${ritaNext.state === 'stopped' ? ritaNext.reason : ''}); the hypothesis stayed ${ritaHyp?.status} and routing put rita in the reply_triage lane (reply_pending: a human reads and dispositions it) until a human recorded problem_confirmed, which resolved it (${ritaAfter?.status})`);

    // 11. NO ANSWER CALL -> retryable until the cap, no buyer truth.
    const calInputs = async () => {
      const i = await assembleRoutingInputs(prisma, { accountName, personaId: persona.cal, now: new Date(now.getTime() + 300_000), suppression: staticSuppressionReader('clear'), hubspotSnapshot: await snapshot(accountName, companyId) });
      if (isSkip(i)) throw new StepFailure('11 no answer', `cal inputs skipped: ${JSON.stringify(i)}`);
      return i;
    };
    const routeRules: string[] = [];
    for (let k = 1; k <= 3; k += 1) {
      const d = await recordDisposition(prisma, { hypothesisId: hypothesis.cal, personaId: persona.cal, contactEmail: email('cal'), channel: 'call', responseClass: 'no_answer', source: { kind: 'call', id: `${tag}:call:${k}` }, actor: ACTOR, actorKind: 'human', now: new Date(now.getTime() + 240_000 + k * 1000) });
      expect('11 no answer', d.ok, `no_answer ${k} -> ${JSON.stringify(d)}`);
      const r = routePersona(await calInputs());
      routeRules.push(r.kind === 'decision' ? r.decision.ruleId : r.kind);
    }
    const calHyp = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesis.cal }, select: { status: true } });
    const calBids = await prisma.buyerInputData.count({ where: { hypothesis_id: hypothesis.cal } });
    expect('11 no answer', routeRules[1] !== 'call_attempts_exhausted' && routeRules[2] === 'call_attempts_exhausted' && calHyp?.status === 'active' && calBids === 0, `rules after 1..3 no-answers ${JSON.stringify(routeRules)}, hypothesis ${JSON.stringify(calHyp)}, bids ${calBids}`);
    pass('11 no answer', `rules after each no-answer: ${routeRules.join(' -> ')}; the hypothesis stays active with no buyer truth (0 BIDs)`);

    // 12. Honest Learning and agreement over what actually happened.
    const learning = await buildExecutionLearning(prisma, { now: new Date(now.getTime() + 31 * 86_400_000) });
    const mine = new Set([email('sam'), email('bo'), email('rita')]);
    // Other scratch runs may have sent too: judge this run's people by cohort.
    // Outcomes are judged once the 30-day window has closed (review S4): look from 31 days on.
    const cohort = await buildExecutionLearning(prisma, { from: runStart, now: new Date(now.getTime() + 31 * 86_400_000) });
    expect('12 learning', cohort.overall.peopleContacted === 3 && cohort.overall.replyPerSend.numerator === 1 && cohort.overall.replyPerSend.status === 'insufficient' && cohort.overall.truthYield.numerator === 1, `this run's cohort ${JSON.stringify(cohort.overall)} (people ${[...mine].join(', ')}), expected 3 people sent to (sam, bo, rita; never dana, uma or the keyword person), 1 reply, 1 truth, suppressed as an early observation`);
    const agreement = await loadAgreementReport(prisma, { runId, now: new Date(now.getTime() + 300_000) });
    expect('12 learning', agreement.overall.agreements === 1 && agreement.overall.n === 1, `agreement over run 1 ${JSON.stringify(agreement.overall)}, expected sam's executed email recommendation to agree`);
    counts.learningAll = learning.overall.peopleContacted;
    pass('12 learning', `people sent to (this run) = 3 of 7 created; reply/send ${cohort.overall.replyPerSend.numerator}/${cohort.overall.replyPerSend.denominator} and truth yield ${cohort.overall.truthYield.numerator}/${cohort.overall.truthYield.denominator}, both shown as early observations (n < 20); sam's card agrees because the send is on record`);

    // 13. Nothing left the machine.
    const toProspects = outbox.filter((o) => !o.to.endsWith('@example.com'));
    expect('13 zero outbound', toProspects.length === 0 && SCRUBBED_ENV.every((k) => !process.env[k]), `outbox ${JSON.stringify(outbox)}`);
    counts.fakeSends = outbox.filter((o) => o.kind === 'direct').length;
    counts.fakeDrafts = outbox.filter((o) => o.kind === 'draft').length;
    pass('13 zero outbound', `${counts.fakeSends} direct sends and ${counts.fakeDrafts} draft handed to the in-process fake, all to reserved example.com addresses; no credential present`);
  } catch (err) {
    if (err instanceof StepFailure) failure = err;
    else {
      failure = new StepFailure('unexpected', errorText(err));
      lines.push({ step: 'unexpected', status: 'FAIL', detail: errorText(err) });
      console.log(`FAIL unexpected: ${errorText(err)}`);
    }
  } finally {
    try {
      const removed = await cleanup(prisma, { accountNames: [accountName, keywordAccount], emails: created.emails, familyId: created.familyId, decisionIds: created.decisionIds, messageIds: created.messageIds, threadIds: created.threadIds, runIds: created.runIds, runStart, watermark: created.watermark });
      for (const [k, v] of Object.entries(removed)) counts[`cleanup.${k}`] = v;
      const leftover = (await prisma.account.count({ where: { name: { in: [accountName, keywordAccount] } } })) + (await prisma.persona.count({ where: { email: { in: created.emails } } }));
      if (leftover !== 0) {
        lines.push({ step: 'cleanup', status: 'FAIL', detail: `leftover rows ${leftover}` });
        failure = failure ?? new StepFailure('cleanup', `leftover rows ${leftover}`);
      } else pass('cleanup', `every row the run created was deleted (${JSON.stringify(removed)})`);
    } catch (err) {
      lines.push({ step: 'cleanup', status: 'FAIL', detail: errorText(err) });
      failure = failure ?? new StepFailure('cleanup', errorText(err));
    }
    writeReport({ failure, tag, db: describeDatabase(databaseUrl), gitSha, counts });
    await prisma.$disconnect();
  }
  return failure ? 1 : 0;
}

const DELETE_GUARDS: Array<[string, string]> = [
  ['hypothesis_events', 'gap_append_only_hypothesis_events'],
  ['gap_audit_events', 'gap_append_only_audit_events'],
  ['hypothesis_signals', 'gap_hypothesis_signal_unlink_guard'],
  ['sequence_versions', 'gap_version_guard_del'],
  ['buyer_input_data', 'gap_bid_guard_del'],
];

async function cleanup(
  prisma: PrismaClient,
  c: { accountNames: string[]; emails: string[]; familyId: string; decisionIds: string[]; messageIds: string[]; threadIds: string[]; runIds: string[]; runStart: Date; watermark: string | null | undefined },
): Promise<Record<string, number>> {
  return prisma.$transaction(async (tx) => {
    const removed: Record<string, number> = {};
    const hypothesisIds = (await tx.prospectingHypothesis.findMany({ where: { account_name: { in: c.accountNames } }, select: { id: true } })).map((h) => h.id);
    const decisionIds = [...new Set([...c.decisionIds, ...(await tx.routingDecision.findMany({ where: { OR: [{ run_id: { in: c.runIds } }, { account_name: { in: c.accountNames } }] }, select: { id: true } })).map((d) => d.id)])];
    const dispositionIds = (await tx.conversationDisposition.findMany({ where: { contact_email: { in: c.emails } }, select: { id: true } })).map((d) => d.id);
    for (const [table, trigger] of DELETE_GUARDS) await tx.$executeRawUnsafe(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    try {
      removed.gap_audit_events = (await tx.gapAuditEvent.deleteMany({ where: { created_at: { gte: c.runStart }, subject_id: { in: [...hypothesisIds, ...decisionIds, ...dispositionIds, ...c.messageIds, ...c.emails, ...c.runIds] } } })).count;
      removed.buyer_input_data = (await tx.buyerInputData.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.conversation_dispositions = (await tx.conversationDisposition.deleteMany({ where: { id: { in: dispositionIds } } })).count;
      removed.notifications = (await tx.notification.deleteMany({ where: { OR: [{ source_id: { in: c.messageIds } }, { persona_email: { in: c.emails } }] } })).count;
      removed.unsubscribed_emails = (await tx.unsubscribedEmail.deleteMany({ where: { email: { in: c.emails } } })).count;
      removed.inbound_messages = (await tx.inboundMessage.deleteMany({ where: { OR: [{ id: { in: c.messageIds } }, { from_email: { in: c.emails } }] } })).count;
      removed.email_threads = (await tx.emailThread.deleteMany({ where: { id: { in: c.threadIds } } })).count;
      removed.email_logs = (await tx.emailLog.deleteMany({ where: { to_email: { in: c.emails } } })).count;
      removed.send_approval_requests = (await tx.sendApprovalRequest.deleteMany({ where: { created_at: { gte: c.runStart }, requested_by: ACTOR, channel: 'gap_compile' } })).count;
      removed.gap_compiles = (await tx.gapCompile.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.routing_decisions = (await tx.routingDecision.deleteMany({ where: { id: { in: decisionIds } } })).count;
      removed.hypothesis_events = (await tx.hypothesisEvent.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.hypothesis_signals = (await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: { in: hypothesisIds } } })).count;
      removed.prospecting_hypotheses = (await tx.prospectingHypothesis.deleteMany({ where: { id: { in: hypothesisIds } } })).count;
      removed.prospecting_signals = (await tx.prospectingSignal.deleteMany({ where: { account_name: { in: c.accountNames } } })).count;
      if (c.familyId) {
        removed.sequence_versions = (await tx.sequenceVersion.deleteMany({ where: { family_id: c.familyId } })).count;
        removed.sequence_families = (await tx.sequenceFamily.deleteMany({ where: { id: c.familyId } })).count;
      }
      removed.personas = (await tx.persona.deleteMany({ where: { email: { in: c.emails } } })).count;
      removed.accounts = (await tx.account.deleteMany({ where: { name: { in: c.accountNames } } })).count;
      if (c.watermark === null) await tx.systemConfig.deleteMany({ where: { key: GAP_MAILBOX_WATERMARK_KEY } });
      else if (typeof c.watermark === 'string') await tx.systemConfig.update({ where: { key: GAP_MAILBOX_WATERMARK_KEY }, data: { value: c.watermark } });
    } finally {
      for (const [table, trigger] of DELETE_GUARDS) await tx.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
    }
    return removed;
  });
}

function writeReport(input: { failure: StepFailure | null; tag: string; db: string; gitSha: string; counts: Record<string, string | number> }): void {
  const out = [
    '# GAP red team remediation: final integrated regression (latest)',
    '',
    `STATUS: ${input.failure ? `FAIL at ${input.failure.step}` : 'PASS'}`,
    '',
    `<!-- verified:${new Date().toISOString().slice(0, 10)} -->`,
    '',
    'Written by `scripts/gap/e2e-integrated.ts` against the scratch database. Reserved example.com recipients only; every Gmail call went to an in-process fake.',
    '',
    `- Run tag: ${input.tag}`,
    `- Database: ${input.db} (scratch only; the script refuses any other host)`,
    `- Git: ${input.gitSha}`,
    `- Ran at: ${new Date().toISOString()}`,
    '',
    '## Steps',
    '',
    ...lines.map((l) => `- ${l.status} ${l.step}: ${l.detail}`),
    '',
    '## Counts',
    '',
    ...Object.entries(input.counts).map(([k, v]) => `- ${k}: ${v}`),
    '',
  ];
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, out.join('\n'), 'utf8');
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(errorText(err));
    process.exit(1);
  });
