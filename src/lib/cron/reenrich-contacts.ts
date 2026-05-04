import { prisma } from '@/lib/prisma';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { isApolloConfigured } from '@/lib/enrichment/apollo-client';
import { getEnrichmentBatchPolicy, getEnrichmentThresholds } from '@/lib/enrichment/config';
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
    const policy = getEnrichmentBatchPolicy();
    const cursorKey = 'reenrich_contacts_cursor';
    const cursorState = await prisma.systemConfig.findUnique({ where: { key: cursorKey } });
    const cursor = Number(cursorState?.value || 0);
    const personas = await prisma.persona.findMany({
      where: {
        email: { not: null },
        hubspot_contact_id: { not: null },
      },
      include: {
        enrichment: true,
        account: true,
      },
      take: policy.batchSize,
      skip: Number.isFinite(cursor) && cursor >= 0 ? cursor : 0,
      orderBy: { id: 'asc' },
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

    const toProcess = stale.slice(0, policy.batchSize);
    const started = Date.now();
    for (const persona of toProcess) {
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

    const durationMs = Date.now() - started;
    const processed = toProcess.length;
    const throughputPerHour = durationMs > 0 ? Math.round((processed * 3_600_000) / durationMs) : 0;
    const noMatchRate = processed > 0 ? stats.noMatch / processed : 0;
    const matchRate = processed > 0 ? stats.matched / processed : 0;

    await prisma.systemConfig.upsert({
      where: { key: cursorKey },
      update: { value: String((Number.isFinite(cursor) ? cursor : 0) + personas.length) },
      create: { key: cursorKey, value: String(personas.length) },
    });

    await prisma.systemConfig.upsert({
      where: { key: 'coverage_recent_enrichment_delta' },
      update: { value: JSON.stringify({ at: new Date().toISOString(), processed, matched: stats.matched, noMatch: stats.noMatch, errors: stats.errors, throughputPerHour, matchRate, noMatchRate }) },
      create: { key: 'coverage_recent_enrichment_delta', value: JSON.stringify({ at: new Date().toISOString(), processed, matched: stats.matched, noMatch: stats.noMatch, errors: stats.errors, throughputPerHour, matchRate, noMatchRate }) },
    });

    // Cost/quota telemetry placeholders (actual billing APIs can replace these in production).
    await prisma.systemConfig.upsert({
      where: { key: 'coverage_connector_cost_quota' },
      update: {
        value: JSON.stringify({
          at: new Date().toISOString(),
          apollo_credits_used: processed,
          hubspot_calls_used: processed,
          cost_per_enriched_contact: processed > 0 ? 1 : 0,
          p95_sync_duration: durationMs,
        }),
      },
      create: {
        key: 'coverage_connector_cost_quota',
        value: JSON.stringify({
          at: new Date().toISOString(),
          apollo_credits_used: processed,
          hubspot_calls_used: processed,
          cost_per_enriched_contact: processed > 0 ? 1 : 0,
          p95_sync_duration: durationMs,
        }),
      },
    });

    await markCronSuccess(REENRICH_CRON_NAME, {
      path: REENRICH_CRON_PATH,
      schedule: REENRICH_CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Re-enriched ${stats.matched} matched and ${stats.noMatch} no-match contacts`,
      stats: { ...stats, batchSize: policy.batchSize, throughputPerHour, matchRate, noMatchRate },
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
