/**
 * THE CONTACT PACKET (the Gmail action UI audit, GUI-03, 2026-10-10). Server only; nothing here writes.
 *
 * What an assignment says about a person so the seller can act from Gmail: name, title, company, the address with its
 * status, the phones each with its KIND (mobile, direct, main line) and where it came from and when it was updated,
 * the time zone, LinkedIn, and the HubSpot contact, company and deal links. Read from the persona row GAP holds
 * (people/stack.ts's source), the account's HubSpot company id, the cached in-deals summary, and, OPTIONALLY, one
 * bounded live HubSpot contact read (the contact's own phone, mobile, title, LinkedIn and time zone; cached in
 * SystemConfig for CONTACT_LIVE_CACHE_MS, the engagements reader's pattern) through `deps.hubspotContact`.
 *
 * Rules (pinned by tests/unit/gap/gui-contact-packet.test.ts):
 *   - a value GAP does not hold is `null` and the renderer says "unavailable"; nothing is guessed: no number from a
 *     pattern, no identity from a name alone, no LinkedIn below the confidence floor, no company main line from an
 *     email domain (an address domain is where mail goes, not a switchboard)
 *   - a person-level number is never labelled a main line; `main` is reserved for a company-level number (none is
 *     read here today, so no packet carries one)
 *   - the live read is optional: absent (tests, no token) the packet stands on the stored row and says its source
 */
import { DEFAULT_HUBSPOT_PORTAL_ID } from '../routing/seller-action';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Read lazily (not captured at module load) so tests can stub the env var. */
const portalId = () => process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || process.env.HUBSPOT_PORTAL_ID || DEFAULT_HUBSPOT_PORTAL_ID;
/** The HubSpot record links the audit asked for: /record/0-1 (contact), /record/0-2 (company), /record/0-3 (deal). */
export const hubspotRecordUrl = (object: 'contact' | 'company' | 'deal', id: string): string => `https://app.hubspot.com/contacts/${portalId()}/record/${object === 'contact' ? '0-1' : object === 'company' ? '0-2' : '0-3'}/${encodeURIComponent(id)}`;

export type PhoneKind = 'mobile' | 'direct' | 'main';

export interface ContactPhone {
  kind: PhoneKind;
  value: string;
  /** Where the number came from, in words ("GAP contact record, status verified"; "HubSpot contact"). */
  source: string;
  /** When that source last updated it (ISO), or null when the source does not say. */
  updatedAt: string | null;
}

export interface ContactPacket {
  name: string;
  title: string | null;
  company: string;
  email: string | null;
  /** The persona row's email_status ("verified", "unverified", "bounced", ...), or null with no address. */
  emailStatus: string | null;
  phones: ContactPhone[];
  timezone: string | null;
  linkedin: string | null;
  hubspotContactUrl: string | null;
  hubspotCompanyUrl: string | null;
  dealUrls: Array<{ name: string; url: string }>;
  /** What the packet was read from, in words ("GAP contact record 980 and the HubSpot contact, read live"). */
  source: string;
  /** The newest update among its sources (ISO), or null. */
  updatedAt: string | null;
  /** GUI-06: the relationship word the packet carries on the Who line ("buyer", "vendor pitching us", ...); set by the caller. */
  purpose?: string | null;
}

/** The persona row fields this projection reads (the Prisma select). */
export const PERSONA_CONTACT_SELECT = { id: true, name: true, title: true, email: true, email_status: true, phone: true, phone_status: true, linkedin_url: true, linkedin_confidence: true, hubspot_contact_id: true, account_name: true, updated_at: true, do_not_contact: true } as const;

export interface PersonaContactRow {
  id: number;
  name: string;
  title: string | null;
  email: string | null;
  email_status: string | null;
  phone: string | null;
  phone_status: string | null;
  linkedin_url: string | null;
  linkedin_confidence: number | null;
  hubspot_contact_id: string | null;
  account_name: string;
  updated_at: Date | string | null;
  do_not_contact?: boolean;
}

/** A LinkedIn URL below this confidence is not shown (a guessed profile is worse than none). */
export const LINKEDIN_CONFIDENCE_FLOOR = 50;
/** A persona phone with one of these statuses is not shown as a number to dial. */
const PHONE_DEAD = new Set(['invalid', 'disconnected', 'wrong_number', 'wrong number', 'bad']);

/** The live HubSpot contact fields the packet reads (one contact, bounded, optional). */
export interface HubSpotContactLive {
  phone: string | null;
  mobilephone: string | null;
  jobtitle: string | null;
  linkedin: string | null;
  timezone: string | null;
  /** HubSpot lastmodifieddate (ISO) when returned. */
  updatedAt: string | null;
}

export interface ContactPacketDeps {
  /** A live HubSpot contact read by id; absent (tests, no token) means the stored row alone. Never throws through. */
  hubspotContact?: ((contactId: string) => Promise<HubSpotContactLive | null>) | null;
  /** The account's open deals (id, name); absent means none listed (the caller hands down the in-deals summary it holds). */
  deals?: (accountName: string) => Promise<Array<{ id?: string | null; name: string | null }>>;
}

export interface ContactPacketQuery {
  personaId?: number | null;
  email?: string | null;
  name?: string | null;
  accountName: string;
  now: Date;
}

export const CONTACT_LIVE_CACHE_MS = 30 * 60_000;
export const contactLiveCacheKey = (contactId: string) => `gap:contact-live:${contactId}`;
const CONTACT_PROPS = ['firstname', 'lastname', 'jobtitle', 'phone', 'mobilephone', 'hs_linkedin_url', 'linkedin_url', 'linkedinbio', 'hs_timezone', 'lastmodifieddate'];

const clean = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
const iso = (d: unknown): string | null => {
  if (!(d instanceof Date) && typeof d !== 'string') return null;
  const t = new Date(d as string);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
};
const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
/** "Morrison, Craig" and "craig morrison" are one key; digits stay (two scratch people are two). */
const nameKey = (s: string | null | undefined) => lower(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
/** A LinkedIn profile URL and nothing else (a company page or a search link is not the person's profile). */
const LINKEDIN_PROFILE = /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^\s/?#]+\/?(?:[?#].*)?$/i;

/**
 * The default live read: HubSpot's own contact record, by id, one call, through the SDK the people reader uses,
 * cached per contact in SystemConfig (the engagements reader's shape). Without a token: null, said by the caller as
 * "not read". Never throws.
 */
export async function readHubSpotContactLive(prisma: PrismaLike, contactId: string, now: Date, deps: { fetchContact?: (id: string, props: string[]) => Promise<Record<string, string | null | undefined> | null>; configured?: boolean } = {}): Promise<HubSpotContactLive | null> {
  if (!/^\d+$/.test(contactId)) return null;
  const configured = deps.configured ?? !!process.env.HUBSPOT_ACCESS_TOKEN;
  if (!configured) return null;
  const key = contactLiveCacheKey(contactId);
  const canCache = typeof prisma?.systemConfig?.findUnique === 'function';
  if (canCache) {
    try {
      const row = await prisma.systemConfig.findUnique({ where: { key } });
      const cached = row?.value ? (JSON.parse(String(row.value)) as { checkedAt: string; contact: HubSpotContactLive | null }) : null;
      const age = cached?.checkedAt ? now.getTime() - new Date(cached.checkedAt).getTime() : Infinity;
      if (cached && age >= 0 && age < CONTACT_LIVE_CACHE_MS) return cached.contact;
    } catch {
      // an unreadable cache is a cache miss
    }
  }
  let contact: HubSpotContactLive | null = null;
  try {
    const fetchContact = deps.fetchContact ?? (async (id: string, props: string[]) => {
      const { getHubSpotClient, withHubSpotRetry } = await import('@/lib/hubspot/client');
      const client = getHubSpotClient();
      const r = (await withHubSpotRetry(() => client.crm.contacts.basicApi.getById(id, props), `gap-contact-packet contact read (${id})`)) as { properties?: Record<string, string | null | undefined> } | null;
      return r?.properties ?? null;
    });
    const p = await fetchContact(contactId, CONTACT_PROPS);
    if (p) {
      const linkedinRaw = clean(p.hs_linkedin_url) ?? clean(p.linkedin_url) ?? clean(p.linkedinbio);
      contact = {
        phone: clean(p.phone),
        mobilephone: clean(p.mobilephone),
        jobtitle: clean(p.jobtitle),
        linkedin: linkedinRaw && LINKEDIN_PROFILE.test(linkedinRaw) ? linkedinRaw : null,
        timezone: clean(p.hs_timezone),
        updatedAt: iso(clean(p.lastmodifieddate)),
      };
    }
  } catch {
    contact = null;
  }
  if (canCache && typeof prisma?.systemConfig?.upsert === 'function' && contact) {
    try {
      const value = JSON.stringify({ checkedAt: now.toISOString(), contact });
      await prisma.systemConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
    } catch {
      // the read stands without the cache
    }
  }
  return contact;
}

/** The persona row for the query: by id, else by address, else by name AT the account (never a name across accounts). */
export async function findPersonaContact(prisma: PrismaLike, q: ContactPacketQuery): Promise<PersonaContactRow | null> {
  if (q.personaId != null && typeof prisma?.persona?.findUnique === 'function') {
    const row = (await prisma.persona.findUnique({ where: { id: q.personaId }, select: PERSONA_CONTACT_SELECT }).catch(() => null)) as PersonaContactRow | null;
    if (row) return row;
  }
  if (typeof prisma?.persona?.findFirst !== 'function') return null;
  if (lower(q.email).includes('@')) {
    const row = (await prisma.persona.findFirst({ where: { email: { equals: lower(q.email), mode: 'insensitive' } }, select: PERSONA_CONTACT_SELECT }).catch(() => null)) as PersonaContactRow | null;
    if (row) return row;
  }
  if (q.name?.trim()) {
    // The account's people by name: the same person written differently ("Morrison, Craig") matches; a namesake at
    // another account never does.
    const rows = (await prisma.persona.findMany({ where: { account_name: q.accountName }, select: PERSONA_CONTACT_SELECT }).catch(() => [])) as PersonaContactRow[];
    const want = nameKey(q.name);
    const hit = rows.find((r) => nameKey(r.name) === want);
    if (hit) return hit;
  }
  return null;
}

/** The pure projection: the stored row (and the live contact when read) to the packet. Nothing invented. */
export function projectContactPacket(x: {
  accountName: string;
  persona: PersonaContactRow | null;
  /** The name and title the item carries when no row was found (the packet still names them; everything else is unavailable). */
  fallback?: { name: string | null; title: string | null; email: string | null } | null;
  hubspotCompanyId: string | null;
  deals: Array<{ id?: string | null; name: string | null }>;
  live: HubSpotContactLive | null;
  /** Whether a live read was attempted ("read live" versus "not read"). */
  liveRead: boolean;
}): ContactPacket | null {
  const p = x.persona;
  const name = p?.name?.trim() || x.fallback?.name?.trim() || null;
  if (!name) return null;
  const phones: ContactPhone[] = [];
  const personaUpdated = iso(p?.updated_at ?? null);
  const seen = new Set<string>();
  const add = (kind: PhoneKind, value: string | null, source: string, updatedAt: string | null) => {
    const v = (value ?? '').trim();
    // One number written two ways ("+1 617 555 0100", "617-555-0100") is one number: the last ten digits are the key.
    const digits = v.replace(/\D/g, '');
    const k = digits.slice(-10);
    if (!v || digits.length < 7 || seen.has(k)) return;
    seen.add(k);
    phones.push({ kind, value: v, source, updatedAt });
  };
  // The live record's numbers first (HubSpot's own fields say which is mobile); the stored row's direct number after.
  if (x.live) {
    add('mobile', x.live.mobilephone, 'HubSpot contact (mobile phone field), read live', x.live.updatedAt);
    add('direct', x.live.phone, 'HubSpot contact (phone field), read live', x.live.updatedAt);
  }
  if (p?.phone && !PHONE_DEAD.has(lower(p.phone_status))) add('direct', p.phone, `GAP contact record${p.phone_status && p.phone_status !== 'unknown' ? ` (status ${p.phone_status})` : ' (status not checked)'}`, personaUpdated);
  const linkedinStored = p?.linkedin_url && (p.linkedin_confidence ?? 0) >= LINKEDIN_CONFIDENCE_FLOOR && LINKEDIN_PROFILE.test(p.linkedin_url) ? p.linkedin_url.trim() : null;
  const email = clean(p?.email) ?? clean(x.fallback?.email);
  const contactId = clean(p?.hubspot_contact_id);
  const sources = [p ? `GAP contact record ${p.id}` : 'no GAP contact record', x.live ? 'the HubSpot contact, read live' : x.liveRead ? 'the HubSpot contact (not readable)' : contactId ? 'the HubSpot contact (not read this time)' : 'no HubSpot contact link'];
  return {
    name,
    title: clean(x.live?.jobtitle) ?? clean(p?.title) ?? clean(x.fallback?.title),
    company: x.accountName,
    email: email ? email.toLowerCase() : null,
    emailStatus: email ? (p?.email ? p.email_status ?? null : 'not on the GAP record') : null,
    phones,
    timezone: clean(x.live?.timezone),
    linkedin: x.live?.linkedin ?? linkedinStored,
    hubspotContactUrl: contactId ? hubspotRecordUrl('contact', contactId) : null,
    hubspotCompanyUrl: x.hubspotCompanyId ? hubspotRecordUrl('company', x.hubspotCompanyId) : null,
    dealUrls: x.deals.filter((d) => d.id).map((d) => ({ name: d.name ?? 'an unnamed deal', url: hubspotRecordUrl('deal', String(d.id)) })),
    source: sources.join(' and '),
    updatedAt: [personaUpdated, x.live?.updatedAt ?? null].filter((d): d is string => !!d).sort().at(-1) ?? null,
  };
}

/**
 * The packet for one person at one account. `fallback` carries the item's own name and title (and the pack's address)
 * so a person with no GAP row is still named and everything else says unavailable. The deals come through
 * `deps.deals` (the assignment hands down the in-deals summary it already read); absent means none listed.
 */
export async function contactPacketFor(prisma: PrismaLike, q: ContactPacketQuery & { fallback?: { name: string | null; title: string | null; email: string | null } | null }, deps: ContactPacketDeps = {}): Promise<ContactPacket | null> {
  const persona = await findPersonaContact(prisma, q).catch(() => null);
  const account = typeof prisma?.account?.findUnique === 'function' ? ((await prisma.account.findUnique({ where: { name: q.accountName }, select: { hubspot_company_id: true } }).catch(() => null)) as { hubspot_company_id: string | null } | null) : null;
  const deals = await (deps.deals ? deps.deals(q.accountName) : Promise.resolve([] as Array<{ id?: string | null; name: string | null }>)).catch(() => [] as Array<{ id?: string | null; name: string | null }>);
  const contactId = clean(persona?.hubspot_contact_id);
  const reader = deps.hubspotContact === undefined ? (id: string) => readHubSpotContactLive(prisma, id, q.now) : deps.hubspotContact;
  const live = contactId && reader ? await reader(contactId).catch(() => null) : null;
  return projectContactPacket({ accountName: q.accountName, persona, fallback: q.fallback ?? { name: q.name ?? null, title: null, email: q.email ?? null }, hubspotCompanyId: account?.hubspot_company_id ?? null, deals, live, liveRead: !!contactId && !!reader });
}
