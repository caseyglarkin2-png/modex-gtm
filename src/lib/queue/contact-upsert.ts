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
import { upsertContact } from '@/lib/hubspot/contacts';

const WARN_PREFIX = '[queue/contact-upsert]';

/** Split a full name on the LAST space; a single token is firstname only. */
function splitPersonaName(name?: string | null): { firstname?: string; lastname?: string } {
  const cleaned = name?.trim().replace(/\s+/g, ' ') ?? '';
  if (!cleaned) return {};
  const idx = cleaned.lastIndexOf(' ');
  if (idx === -1) return { firstname: cleaned };
  return { firstname: cleaned.slice(0, idx), lastname: cleaned.slice(idx + 1) };
}

/**
 * Upsert the person behind a queue item: Persona row first (so a HubSpot
 * outage never costs the local record), then the HubSpot contact. Never
 * throws; any failure is logged and reported through `ok`.
 */
export async function upsertContactFromQueueItem(item: {
  toEmail: string;
  personaName?: string | null;
  personaTitle?: string | null;
  accountName: string;
}): Promise<{ ok: boolean; personaCreated: boolean; hubspotId?: string }> {
  const email = item.toEmail.toLowerCase().trim();

  let personaId: number | null = null;
  let personaHubspotId: string | null = null;
  let personaCreated = false;

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
  } catch (err) {
    console.warn(`${WARN_PREFIX} persona upsert failed for ${email}:`, err);
    return { ok: false, personaCreated: false };
  }

  let hubspotId: string | undefined;
  if (HUBSPOT_SYNC_ENABLED && isHubSpotConfigured()) {
    try {
      const id = await upsertContact({
        email,
        ...splitPersonaName(item.personaName),
        ...(item.personaTitle ? { jobtitle: item.personaTitle } : {}),
        company: item.accountName,
      });
      if (id) {
        hubspotId = id;
        if (personaId !== null && !personaHubspotId) {
          await prisma.persona.update({
            where: { id: personaId },
            data: { hubspot_contact_id: id },
          });
        }
      }
    } catch (err) {
      console.warn(`${WARN_PREFIX} hubspot upsert failed for ${email}:`, err);
    }
  }

  return { ok: true, personaCreated, hubspotId };
}
