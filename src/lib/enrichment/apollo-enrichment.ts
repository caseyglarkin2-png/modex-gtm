import type { HubSpotContact } from '@/lib/hubspot/contacts';
import { prisma } from '@/lib/prisma';
import { searchApolloPeople } from '@/lib/enrichment/apollo-client';
import { matchApolloPerson } from '@/lib/enrichment/apollo-match';
import { splitName } from '@/lib/contact-standard';

export type ApolloEnrichmentOutcome =
  | { status: 'matched'; personaId: number; apolloPersonId: string; confidence: number }
  | { status: 'no_match'; personaId: number; confidence: number }
  | { status: 'no_local_persona' };

function normalizeDomain(urlOrDomain: string | undefined): string | null {
  if (!urlOrDomain) return null;
  const value = urlOrDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  return value.split('/')[0] || null;
}

export async function enrichPersonaFromHubSpotContact(contact: HubSpotContact): Promise<ApolloEnrichmentOutcome> {
  const persona = await prisma.persona.findFirst({
    where: {
      OR: [
        { hubspot_contact_id: contact.id },
        { email: contact.email.toLowerCase() },
      ],
    },
    select: {
      id: true,
      name: true,
      title: true,
      email: true,
      account_name: true,
    },
  });

  if (!persona) return { status: 'no_local_persona' };

  const { firstName, lastName } = splitName(persona.name);
  const query = [contact.email, persona.name, contact.company, persona.title].filter(Boolean).join(' ');
  const candidates = await searchApolloPeople(query);
  const matched = matchApolloPerson(
    {
      email: contact.email,
      firstName: firstName || contact.firstname || '',
      lastName: lastName || contact.lastname || '',
      company: contact.company || persona.account_name,
      title: persona.title || contact.jobtitle || '',
    },
    candidates,
  );

  const enrichment = await prisma.contactEnrichment.upsert({
    where: { persona_id: persona.id },
    update: {
      apollo_person_id: matched.person?.id ?? null,
      enrichment_confidence: matched.score / 100,
      last_enriched_at: new Date(),
    },
    create: {
      persona_id: persona.id,
      apollo_person_id: matched.person?.id ?? null,
      enrichment_confidence: matched.score / 100,
      last_enriched_at: new Date(),
    },
  });

  const fields = matched.person
    ? [
      { field: 'first_name', value: matched.person.first_name ?? '' },
      { field: 'last_name', value: matched.person.last_name ?? '' },
      { field: 'email', value: matched.person.email ?? contact.email },
      { field: 'job_title', value: matched.person.title ?? contact.jobtitle ?? '' },
      { field: 'company_name', value: matched.person.organization?.name ?? contact.company ?? '' },
      { field: 'company_domain', value: normalizeDomain(matched.person.organization?.website_url ?? '') ?? normalizeDomain(contact.email) ?? '' },
      { field: 'company_industry', value: matched.person.organization?.industry ?? '' },
    ]
    : [];

  for (const item of fields) {
    await prisma.contactEnrichmentField.upsert({
      where: {
        contact_enrichment_id_field_name: {
          contact_enrichment_id: enrichment.id,
          field_name: item.field,
        },
      },
      update: {
        field_value: item.value || null,
        source: 'apollo',
        source_timestamp: new Date(),
        confidence: matched.score / 100,
        last_writer: 'apollo_enrichment',
      },
      create: {
        contact_enrichment_id: enrichment.id,
        field_name: item.field,
        field_value: item.value || null,
        source: 'apollo',
        source_timestamp: new Date(),
        confidence: matched.score / 100,
        last_writer: 'apollo_enrichment',
      },
    });
  }

  if (!matched.person) {
    return {
      status: 'no_match',
      personaId: persona.id,
      confidence: matched.score / 100,
    };
  }

  return {
    status: 'matched',
    personaId: persona.id,
    apolloPersonId: matched.person.id,
    confidence: matched.score / 100,
  };
}
