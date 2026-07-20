/**
 * Registry slug -> HubSpot company DOMAIN (the S1 amplifier's ground truth).
 *
 * Company resolution for intent stamping was exact-name only, and display names
 * rarely match HubSpot names ("Dannon" vs "Danone"), so only ~7 companies ever
 * received an intent_score while months of /demo + /for engagement silently
 * no-opped. Domain-first resolution fixes that, but ONLY if these values mirror
 * HubSpot's OWN domain field — a "true" corporate domain HubSpot doesn't carry
 * would trade one silent miss for another. Every entry below was generated from
 * a live HubSpot search (scripts/tam/gen-account-domains.mjs, 2026-07-20),
 * picking the contact-bearing canonical record, then hand-reviewed. Notable
 * corrections from that review: token search mis-hit Bob's Discount Furniture
 * for Bob Evans, Cost Plus Drugs for World Market, JM&A Group for Smucker, and
 * WestRock packaging for Westrock Coffee — exactly the poisoned-stamp class of
 * bug this map exists to prevent.
 *
 * Absent slug = no confident HubSpot record; resolution falls back to the
 * exact-name search and a MISS is now logged (see hubspot-intent.ts).
 * tractorsupply.careers looks odd but IS HubSpot's domain value for the
 * contact-bearing Tractor Supply record — the record is what we match.
 */
export const ACCOUNT_DOMAINS: Record<string, string> = {
  'ab-inbev': 'ab-inbev.com',
  'amazon': 'amazon.com',
  'barnes-noble': 'bn.com',
  'bob-evans-farms': 'bobevans.com',
  'boston-beer-company': 'bostonbeer.com',
  'campbell-s': 'campbells.com',
  'caterpillar': 'cat.com',
  'cj-logistics-america': 'cjlogisticsamerica.com',
  'coca-cola': 'coca-cola.com',
  'constellation-brands': 'cbrands.com',
  'cost-plus-world-market': 'worldmarket.com',
  'costco': 'costco.com',
  'crowley': 'crowley.com',
  'daimler-truck-north-america': 'daimlertruck.com',
  'dannon': 'danone.com',
  'dhl-supply-chain': 'dhl.com',
  'diageo': 'diageo.com',
  'fedex': 'fedex.com',
  'ford': 'ford.com',
  'frito-lay': 'fritolay.com',
  'general-mills': 'generalmills.com',
  'general-motors': 'gm.com',
  'georgia-pacific': 'gp.com',
  'gxo': 'gxo.com',
  'h-e-b': 'heb.com',
  'harris-teeter': 'harristeeter.com',
  'honda': 'honda.com',
  'hormel-foods': 'hormelfoods.com',
  'hyundai-motor-america': 'hmausa.com',
  'john-deere': 'johndeere.com',
  'kenco-logistics-services': 'kencogroup.com',
  'keurig-dr-pepper': 'keurigdrpepper.com',
  'kimberly-clark': 'kimberly-clark.com',
  'kraft-heinz': 'kraftheinzcompany.com',
  'kroger': 'kroger.com',
  'mondelez-international': 'mondelezinternational.com',
  'nestle-usa': 'nestle.com',
  'nfi': 'nfiindustries.com',
  'niagara-bottling': 'niagarawater.com',
  'pactiv-evergreen': 'pactivevergreen.com',
  'pepsico': 'pepsico.com',
  'performance-food-group': 'pfgc.com',
  'publix': 'publix.com',
  'salson-logistics': 'salson.com',
  'sams-club': 'samsclub.com',
  'sc-johnson': 'scjohnson.com',
  'seven-eleven': '7-11.com',
  'stop-and-shop': 'stopandshop.com',
  'target': 'target.com',
  'the-home-depot': 'homedepot.com',
  'toyota': 'toyota.com',
  'tractor-supply': 'tractorsupply.careers',
  'unfi': 'unfi.com',
  'universal-logistics-holdings': 'universallogistics.com',
  'walmart': 'walmart.com',
  // UNMAPPED (no confident HubSpot record 2026-07-20; name-search fallback):
  // 'jm-smucker' — no company matching "Smucker" exists in the portal
  // 'westrock-coffee' — only WestRock packaging exists; wrong account, omitted
};

/** Domain for a registry slug, or null when unmapped (caller falls back to name). */
export function domainForAccountSlug(slug: string): string | null {
  return ACCOUNT_DOMAINS[slug] ?? null;
}
