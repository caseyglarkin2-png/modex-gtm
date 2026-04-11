import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { listRecentContacts, upsertContact, type HubSpotContact } from '@/lib/hubspot/contacts';
import { isHubSpotConfigured } from '@/lib/hubspot/client';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

const HeaderSchema = z.object({
  authorization: z.string().refine(
    (v) => v === `Bearer ${process.env.CRON_SECRET}`,
    'Invalid CRON_SECRET',
  ),
});

/**
 * Bidirectional HubSpot sync cron — runs every 6 hours.
 * Pull: Fetch updated HubSpot contacts → upsert local Persona records.
 * Push: Find local Personas with hubspot_contact_id + updated data → push to HubSpot.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const headerParse = HeaderSchema.safeParse({ authorization: authHeader });
  if (!headerParse.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) {
    return NextResponse.json({ status: 'skipped', reason: 'HubSpot sync disabled' });
  }

  const stats = { pulled: 0, pushed: 0, errors: 0 };

  try {
    // ── PULL: HubSpot → Local ─────────────────────────────
    const cursor = await prisma.systemConfig.findUnique({
      where: { key: 'hubspot_sync_cursor' },
    });

    let after = cursor?.value ?? undefined;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 10; // Safety limit

    while (hasMore && pageCount < maxPages) {
      pageCount++;
      const { contacts, nextAfter } = await listRecentContacts(after, 100);

      for (const hsContact of contacts) {
        try {
          await syncContactToLocal(hsContact);
          stats.pulled++;
        } catch (error) {
          console.error(`Pull sync error for ${hsContact.email}:`, error);
          stats.errors++;
        }
      }

      if (nextAfter) {
        after = nextAfter;
        // Save cursor after each page
        await prisma.systemConfig.upsert({
          where: { key: 'hubspot_sync_cursor' },
          create: { key: 'hubspot_sync_cursor', value: nextAfter },
          update: { value: nextAfter },
        });
      } else {
        hasMore = false;
      }
    }

    // ── PUSH: Local → HubSpot ─────────────────────────────
    const localUpdated = await prisma.persona.findMany({
      where: {
        hubspot_contact_id: { not: null },
        updated_at: {
          gte: new Date(Date.now() - 6 * 60 * 60 * 1000), // last 6 hours
        },
      },
      select: {
        name: true,
        email: true,
        title: true,
        phone: true,
        hubspot_contact_id: true,
        do_not_contact: true,
      },
    });

    for (const persona of localUpdated) {
      if (!persona.email || !persona.hubspot_contact_id) continue;
      try {
        const [first, ...lastParts] = persona.name.split(' ');
        await upsertContact({
          email: persona.email,
          firstname: first ?? '',
          lastname: lastParts.join(' '),
          jobtitle: persona.title ?? undefined,
          phone: persona.phone ?? undefined,
          ...(persona.do_not_contact ? { hs_email_optout: 'true' } : {}),
        });
        stats.pushed++;
      } catch (error) {
        console.error(`Push sync error for ${persona.email}:`, error);
        stats.errors++;
      }
    }

    // Track consecutive failures
    if (stats.errors > 0 && stats.pulled === 0 && stats.pushed === 0) {
      const failKey = 'hubspot_sync_consecutive_failures';
      const failConfig = await prisma.systemConfig.findUnique({ where: { key: failKey } });
      const failures = parseInt(failConfig?.value ?? '0', 10) + 1;
      await prisma.systemConfig.upsert({
        where: { key: failKey },
        create: { key: failKey, value: String(failures) },
        update: { value: String(failures) },
      });

      if (failures >= 3) {
        Sentry.captureMessage(`HubSpot sync failed ${failures} consecutive times`, 'error');
      }
    } else {
      // Reset failure counter on any success
      await prisma.systemConfig.upsert({
        where: { key: 'hubspot_sync_consecutive_failures' },
        create: { key: 'hubspot_sync_consecutive_failures', value: '0' },
        update: { value: '0' },
      });
    }

    return NextResponse.json({ status: 'ok', stats });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 },
    );
  }
}

async function syncContactToLocal(hsContact: HubSpotContact) {
  if (!hsContact.email) return;

  const existing = await prisma.persona.findFirst({
    where: {
      OR: [
        { hubspot_contact_id: hsContact.id },
        { email: hsContact.email.toLowerCase() },
      ],
    },
  });

  if (existing) {
    // Update existing — merge HubSpot data (HubSpot wins on contact fields)
    await prisma.persona.update({
      where: { id: existing.id },
      data: {
        hubspot_contact_id: hsContact.id,
        ...(hsContact.phone && !existing.phone ? { phone: hsContact.phone } : {}),
        ...(hsContact.hs_email_optout ? { do_not_contact: true } : {}),
      },
    });
  }
  // Don't auto-create personas from HubSpot pull — only link existing ones.
  // New contacts come through explicit import (5.2/5.3).
}
