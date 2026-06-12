/**
 * Persona + HubSpot contact upsert for clawd-staged queue items.
 *
 * Clawd sources the PERSON on each draft (name, email, title); this records
 * that person locally (Persona) and in the CRM (HubSpot contact) so target
 * accounts stop showing zero contacts. Fail-soft by design: a draft intake
 * must never be rejected because the contact bookkeeping failed.
 */
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { isHubSpotConfigured } from '@/lib/hubspot/client';
import { searchContactByEmail, updateContactProperties, upsertContact } from '@/lib/hubspot/contacts';
import { splitName } from '@/lib/contact-standard';
import { isBlockedRecipientDomain } from '@/lib/contacts/blocked-domains';

const WARN_PREFIX = '[queue/contact-upsert]';

/** The HubSpot contact properties clawd is allowed to source. */
function desiredHubSpotProperties(item: {
  personaName?: string | null;
  personaTitle?: string | null;
  accountName: string;
}): Partial<Record<'firstname' | 'lastname' | 'jobtitle' | 'company', string>> {
  const { firstName, lastName } = splitName(item.personaName ?? '');
  return {
    ...(firstName ? { firstname: firstName } : {}),
    ...(lastName ? { lastname: lastName } : {}),
    ...(item.personaTitle ? { jobtitle: item.personaTitle } : {}),
    company: item.accountName,
  };
}

/**
 * Upsert the person behind a queue item: Persona row first (so a HubSpot
 * outage never costs the local record), then the HubSpot contact. The two
 * writes are independent: a Persona failure (e.g. a net-new discovery
 * facility with no Account row backing the `account_name` FK) must never
 * block the CRM upsert. Never throws; `ok` is true if either write landed.
 *
 * Guardrails on the CRM side:
 * - Blocked recipient domains (customers, partners, us) skip BOTH writes.
 * - An EXISTING HubSpot contact only gets a fill-only patch — properties
 *   already curated in the CRM are never overwritten by clawd's
 *   facility-name `company` or guessed titles.
 * - `contactConfidence === 'low'` (pattern-guessed email) never CREATES a
 *   new HubSpot contact; updating one found by email is fine, since the
 *   email evidently exists.
 */
export async function upsertContactFromQueueItem(item: {
  toEmail: string;
  personaName?: string | null;
  personaTitle?: string | null;
  accountName: string;
  contactConfidence?: string | null;
}): Promise<{ ok: boolean; personaCreated: boolean; personaOk: boolean; hubspotId?: string }> {
  const email = item.toEmail.toLowerCase().trim();

  if (isBlockedRecipientDomain(email)) {
    console.warn(`${WARN_PREFIX} blocked recipient domain; skipping all contact writes for ${email}`);
    return { ok: false, personaCreated: false, personaOk: false };
  }

  let personaId: number | null = null;
  let personaHubspotId: string | null = null;
  let personaCreated = false;
  let personaOk = false;

  try {
    const existing = await prisma.persona.findFirst({
      where: { email },
      select: { id: true, title: true, hubspot_contact_id: true },
    });
    if (existing) {
      personaId = existing.id;
      personaHubspotId = existing.hubspot_contact_id;
      if (!existing.title && item.personaTitle) {
        await prisma.persona.update({
          where: { id: existing.id },
          data: { title: item.personaTitle },
        });
      }
    } else {
      const created = await prisma.persona.create({
        data: {
          persona_id: `clawd-${randomUUID()}`,
          account_name: item.accountName,
          priority: 'P2',
          name: item.personaName?.trim() || email,
          title: item.personaTitle ?? null,
          email,
          source_type: 'clawd',
        },
        select: { id: true },
      });
      personaId = created.id;
      personaCreated = true;
    }
    personaOk = true;
  } catch (err) {
    // Fail-soft: most clawd hand-off accounts have no Account row backing
    // the Persona FK. Skip the local record and still upsert into HubSpot.
    console.warn(`${WARN_PREFIX} persona upsert failed for ${email}:`, err);
  }

  let hubspotId: string | undefined;
  if (HUBSPOT_SYNC_ENABLED && isHubSpotConfigured()) {
    try {
      const desired = desiredHubSpotProperties(item);
      const existing = await searchContactByEmail(email);
      if (existing) {
        // Never overwrite curated CRM data: fill only the properties that
        // are empty on the existing record; skip the API write entirely
        // when there is nothing to fill.
        const fill: Record<string, string> = {};
        for (const [key, value] of Object.entries(desired)) {
          if (value && !existing[key as 'firstname' | 'lastname' | 'jobtitle' | 'company']) {
            fill[key] = value;
          }
        }
        if (Object.keys(fill).length > 0) {
          await updateContactProperties(existing.id, fill);
        }
        hubspotId = existing.id;
      } else if (item.contactConfidence !== 'low') {
        hubspotId = (await upsertContact({ email, ...desired })) ?? undefined;
      }
      // contactConfidence === 'low' with no existing contact: a
      // pattern-guessed email must not mint a brand-new CRM record.
    } catch (err) {
      console.warn(`${WARN_PREFIX} hubspot upsert failed for ${email}:`, err);
    }

    if (hubspotId !== undefined && personaId !== null && !personaHubspotId) {
      try {
        await prisma.persona.update({
          where: { id: personaId },
          data: { hubspot_contact_id: hubspotId },
        });
      } catch (err) {
        // The CRM write landed; only the local id backfill failed.
        console.warn(`${WARN_PREFIX} hubspot_contact_id backfill failed for ${email}:`, err);
      }
    }
  }

  return { ok: personaOk || hubspotId !== undefined, personaCreated, personaOk, hubspotId };
}
