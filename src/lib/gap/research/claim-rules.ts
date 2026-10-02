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

/** The organization a quoted sentence is attributed to ("..., said Jane Doe, CEO of Gatik"), else null. */
export function speakerOrg(sentence: string): string | null {
  const m = /\bsaid\b[^."“”;]{0,80}?\b(?:of|at|from)\s+([A-Z][\w&.'’-]*(?:\s+[A-Z][\w&.'’-]*){0,3})/.exec(sentence);
  return m ? m[1].replace(/[.,;:]+$/, '') : null;
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

export type LiveFactFailure = 'not_a_physical_operations_fact' | 'quoted_third_party' | 'redirect_unresolved';

/**
 * Why a STORED verified claim is not live outreach evidence on read (rules tightened since it was stored), else
 * null. The claim stays a verified fact (true at its source); only its outreach eligibility is withdrawn. A claim
 * stored on a search-redirect link has no publisher Casey can open, so it is never outreach evidence.
 */
export function liveFactFailure(text: string, accountName: string, url?: string | null): LiveFactFailure | null {
  if (url && SEARCH_REDIRECT.test(url)) return 'redirect_unresolved';
  if (!isPhysicalOpsFact(text)) return 'not_a_physical_operations_fact';
  const speaker = speakerOrg(text);
  if (speaker && !textNamesAccount(speaker, normalizeCompany(accountName))) return 'quoted_third_party';
  return null;
}
