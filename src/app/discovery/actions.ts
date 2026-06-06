'use server';

import { getHubSpotClient, withHubSpotRetry, isHubSpotConfigured, getPortalId } from '@/lib/hubspot/client';
import { searchCompanyByDomain, searchCompanyByName } from '@/lib/hubspot/companies';
import { hsSearchContacts } from '@/lib/hubspot/contacts';
import { ensureYardflowIcpScoreProperty } from '@/lib/hubspot/properties';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';
import { detectPattern, inferEmail, type EmailPattern, type NameEmailSample, type InferredEmail } from '@/lib/discovery/email-pattern';
import { dominantDomain, dedupeContacts, type ProspectContact } from '@/lib/discovery/contacts';
import { COMPANY_DOMAIN_SEED, EMAIL_PATTERN_SEED, companyKey } from '@/lib/discovery/company-domains';
import { auth } from '@/lib/auth';
import { prepareClawdDispatch, dispatchDraftBatch, type DraftBatchRow } from '@/lib/discovery/clawd-dispatch';

/** Minimal session shape we read off `auth()` (it carries an email + attached role). */
type SessionLike = { user?: { email?: string | null; role?: string } } | null;

const GENERIC_BRAND_WORDS = new Set([
  'the', 'and', 'inc', 'llc', 'corp', 'company', 'co', 'group', 'logistics',
  'distribution', 'warehouse', 'transport', 'transportation', 'services', 'supply',
  'chain', 'foods', 'food', 'north', 'america', 'us', 'usa', 'international',
]);

/** First distinctive word of a company name, for matching against persona accounts.
 *  Length ≥3 so short brands (GXO, DHL, UPS) win before trailing city/word tokens. */
function brandToken(company: string): string | null {
  for (const w of companyKey(company).split(' ')) {
    if (w.length >= 3 && !GENERIC_BRAND_WORDS.has(w)) return w;
  }
  return null;
}

export interface AccountContact {
  id: string;
  name: string;
  title: string;
  email: string;
}

/**
 * Contacts for an account, for the drawer's "who to reach" section. Full-text
 * searches HubSpot by account name; titled contacts first. Empty + safe when
 * HubSpot is unavailable.
 */
export async function getAccountContacts(accountName: string): Promise<AccountContact[]> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED || !accountName.trim()) return [];
  try {
    const { contacts } = await hsSearchContacts(accountName, undefined, 25);
    return contacts
      .map((c) => ({
        id: c.id,
        name: [c.firstname, c.lastname].filter(Boolean).join(' ') || c.email,
        title: c.jobtitle,
        email: c.email,
      }))
      .filter((c) => c.name)
      .sort((a, b) => (a.title ? 0 : 1) - (b.title ? 0 : 1)) // titled contacts first
      .slice(0, 8);
  } catch {
    return [];
  }
}

export interface PushProspectInput {
  name: string;
  cityState?: string;
  corridor?: string;
  icpScore: number;
  tier: string;
  isExistingAccount: boolean;
  /** Optional domain for dedup; most Places discoveries don't carry one. */
  domain?: string;
}

export interface PushResult {
  ok: boolean;
  action?: 'created' | 'updated';
  hubspotId?: string;
  url?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

/**
 * Push a single discovered prospect to HubSpot as a Company.
 * Dedups by domain → name before creating (mirrors push-to-hubspot.ts), stamps
 * the yardflow_icp_score property, and refuses rows already in the CRM.
 */
export async function pushProspectToHubSpot(input: PushProspectInput): Promise<PushResult> {
  if (input.isExistingAccount) {
    return { ok: false, skipped: true, reason: 'Already an existing account in the CRM.' };
  }
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) {
    return { ok: false, error: 'HubSpot sync is not configured or is disabled.' };
  }

  try {
    assertExternalWriteAllowed('hubspot', 'pushProspectToHubSpot');

    // Self-heal: make sure the custom score property exists before stamping it.
    await ensureYardflowIcpScoreProperty();

    const [city, state] = (input.cityState ?? '').split(',').map((s) => s.trim());
    const existing = input.domain
      ? await searchCompanyByDomain(input.domain)
      : await searchCompanyByName(input.name);

    const properties: Record<string, string> = {
      name: input.name,
      ...(input.domain ? { domain: input.domain } : {}),
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
      yardflow_icp_score: String(input.icpScore),
    };

    const client = getHubSpotClient();
    let hubspotId: string;
    let action: 'created' | 'updated';

    if (existing) {
      await withHubSpotRetry(
        () => client.crm.companies.basicApi.update(existing.id, { properties }),
        `discovery.updateCompany(${existing.id})`,
      );
      hubspotId = existing.id;
      action = 'updated';
    } else {
      const created = await withHubSpotRetry(
        () => client.crm.companies.basicApi.create({ properties, associations: [] }),
        `discovery.createCompany(${input.name})`,
      );
      hubspotId = created.id;
      action = 'created';
    }

    const portal = getPortalId();
    const url = portal ? `https://app.hubspot.com/contacts/${portal}/company/${hubspotId}` : undefined;
    return { ok: true, action, hubspotId, url };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Hand a slice of worklist rows to Clawd. The client passes the rows it already
 * has; the OWNER is resolved server-side from the session (never trust a
 * client-supplied owner). Gates auth + empty, builds the payload, dispatches.
 */
export async function dispatchSliceToClawd(
  rows: DraftBatchRow[],
): Promise<{ ok: true; accepted: number; batchId?: string } | { ok: false; reason: string }> {
  const session = (await auth()) as SessionLike;
  const owner = session?.user?.email;
  const prepared = prepareClawdDispatch(owner, rows);
  if (!prepared.ok) return prepared;
  return dispatchDraftBatch(prepared.payload);
}

// ── Prospect contacts + inferred email ───────────────────────────────────────

interface CompanyEmailContext {
  domain: string | null;
  /** Named {first,last,email} samples at the domain — drive pattern detection. */
  samples: NameEmailSample[];
  /** Researched fallback pattern (used only when corpus can't derive one). */
  storedPattern?: EmailPattern;
  /** Real contacts already in our Persona records. */
  records: ProspectContact[];
}

/**
 * Resolve a company's email context from our own data (no enrichment credits):
 * matching Persona records → the corporate domain → same-domain corpus samples,
 * with a researched seed as fallback.
 */
async function resolveCompanyEmailContext(
  company: string,
  accountSlug?: string,
  opts?: { discover?: boolean },
): Promise<CompanyEmailContext> {
  const token = brandToken(company) ?? (accountSlug ? brandToken(accountSlug.replace(/-/g, ' ')) : null);

  // 1. Persona records for this account (real contacts + their emails).
  let personas: Array<{ first_name: string | null; last_name: string | null; title: string | null; email: string | null; linkedin_url: string | null }> = [];
  if (token) {
    try {
      personas = await prisma.persona.findMany({
        where: { account_name: { contains: token, mode: 'insensitive' }, email: { not: null } },
        select: { first_name: true, last_name: true, title: true, email: true, linkedin_url: true },
        take: 50,
      });
    } catch {
      personas = [];
    }
  }

  const records: ProspectContact[] = personas
    .filter((p) => p.email)
    .map((p) => ({
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || (p.email as string),
      firstName: p.first_name ?? undefined,
      lastName: p.last_name ?? undefined,
      title: p.title ?? undefined,
      email: p.email,
      confidence: 'known' as const,
      source: 'records' as const,
      linkedinUrl: p.linkedin_url ?? undefined,
    }));

  // 2. Domain: corpus → researched seed → (on-demand) web discovery.
  let domain: string | null =
    dominantDomain(records.map((r) => r.email).filter((e): e is string => Boolean(e))) ??
    COMPANY_DOMAIN_SEED[companyKey(company)] ??
    null;

  if (!domain && opts?.discover) {
    const { discoverCompanyDomain } = await import('@/lib/discovery/research');
    domain = await discoverCompanyDomain(company);
  }

  // 3. Corpus samples at the domain (cross-account — same domain, same convention).
  let samples: NameEmailSample[] = [];
  if (domain) {
    try {
      const atDomain = await prisma.persona.findMany({
        where: { email: { endsWith: `@${domain}`, mode: 'insensitive' }, first_name: { not: null }, last_name: { not: null } },
        select: { first_name: true, last_name: true, email: true },
        take: 100,
      });
      samples = atDomain
        .filter((p) => p.first_name && p.last_name && p.email)
        .map((p) => ({ firstName: p.first_name as string, lastName: p.last_name as string, email: p.email as string }));
    } catch {
      samples = [];
    }
  }

  return { domain, samples, storedPattern: domain ? EMAIL_PATTERN_SEED[domain] : undefined, records };
}

export interface ProspectContactsResult {
  domain: string | null;
  /** Detected/seeded email pattern for the domain, if any. */
  pattern: EmailPattern | null;
  patternBasis: string;
  contacts: ProspectContact[];
}

/** The contact waterfall for a prospect: our records + HubSpot read, deduped. */
export async function findProspectContacts(input: { company: string; accountSlug?: string }): Promise<ProspectContactsResult> {
  const ctx = await resolveCompanyEmailContext(input.company, input.accountSlug);

  const hubspot: ProspectContact[] = (await getAccountContacts(input.company)).map((c) => ({
    name: c.name,
    title: c.title || undefined,
    email: c.email || null,
    confidence: 'known' as const,
    source: 'hubspot' as const,
  }));

  const detected = ctx.samples.length ? detectPattern(ctx.samples) : null;
  const pattern = detected?.pattern ?? ctx.storedPattern ?? null;
  const patternBasis = detected
    ? `from ${detected.n} known ${ctx.domain} emails`
    : ctx.storedPattern
      ? 'researched pattern'
      : ctx.domain
        ? 'pattern unknown — add a known email'
        : 'no company domain known';

  return {
    domain: ctx.domain,
    pattern,
    patternBasis,
    contacts: dedupeContacts([...ctx.records, ...hubspot]).slice(0, 12),
  };
}

/** Infer the email for a manually-added contact at a prospect company. */
export async function inferContactEmail(input: {
  firstName: string;
  lastName: string;
  company: string;
  accountSlug?: string;
}): Promise<InferredEmail & { domain: string | null }> {
  const ctx = await resolveCompanyEmailContext(input.company, input.accountSlug, { discover: true });
  if (!ctx.domain) {
    return { email: null, confidence: 'none', basis: 'no company domain known', domain: null };
  }
  const inferred = inferEmail(input.firstName, input.lastName, ctx.domain, {
    samples: ctx.samples,
    storedPattern: ctx.storedPattern,
  });
  return { ...inferred, domain: ctx.domain };
}

/**
 * Web-research decision-makers at a prospect (Gemini + Google Search grounding),
 * each with an inferred email from the company's pattern. These are PROPOSALS to
 * verify — the UI flags them and links a LinkedIn search. Empty when unavailable.
 */
export async function researchProspectContacts(input: {
  company: string;
  accountSlug?: string;
  city?: string;
  state?: string;
  corridor?: string;
}): Promise<ProspectContact[]> {
  const { researchDecisionMakers } = await import('@/lib/discovery/research');
  const [people, ctx] = await Promise.all([
    researchDecisionMakers(input.company, { city: input.city, state: input.state, corridor: input.corridor }),
    resolveCompanyEmailContext(input.company, input.accountSlug, { discover: true }),
  ]);

  return people.map((p) => {
    const inf = ctx.domain
      ? inferEmail(p.firstName, p.lastName, ctx.domain, { samples: ctx.samples, storedPattern: ctx.storedPattern })
      : { email: null, confidence: 'none' as const, basis: 'no company domain known' };
    return {
      name: p.name,
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      email: inf.email,
      confidence: inf.confidence,
      emailBasis: inf.basis,
      source: 'research' as const,
      linkedinUrl: p.linkedinUrl,
      reason: p.reason,
      scope: p.scope,
    };
  });
}
