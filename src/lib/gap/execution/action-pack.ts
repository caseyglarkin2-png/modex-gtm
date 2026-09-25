/**
 * The Seller Action Center action pack, loaded ONCE for both readers (final
 * pass, 2026-09-25): the /gap/preview page that shows it and the Gmail draft
 * service that acts on it. One loader means the copy Casey reads and the copy
 * that lands in his Drafts folder are the same bytes, rendered for the same
 * person, judged by the same compile row.
 *
 * Person: the routing decision's persona when a decision id is given and it
 * belongs to this hypothesis's account; else an explicit persona id on the
 * same account; else the hypothesis's primary persona. The pre-final page
 * always used the primary persona, so a card for Jason could open a pack
 * written to Joey.
 *
 * Readiness ("Ready to send") is the compile verdict for THIS exact rendered
 * copy: the newest GapCompile row for (hypothesis, version, step 0) whose
 * `inputs_snapshot` subject and body equal the marked render. `pass`, or
 * `review_required` with an approved SendApprovalRequest, is cleared. A row
 * compiled for other copy (another persona's first name, an older version)
 * never counts. House `prisma: any` glue (PrismaLike).
 */

import { createHash } from 'node:crypto';
import { isApproved } from '../compiler/approval';
import { getHypothesis } from '../hypothesis/service';
import { resolveEnrollTarget } from '../routing/rules';
import type { EnrollTarget, RoutingInputs, RoutingTop100Input } from '../routing/types';
import { parseSteps, type StepsV2 } from '../sequence/steps';
import { firstNameOf, renderStepCopy, type RenderedCopy } from '../sequence/render';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const optStr = (v: unknown): string | null => (typeof v === 'string' && v.trim().length > 0 ? v : null);

const TARGETS: ReadonlySet<string> = new Set<EnrollTarget>(['hubspot_native', 'modex_queue', 'build_required']);
const ENGINE_FOR_TARGET: Record<EnrollTarget, string | null> = {
  hubspot_native: 'hubspot_native',
  modex_queue: 'modex_draft_queue',
  build_required: null,
};

export interface PackDecision {
  id: string;
  rule_id: string;
  action: string;
  lane: string;
  persona_id: number | null;
  hypothesis_id: string | null;
  account_name: string;
  inputs_snapshot: unknown;
  created_at: Date;
}

export interface PackPersona {
  id: number;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  hubspot_contact_id: string | null;
  account_name: string;
  do_not_contact: boolean;
  email_valid: boolean;
  email_status: string | null;
}

export interface PackVersion {
  id: string;
  family_id: string;
  version: number;
  status: string;
  steps: unknown;
  family?: { id: string; name: string | null; engine: string } | null;
}

export interface PackCompile {
  id: string;
  verdict: string;
  created_at: Date;
  approved: boolean;
  approvalRequestId: string | null;
  approvalStatus: string | null;
}

export interface ActionPack {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the getHypothesis row (house glue)
  hypothesis: any;
  persona: PackPersona | null;
  personaSource: 'decision' | 'query' | 'primary' | 'none';
  /** A decision id or persona id was given but did not belong to this hypothesis's account. */
  personaRefused: string | null;
  decision: PackDecision | null;
  target: EnrollTarget;
  top100: RoutingTop100Input | null;
  version: PackVersion | null;
  steps: StepsV2['steps'];
  /** Step 0 rendered for this persona; null without a persona or step-0 copy. */
  rendered: RenderedCopy | null;
  /** sha256 of the queued subject + body: the content identity of a draft. */
  contentHash: string | null;
  /** The compile row that judged exactly this marked copy, if any. */
  compile: PackCompile | null;
  /** Compiler-cleared for this exact copy. */
  emailReady: boolean;
  /** The step rendered. */
  stepIndex: number;
  /** Citations in the copy that are not this hypothesis's evidence (template fixtures). */
  unresolvedCitations: string[];
}

const PERSONA_SELECT = {
  id: true,
  name: true,
  title: true,
  email: true,
  phone: true,
  linkedin_url: true,
  hubspot_contact_id: true,
  account_name: true,
  do_not_contact: true,
  email_valid: true,
  email_status: true,
} as const;

const VERSION_SELECT = {
  id: true,
  family_id: true,
  version: true,
  status: true,
  steps: true,
  family: { select: { id: true, name: true, engine: true } },
} as const;

function top100Of(decision: PackDecision | null): RoutingTop100Input | null {
  const snap = decision?.inputs_snapshot;
  if (!isObj(snap) || !isObj(snap.persona) || !isObj(snap.persona.top100)) return null;
  const t = snap.persona.top100;
  return {
    eligibility: optStr(t.eligibility) ?? '',
    sequenceBlock: optStr(t.sequenceBlock),
    hubspotSequenceId: optStr(t.hubspotSequenceId),
    sequenceName: optStr(t.sequenceName),
  };
}

function targetOf(decision: PackDecision | null): EnrollTarget {
  const snap = decision?.inputs_snapshot;
  const stored = isObj(snap) ? optStr(snap.target) : null;
  if (stored && TARGETS.has(stored)) return stored as EnrollTarget;
  return resolveEnrollTarget({ persona: { top100: top100Of(decision) } } as unknown as RoutingInputs);
}

async function newestVersionOfFamily(prisma: PrismaLike, familyId: string): Promise<PackVersion | null> {
  return prisma.sequenceVersion.findFirst({
    where: { family_id: familyId, status: { in: ['draft', 'frozen'] } },
    orderBy: { version: 'desc' },
    select: VERSION_SELECT,
  });
}

/** The version the action pack renders (unchanged from the S3-T12 preview rule). */
export async function resolvePackVersion(
  prisma: PrismaLike,
  hypothesis: { sequence_version_id: string | null; sequence_family_id: string | null; problem_family: string },
  target: EnrollTarget,
): Promise<PackVersion | null> {
  if (hypothesis.sequence_version_id) {
    const own = await prisma.sequenceVersion.findUnique({ where: { id: hypothesis.sequence_version_id }, select: VERSION_SELECT });
    if (own) return own;
  }
  if (hypothesis.sequence_family_id) {
    const v = await newestVersionOfFamily(prisma, hypothesis.sequence_family_id);
    if (v) return v;
  }
  const engine = ENGINE_FOR_TARGET[target];
  const families: Array<{ id: string }> = await prisma.sequenceFamily.findMany({
    where: { problem_family: hypothesis.problem_family, archived_at: null, ...(engine ? { engine } : {}) },
    orderBy: { created_at: 'desc' },
    select: { id: true },
    take: 5,
  });
  for (const f of families) {
    const v = await newestVersionOfFamily(prisma, f.id);
    if (v) return v;
  }
  return null;
}

export function contentHashOf(copy: { subject: string; body: string }): string {
  return createHash('sha256').update(`${copy.subject}\n\u0000\n${copy.body}`).digest('hex');
}

/** The newest compile row that judged exactly this marked step-0 copy. */
export async function findCompileForCopy(
  prisma: PrismaLike,
  args: { hypothesisId: string; versionId: string; marked: { subject: string; body: string }; stepIndex?: number },
): Promise<PackCompile | null> {
  const rows: Array<{ id: string; verdict: string; created_at: Date; inputs_snapshot: unknown }> = await prisma.gapCompile.findMany({
    where: { hypothesis_id: args.hypothesisId, sequence_version_id: args.versionId, step_index: args.stepIndex ?? 0 },
    orderBy: { created_at: 'desc' },
    take: 25,
    select: { id: true, verdict: true, created_at: true, inputs_snapshot: true },
  });
  const row = rows.find(
    (r) => isObj(r.inputs_snapshot) && r.inputs_snapshot.subject === args.marked.subject && r.inputs_snapshot.body === args.marked.body,
  );
  if (!row) return null;
  let approved = false;
  let approvalRequestId: string | null = null;
  let approvalStatus: string | null = null;
  if (row.verdict === 'review_required') {
    const a = await isApproved(prisma, row.id);
    approved = a.approved;
    approvalRequestId = a.requestId;
    approvalStatus = a.status;
  }
  return { id: row.id, verdict: row.verdict, created_at: row.created_at, approved, approvalRequestId, approvalStatus };
}

export function compileCleared(c: PackCompile | null): boolean {
  return c !== null && (c.verdict === 'pass' || (c.verdict === 'review_required' && c.approved));
}

export interface LoadActionPackArgs {
  hypothesisId: string;
  personaId?: number | null;
  decisionId?: string | null;
  /** Which sequence step to render (default 0; a due follow-up passes its step). */
  stepIndex?: number;
}

export async function loadActionPack(prisma: PrismaLike, args: LoadActionPackArgs): Promise<ActionPack | null> {
  const hypothesis = await getHypothesis(prisma, args.hypothesisId);
  if (!hypothesis) return null;

  let decision: PackDecision | null = null;
  let persona: PackPersona | null = null;
  let personaSource: ActionPack['personaSource'] = 'none';
  let personaRefused: string | null = null;

  const DECISION_SELECT = { id: true, rule_id: true, action: true, lane: true, persona_id: true, hypothesis_id: true, account_name: true, inputs_snapshot: true, created_at: true };
  if (args.decisionId) {
    const d: PackDecision | null = await prisma.routingDecision.findUnique({ where: { id: args.decisionId }, select: DECISION_SELECT });
    if (d && d.account_name === hypothesis.account_name) {
      decision = d;
      if (typeof d.persona_id === 'number') {
        persona = await prisma.persona.findUnique({ where: { id: d.persona_id }, select: PERSONA_SELECT });
        if (persona) personaSource = 'decision';
      }
    } else {
      personaRefused = d ? 'decision_account_mismatch' : 'decision_not_found';
    }
  }
  if (!persona && typeof args.personaId === 'number' && Number.isFinite(args.personaId)) {
    const p: PackPersona | null = await prisma.persona.findUnique({ where: { id: args.personaId }, select: PERSONA_SELECT });
    if (p && p.account_name === hypothesis.account_name) {
      persona = p;
      personaSource = 'query';
    } else {
      personaRefused ??= p ? 'persona_account_mismatch' : 'persona_not_found';
    }
  }
  if (!persona && !personaRefused && hypothesis.primary_persona_id) {
    persona = await prisma.persona.findUnique({ where: { id: hypothesis.primary_persona_id }, select: PERSONA_SELECT });
    if (persona) personaSource = 'primary';
  }

  if (!decision) {
    decision = await prisma.routingDecision.findFirst({
      where: { hypothesis_id: hypothesis.id, action: 'enroll_gap_sequence' },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: DECISION_SELECT,
    });
  }
  const target = targetOf(decision);
  const version = await resolvePackVersion(prisma, hypothesis, target);
  const parsed = version ? parseSteps(version.steps) : null;
  const steps = parsed && parsed.ok ? parsed.steps.steps : [];

  const stepIndex = Math.max(0, args.stepIndex ?? 0);
  const step0 = steps[stepIndex];
  const rendered =
    persona && step0?.templates?.subjectTemplate && step0.templates.bodyTemplate
      ? renderStepCopy(
          { subject: step0.templates.subjectTemplate, body: step0.templates.bodyTemplate },
          { firstName: firstNameOf(persona.name), account: hypothesis.account_name, observation: hypothesis.observation },
        )
      : null;

  const compile =
    rendered && version && rendered.unrendered === null
      ? await findCompileForCopy(prisma, { hypothesisId: hypothesis.id, versionId: version.id, marked: rendered.marked, stepIndex })
      : null;

  // Citations the copy makes that are NOT this hypothesis's linked signals
  // (a seed template's fixture evidence, e.g. "[[SRC:hc_ev_2]]" about
  // "Fontana"): the rendered text would state someone else's facts as this
  // account's. Surfaced so the page never offers that copy as usable.
  const linked = new Set<string>(
    Array.isArray(hypothesis.signals) ? hypothesis.signals.map((l: { signal_id?: string; signal?: { id?: string } }) => l.signal?.id ?? l.signal_id ?? '').filter(Boolean) : [],
  );
  const unresolvedCitations = rendered
    ? [...`${rendered.marked.subject}
${rendered.marked.body}`.matchAll(/\[\[SRC:([A-Za-z0-9_-]+)\]\]/g)].map((m) => m[1]).filter((id) => !linked.has(id))
    : [];

  return {
    hypothesis,
    persona,
    personaSource,
    personaRefused,
    decision,
    target,
    top100: top100Of(decision),
    version,
    steps,
    rendered,
    contentHash: rendered ? contentHashOf(rendered.queued) : null,
    compile,
    emailReady: rendered !== null && rendered.unrendered === null && unresolvedCitations.length === 0 && compileCleared(compile),
    stepIndex,
    unresolvedCitations,
  };
}
