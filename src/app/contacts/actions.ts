'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { hsSearchContacts, type HubSpotContact } from '@/lib/hubspot/contacts';
import { normalizeName, normalizeTitle, parseDomainFromEmail, scoreContactQuality, splitName } from '@/lib/contact-standard';

export interface SearchResult {
  contacts: HubSpotContact[];
  total: number;
  nextAfter?: string;
}

export async function searchHubSpotContacts(query: string, after?: string): Promise<SearchResult> {
  if (!query.trim()) return { contacts: [], total: 0 };

  try {
    const result = await hsSearchContacts(query, after, 50);
    return {
      contacts: result.contacts,
      total: result.total,
      nextAfter: result.nextAfter,
    };
  } catch {
    return { contacts: [], total: 0 };
  }
}

export async function importHubSpotContact(contact: HubSpotContact): Promise<{ success: boolean; error?: string }> {
  try {
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
        revalidatePath('/contacts');
        return { success: true };
      }
      return { success: false, error: 'Contact already exists in database' };
    }

    const domain = parseDomainFromEmail(contact.email);
    const { firstName, lastName } = splitName(`${contact.firstname} ${contact.lastname}`.trim());
    const fullName = normalizeName(`${firstName} ${lastName}`);
    const title = normalizeTitle(contact.jobtitle || '');
    const accountName = contact.company || domain || 'Unknown';

    // Ensure account exists
    const account = await prisma.account.findFirst({
      where: { name: { equals: accountName, mode: 'insensitive' } },
    });

    if (!account) {
      await prisma.account.create({
        data: {
          name: accountName,
          rank: 999,
          vertical: 'Unknown',
          priority_band: 'D',
          priority_score: 50,
          icp_fit: 50,
          modex_signal: 0,
          primo_story_fit: 0,
          warm_intro: 0,
          strategic_value: 50,
          meeting_ease: 50,
        },
      });
    }

    const qualityResult = scoreContactQuality({
      name: fullName || contact.email,
      title: title || undefined,
      accountName: account?.name ?? accountName,
      email: contact.email,
    });

    await prisma.persona.create({
      data: {
        persona_id: `hs-${contact.id}`,
        name: fullName || contact.email,
        title: title || null,
        email: contact.email.toLowerCase(),
        phone: contact.phone || null,
        account_name: account?.name ?? accountName,
        priority: 'P2',
        seniority: '',
        persona_lane: '',
        role_in_deal: '',
        persona_status: 'Not started',
        hubspot_contact_id: contact.id,
        email_valid: true,
        quality_band: qualityResult.band,
      },
    });

    revalidatePath('/contacts');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed';
    return { success: false, error: message };
  }
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
