/**
 * Intent notifications — fire a Slack ping the moment a real prospect
 * engages a microsite, so a rep can follow up while attention is hot.
 *
 * Gated on PR 1's traffic classification: only human sessions trigger a
 * notification, never an email-security scanner. Deduped via an
 * `intentNotified` flag in the engagement metadata — one ping per
 * session, on the first qualifying signal.
 *
 * A notification fires when a human session either:
 *   - trips a new CTA (audio play, video play, calendar click), or
 *   - crosses into "high intent" per isHighIntentMicrositeSession
 *     (deep read, deep listen/watch, proposal+ROI, variant compare).
 *
 * Delivery is a Slack incoming webhook (SLACK_WEBHOOK_URL). If the env
 * var is unset the send is a no-op — the rest of the track route is
 * unaffected.
 */

import type { MicrositeTrackingSnapshot } from './tracking';
import { isHighIntentMicrositeSession, type MicrositeEngagementAnalyticsInput } from './analytics';
import { readTrafficQuality } from './bot-detection';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://modex-gtm.vercel.app';

/** True once an intent notification has already been sent for a session. */
export function readIntentNotified(metadata: unknown): boolean {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return (metadata as Record<string, unknown>).intentNotified === 'true';
  }
  return false;
}

export interface IntentDecisionInput {
  existing: { cta_ids?: string[] | null; metadata?: unknown } | null;
  snapshot: MicrositeTrackingSnapshot;
  mergedSession: MicrositeEngagementAnalyticsInput;
}

export interface IntentDecision {
  notify: boolean;
  /** Machine-readable trigger reason, for logging. */
  reason: string;
}

export function decideIntentNotification({
  existing,
  snapshot,
  mergedSession,
}: IntentDecisionInput): IntentDecision {
  // One ping per session — never re-notify.
  if (existing && readIntentNotified(existing.metadata)) {
    return { notify: false, reason: 'already-notified' };
  }
  // Human traffic only. The route stamps trafficQuality before this runs.
  if (readTrafficQuality(snapshot.metadata) !== 'human') {
    return { notify: false, reason: 'non-human' };
  }
  // A freshly-tripped CTA is the strongest same-session signal.
  const newCta =
    !!snapshot.lastCtaId && !(existing?.cta_ids ?? []).includes(snapshot.lastCtaId);
  if (newCta) {
    return { notify: true, reason: `cta:${snapshot.lastCtaId}` };
  }
  // Otherwise, fire once the merged session reads as high intent.
  if (isHighIntentMicrositeSession(mergedSession)) {
    return { notify: true, reason: 'high-intent' };
  }
  return { notify: false, reason: 'below-threshold' };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

function readProgress(metadata: unknown, key: string): number {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const raw = (metadata as Record<string, unknown>)[key];
    const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : typeof raw === 'number' ? raw : Number.NaN;
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n));
  }
  return 0;
}

/** Builds the Slack message text (mrkdwn) for an intent notification. */
export function buildIntentMessage(
  snapshot: MicrositeTrackingSnapshot,
  mergedSession: MicrositeEngagementAnalyticsInput,
  reason: string,
): string {
  const who = snapshot.personName ?? 'An unknown viewer';
  const account = snapshot.accountName;
  const audioPct = readProgress(mergedSession.metadata, 'audioProgressPct');
  const videoPct = readProgress(mergedSession.metadata, 'videoProgressPct');

  const facts: string[] = [
    `${formatDuration(mergedSession.duration_seconds)} on page`,
    `${mergedSession.scroll_depth_pct}% scroll`,
    `${mergedSession.sections_viewed.length} sections`,
  ];
  if (audioPct > 0) facts.push(`audio ${audioPct}%`);
  if (videoPct > 0) facts.push(`video ${videoPct}%`);
  if (mergedSession.cta_ids.length > 0) facts.push(`CTA: ${mergedSession.cta_ids.join(', ')}`);

  const trigger = reason.startsWith('cta:')
    ? `clicked *${reason.slice(4)}*`
    : 'hit a high-intent read';
  const dashboardUrl = `${APP_BASE_URL}/engagement`;

  return [
    `🔥 *${who}* — *${account}* ${trigger}`,
    facts.join(' · '),
    `<${dashboardUrl}|Open the engagement workspace> · ${snapshot.path}`,
  ].join('\n');
}

/** Posts a message to the Slack incoming webhook. No-op if unconfigured. */
export async function sendSlackNotification(text: string): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn('[intent-notify] SLACK_WEBHOOK_URL not set — notification skipped');
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`[intent-notify] Slack webhook returned ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[intent-notify] Slack send failed', error);
    return false;
  }
}
