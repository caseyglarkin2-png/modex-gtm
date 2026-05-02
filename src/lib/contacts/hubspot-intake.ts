import type { HubSpotContact } from '@/lib/hubspot/contacts';
import { scoreContact } from '@/lib/contact-scoring';

export interface IntakePersonaRecord {
  id: number;
  hubspot_contact_id: string | null;
  email: string | null;
}

export interface IntakeEnrichmentRecord {
  persona_id: number;
  apollo_person_id: string | null;
  enrichment_confidence: number | null;
  last_enriched_at: Date | null;
}

export interface HubSpotIntakeCandidate extends HubSpotContact {
  localPersonaId: number | null;
  hasHubSpotLink: boolean;
  hasEnrichmentRecord: boolean;
  hasApolloEnrichment: boolean;
  enrichmentConfidence: number | null;
  lastEnrichedAt: string | null;
  helpfulBand: 'A' | 'B' | 'C' | 'D';
  helpfulScore: number;
  recommendedImport: boolean;
  enrichmentOutcome: 'matched' | 'no_match' | 'not_enriched';
}

export function buildHubSpotIntakeCandidates(
  contacts: HubSpotContact[],
  personas: IntakePersonaRecord[],
  enrichments: IntakeEnrichmentRecord[],
): HubSpotIntakeCandidate[] {
  const byHubSpotId = new Map(personas.filter((p) => p.hubspot_contact_id).map((p) => [p.hubspot_contact_id as string, p]));
  const byEmail = new Map(personas.filter((p) => p.email).map((p) => [(p.email as string).toLowerCase(), p]));
  const enrichmentByPersonaId = new Map(enrichments.map((e) => [e.persona_id, e]));

  return contacts.map((contact) => {
    const email = contact.email.toLowerCase();
    const linkedByHubSpot = byHubSpotId.get(contact.id) ?? null;
    const linkedByEmail = byEmail.get(email) ?? null;
    const localPersona = linkedByHubSpot ?? linkedByEmail;
    const enrichment = localPersona ? enrichmentByPersonaId.get(localPersona.id) ?? null : null;
    const helpful = scoreContact({
      title: contact.jobtitle,
      email: contact.email,
      company: contact.company,
      hasPhone: Boolean(contact.phone),
      hasName: Boolean(contact.firstname || contact.lastname),
    });

    const recommendedImport =
      !contact.hs_email_optout &&
      Boolean(contact.email) &&
      !linkedByHubSpot &&
      helpful.total >= 55;

    return {
      ...contact,
      localPersonaId: localPersona?.id ?? null,
      hasHubSpotLink: Boolean(linkedByHubSpot),
      hasEnrichmentRecord: Boolean(enrichment),
      hasApolloEnrichment: Boolean(enrichment?.apollo_person_id),
      enrichmentConfidence: enrichment?.enrichment_confidence ?? null,
      lastEnrichedAt: enrichment?.last_enriched_at?.toISOString() ?? null,
      helpfulBand: helpful.band,
      helpfulScore: helpful.total,
      recommendedImport,
      enrichmentOutcome: enrichment
        ? enrichment.apollo_person_id
          ? 'matched'
          : 'no_match'
        : 'not_enriched',
    };
  });
}
