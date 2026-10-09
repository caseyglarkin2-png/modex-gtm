/**
 * DRAFT A THESIS FROM A CHECKED FACT (GAP OS execution recovery, R11, 2026-10-06): the ONE service behind the
 * outreach anchor's draft control, built on the existing proposal and transition authority (hypothesis/service.ts,
 * hypothesis/machine.ts) and the existing idempotency and revision rules (source_ref, current-revision.ts).
 *
 * What it guarantees, pinned by tests/unit/gap/draft-from-fact.test.ts and the scratch journey:
 *   - the fact must be THIS account's and must pass the outreach evidence gate NOW (research/evidence-gate.ts): a
 *     draft the send gate would refuse is never minted (it would be the next dead end)
 *   - the problem family is derived with a basis (story/propose-family.ts) or taken from the seller's explicit
 *     choice; when neither exists the draft is created and reported INCOMPLETE with the one missing field, never
 *     submitted with `unmapped`
 *   - one draft per (fact, person): a retry, a double click or a refresh returns the same hypothesis id; a person's
 *     existing open thesis in the same family is returned instead of a twin (final Monday P1)
 *   - a complete draft is submitted for review in the same call; a refused submit leaves the draft recoverable and
 *     says why; nothing here approves, activates, routes, drafts an email or sends
 */
import { existingRevisionFor } from '../hypothesis/current-revision';
import { proposeHypothesis, transitionHypothesis, updateDraftNarrative } from '../hypothesis/service';
import { GATE_SIGNAL_SELECT, outreachFactRefusal, type GateSignal, type OutreachFactRefusal } from '../research/evidence-gate';
import { isProblemFamily, type ProblemFamily } from '../taxonomy';
import { approachFamilyDefault, proposeFamilyFor } from './propose-family';
import type { EvidenceApproach } from '../research/approach-policy';
import { sensitivityOf } from '../research/sensitivity';
import { factUsability, usabilityLine } from '../research/currentness';
import { draftApproachFor } from './draft-approach';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const ANCHOR_DRAFT_SOURCE = 'outreach_anchor';

/** The idempotency key: one draft per fact and person at an account. */
export const anchorSourceRef = (factId: string, personaId: number | null) => `anchor:${factId}:p${personaId ?? 0}`;

export interface DraftFromFactInput {
  accountName: string;
  factId: string;
  personaId: number | null;
  /** The seller's persona key for the primary person (the propose API's enum). */
  persona: string;
  observation: string;
  problemHypothesis: string;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  /** The seller's explicit family, when GAP could not derive one (or to override the derivation). */
  problemFamily?: string | null;
  actor: string;
  now: Date;
}

export type DraftFromFactResult =
  | {
      ok: true;
      hypothesisId: string;
      status: string;
      /** The draft already existed for this fact and person (a retry), or the person already had open work in the family. */
      existing: boolean;
      existingVia: 'same_fact' | 'open_work' | null;
      family: ProblemFamily | 'unmapped';
      familyBasis: string | null;
      /**
       * submitted: under review now; incomplete: the family is missing; draft: the submit was refused (see
       * submitRefusal); in_use: this story is already approved or in use (item 2: never reported as under review).
       */
      preparation: 'submitted' | 'incomplete' | 'draft' | 'in_use';
      missing: string[];
      submitRefusal: string | null;
    }
  | { ok: false; reason: 'fact_not_found' | 'signal_account_mismatch' | 'fact_not_outreach_evidence' | 'invalid_family' | 'story_set_aside' | 'story_closed' | string; detail?: string };

/** Item 2: what a seller who set a story aside is told when it is drafted again (the page promised it would not return). */
export const STORY_SET_ASIDE_DETAIL = 'You set this story aside (Not this story): GAP will not draft it again. A newer fact about it is a new story.';
const IN_USE = new Set(['approved', 'active']);
const CLOSED = new Set(['confirmed', 'partially_confirmed', 'unresolved', 'expired']);

export type DraftFactRow = GateSignal & { id: string; title: string | null; evidence_text: string | null; freshness_expires_at: Date | null };
type FactRow = DraftFactRow;
/** The select a caller uses to read a fact for `draftFactRefusal`. */
export const DRAFT_FACT_SELECT = { ...GATE_SIGNAL_SELECT, freshness_expires_at: true } as const;

/**
 * R65: the checks this service runs on a fact before it drafts or adopts anything, in its order (the account, the one
 * freshness authority, the approach's evidence gate, sensitivity), so the read-only repair dry run says exactly what
 * the service would do. Null when the fact may carry a draft.
 */
export function draftFactRefusal(fact: DraftFactRow | null, accountName: string, now: Date): { reason: 'fact_not_found' | 'signal_account_mismatch' | 'fact_not_outreach_evidence'; detail?: string } | null {
  if (!fact) return { reason: 'fact_not_found' };
  if ((fact.account_name ?? '').trim().toLowerCase() !== accountName.trim().toLowerCase()) return { reason: 'signal_account_mismatch' };
  // I06: the one usability authority; a historical fact drafts (the copy says its date); ended, closed, undated or
  // superseded refuses, in the seller's words.
  const standing = factUsability(fact, now);
  if (!standing.usable) return { reason: 'fact_not_outreach_evidence', detail: usabilityLine(standing, fact) };
  const refusal: OutreachFactRefusal | null = outreachFactRefusal(fact, accountName, { approach: draftApproachOf(fact) });
  if (refusal) return { reason: 'fact_not_outreach_evidence', detail: refusal };
  // The page never offers a sensitive fact (layoffs, a lawsuit) as the hook; the service refuses it the same way.
  const sensitive = sensitivityOf(fact.evidence_text ?? '');
  if (sensitive) return { reason: 'fact_not_outreach_evidence', detail: `sensitive:${sensitive}` };
  return null;
}

/**
 * R30: the claim's class decides the approach the thesis will carry; the gate runs under that approach. Items 4 and 6:
 * one chooser for the page and the service (story/draft-approach.ts): a posting is job-led, a physical change is
 * event-led, an ongoing partnership or program (the Gatik agreement) is fit-led; nothing else opens a first touch, and
 * the event-led gate then says why.
 */
function draftApproachOf(fact: DraftFactRow): EvidenceApproach {
  const meta = fact.metadata && typeof fact.metadata === 'object' && !Array.isArray(fact.metadata) ? (fact.metadata as Record<string, unknown>) : {};
  const recorded = meta.continuity && typeof meta.continuity === 'object' ? (meta.continuity as { kind?: string }).kind : undefined;
  return draftApproachFor({ text: fact.evidence_text ?? '', claimClass: fact.claim_class ?? null, continuity: recorded === 'event' || recorded === 'ongoing_state' || recorded === 'ended' ? recorded : null }) ?? 'event_led';
}

export async function draftThesisFromFact(prisma: PrismaLike, input: DraftFromFactInput): Promise<DraftFromFactResult> {
  const fact: FactRow | null = await prisma.prospectingSignal.findUnique({ where: { id: input.factId }, select: DRAFT_FACT_SELECT });
  const refused = draftFactRefusal(fact, input.accountName, input.now);
  if (refused) return { ok: false, ...refused };
  if (!fact) return { ok: false, reason: 'fact_not_found' };
  // The fact passed draftFactRefusal above; the approach it carries decides the family question (item 3).
  const approach: EvidenceApproach = draftApproachOf(fact);

  // The family: explicit, else derived with a basis, else missing (incomplete, never unmapped on the submit path).
  let family: ProblemFamily | 'unmapped' = 'unmapped';
  let familyBasis: string | null = null;
  if (input.problemFamily != null && input.problemFamily !== '') {
    if (!isProblemFamily(input.problemFamily)) return { ok: false, reason: 'invalid_family' };
    family = input.problemFamily;
    familyBasis = 'chosen by you';
  } else if (approach !== 'event_led') {
    // Item 3: a job- or procurement-led thesis's copy is chosen by its approach program, so the family is never asked.
    const d = approachFamilyDefault(fact.evidence_text ?? '');
    family = d.family;
    familyBasis = d.basis;
  } else {
    const proposed = proposeFamilyFor(fact.evidence_text ?? '');
    if (proposed.family) {
      family = proposed.family;
      familyBasis = proposed.basis;
    }
  }

  const sourceRef = anchorSourceRef(fact.id, input.personaId);
  let mine: { id: string; status: string; problem_family: string } | null = await prisma.prospectingHypothesis.findFirst({ where: { source_ref: sourceRef }, select: { id: true, status: true, problem_family: true } });
  if (!mine) {
    // A stranded draft from the older path (no source_ref) that cites this fact for this person is THIS proposal:
    // adopt it and stamp the key, never a twin beside it (the production repair, R64, runs through here too).
    const stranded: { id: string; status: string; problem_family: string } | null = await prisma.prospectingHypothesis.findFirst({
      where: { account_name: input.accountName, primary_persona_id: input.personaId, status: { in: ['draft', 'review_required'] }, source_ref: null, superseded_by: { is: null }, signals: { some: { signal_id: fact.id } } },
      orderBy: { created_at: 'desc' },
      select: { id: true, status: true, problem_family: true },
    });
    if (stranded) {
      await prisma.prospectingHypothesis.updateMany({ where: { id: stranded.id, source_ref: null }, data: { source_ref: sourceRef } });
      mine = stranded;
    }
  }
  let hypothesisId: string;
  let existing = false;
  let existingVia: 'same_fact' | 'open_work' | null = null;
  if (mine) {
    // Item 2 (audit at 31f09c71): the same fact for the same person after NOT THIS STORY is the set-aside story, never
    // a review that does not exist; a story closed by its outcome is closed.
    if (mine.status === 'rejected') return { ok: false, reason: 'story_set_aside', detail: STORY_SET_ASIDE_DETAIL };
    if (CLOSED.has(mine.status)) return { ok: false, reason: 'story_closed', detail: `This story's thesis is ${mine.status.replace(/_/g, ' ')}: it is not drafted again.` };
    hypothesisId = mine.id;
    existing = true;
    existingVia = 'same_fact';
    if (isProblemFamily(mine.problem_family)) {
      family = mine.problem_family;
      familyBasis = familyBasis ?? 'recorded on the draft';
    }
  } else {
    // The person already has open thesis work in this family: that is the thesis to review, never a twin. Item 3: an
    // event-led thesis only; a job- or procurement-led thesis's family is recorded, not its story (another posting is
    // another story, never a twin of an event-led thesis that shares the general family).
    if (family !== 'unmapped' && approach === 'event_led') {
      const already = await existingRevisionFor(prisma, { accountName: input.accountName, personaId: input.personaId, problemFamily: family });
      if (already && (already.status === 'draft' || already.status === 'review_required')) {
        return { ok: true, hypothesisId: already.hypothesisId, status: already.status, existing: true, existingVia: 'open_work', family, familyBasis, preparation: already.status === 'review_required' ? 'submitted' : 'draft', missing: [], submitRefusal: null };
      }
    }
    const r = await proposeHypothesis(prisma, {
      accountName: input.accountName,
      primaryPersonaId: input.personaId,
      persona: input.persona,
      problemFamily: family,
      observation: input.observation,
      problemHypothesis: input.problemHypothesis,
      rootCauseHypotheses: [],
      impactHypotheses: [],
      whyNow: null,
      falsificationQuestions: input.falsificationQuestions,
      whatANoMeans: input.whatANoMeans,
      confidence: 40,
      signalIds: [fact.id],
      primarySignalId: fact.id,
      sourceRef,
      metadata: { proposedFrom: ANCHOR_DRAFT_SOURCE, factId: fact.id, familyBasis, familyVia: familyBasis === 'chosen by you' ? 'seller' : family === 'unmapped' ? 'none' : 'derived', approach },
      createdBy: input.actor,
    });
    if (!r.ok) {
      // A concurrent click won the source_ref race: that draft is this draft.
      if (r.reason === 'duplicate_source_ref' && r.existingId) {
        hypothesisId = r.existingId;
        existing = true;
        existingVia = 'same_fact';
      } else {
        return { ok: false, reason: r.reason };
      }
    } else {
      hypothesisId = r.id;
    }
  }

  const row: { status: string } | null = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesisId }, select: { status: true } });
  let status = row?.status ?? 'draft';
  // A retry on an existing DRAFT carries the seller's current text and family in (an audited narrative edit), so an
  // incomplete or refused draft is edited from the same control, never abandoned for a twin.
  if (existing && status === 'draft') {
    const edit = await updateDraftNarrative(
      prisma,
      hypothesisId,
      { observation: input.observation, problemHypothesis: input.problemHypothesis, falsificationQuestions: input.falsificationQuestions, whatANoMeans: input.whatANoMeans, ...(family !== 'unmapped' ? { problemFamily: family } : {}) },
      input.actor,
    );
    if (!edit.ok && edit.reason !== 'empty_patch') {
      return { ok: true, hypothesisId, status, existing, existingVia, family, familyBasis, preparation: 'draft', missing: [], submitRefusal: edit.reason };
    }
  }
  if (family === 'unmapped') {
    return { ok: true, hypothesisId, status, existing, existingVia, family, familyBasis: null, preparation: 'incomplete', missing: ['problem_family'], submitRefusal: null };
  }
  if (status !== 'draft') {
    return { ok: true, hypothesisId, status, existing, existingVia, family, familyBasis, preparation: IN_USE.has(status) ? 'in_use' : 'submitted', missing: [], submitRefusal: null };
  }
  const t = await transitionHypothesis(prisma, hypothesisId, 'submit', { now: input.now, actor: input.actor, reason: 'drafted from a checked fact on the account page' });
  if (!t.ok) {
    return { ok: true, hypothesisId, status, existing, existingVia, family, familyBasis, preparation: 'draft', missing: [], submitRefusal: t.reason };
  }
  status = t.to;
  return { ok: true, hypothesisId, status, existing, existingVia, family, familyBasis, preparation: 'submitted', missing: [], submitRefusal: null };
}
