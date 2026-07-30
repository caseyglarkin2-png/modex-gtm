/**
 * Stock ticker -> microsite slug, applied at pounce ingest.
 *
 * WHY THIS EXISTS (2026-07-30). The EDGAR producer in clawd derives a trigger's
 * account identity from an SEC filing, so it arrives carrying a TICKER rather
 * than a company name: `accountName: 'KO'`, `accountSlug: 'ko'`. A backfill of
 * the live table found 27 of 32 triggers in that state - KO, FDX, PEP, KR, GIS,
 * CAG, JBHT, KNX - every one of them a Tier A account, several with live spear
 * pages.
 *
 * A ticker-shaped trigger is inert end to end:
 *   - getAccountMicrositeData('ko') misses, so the Slack ping links a HubSpot
 *     search instead of https://yardflow.ai/for/coca-cola/
 *   - searchCompanyByName('KO') is an exact `name EQ` match and finds nothing,
 *     so no timeline Note, no trigger_score, no hubspot_company_id
 *   - with no trigger_score there is no account heat, so no committee promotion
 *
 * The existing code knew about this and only worked around the symptom: the
 * comment at ingest.ts guards the spear link so an unknown slug does not link a
 * 404. That stops the bad link. It does not recover the account.
 *
 * Normalising here, at the single ingest chokepoint, repairs every producer at
 * once and leaves the rest of the pipeline unchanged - once the slug is right,
 * the registry lookup, the display name, accountFit() and the HubSpot search all
 * work as they already do.
 *
 * EXTENDING THIS: only add a ticker whose target slug exists in the microsite
 * registry, and only when you are certain of the mapping. A WRONG mapping is far
 * worse than a missing one - it silently files a trigger against the wrong
 * account and links a competitor's spear page. Tickers with no registry account
 * (CAG, JBHT, KNX today) are deliberately absent: they fall through to the
 * existing HubSpot-search fallback, which is the correct behaviour.
 *
 * ticker-map.test.ts asserts every slug below resolves in the registry, so a
 * typo fails the build rather than silently misrouting a trigger.
 */
export const TICKER_TO_SLUG: Readonly<Record<string, string>> = {
  AMZN: 'amazon',
  BUD: 'ab-inbev',
  CAT: 'caterpillar',
  COST: 'costco',
  CPB: 'campbell-s',
  DE: 'john-deere',
  DEO: 'diageo',
  F: 'ford',
  FDX: 'fedex',
  GIS: 'general-mills',
  GM: 'general-motors',
  GXO: 'gxo',
  HD: 'the-home-depot',
  HMC: 'honda',
  HRL: 'hormel-foods',
  KDP: 'keurig-dr-pepper',
  KHC: 'kraft-heinz',
  KMB: 'kimberly-clark',
  KO: 'coca-cola',
  KR: 'kroger',
  MDLZ: 'mondelez-international',
  PEP: 'pepsico',
  PFGC: 'performance-food-group',
  SAM: 'boston-beer-company',
  SJM: 'jm-smucker',
  STZ: 'constellation-brands',
  TGT: 'target',
  TM: 'toyota',
  TSCO: 'tractor-supply',
  WMT: 'walmart',
} as const;

/**
 * A ticker is 1-5 upper-case letters and nothing else. Deliberately strict:
 * this must not fire on a real company name. "KO" qualifies; "Kroger" does not,
 * and neither does "3M" or "AB InBev".
 */
const TICKER_SHAPE = /^[A-Z]{1,5}$/;

/** True when a value looks like a bare ticker rather than a company name. */
export function looksLikeTicker(value: string): boolean {
  return TICKER_SHAPE.test((value ?? '').trim());
}

/**
 * Map a possible ticker to its microsite slug.
 *
 * Returns null when the input is not ticker-shaped, or is a ticker we have no
 * account for. Case-insensitive on input because producers are inconsistent
 * about it (`accountSlug` arrives lower-cased, `accountName` upper).
 */
export function slugForTicker(value: string): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (!looksLikeTicker(upper)) return null;
  return TICKER_TO_SLUG[upper] ?? null;
}
