'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getContactById, hsSearchContacts, listRecentContacts, type HubSpotContact } from '@/lib/hubspot/contacts';
import { normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from '@/lib/contact-standard';
import { buildHubSpotIntakeCandidates, type HubSpotIntakeCandidate } from '@/lib/contacts/hubspot-intake';
import { enrichPersonaFromHubSpotContact } from '@/lib/enrichment/apollo-enrichment';
import {
  isNewAccountSendEligible,
  likelySameCompanyName,
  normalizeCompanyDomain,
} from '@/lib/accounts/import-guardrails';

const BLOCKED_DOMAINS = new Set([
  'dannon.com', 'danone.com', 'bluetriton.com', 'yardflow.ai',
  'niagarawater.com', 'lpcorp.com', 'xpo.com', 'kraftheinz.com', 'freightroll.com',
]);

export interface SearchResult {
  contacts: HubSpotIntakeCandidate[];
  total: number;
  nextAfter?: string;
}

type IntakeFixtureStore = {
  contacts: HubSpotContact[];
};

function isProofModeEnabled(): boolean {
  return process.env.ONE_PAGER_PROOF_MODE === '1';
}

async function getProofContactsFixture(): Promise<HubSpotContact[] | null> {
  if (!isProofModeEnabled()) return null;
  const fixture = await prisma.systemConfig.findUnique({
    where: { key: 'e2e:contacts_intake_fixture' },
    select: { value: true },
  });
  if (!fixture?.value) return null;
  try {
    const parsed = JSON.parse(fixture.value) as IntakeFixtureStore;
    return Array.isArray(parsed.contacts) ? parsed.contacts : null;
  } catch {
    return null;
  }
}

async function getHubSpotContactByIdForIntake(hsId: string): Promise<HubSpotContact | null> {
  const fixtures = await getProofContactsFixture();
  if (fixtures) return fixtures.find((c) => c.id === hsId) ?? null;
  return getContactById(hsId);
}

async function annotateContacts(contacts: HubSpotContact[]): Promise<HubSpotIntakeCandidate[]> {
  if (contacts.length === 0) return [];

  const contactIds = contacts.map((c) => c.id);
  const emails = contacts.map((c) => c.email.toLowerCase());

  const personas = await prisma.persona.findMany({
    where: {
      OR: [
        { hubspot_contact_id: { in: contactIds } },
        { email: { in: emails } },
      ],
    },
    select: {
      id: true,
      hubspot_contact_id: true,
      email: true,
    },
  });

  const personaIds = personas.map((p) => p.id);
  const enrichments = personaIds.length
    ? await prisma.contactEnrichment.findMany({
      where: { persona_id: { in: personaIds } },
      select: {
        persona_id: true,
        apollo_person_id: true,
        enrichment_confidence: true,
        last_enriched_at: true,
      },
    })
    : [];

  return buildHubSpotIntakeCandidates(contacts, personas, enrichments);
}

export async function searchHubSpotContacts(query: string, after?: string): Promise<SearchResult> {
  if (!query.trim()) return { contacts: [], total: 0 };

  try {
    const fixtures = await getProofContactsFixture();
    if (fixtures) {
      const needle = query.toLowerCase().trim();
      const filtered = fixtures.filter((contact) => {
        const haystack = `${contact.firstname} ${contact.lastname} ${contact.email} ${contact.company}`.toLowerCase();
        return haystack.includes(needle);
      });
      const annotated = await annotateContacts(filtered);
      return { contacts: annotated, total: annotated.length };
    }

    const result = await hsSearchContacts(query, after, 50);
    const annotated = await annotateContacts(result.contacts);
    return {
      contacts: annotated,
      total: result.total,
      nextAfter: result.nextAfter,
    };
  } catch {
    return { contacts: [], total: 0 };
  }
}

export async function listRecentHubSpotContacts(after?: string): Promise<SearchResult> {
  try {
    const fixtures = await getProofContactsFixture();
    if (fixtures) {
      const annotated = await annotateContacts(fixtures.slice(0, 50));
      return { contacts: annotated, total: annotated.length };
    }

    const result = await listRecentContacts(after, 50);
    const annotated = await annotateContacts(result.contacts);
    return {
      contacts: annotated,
      total: annotated.length,
      nextAfter: result.nextAfter,
    };
  } catch {
    return { contacts: [], total: 0 };
  }
}

export async function importHubSpotContact(contact: HubSpotContact): Promise<{ success: boolean; error?: string }> {
  const result = await importHubSpotContactInternal(contact);
  if (result.success) revalidatePath('/contacts');
  return result;
}

async function importHubSpotContactInternal(contact: HubSpotContact): Promise<{ success: boolean; error?: string; blocked?: boolean; linked?: boolean; skipped?: boolean }> {
  try {
    const blockedDomain = parseDomainFromEmail(contact.email);
    if (blockedDomain && BLOCKED_DOMAINS.has(blockedDomain)) {
      return { success: false, error: 'Blocked domain', blocked: true };
    }

    // Check dedup
    const existing = await prisma.persona.findFirst({
      where: {
        OR: [
          { hubspot_contact_id: contact.id },
          { email: contact.email.toLowerCase() },
        ],
      },
    });

    if (existing) {
      // Link if not already linked
      if (!existing.hubspot_contact_id) {
        await prisma.persona.update({
          where: { id: existing.id },
          data: { hubspot_contact_id: contact.id },
        });
        return { success: true, linked: true };
      }
      return { success: false, error: 'Contact already exists in database', skipped: true };
    }

    const domain = parseDomainFromEmail(contact.email);
    const { firstName, lastName } = splitName(`${contact.firstname} ${contact.lastname}`.trim());
    const fullName = normalizeName(`${firstName} ${lastName}`);
    const title = normalizeTitle(contact.jobtitle || '');
    const accountName = contact.company || domain || 'Unknown';
    const normalizedDomain = normalizeCompanyDomain(domain);

    // Ensure account exists
    const account = await prisma.account.findFirst({
      where: { name: { equals: accountName, mode: 'insensitive' } },
    });
    let resolvedAccount = account;
    if (!resolvedAccount && normalizedDomain) {
      resolvedAccount = await prisma.account.findFirst({
        where: { source_url_1: `https://${normalizedDomain}` },
      });
    }
    if (!resolvedAccount) {
      const near = await prisma.account.findMany({
        where: { name: { contains: accountName.split(' ')[0] || accountName, mode: 'insensitive' } },
        take: 20,
      });
      resolvedAccount = near.find((candidate) => likelySameCompanyName(candidate.name, accountName)) ?? null;
    }

    const isNewAccount = !resolvedAccount;
    if (!resolvedAccount) {
      resolvedAccount = await prisma.account.create({
        data: {
          name: accountName,
          rank: 999,
          vertical: 'Unknown',
          owner: 'Unassigned',
          research_status: 'Needs Review',
          priority_band: 'D',
          priority_score: 50,
          icp_fit: 50,
          modex_signal: 0,
          primo_story_fit: 0,
          warm_intro: 0,
          strategic_value: 50,
          meeting_ease: 50,
          source: 'hubspot_import',
          source_url_1: normalizedDomain ? `https://${normalizedDomain}` : null,
          notes: 'Auto-triaged from HubSpot import. Requires vertical/domain/owner review.',
        },
      });
    }

    const qualityResult = scoreContactQuality({
      name: fullName || contact.email,
      title: title || undefined,
      accountName: resolvedAccount?.name ?? accountName,
      email: contact.email,
    });

    await prisma.persona.create({
      data: {
        persona_id: `hs-${contact.id}`,
        name: fullName || contact.email,
        title: title || null,
        email: contact.email.toLowerCase(),
        phone: contact.phone || null,
        account_name: resolvedAccount?.name ?? accountName,
        priority: 'P2',
        seniority: '',
        persona_lane: '',
        role_in_deal: '',
        hubspot_contact_id: contact.id,
        email_valid: true,
        quality_band: qualityResult.band,
        quality_score: qualityResult.score,
        do_not_contact: isNewAccount ? !isNewAccountSendEligible(qualityResult.score) : false,
        persona_status: isNewAccount ? 'Needs Review' : 'Not started',
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed';
    return { success: false, error: message };
  }
}

export async function importHubSpotContactsBulk(hubspotContactIds: string[]): Promise<{
  imported: number;
  linked: number;
  skipped: number;
  blocked: number;
  errors: number;
}> {
  if (hubspotContactIds.length === 0) {
    return { imported: 0, linked: 0, skipped: 0, blocked: 0, errors: 0 };
  }

  const summary = { imported: 0, linked: 0, skipped: 0, blocked: 0, errors: 0 };
  for (const hsId of hubspotContactIds.slice(0, 100)) {
    try {
      const contact = await getHubSpotContactByIdForIntake(hsId);
      if (!contact) {
        summary.errors++;
        continue;
      }
      const imported = await importHubSpotContactInternal(contact);
      if (imported.success && imported.linked) summary.linked++;
      else if (imported.success) summary.imported++;
      else if (imported.blocked) summary.blocked++;
      else if (imported.skipped) summary.skipped++;
      else summary.errors++;
    } catch {
      summary.errors++;
    }
  }
  revalidatePath('/contacts');
  return summary;
}

export async function enrichHubSpotContactsBulk(hubspotContactIds: string[]): Promise<{
  matched: number;
  noMatch: number;
  noLocalPersona: number;
  errors: number;
}> {
  const summary = { matched: 0, noMatch: 0, noLocalPersona: 0, errors: 0 };
  for (const hsId of hubspotContactIds.slice(0, 100)) {
    try {
      const contact = await getHubSpotContactByIdForIntake(hsId);
      if (!contact) {
        summary.errors++;
        continue;
      }
      const result = await enrichPersonaFromHubSpotContact(contact);
      if (result.status === 'matched') summary.matched++;
      else if (result.status === 'no_match') summary.noMatch++;
      else summary.noLocalPersona++;
    } catch {
      summary.errors++;
    }
  }
  revalidatePath('/contacts');
  return summary;
}

export async function addToWave(
  accountName: string,
  waveName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure account exists
    const account = await prisma.account.findFirst({
      where: { name: { equals: accountName, mode: 'insensitive' } },
    });
    if (!account) {
      return { success: false, error: `Account "${accountName}" not found` };
    }

    // Check if already in this wave
    const existing = await prisma.outreachWave.findFirst({
      where: {
        account_name: account.name,
        wave: waveName,
      },
    });
    if (existing) {
      return { success: false, error: `${account.name} is already in ${waveName}` };
    }

    // Get next wave_order
    const maxOrder = await prisma.outreachWave.aggregate({
      _max: { wave_order: true },
      where: { wave: waveName },
    });

    await prisma.outreachWave.create({
      data: {
        wave: waveName,
        wave_order: (maxOrder._max.wave_order ?? 0) + 1,
        account_name: account.name,
        priority_score: account.priority_score,
        tier: account.priority_band,
        owner: 'Casey',
        status: 'Not started',
      },
    });

    revalidatePath('/contacts');
    revalidatePath('/waves');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to wave';
    return { success: false, error: message };
  }
}
