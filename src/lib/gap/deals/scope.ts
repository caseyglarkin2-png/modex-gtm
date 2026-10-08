/**
 * OPPORTUNITY SCOPE (GAP OS execution recovery, R50, 2026-10-06). Pure and client-safe.
 *
 * One company can hold several opportunities (two HubSpot deals, two divisions, two sites). What a buyer said, what
 * the seller owes and the next step belong to ONE of them when that is known, and are never shared silently:
 *
 *   recorded   the row names its deal (a commitment's `dealId`, a BID's `metadata.scope.dealId`), its division or
 *              its site: that is its scope
 *   contact    nothing recorded, but the person it is about is a contact on exactly ONE open deal: that deal, said
 *              as "through <person>" so the seller sees why
 *   none       account-level, and LABELED "account-level" wherever it is shown (never presented as one deal's)
 *
 * A stored deal reference is a HubSpot deal id (digits). Notes saved before R50 carried the deal's NAME; a name that
 * matches exactly one open deal resolves to it, any other name stays its own unmatched scope (never guessed onto a
 * deal, never dropped). A person on two deals is account-level: one person's words are never transferred to every
 * opportunity they touch.
 */

export interface DealRef {
  id: string;
  name: string | null;
  /** HubSpot contacts on the deal. */
  contactIds: readonly string[];
}

export interface ScopeInput {
  dealId?: string | null;
  division?: string | null;
  site?: string | null;
}

export type ScopeBasis = 'recorded' | 'contact' | 'none';

export interface ScopeRead {
  /** The open deal it belongs to, when known. */
  dealId: string | null;
  dealName: string | null;
  /** A deal reference that matches no open deal (a closed deal id, a legacy name): shown as its own scope. */
  unmatched: string | null;
  division: string | null;
  site: string | null;
  basis: ScopeBasis;
  /** Seller words: "Deal: Kroger yard pilot", "Deal: Kroger yard pilot (through Ann)", "account-level". */
  label: string;
}

export const ACCOUNT_LEVEL = 'account-level' as const;

/** A deal HubSpot holds as closed at this account (opportunity truth's `closed`): named, never by its id. */
export interface ClosedDealRef {
  id: string;
  name: string | null;
  won: boolean | null;
  closedAt: string | null;
}

/** "Deal: Kroger Columbus DC (closed won, Oct 7, 2026)". */
export function closedDealLabel(c: ClosedDealRef): string {
  const day = c.closedAt && !Number.isNaN(new Date(c.closedAt).getTime()) ? new Date(c.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : null;
  const outcome = c.won === true ? 'closed won' : c.won === false ? 'closed lost' : 'closed';
  return `Deal: ${c.name ?? 'a closed deal'} (${outcome}${day ? `, ${day}` : ''})`;
}

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim() || null;
const isDealId = (s: string) => /^\d{1,24}$/.test(s);

/** Resolve a stored deal reference against the open deals: an id, or a legacy name that matches exactly one. */
export function resolveDealRef(raw: string | null | undefined, deals: readonly DealRef[]): { dealId: string | null; dealName: string | null; unmatched: string | null } {
  const v = clean(raw);
  if (!v) return { dealId: null, dealName: null, unmatched: null };
  if (isDealId(v)) {
    const d = deals.find((x) => x.id === v);
    return d ? { dealId: d.id, dealName: d.name, unmatched: null } : { dealId: null, dealName: null, unmatched: `deal ${v}` };
  }
  const named = deals.filter((d) => (d.name ?? '').trim().toLowerCase() === v.toLowerCase());
  return named.length === 1 ? { dealId: named[0].id, dealName: named[0].name, unmatched: null } : { dealId: null, dealName: null, unmatched: `"${v}"` };
}

/** The open deals a HubSpot contact is on. */
export function dealsOfContact(contactId: string | null | undefined, deals: readonly DealRef[]): DealRef[] {
  const c = clean(contactId);
  return c ? deals.filter((d) => d.contactIds.includes(c)) : [];
}

/**
 * The scope of one row. `recorded` wins; else the person's single open deal; else account-level. `who` names the
 * person for the "through" label; `contactId` is their HubSpot contact id when GAP holds it.
 */
export function readScope(recorded: ScopeInput | null | undefined, deals: readonly DealRef[], person: { contactId?: string | null; who?: string | null } = {}, closed: readonly ClosedDealRef[] = []): ScopeRead {
  const division = clean(recorded?.division);
  const site = clean(recorded?.site);
  const ref = resolveDealRef(recorded?.dealId, deals);
  const where = [division ? `division ${division}` : null, site ? `site ${site}` : null].filter(Boolean).join(', ');
  if (ref.dealId) return { ...ref, division, site, basis: 'recorded', label: `Deal: ${ref.dealName ?? ref.dealId}${where ? ` (${where})` : ''}` };
  if (ref.unmatched) {
    // Sprint 5 review: a closed deal is named with its outcome, never "Deal deal 392057002"; an unknown HubSpot id is
    // said in words; a legacy deal name stays its own scope.
    const rawId = /^deal (\S+)$/.exec(ref.unmatched)?.[1] ?? null;
    const was = rawId ? closed.find((c) => c.id === rawId) : undefined;
    const label = was ? closedDealLabel(was) : rawId ? 'Deal: a deal that is not open here' : `Deal ${ref.unmatched}, not an open deal here`;
    return { ...ref, division, site, basis: 'recorded', label: `${label}${where ? ` (${where})` : ''}` };
  }
  if (division || site) return { dealId: null, dealName: null, unmatched: null, division, site, basis: 'recorded', label: where.replace(/^\w/, (c) => c.toUpperCase()) };
  const on = dealsOfContact(person.contactId, deals);
  if (on.length === 1) return { dealId: on[0].id, dealName: on[0].name, unmatched: null, division: null, site: null, basis: 'contact', label: `Deal: ${on[0].name ?? on[0].id}${person.who ? ` (through ${person.who})` : ''}` };
  return { dealId: null, dealName: null, unmatched: null, division: null, site: null, basis: 'none', label: ACCOUNT_LEVEL };
}

/** A BID's recorded scope (`metadata.scope`), tolerant of anything else stored there. */
export function bidScopeInput(metadata: unknown): ScopeInput | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const s = (metadata as Record<string, unknown>).scope;
  if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
  const o = s as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null);
  const out = { dealId: str(o.dealId), division: str(o.division), site: str(o.site) };
  return out.dealId || out.division || out.site ? out : null;
}

/** Normalize a scope from a request body (null when nothing is named). */
export function scopeFromBody(b: { dealId?: string | null; division?: string | null; site?: string | null } | null | undefined): ScopeInput | null {
  if (!b) return null;
  const out = { dealId: clean(b.dealId)?.slice(0, 64) ?? null, division: clean(b.division)?.slice(0, 120) ?? null, site: clean(b.site)?.slice(0, 120) ?? null };
  return out.dealId || out.division || out.site ? out : null;
}

/**
 * Split rows by opportunity: each open deal gets ONLY its own rows; account-level rows are their own group (shown
 * with the "account-level" label beside any deal, never as that deal's); rows scoped to something that is not an open
 * deal here (a closed deal, an unmatched name, a division or site) are `elsewhere`, shown with their label.
 */
export function partitionByDeal<T>(rows: readonly T[], scopeOf: (row: T) => ScopeRead, dealIds: readonly string[]): { byDeal: Map<string, Array<T & { scope: ScopeRead }>>; accountLevel: Array<T & { scope: ScopeRead }>; elsewhere: Array<T & { scope: ScopeRead }> } {
  const byDeal = new Map<string, Array<T & { scope: ScopeRead }>>(dealIds.map((id) => [id, []]));
  const accountLevel: Array<T & { scope: ScopeRead }> = [];
  const elsewhere: Array<T & { scope: ScopeRead }> = [];
  for (const r of rows) {
    const scope = scopeOf(r);
    const row = { ...r, scope };
    if (scope.dealId && byDeal.has(scope.dealId)) byDeal.get(scope.dealId)!.push(row);
    else if (scope.basis === 'none') accountLevel.push(row);
    else elsewhere.push(row);
  }
  return { byDeal, accountLevel, elsewhere };
}
