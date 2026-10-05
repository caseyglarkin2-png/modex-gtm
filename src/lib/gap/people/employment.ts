/**
 * CONTACT CURRENTNESS (owner resolution, 2026-10-05). WHO is two-dimensional: the RIGHT RESPONSIBILITY (the person
 * prior) AND CURRENT EMPLOYMENT at this account. H-E-B dogfood: GAP recommended a Director whose HubSpot row still
 * said H-E-B (modified after he left) while public evidence placed him at ADUSA Distribution. A CRM row's last-modified
 * date and a company email domain are never proof that an employer or title is current.
 *
 * Five explainable states, never a score:
 *
 *   CURRENT_CONFIRMED       recent reliable evidence explicitly places them at this account (a human confirmation,
 *                           their own public profile, the employer's page, a current announcement, a buyer interaction)
 *   CURRENT_LIKELY          consistent supporting evidence (Apollo current + the CRM), or strong evidence that is no
 *                           longer recent; no strongest-tier confirmation
 *   CURRENT_UNVERIFIED      the CRM says they belong here and nothing independent confirms it (the common case)
 *   EMPLOYMENT_CONFLICT     credible sources disagree about their current company or title: verify before relying
 *   LEFT_COMPANY_CONFIRMED  credible current evidence places them at another employer, or dates their departure
 *
 * Evidence hierarchy: strong (profile, employer page, announcement, speaker bio, buyer interaction, Casey) decides;
 * supporting (an industry bio, a contact provider such as Apollo, the CRM company field) corroborates or raises a
 * conflict; weak (a directory, an aggregator, an email domain, HubSpot lastmodifieddate, an old post) never decides.
 * A human correction outranks every automated read and is never overwritten by weaker automation.
 *
 * Leaving a company is NOT do-not-contact, not a bounce and not an unsubscribe: the person may be a candidate at
 * their new employer. Nothing here touches suppression. Pure; the store (employment-store.ts) reads and records.
 */
import { sameCompany } from '../family/family';

export type EmploymentState = 'CURRENT_CONFIRMED' | 'CURRENT_LIKELY' | 'CURRENT_UNVERIFIED' | 'EMPLOYMENT_CONFLICT' | 'LEFT_COMPANY_CONFIRMED';
export type EvidenceTier = 'strong' | 'supporting' | 'weak';
export type EvidenceKind =
  | 'human' // Casey said so (THIS PERSON LEFT / role is wrong / confirmed current)
  | 'profile' // the person's own public professional profile
  | 'employer_page' // the employer's leadership / bio page or announcement
  | 'speaker_bio' // a recent event or speaker bio naming employer and title
  | 'buyer_interaction' // a reply, a meeting, an email signature from this account
  | 'web' // a source-backed web verification (tier by its URL)
  | 'apollo' // a contact provider's employment status
  | 'crm' // the CRM company / title field
  | 'aggregator' // a directory or people aggregator
  | 'email_domain' // the address's domain (never proof)
  | 'crm_modified'; // HubSpot lastmodifieddate (never proof)

export interface EmploymentEvidence {
  kind: EvidenceKind;
  tier: EvidenceTier;
  /** The company the evidence places them at (null: it says nothing about the company). */
  company: string | null;
  title: string | null;
  /** The evidence's own date (ISO), when known. */
  at: string | null;
  /** Where it comes from, in words ("Casey, 2026-10-05", "LinkedIn profile", "HubSpot", "Apollo free sweep"). */
  source: string;
  url?: string | null;
  note?: string | null;
  /** The evidence explicitly says they LEFT this account (a departure), whatever company it names. */
  left?: boolean;
  /**
   * The evidence says the stored ROLE is no longer theirs (promoted, the role moved to someone else) while they stay
   * at the company; `title` is the new title when the source names it, else null. Read by role-currentness.ts;
   * for the employment read it is a plain placement at `company`.
   */
  roleChanged?: boolean;
  /** A verification found sources that disagree about the role: says nothing about the company; the role read conflicts. */
  conflict?: boolean;
}

export interface EmploymentRead {
  state: EmploymentState;
  /** One sentence for Casey. */
  why: string;
  /** The evidence that decided, strongest first. */
  decidedBy: EmploymentEvidence[];
  /** Where current evidence places them when it is not this account. */
  elsewhere: { company: string | null; title: string | null; source: string; url: string | null; at: string | null } | null;
  /** The next step is VERIFY CURRENT ROLE (a conflict, or stale enough to matter). */
  verifyNeeded: boolean;
}

export const EMPLOYMENT_LABEL: Record<EmploymentState, string> = {
  CURRENT_CONFIRMED: 'Current (confirmed)',
  CURRENT_LIKELY: 'Current (likely)',
  CURRENT_UNVERIFIED: 'Current per the CRM (not verified)',
  EMPLOYMENT_CONFLICT: 'Employment conflict: verify current role',
  LEFT_COMPANY_CONFIRMED: 'Left the company',
};

/** A LEFT or CONFLICT person is never actionable WHO, never routed, drafted, sent or enrolled at this account. */
export function employmentBlocksOutreach(state: EmploymentState): boolean {
  return state === 'LEFT_COMPANY_CONFIRMED' || state === 'EMPLOYMENT_CONFLICT';
}

/** The refusal code a gate returns for a blocked state (the machine word; refusal-copy.ts has the seller sentence). */
export function employmentRefusal(state: EmploymentState): 'persona_left_account' | 'persona_employment_conflict' | null {
  return state === 'LEFT_COMPANY_CONFIRMED' ? 'persona_left_account' : state === 'EMPLOYMENT_CONFLICT' ? 'persona_employment_conflict' : null;
}

/** Strong evidence counts as RECENT for this long (then it is likely, not confirmed). */
export const RECENT_DAYS = 180;
/** Two strong sources dated within this window that disagree are a conflict, not a departure. */
export const CONFLICT_WINDOW_DAYS = 30;

const DAY = 86_400_000;
const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);
const day = (iso: string | null | undefined) => (iso && !Number.isNaN(time(iso)) ? iso.slice(0, 10) : 'undated');

/** Generic words that never identify an employer on their own: "General" is not General Mills, "American" is not American Axle. */
const GENERIC_EMPLOYER_WORDS = new Set(['american', 'national', 'united', 'general', 'global', 'international', 'first', 'new', 'north', 'south', 'east', 'west', 'universal', 'standard', 'pacific', 'atlantic', 'central', 'western', 'eastern', 'southern', 'northern', 'northwest', 'southwest', 'midwest', 'great', 'royal', 'allied', 'premier', 'advanced', 'consolidated', 'continental', 'federal', 'the', 'services', 'logistics', 'transport', 'transportation', 'distribution', 'industries', 'foods', 'supply', 'chain', 'delta', 'sun', 'star', 'crown', 'eagle', 'liberty', 'pioneer', 'summit', 'apex', 'alpha', 'omega', 'prime', 'elite', 'imperial', 'metro', 'capital', 'atlas', 'phoenix', 'titan', 'horizon', 'frontier', 'heritage', 'legacy', 'keystone', 'cornerstone', 'bay', 'golden', 'silver', 'blue', 'red', 'green', 'black', 'white', 'mid', 'tri', 'one', 'city', 'state', 'home', 'family', 'group']);
const LEGAL_WORDS = /\b(inc|incorporated|corp|corporation|llc|ltd|limited|plc|lp|llp|co|company|holdings|group|the)\b/g;
const TLD_LABELS = new Set(['com', 'net', 'org', 'co', 'uk', 'us', 'ca', 'mx', 'io', 'ai', 'biz', 'info', 'de', 'fr', 'eu', 'au', 'nl', 'br', 'in', 'jp', 'cn']);

/** Lowercase words with accents, punctuation and legal suffixes dropped: "J.B. Hunt Transport Services, Inc." is j b hunt transport services. */
const employerWords = (v: string): string[] => v.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(LEGAL_WORDS, ' ').trim().split(/\s+/).filter(Boolean);

/** The registrable label of a domain: "genmills.com" is "genmills", "www.jbhunt.co.uk" is "jbhunt". */
export function domainLabel(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const parts = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split('.').filter(Boolean);
  while (parts.length > 1 && TLD_LABELS.has(parts[parts.length - 1])) parts.pop();
  const label = (parts[parts.length - 1] ?? '').replace(/[^a-z0-9]/g, '');
  return label.length >= 2 ? label : null;
}

/**
 * Is this company spelling the same employer as the account? Deliberately looser than canonical account identity:
 * a provider or the CRM writes "NFI", "Pepsi", "Fed Ex Freight" or "J.B. Hunt Transport Services, Inc." for people
 * who are at NFI Industries, PepsiCo, FedEx and J.B. Hunt, and reading those as another employer set every GAP
 * contact at those accounts aside (dogfood 2026-10-05). Two spellings are the same employer when the shorter one
 * (three letters, or any length with a digit) is exactly the LEADING WORDS of the other ("NFI" / "NFI Industries",
 * "fed ex" / "FedEx", "j b hunt" / "J.B. Hunt Transport Services", "heb" / "HEB Grocery Company"), or the other is
 * one word made of it plus a legal tail ("pepsi" + "co"). A partial word never matches ("Mars" is not "Marsh
 * McLennan" or "Marshalls", "Ford" is not "Fordham", "Amazon" is not "Amazonia"), a generic word never matches alone
 * ("General", "American"), and the account's own domain label counts as a spelling ("Genmills" through
 * genmills.com). A division, subsidiary or banner that keeps the group's distinctive first word is the same employer
 * ("Pepsi - Gatorade Division" at PepsiCo, "NFI Logistics" at NFI Industries, "Estes Forwarding" at Estes Express).
 * Known limit, accepted: an unrelated company that shares that whole first word ("Target Hospitality" at Target)
 * reads as the same employer; a departure to one is caught by strong evidence or by Casey, never by this rule, and
 * the common brand words ("Delta", "Pioneer", "Summit") never match alone. Hyphenated families ("Knight-Swift") and
 * banners with their own name ("Central Market" at H-E-B) need their aliases, which every caller passes.
 */
const LEGAL_TAIL = /^(co|corp|inc|llc|group|holdings)$/;
const squashWords = (words: readonly string[]) => words.join('');
/**
 * `short` is the squash of `long`'s leading words ("fedex" leads "fed ex freight"), or `long` is one word made of
 * `short` plus a legal tail ("pepsico" from "pepsi"), or `short` is one word made of `long`'s first word plus a
 * legal tail ("pepsico" against "pepsi gatorade division": the division names the parent without its "Co").
 */
function leads(short: string, long: readonly string[]): boolean {
  let acc = '';
  for (const w of long) {
    acc += w;
    if (acc === short) return true;
    if (acc.length >= short.length) break;
  }
  if (long.length === 1 && long[0].length > short.length && long[0].startsWith(short) && LEGAL_TAIL.test(long[0].slice(short.length))) return true;
  const first = long[0] ?? '';
  return first.length >= 5 && short.length > first.length && short.startsWith(first) && LEGAL_TAIL.test(short.slice(first.length));
}
const usableSpelling = (s: string) => (s.length >= 3 || /\d/.test(s)) && !GENERIC_EMPLOYER_WORDS.has(s);
/** Two spellings whose first word is the same distinctive name ("NFI Logistics" / "NFI Industries", "Estes Forwarding" / "Estes Express"): a division, a subsidiary or a banner of the same group. */
/** Words that describe a unit of the same group without naming another company: "NFI Logistics" / "NFI Industries", "Estes Forwarding" / "Estes Express". */
const FAMILY_DESCRIPTORS = new Set(['logistics', 'industries', 'express', 'forwarding', 'transport', 'transportation', 'services', 'service', 'group', 'distribution', 'freight', 'trucking', 'holdings', 'international', 'global', 'national', 'america', 'americas', 'north', 'usa', 'us', 'company', 'corporation', 'division', 'enterprises', 'systems', 'solutions', 'supply', 'chain', 'brands', 'foods', 'beverages', 'worldwide', 'intermodal', 'dedicated', 'warehousing', 'fulfillment', 'lines', 'line', 'ground', 'air', 'cargo', 'shipping', 'motor']);
/**
 * Two spellings whose first word is the same distinctive name AND whose remaining words only describe a unit of the
 * group ("NFI Logistics" / "NFI Industries"): a division, a subsidiary or a banner. A remaining word that names
 * something else ("Dollar Tree" / "Dollar General", "Schneider Electric" / "Schneider National", "Old Dominion
 * University" / "Old Dominion Freight Line", "Performance Team" / "Performance Food Group") is another company,
 * so a strong placement there reads as a departure (review S4).
 */
const sameFirstWord = (a: readonly string[], b: readonly string[]) => !!a[0] && a[0] === b[0] && usableSpelling(a[0]) && a.slice(1).every((w) => FAMILY_DESCRIPTORS.has(w)) && b.slice(1).every((w) => FAMILY_DESCRIPTORS.has(w));

export function sameEmployer(company: string, accountName: string, aliases: readonly string[] = [], domains: readonly string[] = []): boolean {
  const names = [accountName, ...aliases].filter((n) => !!n?.trim());
  if (names.some((n) => sameCompany(company, n))) return true;
  const cw = employerWords(company);
  const c = squashWords(cw);
  if (!c || GENERIC_EMPLOYER_WORDS.has(c)) return false;
  const sides = [...names.map((n) => employerWords(n)), ...domains.map((d) => domainLabel(d)).filter((l): l is string => !!l).map((l) => [l])];
  for (const sw of sides) {
    const sq = squashWords(sw);
    if (!sq || GENERIC_EMPLOYER_WORDS.has(sq)) continue;
    if ((usableSpelling(sq) && leads(sq, cw)) || (usableSpelling(c) && leads(c, sw)) || sameFirstWord(sw, cw)) return true;
  }
  return false;
}

/** Does the evidence place them at THIS account (the account, one of its names, or its own domain label)? */
function here(e: EmploymentEvidence, accountName: string, aliases: readonly string[], domains: readonly string[] = []): boolean | null {
  if (e.left) return false;
  // A role conflict says nothing about the company; a row with no company says nothing either.
  if (e.conflict || !e.company) return null;
  return sameEmployer(e.company, accountName, aliases, domains);
}

const newest = (rows: EmploymentEvidence[]) => [...rows].sort((a, b) => (time(b.at) || 0) - (time(a.at) || 0))[0] ?? null;
const says = (e: EmploymentEvidence) => `${e.source}${e.at ? `, ${day(e.at)}` : ''}${e.company ? `: ${e.company}` : ''}${e.title ? ` (${e.title})` : ''}`;
const elsewhereOf = (e: EmploymentEvidence | null): EmploymentRead['elsewhere'] => (e ? { company: e.company, title: e.title, source: e.source, url: e.url ?? null, at: e.at } : null);

/**
 * Read one person's employment at `accountName` from the evidence on record. Deterministic: the same evidence always
 * reads the same way. The CRM alone is CURRENT_UNVERIFIED; weak evidence never changes the answer.
 */
export function readEmployment(input: { accountName: string; aliases?: readonly string[]; /** The account's domains: their labels count as spellings of the employer. */ domains?: readonly string[]; evidence: readonly EmploymentEvidence[]; now: Date }): EmploymentRead {
  const { accountName, now } = input;
  const aliases = input.aliases ?? [];
  const domains = input.domains ?? [];
  const ev = input.evidence.filter((e) => e.tier !== 'weak');
  const human = newest(ev.filter((e) => e.kind === 'human'));
  // 1. A human correction decides, whatever automation says.
  if (human) {
    const h = here(human, accountName, aliases, domains);
    if (h === false) {
      return { state: 'LEFT_COMPANY_CONFIRMED', why: `Casey marked them as no longer at ${accountName}${human.company ? ` (now ${human.company}${human.title ? `, ${human.title}` : ''})` : ''} on ${day(human.at)}.`, decidedBy: [human], elsewhere: human.company ? elsewhereOf(human) : null, verifyNeeded: false };
    }
    return { state: 'CURRENT_CONFIRMED', why: `Casey confirmed them at ${accountName} on ${day(human.at)}${human.title ? ` as ${human.title}` : ''}.`, decidedBy: [human], elsewhere: null, verifyNeeded: false };
  }
  // 2. Strong evidence: the newest placement decides; two strong sources within a month that disagree conflict.
  const strong = ev.filter((e) => e.tier === 'strong');
  const strongHere = newest(strong.filter((e) => here(e, accountName, aliases, domains) === true));
  const strongAway = newest(strong.filter((e) => here(e, accountName, aliases, domains) === false));
  if (strongAway || strongHere) {
    if (strongAway && strongHere) {
      const ta = time(strongAway.at);
      const th = time(strongHere.at);
      const both = Number.isFinite(ta) && Number.isFinite(th);
      if (both && Math.abs(ta - th) <= CONFLICT_WINDOW_DAYS * DAY) {
        return { state: 'EMPLOYMENT_CONFLICT', why: `Credible sources disagree within a month: ${says(strongHere)} versus ${says(strongAway)}. Verify the current role.`, decidedBy: [strongHere, strongAway], elsewhere: elsewhereOf(strongAway), verifyNeeded: true };
      }
      if (!both) {
        return { state: 'EMPLOYMENT_CONFLICT', why: `Credible sources disagree and one is undated: ${says(strongHere)} versus ${says(strongAway)}. Verify the current role.`, decidedBy: [strongHere, strongAway], elsewhere: elsewhereOf(strongAway), verifyNeeded: true };
      }
      if (ta > th) return { state: 'LEFT_COMPANY_CONFIRMED', why: `Newer evidence places them elsewhere: ${says(strongAway)} (after ${says(strongHere)}).`, decidedBy: [strongAway, strongHere], elsewhere: elsewhereOf(strongAway), verifyNeeded: false };
      // here is newer than away: fall through to the here read
    } else if (strongAway) {
      return { state: 'LEFT_COMPANY_CONFIRMED', why: `Current evidence places them elsewhere: ${says(strongAway)}.`, decidedBy: [strongAway], elsewhere: elsewhereOf(strongAway), verifyNeeded: false };
    }
    const h = strongHere!;
    const recent = Number.isFinite(time(h.at)) && now.getTime() - time(h.at) <= RECENT_DAYS * DAY;
    return recent
      ? { state: 'CURRENT_CONFIRMED', why: `Recent evidence places them at ${accountName}: ${says(h)}.`, decidedBy: [h], elsewhere: null, verifyNeeded: false }
      : { state: 'CURRENT_LIKELY', why: `Evidence places them at ${accountName}, but it is ${h.at ? `older than ${RECENT_DAYS} days` : 'undated'}: ${says(h)}.`, decidedBy: [h], elsewhere: null, verifyNeeded: false };
  }
  // 3. Supporting evidence: another employer from a provider is a conflict to verify; consistent support is likely.
  const supporting = ev.filter((e) => e.tier === 'supporting');
  const away = newest(supporting.filter((e) => here(e, accountName, aliases, domains) === false));
  const hereRows = supporting.filter((e) => here(e, accountName, aliases, domains) === true);
  if (away) {
    return { state: 'EMPLOYMENT_CONFLICT', why: `${says(away)} says they are no longer at ${accountName}, while the CRM says they are. Verify the current role before relying on them.`, decidedBy: [away, ...hereRows.slice(0, 1)], elsewhere: elsewhereOf(away), verifyNeeded: true };
  }
  const independent = hereRows.filter((e) => e.kind !== 'crm');
  if (independent.length >= 1 && hereRows.length >= 2) {
    const d = newest(independent)!;
    return { state: 'CURRENT_LIKELY', why: `Consistent supporting evidence places them at ${accountName}: ${says(d)}, and the CRM agrees.`, decidedBy: [d, ...hereRows.filter((e) => e !== d).slice(0, 1)], elsewhere: null, verifyNeeded: false };
  }
  const crm = hereRows.find((e) => e.kind === 'crm') ?? null;
  return {
    state: 'CURRENT_UNVERIFIED',
    why: crm ? `The CRM says ${accountName}; nothing independent confirms it yet (a last-modified date and an email domain are not proof).` : `Nothing on record places them at ${accountName} independently.`,
    decidedBy: crm ? [crm] : [],
    elsewhere: null,
    verifyNeeded: false,
  };
}

// ---------------------------------------------------------------- evidence builders (pure)

/** The CRM row itself: the company field is supporting; the email domain and the modified date are weak (shown, never decisive). */
export function crmEvidence(input: { company: string | null; title: string | null; email: string | null; lastModifiedAt: string | null; source?: string }): EmploymentEvidence[] {
  const source = input.source ?? 'HubSpot';
  const out: EmploymentEvidence[] = [];
  if (input.company) out.push({ kind: 'crm', tier: 'supporting', company: input.company, title: input.title, at: null, source });
  const domain = (input.email ?? '').split('@')[1]?.trim().toLowerCase() || null;
  if (domain) out.push({ kind: 'email_domain', tier: 'weak', company: null, title: null, at: null, source: `${source} email domain ${domain}`, note: 'An email domain is never proof of current employment.' });
  if (input.lastModifiedAt) out.push({ kind: 'crm_modified', tier: 'weak', company: null, title: null, at: input.lastModifiedAt, source: `${source} last modified`, note: 'A CRM modification date is never proof of current employment.' });
  return out;
}

/** Apollo's employment status on the HubSpot contact (clawd's free sweep writes it): supporting evidence, never decisive alone. */
export function apolloEvidence(input: { status: string | null; verifiedAt: string | null; accountName: string; title?: string | null }): EmploymentEvidence[] {
  const s = String(input.status ?? '').trim().toLowerCase();
  if (!s || s === 'unverified') return [];
  const source = `Apollo employment check${input.verifiedAt ? '' : ' (undated)'}`;
  // Apollo's "current" confirms the employer, not the role: it carries a title only when Apollo refreshed the title
  // itself (current_title_updated), so the ROLE read never counts the CRM title twice (WHO truth, 2026-10-05).
  if (s === 'current' || s === 'current_title_updated') return [{ kind: 'apollo', tier: 'supporting', company: input.accountName, title: s === 'current_title_updated' ? input.title ?? null : null, at: input.verifiedAt, source, note: s === 'current_title_updated' ? 'Title refreshed by Apollo.' : null }];
  if (s === 'moved_out' || s === 'departed' || s === 'moved_to_lookalike') return [{ kind: 'apollo', tier: 'supporting', company: null, title: null, at: input.verifiedAt, source, left: true, note: `Apollo reads them as ${s.replace(/_/g, ' ')}.` }];
  return [];
}

/** A buyer interaction from this account (a reply, a meeting, a human-confirmed disposition): strong, dated by the interaction. */
export function interactionEvidence(input: { at: string | null; what: string; accountName: string }): EmploymentEvidence[] {
  if (!input.at) return [];
  return [{ kind: 'buyer_interaction', tier: 'strong', company: input.accountName, title: null, at: input.at, source: input.what }];
}

/** The tier a web source earns from its URL: a profile or the employer's own page is strong, anything else supporting. */
const AGGREGATOR_HOST = /\b(zoominfo|rocketreach|contactout|signalhire|apollo|lusha|crunchbase|datanyze|leadiq|seamless|wiza|theorg|spokeo|sprouts|muraena|theofficialboard|equilar|comparably|craft)\b/;

export function tierForUrl(url: string | null | undefined, companyDomains: readonly string[] = []): EvidenceTier {
  let host = '';
  let path = '';
  try {
    const u = new URL(String(url ?? ''));
    host = u.hostname.replace(/^www\./, '').toLowerCase();
    path = u.pathname.toLowerCase();
  } catch {
    return 'weak';
  }
  if (!host) return 'weak';
  if (host === 'linkedin.com' && path.startsWith('/in/')) return 'strong';
  if (companyDomains.some((d) => host === d || host.endsWith(`.${d}`))) return 'strong';
  // A people directory or aggregator is weak: it restates a CRM-shaped record and never decides a role (review S3).
  if (AGGREGATOR_HOST.test(host)) return 'weak';
  return 'supporting';
}

/** The kind a web source reads as, from its URL. */
export function kindForUrl(url: string | null | undefined, companyDomains: readonly string[] = []): EvidenceKind {
  try {
    const u = new URL(String(url ?? ''));
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'linkedin.com' && u.pathname.toLowerCase().startsWith('/in/')) return 'profile';
    if (companyDomains.some((d) => host === d || host.endsWith(`.${d}`))) return 'employer_page';
    if (AGGREGATOR_HOST.test(host)) return 'aggregator';
  } catch {
    // not a URL
  }
  return 'web';
}
