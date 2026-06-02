/**
 * I/O client for clawd's account-export endpoint.
 *
 *   GET {baseUrl}/api/yardflow/account/{domain}/export
 *   Auth: Authorization: Bearer {MC_API_TOKEN}
 *
 * Defaults match the convention used by scripts/export-enriched-hitlist.ts:
 * the production control-plane URL + the MC_API_TOKEN env var.
 */

import type { ClawdAccountExport } from '@/lib/signal-bridge/types';

export const DEFAULT_CLAWD_BASE_URL = 'https://clawd-control-plane-production.up.railway.app';

export function resolveClawdBaseUrl(): string {
  return (
    process.env.CLAWD_BASE_URL?.trim() ||
    process.env.CLAWD_CONTROL_PLANE_URL?.trim() ||
    DEFAULT_CLAWD_BASE_URL
  );
}

export function resolveClawdToken(): string {
  return (
    process.env.MC_API_TOKEN?.trim() ||
    process.env.CLAWD_API_TOKEN?.trim() ||
    process.env.CLAWD_CONTROL_PLANE_TOKEN?.trim() ||
    ''
  );
}

export function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

export function clawdExportUrl(baseUrl: string, domain: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/api/yardflow/account/${normalizeDomain(domain)}/export`;
}

export interface FetchClawdExportOptions {
  baseUrl?: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

function isValidExport(payload: unknown): payload is ClawdAccountExport {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.company === 'string' &&
    typeof p.domain === 'string' &&
    typeof p.fit === 'object' &&
    Array.isArray(p.signals) &&
    Array.isArray(p.committee)
  );
}

export async function fetchClawdExport(
  domain: string,
  options: FetchClawdExportOptions = {},
): Promise<ClawdAccountExport> {
  const baseUrl = options.baseUrl ?? resolveClawdBaseUrl();
  const token = options.token ?? resolveClawdToken();
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!token) {
    throw new Error(
      'Missing clawd API token. Set MC_API_TOKEN (the token used to call clawd) before importing.',
    );
  }

  const url = clawdExportUrl(baseUrl, domain);
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      (payload as Record<string, unknown>)?.error ??
      `clawd export request failed (${response.status})`;
    throw new Error(`${message} [${response.status}] for ${url}`);
  }

  if (!isValidExport(payload)) {
    throw new Error(
      `clawd export response did not match the expected contract (missing company/domain/fit/signals/committee) for ${url}`,
    );
  }

  return payload;
}
