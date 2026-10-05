/**
 * CONTACT CURRENTNESS: the store (owner resolution, 2026-10-05). Reads the evidence GAP already holds about a
 * person's employment and projects it through employment.ts; records Casey's corrections and bounded public
 * verifications. No new table: the existing ContactEnrichment / ContactEnrichmentField provenance model carries the
 * current snapshot (field, value, source, source_timestamp, confidence, last_writer), and GapAuditEvent carries the
 * append-only record (actor, timestamp, before / after, source URL, note).
 *
 *   employment_status      'left' | 'current' | 'role_changed'   relative to the persona's own account
 *   employment_company     where the evidence places them now
 *   employment_title       their current title per the evidence
 *   employment_source_url  the page (a profile, the employer's page) the evidence comes from
 *   employment_note        Casey's note, or the verification's one-line summary
 *
 * source 'manual' is Casey (strongest; never overwritten by automation); 'derived' is a source-backed verification
 * (tier from its URL); 'apollo' and 'hubspot' rows written by the intakes are supporting evidence about the company.
 *
 * Never touches do_not_contact, email, email_status or HubSpot: leaving a company is not suppression.
 * House `prisma: any` glue.
 */
import { apolloEvidence, crmEvidence, interactionEvidence, kindForUrl, readEmployment, tierForUrl, type EmploymentEvidence, type EmploymentRead } from './employment';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const EMPLOYMENT_FIELDS = ['employment_status', 'employment_company', 'employment_title', 'employment_source_url', 'employment_note'] as const;
export const EMPLOYMENT_CORRECTED = 'person.employment_corrected' as const;
export const EMPLOYMENT_VERIFIED = 'person.employment_verified' as const;

/** 'conflict' is written by a verification only (derived): the sources disagree about the role. */
export type EmploymentStatusValue = 'left' | 'current' | 'role_changed' | 'conflict';

interface FieldRow {
  field_name: string;
  field_value: string | null;
  source: string;
  source_timestamp: Date | string | null;
  confidence: number | null;
  last_writer: string | null;
}

/** Live HubSpot contact properties the caller may already hold (hubspot-people.ts reads them); never required. */
export interface HubSpotEmploymentProps {
  company: string | null;
  title: string | null;
  email: string | null;
  lastModifiedAt: string | null;
  apolloEmploymentStatus: string | null;
  apolloVerifiedAt: string | null;
}

const iso = (d: Date | string | null | undefined): string | null => {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

/** The evidence the enrichment fields carry (pure, exported for tests). */
export function evidenceFromFields(fields: readonly FieldRow[], accountName: string, companyDomains: readonly string[] = []): EmploymentEvidence[] {
  const by = new Map(fields.map((f) => [f.field_name, f]));
  const out: EmploymentEvidence[] = [];
  const status = by.get('employment_status');
  if (status?.field_value) {
    const v = status.field_value as EmploymentStatusValue;
    const company = by.get('employment_company')?.field_value ?? null;
    const title = by.get('employment_title')?.field_value ?? null;
    const url = by.get('employment_source_url')?.field_value ?? null;
    const note = by.get('employment_note')?.field_value ?? null;
    const at = iso(status.source_timestamp);
    // 'role_changed' (Casey or a verification): still here, the stored role is no longer theirs; the title is the
    // new one when known. 'conflict' (a verification only): the sources disagree about the role; nothing about the company.
    const flags = { ...(v === 'role_changed' ? { roleChanged: true } : {}), ...(v === 'conflict' && status.source !== 'manual' ? { conflict: true } : {}) };
    if (status.source === 'manual') {
      out.push({ kind: 'human', tier: 'strong', company: v === 'left' ? company : accountName, title, at, source: `Casey${status.last_writer ? ` (${status.last_writer})` : ''}`, url, note, left: v === 'left', ...flags });
    } else {
      // A derived (web) verification: the tier is the URL's, never the writer's say-so.
      const tier = tierForUrl(url, companyDomains);
      out.push({ kind: kindForUrl(url, companyDomains), tier: tier === 'weak' ? 'supporting' : tier, company: v === 'left' ? company : accountName, title, at, source: `verified at ${url ? safeHost(url) : 'an unnamed source'}`, url, note, left: v === 'left', ...flags });
    }
  }
  // The intakes' company fields: supporting evidence about where a provider or the CRM placed them, dated by the write.
  for (const src of ['apollo', 'hubspot'] as const) {
    const company = fields.find((f) => f.field_name === 'company_name' && f.source === src);
    if (!company?.field_value) continue;
    const title = fields.find((f) => f.field_name === 'job_title' && f.source === src)?.field_value ?? null;
    out.push({ kind: src === 'apollo' ? 'apollo' : 'crm', tier: 'supporting', company: company.field_value, title, at: iso(company.source_timestamp), source: src === 'apollo' ? 'Apollo intake' : 'HubSpot intake' });
  }
  return out;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export interface LoadEmploymentOptions {
  now: Date;
  /** Live HubSpot properties by hubspot_contact_id, when the caller already read them. */
  hubspot?: ReadonlyMap<string, HubSpotEmploymentProps>;
  /** Other names the account goes by (aliases, family spellings). */
  aliasesFor?: (accountName: string) => readonly string[];
  /** The account's own web domains (an employer page on them is strong evidence). */
  domainsFor?: (accountName: string) => readonly string[];
}

export interface PersonaEmployment extends EmploymentRead {
  personaId: number;
  accountName: string;
  evidence: EmploymentEvidence[];
}

/**
 * The employment read for each persona, from what the database holds (plus the live HubSpot properties the caller
 * passes). One query per table; no network. A persona with nothing on record reads CURRENT_UNVERIFIED.
 */
const emailDomain = (e: string | null | undefined): string | null => (e && e.includes('@') ? e.split('@')[1].trim().toLowerCase() || null : null);

/**
 * The account-side context every employment read needs: the names the account goes by (its aliases, its parent
 * brand and its child accounts) and the account's own domains (canonical `domain:` links, and an email domain two or more of its GAP
 * contacts share). One person's address is never an account domain (review B2). Every caller passes this: the two
 * loaders and the decision-time gate, so the panel and the gate read the same spellings.
 */
export async function accountEmploymentContext(prisma: PrismaLike, accountName: string): Promise<{ aliases: string[]; domains: string[] }> {
  const [account, aliasRows, links, people, children] = await Promise.all([
    typeof prisma?.account?.findUnique === 'function' ? prisma.account.findUnique({ where: { name: accountName }, select: { parent_brand: true } }).catch(() => null) : null,
    typeof prisma?.gapAccountAlias?.findMany === 'function' ? prisma.gapAccountAlias.findMany({ where: { account_name: accountName }, select: { alias: true } }).catch(() => []) : [],
    typeof prisma?.canonicalAccountLink?.findMany === 'function' ? prisma.canonicalAccountLink.findMany({ where: { account_name: accountName }, select: { canonical_company_id: true } }).catch(() => []) : [],
    typeof prisma?.persona?.findMany === 'function' ? prisma.persona.findMany({ where: { account_name: accountName }, select: { email: true } }).catch(() => []) : [],
    // The family's child accounts (Frito-Lay under PepsiCo) are spellings of the same employer.
    typeof prisma?.account?.findMany === 'function' ? prisma.account.findMany({ where: { parent_brand: accountName }, select: { name: true }, take: 50 }).catch(() => []) : [],
  ]);
  const aliases = [...new Set([...((aliasRows ?? []) as Array<{ alias: string }>).map((a) => String(a.alias ?? '').trim()), ...(account?.parent_brand ? [String(account.parent_brand).trim()] : []), ...((children ?? []) as Array<{ name: string }>).map((c) => String(c.name ?? '').trim())])].filter(Boolean);
  const domains = new Set<string>();
  for (const l of (links ?? []) as Array<{ canonical_company_id: string }>) {
    const id = String(l.canonical_company_id ?? '');
    if (!id.startsWith('domain:')) continue;
    const d = id.slice('domain:'.length).trim().toLowerCase().replace(/^www\./, '');
    if (d) domains.add(d);
  }
  const counts = new Map<string, number>();
  for (const p of (people ?? []) as Array<{ email: string | null }>) {
    const d = emailDomain(p.email);
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  for (const [d, n] of counts) if (n >= 2) domains.add(d);
  return { aliases, domains: [...domains].sort() };
}

/**
 * A HubSpot-only person (no GAP record): the CRM company field and Apollo's sweep are the evidence, read with the
 * same account context as a GAP contact. Apollo's moved_out sets them aside in the panel exactly as it would a
 * persona (review S3); the row's modified date and its address prove nothing.
 */
export function readHubSpotOnlyEmployment(input: { accountName: string; aliases: readonly string[]; domains: readonly string[]; props: HubSpotEmploymentProps; now: Date }): EmploymentRead {
  const evidence: EmploymentEvidence[] = [
    ...crmEvidence({ company: input.props.company, title: input.props.title, email: input.props.email, lastModifiedAt: input.props.lastModifiedAt }),
    ...apolloEvidence({ status: input.props.apolloEmploymentStatus, verifiedAt: input.props.apolloVerifiedAt, accountName: input.accountName, title: input.props.title }),
  ];
  return readEmployment({ accountName: input.accountName, aliases: input.aliases, domains: input.domains, evidence, now: input.now });
}

export async function loadEmployment(prisma: PrismaLike, personaIds: readonly number[], opts: LoadEmploymentOptions): Promise<Map<number, PersonaEmployment>> {
  const out = new Map<number, PersonaEmployment>();
  const ids = [...new Set(personaIds)];
  if (ids.length === 0) return out;
  const personas: Array<{ id: number; account_name: string; title: string | null; email: string | null; hubspot_contact_id: string | null }> = await prisma.persona.findMany({
    where: { id: { in: ids } },
    select: { id: true, account_name: true, title: true, email: true, hubspot_contact_id: true },
  });
  const enrichments: Array<{ persona_id: number; fields: FieldRow[] }> = prisma.contactEnrichment?.findMany
    ? await prisma.contactEnrichment.findMany({ where: { persona_id: { in: ids } }, select: { persona_id: true, fields: { select: { field_name: true, field_value: true, source: true, source_timestamp: true, confidence: true, last_writer: true } } } })
    : [];
  const fieldsOf = new Map(enrichments.map((e) => [e.persona_id, e.fields ?? []]));
  // A human-confirmed buyer answer from this account is a dated interaction (strong evidence they were there then).
  const dispositions: Array<{ persona_id: number | null; created_at: Date; response_class: string; channel?: string | null }> = prisma.conversationDisposition?.findMany
    ? await prisma.conversationDisposition.findMany({ where: { persona_id: { in: ids }, human_confirmed: true }, select: { persona_id: true, created_at: true, response_class: true, channel: true }, orderBy: { created_at: 'desc' } })
    : [];
  const newestDisposition = new Map<number, (typeof dispositions)[number]>();
  for (const d of dispositions) if (d.persona_id != null && !newestDisposition.has(d.persona_id)) newestDisposition.set(d.persona_id, d);

  for (const p of personas) {
    const aliases = opts.aliasesFor?.(p.account_name) ?? [];
    // The ACCOUNT's domains (accountEmploymentContext): their labels count as spellings of the employer ("Genmills"
    // is General Mills through genmills.com). Never the person's own address: a record refreshed to the new
    // employer's address would read the departure as "here" (review B2). A domain proves nothing about currentness.
    const domains = opts.domainsFor?.(p.account_name) ?? [];
    const evidence: EmploymentEvidence[] = [];
    const hs = p.hubspot_contact_id ? opts.hubspot?.get(p.hubspot_contact_id) ?? null : null;
    if (hs) {
      evidence.push(...crmEvidence({ company: hs.company, title: hs.title, email: hs.email, lastModifiedAt: hs.lastModifiedAt }));
      evidence.push(...apolloEvidence({ status: hs.apolloEmploymentStatus, verifiedAt: hs.apolloVerifiedAt, accountName: p.account_name, title: hs.title }));
    } else {
      // The GAP record itself is the CRM claim: supporting, like HubSpot's company field.
      evidence.push(...crmEvidence({ company: p.account_name, title: p.title, email: p.email, lastModifiedAt: null, source: 'GAP record' }));
    }
    evidence.push(...evidenceFromFields(fieldsOf.get(p.id) ?? [], p.account_name, domains));
    const d = newestDisposition.get(p.id);
    if (d) evidence.push(...interactionEvidence({ at: iso(d.created_at), what: `a confirmed ${d.channel ? `${d.channel} ` : ''}answer (${d.response_class.replace(/_/g, ' ')})`, accountName: p.account_name }));
    const read = readEmployment({ accountName: p.account_name, aliases, domains, evidence, now: opts.now });
    out.set(p.id, { personaId: p.id, accountName: p.account_name, evidence, ...read });
  }
  return out;
}

/** One persona's read, or null when the persona does not exist. */
export async function loadPersonaEmployment(prisma: PrismaLike, personaId: number, opts: LoadEmploymentOptions): Promise<PersonaEmployment | null> {
  return (await loadEmployment(prisma, [personaId], opts)).get(personaId) ?? null;
}

export interface EmploymentCorrectionInput {
  personaId: number;
  actor: string;
  now: Date;
  /** 'left': no longer at this account; 'role_changed': still here, the title is wrong; 'current': Casey confirms them here. */
  status: EmploymentStatusValue;
  newCompany?: string | null;
  newTitle?: string | null;
  sourceUrl?: string | null;
  note?: string | null;
}

export type EmploymentCorrectionResult =
  | { ok: true; personaId: number; accountName: string; read: EmploymentRead; auditId: string }
  | { ok: false; reason: 'persona_not_found' | 'invalid_url' | 'missing_company' };

async function upsertFields(prisma: PrismaLike, tx: PrismaLike, personaId: number, rows: Array<{ field: string; value: string | null }>, write: { source: 'manual' | 'derived'; at: Date; confidence: number; writer: string }): Promise<void> {
  const enrichment = await tx.contactEnrichment.upsert({ where: { persona_id: personaId }, update: {}, create: { persona_id: personaId }, select: { id: true } });
  for (const r of rows) {
    await tx.contactEnrichmentField.upsert({
      where: { contact_enrichment_id_field_name: { contact_enrichment_id: enrichment.id, field_name: r.field } },
      update: { field_value: r.value, source: write.source, source_timestamp: write.at, confidence: write.confidence, last_writer: write.writer },
      create: { contact_enrichment_id: enrichment.id, field_name: r.field, field_value: r.value, source: write.source, source_timestamp: write.at, confidence: write.confidence, last_writer: write.writer },
    });
  }
}

/**
 * Casey says THIS PERSON LEFT, the role is wrong, or they are current. Human-confirmed: the strongest evidence,
 * recorded once (an audit row) and projected (the fields). Takes effect at once for every gate that reads employment.
 * Never writes do_not_contact, the email, HubSpot or the person's history.
 */
export async function recordEmploymentCorrection(prisma: PrismaLike, input: EmploymentCorrectionInput): Promise<EmploymentCorrectionResult> {
  const persona: { id: number; account_name: string; name: string; title: string | null } | null = await prisma.persona.findUnique({ where: { id: input.personaId }, select: { id: true, account_name: true, name: true, title: true } });
  if (!persona) return { ok: false, reason: 'persona_not_found' };
  const url = (input.sourceUrl ?? '').trim() || null;
  if (url && !/^https?:\/\/\S+\.\S+/i.test(url)) return { ok: false, reason: 'invalid_url' };
  const company = (input.newCompany ?? '').trim() || null;
  const title = (input.newTitle ?? '').trim() || null;
  const note = (input.note ?? '').trim() || null;
  const writer = input.actor;
  const auditId: string = await prisma.$transaction(async (tx: PrismaLike) => {
    await upsertFields(prisma, tx, persona.id, [
      { field: 'employment_status', value: input.status },
      { field: 'employment_company', value: input.status === 'left' ? company : persona.account_name },
      { field: 'employment_title', value: title },
      { field: 'employment_source_url', value: url },
      { field: 'employment_note', value: note },
    ], { source: 'manual', at: input.now, confidence: 1, writer });
    const row = await tx.gapAuditEvent.create({
      data: {
        kind: EMPLOYMENT_CORRECTED,
        actor: input.actor,
        subject_type: 'persona',
        subject_id: String(persona.id),
        payload: {
          personaId: persona.id,
          name: persona.name,
          status: input.status,
          before: { accountName: persona.account_name, title: persona.title },
          after: { company: input.status === 'left' ? company : persona.account_name, title },
          sourceUrl: url,
          note,
          at: input.now.toISOString(),
          suppressionTouched: false,
        },
      },
      select: { id: true },
    });
    return row.id as string;
  });
  const read = (await loadPersonaEmployment(prisma, persona.id, { now: input.now }))!;
  return { ok: true, personaId: persona.id, accountName: persona.account_name, read, auditId };
}

export interface EmploymentVerificationInput {
  personaId: number;
  actor: string;
  now: Date;
  verdict: 'current' | 'left' | 'unknown';
  company: string | null;
  title: string | null;
  sourceUrl: string | null;
  /** The source's own date, when the page shows one. */
  sourceDate: string | null;
  summary: string | null;
  /** The account's own domains (an employer page on them is strong). */
  companyDomains?: readonly string[];
}

export type EmploymentVerificationResult =
  | { ok: true; personaId: number; recorded: boolean; read: EmploymentRead; auditId: string }
  | { ok: false; reason: 'persona_not_found' | 'human_correction_stands' };

/**
 * A bounded, source-backed verification (employment-verify.ts) lands here as DERIVED evidence. It never overwrites a
 * human correction (`human_correction_stands`), never writes without a source URL, and an unknown verdict records only
 * the audit row (nothing is asserted).
 */
export async function recordEmploymentVerification(prisma: PrismaLike, input: EmploymentVerificationInput): Promise<EmploymentVerificationResult> {
  const persona: { id: number; account_name: string; name: string; title: string | null; enrichment?: { fields?: FieldRow[] } | null } | null = await prisma.persona.findUnique({
    where: { id: input.personaId },
    select: { id: true, account_name: true, name: true, title: true, enrichment: { select: { fields: { select: { field_name: true, field_value: true, source: true, source_timestamp: true, confidence: true, last_writer: true } } } } },
  });
  if (!persona) return { ok: false, reason: 'persona_not_found' };
  const existing = (persona.enrichment?.fields ?? []).find((f) => f.field_name === 'employment_status');
  if (existing?.source === 'manual') return { ok: false, reason: 'human_correction_stands' };
  const url = input.sourceUrl && /^https?:\/\/\S+\.\S+/i.test(input.sourceUrl) ? input.sourceUrl : null;
  const assert = input.verdict !== 'unknown' && !!url;
  const tier = tierForUrl(url, input.companyDomains ?? []);
  const at = input.sourceDate && !Number.isNaN(new Date(input.sourceDate).getTime()) ? new Date(input.sourceDate) : input.now;
  const auditId: string = await prisma.$transaction(async (tx: PrismaLike) => {
    if (assert) {
      await upsertFields(prisma, tx, persona.id, [
        { field: 'employment_status', value: input.verdict },
        { field: 'employment_company', value: input.verdict === 'left' ? input.company : persona.account_name },
        { field: 'employment_title', value: input.title },
        { field: 'employment_source_url', value: url },
        { field: 'employment_note', value: input.summary },
      ], { source: 'derived', at, confidence: tier === 'strong' ? 0.9 : 0.6, writer: `employment_verify:${input.actor}` });
    }
    const row = await tx.gapAuditEvent.create({
      data: {
        kind: EMPLOYMENT_VERIFIED,
        actor: input.actor,
        subject_type: 'persona',
        subject_id: String(persona.id),
        payload: { personaId: persona.id, name: persona.name, accountName: persona.account_name, verdict: input.verdict, company: input.company, title: input.title, sourceUrl: url, sourceDate: input.sourceDate, tier: url ? tier : null, recorded: assert, summary: input.summary, at: input.now.toISOString(), suppressionTouched: false },
      },
      select: { id: true },
    });
    return row.id as string;
  });
  const read = (await loadPersonaEmployment(prisma, persona.id, { now: input.now, domainsFor: () => input.companyDomains ?? [] }))!;
  return { ok: true, personaId: persona.id, recorded: assert, read, auditId };
}
