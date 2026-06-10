/**
 * Slug mapping: yard-audit folder names ↔ microsite slugs ↔ AccountArchetype.
 *
 * `output/yard-audits/<auditSlug>/` is what we type when we run the audit.
 * `src/lib/microsites/accounts/<micrositeSlug>.ts` is what URLs use.
 * Most accounts use the same string for both. The five mismatches below
 * are the only exceptions; the rest are inferred 1:1.
 *
 * Demo packs are named by the **micrositeSlug** so the demo URL
 * `/demo/<slug>` lines up 1:1 with the existing microsite URL
 * `/for/<slug>` — no surprises for the prospect, no rewrite plumbing.
 */

import type { AccountArchetype } from '@/lib/demo/pack-schema';

interface SlugEntry {
  /** Folder under `output/yard-audits/`. */
  auditSlug: string;
  /** URL slug — matches `src/lib/microsites/accounts/<slug>.ts`. */
  micrositeSlug: string;
  /** Display name on the demo header. */
  displayName: string;
  /** Account-level archetype — drives Tier 3 sim defaults and copy tone. */
  archetype: AccountArchetype;
  /**
   * If known, our best estimate of the *true* network footprint vs what we
   * audited. Drives the <CoverageHonesty> banner. Leave undefined when we
   * believe the audit is exhaustive.
   */
  estimatedFootprint?: number;
  /** Free-text honesty note appended to the banner. */
  coverageNote?: string;
}

const ENTRIES: SlugEntry[] = [
  { auditSlug: 'ab-inbev', micrositeSlug: 'ab-inbev', displayName: 'AB InBev', archetype: 'beverage' },
  { auditSlug: 'tractor-supply', micrositeSlug: 'tractor-supply', displayName: 'Tractor Supply Company', archetype: 'retailer' },
  { auditSlug: 'nfi', micrositeSlug: 'nfi', displayName: 'NFI Industries', archetype: '3pl', estimatedFootprint: 300, coverageNote: 'NFI operates 300+ North American facilities; we audited 10 of the largest and most yard-intensive (dedicated DCs, port logistics, a fulfillment center). The rest follow the same gate/dock archetypes.' },
  { auditSlug: 'barnes-noble', micrositeSlug: 'barnes-noble', displayName: 'Barnes & Noble', archetype: 'retailer' },
  { auditSlug: 'bob-evans-farms', micrositeSlug: 'bob-evans-farms', displayName: 'Bob Evans Farms', archetype: 'cpg' },
  { auditSlug: 'boston-beer-company', micrositeSlug: 'boston-beer-company', displayName: 'The Boston Beer Company', archetype: 'beverage' },
  { auditSlug: 'campbells', micrositeSlug: 'campbell-s', displayName: "Campbell's", archetype: 'cpg' },
  { auditSlug: 'caterpillar', micrositeSlug: 'caterpillar', displayName: 'Caterpillar', archetype: 'manufacturer' },
  { auditSlug: 'cj-logistics-america', micrositeSlug: 'cj-logistics-america', displayName: 'CJ Logistics America', archetype: '3pl' },
  { auditSlug: 'coca-cola', micrositeSlug: 'coca-cola', displayName: 'The Coca-Cola Company', archetype: 'beverage' },
  { auditSlug: 'constellation-brands', micrositeSlug: 'constellation-brands', displayName: 'Constellation Brands', archetype: 'beverage' },
  { auditSlug: 'cost-plus-world-market', micrositeSlug: 'cost-plus-world-market', displayName: 'Cost Plus World Market', archetype: 'retailer' },
  { auditSlug: 'crowley', micrositeSlug: 'crowley', displayName: 'Crowley', archetype: 'logistics-carrier' },
  { auditSlug: 'daimler-truck-north-america', micrositeSlug: 'daimler-truck-north-america', displayName: 'Daimler Truck North America', archetype: 'oem-automotive' },
  { auditSlug: 'dannon', micrositeSlug: 'dannon', displayName: 'Danone / Dannon', archetype: 'cpg' },
  { auditSlug: 'dhl-supply-chain', micrositeSlug: 'dhl-supply-chain', displayName: 'DHL Supply Chain', archetype: '3pl' },
  { auditSlug: 'diageo', micrositeSlug: 'diageo', displayName: 'Diageo', archetype: 'beverage' },
  { auditSlug: 'fedex', micrositeSlug: 'fedex', displayName: 'FedEx', archetype: 'logistics-carrier', estimatedFootprint: 1800, coverageNote: 'FedEx operates ~1,800 freight/parcel terminals in North America; we audited 30 of the largest by throughput. The other facilities follow the same archetype distribution and are addressable on the same protocol.' },
  { auditSlug: 'ford', micrositeSlug: 'ford', displayName: 'Ford Motor Company', archetype: 'oem-automotive' },
  { auditSlug: 'general-motors', micrositeSlug: 'general-motors', displayName: 'General Motors', archetype: 'oem-automotive', estimatedFootprint: 50, coverageNote: "We audited 41 of GM's freight-relevant US facilities: every assembly, powertrain, stamping and casting, Ultium battery, parts-processing, and parts-distribution site with a real truck yard. Pure offices and the Milford R&D campus carry no freight gate and are excluded. The wider footprint follows the same archetype distribution." },
  { auditSlug: 'frito-lay', micrositeSlug: 'frito-lay', displayName: 'Frito-Lay', archetype: 'cpg', estimatedFootprint: 200, coverageNote: 'Frito-Lay runs ~200 NA DSD warehouses and plants; we audited the 30 largest. Smaller DSD branches share gate/dock archetypes with the audited cohort.' },
  { auditSlug: 'general-mills', micrositeSlug: 'general-mills', displayName: 'General Mills', archetype: 'cpg' },
  { auditSlug: 'georgia-pacific', micrositeSlug: 'georgia-pacific', displayName: 'Georgia-Pacific', archetype: 'manufacturer' },
  { auditSlug: 'gxo', micrositeSlug: 'gxo', displayName: 'GXO Logistics', archetype: '3pl', estimatedFootprint: 970, coverageNote: 'GXO operates ~970 sites globally (~400 in NA). We audited 30 representative NA facilities; the rest follow the same gate/dock archetypes.' },
  { auditSlug: 'h-e-b', micrositeSlug: 'h-e-b', displayName: 'H-E-B', archetype: 'grocer-distributor' },
  { auditSlug: 'honda', micrositeSlug: 'honda', displayName: 'Honda', archetype: 'oem-automotive' },
  { auditSlug: 'hormel-foods', micrositeSlug: 'hormel-foods', displayName: 'Hormel Foods', archetype: 'cpg' },
  { auditSlug: 'hyundai-motor-america', micrositeSlug: 'hyundai-motor-america', displayName: 'Hyundai Motor America', archetype: 'oem-automotive' },
  { auditSlug: 'jm-smucker', micrositeSlug: 'jm-smucker', displayName: 'The J.M. Smucker Company', archetype: 'cpg' },
  { auditSlug: 'john-deere', micrositeSlug: 'john-deere', displayName: 'John Deere', archetype: 'manufacturer' },
  { auditSlug: 'kenco-logistics', micrositeSlug: 'kenco-logistics-services', displayName: 'Kenco Logistics Services', archetype: '3pl' },
  { auditSlug: 'keurig-dr-pepper', micrositeSlug: 'keurig-dr-pepper', displayName: 'Keurig Dr Pepper', archetype: 'beverage' },
  { auditSlug: 'kimberly-clark', micrositeSlug: 'kimberly-clark', displayName: 'Kimberly-Clark', archetype: 'cpg' },
  { auditSlug: 'kraft-heinz', micrositeSlug: 'kraft-heinz', displayName: 'Kraft Heinz', archetype: 'cpg' },
  { auditSlug: 'mondelez', micrositeSlug: 'mondelez-international', displayName: 'Mondelez International', archetype: 'cpg', estimatedFootprint: 26, coverageNote: 'We audited 22 of an estimated 26 Mondelez NA manufacturing and DC facilities. The 4 not shown are co-manufacturer / contract sites that operate inside other companies’ footprints.' },
  { auditSlug: 'nestle-usa', micrositeSlug: 'nestle-usa', displayName: 'Nestlé USA', archetype: 'cpg' },
  { auditSlug: 'niagara-bottling', micrositeSlug: 'niagara-bottling', displayName: 'Niagara Bottling', archetype: 'beverage' },
  { auditSlug: 'pactiv-evergreen', micrositeSlug: 'pactiv-evergreen', displayName: 'Pactiv Evergreen', archetype: 'manufacturer' },
  { auditSlug: 'performance-food-group', micrositeSlug: 'performance-food-group', displayName: 'Performance Food Group', archetype: 'grocer-distributor' },
  { auditSlug: 'salson-logistics', micrositeSlug: 'salson-logistics', displayName: 'SalSon Logistics', archetype: '3pl' },
  { auditSlug: 'sc-johnson', micrositeSlug: 'sc-johnson', displayName: 'SC Johnson', archetype: 'cpg' },
  { auditSlug: 'the-home-depot', micrositeSlug: 'the-home-depot', displayName: 'The Home Depot', archetype: 'retailer', estimatedFootprint: 70, coverageNote: 'Home Depot operates ~70 RDC/SDC/FDC/DFC/BDC facilities supporting ~2,300 stores. We audited 30 representative supply-chain facilities; the audited cohort spans every facility type.' },
  { auditSlug: 'toyota', micrositeSlug: 'toyota', displayName: 'Toyota Motor North America', archetype: 'oem-automotive' },
  { auditSlug: 'unfi', micrositeSlug: 'unfi', displayName: 'UNFI', archetype: 'grocer-distributor', estimatedFootprint: 56, coverageNote: 'UNFI operates ~56 NA distribution centers. We audited the 30 highest-throughput; smaller facilities share gate/dock archetypes with the audited cohort.' },
  { auditSlug: 'universal-logistics', micrositeSlug: 'universal-logistics-holdings', displayName: 'Universal Logistics Holdings', archetype: '3pl' },
  { auditSlug: 'westrock-coffee', micrositeSlug: 'westrock-coffee', displayName: 'Westrock Coffee', archetype: 'cpg' },
  // ── Retail / grocery DC networks (2026-06 expansion) ───────────────────────
  { auditSlug: 'amazon', micrositeSlug: 'amazon', displayName: 'Amazon', archetype: 'retailer' },
  { auditSlug: 'costco', micrositeSlug: 'costco', displayName: 'Costco Wholesale', archetype: 'retailer' },
  { auditSlug: 'harris-teeter', micrositeSlug: 'harris-teeter', displayName: 'Harris Teeter', archetype: 'grocer-distributor' },
  { auditSlug: 'kroger', micrositeSlug: 'kroger', displayName: 'The Kroger Co.', archetype: 'grocer-distributor' },
  { auditSlug: 'publix', micrositeSlug: 'publix', displayName: 'Publix Super Markets', archetype: 'grocer-distributor' },
  { auditSlug: 'sams-club', micrositeSlug: 'sams-club', displayName: "Sam's Club", archetype: 'retailer' },
  { auditSlug: 'seven-eleven', micrositeSlug: 'seven-eleven', displayName: '7-Eleven', archetype: 'grocer-distributor' },
  { auditSlug: 'stop-and-shop', micrositeSlug: 'stop-and-shop', displayName: 'Stop & Shop', archetype: 'grocer-distributor' },
  { auditSlug: 'target', micrositeSlug: 'target', displayName: 'Target', archetype: 'retailer' },
  { auditSlug: 'walmart', micrositeSlug: 'walmart', displayName: 'Walmart', archetype: 'retailer' },
];

const BY_AUDIT = new Map(ENTRIES.map((e) => [e.auditSlug, e]));
const BY_MICROSITE = new Map(ENTRIES.map((e) => [e.micrositeSlug, e]));

export function resolveByAuditSlug(auditSlug: string): SlugEntry {
  const entry = BY_AUDIT.get(auditSlug);
  if (!entry) throw new Error(`Unknown audit slug: ${auditSlug}`);
  return entry;
}

export function resolveByMicrositeSlug(micrositeSlug: string): SlugEntry {
  const entry = BY_MICROSITE.get(micrositeSlug);
  if (!entry) throw new Error(`Unknown microsite slug: ${micrositeSlug}`);
  return entry;
}

export function allEntries(): readonly SlugEntry[] {
  return ENTRIES;
}
