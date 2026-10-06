/**
 * PEOPLE STACK (account-first UX, UX-03, 2026-10-05): the few people who matter at one account, projected from the ONE
 * owner-resolution read (owner-resolution.ts). Never a second ranking: the rows are the resolver's eligible list in the
 * resolver's order; a badge appears only when the resolver recommends; a tie (equal rank keys) shows without ordinals
 * and says so; the full list is one labelled, counted step away and keeps every set-aside reason.
 *
 * Each row carries ONE reason that sets the person apart from the next row (remit, geography, scope, role or
 * employment currentness, relationship, source), never the shared title rule ("Primary operator: title says they run
 * transportation"), which is the same sentence on 43 Walmart cards. The deeper evidence (every resolver reason) stays
 * behind "Why this person?". Pure; pinned by tests/unit/gap/people-stack.test.ts.
 */
import { leadOver, type OwnerCandidate, type OwnerResolution } from './owner-resolution';
import { geoPhrase, isSponsor } from './person-prior';
import { preferenceLine, type PreferenceKind, type SellerPreference } from './seller-preference';

export const STACK_DEFAULT_MAX = 3;
export const STACK_MIN = 3;

export type PursuitSlot = 'Next operator' | 'Next if no response' | 'Eligible operator' | 'Tech / transformation' | 'Executive sponsor' | 'Site / regional operator' | 'Relationship route';

export interface StackRow {
  key: string;
  personaId: number | null;
  hubspotContactId: string | null;
  name: string;
  title: string | null;
  slot: PursuitSlot;
  /** Shown only when the resolver's order between this row and the next is evidence-backed; null on a tie. */
  ordinal: number | null;
  /** "Recommended for this hypothesis" when the resolver recommends this person; never otherwise. */
  badge: string | null;
  /** ONE sentence that sets this person apart from the next row. */
  reason: string;
  /** Employment or role currentness, only when material (not plain "unverified"); a restriction reads here too. */
  currentness: string | null;
  /** "Email on record" / "In HubSpot, not yet a GAP contact; email on record" / "No email on record". */
  reachability: string;
  /** The resolver's full reasons, the recommendation sentence first when it applies: "Why this person?". */
  why: string[];
  /**
   * UX-06, on the chosen (or first) row only: why this person over the next one, from the resolver's own rank keys
   * ("Why Glen over Jeffrey?"); "GAP cannot separate these two on current evidence." on a tie; null when alone.
   */
  leadOver: { over: string; text: string; tie: boolean; /** false when the seller chose a lower-ranked person: GAP ranks the other ahead. */ leads: boolean } | null;
  /** The seller's current choice, read from the pursuit state (never a preselection by the stack). */
  chosen: boolean;
  chosenBy: string | null;
  /** What choosing does: 'use' a GAP contact; 'add_then_use' adds the HubSpot person first. */
  action: OwnerCandidate['action'];
  caution: string | null;
  /**
   * Eligible for the cold first touch (the resolver's list). A named sponsor / tech / site slot is shown even when
   * not: it unlocks by a meeting, a referral or the seller's explicit choice, never as a cold first touch.
   */
  coldEligible: boolean;
  /** UX-07: the seller set this person aside here (not a fit / not now until a date); they live in "Show more". */
  preference: { kind: PreferenceKind; line: string } | null;
  /** UX-07: the motion's NEXT IF NO RESPONSE person (the seller's Make next, or the motion's own pick). */
  isNext: boolean;
}

/** Plain words for the set-aside reasons (the same vocabulary the owner panel groups by). */
export const SET_ASIDE_LABEL: Record<string, string> = {
  do_not_contact: 'do not contact',
  unsubscribed: 'unsubscribed',
  opted_out: 'opted out in HubSpot',
  left_company: 'left the company',
  employment_conflict: 'employer in question',
  role_changed: 'role changed',
  role_conflict: 'role in question',
  divested_entity: 'divested unit',
  other_region: 'another region',
  no_name: 'no name on record',
};

export interface PeopleStack {
  rows: StackRow[];
  /** How many eligible people are not shown by default. */
  hidden: number;
  showAllLabel: string | null;
  /** The top rows share a rank key: no ordinals, and this sentence says so. */
  tie: boolean;
  tieLine: string | null;
  /** "Choose who (4)" when two or more are eligible and nobody is chosen; null when one is preselected or chosen. */
  chooseLabel: string | null;
  /** The seller's chosen person is not among the eligible any more: said, never silently dropped. */
  chosenMissing: string | null;
  /** The set-aside people, one line with the count and the reasons (the full grouped list stays in the resolution). */
  setAside: { count: number; line: string | null };
  /** The eligible list beyond the default rows, in the resolver's order (the "Show all" path). */
  more: StackRow[];
  /**
   * The named pursuit slots the resolver filled (executive sponsor, tech / transformation, site operator) when they are
   * not already a default row: level 2 for a first touch, shown as one compact line each, never a full card and never
   * a cold first touch.
   */
  slots: StackRow[];
}

const EMPLOYMENT_MATERIAL = new Set(['CURRENT_CONFIRMED', 'EMPLOYMENT_CONFLICT', 'LEFT_COMPANY_CONFIRMED']);
const ROLE_MATERIAL = new Set(['ROLE_CURRENT_CONFIRMED', 'ROLE_CURRENT_LIKELY', 'ROLE_CHANGED_CONFIRMED', 'ROLE_CONFLICT']);

const sameKey = (a: number[] | undefined, b: number[] | undefined) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * The slot a row carries. "Next operator" only for the person who IS next (chosen by the seller, or the resolver's
 * single preselection); every other eligible person is "Eligible operator", never a positional "second" that claims
 * an order the evidence may not hold.
 */
function slotOf(c: OwnerCandidate, r: OwnerResolution, chosenKey: string | null, isNext = false): PursuitSlot {
  if (r.sponsor && r.sponsor.key === c.key) return 'Executive sponsor';
  if (r.tech && r.tech.key === c.key) return 'Tech / transformation';
  if (r.site && r.site.key === c.key) return 'Site / regional operator';
  if (c.action === 'relationship_only') return 'Relationship route';
  if (c.read.lane === 'TRANSFORMATION_TECH') return 'Tech / transformation';
  if (c.read.lane === 'FACILITY_OPERATOR') return 'Site / regional operator';
  if (isSponsor(c.read, c.title)) return 'Executive sponsor';
  return chosenKey === c.key ? 'Next operator' : isNext ? 'Next if no response' : 'Eligible operator';
}

const shortLocation = (s: string | null) => (s ? s.replace(/,\s*United States$/i, '') : null);

/** The facets a reason can be built from, most specific first. Each is one short sentence or null. */
function facets(c: OwnerCandidate): Array<{ name: string; text: string | null }> {
  const rel = c.relevance?.why ? `${c.relevance.why.charAt(0).toUpperCase()}${c.relevance.why.slice(1)}` : null;
  const role = c.role && ROLE_MATERIAL.has(c.role.state) ? `${c.role.label}` : null;
  const emp = c.employment && EMPLOYMENT_MATERIAL.has(c.employment.state) ? c.employment.label : null;
  const relationship = c.reasons.find((x) => /^Source: a relationship/.test(x)) ?? null;
  const family = c.provenance && c.provenance.relation !== 'primary' ? `Read through ${c.provenance.accountName}` : null;
  const remit = c.read.laneWhy ? `${c.read.laneWhy.charAt(0).toUpperCase()}${c.read.laneWhy.slice(1)}` : null;
  const geo = `${geoPhrase(c.read)}${c.read.scope === 'NETWORK' ? ', network scope' : c.read.scope === 'SITE' ? ', one site' : ''}`;
  const where = c.location ? `Based in ${shortLocation(c.location)}` : null;
  return [
    { name: 'relationship', text: relationship ? relationship.replace(/^Source: a relationship \((.*?)\).*$/, 'You have a way in: $1') : null },
    { name: 'relevance', text: rel },
    { name: 'role', text: role },
    { name: 'employment', text: emp },
    { name: 'remit', text: remit },
    { name: 'geo', text: geo },
    { name: 'family', text: family },
    { name: 'location', text: where },
  ];
}

/** Rank and filler words never make a reason on their own ("Title: Senior" says nothing about what they run). */
const GENERIC_TITLE_WORDS = new Set(['senior', 'sr', 'jr', 'director', 'vice', 'president', 'vp', 'svp', 'evp', 'manager', 'head', 'chief', 'officer', 'global', 'north', 'america', 'inc', 'and', 'the', 'of', 'for', 'ii', 'iii', 'lead', 'leader', 'principal', 'associate', 'executive', 'enterprise', 'group', 'corporate']);

/** The title's own distinguishing fragment ("Inbound Logistics" against "Transportation Strategy & Planning"). */
function titleFragment(title: string | null, others: Array<string | null>): string | null {
  if (!title) return null;
  const words = (t: string) => new Set(t.toLowerCase().split(/[^a-z0-9&]+/).filter((w) => w.length > 2));
  const mine = words(title);
  const shared = new Set(others.filter((o): o is string => !!o).flatMap((o) => [...words(o)]));
  const own = [...mine].filter((w) => !shared.has(w) && !GENERIC_TITLE_WORDS.has(w));
  if (!own.length) return null;
  // Keep the title's own order and capitalisation for the distinguishing words; a lone generic word is no reason.
  const kept = title.split(/\s+/).filter((w) => own.includes(w.toLowerCase().replace(/[^a-z0-9&]/g, '')));
  return kept.length ? `Title names ${kept.join(' ')}` : null;
}

const nameKey = (s: string) => s.toLowerCase().replace(/^(dr|mr|mrs|ms)\.?\s+/, '').replace(/[^a-z]+/g, ' ').trim();
const HARD_SET_ASIDE = new Set(['do_not_contact', 'unsubscribed', 'opted_out', 'left_company']);

/**
 * One distinguishing sentence per visible row: the most specific facet whose value no other visible row shares, then
 * the title's own distinguishing words, then an honest "same as the row above" (which may repeat; it is said once in
 * the tie line and never dressed up as a reason).
 */
function distinguish(rows: OwnerCandidate[]): string[] {
  const all = rows.map(facets);
  const out: string[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const mine = all[i];
    let pick: string | null = null;
    for (const f of mine) {
      if (!f.text) continue;
      const shared = all.some((other, j) => j !== i && other.find((g) => g.name === f.name)?.text === f.text);
      if (!shared) { pick = f.text; break; }
    }
    if (!pick) pick = titleFragment(rows[i].title, rows.filter((_, j) => j !== i).map((x) => x.title));
    if (!pick) pick = 'Nothing on record sets them apart from the other eligible people here (the title and location say the same)';
    out.push(pick);
  }
  return out;
}

const reachabilityOf = (c: OwnerCandidate) =>
  c.source === 'hubspot' ? (c.hasEmail ? 'In HubSpot, not yet a GAP contact; email on record' : 'In HubSpot, not yet a GAP contact; no email') : c.hasEmail ? 'Email on record' : 'No email on record';

/** "verified at linkedin.com, 2026-10-05: Managing Director..." -> "Oct 5 (linkedin.com)"; anything else stays as written, short. */
function shortEvidence(why: string): string {
  const m = why.match(/verified at ([a-z0-9.-]+\.[a-z]{2,}),\s*(\d{4}-\d{2}-\d{2})/i);
  if (m) {
    const d = new Date(`${m[2]}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    return `${d} (${m[1]})`;
  }
  const a = why.match(/(Apollo[^,.:]*|HubSpot[^,.:]*|human[^,.:]*),?\s*(\d{4}-\d{2}-\d{2})?/i);
  if (a) return a[2] ? `${new Date(`${a[2]}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} (${a[1].trim()})` : a[1].trim();
  return why.length > 90 ? `${why.slice(0, 87).trim()}...` : why;
}

/** The currentness cue, short: "Role confirmed Oct 5 (linkedin.com)"; the full sentence stays behind Why this person?. */
function currentnessOf(c: OwnerCandidate): string | null {
  const parts: string[] = [];
  if (c.role && ROLE_MATERIAL.has(c.role.state)) parts.push(`${c.role.label.replace(/^Role current \((confirmed|likely)\)$/, 'Role $1')} ${shortEvidence(c.role.why)}`.replace(/\s+/g, ' ').trim());
  if (c.employment && EMPLOYMENT_MATERIAL.has(c.employment.state)) parts.push(`${c.employment.label}: ${shortEvidence(c.employment.why)}`);
  if (c.caution) parts.push(c.caution);
  return parts.length ? parts.join('. ') : null;
}

interface RowContext {
  nextPersonaId: number | null;
  preferences: ReadonlyMap<number, SellerPreference>;
}

function toRow(c: OwnerCandidate, r: OwnerResolution, reason: string, ordinal: number | null, chosen: { key: string | null; by: string | null }, ctx: RowContext): StackRow {
  const rec = r.recommended && r.recommended.key === c.key ? r.recommended : null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const pref = c.personaId !== null ? ctx.preferences.get(c.personaId) ?? null : null;
  const isNext = c.personaId !== null && c.personaId === ctx.nextPersonaId && chosen.key !== c.key;
  return {
    key: c.key,
    personaId: c.personaId,
    hubspotContactId: c.hubspotContactId,
    name: c.name,
    title: c.title,
    slot: slotOf(c, r, chosen.key, isNext),
    ordinal,
    badge: rec ? `Recommended: ${rec.firstDifference}` : null,
    reason,
    currentness: currentnessOf(c),
    reachability: reachabilityOf(c),
    // Everything the resolver says, minus the line already visible as the reason.
    why: [...(rec ? [rec.why] : []), ...c.reasons].filter((w) => !norm(w).includes(norm(reason)) && !norm(reason).includes(norm(w).replace(/^[a-z /]+: /, ''))),
    leadOver: null,
    chosen: chosen.key === c.key,
    chosenBy: chosen.key === c.key ? chosen.by : null,
    action: c.action,
    caution: c.caution,
    coldEligible: r.eligible.some((e) => e.key === c.key),
    preference: pref ? { kind: pref.kind, line: preferenceLine(pref) } : null,
    isNext,
  };
}

export function buildPeopleStack(
  r: OwnerResolution,
  opts: { chosenKey: string | null; chosenBy?: string | null; max?: number; /** UX-07 */ preferences?: ReadonlyMap<number, SellerPreference>; nextPersonaId?: number | null },
): PeopleStack {
  const max = Math.max(STACK_MIN, opts.max ?? STACK_DEFAULT_MAX);
  const ctx: RowContext = { nextPersonaId: opts.nextPersonaId ?? null, preferences: opts.preferences ?? new Map() };
  // A name set aside as do not contact, unsubscribed, opted out or left at this account is never offered as a row
  // under another record of the same person (H-E-B: a duplicate Troy Shaw record was eligible beside the flagged
  // one). The send gates would refuse; the page must not offer it either. The hidden record is said in the set-aside.
  const hardNames = new Set(r.excluded.filter((e) => HARD_SET_ASIDE.has(e.code)).map((e) => nameKey(e.candidate.name)));
  const nameClash = r.eligible.filter((c) => hardNames.has(nameKey(c.name)));
  const eligible = r.eligible.filter((c) => !hardNames.has(nameKey(c.name)));
  const chosenKey = opts.chosenKey && eligible.some((c) => c.key === opts.chosenKey) ? opts.chosenKey : r.preselected && !opts.chosenKey ? r.preselected : null;
  const chosenBy = opts.chosenKey && chosenKey === opts.chosenKey ? opts.chosenBy ?? 'you' : chosenKey ? 'GAP: the only eligible person' : null;
  const chosenMissing = opts.chosenKey && !eligible.some((c) => c.key === opts.chosenKey) ? `Your chosen person is no longer among the eligible people at ${r.account.name} (set aside or left). Choose again.` : null;

  // UX-07: a person the seller set aside here (not a fit / not now) leaves the default rows for "Show more", with
  // the seller's own line; the chosen person is never parked under their own choice. Eligibility itself is untouched:
  // a preference reorders or hides among the eligible and never loosens a safety set-aside.
  const parked = eligible.filter((c) => c.personaId !== null && ctx.preferences.has(c.personaId) && c.key !== chosenKey);
  const parkedKeys = new Set(parked.map((c) => c.key));
  const active = eligible.filter((c) => !parkedKeys.has(c.key));
  // The chosen person leads; everyone else keeps the resolver's order.
  const ordered = chosenKey ? [active.find((c) => c.key === chosenKey)!, ...active.filter((c) => c.key !== chosenKey)] : [...active];
  // Slots the resolver named (sponsor / tech / site) are worth a row when they are not already in the top rows and
  // when the default rows have room: never a manufactured slot, never beyond the cap.
  // The default rows are eligible people only (the resolver's order, the chosen person first). The named slots
  // (sponsor / tech / site) are level 2 for a first touch: one compact line each, below the rows, never a card and
  // never a cold first touch; nothing is manufactured when the resolver names nobody.
  const named = [r.sponsor, r.tech, r.site].filter((x, i, a): x is OwnerCandidate => !!x && a.findIndex((y) => y?.key === x.key) === i);
  const visible = ordered.slice(0, max);
  const visibleKeys = new Set(visible.map((c) => c.key));
  const rest = ordered.filter((c) => !visibleKeys.has(c.key));
  const slotPeople = named.filter((n) => !visibleKeys.has(n.key));

  // Ordinals only when the resolver's order among the visible rows is evidence-backed everywhere (no two adjacent
  // rows share a key). Any tie among them removes every ordinal: a "1" above unnumbered rows claims an order.
  const tie = visible.length >= 2 && visible.some((c, i, a) => i > 0 && sameKey(a[i - 1].rank, c.rank));
  const tiedKey = tie ? visible.find((c, i, a) => i > 0 && sameKey(a[i - 1].rank, c.rank))!.rank : null;
  // The tie line names the people on screen first (General Mills named a hidden person while a visible one was tied).
  const tiedAll = tiedKey ? eligible.filter((c) => sameKey(c.rank, tiedKey)) : [];
  const tied = [...tiedAll.filter((c) => visibleKeys.has(c.key)), ...tiedAll.filter((c) => !visibleKeys.has(c.key))];
  const reasons = distinguish(visible);
  const rows = visible.map((c, i) => {
    const evidenceBacked = !tie && !chosenKey;
    return toRow(c, r, reasons[i], evidenceBacked ? i + 1 : null, { key: chosenKey, by: chosenBy }, ctx);
  });
  // WHY #1 OVER #2: on the first row, against the next visible eligible row, from the rank keys; never invented.
  if (rows.length >= 2 && visible[0] && visible[1]) {
    const lead = leadOver(visible[0], visible[1], r.purpose);
    rows[0].leadOver = lead ? { over: visible[1].name, text: lead.text, tie: false, leads: lead.leads } : { over: visible[1].name, text: 'GAP cannot separate these two on current evidence.', tie: true, leads: false };
  }
  const moreReasons = distinguish(rest);
  const parkedReasons = distinguish(parked);
  const more = [...rest.map((c, i) => toRow(c, r, moreReasons[i], null, { key: chosenKey, by: chosenBy }, ctx)), ...parked.map((c, i) => toRow(c, r, parkedReasons[i], null, { key: chosenKey, by: chosenBy }, ctx))];
  const slotReasons = distinguish(slotPeople);
  const slots = slotPeople.map((c, i) => toRow(c, r, slotReasons[i], null, { key: chosenKey, by: chosenBy }, ctx));

  const hidden = rest.length + parked.length;
  // A hidden eligible person with a material currentness caution is said in the Show-more label, never silently hidden.
  const hiddenCautions = rest.filter((c) => (c.role && ['ROLE_CHANGED_CONFIRMED', 'ROLE_CONFLICT'].includes(c.role.state)) || (c.employment && ['EMPLOYMENT_CONFLICT', 'LEFT_COMPANY_CONFIRMED'].includes(c.employment.state)) || !!c.caution).length;
  const setAsideCount = r.excluded.length + nameClash.length;
  // Nameless records are counted, never listed by a non-name ("(no name in HubSpot) (no name on record)").
  const setAsideNames = [...nameClash.map((c) => `${c.name} (another record of a set-aside name)`), ...r.excluded.filter((e) => e.code !== 'no_name').map((e) => `${e.candidate.name} (${SET_ASIDE_LABEL[e.code] ?? e.code.replace(/_/g, ' ')})`)];
  // Nameless records are counted, never listed; the "more" count is what is not shown, and a line with no names says so.
  const shownNames = setAsideNames.slice(0, 3);
  const unshown = setAsideCount - shownNames.length;
  const setAsideLine = !setAsideCount ? null : shownNames.length ? `${setAsideCount} set aside: ${shownNames.join(', ')}${unshown > 0 ? ` and ${unshown} more` : ''}.` : `${setAsideCount} set aside, none with a name on record.`;
  const tiedNames = tied.slice(0, 3).map((c) => c.name);
  const tieWho = tied.length > 3 ? `${tiedNames.join(', ')} and ${tied.length - 3} more` : tiedNames.length > 1 ? `${tiedNames.slice(0, -1).join(', ')} and ${tiedNames[tiedNames.length - 1]}` : tiedNames.join('');

  return {
    rows,
    hidden,
    // "Ranked lower on evidence" only when the order IS evidence; under a tie the rest are simply the rest.
    showAllLabel: hidden ? `${tie ? `Show ${hidden} more on record` : `Show ${hidden} more on record (ranked lower on evidence)`}${hiddenCautions ? `, ${hiddenCautions} with a caution` : ''}${parked.length ? `, ${parked.length} set aside by you` : ''}` : null,
    tie,
    tieLine: tie ? `GAP could not separate ${tieWho} on evidence (the same responsibility, market and reachability); their order here is first-name order, not a ranking. Choose on what you know.` : null,
    chooseLabel: !chosenKey && active.length >= 2 ? `Choose who (${active.length})` : null,
    chosenMissing,
    setAside: { count: setAsideCount, line: setAsideLine },
    more,
    slots,
  };
}
