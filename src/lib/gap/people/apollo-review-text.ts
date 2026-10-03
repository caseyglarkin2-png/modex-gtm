/**
 * Client-safe helpers for the cross-account Apollo review (labels, request text, filters). Types only from the
 * projection: this module must never import the server loader (it is bundled into the client table).
 */
import type { ApolloCandidate, ApolloCandidateKind } from './apollo-candidates';

export const MAX_REVIEW_ACCOUNTS = 10;
export const KIND_LABEL: Record<ApolloCandidateKind, string> = { FIND_OWNER: 'Find owner', FIND_EMAIL: 'Find email', CONFIRM_TITLE: 'Confirm title' };

/** One request, as Casey would hand it to Apollo (or decide against it). */
export function apolloRequestText(c: ApolloCandidate): string {
  return [
    `[${KIND_LABEL[c.kind].toUpperCase()}] ${c.account}: ${c.target}`,
    `Missing: ${c.missing}`,
    `Why it matters: ${c.whyItMatters}`,
    `Could change: ${c.decision}`,
    `Possible match: ${c.possibleMatch ?? 'none on record'}`,
    `GAP checked: ${c.checkedFirst.join(', ')}`,
    `Credit cost: unknown until run`,
  ].join('\n');
}

export function apolloBatchText(cs: readonly ApolloCandidate[]): string {
  return `${cs.length} Apollo lookup${cs.length === 1 ? '' : 's'} for Casey to decide (GAP spent nothing):\n\n${cs.map(apolloRequestText).join('\n\n')}`;
}

export function filterCandidates(cs: readonly ApolloCandidate[], f: { account?: string; kind?: string; decision?: string }): ApolloCandidate[] {
  return cs.filter((c) => (!f.account || c.account === f.account) && (!f.kind || c.kind === f.kind) && (!f.decision || c.decision.toLowerCase().includes(f.decision.toLowerCase())));
}

