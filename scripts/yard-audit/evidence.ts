/**
 * The evidence rule — ONE definition.
 *
 * This lived inline in `fovGate()` and was re-implemented from memory in tests
 * and ad-hoc audit scripts, which is how a rule drifts. Everything that decides
 * "is this facility ship-eligible" imports from here.
 *
 * A research record may exist without being ship-eligible. That is the point of
 * a research corpus. Ship-eligible means: we can put this facility in front of a
 * buyer as a factual claim.
 */

export interface Citation {
  tier?: number;
  url?: string;
  date?: string;
  type?: string;
  claim?: string;
}

export interface Verification {
  verdict?: string;
  citations?: Citation[];
  checkedDivestiture?: boolean;
  checkedBankruptcyEra?: boolean;
  rationale?: string;
}

/** Accounts that went through a bankruptcy/restructuring needing its own check. */
export const RESTRUCTURED_COMPANIES = new Set(['general-motors']);

/**
 * A citation we control. Our own marketing page is not evidence for a claim on
 * our own marketing page — that is a closed loop, and it read as sourcing only
 * because the gate counted URLs rather than reading them.
 */
export function isSelfCitation(url: string): boolean {
  return /(^|\/\/|\.)(yardflow\.ai|freightroll\.com)(\/|$|:)/i.test(url);
}

/**
 * An API endpoint our own auditing agent issued. It returned data, which made it
 * feel like a source, but it is a record of a lookup WE performed: usually
 * key-gated, frequently non-resolvable to a reader, and never a document anyone
 * can open to check us.
 */
export function isSelfIssuedApi(url: string): boolean {
  return /(googleapis\.com|\bkey=AIza|[?&]api_key=)/i.test(url);
}

/**
 * A search-engine RESULTS page. Same defect as a self-issued API call wearing a
 * friendlier hostname: it is a query WE ran, its contents change under you, and
 * it establishes nothing on its own. One Tyson record cited
 * `html.duckduckgo.com/html/?q="1301 S Keystone" Indianapolis warehouse` under
 * the type "commercial real-estate / business listing aggregation" — the label
 * describes what the auditor hoped to find, not what the URL is.
 *
 * A Google MAPS permalink is not a search: it resolves to a fixed place and a
 * fixed camera, and a reader opening it sees the same signage the auditor saw.
 * Those stay durable.
 */
export function isSearchQuery(url: string): boolean {
  return /(duckduckgo\.com\/html|\/search\?|[?&]q=)/i.test(url);
}

/**
 * Link shorteners. The destination is opaque at citation time and can be
 * repointed afterwards, so the URL does not durably say anything.
 */
const SHORTENERS = new Set([
  't.co', 'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly',
  'buff.ly', 'lnkd.in', 'rb.gy', 'is.gd', 'shorturl.at',
]);

/**
 * Is this even a URL a reader could open?
 *
 * The three exclusions above are a DENYLIST, and a denylist only answers "is
 * this one of the bad kinds we already know about" — never "is this good".
 * Auditing the rule turned up that `data:text/html,hi`, `ftp://x`,
 * `http://localhost/x` and `https://t.co/abc` all passed as durable evidence,
 * because none of them is a yardflow.ai URL, a Google API endpoint, or a search
 * query. These records are agent-generated, so "no agent would emit that" is not
 * a safety argument.
 *
 * This adds the positive requirement the denylist never made: a public http(s)
 * URL on a real host. The current corpus has zero citations that fail it, so
 * this guards future input rather than reclassifying anything today.
 */
export function isResolvablePublicUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.')) return false; // localhost, bare hostnames
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // raw IPs
  if (SHORTENERS.has(host.replace(/^www\./, ''))) return false;
  return true;
}

/** A citation a reader could actually open and use to check the claim. */
export function isDurableIndependent(c: Citation): boolean {
  const url = c.url ?? '';
  if (!url || !c.date) return false;
  if (!isResolvablePublicUrl(url)) return false;
  return !isSelfCitation(url) && !isSelfIssuedApi(url) && !isSearchQuery(url);
}

export type EvidenceFailure =
  | 'no-verification-block'
  | 'no-verdict'
  | 'rejected'
  | 'no-citations'
  | 'citation-missing-url-or-date'
  | 'no-durable-independent-citation'
  | 'divestiture-unchecked'
  | 'bankruptcy-era-unchecked';

/**
 * Returns null when the record is ship-eligible, otherwise why it is not.
 *
 * `no-durable-independent-citation` was added 2026-08-12 after a dry run over
 * the whole corpus: it demotes 6 records, all Tyson, and ZERO sites in any of
 * the 58 public demo packs. The self-validating loophole was real but nothing
 * shipped was leaning on it, so closing it costs nothing and cannot silently
 * reclassify hundreds of records.
 */
export function evidenceFailure(
  accountSlug: string,
  v: Verification | undefined | null,
): EvidenceFailure | null {
  if (!v) return 'no-verification-block';
  if (!v.verdict) return 'no-verdict';
  if (v.verdict === 'rejected') return 'rejected';

  const citations = v.citations ?? [];
  if (citations.length === 0) return 'no-citations';
  if (citations.some((c) => !c.url || !c.date)) return 'citation-missing-url-or-date';
  if (!citations.some(isDurableIndependent)) return 'no-durable-independent-citation';

  if (v.checkedDivestiture !== true) return 'divestiture-unchecked';
  if (RESTRUCTURED_COMPANIES.has(accountSlug) && v.checkedBankruptcyEra !== true) {
    return 'bankruptcy-era-unchecked';
  }
  return null;
}

export function isShipEligible(accountSlug: string, v: Verification | undefined | null): boolean {
  return evidenceFailure(accountSlug, v) === null;
}
