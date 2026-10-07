/**
 * The pure claim rules every truth gate shares (stabilization A): who made a claim, whether it names the account,
 * and why a STORED verified claim no longer counts as live outreach evidence. No I/O, no heavy imports, so the
 * strict outreach gate, the account brief and the source view all read the same rules.
 */
import { isPhysicalOpsFact } from './facts';
import { SEARCH_REDIRECT } from '../sources/source-copy';

const CORPORATE_SUFFIX = /\b(the|co|inc|corp|corporation|company|companies|ltd|llc|plc|holdings|group|incorporated)\b/g;

export function normalizeCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(CORPORATE_SUFFIX, ' ').replace(/\s+/g, ' ').trim();
}

/** Does this text name the account (its full normalized name as whole words)? */
export function textNamesAccount(text: string, accountKey: string): boolean {
  if (!accountKey) return false;
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  return t.includes(` ${accountKey} `);
}

/**
 * A job title's department, never an organization: "Senior Vice President of Supply Chain at PepsiCo" is spoken by
 * PepsiCo, not by "Supply Chain".
 */
const DEPARTMENT = /^(?:global\s+|north\s+american?\s+|u\.?s\.?\s+)?(?:supply\s+chain|operations|logistics|transportation|distribution|manufacturing|procurement|purchasing|sourcing|engineering|sales|marketing|finance|strategy|technology|it|information\s+technology|human\s+resources|hr|people|facilities|real\s+estate|sustainability|corporate\s+affairs|communications|customer\s+service|fleet|planning|innovation|digital|product|research(?:\s+and\s+development)?|r&d)(?:\s+(?:operations|strategy|and\s+logistics|and\s+operations|transformation|excellence))?$/i;

/** Leading words of a job title, never part of an organization's name ("Senior Vice President"). */
const TITLE_WORD = /^(?:senior|executive|chief|global|group|regional|vice|deputy|assistant|associate|general|managing|former|interim|acting|the|a|an)$/i;
const ORG = String.raw`[A-Z][\w&.'’-]*(?:\s+[A-Z][\w&.'’-]*){0,3}`;
const TITLES = String.raw`(?:CEO|CFO|COO|CTO|CIO|SVP|EVP|VP|[Pp]resident|[Cc]hair(?:man|woman)?|[Ss]pokes(?:person|man|woman)|(?:[Cc]o-)?[Ff]ounder|[Ee]xecutive|[Hh]ead|[Dd]irector|[Vv]ice [Pp]resident|[Cc]hief \w+ [Oo]fficer)`;
const cleanOrg = (raw: string): string | null => {
  const words = raw.replace(/[.,;:]+$/, '').replace(/['’]s$/, '').split(/\s+/);
  while (words.length && TITLE_WORD.test(words[0])) words.shift();
  const org = words.join(' ');
  return org && !DEPARTMENT.test(org) ? org : null;
};
/** Does this organization name the page's own publisher ("according to Reuters" on reuters.com)? */
const isPublisher = (org: string, url?: string | null): boolean => {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const key = org.toLowerCase().replace(/[^a-z0-9]/g, '');
    return key.length >= 4 && host.replace(/[^a-z0-9.]/g, '').split('.').some((l) => l.includes(key) || (l.length >= 5 && key.includes(l)));
  } catch {
    return false;
  }
};

/**
 * The organization a claim is attributed to, else null. Four press forms:
 *   "..., said Jane Doe, CEO of Gatik"           (a department in the title is skipped: "VP of Supply Chain at PepsiCo")
 *   "Gatik CEO Gautam Narang said ..."            (an organization right before a title, then said / says / told)
 *   "..., according to Gatik"                     (the page's own publisher reporting is not a third party)
 *   "Kaleris announced that Acme is opening ..."   (batch item 7: an organization announcing news about another; the
 *                                                  account announcing about itself stays its own statement)
 * Used by every truth gate: a claim whose speaker is not the account is that speaker's claim.
 */
export function speakerOrg(sentence: string, url?: string | null): string | null {
  const said = /\bsaid\b([^."“”;]{0,120})/.exec(sentence);
  if (said) {
    const re = new RegExp(String.raw`\b(?:of|at|from)\s+(${ORG})`, 'g');
    for (let m = re.exec(said[1]); m; m = re.exec(said[1])) {
      const org = cleanOrg(m[1]);
      if (org) return org;
    }
  }
  const titled = new RegExp(String.raw`\b(${ORG})\s+${TITLES}\b[^."“”;]{0,60}?\b(?:said|says|told|stated)\b`).exec(sentence);
  if (titled) {
    const org = cleanOrg(titled[1]);
    if (org) return org;
  }
  const announced = new RegExp(String.raw`^\s*(${ORG})(?:,[^,]{1,80},)?\s+(?:announced|said|reported|revealed|stated|shared|confirmed)(?:\s+(?:today|this week|on\s+[A-Z][a-z]+\.?\s+\d{1,2}(?:,\s+\d{4})?))?\s+that\b`).exec(sentence);
  if (announced) {
    const org = cleanOrg(announced[1]);
    if (org) return org;
  }
  const per = new RegExp(String.raw`\baccording to\s+(${ORG})`).exec(sentence);
  if (per) {
    const org = cleanOrg(per[1]);
    if (org && !isPublisher(org, url)) return org;
  }
  return null;
}

/**
 * The publisher page a stored claim lives at. Fact columns are frozen after insert (GAP_SIGNAL_FROZEN), so a claim
 * first stored on a search-redirect link and later confirmed verbatim at its publisher's page carries that page in
 * metadata.canonicalUrl (scripts/gap/resolve-redirect-facts.ts); it is the link every surface shows.
 */
export function factUrl(row: { evidence_url?: string | null; metadata?: unknown }): string | null {
  const m = row.metadata as { canonicalUrl?: unknown } | null | undefined;
  return typeof m?.canonicalUrl === 'string' && /^https?:\/\//.test(m.canonicalUrl) ? m.canonicalUrl : (row.evidence_url ?? null);
}

/**
 * Search redirects, snippets, aggregators and mirrors: never a source a fact can be verified at, and never the page
 * outreach evidence links to (panabee.com: machine-written company summaries).
 */
export const WEAK_SOURCE = /^https?:\/\/(?:[^/]*\.)?(?:vertexaisearch\.cloud\.google\.com|google\.[a-z.]+\/(?:search|url)|news\.google\.com|bing\.com|duckduckgo\.com|news\.yahoo\.com|msn\.com|newsbreak\.com|ground\.news|flipboard\.com|scribd\.com|pdfcoffee\.com|dokumen\.pub|studocu\.com|coursehero\.com|panabee\.com)\b/i;

export type LiveFactFailure = 'not_a_physical_operations_fact' | 'quoted_third_party' | 'redirect_unresolved' | 'source_too_weak';

/**
 * Why a STORED verified claim is not live outreach evidence on read (rules tightened since it was stored), else
 * null. The claim stays a verified fact (true at its source); only its outreach eligibility is withdrawn. A claim
 * stored on a search-redirect link has no publisher Casey can open, so it is never outreach evidence.
 */
/** R30: the stored-claim rules for a job, procurement or other admitted claim: the publisher and the speaker, not the physical rule. */
export function liveClaimFailure(text: string, accountName: string, url?: string | null): LiveFactFailure | null {
  if (url && SEARCH_REDIRECT.test(url)) return 'redirect_unresolved';
  if (url && WEAK_SOURCE.test(url)) return 'source_too_weak';
  const speaker = speakerOrg(text, url);
  if (speaker && !textNamesAccount(speaker, normalizeCompany(accountName))) return 'quoted_third_party';
  return null;
}

export function liveFactFailure(text: string, accountName: string, url?: string | null): LiveFactFailure | null {
  if (url && SEARCH_REDIRECT.test(url)) return 'redirect_unresolved';
  // An aggregator or mirror is never the page outreach evidence links to (the same rule a new fact must pass).
  if (url && WEAK_SOURCE.test(url)) return 'source_too_weak';
  if (!isPhysicalOpsFact(text)) return 'not_a_physical_operations_fact';
  const speaker = speakerOrg(text, url);
  if (speaker && !textNamesAccount(speaker, normalizeCompany(accountName))) return 'quoted_third_party';
  return null;
}
