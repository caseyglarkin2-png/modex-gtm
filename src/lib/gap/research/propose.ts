/**
 * PROPOSE UPDATED HYPOTHESIS from a research run (last mile, 2026-09-25).
 *
 * Machine work after RESEARCH THIS found evidence (the cockpit calls it on its
 * own; since the debt burn, 2026-09-26, it is not a Casey click). Creates a DRAFT through
 * the existing proposeHypothesis (the same guards: every observation sentence
 * cites a linked signal, every signal belongs to the account). It never
 * submits, approves or activates: Casey reviews it like any draft.
 *
 * The observation is built only from FRESH verified facts that are a single
 * sentence, quoted verbatim with the source and date: a fact, never an
 * inference. The narrative (problem hypothesis, root causes, impacts,
 * falsification) is carried from the card's current hypothesis when there is
 * one, else a short hedged default for Casey to edit. Idempotent per run
 * (source_ref research:<runId>).
 *
 * Group research (2026-09-26): with `personaIds`, ONE run proposes the same
 * draft for every person in the group (each its own row, source_ref
 * research:<runId>:p<personaId>; the run's own person keeps research:<runId>),
 * so the drafts form one sibling thesis and Casey decides once in REVIEW.
 * A person who does not belong to the run's account is skipped, never proposed.
 */
import { proposeHypothesis } from '../hypothesis/service';
import { GATE_SIGNAL_SELECT, outreachFactRefusal, type GateSignal } from './evidence-gate';
/**
 * Quote a verbatim excerpt as ONE cited observation sentence. An internal
 * period followed by a space (e.g. "The Kroger Co. (the Company)") would be a
 * sentence break to the observation validator, leaving an uncited fragment;
 * a citation token placed right after each such period keeps the quote's
 * words intact (the renderer strips the tokens) and every fragment cited.
 */
export function citedQuote(title: string, excerpt: string, signalId: string, accountName?: string | null): string {
  const token = `[S:${signalId}]`;
  const quote = excerpt.trim().replace(/[.!?]+$/, '').replace(/([.!?])(\s)/g, `$1${token}$2`);
  return `${sourceLabel(title, accountName)}: "${quote}" ${token}.`;
}

const FILING_FORM = /\b(10-Q|10-K|8-K|20-F|6-K|S-1|S-4|DEF 14A)\b/;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CORPORATE_SUFFIX = /[\s,]+(co|corp|corporation|inc|incorporated|company|ltd|llc|plc|l\.?p)\.?$/i;

function issuerName(raw: string): string {
  const name = raw.trim().replace(CORPORATE_SUFFIX, '').replace(CORPORATE_SUFFIX, '').trim();
  // EDGAR shouts company names ("KROGER CO"); a person would write "Kroger".
  return name === name.toUpperCase() ? name.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()) : name;
}

/**
 * Release C review SF4: an EDGAR-style title ("KROGER CO 10-Q (filed
 * 2026-09-18)") reads like a scraper. A filing is named the way a person
 * would say it, "From Kroger's 10-Q filed September 18"; any other title is
 * kept as it is.
 */
export function sourceLabel(title: string, accountName?: string | null): string {
  const t = title.trim();
  const form = FILING_FORM.exec(t);
  if (!form) return t;
  const issuer = (accountName ?? '').trim() || issuerName(t.slice(0, form.index));
  const possessive = /['’]s$/i.test(issuer) ? issuer : `${issuer}${/s$/i.test(issuer) ? "'" : "'s"}`;
  const owner = issuer ? `${possessive} ` : 'the ';
  const date = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
  const month = date ? MONTHS[Number(date[2]) - 1] : undefined;
  const when = date && month ? ` filed ${month} ${Number(date[3])}` : '';
  return `From ${owner}${form[1]}${when}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/**
 * The narrative every draft of this proposal carries, returned so Casey reads
 * exactly what he is approving (debt burn, 2026-09-26: the proposal is shown
 * inline and decided with one APPROVE + USE, never a second trip to REVIEW).
 */
export interface ProposedNarrative {
  observation: string;
  problemHypothesis: string;
  rootCauses: string[];
  impacts: string[];
  wouldProveWrong: string[];
  whatANoMeans: string | null;
  evidence: Array<{ signalId: string; title: string; excerpt: string; observedAt: string }>;
}

export type ProposeFromResearchResult =
  | { ok: true; hypothesisId: string; existing: boolean; hypothesisIds: string[]; skipped?: number[]; narrative: ProposedNarrative }
  | { ok: false; reason: 'run_not_found' | 'no_fresh_evidence' | 'conflicting_evidence' | string };

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export async function proposeFromResearch(prisma: PrismaLike, input: { researchRunId: string; actor: string; now: Date; personaIds?: number[] }): Promise<ProposeFromResearchResult> {
  const run = await prisma.researchRun.findUnique({ where: { id: input.researchRunId }, select: { id: true, account_name: true, persona_id: true, provider_status: true } });
  if (!run) return { ok: false, reason: 'run_not_found' };
  const status = (run.provider_status ?? {}) as { outcome?: string; hypothesisId?: string | null; problemFamily?: string | null };
  if (status.outcome === 'conflicting_evidence') return { ok: false, reason: 'conflicting_evidence' };

  const records: Array<{ id: string }> = await prisma.evidenceRecord.findMany({ where: { research_run_id: run.id }, select: { id: true } });
  const signals: Array<GateSignal & { id: string; title: string; evidence_text: string | null; observed_at: Date; freshness_expires_at: Date | null }> = records.length
    ? await prisma.prospectingSignal.findMany({
        where: { source_kind: 'evidence_record', source_id: { in: records.map((r) => r.id) }, account_name: run.account_name },
        select: { ...GATE_SIGNAL_SELECT, title: true, freshness_expires_at: true },
        orderBy: { observed_at: 'desc' },
      })
    : [];
  const fresh = signals.filter((s) => !s.freshness_expires_at || s.freshness_expires_at.getTime() > input.now.getTime());
  if (fresh.length === 0) return { ok: false, reason: 'no_fresh_evidence' };
  // Red team T6/T7: the observation is built only from evidence that passes
  // the SAME gate approval applies. A verified quote that states no network
  // change (a risk factor, a liquidity paragraph) is not a fact to open with.
  const quotable = fresh.filter((s) => outreachFactRefusal(s, run.account_name) === null).slice(0, 2);
  if (quotable.length === 0) return { ok: false, reason: 'no_outreach_fact' };

  const base = status.hypothesisId
    ? await prisma.prospectingHypothesis.findUnique({ where: { id: status.hypothesisId } })
    : null;
  // One fact opens the first touch (red team T6/T7); a second outreach fact
  // stays linked as supporting evidence, never a second quote in the email.
  const observation = citedQuote(quotable[0].title, quotable[0].evidence_text!, quotable[0].id, run.account_name);
  const problemHypothesis =
    base?.problem_hypothesis ??
    'My guess is that the network change above moves load onto the physical handoffs that remain, and that is where production capacity is won or lost.';
  const falsificationQuestions = asList(base?.falsification_questions).length
    ? asList(base?.falsification_questions)
    : ['Did the change above add trailer volume or dwell at the sites that remain?'];
  const narrative: ProposedNarrative = {
    observation,
    problemHypothesis,
    rootCauses: asList(base?.root_cause_hypotheses),
    impacts: asList(base?.impact_hypotheses),
    wouldProveWrong: falsificationQuestions,
    whatANoMeans: base?.what_a_no_means ?? null,
    evidence: quotable.map((s) => ({ signalId: s.id, title: s.title, excerpt: s.evidence_text!, observedAt: s.observed_at.toISOString() })),
  };

  const proposeFor = async (personaId: number | null, sourceRef: string): Promise<{ ok: true; id: string; existing: boolean } | { ok: false; reason: string }> => {
    const r = await proposeHypothesis(prisma, {
      accountName: run.account_name,
      primaryPersonaId: personaId,
      persona: base?.persona ?? 'supply_chain',
      problemFamily: base?.problem_family ?? status.problemFamily ?? 'hidden_capacity',
      observation,
      problemHypothesis,
      rootCauseHypotheses: narrative.rootCauses,
      impactHypotheses: narrative.impacts,
      // Red team T7: no auto "why now = source age" sentence and no auto
      // confidence number. Why now is Casey's to write; confidence is unscored (0).
      whyNow: null,
      falsificationQuestions,
      whatANoMeans: narrative.whatANoMeans,
      confidence: 0,
      signalIds: quotable.map((s) => s.id),
      primarySignalId: quotable[0].id,
      sourceRef,
      metadata: { proposedFrom: 'research_this', researchRunId: run.id, basedOn: base?.id ?? null },
      createdBy: input.actor,
    });
    if (r.ok) return { ok: true, id: r.id, existing: false };
    if (r.reason === 'duplicate_source_ref' && r.existingId) return { ok: true, id: r.existingId, existing: true };
    return { ok: false, reason: r.reason };
  };

  const group = [...new Set(input.personaIds ?? [])];
  if (group.length === 0) {
    const persona = run.persona_id ? await prisma.persona.findUnique({ where: { id: run.persona_id }, select: { id: true } }) : null;
    const r = await proposeFor(persona?.id ?? null, `research:${run.id}`);
    return r.ok ? { ok: true, hypothesisId: r.id, existing: r.existing, hypothesisIds: [r.id], narrative } : { ok: false, reason: r.reason };
  }

  const ids: string[] = [];
  const skipped: number[] = [];
  let allExisting = true;
  for (const pid of group) {
    const persona: { id: number; account_name: string | null } | null = await prisma.persona.findUnique({ where: { id: pid }, select: { id: true, account_name: true } });
    if (!persona || persona.account_name !== run.account_name) {
      skipped.push(pid);
      continue;
    }
    const r = await proposeFor(persona.id, pid === run.persona_id ? `research:${run.id}` : `research:${run.id}:p${pid}`);
    if (!r.ok) return { ok: false, reason: r.reason };
    ids.push(r.id);
    allExisting &&= r.existing;
  }
  if (ids.length === 0) return { ok: false, reason: 'no_person_in_account' };
  return { ok: true, hypothesisId: ids[0], existing: allExisting, hypothesisIds: ids, skipped, narrative };
}
