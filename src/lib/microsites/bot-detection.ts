/**
 * Microsite traffic classification.
 *
 * Every microsite link is delivered by email (casey@freightroll.com
 * outreach). That means the recipient's email-security stack hits the
 * URL — usually before the human ever clicks — and JS-running scanners
 * (SafeLinks detonation, Proofpoint, etc.) create engagement rows that
 * look like real sessions. This module labels each session so the
 * analytics layer and intent notifications can ignore the noise.
 *
 * Three tiers:
 *   - 'bot'     — the User-Agent matches a known crawler / scanner /
 *                 unfurler. High confidence: never a human read.
 *   - 'suspect' — no User-Agent at all, OR a plausible human UA with
 *                 zero engagement trace (no scroll, sub-3s dwell, no
 *                 CTA, ≤1 section). Probably automation; excluded from
 *                 headline numbers but kept separate from 'bot'.
 *   - 'human'   — has a UA and left an engagement trace.
 *
 * Future (v2): correlate the hit timestamp against the Gmail send
 * timestamp — a hit seconds-to-minutes after send is almost certainly
 * a scanner. Not wired yet; needs the send-time join.
 */

export type TrafficQuality = 'human' | 'bot' | 'suspect';

/**
 * Substrings matched case-insensitively against the User-Agent. Covers
 * generic crawlers, email-security URL scanners, and chat/social link
 * unfurlers.
 */
const BOT_UA_PATTERNS: readonly string[] = [
  // Generic crawlers / automation clients
  'bot', 'crawl', 'spider', 'slurp', 'scan', 'headless', 'phantom',
  'python-requests', 'python-urllib', 'curl/', 'wget', 'go-http-client',
  'axios', 'node-fetch', 'okhttp', 'apache-httpclient', 'libwww',
  'http_request', 'java/', 'dart:io',
  // Email-security URL scanners / detonation services
  'safelinks', 'proofpoint', 'mimecast', 'barracuda', 'urldefense',
  'symantec', 'forcepoint', 'cloudmark', 'messagelabs', 'fireeye',
  'cisco', 'ironport', 'trendmicro', 'sophos', 'avast', 'bitdefender',
  'microsoftpreview', 'office365', 'outlook-ios',
  // Chat / social link unfurlers
  'slackbot', 'slack-imgproxy', 'facebookexternalhit', 'twitterbot',
  'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot',
  'skypeuripreview', 'bingpreview', 'google-safety', 'googleimageproxy',
  'embedly', 'quora link preview', 'redditbot', 'applebot',
];

export interface TrafficClassificationInput {
  userAgent: string | null | undefined;
  scrollDepthPct: number;
  durationSeconds: number;
  ctaCount: number;
  sectionCount: number;
}

export function classifyMicrositeTraffic(input: TrafficClassificationInput): TrafficQuality {
  const ua = (input.userAgent ?? '').trim().toLowerCase();

  // No User-Agent at all — a real browser always sends one.
  if (!ua) return 'suspect';

  if (BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern))) {
    return 'bot';
  }

  // Plausible human UA but no engagement trace at all. A real reader
  // scrolls something, dwells more than a few seconds, or trips a
  // section observer. A fetch-and-leave with none of that is almost
  // certainly automation that didn't identify itself.
  const noEngagementTrace =
    input.scrollDepthPct === 0 &&
    input.durationSeconds < 3 &&
    input.ctaCount === 0 &&
    input.sectionCount <= 1;
  if (noEngagementTrace) return 'suspect';

  return 'human';
}

/** Reads a previously-stored classification off an engagement metadata map. */
export function readTrafficQuality(metadata: unknown): TrafficQuality {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const value = (metadata as Record<string, unknown>).trafficQuality;
    if (value === 'bot' || value === 'suspect' || value === 'human') {
      return value;
    }
  }
  // Sessions written before this module shipped have no classification.
  // Treat them as human so historical data isn't silently dropped.
  return 'human';
}

export function isHumanTraffic(metadata: unknown): boolean {
  return readTrafficQuality(metadata) === 'human';
}
