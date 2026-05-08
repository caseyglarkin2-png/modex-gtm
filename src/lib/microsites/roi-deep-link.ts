/**
 * Sprint M4 — ROI deep-link builder.
 *
 * The memo template ends every account microsite with a single soft action:
 * "Run the calculator on your specific network." The link goes to the
 * existing yardflow.ai/roi/ page (the v2 calculator that ships on the
 * Flow-State- repo) with the account context prefilled into the query
 * string. Casey's anti-selling directive: prospects come to us via the
 * calculator on their own pace, not via embedded calendar links.
 *
 * The /roi/ contract is documented in docs/roi-calculator-contract.md.
 * Params accepted (all optional — the calculator falls back to its own
 * defaults when absent):
 *
 *   account         "Dannon"           // for header + context
 *   account_slug    "dannon"           // matches modex-gtm slug
 *   facilities      13                 // facility count → site count input
 *   primary_mode    "truckload"        // primary mode → archetype mix
 *   detention_est   3400000            // annual detention $ estimate
 *   loads_per_day   650                // throughput multiplier
 *   p               "dan-poland"       // person slug (M5 reader-aware)
 *   ref             "memo"             // attribution
 *
 * Until the /roi/ side reads these params (separate Flow-State- PR), the
 * link still works — prospects land on the calculator with account
 * context in the URL, which is enough to anchor the funnel.
 */

import type { AccountMicrositeData } from './schema';

const ROI_BASE_URL = 'https://yardflow.ai/roi/';

export interface ROIDeepLinkOptions {
  /** Reader-aware person slug (set by Sprint M5 when ?p= resolves). */
  personSlug?: string;
  /** Source attribution. Defaults to 'memo' (the YNS microsite memo). */
  ref?: string;
}

export function buildROIDeepLink(
  data: AccountMicrositeData,
  options: ROIDeepLinkOptions = {},
): string {
  const params = new URLSearchParams();

  params.set('account', data.accountName);
  params.set('account_slug', data.slug);

  const facilityCount = parseLeadingNumber(data.network?.facilityCount);
  if (facilityCount != null) params.set('facilities', String(facilityCount));

  const primaryMode = data.freight?.primaryModes?.[0];
  if (primaryMode) params.set('primary_mode', primaryMode);

  const detentionEst = parseDollarAmount(data.freight?.detentionCost);
  if (detentionEst != null) params.set('detention_est', String(detentionEst));

  const loadsPerDay = parseLeadingNumber(data.freight?.avgLoadsPerDay);
  if (loadsPerDay != null) params.set('loads_per_day', String(loadsPerDay));

  if (options.personSlug) params.set('p', options.personSlug);
  params.set('ref', options.ref ?? 'memo');

  return `${ROI_BASE_URL}?${params.toString()}`;
}

/**
 * Parses the leading integer out of a free-text label like "47 plants" or
 * "2,400/day". Returns null if no number can be extracted.
 */
function parseLeadingNumber(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/[\d,]+/);
  if (!match) return null;
  const n = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Parses a free-text dollar label like "~$3.4M/yr est." or "$1.2M annually"
 * into a whole-dollar number. Returns null when ambiguous. Handles M / K
 * suffixes; ignores decoration characters.
 */
function parseDollarAmount(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)\s*([MmKk])?/);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const suffix = match[2]?.toLowerCase();
  if (suffix === 'm') return Math.round(base * 1_000_000);
  if (suffix === 'k') return Math.round(base * 1_000);
  return Math.round(base);
}
