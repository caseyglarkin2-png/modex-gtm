import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { isApolloConfigured } from '@/lib/enrichment/apollo-client';
import { getEnrichmentThresholds } from '@/lib/enrichment/config';
import { getContactById } from '@/lib/hubspot/contacts';
import { enrichPersonaFromHubSpotContact } from '@/lib/enrichment/apollo-enrichment';

export const dynamic = 'force-dynamic';

const CRON_NAME = 'reenrich-contacts';
const CRON_PATH = '/api/cron/reenrich-contacts';
const CRON_SCHEDULE = '0 */8 * * *';

const HeaderSchema = z.object({
  authorization: z.string().refine(
    (v) => v === `Bearer ${process.env.CRON_SECRET}`,
    'Invalid CRON_SECRET',
  ),
});

function daysSince(value: Date | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  return (Date.now() - value.getTime()) / (1000 * 60 * 60 * 24);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const headerParse = HeaderSchema.safeParse({ authorization: authHeader });
  if (!headerParse.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  if (!isApolloConfigured()) {
    await markCronSkipped(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      reason: 'Apollo is not configured',
    }).catch(() => undefined);
    return NextResponse.json({ status: 'skipped', reason: 'Apollo is not configured' });
  }

  try {
    const thresholds = getEnrichmentThresholds();
    const personas = await prisma.persona.findMany({
      where: {
        email: { not: null },
        hubspot_contact_id: { not: null },
      },
      include: {
        enrichment: true,
        account: true,
      },
      take: 100,
      orderBy: { updated_at: 'desc' },
    });

    const stale = personas.filter((persona) => {
      const days = daysSince(persona.enrichment?.last_enriched_at ?? null);
      const isNewCompany = persona.account.research_status === 'Needs Review' || persona.account.vertical === 'Unknown';
      const thresholdDays = isNewCompany ? 14 : thresholds.staleDaysPerson;
      return days >= thresholdDays;
    });

    const stats = { considered: personas.length, stale: stale.length, matched: 0, noMatch: 0, noLocal: 0, errors: 0 };

    for (const persona of stale.slice(0, 40)) {
      try {
        const contact = await getContactById(persona.hubspot_contact_id || '');
        if (!contact) {
          stats.errors++;
          continue;
        }
        const result = await enrichPersonaFromHubSpotContact(contact);
        if (result.status === 'matched') stats.matched++;
        else if (result.status === 'no_match') stats.noMatch++;
        else stats.noLocal++;
      } catch {
        stats.errors++;
      }
    }

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Re-enriched ${stats.matched} matched and ${stats.noMatch} no-match contacts`,
      stats,
    }).catch(() => undefined);

    return NextResponse.json({ status: 'ok', stats });
  } catch (error) {
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
