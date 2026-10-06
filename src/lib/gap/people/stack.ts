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
import type { OwnerCandidate, OwnerResolution } from './owner-resolution';
import { geoPhrase, isSponsor } from './person-prior';

export const STACK_DEFAULT_MAX = 4;
export const STACK_MIN = 3;

export type PursuitSlot = 'Next operator' | 'Second operator' | 'Tech / transformation' | 'Executive sponsor' | 'Site / regional operator' | 'Relationship route';

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
}

const EMPLOYMENT_MATERIAL = new Set(['CURRENT_CONFIRMED', 'EMPLOYMENT_CONFLICT', 'LEFT_COMPANY_CONFIRMED']);
const ROLE_MATERIAL = new Set(['ROLE_CURRENT_CONFIRMED', 'ROLE_CURRENT_LIKELY', 'ROLE_CHANGED_CONFIRMED', 'ROLE_CONFLICT']);

const sameKey = (a: number[] | undefined, b: number[] | undefined) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

function slotOf(c: OwnerCandidate, index: number, r: OwnerResolution): PursuitSlot {
  if (r.sponsor && r.sponsor.key === c.key) return 'Executive sponsor';
  if (r.tech && r.tech.key === c.key) return 'Tech / transformation';
  if (r.site && r.site.key === c.key) return 'Site / regional operator';
  if (c.action === 'relationship_only') return 'Relationship route';
  if (c.read.lane === 'TRANSFORMATION_TECH') return 'Tech / transformation';
  if (c.read.lane === 'FACILITY_OPERATOR') return 'Site / regional operator';
  if (isSponsor(c.read, c.title)) return 'Executive sponsor';
  return index === 0 ? 'Next operator' : 'Second operator';
}

/** The facets a reason can be built from, most specific first. Each is one short sentence or null. */
function facets(c: OwnerCandidate): Array<{ name: string; text: string | null }> {
  const rel = c.relevance?.why ? `${c.relevance.why.charAt(0).toUpperCase()}${c.relevance.why.slice(1)}` : null;
  const role = c.role && ROLE_MATERIAL.has(c.role.state) ? `${c.role.label}` : null;
  const emp = c.employment && EMPLOYMENT_MATERIAL.has(c.employment.state) ? c.employment.label : null;
  const relationship = c.reasons.find((x) => /^Source: a relationship/.test(x)) ?? null;
  const family = c.provenance && c.provenance.relation !== 'primary' ? `Read through ${c.provenance.accountName}` : null;
  const remit = c.read.laneWhy ? `${c.read.laneWhy.charAt(0).toUpperCase()}${c.read.laneWhy.slice(1)}` : null;
  const geo = `${geoPhrase(c.read)}${c.read.scope === 'NETWORK' ? ', network scope' : c.read.scope === 'SITE' ? ', one site' : ''}`;
  const where = c.location ? `Based in ${c.location}` : null;
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

/**
 * One distinguishing sentence per visible row: the most specific facet whose value no other visible row shares; when
 * every facet is shared (the Walmart wall), the title and location make the row readable and unique.
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
    // Nothing on record sets them apart: say so (never repeat the title as if it were a reason).
    if (!pick) pick = rows[i].location ? `Based in ${rows[i].location}; nothing else on record sets them apart` : 'Nothing on record sets them apart from the next row (CRM title only)';
    while (out.includes(pick)) pick = `${pick} (${rows[i].name})`;
    out.push(pick);
  }
  return out;
}

const reachabilityOf = (c: OwnerCandidate) =>
  c.source === 'hubspot' ? (c.hasEmail ? 'In HubSpot, not yet a GAP contact; email on record' : 'In HubSpot, not yet a GAP contact; no email') : c.hasEmail ? 'Email on record' : 'No email on record';

function currentnessOf(c: OwnerCandidate): string | null {
  const parts: string[] = [];
  if (c.role && ROLE_MATERIAL.has(c.role.state)) parts.push(`${c.role.label}: ${c.role.why}`);
  if (c.employment && EMPLOYMENT_MATERIAL.has(c.employment.state)) parts.push(`${c.employment.label}: ${c.employment.why}`);
  if (c.caution) parts.push(c.caution);
  return parts.length ? parts.join(' ') : null;
}

function toRow(c: OwnerCandidate, index: number, r: OwnerResolution, reason: string, ordinal: number | null, chosen: { key: string | null; by: string | null }): StackRow {
  const rec = r.recommended && r.recommended.key === c.key ? r.recommended : null;
  return {
    key: c.key,
    personaId: c.personaId,
    hubspotContactId: c.hubspotContactId,
    name: c.name,
    title: c.title,
    slot: slotOf(c, index, r),
    ordinal,
    badge: rec ? `Recommended: ${rec.firstDifference}` : null,
    reason,
    currentness: currentnessOf(c),
    reachability: reachabilityOf(c),
    why: [...(rec ? [rec.why] : []), ...c.reasons],
    chosen: chosen.key === c.key,
    chosenBy: chosen.key === c.key ? chosen.by : null,
    action: c.action,
    caution: c.caution,
    coldEligible: r.eligible.some((e) => e.key === c.key),
  };
}

export function buildPeopleStack(r: OwnerResolution, opts: { chosenKey: string | null; chosenBy?: string | null; max?: number }): PeopleStack {
  const max = Math.max(STACK_MIN, opts.max ?? STACK_DEFAULT_MAX);
  const eligible = r.eligible;
  const chosenKey = opts.chosenKey && eligible.some((c) => c.key === opts.chosenKey) ? opts.chosenKey : r.preselected && !opts.chosenKey ? r.preselected : null;
  const chosenBy = opts.chosenKey && chosenKey === opts.chosenKey ? opts.chosenBy ?? 'you' : chosenKey ? 'GAP: the only eligible person' : null;
  const chosenMissing = opts.chosenKey && !eligible.some((c) => c.key === opts.chosenKey) ? `Your chosen person is no longer among the eligible people at ${r.account.name} (set aside or left). Choose again.` : null;

  // The chosen person leads; everyone else keeps the resolver's order.
  const ordered = chosenKey ? [eligible.find((c) => c.key === chosenKey)!, ...eligible.filter((c) => c.key !== chosenKey)] : [...eligible];
  // Slots the resolver named (sponsor / tech / site) are worth a row when they are not already in the top rows and
  // when the default rows have room: never a manufactured slot, never beyond the cap.
  // The named slots (sponsor / tech / site) are worth a row of their own when they are not already in the top rows:
  // the resolver filled them from everyone contactable and here, so they may not be cold-eligible. They never push
  // an eligible operator out of the default rows and never exceed the cap; nothing is manufactured.
  const named = [r.sponsor, r.tech, r.site].filter((x, i, a): x is OwnerCandidate => !!x && a.findIndex((y) => y?.key === x.key) === i);
  const topEligible = ordered.filter((c) => !named.some((n) => n.key === c.key)).slice(0, Math.max(STACK_MIN, max - named.length));
  const visible = [...topEligible];
  for (const n of named) if (visible.length < max + named.length && !visible.some((c) => c.key === n.key)) visible.push(n);
  const visibleKeys = new Set(visible.map((c) => c.key));
  const rest = ordered.filter((c) => !visibleKeys.has(c.key));

  // Ordinals only when the resolver's order among the visible eligible rows is evidence-backed everywhere (no two
  // adjacent rows share a key). Any tie among them removes every ordinal: a "1" above unnumbered rows claims an order.
  const eligibleVisible = visible.filter((c) => eligible.some((e) => e.key === c.key) && !named.some((n) => n.key === c.key));
  const tie = eligibleVisible.length >= 2 && eligibleVisible.some((c, i, a) => i > 0 && sameKey(a[i - 1].rank, c.rank));
  const tiedKey = tie ? eligibleVisible.find((c, i, a) => i > 0 && sameKey(a[i - 1].rank, c.rank))!.rank : null;
  const tiedCount = tiedKey ? eligible.filter((c) => sameKey(c.rank, tiedKey)).length : 0;
  const reasons = distinguish(visible);
  const rows = visible.map((c, i) => {
    const isNamedSlot = named.some((n) => n.key === c.key) && !eligible.some((e) => e.key === c.key);
    const evidenceBacked = !tie && !chosenKey && !isNamedSlot;
    const ordinal = evidenceBacked ? eligibleVisible.findIndex((e) => e.key === c.key) + 1 : 0;
    return toRow(c, i, r, reasons[i], ordinal > 0 ? ordinal : null, { key: chosenKey, by: chosenBy });
  });
  const moreReasons = distinguish(rest);
  const more = rest.map((c, i) => toRow(c, rows.length + i, r, moreReasons[i], null, { key: chosenKey, by: chosenBy }));

  const hidden = rest.length;
  const setAsideCount = r.excluded.length;
  const setAsideLine = setAsideCount
    ? `${setAsideCount} set aside: ${r.excluded.slice(0, 3).map((e) => `${e.candidate.name} (${SET_ASIDE_LABEL[e.code] ?? e.code.replace(/_/g, ' ')})`).join(', ')}${setAsideCount > 3 ? ` and ${setAsideCount - 3} more` : ''}.`
    : null;

  return {
    rows,
    hidden,
    showAllLabel: hidden ? `Show ${hidden} more on record (ranked lower on evidence)` : null,
    tie,
    tieLine: tie ? `GAP could not separate ${tiedCount} people on evidence: the same responsibility, market and reachability. Tie-break: name order. Choose on what you know.` : null,
    chooseLabel: !chosenKey && eligible.length >= 2 ? `Choose who (${eligible.length})` : null,
    chosenMissing,
    setAside: { count: setAsideCount, line: setAsideLine },
    more,
  };
}
