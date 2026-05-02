import { prisma } from '@/lib/prisma';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { isApolloConfigured } from '@/lib/enrichment/apollo-client';
import { getEnrichmentThresholds } from '@/lib/enrichment/config';
import { getContactById } from '@/lib/hubspot/contacts';
import { enrichPersonaFromHubSpotContact } from '@/lib/enrichment/apollo-enrichment';

export const REENRICH_CRON_NAME = 'reenrich-contacts';
export const REENRICH_CRON_PATH = '/api/cron/reenrich-contacts';
export const REENRICH_CRON_SCHEDULE = '0 */8 * * *';

export type ReenrichStats = {
  considered: number;
  stale: number;
  matched: number;
  noMatch: number;
  noLocal: number;
  errors: number;
};

export type ReenrichRunResult =
  | { status: 'ok'; stats: ReenrichStats }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; error: string };

function daysSince(value: Date | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  return (Date.now() - value.getTime()) / (1000 * 60 * 60 * 24);
}

export async function runReenrichContactsCron(): Promise<ReenrichRunResult> {
  const startedAt = Date.now();
  await markCronStarted(REENRICH_CRON_NAME, {
    path: REENRICH_CRON_PATH,
    schedule: REENRICH_CRON_SCHEDULE,
  }).catch(() => undefined);

  if (!isApolloConfigured()) {
    await markCronSkipped(REENRICH_CRON_NAME, {
      path: REENRICH_CRON_PATH,
      schedule: REENRICH_CRON_SCHEDULE,
      reason: 'Apollo is not configured',
    }).catch(() => undefined);
    return { status: 'skipped', reason: 'Apollo is not configured' };
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

    const stats: ReenrichStats = {
      considered: personas.length,
      stale: stale.length,
      matched: 0,
      noMatch: 0,
      noLocal: 0,
      errors: 0,
    };

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

    await markCronSuccess(REENRICH_CRON_NAME, {
      path: REENRICH_CRON_PATH,
      schedule: REENRICH_CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Re-enriched ${stats.matched} matched and ${stats.noMatch} no-match contacts`,
      stats,
    }).catch(() => undefined);

    return { status: 'ok', stats };
  } catch (error) {
    await markCronFailure(REENRICH_CRON_NAME, {
      path: REENRICH_CRON_PATH,
      schedule: REENRICH_CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);
    return { status: 'error', error: error instanceof Error ? error.message : 'Failed' };
  }
}
