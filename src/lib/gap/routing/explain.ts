/**
 * GAP routing explain builders (Sprint 2, S2-T6). Spec section 6 (explain object)
 * and section 10 (private intent never appears in explain text).
 *
 * Private inputs (account.intentScore, account.lastIntentAt,
 * persona.lastIntentSource, and any trigger whose title or category reveals
 * first-party behavior) may drive a rule. They never reach these strings.
 * `assertExplainClean` is the tripwire; `route.ts` calls it on every decision.
 */

import type { RoutingRule } from './rules';
import { ageDays, firstMatchingRule, hasUsablePhone } from './rules';
import type { RoutingExplain, RoutingInputs, RoutingSignalInput } from './types';

export interface ForbiddenExplainPattern {
  /** Readable name used in the thrown message. */
  label: string;
  pattern: RegExp;
}

/**
 * The COPY-SAFE private-intent floor (the pre-R2-13 anchored list). This is
 * what the compiler's C06 check runs over outbound copy, where "We
 * downloaded the 10-K" is ordinary language and an allowlisted last-step
 * link may legitimately point at yardflow.ai/. Every entry here is also in
 * FORBIDDEN_EXPLAIN_PATTERNS; only the routing list carries the wider
 * R2-13 phrasings.
 */
export const PRIVATE_INTENT_COPY_PATTERNS: readonly ForbiddenExplainPattern[] = [
  { label: 'intent score/signal/source/at', pattern: /\bintent(_|\s)?(score|signal|signals|source|at)\b/i },
  // R3-8: the bare word. The lookahead spells out what the word boundary
  // already excludes (intention, intentional, intently); "intent_score" has
  // no boundary after "intent" and is the first entry's job.
  { label: 'intent', pattern: /\bintent(?!ion|ly)\b/i },
  { label: 'buying intent', pattern: /\bbuying intent\b/i },
  { label: 'last_intent', pattern: /\blast_intent\b/i },
  { label: 'email_reply_verified', pattern: /\bemail_reply_verified\b/i },
  { label: 'hs_sales_email*', pattern: /\bhs_sales_email\w*/i },
  { label: '/demo/ path', pattern: /\/demo\//i },
  { label: '/for/ spear page path', pattern: /\/for\/[a-z0-9-]+/i },
  { label: 'microsite', pattern: /\bmicrosite\b/i },
  { label: 'visited site/page/demo/microsite', pattern: /\bvisited (our|the|your)?\s*(site|page|demo|microsite)\b/i },
  { label: 'viewed deck/page/demo/proposal', pattern: /\bviewed (our|the)\s*(deck|page|demo|proposal)\b/i },
  { label: 'opened email/deck/link/message', pattern: /\bopened (our|the|your)\s*(email|deck|link|message)\b/i },
  { label: 'tracking pixel', pattern: /\btracking pixel\b/i },
  { label: 'opens and clicks', pattern: /\bopen(s|ed)? and click(s|ed)?\b/i },
  // R3-8: "looked at our yard scorecard page", "checked out the ROI calculator",
  // "browsed our proof site". A "site" after "the" is a physical place in this
  // business ("looked at the Dayton site for a second dock"), so "site" only
  // counts after "our"; "website" counts after either.
  {
    label: 'looked at/checked out/browsed our|the ... page/site/scorecard/calculator',
    pattern:
      /\b(looked at|checked out|browsed) (?:(our|the)\b[^.!?\n]*\b(page|scorecard|calculator|website)\b|our\b[^.!?\n]*\bsite\b)/i,
  },
];

/**
 * Anchored, case-insensitive patterns that mark private first-party intent
 * in ROUTING EXPLAIN text: the copy-safe floor plus the wider R2-13
 * phrasings (click, download, engagement score, hot lead, own host, page
 * view, "viewed the", "opened it"). Ordinary language must route:
 * "intention", "intentional", "opened a new DC", "the plant opened in 2024"
 * and "for" inside a URL path are public facts. Not for outbound copy: C06
 * uses PRIVATE_INTENT_COPY_PATTERNS.
 */
export const FORBIDDEN_EXPLAIN_PATTERNS: readonly ForbiddenExplainPattern[] = [
  ...PRIVATE_INTENT_COPY_PATTERNS,
  { label: 'clicked the/a link', pattern: /\bclick(ed|s)?\s+(the|a|an|our|your|on)\b/i },
  { label: 'download(ed)', pattern: /\bdownload(ed|s)?\b/i },
  { label: 'engagement score', pattern: /\bengagement score\b/i },
  { label: 'hot lead', pattern: /\bhot lead(s)?\b/i },
  { label: 'page view', pattern: /\bpage ?views?\b/i },
  { label: 'yardflow.ai/ path', pattern: /\byardflow\.ai\//i },
  { label: 'viewed the', pattern: /\bviewed the\b/i },
  { label: 'opened it', pattern: /\bopened it\b/i },
];

const PRIVATE_CATEGORIES = new Set(['intent', 'website_behavior', 'first_party_intent']);

/**
 * Trigger sources that are first-party behavior by definition (R2-13). A
 * trigger from one of these is private however innocuous its title, so it
 * never reaches whyAccount, whyNow or signalIds. The four pounce producers
 * today (news, x, clawd, web) are public-news detectors and are not listed;
 * an intent-engine producer that starts writing `PounceTrigger` rows must
 * use one of these source names or be added here.
 */
export const PRIVATE_TRIGGER_SOURCES: ReadonlySet<string> = new Set([
  'intent',
  'intent_engine',
  'microsite',
  'first_party',
  'first_party_intent',
  'website_behavior',
]);

/** Returns the label of the first forbidden pattern found in `text`, or null. */
export function containsForbidden(text: string): string | null {
  for (const { label, pattern } of FORBIDDEN_EXPLAIN_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return null;
}

/** A trigger is public when neither its source, its categories nor its title reveal first-party behavior. */
export function isPublicTrigger(t: RoutingSignalInput): boolean {
  if (PRIVATE_TRIGGER_SOURCES.has(String(t.source ?? '').trim().toLowerCase())) return false;
  if (t.categories.some((c) => PRIVATE_CATEGORIES.has(c.toLowerCase()))) return false;
  return containsForbidden(t.title) == null;
}

function publicTriggersNewestFirst(i: RoutingInputs): RoutingSignalInput[] {
  return i.signals.freshTriggers
    .filter(isPublicTrigger)
    .slice()
    .sort((a, b) => b.firstSeenAt.getTime() - a.firstSeenAt.getTime());
}

function days(i: RoutingInputs, at: Date): string {
  return `${Math.max(0, Math.round(ageDays(i.now, at)))} d`;
}

function clip(text: string, max = 200): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max);
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildWhyAccount(i: RoutingInputs): string {
  const { tam, tamTier, heatTier, heat } = i.account;
  const head = `TAM ${tam}, tier ${tamTier || 'unrated'}, heat tier ${heatTier} (heat ${Math.round(heat)}).`;
  const [newest] = publicTriggersNewestFirst(i);
  if (!newest) return `${head} No fresh public triggers.`;
  return `${head} Newest public trigger: "${clip(newest.title, 160)}" (${days(i, newest.firstSeenAt)} ago).`;
}

export function buildWhyPerson(i: RoutingInputs): string {
  const p = i.persona;
  const parts = [
    `persona ${p.personaKey}`,
    `role gate ${p.roleGatePassed ? 'passed' : 'failed'}`,
    `seniority ${p.seniorityRank}`,
    `email ${p.emailValid ? 'valid' : 'invalid'}${p.emailStatus ? ` (${p.emailStatus})` : ''}`,
    `phone ${hasUsablePhone(i) ? 'usable' : p.phone ? `not usable (${p.phoneStatus ?? 'unknown'})` : 'none'}`,
  ];
  if (p.linkedinUrl) parts.push('LinkedIn present');
  if (p.top100) {
    parts.push(`top100 ${p.top100.eligibility}${p.top100.sequenceBlock ? ` (blocked: ${p.top100.sequenceBlock})` : ''}`);
  }
  return parts.join('; ') + '.';
}

export function buildWhyProblem(i: RoutingInputs): string {
  const h = i.hypothesis;
  if (!h) return 'No hypothesis on file.';
  return `Family ${h.family}. Observed: ${clip(h.observation)} Hypothesis: ${clip(h.problemHypothesis)}`;
}

export function buildWhyNow(i: RoutingInputs): string {
  const parts: string[] = [];
  const triggers = publicTriggersNewestFirst(i);
  if (triggers.length === 0) {
    parts.push('No fresh public triggers.');
  } else {
    parts.push(`Public signals: ${triggers.map((t) => `${t.id} (${days(i, t.firstSeenAt)})`).join(', ')}.`);
  }
  const h = i.hypothesis;
  if (h) {
    parts.push(
      h.evidenceFresh
        ? `Evidence fresh (within ${i.freshness.evidenceMaxAgeDays} d).`
        : `Evidence older than ${i.freshness.evidenceMaxAgeDays} d.`,
    );
    if (h.expiresAt) {
      parts.push(
        h.expiresAt.getTime() <= i.now.getTime()
          ? `Hypothesis expired ${isoDay(h.expiresAt)}.`
          : `Hypothesis expires ${isoDay(h.expiresAt)}.`,
      );
    }
    if (h.whyNow && containsForbidden(h.whyNow) == null) parts.push(clip(h.whyNow, 160));
  }
  const d = i.comms.lastDisposition;
  if (d) parts.push(`Last disposition ${d.responseClass} ${days(i, d.at)} ago.`);
  return parts.join(' ');
}

function describeOutcome(rule: RoutingRule): string {
  return rule.skip ? `skip (${rule.skip})` : rule.action ?? 'unknown';
}

/**
 * The rule id, the predicate that fired, and the counterfactual: what the same
 * inputs route to with the last disposition cleared.
 */
export function buildWhyAction(i: RoutingInputs, rule: RoutingRule, rules?: RoutingRule[]): string {
  const cleared: RoutingInputs = { ...i, comms: { ...i.comms, lastDisposition: null } };
  const counterfactual = firstMatchingRule(cleared, rules);
  const tail =
    counterfactual.id === rule.id
      ? 'a different disposition would not change this'
      : `a different disposition would change this to ${describeOutcome(counterfactual)} (${counterfactual.label} ${counterfactual.id})`;
  return `${rule.label} ${rule.id}: ${rule.predicate(i)}; ${tail}.`;
}

export function buildSignalIds(i: RoutingInputs): string[] {
  const ids = new Set<string>(i.hypothesis?.signalIds ?? []);
  for (const t of publicTriggersNewestFirst(i)) ids.add(t.id);
  return [...ids];
}

export function buildWouldProveWrong(i: RoutingInputs): string {
  const h = i.hypothesis;
  return h?.whatANoMeans ?? h?.falsificationQuestions[0] ?? 'no falsification recorded';
}

export function buildExplain(i: RoutingInputs, rule: RoutingRule, rules?: RoutingRule[]): RoutingExplain {
  return {
    whyAccount: buildWhyAccount(i),
    whyPerson: buildWhyPerson(i),
    whyProblem: buildWhyProblem(i),
    whyNow: buildWhyNow(i),
    whyAction: buildWhyAction(i, rule, rules),
    evidenceIds: [...(i.hypothesis?.evidenceIds ?? [])],
    signalIds: buildSignalIds(i),
    wouldProveWrong: buildWouldProveWrong(i),
  };
}

/** Stable marker at the head of every explain-leak message; `ExplainLeakError.name` carries the same word. */
export const EXPLAIN_LEAK_MARKER = 'explain_leak';

/**
 * The tripwire's error. Carries the offending field and pattern label so the
 * run can count `explain_leak:<field>` and continue (R2-3) without matching
 * on message text. Any other error out of the router is not this class.
 */
export class ExplainLeakError extends Error {
  readonly name = 'ExplainLeakError';
  constructor(
    readonly field: keyof RoutingExplain,
    readonly label: string,
  ) {
    super(`${EXPLAIN_LEAK_MARKER}: explain.${field} leaks private intent (${label}); private intent never leaves the router`);
  }
}

export function isExplainLeakError(err: unknown): err is ExplainLeakError {
  return err instanceof ExplainLeakError || (err instanceof Error && err.name === 'ExplainLeakError');
}

/** Throws `ExplainLeakError` naming the offending field and token when any explain field carries private intent. */
export function assertExplainClean(explain: RoutingExplain): void {
  for (const [field, value] of Object.entries(explain)) {
    const text = Array.isArray(value) ? value.join('\n') : String(value ?? '');
    const label = containsForbidden(text);
    if (label) throw new ExplainLeakError(field as keyof RoutingExplain, label);
  }
}
