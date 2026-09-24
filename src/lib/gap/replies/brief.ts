/**
 * Pre-call brief (GAP Prospecting OS, Sprint 4, S4-T3): `GET /api/gap/call/[personaId]`.
 *
 * Read-only. One persona, its account, the hypothesis to test on the call
 * (the persona's `active` one, else the persona's newest, else the account's
 * active one), split into the FACT block (the cited observation plus the
 * linked signals with their urls) and the HYPOTHESIS block (problem, root
 * causes, impacts, why now), what would prove it wrong, the last three
 * dispositions on this person, the open (unconfirmed, unsuperseded) BIDs,
 * and the questions to ask.
 *
 * Suggested questions: the taxonomy's family catalog carries no question
 * list today (`ProblemFamilyDefinition` is problem, likelyCauses, impacts,
 * signalTypes), so the questions are the hypothesis's falsification
 * questions, each made a question (trailing "?"); when the hypothesis has
 * none, the catalog's problem and likely causes are turned into questions so
 * the caller is never handed an empty list. If a later ticket adds catalog
 * questions, `catalogQuestions` is the one place to read them.
 *
 * House convention for DB glue is `prisma: any`. Voice: no em dashes.
 */

import { supersededIds } from '../bid/select';
import { PROBLEM_FAMILY_CATALOG, isProblemFamily } from '../taxonomy';

export interface BriefPersona {
  id: number;
  personaKey: string | null;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  doNotContact: boolean;
}

export interface BriefAccount {
  name: string;
  hubspotCompanyId: string | null;
  tier: string | null;
  vertical: string | null;
}

export interface BriefSignal {
  id: string;
  title: string | null;
  source_kind: string | null;
  evidence_url: string | null;
  evidence_text: string | null;
  observed_at: string | null;
}

export interface BriefHypothesis {
  id: string;
  status: string;
  problemFamily: string;
  confidence: number;
  /** FACT block */
  observation: string;
  signals: BriefSignal[];
  /** HYPOTHESIS block */
  problemHypothesis: string;
  rootCauseHypotheses: string[];
  impactHypotheses: string[];
  whyNow: string | null;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  contraryEvidence: string | null;
  predictedBuyerLanguage: string | null;
  /** what_a_no_means and contrary_evidence, the non-empty ones. */
  wouldProveWrong: string[];
}

export interface BriefDisposition {
  id: string;
  channel: string;
  responseClass: string;
  buyerLanguage: string | null;
  humanConfirmed: boolean;
  createdAt: string;
}

export interface BriefBid {
  id: string;
  type: string;
  rawBuyerLanguage: string;
  humanConfirmed: boolean;
  capturedAt: string | null;
}

export interface CallBrief {
  persona: BriefPersona;
  account: BriefAccount;
  hypothesis: BriefHypothesis | null;
  lastDispositions: BriefDisposition[];
  openBids: BriefBid[];
  suggestedQuestions: string[];
}

export const LAST_DISPOSITIONS = 3;

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0) : [];
}

function nonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Trailing "?" on a falsification line; a statement becomes a question. */
export function asQuestion(line: string): string {
  const trimmed = line.trim().replace(/[.!]+$/, '');
  return trimmed.endsWith('?') ? trimmed : `${trimmed}?`;
}

/** The family catalog carries no questions today; this returns [] until it does. */
export function catalogQuestions(problemFamily: string): string[] {
  if (!isProblemFamily(problemFamily)) return [];
  const def = PROBLEM_FAMILY_CATALOG[problemFamily] as { questions?: unknown };
  return asStringArray(def.questions);
}

/** Questions from the catalog's problem and likely causes, for a hypothesis with no falsification lines. */
export function questionsFromCatalog(problemFamily: string): string[] {
  if (!isProblemFamily(problemFamily)) return [];
  const def = PROBLEM_FAMILY_CATALOG[problemFamily];
  const problem = def.problem.trim().replace(/[.!]+$/, '');
  const out = [`Does this describe your yards today: ${problem.charAt(0).toLowerCase()}${problem.slice(1)}?`];
  for (const cause of def.likelyCauses.slice(0, 3)) out.push(`Is it ${cause.charAt(0).toLowerCase()}${cause.slice(1)}?`);
  return out;
}

export function suggestedQuestionsFor(hypothesis: { problemFamily: string; falsificationQuestions: string[] } | null): string[] {
  if (!hypothesis) return [];
  const fromCatalog = catalogQuestions(hypothesis.problemFamily);
  if (fromCatalog.length > 0) return fromCatalog.map(asQuestion);
  const fromFalsification = hypothesis.falsificationQuestions.map(asQuestion);
  if (fromFalsification.length > 0) return fromFalsification;
  return questionsFromCatalog(hypothesis.problemFamily);
}

const HYPOTHESIS_SELECT = {
  id: true,
  status: true,
  problem_family: true,
  confidence: true,
  observation: true,
  problem_hypothesis: true,
  root_cause_hypotheses: true,
  impact_hypotheses: true,
  why_now: true,
  falsification_questions: true,
  what_a_no_means: true,
  contrary_evidence: true,
  predicted_buyer_language: true,
  created_at: true,
  signals: {
    select: {
      role: true,
      signal: { select: { id: true, title: true, source_kind: true, evidence_url: true, evidence_text: true, observed_at: true } },
    },
  },
} as const;

function toBriefHypothesis(row: any): BriefHypothesis {
  const signals: BriefSignal[] = (row.signals ?? [])
    .map((link: any) => link.signal)
    .filter(Boolean)
    .map((s: any) => ({
      id: s.id,
      title: s.title ?? null,
      source_kind: s.source_kind ?? null,
      evidence_url: s.evidence_url ?? null,
      evidence_text: s.evidence_text ?? null,
      observed_at: s.observed_at instanceof Date ? s.observed_at.toISOString() : null,
    }));
  const whatANoMeans = nonBlank(row.what_a_no_means) ? row.what_a_no_means : null;
  const contraryEvidence = nonBlank(row.contrary_evidence) ? row.contrary_evidence : null;
  return {
    id: row.id,
    status: row.status,
    problemFamily: row.problem_family,
    confidence: typeof row.confidence === 'number' ? row.confidence : 0,
    observation: row.observation ?? '',
    signals,
    problemHypothesis: row.problem_hypothesis ?? '',
    rootCauseHypotheses: asStringArray(row.root_cause_hypotheses),
    impactHypotheses: asStringArray(row.impact_hypotheses),
    whyNow: nonBlank(row.why_now) ? row.why_now : null,
    falsificationQuestions: asStringArray(row.falsification_questions),
    whatANoMeans,
    contraryEvidence,
    predictedBuyerLanguage: nonBlank(row.predicted_buyer_language) ? row.predicted_buyer_language : null,
    wouldProveWrong: [whatANoMeans, contraryEvidence].filter((v): v is string => v !== null),
  };
}

/** The persona's active hypothesis, else its newest, else the account's active one. */
async function pickHypothesis(prisma: any, personaId: number, accountName: string): Promise<any | null> {
  const own: any[] = await prisma.prospectingHypothesis.findMany({
    where: { primary_persona_id: personaId },
    select: HYPOTHESIS_SELECT,
    orderBy: { created_at: 'desc' },
  });
  const active = own.find((h) => h.status === 'active');
  if (active) return active;
  if (own.length > 0) return own[0];
  return prisma.prospectingHypothesis.findFirst({
    where: { account_name: accountName, status: 'active' },
    select: HYPOTHESIS_SELECT,
    orderBy: { created_at: 'desc' },
  });
}

export async function callBrief(prisma: any, personaId: number): Promise<CallBrief | null> {
  const persona: any | null = await prisma.persona.findUnique({
    where: { id: personaId },
    select: {
      id: true,
      persona_id: true,
      name: true,
      title: true,
      email: true,
      phone: true,
      role_in_deal: true,
      do_not_contact: true,
      account_name: true,
      account: { select: { name: true, hubspot_company_id: true, tier: true, vertical: true } },
    },
  });
  if (!persona) return null;

  const email = typeof persona.email === 'string' ? persona.email.trim().toLowerCase() : '';
  const hypothesisRow = await pickHypothesis(prisma, persona.id, persona.account_name);
  const hypothesis = hypothesisRow ? toBriefHypothesis(hypothesisRow) : null;

  const dispositionRows: any[] = await prisma.conversationDisposition.findMany({
    where: email ? { OR: [{ persona_id: persona.id }, { contact_email: email }] } : { persona_id: persona.id },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: LAST_DISPOSITIONS,
    select: { id: true, channel: true, response_class: true, buyer_language: true, human_confirmed: true, created_at: true },
  });
  const lastDispositions: BriefDisposition[] = dispositionRows.map((d) => ({
    id: d.id,
    channel: d.channel,
    responseClass: d.response_class,
    buyerLanguage: d.buyer_language ?? null,
    humanConfirmed: d.human_confirmed === true,
    createdAt: d.created_at instanceof Date ? d.created_at.toISOString() : String(d.created_at),
  }));

  let openBids: BriefBid[] = [];
  if (hypothesis) {
    const bidRows: any[] = await prisma.buyerInputData.findMany({
      where: { hypothesis_id: hypothesis.id },
      select: { id: true, type: true, raw_buyer_language: true, human_confirmed: true, supersedes_id: true, captured_at: true },
      orderBy: [{ captured_at: 'asc' }, { id: 'asc' }],
    });
    const superseded = supersededIds(bidRows.map((b) => ({ id: b.id, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id ?? null })));
    openBids = bidRows
      .filter((b) => b.human_confirmed !== true && !superseded.has(b.id))
      .map((b) => ({
        id: b.id,
        type: b.type,
        rawBuyerLanguage: b.raw_buyer_language,
        humanConfirmed: false,
        capturedAt: b.captured_at instanceof Date ? b.captured_at.toISOString() : null,
      }));
  }

  return {
    persona: {
      id: persona.id,
      personaKey: persona.persona_id ?? null,
      name: nonBlank(persona.name) ? persona.name : null,
      title: nonBlank(persona.title) ? persona.title : null,
      email: email || null,
      phone: nonBlank(persona.phone) ? persona.phone : null,
      role: nonBlank(persona.role_in_deal) ? persona.role_in_deal : null,
      doNotContact: persona.do_not_contact === true,
    },
    account: {
      name: persona.account?.name ?? persona.account_name,
      hubspotCompanyId: persona.account?.hubspot_company_id ?? null,
      tier: persona.account?.tier ?? null,
      vertical: persona.account?.vertical ?? null,
    },
    hypothesis,
    lastDispositions,
    openBids,
    suggestedQuestions: suggestedQuestionsFor(hypothesis),
  };
}
