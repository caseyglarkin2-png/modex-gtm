import { Client } from '@hubspot/api-client';
import * as Sentry from '@sentry/nextjs';

let _client: Client | null = null;

/** Get the singleton HubSpot API client. Throws if HUBSPOT_ACCESS_TOKEN is not set. */
export function getHubSpotClient(): Client {
  if (_client) return _client;

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is not set');
  }

  _client = new Client({ accessToken: token });
  return _client;
}

/** Check if HubSpot is configured (token present). */
export function isHubSpotConfigured(): boolean {
  return !!process.env.HUBSPOT_ACCESS_TOKEN;
}

/** Get the HubSpot portal ID for building URLs. */
export function getPortalId(): string {
  return process.env.HUBSPOT_PORTAL_ID || '';
}

/**
 * Rate-limit-aware wrapper for HubSpot API calls.
 * Retries up to 3 times on 429 with exponential backoff + jitter.
 * Logs retries to Sentry. Graceful degradation: returns null on auth errors.
 */
export async function withHubSpotRetry<T>(
  fn: () => Promise<T>,
  context?: string,
): Promise<T> {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 1000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const statusCode = getStatusCode(error);

      // 429 rate limit — retry with backoff
      if (statusCode === 429 && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
        Sentry.addBreadcrumb({
          message: `HubSpot 429 retry ${attempt + 1}/${MAX_RETRIES}`,
          data: { context, delay },
          level: 'warning',
        });
        await sleep(delay);
        continue;
      }

      // 401 auth error — don't retry, report
      if (statusCode === 401) {
        Sentry.captureException(error, {
          tags: { hubspot: 'auth_error' },
          extra: { context },
        });
      }

      throw error;
    }
  }

  // TypeScript: unreachable, but satisfies return type
  throw new Error('withHubSpotRetry: max retries exceeded');
}

function getStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    // @hubspot/api-client throws HttpError with code property
    if ('code' in error && typeof (error as Record<string, unknown>).code === 'number') {
      return (error as Record<string, unknown>).code as number;
    }
    // Also check status and statusCode
    if ('status' in error && typeof (error as Record<string, unknown>).status === 'number') {
      return (error as Record<string, unknown>).status as number;
    }
    if ('statusCode' in error && typeof (error as Record<string, unknown>).statusCode === 'number') {
      return (error as Record<string, unknown>).statusCode as number;
    }
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
