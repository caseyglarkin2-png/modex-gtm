/**
 * Hypothesis candidate builder (GAP Prospecting OS, Sprint 1, S1-T6).
 *
 * Pure. Takes an account's registered signals and personas and returns draft
 * hypothesis candidates, one per (persona, problem family), plus a ledger of
 * everything it declined to build and why. No I/O, no clock (the caller passes
 * `now`), deterministic given its inputs and independent of input order.
 *
 * The observation is assembled from signal TITLES VERBATIM plus `[S:<id>]`
 * citation tokens, never paraphrased, so a token-subset test can prove every
 * word in it came from a cited signal. The problem hypothesis is a hedged
 * template per family that embeds the catalog problem text.
 *
 * Voice: no em dashes, "yards" plural, "production capacity" never
 * "throughput", no product names, no private intent vocabulary.
 */

import {
  HEDGE_TOKENS,
  PROBLEM_FAMILIES,
  PROBLEM_FAMILY_CATALOG,
  POUNCE_THEME_TO_FAMILY,
  classifyFamilies,
  type Persona,
  type PounceTheme,
  type ProblemFamily,
} from '../taxonomy';
import { expiresAtFor, type LinkedSignal } from './machine';
import { validateObservation } from './observation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A registered ProspectingSignal row, already in the store. */
export interface BuildSignal {
  id: string;
  type: string;
  title: string;
  summary?: string | null;
  evidenceUrl?: string | null;
  evidenceText?: string | null;
  observedAt: Date;
  confidence: number;
  freshnessExpiresAt?: Date | null;
  externalOk?: boolean | null;
  pounceCategories?: string[];
}

export interface BuildPersona {
  id: number;
  personaKey: Persona;
  name: string;
  title?: string | null;
  doNotContact: boolean;
  /** False when the address on file is malformed or bounced: no candidate, since nothing could be sent. */
  emailValid: boolean;
}

export interface BuildInput {
  accountName: string;
  personas: BuildPersona[];
  signals: BuildSignal[];
  now: Date;
  /** Families per persona, ranked by total signal confidence. Default 2. */
  maxCandidatesPerPersona?: number;
}

export const BUILDER_ID = 'gap-builder-v1' as const;

export interface BuildCandidate {
  accountName: string;
  personaId: number;
  persona: Persona;
  problemFamily: ProblemFamily;
  secondaryFamilies: ProblemFamily[];
  observation: string;
  problemHypothesis: string;
  rootCauseHypotheses: string[];
  impactHypotheses: string[];
  whyNow: string;
  falsificationQuestions: string[];
  whatANoMeans: string;
  signalIds: string[];
  primarySignalId: string;
  confidence: number;
  expiresAt: Date;
  provenance: { builder: typeof BUILDER_ID; familyHits: Record<string, number> };
}

export type BuildSkipReason =
  | 'signal_untitled'
  | 'signal_expired'
  | 'unmapped_signal'
  | 'first_party_omitted_from_observation'
  | 'title_omitted_forbidden_language'
  | 'persona_suppressed'
  | 'persona_email_invalid'
  | 'persona_not_relevant'
  | 'persona_family_capped'
  | 'no_citable_signal'
  | 'observation_invalid';

export interface BuildSkip {
  personaId?: number;
  signalId?: string;
  reason: BuildSkipReason;
}

export interface BuildResult {
  candidates: BuildCandidate[];
  skipped: BuildSkip[];
}

// ---------------------------------------------------------------------------
// Data tables
// ---------------------------------------------------------------------------

/** Which personas a family is relevant to. A persona outside the list is skipped for that family. */
export const FAMILY_PERSONAS: Record<ProblemFamily, Persona[]> = {
  network_standardization: ['executive_ops', 'supply_chain', 'technology', 'distribution'],
  hidden_capacity: ['executive_ops', 'site_ops', 'distribution', 'supply_chain'],
  yard_state_integrity: ['site_ops', 'distribution', 'technology', 'automation'],
  driver_gate_scale: ['site_ops', 'transportation', 'security', 'distribution'],
  automation_readiness: ['automation', 'technology', 'site_ops', 'executive_ops'],
  cost_to_ship: ['transportation', 'finance_procurement', 'supply_chain', 'executive_ops'],
  chain_of_custody: ['security', 'finance_procurement', 'distribution', 'site_ops'],
};

/** Catalog problem text as a clause: lowercase lead, no terminal period. */
function problemClause(family: ProblemFamily): string {
  const problem = PROBLEM_FAMILY_CATALOG[family].problem.trim().replace(/[.!?]+$/, '');
  return problem.charAt(0).toLowerCase() + problem.slice(1);
}

/**
 * Hedged problem-hypothesis template per family. Every template must contain a
 * HEDGE_TOKEN; the builder asserts this so a template edit cannot ship unhedged.
 */
export const PROBLEM_TEMPLATES: Record<ProblemFamily, (accountName: string) => string> = {
  network_standardization: (account) =>
    `My guess is that ${problemClause('network_standardization')} is what ${account} is carrying into this next phase, and the signals above are where that variation surfaces first.`,
  hidden_capacity: (account) =>
    `My guess is that ${problemClause('hidden_capacity')} at ${account}, and the signals above are where that pressure shows first.`,
  yard_state_integrity: (account) =>
    `I suspect ${problemClause('yard_state_integrity')} at ${account}, and the signals above are where that shows up first.`,
  driver_gate_scale: (account) =>
    `My guess is that ${problemClause('driver_gate_scale')} at ${account}, and the signals above are where that strain shows first.`,
  automation_readiness: (account) =>
    `I suspect ${problemClause('automation_readiness')} at ${account}, and the signals above are where that mismatch surfaces first.`,
  cost_to_ship: (account) =>
    `My guess is that ${problemClause('cost_to_ship')} at ${account}, and the signals above are where that cost shows first.`,
  chain_of_custody: (account) =>
    `I suspect ${problemClause('chain_of_custody')} at ${account}, and the signals above are where that gap surfaces first.`,
};

/** Two diagnostics per family that a buyer can answer with a number or a plain yes or no. */
export const FALSIFICATION_QUESTIONS: Record<ProblemFamily, [string, string]> = {
  network_standardization: [
    'How many distinct gate and dock procedures are running across your facilities today, and who could list them?',
    'When you compare turn time between two of your sites, are the events measured the same way at both?',
  ],
  hidden_capacity: [
    'How many trailers are waiting at the gate at your busiest hour, and who knows that number today?',
    'When a trailer runs late to a dock, does that reach the plant as a system event or a phone call?',
  ],
  yard_state_integrity: [
    'How many times per shift does someone walk or drive the yards to find a trailer the system says is somewhere else?',
    'How old is the last recorded position of a trailer, on average, when a spotter goes to move it?',
  ],
  driver_gate_scale: [
    'How many minutes does a driver spend at the guard shack before the first move happens, and how much does that vary between shifts?',
    'How many people per site touch a driver check-in before the trailer is released to a door?',
  ],
  automation_readiness: [
    'How many exceptions per shift does your automation pilot hand back to a person, and are they logged anywhere?',
    'How many of your sites could run the same automated move tomorrow without a local rule change?',
  ],
  cost_to_ship: [
    'What did you pay in detention and accessorials last quarter, and which facilities generated it?',
    'How many hours after a load closes do you learn the dwell that caused the charge?',
  ],
  chain_of_custody: [
    'How many claims or disputes last year could not be settled because the visit could not be reconstructed?',
    'How long does it take to produce the seal, load and timestamp record for one trailer visit from six weeks ago?',
  ],
};

/** What a plain no from the buyer disqualifies, per family. */
export const WHAT_A_NO_MEANS: Record<ProblemFamily, string> = {
  network_standardization:
    'If gate and dock procedures are already one documented standard across facilities, this family is closed for this account and we should look at hidden capacity instead.',
  hidden_capacity:
    'If gate and dock handoffs are already measured and slack, this family is closed for this account and we should look at yard state integrity instead.',
  yard_state_integrity:
    'If trailer position is trusted continuously without yard checks, this family is closed for this account and we should look at driver and gate scale instead.',
  driver_gate_scale:
    'If driver check-in is already consistent and unstaffed across shifts, this family is closed for this account and we should look at hidden capacity instead.',
  automation_readiness:
    'If the automation program already runs on one deterministic process with logged exceptions, this family is closed for this account and we should look at yard state integrity instead.',
  cost_to_ship:
    'If detention and accessorials are already traced to the facility that caused them, this family is closed for this account and we should look at hidden capacity instead.',
  chain_of_custody:
    'If any trailer visit can be reconstructed on demand from system records, this family is closed for this account and we should look at driver and gate scale instead.',
};

/**
 * Vocabulary that must never appear in generated text: product names, private
 * intent words, the retired term. Signal titles that carry it are kept as
 * support for classification but omitted from the observation and whyNow.
 */
const EM_DASH = String.fromCharCode(0x2014);
export const FORBIDDEN_TEXT = new RegExp(
  ['intent', '/demo', '/for\\b', 'visited', 'viewed', 'yardflow', 'flowyms', 'freightroll', 'throughput', EM_DASH].join('|'),
  'i',
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const OBSERVATION_MAX_SIGNALS = 3;
const TITLE_CLIP = 160;
const DEFAULT_MAX_PER_PERSONA = 2;

/** Collapse whitespace so a title is one line. */
function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim();
}

/**
 * Clip a title to `max` characters on a word boundary with no ellipsis, so
 * every remaining word is still a verbatim word of the title.
 */
function clip(title: string, max: number): string {
  if (title.length <= max) return title;
  const head = title.slice(0, max);
  const cut = head.lastIndexOf(' ');
  return (cut > 0 ? head.slice(0, cut) : head).trim();
}

/**
 * A title as one observation sentence. Sentence terminators inside the title
 * (`Inc. expands`) would split the observation and leave a fragment uncited,
 * so terminators followed by whitespace or end of text are removed. Words are
 * untouched, only punctuation; the token-subset property still holds.
 */
function sentenceSafe(title: string): string {
  return title.replace(/[.!?]+(?=\s|$)/g, '').replace(/\s+/g, ' ').trim();
}

function daysBetween(later: Date, earlier: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / DAY_MS));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isExpired(signal: BuildSignal, now: Date): boolean {
  return (
    signal.freshnessExpiresAt instanceof Date &&
    signal.freshnessExpiresAt.getTime() <= now.getTime()
  );
}

function isHedged(text: string): boolean {
  const lower = text.toLowerCase();
  return HEDGE_TOKENS.some((token) => lower.includes(token));
}

/** Highest confidence first, then newest, then id, so grouping is order-independent. */
function bySignalRank(a: BuildSignal, b: BuildSignal): number {
  return (
    b.confidence - a.confidence ||
    b.observedAt.getTime() - a.observedAt.getTime() ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

interface ClassifiedSignal {
  signal: BuildSignal;
  title: string;
  family: ProblemFamily;
  /** True when the title may appear in generated text. */
  citable: boolean;
  hits: Partial<Record<ProblemFamily, number>>;
}

function familyFromPounce(signal: BuildSignal): ProblemFamily | null {
  const theme = signal.pounceCategories?.[0];
  if (!theme) return null;
  if (!(theme in POUNCE_THEME_TO_FAMILY)) return null;
  return POUNCE_THEME_TO_FAMILY[theme as PounceTheme];
}

function classifySignal(signal: BuildSignal): ClassifiedSignal | null {
  const title = normalizeTitle(signal.title);
  const pounce = familyFromPounce(signal);
  if (pounce) {
    return { signal, title, family: pounce, citable: true, hits: { [pounce]: 1 } };
  }
  const text = `${title} ${signal.summary ?? ''} ${signal.evidenceText ?? ''}`;
  const classification = classifyFamilies(text);
  if (classification.primary === 'unmapped') return null;
  const hits: Partial<Record<ProblemFamily, number>> = {};
  for (const family of PROBLEM_FAMILIES) {
    if (classification.hits[family] > 0) hits[family] = classification.hits[family];
  }
  return { signal, title, family: classification.primary, citable: true, hits };
}

interface FamilyGroup {
  family: ProblemFamily;
  /** All supporting signals, ranked. */
  members: ClassifiedSignal[];
  /** Members whose titles may appear in generated text, ranked. */
  citable: ClassifiedSignal[];
  totalConfidence: number;
  newestObservedAt: number;
}

function byGroupRank(a: FamilyGroup, b: FamilyGroup): number {
  return (
    b.totalConfidence - a.totalConfidence ||
    b.newestObservedAt - a.newestObservedAt ||
    PROBLEM_FAMILIES.indexOf(a.family) - PROBLEM_FAMILIES.indexOf(b.family)
  );
}

function aggregateHits(members: ClassifiedSignal[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const member of members) {
    for (const [family, count] of Object.entries(member.hits)) {
      if (typeof count === 'number' && count > 0) totals[family] = (totals[family] ?? 0) + count;
    }
  }
  return totals;
}

function secondaryFamilies(primary: ProblemFamily, hits: Record<string, number>): ProblemFamily[] {
  return PROBLEM_FAMILIES.filter((family) => family !== primary && (hits[family] ?? 0) > 0).sort(
    (a, b) => (hits[b] ?? 0) - (hits[a] ?? 0) || PROBLEM_FAMILIES.indexOf(a) - PROBLEM_FAMILIES.indexOf(b),
  );
}

function buildObservation(citable: ClassifiedSignal[]): string {
  return citable
    .slice(0, OBSERVATION_MAX_SIGNALS)
    .map((member) => `${sentenceSafe(clip(member.title, TITLE_CLIP))} [S:${member.signal.id}].`)
    .join(' ');
}

function buildWhyNow(citable: ClassifiedSignal[], now: Date): string {
  const ages = citable.map((member) => daysBetween(now, member.signal.observedAt));
  const newest = Math.min(...ages);
  const oldest = Math.max(...ages);
  const window = newest === oldest ? `${newest} days ago` : `${newest} to ${oldest} days ago`;
  const titles = citable.map((member) => member.title).join('; ');
  return `Signals observed ${window}: ${titles}`;
}

function scoreConfidence(members: ClassifiedSignal[]): number {
  const avg = members.reduce((sum, member) => sum + member.signal.confidence, 0) / members.length;
  const bonus = members.length >= 2 ? 5 : 0;
  return clamp(30 + Math.round(avg / 5) + bonus, 30, 50);
}

function toLinkedSignals(members: ClassifiedSignal[]): LinkedSignal[] {
  return members.map((member) => ({
    id: member.signal.id,
    hasEvidence: Boolean(member.signal.evidenceUrl || member.signal.evidenceText),
    expiresAt: member.signal.freshnessExpiresAt ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildCandidates(input: BuildInput): BuildResult {
  const { accountName, now } = input;
  const maxPerPersona = Math.max(0, input.maxCandidatesPerPersona ?? DEFAULT_MAX_PER_PERSONA);
  const skipped: BuildSkip[] = [];
  const candidates: BuildCandidate[] = [];

  // 1 and 2: signal hygiene and classification, in a stable order.
  const classified: ClassifiedSignal[] = [];
  for (const signal of [...input.signals].sort(bySignalRank)) {
    if (normalizeTitle(signal.title).length === 0) {
      skipped.push({ signalId: signal.id, reason: 'signal_untitled' });
      continue;
    }
    if (isExpired(signal, now)) {
      skipped.push({ signalId: signal.id, reason: 'signal_expired' });
      continue;
    }
    const entry = classifySignal(signal);
    if (!entry) {
      skipped.push({ signalId: signal.id, reason: 'unmapped_signal' });
      continue;
    }
    if (signal.externalOk === false) {
      entry.citable = false;
      skipped.push({ signalId: signal.id, reason: 'first_party_omitted_from_observation' });
    } else if (FORBIDDEN_TEXT.test(entry.title)) {
      entry.citable = false;
      skipped.push({ signalId: signal.id, reason: 'title_omitted_forbidden_language' });
    }
    classified.push(entry);
  }

  // 3: group by family.
  const groups = new Map<ProblemFamily, FamilyGroup>();
  for (const entry of classified) {
    const group = groups.get(entry.family) ?? {
      family: entry.family,
      members: [],
      citable: [],
      totalConfidence: 0,
      newestObservedAt: Number.NEGATIVE_INFINITY,
    };
    group.members.push(entry);
    if (entry.citable) group.citable.push(entry);
    group.totalConfidence += entry.signal.confidence;
    group.newestObservedAt = Math.max(group.newestObservedAt, entry.signal.observedAt.getTime());
    groups.set(entry.family, group);
  }
  const rankedGroups = [...groups.values()].sort(byGroupRank);

  // 3 and 4: one candidate per persona per relevant family, capped.
  const personas = [...input.personas].sort((a, b) => a.id - b.id);
  for (const persona of personas) {
    if (persona.doNotContact) {
      skipped.push({ personaId: persona.id, reason: 'persona_suppressed' });
      continue;
    }
    if (!persona.emailValid) {
      skipped.push({ personaId: persona.id, reason: 'persona_email_invalid' });
      continue;
    }

    const relevant: FamilyGroup[] = [];
    for (const group of rankedGroups) {
      if (!FAMILY_PERSONAS[group.family].includes(persona.personaKey)) {
        skipped.push({ personaId: persona.id, reason: 'persona_not_relevant' });
        continue;
      }
      if (group.citable.length === 0) {
        skipped.push({ personaId: persona.id, signalId: group.members[0].signal.id, reason: 'no_citable_signal' });
        continue;
      }
      relevant.push(group);
    }

    relevant.slice(maxPerPersona).forEach(() => {
      skipped.push({ personaId: persona.id, reason: 'persona_family_capped' });
    });

    for (const group of relevant.slice(0, maxPerPersona)) {
      const signalIds = group.members.map((member) => member.signal.id);

      // 5: observation from verbatim titles, validated against the linked ids.
      const observation = buildObservation(group.citable);
      const validation = validateObservation(observation, signalIds);
      if (!validation.ok) {
        skipped.push({ personaId: persona.id, signalId: group.citable[0].signal.id, reason: 'observation_invalid' });
        continue;
      }

      // 6: hedged hypothesis and the family tables.
      const problemHypothesis = PROBLEM_TEMPLATES[group.family](accountName);
      if (!isHedged(problemHypothesis)) {
        throw new Error(`gap-builder: unhedged template for family ${group.family}`);
      }
      const catalog = PROBLEM_FAMILY_CATALOG[group.family];
      const familyHits = aggregateHits(group.members);

      // 7: score and expiry.
      candidates.push({
        accountName,
        personaId: persona.id,
        persona: persona.personaKey,
        problemFamily: group.family,
        secondaryFamilies: secondaryFamilies(group.family, familyHits),
        observation,
        problemHypothesis,
        rootCauseHypotheses: catalog.likelyCauses.slice(0, 3),
        impactHypotheses: catalog.impacts.slice(0, 3),
        whyNow: buildWhyNow(group.citable, now),
        falsificationQuestions: [...FALSIFICATION_QUESTIONS[group.family]],
        whatANoMeans: WHAT_A_NO_MEANS[group.family],
        signalIds,
        primarySignalId: group.citable[0].signal.id,
        confidence: scoreConfidence(group.members),
        expiresAt: expiresAtFor(toLinkedSignals(group.members), now),
        provenance: { builder: BUILDER_ID, familyHits },
      });
    }
  }

  return { candidates, skipped };
}
