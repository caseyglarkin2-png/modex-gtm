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
  /**
   * True when the session qualifies as real intent worth STAMPING to the
   * CRM (intent_score / last_intent_at on the contact or company), even
   * when it is too short to page a rep. Audit finding 2026-06-12: stamps
   * were coupled to the ping decision, so the 45s ping dwell-floor was
   * silently dropping CRM intent capture for short genuine engagements.
   */
  stamp: boolean;
  /** Machine-readable trigger reason, for logging. */
  reason: string;
}

export function decideIntentNotification({
  existing,
  snapshot,
  mergedSession,
}: IntentDecisionInput): IntentDecision {
  // Human traffic only. The route stamps trafficQuality before this runs.
  if (readTrafficQuality(snapshot.metadata) !== 'human') {
    return { notify: false, stamp: false, reason: 'non-human' };
  }
  // A freshly-tripped CTA is the strongest same-session signal.
  const newCta =
    !!snapshot.lastCtaId && !(existing?.cta_ids ?? []).includes(snapshot.lastCtaId);
  const highIntent = isHighIntentMicrositeSession(mergedSession);
  const stamp = newCta || highIntent;
  if (!stamp) {
    return { notify: false, stamp: false, reason: 'below-threshold' };
  }
  const reason = newCta ? `cta:${snapshot.lastCtaId}` : 'high-intent';
  // One ping per session — never re-notify (stamps stay idempotent: a
  // re-stamp just refreshes recency on the CRM record).
  if (existing && readIntentNotified(existing.metadata)) {
    return { notify: false, stamp, reason: 'already-notified' };
  }
  // Acute-noise floor (2026-06-12): a 7-second bounce that clicks a CTA is
  // curiosity, not a page-the-rep moment — PINGS require real dwell. The
  // CRM stamp above is NOT gated by this; Account Pulse decays it properly.
  const minDwell = Number.parseInt(process.env.INTENT_PING_MIN_SECONDS ?? '45', 10);
  if ((mergedSession.duration_seconds ?? 0) < minDwell) {
    return { notify: false, stamp, reason: 'below-dwell-floor' };
  }
  return { notify: true, stamp, reason };
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

/**
 * Builds the row data for an in-app Notification mirroring an intent
 * Slack ping — so a hot signal also lands in the bell and the Engagement
 * Inbox, not only Slack. type `hot_engagement` is already styled by the
 * notification bell.
 */
export function buildIntentNotificationData(
  snapshot: MicrositeTrackingSnapshot,
  mergedSession: MicrositeEngagementAnalyticsInput,
  reason: string,
): {
  type: string;
  account_name: string | null;
  persona_email: string | null;
  subject: string;
  preview: string;
  source_id: string;
  read: boolean;
} {
  const who = snapshot.personName ?? 'An unknown viewer';
  const trigger = reason.startsWith('cta:')
    ? `clicked ${reason.slice(4)}`
    : 'hit a high-intent read';
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

  return {
    type: 'hot_engagement',
    account_name: snapshot.accountName,
    persona_email: null,
    subject: `${who} — ${trigger}`,
    preview: facts.join(' · '),
    source_id: `microsite-intent:${snapshot.sessionId}:${snapshot.path}`,
    read: false,
  };
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
