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
  watchedScanDomains,
  ALLENTOWN_CAMPAIGN,
  type CampaignConfig,
  type CampaignEmailLog,
  type CampaignIntel,
  type DiscoveryIntelRow,
  type InviteTruthInput,
} from './campaign-intel';
import { scanInviteTruth } from './gmail-invite-scan';

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
 * Match the campaign's EmailLog rows to the canonical persons by `person.email`
 * -> EmailLog.to_email (lowercased) — the robust join now that the canonical
 * view carries email (clawd deploy d810abac). The kdrp.com alias is preserved on
 * the person while the account still canonicalizes, so the email join is stable.
 * Falls back to the normalized-persona-name match only for persons with no email
 * (or no email-keyed send). Returns a person.id -> EmailLog map (null when no
 * send has fired for that person). Empty map on any DB failure.
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

    const heat = (l: CampaignEmailLog) =>
      (l.replyCount > 0 ? 3 : 0) + (l.openedAt != null || l.openCount > 0 ? 2 : 0) + (l.sentAt != null ? 1 : 0);

    // Primary index: lowercased to_email -> warmest log row. Name index kept as a
    // fallback for persons we have no email for.
    const byEmail = new Map<string, CampaignEmailLog>();
    const byName = new Map<string, CampaignEmailLog>();
    for (const l of logs) {
      const mapped: CampaignEmailLog = {
        toEmail: (l.to_email || '').toLowerCase(),
        status: l.status || 'sent',
        openedAt: l.opened_at ? l.opened_at.getTime() : null,
        openCount: l.open_count ?? 0,
        replyCount: l.reply_count ?? 0,
        sentAt: l.sent_at ? l.sent_at.getTime() : null,
      };
      if (mapped.toEmail) {
        const prev = byEmail.get(mapped.toEmail);
        if (!prev || heat(mapped) >= heat(prev)) byEmail.set(mapped.toEmail, mapped);
      }
      const nkey = nameKey(l.persona_name || '');
      if (nkey) {
        const prevN = byName.get(nkey);
        if (!prevN || heat(mapped) >= heat(prevN)) byName.set(nkey, mapped);
      }
    }

    for (const p of persons) {
      const email = (p.email || '').toLowerCase();
      let log: CampaignEmailLog | null = email ? byEmail.get(email) ?? null : null;
      // Name fallback only when email is absent or matched nothing.
      if (!log) log = byName.get(nameKey(p.name)) ?? null;
      out.set(p.id, log);
    }
  } catch (err) {
    console.warn('[campaign-intel] campaign logs unavailable, treating all as staged:', err);
  }
  return out;
}

/**
 * Scan Casey's Gmail (casey@freightroll.com) for the invite truth across the
 * watched domains, mapping the scan result to the InviteTruthInput the intel
 * module consumes. Fail-soft: empty map on any Gmail error (the scan itself is
 * already wrapped + cached). This is what lets the command center know who has
 * ACTUALLY been invited, including the invites Casey sent by hand outside the
 * modex Outbox.
 */
export async function loadInviteTruth(config: CampaignConfig): Promise<Map<string, InviteTruthInput>> {
  try {
    const domains = watchedScanDomains(config);
    const truth = await scanInviteTruth(domains);
    const out = new Map<string, InviteTruthInput>();
    for (const [domain, t] of truth) {
      out.set(domain, {
        domain: t.domain,
        invited: t.invited,
        invitedAt: t.invitedAt,
        repliedAt: t.repliedAt,
        lastSubject: t.lastSubject,
        source: 'gmail',
      });
    }
    return out;
  } catch (err) {
    console.warn('[campaign-intel] Gmail invite-truth scan unavailable, rendering without it:', err);
    return new Map();
  }
}

/**
 * Compose the full intel bundle for a campaign from the canonical view +
 * the live ledger + the corridor worklist + the Gmail invite truth. Never throws.
 */
export async function loadCampaignIntel(args: {
  accounts: ViewAccount[];
  persons: ViewContact[];
  corridor: string;
  config?: CampaignConfig;
}): Promise<CampaignIntel> {
  const config = args.config ?? ALLENTOWN_CAMPAIGN;
  try {
    const [discoveryRows, logByPersonId, inviteTruthByDomain] = await Promise.all([
      loadCorridorIntelRows(args.corridor),
      loadCampaignLogs(args.persons, config.tag),
      loadInviteTruth(config),
    ]);
    return buildCampaignIntel({
      accounts: args.accounts,
      persons: args.persons,
      logByPersonId,
      discoveryRows,
      inviteTruthByDomain,
      config,
    });
  } catch (err) {
    console.warn('[campaign-intel] intel unavailable, rendering empty:', err);
    return emptyIntel(config);
  }
}
