/**
 * S3-T12: the enroll service. Spec sections 5.2, 8, 10 and the S3-T12 row.
 *
 * One human (or, once the gates are earned, one agent) says "enroll this
 * persona in this version for this hypothesis, relying on these compile
 * rows". This service refuses in a fixed order, resolves the execution
 * target from the persona's Top100 entry, and then does the smallest thing
 * that target allows:
 *
 *   hubspot_native   emit the enroll-table row (the lane's hand-enroll table,
 *                    S2-T8). Shadow and live both answer `enroll_row` with
 *                    `enrollment: null` (R3-13): the service never calls
 *                    HubSpot and never records what a caller CLAIMS HubSpot
 *                    said. The enrollment-sync cron
 *                    (src/app/api/cron/gap-enrollment-sync/route.ts) is the
 *                    only recorder of hubspot_native enrollments, from a
 *                    readback it takes itself (spec 5.2, "record").
 *   modex_queue      mode live: materialize the runtime `Sequence` row for
 *                    the version through `materializeSequence` (idempotent,
 *                    needs the passing compile ids verified above; its
 *                    refusal is passed through), create the step-0 Draft
 *                    Queue item through `addOne` (the dedup waterfall stays
 *                    theirs) and stamp that Sequence id on it (the runtime's
 *                    first guard; without it step 1 would never schedule),
 *                    compile the
 *                    item's RENDERED, MARKED copy through `compile()` with the
 *                    item's id (so the approveBatch guard has an item-level
 *                    row; refuses `compile_not_passed:0` unless pass or an
 *                    approved review, parking the orphan), and then `enroll()` from
 *                    sequence/enrollment.ts with that item id. The enrollment
 *                    id enroll() generates IS the run id; this service does
 *                    not mint a second one, and enroll() writes the
 *                    `enroll.live` audit row, so this service does not.
 *                    mode shadow: audit the would-be row and create nothing.
 *   build_required   refuse; there is no built sequence for this account.
 *
 * Guard order (first refusal wins, every refusal audited `enroll.refused`
 * with the predicate name, spec section 10):
 *   gap_disabled                 GAP_OS_ENABLED off
 *   enroll_disabled              mode live from a non-human actor while
 *                                GAP_AUTO_ENROLL_ENABLED is off. A HUMAN may
 *                                enroll live through the UI whenever
 *                                GAP_OS_ENABLED is on: progression step 3
 *                                (human-reviewed enrollment) precedes step 8
 *                                (canary auto-enrollment), and the flag gates
 *                                the machine, not the person.
 *   version_not_found / version_retired / invalid_version_steps
 *   compile_not_found:<id> / compile_wrong_version:<id>
 *   compile_wrong_hypothesis:<id> R3-3: a named row bound to another
 *                                hypothesis never counts.
 *   compile_template_only:<id>   R3-3: a template-level row (hypothesis_id
 *                                null) is accepted for SHADOW only; live
 *                                refuses it (verifyCompiles owns the rule),
 *                                and so does materializeSequence.
 *   compile_not_passed:<stepIndex>
 *                                every step of the version needs, among the
 *                                named compile rows, a newest row whose
 *                                verdict is pass, or review_required with an
 *                                approved SendApprovalRequest (isApproved).
 *   compiler_disabled            mode live, modex_queue only (N9): the per-item
 *                                compile needs GAP_MESSAGE_COMPILER_ENABLED;
 *                                with it off nothing is materialized or queued.
 *                                Shadow is unaffected.
 *   autonomy_halted              mode live only: the canonical clawd kill
 *                                switch (`autonomyHalted('outreach')`, the
 *                                same reader `sendViaGmail` gates on). Halted,
 *                                unreachable, or a thrown read all refuse.
 *                                Shadow never reads it.
 *   unrendered_placeholder:<token>
 *                                modex only (R3-4): the step-0 templates are
 *                                rendered through sequence/render.ts, the
 *                                `{{observation}}` slot filled from the
 *                                hypothesis observation ([S:id] tokens become
 *                                [[SRC:id]] markers). The compiler judges the
 *                                MARKED copy; the queue receives the STRIPPED
 *                                copy. Any `{{token}}` left after rendering
 *                                refuses before shadow audits or live queues.
 *   hypothesis_not_found / persona_not_found / no_email
 *   suppressed /                 R3-2 and R3-10: BEFORE the target is resolved,
 *   suppression_unknown          for every mode and every target, the same
 *                                guard enroll() runs (`checkSuppression`: the
 *                                unsubscribed table, Persona.do_not_contact, a
 *                                bounced email status, then the cross-plane
 *                                clawd contract read). The refusal detail and
 *                                audit `leg` name what fired: unsubscribed |
 *                                modex_do_not_contact | bounced | clawd:<leg>.
 *                                An unreadable authority is `suppression_unknown`,
 *                                never permission. The reader is `deps.suppression`
 *                                (default: the routing clawd reader) and is
 *                                handed to enroll() unchanged. A suppressed
 *                                contact never reaches the enroll-table row,
 *                                the would-be item or addOne.
 *   build_required
 *
 * The wrapped `enroll()` keeps every guard it owns (suppressed,
 * already_enrolled, hypothesis_not_ready, ...); a refusal from it is passed
 * through verbatim and the just-created draft item is parked as skipped
 * with `gap_enroll_refused:<reason>` so it can never be approved. R3-12: an
 * EXCEPTION anywhere after addOne (the stamp, the compile, enroll()) parks
 * the same item as skipped with `gap_enroll_error:<error name>` and
 * rethrows, so a thrown error never leaves an un-parked, un-stamped draft
 * that sendNow could send.
 *
 * House conventions: `prisma: any` glue, refusal objects `{ok:false, reason}`,
 * no network here except the injected autonomy reader. Voice: no em dashes.
 */
import { autonomyHalted } from '@/lib/email/autonomy-gate';
import { audit } from '@/lib/gap/audit';
import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { isApproved } from '@/lib/gap/compiler/approval';
import { compile, type CompileDeps } from '@/lib/gap/compiler/compile';
import { makeCriticClient, type CriticClient } from '@/lib/gap/critic-client';
import { gapFlag } from '@/lib/gap/flags';
import {
  buildEnrollRows,
  renderEnrollTableJson,
  type EnrollRowItem,
  type EnrollTableJson,
} from '@/lib/gap/routing/enroll-row';
import { hasActiveOpportunity, resolveEnrollTarget, type ActiveOpportunityInputs } from '@/lib/gap/routing/rules';
import type { EnrollTarget, RoutingInputs, RoutingTop100Input } from '@/lib/gap/routing/types';
import { DEFAULT_FRESHNESS } from '@/lib/gap/routing/types';
import { isResponseClass } from '@/lib/gap/taxonomy';
import { checkSuppression, enroll, type EnrollRefusal } from '@/lib/gap/sequence/enrollment';
import type { SuppressionReader } from '@/lib/gap/routing/suppression-read';
import { evidenceRefsFromSignals } from '@/lib/gap/compiler/evidence-from-signals';
import { firstNameOf, renderStepCopy, EVIDENCE_SIGNAL_SELECT, type EvidenceSignalRow } from '@/lib/gap/sequence/render';

/** Re-exported: the projection now lives with the compiler it serves (R3-3); callers of the old service export keep working. */
export { evidenceRefsFromSignals } from '@/lib/gap/compiler/evidence-from-signals';
import { parseSteps } from '@/lib/gap/sequence/steps';
import { materializeSequence, type MaterializeRefusal } from '@/lib/gap/sequences/service';
import type { RoutingAction } from '@/lib/gap/taxonomy';
import type { QueueAddInput } from '@/lib/validations';

export const ENROLL_ACTION: RoutingAction = 'enroll_gap_sequence';
export const DEFAULT_OWNER = 'casey@freightroll.com';
const SUBJECT_TYPE = 'gap_enroll';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnrollMode = 'shadow' | 'live';
export type ActorKind = 'human' | 'agent';

export interface EnrollFromDecisionInput {
  /** The RoutingDecision the human acted on, when there is one. */
  decisionId?: string | null;
  hypothesisId: string;
  personaId: number;
  sequenceVersionId: string;
  /** The GapCompile rows the caller relies on; every step needs one. */
  compileIds: string[];
  actor: string;
  /** Who is acting. Only a human may enroll live while GAP_AUTO_ENROLL_ENABLED is off. */
  actorKind: ActorKind;
  mode: EnrollMode;
  now: Date;
  /** Queue owner (modex) and enrollment owner. Defaults to the actor's email, else DEFAULT_OWNER. */
  owner?: string | null;
  /** Sending identity. Defaults to the decision's preferred sender, else the owner. */
  sender?: string | null;
}

export interface AutonomyVerdict {
  halted: boolean;
  reason?: string;
}

export interface AddOneResult {
  ok: boolean;
  id?: number;
  reason?: string;
}

/** Exactly the Draft Queue's own input shape (src/lib/validations QueueAddSchema). */
export type AddOneInput = QueueAddInput;

export interface EnrollDeps {
  /** The canonical kill switch. Defaults to `autonomyHalted('outreach')`. */
  autonomy?: () => Promise<AutonomyVerdict>;
  /** The Draft Queue single-item creator (src/app/discovery/queue-actions.ts addOne). Required for the modex live path. */
  addOne: (input: AddOneInput, owner: string) => Promise<AddOneResult>;
  /** Overrides the persona's Top100 entry (the decision snapshot is the default source). */
  top100?: RoutingTop100Input | null;
  /** Reserved for a caller that wants to hand the autonomy reader its own fetch; unused by the default reader. */
  fetchImpl?: typeof fetch;
  /** The per-item compile's critic (modex live). Defaults to the real clawd client; tests inject a stub. */
  critic?: CriticClient;
  /** The cross-plane suppression reader (R3-10). Defaults to the routing clawd contract reader; tests and the scratch e2e inject a static one. */
  suppression?: SuppressionReader;
  /** The per-item compile's claims validator. Defaults to the committed snapshot validator; null disables. */
  validateClaims?: CompileDeps['validateClaims'];
  /**
   * Extra contract fields merged OVER the default per-item compile contract
   * (hypothesis text, the hypothesis's linked signals as evidence refs, the
   * version's stepCount and step-0 claimsUsed). A caller with richer evidence
   * (the e2e's fixture refs) passes them here.
   */
  contract?: Record<string, unknown> | null;
}

export type EnrollServiceRefusal =
  | 'gap_disabled'
  | 'enroll_disabled'
  | 'version_not_found'
  | 'version_retired'
  | `invalid_version_steps:${string}`
  | `compile_not_found:${string}`
  | `compile_wrong_version:${string}`
  | `compile_wrong_hypothesis:${string}`
  | `compile_template_only:${string}`
  | `compile_not_passed:${number}`
  | 'compiler_disabled'
  | 'autonomy_halted'
  | 'hypothesis_not_found'
  | 'persona_not_found'
  | 'no_email'
  | 'active_opportunity'
  | 'build_required'
  | 'step_has_no_copy:0'
  | `unrendered_placeholder:${string}`
  | `queue_refused:${string}`
  | 'compile_not_passed:0'
  | MaterializeRefusal
  | EnrollRefusal;

export interface WouldBeDraftItem {
  toEmail: string;
  accountName: string;
  personaId: number;
  personaName: string | null;
  subject: string;
  body: string;
  sequenceVersionId: string;
  stepIndex: 0;
  owner: string;
  sender: string;
}

export type EnrollServiceResult =
  | {
      ok: true;
      kind: 'enroll_row';
      target: 'hubspot_native';
      mode: EnrollMode;
      row: EnrollTableJson;
      /** Always null (R3-13): the enrollment-sync cron records hubspot_native enrollments, never this service. */
      enrollment: null;
    }
  | {
      ok: true;
      kind: 'modex_shadow';
      target: 'modex_queue';
      mode: 'shadow';
      wouldBe: WouldBeDraftItem;
    }
  | {
      ok: true;
      kind: 'modex_enrolled';
      target: 'modex_queue';
      mode: 'live';
      draftItemId: number;
      sequenceId: number;
      compileId: string | null;
      enrollment: { id: string; frozen: boolean; isTest: boolean };
    }
  | { ok: false; reason: EnrollServiceRefusal; detail?: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function optStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

const TARGETS: ReadonlySet<string> = new Set<EnrollTarget>(['hubspot_native', 'modex_queue', 'build_required']);

interface CompileRowLike {
  id: string;
  sequence_version_id: string | null;
  step_index: number | null;
  verdict: string;
  created_at: Date | string;
  hypothesis_id?: string | null;
}

export interface VerifyCompilesOptions {
  /** Shadow only: a template-level row (hypothesis_id null) may stand in for a step. Live never accepts one. */
  allowTemplateRows?: boolean;
}

/**
 * Pure: every named row must be bound to a hypothesis unless template rows
 * are allowed (`compile_template_only:<id>` otherwise, R3-3), and for every
 * step index the newest named compile row must be a pass, or a
 * review_required whose approval the caller resolved. Returns the first
 * refusal, or null.
 */
export async function verifyCompiles(
  prisma: any,
  stepCount: number,
  rows: readonly CompileRowLike[],
  opts: VerifyCompilesOptions = {},
): Promise<`compile_not_passed:${number}` | `compile_template_only:${string}` | null> {
  if (!opts.allowTemplateRows) {
    const template = rows.find((r) => (r.hypothesis_id ?? null) === null);
    if (template) return `compile_template_only:${template.id}`;
  }
  for (let i = 0; i < stepCount; i += 1) {
    const forStep = rows
      .filter((r) => r.step_index === i)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const newest = forStep[0];
    if (!newest) return `compile_not_passed:${i}`;
    if (newest.verdict === 'pass') continue;
    if (newest.verdict === 'review_required') {
      const approval = await isApproved(prisma, newest.id);
      if (approval.approved) continue;
    }
    return `compile_not_passed:${i}`;
  }
  return null;
}

/** The default reader: the same canonical clawd switch `sendViaGmail` gates on. A thrown read is a halt. */
export async function readAutonomy(): Promise<AutonomyVerdict> {
  try {
    const v = await autonomyHalted('outreach');
    return { halted: v.halted, reason: v.reason };
  } catch (err) {
    return { halted: true, reason: `autonomy read threw: ${err instanceof Error ? err.message : String(err)}` };
  }
}

interface DecisionRow {
  id: string;
  run_id: string;
  action: string;
  lane: string;
  rule_id: string;
  priority: number;
  explain: unknown;
  inputs_snapshot: unknown;
}

const DECISION_SELECT = {
  id: true,
  run_id: true,
  action: true,
  lane: true,
  rule_id: true,
  priority: true,
  explain: true,
  inputs_snapshot: true,
} as const;

async function loadDecision(prisma: any, input: EnrollFromDecisionInput): Promise<DecisionRow | null> {
  if (input.decisionId) {
    const row = await prisma.routingDecision.findUnique({ where: { id: input.decisionId }, select: DECISION_SELECT });
    return (row as DecisionRow | null) ?? null;
  }
  const row = await prisma.routingDecision.findFirst({
    where: { persona_id: input.personaId, action: ENROLL_ACTION },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: DECISION_SELECT,
  });
  return (row as DecisionRow | null) ?? null;
}

function top100Of(decision: DecisionRow | null): RoutingTop100Input | null {
  const snap = decision?.inputs_snapshot;
  if (!isObj(snap) || !isObj(snap.persona)) return null;
  const t = snap.persona.top100;
  if (!isObj(t)) return null;
  return {
    eligibility: optStr(t.eligibility) ?? '',
    sequenceBlock: optStr(t.sequenceBlock),
    hubspotSequenceId: optStr(t.hubspotSequenceId),
    sequenceName: optStr(t.sequenceName),
  };
}

function snapshotTarget(decision: DecisionRow | null): EnrollTarget | null {
  const snap = decision?.inputs_snapshot;
  if (!isObj(snap)) return null;
  const t = optStr(snap.target);
  return t && TARGETS.has(t) ? (t as EnrollTarget) : null;
}

function preferredSenderOf(decision: DecisionRow | null): string | null {
  const snap = decision?.inputs_snapshot;
  return isObj(snap) ? optStr(snap.preferredSender) : null;
}

/**
 * B6 (Opus adversarial review, 2026-09-24): a fresh read, not the routing
 * decision's snapshot, because the decision can be stale (a meeting booked,
 * or a deal opened, after routing ran but before enroll executes). Reuses
 * routing/rules.ts's hasActiveOpportunity so this is the same predicate
 * R3b applies, not a second opportunity model.
 */
async function loadActiveOpportunityInputs(prisma: any, accountName: string, email: string, now: Date): Promise<ActiveOpportunityInputs> {
  const account: { pipeline_stage: string | null } | null = await prisma.account.findUnique({
    where: { name: accountName },
    select: { pipeline_stage: true },
  });
  const lastConfirmed: { response_class: string; created_at: Date } | null = await prisma.conversationDisposition.findFirst({
    where: { contact_email: email, human_confirmed: true },
    orderBy: { created_at: 'desc' },
    select: { response_class: true, created_at: true },
  });
  const lastDisposition =
    lastConfirmed && isResponseClass(lastConfirmed.response_class)
      ? { responseClass: lastConfirmed.response_class, at: lastConfirmed.created_at }
      : null;
  return {
    account: { pipelineStage: account?.pipeline_stage ?? null },
    comms: {
      meetingBooked: lastConfirmed?.response_class === 'meeting_accepted',
      lastDisposition,
    },
    now,
    freshness: { cooldownDays: DEFAULT_FRESHNESS.cooldownDays },
  };
}

interface PersonaRow {
  id: number;
  name: string | null;
  email: string | null;
  account_name: string;
  hubspot_contact_id: string | null;
  do_not_contact: boolean;
  email_status: string | null;
}

interface HypothesisRow {
  id: string;
  status: string;
  account_name: string;
  observation?: string | null;
  problem_hypothesis?: string | null;
  problem_family?: string | null;
  signals?: Array<{ signal: EvidenceSignalRow | null }> | null;
}

// ---------------------------------------------------------------------------
// The service
// ---------------------------------------------------------------------------

export async function enrollFromDecision(
  prisma: any,
  input: EnrollFromDecisionInput,
  deps: EnrollDeps,
): Promise<EnrollServiceResult> {
  const base = {
    mode: input.mode,
    actorKind: input.actorKind,
    decisionId: input.decisionId ?? null,
    hypothesisId: input.hypothesisId,
    personaId: input.personaId,
    versionId: input.sequenceVersionId,
    compileIds: input.compileIds,
  };

  const refuse = async (reason: EnrollServiceRefusal, extra: Record<string, unknown> = {}): Promise<EnrollServiceResult> => {
    await audit(prisma, {
      kind: 'enroll.refused',
      actor: input.actor,
      subjectType: SUBJECT_TYPE,
      subjectId: input.hypothesisId,
      payload: { ...base, predicate: reason, ...extra },
    });
    const detail = typeof extra.detail === 'string' ? extra.detail : undefined;
    return detail ? { ok: false, reason, detail } : { ok: false, reason };
  };

  // 1. The master switch.
  if (!gapFlag('GAP_OS_ENABLED')) return refuse('gap_disabled');

  // 2. Live from a machine needs the earned flag; a human through the UI does not.
  if (input.mode === 'live' && input.actorKind !== 'human' && !gapFlag('GAP_AUTO_ENROLL_ENABLED')) {
    return refuse('enroll_disabled');
  }

  // 3. The version and its steps.
  const version = await prisma.sequenceVersion.findUnique({
    where: { id: input.sequenceVersionId },
    select: { id: true, family_id: true, version: true, status: true, steps: true },
  });
  if (!version) return refuse('version_not_found');
  if (version.status === 'retired') return refuse('version_retired');
  const parsed = parseSteps(version.steps);
  if (!parsed.ok) return refuse(`invalid_version_steps:${parsed.reason}`);
  const steps = parsed.steps.steps;

  // 4. Every step compiled to a pass (or an approved review), among the named rows.
  const compileIds = Array.from(new Set((input.compileIds ?? []).filter((id) => typeof id === 'string' && id.length > 0)));
  const compileRows: CompileRowLike[] =
    compileIds.length === 0
      ? []
      : await prisma.gapCompile.findMany({
          where: { id: { in: compileIds } },
          select: { id: true, sequence_version_id: true, step_index: true, verdict: true, created_at: true, hypothesis_id: true },
        });
  const byId = new Map(compileRows.map((r) => [r.id, r]));
  for (const id of compileIds) {
    const row = byId.get(id);
    if (!row) return refuse(`compile_not_found:${id}`);
    if (row.sequence_version_id !== version.id) return refuse(`compile_wrong_version:${id}`);
    // R3-3: a compile row is evidence about ONE hypothesis and person. A row bound elsewhere never counts;
    // a null row is a template judgment that verifyCompiles accepts for shadow only (compile_template_only).
    const boundTo = row.hypothesis_id ?? null;
    if (boundTo !== null && boundTo !== input.hypothesisId) return refuse(`compile_wrong_hypothesis:${id}`, { boundTo });
  }
  const notPassed = await verifyCompiles(prisma, steps.length, compileRows, { allowTemplateRows: input.mode === 'shadow' });
  if (notPassed) return refuse(notPassed);

  // 5. Live reads the canonical kill switch; shadow never does.
  if (input.mode === 'live') {
    const read = deps.autonomy ?? readAutonomy;
    let verdict: AutonomyVerdict;
    try {
      verdict = await read();
    } catch (err) {
      verdict = { halted: true, reason: `autonomy read threw: ${err instanceof Error ? err.message : String(err)}` };
    }
    if (verdict.halted) return refuse('autonomy_halted', { detail: verdict.reason ?? 'halted' });
  }

  // 6. The hypothesis and the persona.
  const hypothesis: HypothesisRow | null = await prisma.prospectingHypothesis.findUnique({
    where: { id: input.hypothesisId },
    select: {
      id: true,
      status: true,
      account_name: true,
      observation: true,
      problem_hypothesis: true,
      problem_family: true,
      signals: { select: { signal: { select: EVIDENCE_SIGNAL_SELECT } } },
    },
  });
  if (!hypothesis) return refuse('hypothesis_not_found');
  const persona: PersonaRow | null = await prisma.persona.findUnique({
    where: { id: input.personaId },
    select: { id: true, name: true, email: true, account_name: true, hubspot_contact_id: true, do_not_contact: true, email_status: true },
  });
  if (!persona) return refuse('persona_not_found');
  const email = (persona.email ?? '').trim().toLowerCase();
  if (!email) return refuse('no_email');

  // 6b. Suppression, before any target is resolved (R3-2, R3-10): the same
  // guard enroll() runs, local legs then the cross-plane read; the leg is named.
  const suppressionOpts = deps.suppression ? { suppression: deps.suppression } : {};
  const suppression = await checkSuppression(prisma, email, persona.id, suppressionOpts);
  if (!suppression.ok) return refuse(suppression.reason, { leg: suppression.leg, detail: suppression.leg });

  // 7. Target from the persona's Top100 entry (the decision snapshot carries it).
  const decision = await loadDecision(prisma, input);
  const top100 = deps.top100 !== undefined ? deps.top100 : top100Of(decision);
  const target: EnrollTarget =
    deps.top100 !== undefined
      ? resolveEnrollTarget({ persona: { top100 } } as unknown as RoutingInputs)
      : (snapshotTarget(decision) ?? resolveEnrollTarget({ persona: { top100 } } as unknown as RoutingInputs));

  const owner = (input.owner ?? '').trim() || (input.actor.includes('@') ? input.actor : DEFAULT_OWNER);
  const sender = (input.sender ?? '').trim() || preferredSenderOf(decision) || owner;
  const accountName = hypothesis.account_name || persona.account_name;

  // B6 (Opus adversarial review, 2026-09-24): an open deal, a booked
  // meeting, or a recent confirmed positive disposition means a human is
  // already in conversation. Cold-enrolling into a GAP sequence on top of
  // that is the exact failure the routing R3b rule exists to prevent; enroll
  // refuses the same predicate against a fresh read, since a routing
  // decision consumed here can be older than the opportunity that opened.
  const opportunity = await loadActiveOpportunityInputs(prisma, accountName, email, input.now);
  if (hasActiveOpportunity(opportunity)) return refuse('active_opportunity');

  if (target === 'build_required') return refuse('build_required', { target });

  // -------------------------------------------------------------------------
  // hubspot_native: the enroll-table row, never a recorded enrollment (R3-13).
  // -------------------------------------------------------------------------
  if (target === 'hubspot_native') {
    const item: EnrollRowItem = {
      decision: {
        action: ENROLL_ACTION,
        lane: 'work_queue',
        ruleId: decision?.rule_id ?? 'manual',
        priority: decision?.priority ?? 0,
        blocked: false,
        target,
        explain: {
          whyAccount: '',
          whyPerson: '',
          whyProblem: '',
          whyNow: '',
          whyAction: '',
          evidenceIds: [],
          signalIds: [],
          wouldProveWrong: '',
        },
      },
      inputs: {
        account: { name: accountName, hubspotCompanyId: null } as unknown as RoutingInputs['account'],
        persona: {
          id: persona.id,
          email,
          hubspotContactId: persona.hubspot_contact_id,
          top100,
        } as unknown as RoutingInputs['persona'],
      },
      displayName: persona.name,
      preferredSender: sender,
      // The service ran its own compile gate above (every step pass or approved review); the emitter's gate fails closed without this.
      compile: { ok: true, compileIds },
    };
    const row = renderEnrollTableJson(buildEnrollRows([item]));

    // The row is the whole outcome (N4): live audits enroll.row_emitted, never enroll.live; shadow stays enroll.shadow.
    await audit(prisma, {
      kind: input.mode === 'live' ? 'enroll.row_emitted' : 'enroll.shadow',
      actor: input.actor,
      subjectType: SUBJECT_TYPE,
      subjectId: input.hypothesisId,
      payload: { ...base, target, kind: 'enroll_row', row, enrollmentId: null, recorded: false },
    });
    return { ok: true, kind: 'enroll_row', target, mode: input.mode, row, enrollment: null };
  }

  // -------------------------------------------------------------------------
  // modex_queue: the step-0 draft item, then the wrapped enroll().
  // -------------------------------------------------------------------------
  const step0 = steps[0];
  const subjectTemplate = step0?.templates?.subjectTemplate ?? null;
  const bodyTemplate = step0?.templates?.bodyTemplate ?? null;
  if (!subjectTemplate || !bodyTemplate) return refuse('step_has_no_copy:0', { target });
  // R3-4: the slot render. The compiler judges `rendered.marked`; the queue gets `rendered.queued`.
  const rendered = renderStepCopy(
    { subject: subjectTemplate, body: bodyTemplate },
    { firstName: firstNameOf(persona.name), account: accountName, observation: hypothesis.observation ?? null },
  );
  if (rendered.unrendered) return refuse(`unrendered_placeholder:${rendered.unrendered}`, { target, token: rendered.unrendered });
  const wouldBe: WouldBeDraftItem = {
    toEmail: email,
    accountName,
    personaId: persona.id,
    personaName: persona.name,
    subject: rendered.queued.subject,
    body: rendered.queued.body,
    sequenceVersionId: version.id,
    stepIndex: 0,
    owner,
    sender,
  };

  if (input.mode === 'shadow') {
    await audit(prisma, {
      kind: 'enroll.shadow',
      actor: input.actor,
      subjectType: SUBJECT_TYPE,
      subjectId: input.hypothesisId,
      payload: { ...base, target, kind: 'modex_draft_queue', wouldBe },
    });
    return { ok: true, kind: 'modex_shadow', target, mode: 'shadow', wouldBe };
  }

  // N9: the live path compiles the item; the compiler must be switched on.
  if (!gapFlag('GAP_MESSAGE_COMPILER_ENABLED')) return refuse('compiler_disabled', { target });

  // The runtime Sequence row the step-0 item must point at (idempotent; the compile ids were verified above).
  const materialized = await materializeSequence(prisma, { versionId: version.id, hypothesisId: hypothesis.id, compileIds }, input.actor, { owner, now: () => input.now });
  if (!materialized.ok) return refuse(materialized.reason, { target });
  const sequenceId = materialized.sequenceId;

  const added = await deps.addOne(
    {
      toEmail: wouldBe.toEmail,
      accountName: wouldBe.accountName,
      ...(persona.name ? { personaName: persona.name } : {}),
      personaId: persona.id,
      subject: wouldBe.subject,
      body: wouldBe.body,
      campaignTag: `gap:${hypothesis.id}`,
      source: 'casey',
    },
    owner,
  );
  if (!added.ok || typeof added.id !== 'number') {
    return refuse(`queue_refused:${added.reason ?? 'unknown'}`, { target });
  }
  const draftItemId = added.id;

  const parkAs = async (skippedReason: string): Promise<void> => {
    try {
      await prisma.draftQueueItem.updateMany({
        where: { id: draftItemId, status: 'draft' },
        data: { status: 'skipped', skipped_reason: skippedReason },
      });
    } catch {
      // The refusal (or the original error) is the answer; the audit payload records the intent to park.
    }
  };
  const park = (reason: string): Promise<void> => parkAs(`gap_enroll_refused:${reason}`);

  // An arrow const (not a hoisted declaration) so the null-narrowing of hypothesis, persona and target above carries in.
  const afterAddOne = async (): Promise<EnrollServiceResult> => {
  // addOne's input has no sequence_id; stamp it before anything else can act on the item.
  await prisma.draftQueueItem.updateMany({ where: { id: draftItemId, status: 'draft' }, data: { sequence_id: sequenceId } });

  // Per-item compile on the RENDERED, MARKED copy, keyed to the item so the approveBatch guard finds an item-level row.
  const signals = Array.isArray(hypothesis.signals)
    ? hypothesis.signals.map((l) => l.signal).filter((x): x is EvidenceSignalRow => !!x)
    : [];
  const contract: Record<string, unknown> = {
    hypothesis: {
      observation: hypothesis.observation ?? '',
      problemHypothesis: hypothesis.problem_hypothesis ?? '',
      problemFamily: hypothesis.problem_family ?? 'unmapped',
    },
    evidence: evidenceRefsFromSignals(signals, input.now),
    stepCount: steps.length,
    claimsUsed: step0.claimsUsed ?? [],
    ...(deps.contract ?? {}),
  };
  const compiled = await compile(
    {
      hypothesisId: hypothesis.id,
      sequenceVersionId: version.id,
      draftQueueItemId: draftItemId,
      stepIndex: 0,
      subject: rendered.marked.subject,
      body: rendered.marked.body,
      priorBodies: [],
      contract,
      createdBy: input.actor,
    },
    {
      critic: deps.critic ?? makeCriticClient(),
      validateClaims: deps.validateClaims === undefined ? validateClaimsUsed : deps.validateClaims,
      now: () => input.now,
      prisma,
    },
  );
  let itemCompileCleared = compiled.verdict === 'pass';
  if (!itemCompileCleared && compiled.verdict === 'review_required' && compiled.id) {
    itemCompileCleared = (await isApproved(prisma, compiled.id)).approved;
  }
  if (!itemCompileCleared) {
    await park('compile_not_passed:0');
    const failed = compiled.checks.filter((c) => !c.passed).map((c) => c.code);
    return refuse('compile_not_passed:0', {
      target,
      draftItemId,
      parked: true,
      compileId: compiled.id ?? null,
      verdict: compiled.verdict,
      failedChecks: failed,
      detail: `item compile ${compiled.verdict}: ${failed.join(', ') || 'critic'}`,
    });
  }

  const enrolled = await enroll(
    prisma,
    {
      familyId: version.family_id,
      versionId: version.id,
      engine: 'modex_draft_queue',
      toEmail: email,
      accountName,
      personaId: persona.id,
      hypothesisId: hypothesis.id,
      sender,
      owner,
      draftItemId,
      now: input.now,
      enrolledBy: input.actor,
    },
    suppressionOpts,
  );
  if (!enrolled.ok) {
    // Park the orphan so it can never be approved; enroll() owns the reason.
    await park(enrolled.reason);
    return refuse(enrolled.reason, { target, draftItemId, parked: true });
  }

  // enroll() wrote the enroll.live audit row for this enrollment; no second row here.
  return {
    ok: true,
    kind: 'modex_enrolled',
    target,
    mode: 'live',
    draftItemId,
    sequenceId,
    compileId: compiled.id ?? null,
    enrollment: { id: enrolled.id, frozen: enrolled.frozen, isTest: enrolled.isTest },
  };
  };

  // R3-12: from here on an exception parks the orphan before it propagates.
  try {
    return await afterAddOne();
  } catch (err) {
    await parkAs(`gap_enroll_error:${err instanceof Error && err.name ? err.name : 'Error'}`);
    throw err;
  }
}
