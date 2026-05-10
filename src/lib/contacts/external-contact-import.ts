import { prisma } from '@/lib/prisma';
import { normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from '@/lib/contact-standard';
import {
  isNewAccountSendEligible,
  likelySameCompanyName,
  normalizeCompanyDomain,
} from '@/lib/accounts/import-guardrails';
import { syncCanonicalRecords } from '@/lib/revops/canonical-sync';
import type { EnrichmentSource } from '@prisma/client';

const BLOCKED_DOMAINS = new Set([
  'dannon.com',
  'danone.com',
  'bluetriton.com',
  'yardflow.ai',
  'niagarawater.com',
  'lpcorp.com',
  'xpo.com',
  'kraftheinz.com',
  'freightroll.com',
]);

export type ContactImportSource = 'apollo' | 'hubspot' | 'manual' | 'csv';

export type ExternalContactInput = {
  source: ContactImportSource;
  sourceContactId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  title?: string | null;
  phone?: string | null;
  companyName?: string | null;
  companyDomain?: string | null;
  companyIndustry?: string | null;
  linkedinUrl?: string | null;
  optedOut?: boolean;
  confidence?: number | null;
};

export type ExternalContactImportResult =
  | { status: 'imported'; personaId: number; accountName: string }
  | { status: 'linked'; personaId: number; accountName: string }
  | { status: 'updated'; personaId: number; accountName: string }
  | { status: 'skipped'; reason: string }
  | { status: 'blocked'; reason: string };

function sourceToEnrichmentSource(source: ContactImportSource): EnrichmentSource {
  if (source === 'apollo') return 'apollo';
  if (source === 'hubspot') return 'hubspot';
  return 'manual';
}

function cleanEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase();
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

function displayName(input: ExternalContactInput): string {
  const explicit = input.name?.trim();
  if (explicit) return explicit;
  const full = `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim();
  return full || cleanEmail(input.email) || 'Unknown Contact';
}

async function findExistingPersona(input: ExternalContactInput, email: string | null) {
  if (input.source === 'hubspot' && input.sourceContactId) {
    const existing = await prisma.persona.findFirst({ where: { hubspot_contact_id: input.sourceContactId } });
    if (existing) return existing;
  }

  if (input.source === 'apollo' && input.sourceContactId) {
    const enrichment = await prisma.contactEnrichment.findFirst({
      where: { apollo_person_id: input.sourceContactId },
      include: { persona: true },
    });
    if (enrichment?.persona) return enrichment.persona;
  }

  if (email) {
    return prisma.persona.findFirst({ where: { email } });
  }

  return null;
}

async function resolveAccount(input: ExternalContactInput, email: string | null) {
  const emailDomain = parseDomainFromEmail(email);
  const normalizedDomain = normalizeCompanyDomain(input.companyDomain ?? emailDomain);
  const accountName = (input.companyName || normalizedDomain || 'Unknown').trim();

  let account = await prisma.account.findFirst({
    where: { name: { equals: accountName, mode: 'insensitive' } },
  });

  if (!account && normalizedDomain) {
    account = await prisma.account.findFirst({
      where: { source_url_1: `https://${normalizedDomain}` },
    });
  }

  if (!account && accountName !== 'Unknown') {
    const near = await prisma.account.findMany({
      where: { name: { contains: accountName.split(' ')[0] || accountName, mode: 'insensitive' } },
      take: 20,
    });
    account = near.find((candidate) => likelySameCompanyName(candidate.name, accountName)) ?? null;
  }

  if (account) return { account, created: false };

  const created = await prisma.account.create({
    data: {
      name: accountName,
      rank: 999,
      vertical: input.companyIndustry || 'Unknown',
      owner: 'Unassigned',
      research_status: 'Needs Review',
      priority_band: 'D',
      priority_score: 50,
      icp_fit: 50,
      event_signal: 0,
      primo_story_fit: 0,
      warm_intro: 0,
      strategic_value: 50,
      meeting_ease: 50,
      source: `${input.source}_import`,
      source_url_1: normalizedDomain ? `https://${normalizedDomain}` : null,
      notes: `Auto-triaged from ${input.source} intake. Requires vertical/domain/owner review.`,
    },
  });

  return { account: created, created: true };
}

async function upsertEnrichmentFields(
  personaId: number,
  input: ExternalContactInput,
  accountName: string,
) {
  const source = sourceToEnrichmentSource(input.source);
  const enrichment = await prisma.contactEnrichment.upsert({
    where: { persona_id: personaId },
    update: {
      ...(input.source === 'hubspot' && input.sourceContactId ? { hubspot_contact_id: input.sourceContactId } : {}),
      ...(input.source === 'apollo' && input.sourceContactId ? { apollo_person_id: input.sourceContactId } : {}),
      enrichment_confidence: input.confidence ?? undefined,
      last_enriched_at: new Date(),
    },
    create: {
      persona_id: personaId,
      hubspot_contact_id: input.source === 'hubspot' ? input.sourceContactId ?? null : null,
      apollo_person_id: input.source === 'apollo' ? input.sourceContactId ?? null : null,
      enrichment_confidence: input.confidence ?? null,
      last_enriched_at: new Date(),
    },
  });

  const fields = [
    ['name', displayName(input)],
    ['email', cleanEmail(input.email) ?? ''],
    ['job_title', input.title ?? ''],
    ['company_name', input.companyName || accountName],
    ['company_domain', normalizeCompanyDomain(input.companyDomain ?? parseDomainFromEmail(input.email)) ?? ''],
    ['company_industry', input.companyIndustry ?? ''],
    ['phone', input.phone ?? ''],
    ['linkedin_url', input.linkedinUrl ?? ''],
  ].filter(([, value]) => value);

  for (const [fieldName, value] of fields) {
    await prisma.contactEnrichmentField.upsert({
      where: {
        contact_enrichment_id_field_name: {
          contact_enrichment_id: enrichment.id,
          field_name: fieldName,
        },
      },
      update: {
        field_value: value,
        source,
        source_timestamp: new Date(),
        confidence: input.confidence ?? null,
        last_writer: `${input.source}_intake`,
      },
      create: {
        contact_enrichment_id: enrichment.id,
        field_name: fieldName,
        field_value: value,
        source,
        source_timestamp: new Date(),
        confidence: input.confidence ?? null,
        last_writer: `${input.source}_intake`,
      },
    });
  }
}

export async function importExternalContact(input: ExternalContactInput): Promise<ExternalContactImportResult> {
  const email = cleanEmail(input.email);
  const blockedDomain = parseDomainFromEmail(email);
  if (blockedDomain && BLOCKED_DOMAINS.has(blockedDomain)) {
    return { status: 'blocked', reason: 'blocked-domain' };
  }

  if (!email && !input.sourceContactId) {
    return { status: 'skipped', reason: 'missing-email-and-source-id' };
  }

  const existing = await findExistingPersona(input, email);
  if (existing) {
    const updated = await prisma.persona.update({
      where: { id: existing.id },
      data: {
        ...(input.source === 'hubspot' && input.sourceContactId && !existing.hubspot_contact_id
          ? { hubspot_contact_id: input.sourceContactId }
          : {}),
        ...(input.phone && !existing.phone ? { phone: input.phone } : {}),
        ...(input.title && !existing.title ? { title: normalizeTitle(input.title) } : {}),
        ...(input.optedOut ? { do_not_contact: true } : {}),
        ...(email && !existing.email ? { email } : {}),
      },
    });
    await upsertEnrichmentFields(updated.id, input, updated.account_name);
    await syncCanonicalRecords({ accountNames: [updated.account_name], personaIds: [updated.id] }).catch(() => undefined);
    return {
      status: existing.hubspot_contact_id || input.source !== 'hubspot' ? 'updated' : 'linked',
      personaId: updated.id,
      accountName: updated.account_name,
    };
  }

  const { account, created: createdAccount } = await resolveAccount(input, email);
  const rawName = displayName(input);
  const normalizedName = normalizeName(rawName);
  const { firstName, lastName } = splitName(rawName);
  const title = normalizeTitle(input.title ?? '');
  const domain = normalizeCompanyDomain(input.companyDomain ?? parseDomainFromEmail(email));
  const qualityResult = scoreContactQuality({
    name: normalizedName || rawName,
    title,
    accountName: account.name,
    email,
    companyDomain: domain,
    linkedinUrl: input.linkedinUrl,
    sourceEvidenceCount: input.source === 'manual' ? 1 : 2,
  });

  const sourceId = input.sourceContactId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const persona = await prisma.persona.create({
    data: {
      persona_id: `${input.source}-${sourceId}`,
      name: normalizedName || rawName,
      first_name: firstName || null,
      last_name: lastName || null,
      title: title || null,
      normalized_title: title || null,
      email,
      phone: input.phone || null,
      company_domain: domain,
      linkedin_url: input.linkedinUrl || null,
      account_name: account.name,
      priority: qualityResult.isReady ? 'P1' : 'P2',
      seniority: '',
      persona_lane: '',
      role_in_deal: '',
      hubspot_contact_id: input.source === 'hubspot' ? input.sourceContactId ?? null : null,
      email_valid: Boolean(email),
      email_confidence: qualityResult.emailConfidence,
      linkedin_confidence: qualityResult.linkedinConfidence,
      quality_band: qualityResult.band,
      quality_score: qualityResult.score,
      is_contact_ready: qualityResult.isReady && !input.optedOut,
      do_not_contact: Boolean(input.optedOut) || (createdAccount ? !isNewAccountSendEligible(qualityResult.score) : false),
      persona_status: createdAccount ? 'Needs Review' : 'Not started',
      source_type: input.source,
      source_url: input.linkedinUrl || null,
      source_evidence: {
        source: input.source,
        sourceContactId: input.sourceContactId ?? null,
        companyDomain: domain,
      },
      last_enriched_at: input.source === 'manual' ? null : new Date(),
    },
  });

  await upsertEnrichmentFields(persona.id, input, account.name);
  await syncCanonicalRecords({ accountNames: [account.name], personaIds: [persona.id] }).catch(() => undefined);
  return { status: 'imported', personaId: persona.id, accountName: account.name };
}

export function summarizeImportResults(results: ExternalContactImportResult[]) {
  return {
    imported: results.filter((result) => result.status === 'imported').length,
    linked: results.filter((result) => result.status === 'linked').length,
    updated: results.filter((result) => result.status === 'updated').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
    blocked: results.filter((result) => result.status === 'blocked').length,
  };
}
