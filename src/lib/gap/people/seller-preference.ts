/**
 * SELLER PREFERENCE (account-first UX, UX-07, contract 5.6): the one genuinely new state the human-priority controls
 * need. "Not a fit" sets a person aside at ONE account; "Not now" sets them aside until a date. Both are stricter,
 * never looser: a preference reorders or hides among the ELIGIBLE and never clears a safety set-aside (unsubscribe,
 * opt-out, DNC, employment, a deal, a reply, a hold); the stack reads it, the send gates never do.
 *
 * Storage: the append-only GAP audit ledger (kind `person.seller_preference`, subject the persona), no new table.
 * Newest row per person at the account wins; `clear` (Undo) appends a reversal; "Not now" expires on its date. It
 * never writes `do_not_contact`.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const PERSON_SELLER_PREFERENCE = 'person.seller_preference' as const;
export const PREFERENCE_REASON_MAX = 240;
/** "Not now" never parks a person for more than a year: a longer wait is "Not a fit" or a fresh decision. */
export const NOT_NOW_MAX_DAYS = 365;
export const NOT_NOW_DEFAULT_DAYS = 30;

export type PreferenceKind = 'not_a_fit' | 'not_now';

export interface SellerPreference {
  personaId: number;
  accountName: string;
  kind: PreferenceKind;
  reason: string | null;
  /** ISO date-time the set-aside lapses (Not now only). */
  until: string | null;
  by: string;
  at: string;
}

const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const who = (by: string) => (/^casey@|^caseyglarkin/i.test(by) ? 'you' : by.replace(/@.*/, ''));

/** The one line the stack shows for a set-aside by the seller. */
export function preferenceLine(p: SellerPreference): string {
  const reason = p.reason ? ` (${p.reason})` : '';
  return p.kind === 'not_now' && p.until
    ? `Not now until ${day(p.until)}${reason}, ${who(p.by)}, ${day(p.at)}.`
    : `Not a fit here${reason}, ${who(p.by)}, ${day(p.at)}.`;
}

/** The live preferences at one account: the newest row per person, a `clear` or an expired "Not now" reads as none. */
export async function loadSellerPreferences(prisma: PrismaLike, accountName: string, now: Date = new Date()): Promise<Map<number, SellerPreference>> {
  const out = new Map<number, SellerPreference>();
  const seen = new Set<number>();
  const rows: Array<{ subject_id: string; actor: string; payload: Record<string, unknown>; created_at: Date }> = await prisma.gapAuditEvent.findMany({
    where: { kind: PERSON_SELLER_PREFERENCE, subject_type: 'persona', payload: { path: ['accountName'], equals: accountName } },
    select: { subject_id: true, actor: true, payload: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  for (const r of rows) {
    const id = Number(r.subject_id);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    const kind = r.payload?.kind;
    if (kind !== 'not_a_fit' && kind !== 'not_now') continue; // 'clear' or unknown: no live preference
    const until = typeof r.payload?.until === 'string' ? r.payload.until : null;
    if (kind === 'not_now' && (!until || new Date(until).getTime() <= now.getTime())) continue; // lapsed
    const reason = typeof r.payload?.reason === 'string' && r.payload.reason.trim() ? r.payload.reason.trim() : null;
    out.set(id, { personaId: id, accountName, kind, reason, until: kind === 'not_now' ? until : null, by: r.actor, at: new Date(r.created_at).toISOString() });
  }
  return out;
}

export type PreferenceRefusal = 'persona_not_found' | 'reason_too_long' | 'until_required' | 'until_in_past' | 'until_too_far';

/**
 * Record a preference (append-only). `clear` is Undo: it appends a reversal and never deletes. A "Not now" needs a
 * date in the future and within NOT_NOW_MAX_DAYS. Nothing here touches do_not_contact, HubSpot or any send path.
 */
export async function setSellerPreference(
  prisma: PrismaLike,
  input: { personaId: number; kind: PreferenceKind | 'clear'; reason?: string | null; until?: string | null; actor: string; now?: Date },
): Promise<{ ok: true; preference: SellerPreference | null } | { ok: false; reason: PreferenceRefusal }> {
  const now = input.now ?? new Date();
  const persona: { id: number; account_name: string } | null = await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, account_name: true } });
  if (!persona) return { ok: false, reason: 'persona_not_found' };
  const reason = (input.reason ?? '').replace(/\s+/g, ' ').trim();
  if (reason.length > PREFERENCE_REASON_MAX) return { ok: false, reason: 'reason_too_long' };
  let until: string | null = null;
  if (input.kind === 'not_now') {
    if (!input.until) return { ok: false, reason: 'until_required' };
    const t = new Date(input.until);
    if (Number.isNaN(t.getTime()) || t.getTime() <= now.getTime()) return { ok: false, reason: 'until_in_past' };
    if (t.getTime() - now.getTime() > NOT_NOW_MAX_DAYS * 86_400_000) return { ok: false, reason: 'until_too_far' };
    until = t.toISOString();
  }
  const row = await prisma.gapAuditEvent.create({
    data: {
      kind: PERSON_SELLER_PREFERENCE,
      actor: input.actor,
      subject_type: 'persona',
      subject_id: String(input.personaId),
      payload: { accountName: persona.account_name, kind: input.kind, reason: reason || null, until, source: 'human' },
    },
    select: { created_at: true },
  });
  const at = new Date(row?.created_at ?? now).toISOString();
  if (input.kind === 'clear') return { ok: true, preference: null };
  return { ok: true, preference: { personaId: input.personaId, accountName: persona.account_name, kind: input.kind, reason: reason || null, until, by: input.actor, at } };
}
