/**
 * CROSS-ACCOUNT APOLLO REVIEW (Casey, 2026-10-03): which Apollo lookups are worth Casey's credits, across accounts.
 * A thin reader over the per-account projection (apolloCandidates): no new candidate authority, no storage, no Apollo
 * call. Casey picks the accounts (nothing is evaluated by opening the page), filters, and copies requests to run by hand.
 */
import { loadAccountView } from '../account-intel/load';
import { apolloCandidates, type ApolloCandidate, type ApolloCandidateKind } from './apollo-candidates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const MAX_REVIEW_ACCOUNTS = 10;
export const KIND_LABEL: Record<ApolloCandidateKind, string> = { FIND_OWNER: 'Find owner', FIND_EMAIL: 'Find email', CONFIRM_TITLE: 'Confirm title' };

export interface ApolloReview {
  rows: ApolloCandidate[];
  /** Accounts with nothing to propose, and why (a staged candidate, a prior Apollo result, HubSpot unread, nothing needed). */
  notes: Array<{ account: string; note: string }>;
  /** Accounts that could not be read (never silently dropped). */
  failed: string[];
}

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

/** Evaluate the chosen accounts (at most 10, three at a time) with the SAME loader and projection the account page uses. */
export async function reviewApolloCandidates(prisma: PrismaLike, slugs: readonly string[], now: Date, deps: { load?: typeof loadAccountView; project?: typeof apolloCandidates } = {}): Promise<ApolloReview> {
  const load = deps.load ?? loadAccountView;
  const project = deps.project ?? apolloCandidates;
  const chosen = [...new Set(slugs)].slice(0, MAX_REVIEW_ACCOUNTS);
  const out: ApolloReview = { rows: [], notes: [], failed: [] };
  const seen = new Set<string>();
  for (let i = 0; i < chosen.length; i += 3) {
    const batch = await Promise.all(chosen.slice(i, i + 3).map(async (slug) => {
      try {
        const v = await load(prisma, slug, now, { live: true });
        return v && 'brief' in v ? { slug, view: project(v.brief, v.inputs), account: v.brief.accountName } : { slug, view: null, account: slug };
      } catch {
        return { slug, view: null, account: slug };
      }
    }));
    for (const b of batch) {
      if (!b.view) { out.failed.push(b.account); continue; }
      // The projection's key is account|kind|target: the same gap is one row, whatever is selected twice.
      for (const c of b.view.candidates) if (!seen.has(c.key)) { seen.add(c.key); out.rows.push(c); }
      if (!b.view.candidates.length) out.notes.push({ account: b.account, note: b.view.notNeeded ?? 'No Apollo lookup would change WHO or NEXT here.' });
    }
  }
  return out;
}
