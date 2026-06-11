/**
 * D7.2 — HubSpot timeline write for microsite + demo intent signals.
 *
 * Fires alongside the existing Slack ping + in-app Notification row
 * (intent-notifications.ts) whenever a session crosses the intent
 * threshold. Posts a HubSpot Note attached to the prospect's contact
 * record so the sales workflow surfaces engagement inline on the
 * contact timeline — not just in our internal dashboard.
 *
 * Idempotency rides on the same `intentNotified` metadata flag the
 * Slack+in-app notifications use: one Note per session, on the first
 * qualifying signal. Anonymous sessions (no personSlug on the URL) are
 * skipped — we can't attach a Note to nobody.
 */

import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/data';
import { createNote } from '@/lib/hubspot/notes';
import { searchContactByEmail, updateContactIntent } from '@/lib/hubspot/contacts';
import { searchCompanyByName, updateCompanyIntent } from '@/lib/hubspot/companies';
import { getAccountMicrositeData } from './accounts';
import type { MicrositeTrackingSnapshot } from './tracking';
import type { MicrositeEngagementAnalyticsInput } from './analytics';

/**
 * Resolve the HubSpot company name for a tracking snapshot. `searchCompanyByName`
 * is an EXACT match, so a surface that sends a display-style name (e.g. the
 * native Flow-State- /for page sends `entity` = "Danone North America") would
 * never resolve the "Dannon" company. The microsite account registry is the
 * canonical slug → HubSpot-company-name map (the modex /demo + /for pages already
 * write intent with it), so prefer it by slug and fall back to whatever name the
 * caller sent for slugs not yet in the registry.
 */
function resolveCompanyNameForSearch(snapshot: MicrositeTrackingSnapshot): string {
  return getAccountMicrositeData(snapshot.accountSlug)?.accountName ?? snapshot.accountName;
}

function formatSecs(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m${sec.toString().padStart(2, '0')}s`;
}

function readProgress(metadata: unknown, key: string): number {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const raw = (metadata as Record<string, unknown>)[key];
    const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : typeof raw === 'number' ? raw : Number.NaN;
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  }
  return 0;
}

/**
 * Resolve a personSlug + accountName to a HubSpot contact ID. Prefers
 * the Persona table's `hubspot_contact_id` (already-synced), falls back
 * to an email lookup against HubSpot if the persona has an email but no
 * cached contact id.
 */
async function resolveHubSpotContactId(
  accountName: string,
  personSlug: string,
): Promise<string | null> {
  const personas = await prisma.persona.findMany({
    where: { account_name: accountName },
    select: { name: true, email: true, hubspot_contact_id: true },
  });
  const persona = personas.find((p) => slugify(p.name) === personSlug);
  if (!persona) return null;
  if (persona.hubspot_contact_id) return persona.hubspot_contact_id;
  if (persona.email) {
    const contact = await searchContactByEmail(persona.email);
    return contact?.id ?? null;
  }
  return null;
}

/**
 * Map a qualifying engagement session to a 0-100 intent score. This only runs
 * once a session has already crossed the intent threshold, so it starts from a
 * floor and adds weight for depth (time, scroll, sections), rich-media
 * consumption (audio/video past halfway), and explicit CTA clicks (the
 * strongest signal). Latest qualifying session wins (recency-weighted).
 */
function computeIntentScore(
  merged: MicrositeEngagementAnalyticsInput,
  audioPct: number,
  videoPct: number,
): number {
  let s = 10; // floor for crossing the threshold at all
  s += Math.min(merged.duration_seconds / 3, 40); // up to +40 (~120s)
  s += Math.min(merged.scroll_depth_pct / 5, 20); // up to +20 (full scroll)
  s += Math.min(merged.sections_viewed.length * 3, 15);
  if (audioPct >= 50 || videoPct >= 50) s += 10;
  s += Math.min(merged.cta_ids.length * 8, 25); // CTA clicks weigh heaviest
  return Math.min(Math.round(s), 100);
}

export async function logIntentToHubSpot(
  snapshot: MicrositeTrackingSnapshot,
  merged: MicrositeEngagementAnalyticsInput,
  reason: string,
): Promise<string | null> {
  const audioPct = readProgress(merged.metadata, 'audioProgressPct');
  const videoPct = readProgress(merged.metadata, 'videoProgressPct');
  const intentScore = computeIntentScore(merged, audioPct, videoPct);
  const at = new Date();

  // Account-level intent: ALWAYS stamp the COMPANY for this account, so demo /
  // microsite engagement registers even when the session has no resolvable
  // person (anonymous or account-only /demo/<account> links — the common case).
  // Best-effort; never blocks. Requires the account to exist as a HubSpot
  // company (true for our demo targets); silently no-ops if not found.
  try {
    const company = await searchCompanyByName(resolveCompanyNameForSearch(snapshot));
    if (company) {
      await updateCompanyIntent(company.id, {
        score: intentScore,
        source: snapshot.path,
        at,
      });
    }
  } catch {
    // never let account-level intent break the page view
  }

  // Person-level intent + a timeline Note only when the session resolves to a
  // known contact (person-specific microsite link).
  if (!snapshot.personSlug) return null;
  const contactId = await resolveHubSpotContactId(snapshot.accountName, snapshot.personSlug);
  if (!contactId) return null;

  const trigger = reason.startsWith('cta:')
    ? `clicked <b>${reason.slice(4)}</b>`
    : 'hit a high-intent read';

  const facts: string[] = [
    `${formatSecs(merged.duration_seconds)} on page`,
    `${merged.scroll_depth_pct}% scroll`,
    `${merged.sections_viewed.length} sections`,
  ];
  if (audioPct > 0) facts.push(`audio ${audioPct}%`);
  if (videoPct > 0) facts.push(`video ${videoPct}%`);
  if (merged.cta_ids.length > 0) facts.push(`CTA: ${merged.cta_ids.join(', ')}`);

  // Distinguish a demo session from a microsite (memo) session in the
  // note headline so a salesperson reading the contact timeline knows
  // which surface the prospect engaged.
  const isDemo = snapshot.path.startsWith('/demo/');
  const surfaceLabel = isDemo ? 'demo' : 'memo';

  const body = [
    `<b>YardFlow ${surfaceLabel} engagement</b> — ${trigger}`,
    `<i>Path:</i> ${snapshot.path}`,
    `<i>Stats:</i> ${facts.join(' · ')}`,
  ].join('<br>');

  // Write the numeric intent signal onto the contact (sortable hot-accounts
  // view) alongside the human-readable Note. Best-effort; never blocks the Note.
  await updateContactIntent(contactId, {
    score: intentScore,
    source: snapshot.path,
    at,
  });

  return createNote({ contactId, body });
}
