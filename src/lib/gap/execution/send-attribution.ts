/**
 * SEND-TIME attribution (Phase 2 A2, 2026-09-28).
 *
 * Learning at N=20 / 100 / 500 can only ask about what was stamped when the
 * email went out. This captures, once, at the moment a send is recorded:
 *
 *   primaryFactId        the hypothesis's ONE primary outreach fact (HypothesisSignal role primary)
 *   signalType / sourceKind / sourceType   what kind of fact opened the conversation
 *   openerApproach       verified_fact_observation for the first touch; follow_up:<step purpose> after
 *   personaTitle / personaSeniority / personaRoleInDeal / personaKey
 *   accountTier / hubspotCompanyId / canonicalCompanyId
 *   problemFamily
 *
 * The copy/version and evidence tier are already on the send rows. The
 * attribution is written INTO the append-only ledger payload, so it is
 * immutable. It never throws and never blocks a send: a failed read becomes
 * `{ unrecorded: true, reason }`, and rows written before this existed read as
 * unrecorded (nothing is backfilled or invented).
 */
import { parseSteps } from '../sequence/steps';
import { workSourcesFor, type AttributedWorkSource } from '../intake/context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const SEND_ATTRIBUTION_VERSION = 1;

export interface SendAttribution {
  version: typeof SEND_ATTRIBUTION_VERSION;
  primaryFactId: string | null;
  signalType: string | null;
  signalSourceKind: string | null;
  signalSourceType: string | null;
  openerApproach: string;
  personaTitle: string | null;
  personaSeniority: string | null;
  personaRoleInDeal: string | null;
  personaKey: string | null;
  accountName: string;
  accountTier: string | null;
  hubspotCompanyId: string | null;
  canonicalCompanyId: string | null;
  problemFamily: string | null;
  /** Universal Work Intake: every work source this person (or account) came from, at send time. Context, not cause. */
  workSources?: AttributedWorkSource[];
  capturedAt: string;
}

export type SendAttributionField = SendAttribution | { version: typeof SEND_ATTRIBUTION_VERSION; unrecorded: true; reason: string };

export interface AttributionInput {
  hypothesisId: string | null;
  personaId: number | null;
  accountName: string;
  stepIndex: number;
  sequenceVersionId: string | null;
  at: Date;
}

export function openerApproachFor(stepIndex: number, steps: unknown): string {
  if (stepIndex <= 0) return 'verified_fact_observation';
  const parsed = parseSteps(steps);
  const purpose = parsed.ok ? parsed.steps.steps[stepIndex]?.purpose : undefined;
  return `follow_up:${purpose ?? `step_${stepIndex}`}`;
}

export async function captureSendAttribution(prisma: PrismaLike, input: AttributionInput): Promise<SendAttributionField> {
  try {
    const [hyp, persona, account, link, version, workSources] = await Promise.all([
      input.hypothesisId
        ? prisma.prospectingHypothesis.findUnique({
            where: { id: input.hypothesisId },
            select: { problem_family: true, persona: true, signals: { select: { role: true, signal_id: true, signal: { select: { id: true, type: true, source_kind: true, source_type: true } } } } },
          })
        : null,
      input.personaId !== null ? prisma.persona.findUnique({ where: { id: input.personaId }, select: { title: true, seniority: true, role_in_deal: true } }) : null,
      prisma.account.findUnique({ where: { name: input.accountName }, select: { tier: true, hubspot_company_id: true } }),
      prisma.canonicalAccountLink.findUnique({ where: { account_name: input.accountName }, select: { canonical_company_id: true, status: true } }),
      input.sequenceVersionId && input.stepIndex > 0 ? prisma.sequenceVersion.findUnique({ where: { id: input.sequenceVersionId }, select: { steps: true } }) : null,
      workSourcesFor(prisma, { personaId: input.personaId, accountName: input.accountName }),
    ]);
    const links: Array<{ role: string | null; signal_id: string; signal?: { id: string; type: string | null; source_kind: string | null; source_type: string | null } | null }> = hyp?.signals ?? [];
    const primary = links.find((l) => l.role === 'primary') ?? null;
    return {
      version: SEND_ATTRIBUTION_VERSION,
      primaryFactId: primary?.signal_id ?? null,
      signalType: primary?.signal?.type ?? null,
      signalSourceKind: primary?.signal?.source_kind ?? null,
      signalSourceType: primary?.signal?.source_type ?? null,
      openerApproach: openerApproachFor(input.stepIndex, version?.steps),
      personaTitle: persona?.title ?? null,
      personaSeniority: persona?.seniority ?? null,
      personaRoleInDeal: persona?.role_in_deal ?? null,
      personaKey: hyp?.persona ?? null,
      accountName: input.accountName,
      accountTier: account?.tier ?? null,
      hubspotCompanyId: account?.hubspot_company_id ?? null,
      canonicalCompanyId: link?.status === 'resolved' ? link.canonical_company_id : null,
      problemFamily: hyp?.problem_family ?? null,
      workSources,
      capturedAt: input.at.toISOString(),
    };
  } catch (e) {
    return { version: SEND_ATTRIBUTION_VERSION, unrecorded: true, reason: (e instanceof Error ? e.message : String(e)).slice(0, 200) };
  }
}

/** The attribution a ledger payload carries, or `unrecorded` (rows from before Phase 2 A2, or a failed capture). */
export function sendAttributionOf(payload: unknown): SendAttributionField {
  const a = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).attribution : undefined;
  if (a && typeof a === 'object' && (a as Record<string, unknown>).version === SEND_ATTRIBUTION_VERSION) return a as SendAttributionField;
  return { version: SEND_ATTRIBUTION_VERSION, unrecorded: true, reason: 'recorded_before_attribution' };
}
