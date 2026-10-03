/**
 * CROSS-ACCOUNT APOLLO REVIEW (Casey, 2026-10-03): which Apollo lookups are worth Casey's credits, across accounts.
 * A thin reader over the per-account projection (apolloCandidates): no new candidate authority, no storage, no Apollo
 * call. Casey picks the accounts (nothing is evaluated by opening the page), filters, and copies requests to run by hand.
 */
import { loadAccountView } from '../account-intel/load';
import { apolloCandidates, type ApolloCandidate } from './apollo-candidates';
import { MAX_REVIEW_ACCOUNTS } from './apollo-review-text';

export { MAX_REVIEW_ACCOUNTS, KIND_LABEL, apolloRequestText, apolloBatchText, filterCandidates } from './apollo-review-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface ApolloReview {
  rows: ApolloCandidate[];
  /** Accounts with nothing to propose, and why (a staged candidate, a prior Apollo result, HubSpot unread, nothing needed). */
  notes: Array<{ account: string; note: string }>;
  /** Accounts that could not be read (never silently dropped). */
  failed: string[];
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
      } catch (e) {
        console.warn('[gap/apollo-review] could not read', slug, e instanceof Error ? e.message : e);
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
