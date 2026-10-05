/**
 * LEGACY SUPPRESSION REVIEW (WHO truth, 2026-10-05).
 *
 * The seller must see WHY a person is blocked and WHAT WOULD HAVE TO BE TRUE to clear it, from every source
 * listed with its verdict, and may clear ONE thing: the stale local Modex flag (`personas.do_not_contact` and the
 * historical `email_status = 'bounced'` written by the March 2026 Resend-era wave, bounce type never recorded).
 * The case: Isaac Scott, persona 13 at PepsiCo (docs/gap/OWNER_RESOLUTION.md), two bounces on 2026-03-27 then
 * three deliveries to the same address, no unsubscribe, HubSpot clean, clawd blocking for exactly
 * `modex_do_not_contact`, which is this record echoed back.
 *
 * Four classes:
 *   CONFIRMED_SUPPRESSION   a HARD hit anywhere: an unsubscribed_emails row; a HubSpot opt-out, bad address, hard
 *                           bounce reason or quarantine; a clawd contract key other than modex_do_not_contact
 *                           (clawd_do_not_send, hubspot, sendgrid, verbal, or anything unrecognized: fail closed);
 *                           an email-log hard bounce that no later delivery to the same address contradicts; a hard
 *                           local status (hard_bounce, hard_bounced, invalid). Never cleared here.
 *   UNRESOLVED              an authority could not be read (contract unreadable, unknown legs, HubSpot unreadable
 *                           while a contact id exists, no email to ask about), the planes disagree, or the local
 *                           flag has no later-delivery evidence behind it. Never cleared on an unread authority.
 *   LEGACY_CONFLICT         the local flag only, the contract echoing exactly that flag, no hard hit anywhere, and
 *                           at least one delivery / open / click / reply to the exact same address dated after the
 *                           last bounce. The only class whose clear is allowed, and only on Casey's confirmed click.
 *   CLEAR                   nothing anywhere.
 *
 * The clawd contract is read LIVE for every review and again at click time; anything odd is 'unreadable' and
 * fails closed. Gmail DSNs are reported as not read (never wired here; never a hit, never clear).
 *
 * The clear writes the SAME raw SQL as scripts/gap/correct-historical-suppression.ts and deliberately does NOT
 * touch updated_at: the sync-hubspot cron pushes every persona updated in the last 6 hours to HubSpot, and this
 * surface is not authorized to write HubSpot. One transaction: the update and one `suppression.corrected` audit
 * row carrying the full receipt. A refusal writes one `suppression.correction_refused` row and nothing else.
 * It never touches unsubscribed_emails, HubSpot, clawd, any other persona, and never sends anything.
 *
 * The send-time wire gate (src/lib/email/suppression-gate.ts) and routing provenance (./provenance.ts) are
 * untouched: a cleared local flag is still re-read on every plane before any email leaves.
 *
 * House `prisma: any` glue.
 */
import { CLEAR_LEGACY_FLAG_SQL, clearLegacyLocalFlagRow } from '@/lib/email/suppression-correction';
import { CLAWD_CONTRACT_PATH } from '../../email/suppression-gate';
import { HARD_INVALID_STATUSES, MODEX_LEG, SOFT_HISTORICAL_STATUSES } from './provenance';
import { CLEAR_TOUCHES, clearWhy, SOURCE_LABEL, whatWouldClearLines, whyBlockedLines, type ReviewFacts } from './legacy-review-copy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type SuppressionReviewClass = 'CONFIRMED_SUPPRESSION' | 'LEGACY_CONFLICT' | 'UNRESOLVED' | 'CLEAR';

export type SuppressionSourceName =
  | 'modex_flag'
  | 'modex_email_status'
  | 'unsubscribed_emails'
  | 'hubspot_optout'
  | 'hubspot_bounce'
  | 'clawd_contract'
  | 'email_log_bounces'
  | 'email_log_deliveries'
  | 'gap_ledger'
  | 'override_history'
  | 'gmail_dsn';

/**
 * One source, one verdict. `hit` = this source says do not contact (hard when it can never be cleared here);
 * `clear` = this source does not block; `unknown` = an authority that exists could not be read (fails closed);
 * `not_read` = not applicable or not wired (no HubSpot id, Gmail DSN), neither a hit nor a reason to wait.
 */
export interface SuppressionSourceRead {
  source: SuppressionSourceName;
  verdict: 'hit' | 'clear' | 'unknown' | 'not_read';
  detail: string;
  at?: string | null;
  hard: boolean;
}

export interface SuppressionReview {
  personaId: number;
  name: string;
  accountName: string;
  email: string | null;
  class: SuppressionReviewClass;
  sources: SuppressionSourceRead[];
  /** Seller sentences. */
  whyBlocked: string[];
  /** Seller sentences: what would have to be true. */
  whatWouldClear: string[];
  /** Deliveries to the exact same address AFTER the last bounce. */
  laterDeliveries: Array<{ at: string; subject: string | null; status: string }>;
  lastBounceAt: string | null;
  /** Prior suppression.corrected / correction_reverted / refusals / owner decisions for this persona. */
  humanDecisions: Array<{ kind: string; actor: string; at: string; note: string | null }>;
  /** Allowed only for LEGACY_CONFLICT; touches names exactly the local fields that would change. */
  clear: { allowed: boolean; touches: string[]; why: string };
  readAt: string;
}

export interface ContractRead {
  blocked: boolean;
  reason: string | null;
  keys: string[];
  unknownLegs: string[];
  legsRead: Record<string, boolean>;
}

export interface HubSpotSuppressionProps {
  optedOut: boolean | null;
  badAddress: boolean | null;
  hardBounceReason: string | null;
  quarantined: boolean | null;
}

export interface SuppressionReviewDeps {
  /** Default: the clawd contract over fetch (CLAWD_CONTROL_PLANE_URL / CLAWD_CONTROL_PLANE_TOKEN, 12 s), 'unreadable' on anything odd. */
  contract?: (email: string) => Promise<ContractRead | 'unreadable'>;
  /** Default: contacts.basicApi.getById with the four suppression properties; null when no contact id; 'unreadable' on error or no token. */
  hubspot?: (contactId: string) => Promise<HubSpotSuppressionProps | 'unreadable' | null>;
  /** Default: 'not_read' (Gmail is not wired here; reported, never assumed). */
  gmailDsn?: (email: string) => Promise<{ found: number; newestAt: string | null } | 'not_read'>;
  now?: Date;
}

/** Local email statuses that are not a block on their own (anything not hard and not the historical bounce). */
const DELIVERY_STATUSES = new Set(['delivered', 'opened', 'clicked', 'replied']);

/** The ledger kinds that count as a prior human decision about this person. */
const DECISION_KINDS = ['suppression.reviewed', 'suppression.corrected', 'suppression.correction_reverted', 'suppression.correction_refused', 'person.employment_corrected', 'person.imported_from_hubspot', 'decision.human_action'];

export const REVIEW_TIMEOUT_MS = 12_000;

const HUBSPOT_PROPS = ['hs_email_optout', 'hs_email_bad_address', 'hs_email_hard_bounce_reason_enum', 'hs_email_quarantined'];

const iso = (d: Date | string | null | undefined): string | null => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

const normEmail = (e: unknown): string | null => {
  const s = String(e ?? '').trim().toLowerCase();
  return s.includes('@') ? s : null;
};

/* ----------------------------------------------------------------------------------------------------------------
 * Default authority reads. Both are injectable so tests never touch the network.
 * ------------------------------------------------------------------------------------------------------------- */

export interface ClawdContractReadOptions {
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
}

/** The same path, body and bearer as the send gate and the routing read, so the three cannot drift. */
export function createClawdContractRead(opts: ClawdContractReadOptions = {}): (email: string) => Promise<ContractRead | 'unreadable'> {
  return async (rawEmail) => {
    try {
      const env = opts.env ?? process.env;
      const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
      const base = env.CLAWD_CONTROL_PLANE_URL?.trim();
      const token = env.CLAWD_CONTROL_PLANE_TOKEN?.trim();
      const email = normEmail(rawEmail);
      if (!email || !base || !token || typeof fetchImpl !== 'function') return 'unreadable';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? REVIEW_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetchImpl(`${base.replace(/\/+$/, '')}${CLAWD_CONTRACT_PATH}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ emails: [email], automated: true }),
          cache: 'no-store',
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) return 'unreadable';
      const d = (await res.json()) as { ok?: unknown; results?: unknown; legs_read?: unknown } | null;
      if (!d || typeof d !== 'object' || d.ok !== true || !Array.isArray(d.results) || d.results.length !== 1) return 'unreadable';
      const r = d.results[0] as { email?: unknown; blocked?: unknown; reason?: unknown; keys?: unknown; unknown_legs?: unknown } | null;
      if (!r || typeof r !== 'object' || normEmail(r.email) !== email || typeof r.blocked !== 'boolean') return 'unreadable';
      const legsRead: Record<string, boolean> = {};
      if (d.legs_read && typeof d.legs_read === 'object' && !Array.isArray(d.legs_read)) {
        for (const [name, readable] of Object.entries(d.legs_read as Record<string, unknown>)) legsRead[name] = readable === true;
      }
      const keys = Array.isArray(r.keys) ? r.keys.filter((k): k is string => typeof k === 'string' && k.length > 0 && !k.includes('@')) : [];
      const unknownLegs = Array.isArray(r.unknown_legs) ? r.unknown_legs.filter((k): k is string => typeof k === 'string' && k.length > 0) : [];
      const reason = typeof r.reason === 'string' && r.reason.trim() ? r.reason.trim() : null;
      return { blocked: r.blocked, reason, keys, unknownLegs, legsRead };
    } catch {
      return 'unreadable';
    }
  };
}

interface HubSpotClientLike {
  crm: { contacts: { basicApi: { getById: (id: string, properties: string[]) => Promise<{ properties?: Record<string, string | null | undefined> } | null> } } };
}

export interface HubSpotSuppressionReadOptions {
  /** The SDK client; default is getHubSpotClient (loaded lazily so this module stays light without the SDK). */
  client?: () => Promise<HubSpotClientLike>;
  env?: Record<string, string | undefined>;
}

const flag = (v: string | null | undefined): boolean | null => {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return null;
};

export function createHubSpotSuppressionRead(opts: HubSpotSuppressionReadOptions = {}): (contactId: string) => Promise<HubSpotSuppressionProps | 'unreadable' | null> {
  return async (contactId) => {
    const id = String(contactId ?? '').trim();
    if (!id) return null;
    const env = opts.env ?? process.env;
    if (!env.HUBSPOT_ACCESS_TOKEN) return 'unreadable';
    try {
      const client = opts.client
        ? await opts.client()
        : await (async () => {
            const mod = await import('@/lib/hubspot/client');
            return mod.getHubSpotClient() as unknown as HubSpotClientLike;
          })();
      const r = await client.crm.contacts.basicApi.getById(id, HUBSPOT_PROPS);
      if (!r) return 'unreadable';
      const p = r.properties ?? {};
      const reason = String(p.hs_email_hard_bounce_reason_enum ?? '').trim();
      return { optedOut: flag(p.hs_email_optout), badAddress: flag(p.hs_email_bad_address), hardBounceReason: reason || null, quarantined: flag(p.hs_email_quarantined) };
    } catch {
      return 'unreadable';
    }
  };
}

/* ----------------------------------------------------------------------------------------------------------------
 * Classification (pure).
 * ------------------------------------------------------------------------------------------------------------- */

export interface ClassifyFacts {
  /** do_not_contact true and/or email_status 'bounced' on the GAP record. */
  localFlag: boolean;
  /** Deliveries to the exact same address dated after the last bounce. */
  laterDeliveries: number;
}

/**
 * Pure. Precedence: any HARD hit wins; then any unread authority; then the local flag with (LEGACY_CONFLICT) or
 * without (UNRESOLVED) later-delivery evidence; then any other non-hard hit (UNRESOLVED, review it); then CLEAR.
 * A `not_read` source is neither a hit nor a reason to wait. The planes disagreeing (the local do-not-contact flag
 * set while the contract answers clear) is folded in by the loader as an `unknown` contract verdict.
 */
export function classifySuppressionReview(sources: SuppressionSourceRead[], facts: ClassifyFacts): SuppressionReviewClass {
  if (sources.some((s) => s.verdict === 'hit' && s.hard)) return 'CONFIRMED_SUPPRESSION';
  if (sources.some((s) => s.verdict === 'unknown')) return 'UNRESOLVED';
  if (facts.localFlag) return facts.laterDeliveries > 0 ? 'LEGACY_CONFLICT' : 'UNRESOLVED';
  if (sources.some((s) => s.verdict === 'hit')) return 'UNRESOLVED';
  return 'CLEAR';
}

/* ----------------------------------------------------------------------------------------------------------------
 * The review.
 * ------------------------------------------------------------------------------------------------------------- */

interface PersonaRow {
  id: number;
  name: string;
  account_name: string;
  email: string | null;
  do_not_contact: boolean;
  email_status: string | null;
  hubspot_contact_id: string | null;
}

interface LogRow {
  status: string;
  bounce_type: string | null;
  sent_at: Date | string;
  delivered_at: Date | string | null;
  subject: string | null;
  reply_count?: number | null;
}

async function readPersona(prisma: PrismaLike, personaId: number): Promise<PersonaRow | null> {
  const p = await prisma.persona.findUnique({ where: { id: personaId }, select: { id: true, name: true, account_name: true, email: true, do_not_contact: true, email_status: true, hubspot_contact_id: true } });
  return p ? (p as PersonaRow) : null;
}

export async function loadSuppressionReview(prisma: PrismaLike, personaId: number, deps: SuppressionReviewDeps = {}): Promise<SuppressionReview | null> {
  const persona = await readPersona(prisma, personaId);
  if (!persona) return null;
  return reviewPersona(prisma, persona, deps);
}

async function reviewPersona(prisma: PrismaLike, persona: PersonaRow, deps: SuppressionReviewDeps): Promise<SuppressionReview> {
  const now = deps.now ?? new Date();
  const email = normEmail(persona.email);
  const contactId = String(persona.hubspot_contact_id ?? '').trim() || null;
  const readContract = deps.contract ?? createClawdContractRead();
  const readHubSpot = deps.hubspot ?? createHubSpotSuppressionRead();
  const readDsn = deps.gmailDsn ?? (async () => 'not_read' as const);

  const [unsub, logs, ledger, contract, hubspot, dsn] = await Promise.all([
    email ? (prisma.unsubscribedEmail.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { email: true, unsubscribed_at: true, reason: true } }) as Promise<{ email: string; unsubscribed_at: Date | string; reason: string | null } | null>) : Promise.resolve(null),
    email ? (prisma.emailLog.findMany({ where: { to_email: { equals: email, mode: 'insensitive' } }, select: { status: true, bounce_type: true, sent_at: true, delivered_at: true, subject: true, reply_count: true }, orderBy: { sent_at: 'asc' } }) as Promise<LogRow[]>) : Promise.resolve([] as LogRow[]),
    prisma.gapAuditEvent.findMany({ where: { subject_type: 'persona', subject_id: String(persona.id), kind: { in: DECISION_KINDS } }, select: { id: true, kind: true, actor: true, created_at: true, payload: true }, orderBy: { created_at: 'asc' } }) as Promise<Array<{ id: string; kind: string; actor: string; created_at: Date | string; payload: Record<string, unknown> | null }>>,
    email ? readContract(email).catch(() => 'unreadable' as const) : Promise.resolve('no_email' as const),
    contactId ? readHubSpot(contactId).catch(() => 'unreadable' as const) : Promise.resolve(null),
    email ? readDsn(email).catch(() => 'not_read' as const) : Promise.resolve('not_read' as const),
  ]);

  const status = (persona.email_status ?? '').trim().toLowerCase();
  const doNotContact = persona.do_not_contact === true;
  const softStatus = SOFT_HISTORICAL_STATUSES.has(status);
  const hardStatus = HARD_INVALID_STATUSES.has(status);
  const localFlag = doNotContact || softStatus;

  // Email log: the last bounce, and every delivery to the same address after it.
  const bounces = logs.filter((l) => String(l.status).toLowerCase() === 'bounced');
  const lastBounce = bounces.reduce<LogRow | null>((best, l) => (!best || new Date(l.sent_at).getTime() > new Date(best.sent_at).getTime() ? l : best), null);
  const lastBounceAt = lastBounce ? iso(lastBounce.sent_at) : null;
  const lastBounceMs = lastBounceAt ? new Date(lastBounceAt).getTime() : null;
  const deliveries = logs.filter((l) => DELIVERY_STATUSES.has(String(l.status).toLowerCase()) || (l.reply_count ?? 0) > 0);
  const laterDeliveries = deliveries
    .filter((l) => lastBounceMs !== null && new Date(l.delivered_at ?? l.sent_at).getTime() > lastBounceMs)
    .map((l) => ({ at: iso(l.delivered_at ?? l.sent_at) as string, subject: l.subject ?? null, status: String(l.status) }))
    .sort((a, b) => a.at.localeCompare(b.at));
  const hardBounces = bounces.filter((l) => String(l.bounce_type ?? '').toLowerCase() === 'hard');
  const hardBounceStands = hardBounces.some((h) => !deliveries.some((d) => new Date(d.delivered_at ?? d.sent_at).getTime() > new Date(h.sent_at).getTime()));

  const sources: SuppressionSourceRead[] = [];

  sources.push({ source: 'modex_flag', verdict: doNotContact ? 'hit' : 'clear', detail: doNotContact ? 'do_not_contact is true on the GAP record' : 'do_not_contact is false on the GAP record', hard: false });

  sources.push({
    source: 'modex_email_status',
    verdict: hardStatus || softStatus ? 'hit' : 'clear',
    detail: hardStatus ? `email_status is '${status}', a proven bad address` : softStatus ? `email_status is '${status}', the historical March 2026 Resend-era value (bounce type never recorded)` : `email_status is '${status || 'unverified'}'`,
    hard: hardStatus,
  });

  sources.push(
    unsub
      ? { source: 'unsubscribed_emails', verdict: 'hit', detail: `an unsubscribe row exists for ${unsub.email}${unsub.reason ? ` (${unsub.reason})` : ''}`, at: iso(unsub.unsubscribed_at), hard: true }
      : { source: 'unsubscribed_emails', verdict: email ? 'clear' : 'not_read', detail: email ? 'no unsubscribe row for this address' : 'no email on the record', hard: false },
  );

  if (!contactId) {
    sources.push({ source: 'hubspot_optout', verdict: 'not_read', detail: 'no HubSpot contact linked to this record', hard: false });
    sources.push({ source: 'hubspot_bounce', verdict: 'not_read', detail: 'no HubSpot contact linked to this record', hard: false });
  } else if (hubspot === 'unreadable' || hubspot === null) {
    sources.push({ source: 'hubspot_optout', verdict: 'unknown', detail: `HubSpot contact ${contactId} could not be read`, hard: false });
    sources.push({ source: 'hubspot_bounce', verdict: 'unknown', detail: `HubSpot contact ${contactId} could not be read`, hard: false });
  } else {
    sources.push(hubspot.optedOut === true ? { source: 'hubspot_optout', verdict: 'hit', detail: `hs_email_optout is true on HubSpot contact ${contactId}`, hard: true } : { source: 'hubspot_optout', verdict: 'clear', detail: `hs_email_optout is ${hubspot.optedOut === null ? 'not set' : 'false'} on HubSpot contact ${contactId}`, hard: false });
    const bad: string[] = [];
    if (hubspot.badAddress === true) bad.push('hs_email_bad_address is true');
    if (hubspot.hardBounceReason) bad.push(`hs_email_hard_bounce_reason_enum is ${hubspot.hardBounceReason}`);
    if (hubspot.quarantined === true) bad.push('hs_email_quarantined is true');
    sources.push(bad.length ? { source: 'hubspot_bounce', verdict: 'hit', detail: bad.join('; '), hard: true } : { source: 'hubspot_bounce', verdict: 'clear', detail: `no bad address, hard bounce reason or quarantine on HubSpot contact ${contactId}`, hard: false });
  }

  let contractAgrees = true;
  if (contract === 'no_email') {
    sources.push({ source: 'clawd_contract', verdict: 'unknown', detail: 'no email on the record, so the contract could not be asked', hard: false });
  } else if (contract === 'unreadable') {
    sources.push({ source: 'clawd_contract', verdict: 'unknown', detail: 'the contract did not answer (unreadable, timed out, or malformed)', hard: false });
  } else {
    const legsNotRead = [...new Set([...contract.unknownLegs, ...Object.entries(contract.legsRead).filter(([, ok]) => !ok).map(([n]) => n)])];
    const legsSeen = Object.keys(contract.legsRead);
    const legsLine = legsSeen.length ? `legs read: ${legsSeen.filter((n) => contract.legsRead[n]).join(', ') || 'none'}` : 'legs read: not reported';
    if (legsNotRead.length > 0) {
      sources.push({ source: 'clawd_contract', verdict: 'unknown', detail: `unread legs: ${legsNotRead.join(', ')}; ${legsLine}`, hard: false });
    } else if (!contract.blocked) {
      if (doNotContact) {
        contractAgrees = false;
        sources.push({ source: 'clawd_contract', verdict: 'unknown', detail: `clawd answers clear while the local do_not_contact flag is set; the planes disagree (${legsLine})`, hard: false });
      } else {
        sources.push({ source: 'clawd_contract', verdict: 'clear', detail: `not blocked on any leg (${legsLine})`, hard: false });
      }
    } else {
      const keys = contract.keys.length ? [...new Set(contract.keys)] : contract.reason ? [contract.reason] : [];
      const others = keys.filter((k) => k !== MODEX_LEG && k !== 'modex');
      const onlyModex = keys.length > 0 && others.length === 0;
      if (onlyModex) {
        sources.push({ source: 'clawd_contract', verdict: 'hit', detail: `blocked, keys exactly [${keys.join(', ')}]: the local flag echoed back through the modex leg (${legsLine})`, hard: false });
      } else {
        // Fail closed: a key we cannot name is read as the strongest kind.
        sources.push({ source: 'clawd_contract', verdict: 'hit', detail: `blocked, keys [${keys.join(', ') || contract.reason || 'none named'}]${others.length ? `; beyond the local flag: ${others.join(', ')}` : '; no key named (fail closed)'} (${legsLine})`, hard: true });
      }
    }
  }

  sources.push(
    bounces.length === 0
      ? { source: 'email_log_bounces', verdict: email ? 'clear' : 'not_read', detail: email ? 'no bounce on record for this address' : 'no email on the record', hard: false }
      : hardBounceStands
        ? { source: 'email_log_bounces', verdict: 'hit', detail: `${hardBounces.length} hard bounce${hardBounces.length === 1 ? '' : 's'} on record, none contradicted by a later delivery`, at: iso(hardBounces[hardBounces.length - 1].sent_at), hard: true }
        : { source: 'email_log_bounces', verdict: 'hit', detail: `${bounces.length} bounce${bounces.length === 1 ? '' : 's'} on record (bounce type ${hardBounces.length ? 'hard, contradicted by a later delivery' : 'never recorded'}), the last on ${lastBounceAt?.slice(0, 10) ?? 'an unknown date'}`, at: lastBounceAt, hard: false },
  );

  sources.push({
    source: 'email_log_deliveries',
    verdict: email ? 'clear' : 'not_read',
    detail: !email ? 'no email on the record' : laterDeliveries.length ? `${laterDeliveries.length} deliver${laterDeliveries.length === 1 ? 'y' : 'ies'} to this exact address after the last bounce (${laterDeliveries.map((d) => d.at.slice(0, 10)).join(', ')})` : lastBounceAt ? 'no delivery to this address after the last bounce' : `${deliveries.length} deliver${deliveries.length === 1 ? 'y' : 'ies'} on record, no bounce to contradict`,
    at: laterDeliveries.length ? laterDeliveries[laterDeliveries.length - 1].at : null,
    hard: false,
  });

  const humanDecisions = ledger.map((e) => ({ kind: e.kind, actor: e.actor, at: iso(e.created_at) as string, note: noteOf(e.payload) }));
  const reviews = ledger.filter((e) => e.kind === 'suppression.reviewed' || e.kind === 'suppression.correction_refused' || e.kind.startsWith('person.') || e.kind === 'decision.human_action');
  sources.push({ source: 'gap_ledger', verdict: 'clear', detail: reviews.length ? `${reviews.length} prior entr${reviews.length === 1 ? 'y' : 'ies'}: ${reviews.map((e) => `${e.kind} by ${e.actor} on ${iso(e.created_at)?.slice(0, 10)}`).join('; ')}` : 'no prior review, refusal or owner decision on this record', at: reviews.length ? iso(reviews[reviews.length - 1].created_at) : null, hard: false });

  const overrides = ledger.filter((e) => e.kind === 'suppression.corrected' || e.kind === 'suppression.correction_reverted');
  const lastOverride = overrides[overrides.length - 1];
  sources.push({ source: 'override_history', verdict: 'clear', detail: overrides.length ? `${overrides.length} prior clear${overrides.length === 1 ? '' : 's'} or revert${overrides.length === 1 ? '' : 's'}; the latest is ${lastOverride.kind === 'suppression.correction_reverted' ? 'a clear that was reverted (the flag was restored on purpose)' : 'a clear'} by ${lastOverride.actor} on ${iso(lastOverride.created_at)?.slice(0, 10)}` : 'the flag was never cleared or reverted before', at: lastOverride ? iso(lastOverride.created_at) : null, hard: false });

  sources.push(
    dsn === 'not_read'
      ? { source: 'gmail_dsn', verdict: 'not_read', detail: 'Gmail was not read for this review (the March sends went through Resend, not Gmail)', hard: false }
      : dsn.found > 0
        ? { source: 'gmail_dsn', verdict: 'hit', detail: `${dsn.found} delivery failure notice${dsn.found === 1 ? '' : 's'} in Gmail`, at: dsn.newestAt, hard: false }
        : { source: 'gmail_dsn', verdict: 'clear', detail: 'no delivery failure notice in Gmail', hard: false },
  );

  const cls = classifySuppressionReview(sources, { localFlag, laterDeliveries: laterDeliveries.length });
  const facts: ReviewFacts = { name: persona.name, email, localFlag, doNotContact, emailStatus: persona.email_status ?? null, lastBounceAt, laterDeliveries, contractAgrees };
  const allowed = cls === 'LEGACY_CONFLICT';
  return {
    personaId: persona.id,
    name: persona.name,
    accountName: persona.account_name,
    email,
    class: cls,
    sources,
    whyBlocked: whyBlockedLines(cls, sources, facts),
    whatWouldClear: whatWouldClearLines(cls, sources, facts),
    laterDeliveries,
    lastBounceAt,
    humanDecisions,
    clear: { allowed, touches: allowed ? [...CLEAR_TOUCHES] : [], why: clearWhy(cls) },
    readAt: now.toISOString(),
  };
}

function noteOf(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  for (const k of ['note', 'reason', 'detail', 'owner_decision']) {
    const v = payload[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/* ----------------------------------------------------------------------------------------------------------------
 * The clear.
 * ------------------------------------------------------------------------------------------------------------- */

export type ClearRefusalReason = 'persona_not_found' | 'not_confirmed' | 'email_mismatch' | 'not_legacy_conflict' | 'hard_suppression' | 'authority_unreadable' | 'row_changed';

export type ClearLegacyLocalFlagResult =
  | { ok: true; auditId: string; before: { do_not_contact: boolean; email_status: string | null }; after: { do_not_contact: false; email_status: 'unverified' }; review: SuppressionReview }
  | { ok: false; reason: ClearRefusalReason; detail: string; review: SuppressionReview | null };

export interface ClearLegacyLocalFlagInput {
  personaId: number;
  actor: string;
  now: Date;
  confirmed: true;
  expectedEmail: string;
}

/**
 * The statement itself lives beside the consent writer (src/lib/email/suppression-correction.ts): the structural
 * invariant keeps every file under src/lib/gap from writing the column, and this module only decides WHEN the one
 * governed clear may run. Re-exported for the tests and the audit payload.
 */
export { CLEAR_LEGACY_FLAG_SQL };

const CLASS_PAYLOAD: Record<SuppressionReviewClass, string> = { CONFIRMED_SUPPRESSION: 'confirmed_suppression', LEGACY_CONFLICT: 'legacy_conflict', UNRESOLVED: 'unresolved', CLEAR: 'clear' };

async function refuse(prisma: PrismaLike, input: ClearLegacyLocalFlagInput, reason: ClearRefusalReason, detail: string, review: SuppressionReview | null): Promise<ClearLegacyLocalFlagResult> {
  try {
    await prisma.gapAuditEvent.create({
      data: {
        kind: 'suppression.correction_refused',
        actor: input.actor,
        subject_type: 'persona',
        subject_id: String(input.personaId),
        payload: { reason, detail, expectedEmail: normEmail(input.expectedEmail), confirmed: input.confirmed === true, refusedAt: input.now.toISOString(), review, hubspotWritten: false, clawdWritten: false, unsubscribeTouched: false, rowsChanged: 0 },
      },
      select: { id: true },
    });
  } catch {
    // The refusal stands whether or not the ledger took it.
  }
  return { ok: false, reason, detail, review };
}

/**
 * Casey's explicit, confirmed clear of the stale local flag. Re-reads every authority LIVE at click time, refuses
 * unless the review is LEGACY_CONFLICT and the address still matches, then writes one transaction: the raw update
 * (no updated_at) and one `suppression.corrected` row carrying the full receipt. Never touches
 * unsubscribed_emails, HubSpot, clawd, or any other persona; never sends anything, never adds anyone to a sequence.
 */
export async function clearLegacyLocalFlag(prisma: PrismaLike, input: ClearLegacyLocalFlagInput, deps: SuppressionReviewDeps = {}): Promise<ClearLegacyLocalFlagResult> {
  const persona = await readPersona(prisma, input.personaId);
  if (!persona) return { ok: false, reason: 'persona_not_found', detail: `no persona ${input.personaId}`, review: null };

  const review = await reviewPersona(prisma, persona, { ...deps, now: input.now });
  if (input.confirmed !== true) return refuse(prisma, input, 'not_confirmed', 'the clear was not confirmed; nothing is cleared without the explicit confirmed click', review);

  const expected = normEmail(input.expectedEmail);
  if (!expected || !review.email || expected !== review.email) {
    return refuse(prisma, input, 'email_mismatch', `the record's address is ${review.email ?? 'missing'}, not ${expected ?? input.expectedEmail}; re-open the review and read it again before clearing`, review);
  }
  if (review.class === 'CONFIRMED_SUPPRESSION') {
    const hard = review.sources.filter((s) => s.verdict === 'hit' && s.hard).map((s) => SOURCE_LABEL[s.source]);
    return refuse(prisma, input, 'hard_suppression', `a hard-safety source says do not contact (${hard.join('; ')}). That can never be cleared here.`, review);
  }
  if (review.class === 'UNRESOLVED' && review.sources.some((s) => s.verdict === 'unknown')) {
    const unread = review.sources.filter((s) => s.verdict === 'unknown').map((s) => SOURCE_LABEL[s.source]);
    return refuse(prisma, input, 'authority_unreadable', `an authority could not be read (${unread.join('; ')}). Nothing is cleared on an unread authority.`, review);
  }
  if (review.class !== 'LEGACY_CONFLICT') {
    return refuse(prisma, input, 'not_legacy_conflict', review.class === 'CLEAR' ? 'nothing is blocked on this record; there is no flag to clear' : `the review is ${review.class.toLowerCase()}: ${review.whatWouldClear.join(' ')}`, review);
  }

  const before = { do_not_contact: persona.do_not_contact === true, email_status: persona.email_status ?? null };
  const after = { do_not_contact: false as const, email_status: 'unverified' as const };
  let auditId: string | null = null;
  try {
    auditId = await prisma.$transaction(async (tx: PrismaLike) => {
      const n: number = await clearLegacyLocalFlagRow(tx, persona.id, review.email ?? '');
      if (n !== 1) throw new RowChanged(n);
      const row = await tx.gapAuditEvent.create({
        data: {
          kind: 'suppression.corrected',
          actor: input.actor,
          subject_type: 'persona',
          subject_id: String(persona.id),
          payload: {
            email: review.email,
            account: persona.account_name,
            name: persona.name,
            before,
            after,
            class: CLASS_PAYLOAD[review.class],
            review: { class: review.class, sources: review.sources, laterDeliveries: review.laterDeliveries, lastBounceAt: review.lastBounceAt, humanDecisions: review.humanDecisions, whyBlocked: review.whyBlocked, readAt: review.readAt },
            confirmedBy: input.actor,
            correctedAt: input.now.toISOString(),
            updatedAtUntouched: true,
            hubspotWritten: false,
            clawdWritten: false,
            unsubscribeTouched: false,
            sql: CLEAR_LEGACY_FLAG_SQL,
          },
        },
        select: { id: true },
      });
      return row.id as string;
    });
  } catch (e) {
    if (e instanceof RowChanged) return refuse(prisma, input, 'row_changed', `the row changed under the click (${e.rows} rows matched, expected 1); re-open the review and read it again`, review);
    throw e;
  }
  return { ok: true, auditId: auditId as string, before, after, review };
}

class RowChanged extends Error {
  constructor(public readonly rows: number) {
    super(`expected 1 row, matched ${rows}`);
  }
}
