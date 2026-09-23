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
 *                    S2-T8) and record a SequenceEnrollment ONLY when mode is
 *                    live AND the caller supplies a HubSpot readback. The
 *                    service never calls HubSpot; it records what HubSpot
 *                    said (spec 5.2, "record").
 *   modex_queue      mode live: materialize the runtime `Sequence` row for
 *                    the version through `materializeSequence` (idempotent,
 *                    needs the passing compile ids verified above; its
 *                    refusal is passed through), create the step-0 Draft
 *                    Queue item through `addOne` (the dedup waterfall stays
 *                    theirs) and stamp that Sequence id on it (the runtime's
 *                    first guard; without it step 1 would never schedule),
 *                    compile the
 *                    item's RENDERED copy through `compile()` with the item's
 *                    id (so the approveBatch guard has an item-level row;
 *                    refuses `compile_not_passed:0` unless pass or an approved
 *                    review, parking the orphan), and then `enroll()` from
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
 *   compile_not_passed:<stepIndex>
 *                                every step of the version needs, among the
 *                                named compile rows, a newest row whose
 *                                verdict is pass, or review_required with an
 *                                approved SendApprovalRequest (isApproved).
 *   autonomy_halted              mode live only: the canonical clawd kill
 *                                switch (`autonomyHalted('outreach')`, the
 *                                same reader `sendViaGmail` gates on). Halted,
 *                                unreachable, or a thrown read all refuse.
 *                                Shadow never reads it.
 *   hypothesis_not_found / persona_not_found / no_email
 *   build_required
 *
 * The wrapped `enroll()` keeps every guard it owns (suppressed,
 * already_enrolled, hypothesis_not_ready, ...); a refusal from it is passed
 * through verbatim and the just-created draft item is parked as skipped
 * with `gap_enroll_refused:<reason>` so it can never be approved.
 *
 * House conventions: `prisma: any` glue, refusal objects `{ok:false, reason}`,
 * no network here except the injected autonomy reader. Voice: no em dashes.
 */
import { autonomyHalted } from '@/lib/email/autonomy-gate';
import { audit } from '@/lib/gap/audit';
import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { isApproved } from '@/lib/gap/compiler/approval';
import { compile, type CompileDeps } from '@/lib/gap/compiler/compile';
import type { CompileEvidenceRef } from '@/lib/gap/compiler/types';
import { makeCriticClient, type CriticClient } from '@/lib/gap/critic-client';
import { gapFlag } from '@/lib/gap/flags';
import {
  buildEnrollRows,
  renderEnrollTableJson,
  type EnrollRowItem,
  type EnrollTableJson,
} from '@/lib/gap/routing/enroll-row';
import { resolveEnrollTarget } from '@/lib/gap/routing/rules';
import type { EnrollTarget, RoutingInputs, RoutingTop100Input } from '@/lib/gap/routing/types';
import {
  enroll,
  recordExternalEnrollment,
  type EnrollRefusal,
  type ExternalReadback,
  type RecordExternalRefusal,
} from '@/lib/gap/sequence/enrollment';
import { enrollmentId as externalEnrollmentId } from '@/lib/gap/sequence/external-sync';
import { firstNameOf, renderPlaceholders } from '@/lib/gap/sequence/render';
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
  /** hubspot_native only: what HubSpot says after the human enrolled by hand. */
  readback?: ExternalReadback | null;
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
  | `compile_not_passed:${number}`
  | 'autonomy_halted'
  | 'hypothesis_not_found'
  | 'persona_not_found'
  | 'no_email'
  | 'build_required'
  | 'step_has_no_copy:0'
  | `queue_refused:${string}`
  | 'compile_not_passed:0'
  | MaterializeRefusal
  | EnrollRefusal
  | RecordExternalRefusal;

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
      enrollment: { id: string; frozen: boolean; isTest: boolean } | null;
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
}

/**
 * Pure: for every step index the newest named compile row must be a pass,
 * or a review_required whose approval the caller resolved. Returns the
 * first failing step, or null.
 */
export async function verifyCompiles(
  prisma: any,
  stepCount: number,
  rows: readonly CompileRowLike[],
): Promise<`compile_not_passed:${number}` | null> {
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

/** Evidence freshness window for the default per-item compile contract (spec section 6, 45 days). */
const EVIDENCE_MAX_AGE_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

interface SignalRow {
  id: string;
  title: string;
  evidence_url: string | null;
  external_ok: boolean | null;
  observed_at: Date | string;
  freshness_expires_at: Date | string | null;
  source_type: string;
  metadata?: unknown;
}

function isFirstParty(sourceType: string): boolean {
  return sourceType.startsWith('first_party') || sourceType === 'crm' || sourceType === 'manual';
}

/** Linked signals as compile evidence refs, fail-closed on every unstated flag. */
export function evidenceRefsFromSignals(signals: readonly SignalRow[], now: Date): CompileEvidenceRef[] {
  const out: CompileEvidenceRef[] = [];
  for (const s of signals) {
    if (!s || typeof s.id !== 'string') continue;
    const observed = s.observed_at instanceof Date ? s.observed_at : new Date(s.observed_at);
    const expires = s.freshness_expires_at
      ? s.freshness_expires_at instanceof Date
        ? s.freshness_expires_at
        : new Date(s.freshness_expires_at)
      : null;
    const fresh = expires
      ? expires.getTime() > now.getTime()
      : !Number.isNaN(observed.getTime()) && now.getTime() - observed.getTime() <= EVIDENCE_MAX_AGE_DAYS * DAY_MS;
    const superseded = isObj(s.metadata) && s.metadata.superseded === true;
    out.push({
      id: s.id,
      title: s.title ?? '',
      url: s.evidence_url ?? null,
      externalOk: s.external_ok === true,
      fresh,
      superseded,
      firstParty: isFirstParty(s.source_type ?? ''),
    });
  }
  return out;
}

interface PersonaRow {
  id: number;
  name: string | null;
  email: string | null;
  account_name: string;
  hubspot_contact_id: string | null;
  do_not_contact: boolean;
}

interface HypothesisRow {
  id: string;
  status: string;
  account_name: string;
  observation?: string | null;
  problem_hypothesis?: string | null;
  problem_family?: string | null;
  signals?: Array<{ signal: SignalRow | null }> | null;
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
          select: { id: true, sequence_version_id: true, step_index: true, verdict: true, created_at: true },
        });
  const byId = new Map(compileRows.map((r) => [r.id, r]));
  for (const id of compileIds) {
    const row = byId.get(id);
    if (!row) return refuse(`compile_not_found:${id}`);
    if (row.sequence_version_id !== version.id) return refuse(`compile_wrong_version:${id}`);
  }
  const notPassed = await verifyCompiles(prisma, steps.length, compileRows);
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
      signals: {
        select: {
          signal: {
            select: {
              id: true,
              title: true,
              evidence_url: true,
              external_ok: true,
              observed_at: true,
              freshness_expires_at: true,
              source_type: true,
              metadata: true,
            },
          },
        },
      },
    },
  });
  if (!hypothesis) return refuse('hypothesis_not_found');
  const persona: PersonaRow | null = await prisma.persona.findUnique({
    where: { id: input.personaId },
    select: { id: true, name: true, email: true, account_name: true, hubspot_contact_id: true, do_not_contact: true },
  });
  if (!persona) return refuse('persona_not_found');
  const email = (persona.email ?? '').trim().toLowerCase();
  if (!email) return refuse('no_email');

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

  if (target === 'build_required') return refuse('build_required', { target });

  // -------------------------------------------------------------------------
  // hubspot_native: the enroll-table row; record only from a live readback.
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

    let enrollment: { id: string; frozen: boolean; isTest: boolean } | null = null;
    if (input.mode === 'live' && input.readback) {
      const hubspotSequenceId = top100?.hubspotSequenceId ?? '';
      const hubspotContactId = persona.hubspot_contact_id ?? '';
      const recorded = await recordExternalEnrollment(prisma, {
        id: externalEnrollmentId(hubspotSequenceId, hubspotContactId),
        familyId: version.family_id,
        versionId: version.id,
        toEmail: email,
        accountName,
        hubspotContactId,
        hubspotSequenceId,
        personaId: persona.id,
        hypothesisId: hypothesis.id,
        sender,
        owner,
        externalState: input.readback,
        enrolledAt: input.now,
        enrolledBy: input.actor,
        now: input.now,
      });
      if (!recorded.ok) return refuse(recorded.reason, { target });
      enrollment = { id: recorded.id, frozen: recorded.frozen, isTest: recorded.isTest };
    }

    // recordExternalEnrollment writes its own enroll.live row; the emitted-only outcomes are audited here.
    if (enrollment === null) {
      await audit(prisma, {
        kind: input.mode === 'live' ? 'enroll.live' : 'enroll.shadow',
        actor: input.actor,
        subjectType: SUBJECT_TYPE,
        subjectId: input.hypothesisId,
        payload: { ...base, target, kind: 'enroll_row', row, enrollmentId: null, recorded: false },
      });
    }
    return { ok: true, kind: 'enroll_row', target, mode: input.mode, row, enrollment };
  }

  // -------------------------------------------------------------------------
  // modex_queue: the step-0 draft item, then the wrapped enroll().
  // -------------------------------------------------------------------------
  const step0 = steps[0];
  const subjectTemplate = step0?.templates?.subjectTemplate ?? null;
  const bodyTemplate = step0?.templates?.bodyTemplate ?? null;
  if (!subjectTemplate || !bodyTemplate) return refuse('step_has_no_copy:0', { target });
  const values = { firstName: firstNameOf(persona.name), account: accountName };
  const wouldBe: WouldBeDraftItem = {
    toEmail: email,
    accountName,
    personaId: persona.id,
    personaName: persona.name,
    subject: renderPlaceholders(subjectTemplate, values),
    body: renderPlaceholders(bodyTemplate, values),
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

  // The runtime Sequence row the step-0 item must point at (idempotent; the compile ids were verified above).
  const materialized = await materializeSequence(prisma, { versionId: version.id, compileIds }, input.actor, { owner, now: () => input.now });
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
  // addOne's input has no sequence_id; stamp it before anything else can act on the item.
  await prisma.draftQueueItem.updateMany({ where: { id: draftItemId, status: 'draft' }, data: { sequence_id: sequenceId } });

  const park = async (reason: string): Promise<void> => {
    try {
      await prisma.draftQueueItem.updateMany({
        where: { id: draftItemId, status: 'draft' },
        data: { status: 'skipped', skipped_reason: `gap_enroll_refused:${reason}` },
      });
    } catch {
      // The refusal is the answer; the audit payload records the intent to park.
    }
  };

  // Per-item compile on the RENDERED copy, keyed to the item so the approveBatch guard finds an item-level row.
  const signals = Array.isArray(hypothesis.signals)
    ? hypothesis.signals.map((l) => l.signal).filter((x): x is SignalRow => !!x)
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
      subject: wouldBe.subject,
      body: wouldBe.body,
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

  const enrolled = await enroll(prisma, {
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
  });
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
}
