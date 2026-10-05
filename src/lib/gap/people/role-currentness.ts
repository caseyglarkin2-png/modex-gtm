/**
 * ROLE CURRENTNESS (owner resolution, 2026-10-05). Employment currentness (employment.ts) is necessary, not
 * sufficient. Walmart dogfood: the CRM holds "Sr Director - West Transportation Command Center" for a person who is
 * still at Walmart while a colleague's own public post says the colleague was promoted into that role and
 * congratulates the person on their own promotion. Employment: current. Role: no longer the stored one, new title
 * unknown. That is NOT a departure, and ranking on the stored title would be ranking on a role they no longer hold.
 *
 * Two explainable dimensions, never a number:
 *
 *   ROLE_CURRENT_CONFIRMED   recent strong evidence (or Casey) names the stored role, or Casey stated the title
 *   ROLE_CURRENT_LIKELY      strong evidence names the stored role but is no longer recent, or supporting evidence
 *                            (Apollo's refreshed title) agrees with it
 *   ROLE_UNVERIFIED          the CRM alone carries the title (the common case): usable, nothing independent
 *   ROLE_CHANGED_CONFIRMED   the stored role is no longer theirs at this account; `effectiveTitle` is the new title
 *                            when a source or Casey named it (usable), else null (not usable: verify the remit)
 *   ROLE_CONFLICT            sources disagree about the role, or supporting automation names another title: verify
 *
 * Same hierarchy as employment: a human row decides; strong evidence (a profile, the employer's page, an
 * announcement, a speaker bio, a buyer interaction, a derived verification whose URL earned strong) decides next;
 * supporting evidence (Apollo, the CRM) corroborates or conflicts; weak evidence (an email domain, a modified date,
 * an aggregator) never counts. Evidence placing them at ANOTHER employer says nothing about the role here (the
 * employment read owns departures). Pure: the store reads and records; the resolver consumes RoleRead.
 */
import { CONFLICT_WINDOW_DAYS, RECENT_DAYS, sameEmployer, type EmploymentEvidence } from './employment';

export { CONFLICT_WINDOW_DAYS, RECENT_DAYS };

export type RoleState = 'ROLE_CURRENT_CONFIRMED' | 'ROLE_CURRENT_LIKELY' | 'ROLE_UNVERIFIED' | 'ROLE_CHANGED_CONFIRMED' | 'ROLE_CONFLICT';

export const ROLE_LABEL: Record<RoleState, string> = {
  ROLE_CURRENT_CONFIRMED: 'Role current (confirmed)',
  ROLE_CURRENT_LIKELY: 'Role current (likely)',
  ROLE_UNVERIFIED: 'Role per the CRM (not verified)',
  ROLE_CHANGED_CONFIRMED: 'Role changed',
  ROLE_CONFLICT: 'Role conflict: verify current role',
};

export interface RoleRead {
  state: RoleState;
  /** One sentence for Casey, no em dashes. */
  why: string;
  /** What GAP / the CRM holds for them. */
  storedTitle: string | null;
  /** verified current title > human-stated title > trusted CRM title when not contradicted > stored title when not contradicted > null (UNKNOWN). */
  effectiveTitle: string | null;
  titleSource: 'verified' | 'human' | 'crm' | 'stored' | 'unknown';
  /** The contradicted title when the role changed. */
  priorTitle: string | null;
  /** false for ROLE_CHANGED_CONFIRMED with no effective title and for ROLE_CONFLICT. */
  usableForRanking: boolean;
  decidedBy: EmploymentEvidence[];
  verifyNeeded: boolean;
}

/**
 * ROLE_CONFLICT always blocks ranking. ROLE_CHANGED_CONFIRMED blocks only when no effective title is known, which the
 * state alone cannot say: read `usableForRanking` on the RoleRead for that.
 */
export function roleBlocksRanking(state: RoleState): boolean {
  return state === 'ROLE_CONFLICT';
}

// ---------------------------------------------------------------- sameRole

const TITLE_ABBREVIATIONS: Record<string, string[]> = {
  sr: ['senior'],
  snr: ['senior'],
  jr: ['junior'],
  vp: ['vice', 'president'],
  svp: ['senior', 'vice', 'president'],
  evp: ['executive', 'vice', 'president'],
  avp: ['assistant', 'vice', 'president'],
  mgr: ['manager'],
  dir: ['director'],
  ops: ['operations'],
  mgmt: ['management'],
  exec: ['executive'],
  asst: ['assistant'],
  assoc: ['associate'],
  gm: ['general', 'manager'],
  ceo: ['chief', 'executive', 'officer'],
  coo: ['chief', 'operating', 'officer'],
  cfo: ['chief', 'financial', 'officer'],
  cio: ['chief', 'information', 'officer'],
  cto: ['chief', 'technology', 'officer'],
  csco: ['chief', 'supply', 'chain', 'officer'],
};
const TITLE_STOP_WORDS = new Set(['of', 'the', 'for', 'in', 'and', 'a', 'an']);
/** Words that make a trailing segment a role or a remit, never a company name. */
const ROLE_WORDS = /\b(director|manager|vp|vice|president|head|lead|chief|officer|senior|sr|supervisor|analyst|coordinator|specialist|engineer|planner|executive|associate|assistant|general|partner|principal|transportation|logistics|supply|chain|operations|ops|fleet|warehouse|distribution|network|yard|yards|terminal|hub|station|procurement|sourcing|planning|strategy|technology|engineering|sales|marketing|finance|safety|quality|customer|service|services|global|north|america|regional|region|west|east|central|south|division|command|center|centre|dc|plant|site|facility|facilities|automation|innovation|digital|data|product|program|project|delivery|freight|shipping|trucking|carrier|rail|intermodal|ocean|air|ground|linehaul|dedicated|contract|retail|stores|store|ecommerce|fulfillment|reverse|inbound|outbound|import|export|trade|compliance|risk|people|hr|talent|it)\b/;

function titleWords(title: string): string[] {
  const words = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => TITLE_ABBREVIATIONS[w] ?? [w]);
  return words.filter((w) => !TITLE_STOP_WORDS.has(w));
}

/**
 * Drop one trailing segment that reads as a company name ("..., FedEx", "... at FedEx", "... | Walmart"): a segment
 * with no role or remit word in it. "Director, Transportation" keeps its segment; "Director, Walmart" drops it.
 */
function withoutTrailingCompany(title: string, companies: readonly string[] = []): string {
  const m = /^(.*\S)\s*(?:,|\|| at | @ |\s-\s)\s*([^,|]+?)\s*$/i.exec(title);
  if (!m) return title;
  const tail = m[2].trim();
  // A tail that spells the employer or one of its units ("FedEx Ground" at FedEx) is a company name even when it
  // carries a network word ("ground"): the account's own spellings decide before the role words do.
  if (companies.some((c) => c && sameEmployer(tail, c))) return m[1];
  return ROLE_WORDS.test(tail.toLowerCase()) ? title : m[1];
}

const normalizeTitle = (t: string) => titleWords(t).join(' ');

/**
 * A normalized title comparison: case, punctuation, "Sr" / "Senior", "&" / "and", "VP" / "Vice President" and a
 * trailing company name ("..., FedEx") do not differ; a different function or remit does. Null or empty never match.
 */
export function sameRole(a: string | null | undefined, b: string | null | undefined, companies: readonly string[] = []): boolean {
  const ta = (a ?? '').trim();
  const tb = (b ?? '').trim();
  if (!ta || !tb) return false;
  const na = normalizeTitle(ta);
  const nb = normalizeTitle(tb);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const ca = normalizeTitle(withoutTrailingCompany(ta, companies));
  const cb = normalizeTitle(withoutTrailingCompany(tb, companies));
  return !!ca && !!cb && (ca === nb || na === cb || ca === cb);
}

// ---------------------------------------------------------------- readRole

const DAY = 86_400_000;
const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);
const dated = (e: EmploymentEvidence) => Number.isFinite(time(e.at));
const day = (iso: string | null | undefined) => (iso && Number.isFinite(time(iso)) ? iso.slice(0, 10) : 'undated');
const newest = (rows: readonly EmploymentEvidence[]) => [...rows].sort((a, b) => (time(b.at) || 0) - (time(a.at) || 0))[0] ?? null;
const says = (e: EmploymentEvidence) => `${e.source}${e.at ? `, ${day(e.at)}` : ''}${e.title ? `: ${e.title}` : ''}`;
const quoted = (t: string | null) => (t ? `"${t}"` : 'no title on record');

export function readRole(input: { accountName: string; aliases?: readonly string[]; domains?: readonly string[]; storedTitle: string | null; crmTitle?: string | null; evidence: readonly EmploymentEvidence[]; now: Date }): RoleRead {
  const { accountName, now } = input;
  const aliases = input.aliases ?? [];
  const domains = input.domains ?? [];
  const storedTitle = (input.storedTitle ?? '').trim() || null;
  const crmTitle = (input.crmTitle ?? '').trim() || null;
  const names = [accountName, ...aliases];
  const same = (x: string | null | undefined, y: string | null | undefined) => sameRole(x, y, names);
  const fallbackTitle = storedTitle ?? crmTitle;
  const fallbackSource: RoleRead['titleSource'] = storedTitle ? 'stored' : crmTitle ? 'crm' : 'unknown';
  const base = { storedTitle, priorTitle: null as string | null };

  // Only evidence about THIS account counts for the role: a departure elsewhere is the employment read's business.
  const ev = input.evidence.filter((e) => e.tier !== 'weak' && !e.left && (e.conflict || !e.company || sameEmployer(e.company, accountName, aliases, domains)));

  const unverified = (decidedBy: EmploymentEvidence[], why?: string): RoleRead => ({
    state: 'ROLE_UNVERIFIED',
    why: why ?? (fallbackTitle ? `The stored role (${quoted(fallbackTitle)}) comes from the CRM alone; nothing independent confirms it (a last-modified date and an email domain are not proof).` : `No role on record at ${accountName}.`),
    ...base,
    effectiveTitle: fallbackTitle,
    titleSource: fallbackSource,
    usableForRanking: true,
    decidedBy,
    verifyNeeded: false,
  });
  const changedUnknown = (e: EmploymentEvidence, by: string): RoleRead => ({
    state: 'ROLE_CHANGED_CONFIRMED',
    why: `Still at ${accountName}, but the stored role (${quoted(storedTitle)}) changed per ${by}; the new title is not established. Verify current remit before using.`,
    ...base,
    priorTitle: storedTitle,
    effectiveTitle: null,
    titleSource: 'unknown',
    usableForRanking: false,
    decidedBy: [e],
    verifyNeeded: true,
  });
  const changedTo = (e: EmploymentEvidence, title: string, titleSource: 'verified' | 'human', by: string): RoleRead => ({
    state: 'ROLE_CHANGED_CONFIRMED',
    why: `Still at ${accountName}; the role changed from ${quoted(storedTitle)} to "${title}" per ${by}.`,
    ...base,
    priorTitle: storedTitle,
    effectiveTitle: title,
    titleSource,
    usableForRanking: true,
    decidedBy: [e],
    verifyNeeded: false,
  });
  const conflict = (decidedBy: EmploymentEvidence[], why: string): RoleRead => ({ state: 'ROLE_CONFLICT', why, ...base, effectiveTitle: null, titleSource: 'unknown', usableForRanking: false, decidedBy, verifyNeeded: true });

  // 1. A human row decides, whatever later automation says.
  const human = newest(input.evidence.filter((e) => e.kind === 'human' && e.tier !== 'weak'));
  let humanCurrentNoTitle = false;
  if (human) {
    if (human.left) {
      return { state: 'ROLE_CHANGED_CONFIRMED', why: `Casey recorded that they left ${accountName} on ${day(human.at)}; the stored role (${quoted(storedTitle)}) is no longer theirs here.`, ...base, priorTitle: storedTitle, effectiveTitle: null, titleSource: 'unknown', usableForRanking: false, decidedBy: [human], verifyNeeded: false };
    }
    const by = `Casey on ${day(human.at)}`;
    if (human.roleChanged) return human.title ? changedTo(human, human.title, 'human', by) : changedUnknown(human, by);
    if (human.title) {
      return { state: 'ROLE_CURRENT_CONFIRMED', why: `Casey confirmed the role at ${accountName} on ${day(human.at)}: "${human.title}".`, ...base, effectiveTitle: human.title, titleSource: 'human', usableForRanking: true, decidedBy: [human], verifyNeeded: false };
    }
    // Casey confirmed them current and said nothing about the role: the stored title stands unless strong evidence speaks.
    humanCurrentNoTitle = true;
  }

  // 2. A verification that found conflicting role evidence.
  const flagged = newest(ev.filter((e) => e.conflict));
  if (flagged) return conflict([flagged], `A verification found conflicting evidence about their role at ${accountName} (${says(flagged)}). Verify the current role.`);

  // 3. Strong evidence: the newest titled source decides; a promotion without a title stands until a newer title.
  const strong = ev.filter((e) => e.tier === 'strong' && e.kind !== 'human');
  const titled = strong.filter((e) => !!e.title);
  // A promotion with no title confirms a change only from a STRONG source (their own profile, the employer's page, a
  // colleague's announcement); a supporting source saying so is a reason to verify, never a confirmation (review S3).
  const moved = newest(strong.filter((e) => e.roleChanged && !e.title));
  const movedWeakly = newest(ev.filter((e) => e.roleChanged && !e.title && e.kind !== 'human' && e.tier !== 'strong'));
  if (titled.length >= 2) {
    const [a, b] = [...titled].sort((x, y) => (time(y.at) || 0) - (time(x.at) || 0));
    if (!same(a.title, b.title)) {
      const both = dated(a) && dated(b);
      if (both && Math.abs(time(a.at) - time(b.at)) <= CONFLICT_WINDOW_DAYS * DAY) return conflict([a, b], `Credible sources disagree about their role at ${accountName} within a month: ${says(a)} versus ${says(b)}. Verify the current role.`);
      if (!both) return conflict([a, b], `Credible sources disagree about their role at ${accountName} and one is undated: ${says(a)} versus ${says(b)}. Verify the current role.`);
    }
  }
  const n = newest(titled);
  if (moved && (!n || !dated(n) || (dated(moved) && time(moved.at) >= time(n.at)))) return changedUnknown(moved, says(moved));
  if (n) {
    const title = n.title!;
    // A supporting source saying the role moved, against a strong titled source: the strong one decides, and the
    // disagreement is a reason to verify.
    const verifyNeeded = !!movedWeakly;
    if (!same(title, storedTitle)) return { ...changedTo(n, title, 'verified', says(n)), verifyNeeded };
    const recent = dated(n) && now.getTime() - time(n.at) <= RECENT_DAYS * DAY;
    return recent
      ? { state: 'ROLE_CURRENT_CONFIRMED', why: `Recent evidence confirms their role at ${accountName}: ${says(n)}.${verifyNeeded ? ` A weaker source (${says(movedWeakly!)}) says the role moved: verify.` : ''}`, ...base, effectiveTitle: title, titleSource: 'verified', usableForRanking: true, decidedBy: [n], verifyNeeded }
      : { state: 'ROLE_CURRENT_LIKELY', why: `Evidence names the stored role at ${accountName}, but it is ${n.at ? `older than ${RECENT_DAYS} days` : 'undated'}: ${says(n)}.${verifyNeeded ? ` A weaker source (${says(movedWeakly!)}) says the role moved: verify.` : ''}`, ...base, effectiveTitle: title, titleSource: 'verified', usableForRanking: true, decidedBy: [n], verifyNeeded };
  }
  if (movedWeakly) return conflict([movedWeakly], `${says(movedWeakly)} says the role at ${accountName} changed, but it is not a strong source and nothing stronger speaks. Verify the current role before ranking on it.`);
  if (humanCurrentNoTitle) return unverified([human!], `Casey confirmed them at ${accountName} on ${day(human!.at)} without a title; the stored role (${quoted(fallbackTitle)}) stands unverified.`);

  // 4. Supporting evidence never blocks (review S6: five GAP contacts were set aside for a GAP-title versus
  // HubSpot-title wording difference). A differing CRM title is read as the current CRM title, unverified, with
  // verify suggested; a differing provider title keeps the stored title, unverified, with verify suggested; the same
  // title from a provider corroborates (likely).
  const supporting = ev.filter((e) => e.tier === 'supporting' && !!e.title);
  const crm = supporting.find((e) => e.kind === 'crm') ?? null;
  const liveCrmTitle = crmTitle ?? crm?.title ?? null;
  const crmDiffers = !!crm && !!liveCrmTitle && !!storedTitle && !same(liveCrmTitle, storedTitle);
  if (crmDiffers) {
    return { state: 'ROLE_UNVERIFIED', why: `The CRM reads "${liveCrmTitle}" while GAP holds "${storedTitle}"; neither is verified (a wording difference, not a change). Verify the current role when it matters.`, ...base, priorTitle: null, effectiveTitle: liveCrmTitle, titleSource: 'crm', usableForRanking: true, decidedBy: [crm], verifyNeeded: true };
  }
  const differing = newest(supporting.filter((e) => e.kind !== 'crm' && fallbackTitle && !same(e.title, fallbackTitle)));
  if (differing) return { ...unverified([differing], `${says(differing)} names a different role from the stored ${quoted(fallbackTitle)} at ${accountName}; a provider row alone neither confirms nor blocks. Verify the current role before ranking on it.`), verifyNeeded: true };
  const agreeing = newest(supporting.filter((e) => e.kind !== 'crm' && fallbackTitle && same(e.title, fallbackTitle)));
  if (agreeing) return { state: 'ROLE_CURRENT_LIKELY', why: `Supporting evidence agrees with the stored role at ${accountName}: ${says(agreeing)}.`, ...base, effectiveTitle: fallbackTitle, titleSource: fallbackSource, usableForRanking: true, decidedBy: [agreeing], verifyNeeded: false };
  return unverified(crm ? [crm] : []);
}
