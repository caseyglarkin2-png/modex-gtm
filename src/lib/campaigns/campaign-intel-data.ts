/**
 * Server-side data loader for the Allentown command-center intel layer.
 *
 * Pulls the three sources the intel module needs - the discovery corridor
 * worklist (ranked + contact-coverage-joined), and the campaign's EmailLog /
 * DraftQueueItem ledger - and composes them with the canonical persons/accounts
 * view into a CampaignIntel bundle.
 *
 * Fail-soft throughout: any missing source (no DATABASE_URL, no scan output)
 * yields empty intel and the page still renders.
 */

import { prisma } from '@/lib/prisma';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { filterProspects } from '@/lib/discovery/filters';
import { rankWorklist, DEFAULT_WEIGHTS } from '@/lib/discovery/scoring';
import { loadContactCoverage } from '@/lib/discovery/contact-coverage';
import type { ViewAccount, ViewContact } from './canonical-view';
import {
  buildCampaignIntel,
  emptyIntel,
  ALLENTOWN_CAMPAIGN,
  type CampaignConfig,
  type CampaignEmailLog,
  type CampaignIntel,
  type DiscoveryIntelRow,
} from './campaign-intel';

/** Normalized person/persona name key for matching the ledger to canonical persons. */
function nameKey(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Load + rank the corridor discovery rows for a campaign, joined with contact
 * coverage, mapped to the small DiscoveryIntelRow the intel module consumes.
 * Empty array on any failure.
 */
export async function loadCorridorIntelRows(corridor: string): Promise<DiscoveryIntelRow[]> {
  try {
    const output = loadLatestScored();
    if (!output) return [];
    const curated = buildCuratedRows(output);
    const inCorridor = filterProspects(curated, { corridor });
    if (inCorridor.length === 0) return [];

    // Join contact coverage (placeId -> count), then rank by the worklist score.
    const coverage = await loadContactCoverage(inCorridor);
    const withCoverage = inCorridor.map((r) => ({ ...r, contactCount: coverage.get(r.placeId) ?? 0 }));
    const ranked = rankWorklist(withCoverage, DEFAULT_WEIGHTS);

    return ranked.map((r) => ({
      name: r.name,
      cityState: r.cityState,
      tier: r.tier,
      worklistScore: r.worklistScore,
      nearestPrimoDistance: r.nearestPrimoDistance,
      contactCount: r.contactCount ?? 0,
    }));
  } catch (err) {
    console.warn('[campaign-intel] corridor rows unavailable, rendering without them:', err);
    return [];
  }
}

/**
 * Match the campaign's EmailLog rows to the canonical persons by normalized
 * persona name, falling back to a draft-queue lookup for the to_email. Returns a
 * person.id -> EmailLog map (null when no send has fired for that person). Empty
 * map on any DB failure.
 */
export async function loadCampaignLogs(
  persons: ViewContact[],
  tag: string,
): Promise<Map<string, CampaignEmailLog | null>> {
  const out = new Map<string, CampaignEmailLog | null>();
  for (const p of persons) out.set(p.id, null);

  try {
    const logs = await prisma.emailLog.findMany({
      where: { campaign_tag: tag },
      select: {
        persona_name: true,
        to_email: true,
        status: true,
        opened_at: true,
        open_count: true,
        reply_count: true,
        sent_at: true,
      },
    });

    // persona name -> the most-engaged log row (a person may have several sends;
    // keep the warmest: replied > opened > sent, newest first).
    const byName = new Map<string, CampaignEmailLog>();
    const heat = (l: CampaignEmailLog) =>
      (l.replyCount > 0 ? 3 : 0) + (l.openedAt != null || l.openCount > 0 ? 2 : 0) + (l.sentAt != null ? 1 : 0);
    for (const l of logs) {
      const mapped: CampaignEmailLog = {
        toEmail: (l.to_email || '').toLowerCase(),
        status: l.status || 'sent',
        openedAt: l.opened_at ? l.opened_at.getTime() : null,
        openCount: l.open_count ?? 0,
        replyCount: l.reply_count ?? 0,
        sentAt: l.sent_at ? l.sent_at.getTime() : null,
      };
      const key = nameKey(l.persona_name || '');
      if (!key) continue;
      const prev = byName.get(key);
      if (!prev || heat(mapped) >= heat(prev)) byName.set(key, mapped);
    }

    for (const p of persons) {
      const key = nameKey(p.name);
      const log = byName.get(key) ?? null;
      out.set(p.id, log);
    }
  } catch (err) {
    console.warn('[campaign-intel] campaign logs unavailable, treating all as staged:', err);
  }
  return out;
}

/**
 * Compose the full intel bundle for a campaign from the canonical view +
 * the live ledger + the corridor worklist. Never throws.
 */
export async function loadCampaignIntel(args: {
  accounts: ViewAccount[];
  persons: ViewContact[];
  corridor: string;
  config?: CampaignConfig;
}): Promise<CampaignIntel> {
  const config = args.config ?? ALLENTOWN_CAMPAIGN;
  try {
    const [discoveryRows, logByPersonId] = await Promise.all([
      loadCorridorIntelRows(args.corridor),
      loadCampaignLogs(args.persons, config.tag),
    ]);
    return buildCampaignIntel({
      accounts: args.accounts,
      persons: args.persons,
      logByPersonId,
      discoveryRows,
      config,
    });
  } catch (err) {
    console.warn('[campaign-intel] intel unavailable, rendering empty:', err);
    return emptyIntel(config);
  }
}
