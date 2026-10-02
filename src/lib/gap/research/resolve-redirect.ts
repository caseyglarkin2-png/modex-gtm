/**
 * Stabilization C2: a verified claim stored on a search-redirect link (vertexaisearch grounding, before such links
 * were refused) has no publisher page Casey can open. Resolve it:
 *
 *   1. follow the redirect; if it lands on a real publisher page that holds the claim VERBATIM and names the
 *      account, that page is the claim's canonical source (recorded in metadata.canonicalUrl; fact columns are
 *      frozen, the quote is never rewritten);
 *   2. else ask the grounded search where the exact sentence was published and check each cited page the same way;
 *   3. else the claim is UNRESOLVED: it stays visible as intelligence, and its outreach eligibility is withdrawn
 *      (metadata.verified -> failed_recheck, reason redirect_unresolved). Nothing is deleted.
 */
import { excerptFoundIn } from './facts';
import { WEAK_SOURCE, normalizeCompany, textNamesAccount } from './claim-rules';
import { SEARCH_REDIRECT } from '../sources/source-copy';

export interface RedirectDeps {
  /** Follow redirects; the final URL and its readable text (throws when unreadable). */
  follow: (url: string) => Promise<{ finalUrl: string; text: string }>;
  /** Pages a grounded search cites for an exact sentence (may be empty). */
  search?: (sentence: string, accountName: string) => Promise<string[]>;
}

export type RedirectResolution = { resolved: true; canonicalUrl: string; via: 'redirect' | 'search' } | { resolved: false; reason: string };

export async function resolveRedirectFact(fact: { evidence_text: string; evidence_url: string; account_name: string }, deps: RedirectDeps): Promise<RedirectResolution> {
  const key = normalizeCompany(fact.account_name);
  const holds = async (url: string): Promise<string | null> => {
    try {
      const page = await deps.follow(url);
      // The canonical page must be the publisher's own: never a redirect, an aggregator or a mirror.
      if (SEARCH_REDIRECT.test(page.finalUrl) || WEAK_SOURCE.test(page.finalUrl) || !/^https?:\/\//.test(page.finalUrl)) return null;
      return excerptFoundIn(fact.evidence_text, page.text) && textNamesAccount(page.text, key) ? page.finalUrl : null;
    } catch {
      return null;
    }
  };
  const direct = await holds(fact.evidence_url);
  if (direct) return { resolved: true, canonicalUrl: direct, via: 'redirect' };
  if (deps.search) {
    const cited = (await deps.search(fact.evidence_text, fact.account_name).catch(() => [] as string[])).filter((u) => !SEARCH_REDIRECT.test(u)).slice(0, 4);
    for (const u of cited) {
      const hit = await holds(u);
      if (hit) return { resolved: true, canonicalUrl: hit, via: 'search' };
    }
  }
  return { resolved: false, reason: 'redirect_unresolved' };
}
