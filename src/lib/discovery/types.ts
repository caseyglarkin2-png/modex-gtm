export interface DiscoveredVia {
  anchor: string;
  keyword: string;
  distanceMiles: number;
}

export interface ScoreBreakdown {
  verticalMatch: number;
  enterpriseScale: number;
  networkComplexity: number;
  primoProximity: number;
  corridorDensity: number;
  placeTypeBonus: number;
}

export interface ScoredProspect {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  icpScore: number;
  tier: 'A' | 'B' | 'C' | 'D';
  scoreBreakdown: ScoreBreakdown;
  isExistingAccount: boolean;
  existingAccountSlug?: string;
  nearestPrimoSite: { name: string; distanceMiles: number };
  corridor: string;
  discoveredVia: Array<DiscoveredVia | string>;
  excluded?: boolean;
  excludeReason?: string;
  estimatedRevenue?: number;
  estimatedFacilities?: number;
  vertical?: string;
}

export interface Corridor {
  name: string;
  center: { lat: number; lng: number };
  radiusMiles: number;
  totalProspects: number;
  tierACount: number;
  avgIcpScore: number;
  topProspects: string[];
}

export interface ScoredOutput {
  generatedAt: string;
  inputFile: string;
  totalDiscoveries: number;
  existingAccountMatches: number;
  netNewProspects: number;
  tierA: number;
  tierB: number;
  tierC: number;
  tierD: number;
  corridors: Corridor[];
  prospects: ScoredProspect[];
}

export interface ProspectRow {
  name: string;
  address: string;
  cityState: string;
  lat: number;
  lng: number;
  placeId: string;
  icpScore: number;
  tier: 'A' | 'B' | 'C' | 'D';
  verticalMatch: number;
  enterpriseScale: number;
  networkComplexity: number;
  primoProximity: number;
  corridorDensity: number;
  placeTypeBonus: number;
  isExistingAccount: boolean;
  existingAccountSlug?: string;
  nearestPrimoName: string;
  nearestPrimoDistance: number;
  corridor: string;
  discoveredVia: Array<DiscoveredVia | string>;
  excluded: boolean;
  excludeReason?: string;
}

/**
 * Demand-side role of a discovered facility. Only `parcel` (parcel / last-mile)
 * is demoted from the default daily slice — carriers and 3PLs run yards and are
 * legitimate YardFlow targets, so they stay in the working set, just tagged.
 */
export type ProspectSegment = 'shipper' | 'carrier' | '3pl' | 'parcel';

/** Our confidence that a row is a real, sellable physical site. */
export type Confidence = 'high' | 'medium' | 'low';

/** A ProspectRow after curation: deduped to one-per-site, segmented, confidence-scored. */
export interface CuratedRow extends ProspectRow {
  segment: ProspectSegment;
  confidence: Confidence;
  /** How many duplicate / grain-artifact rows (e.g. truck entrances) collapsed into this one. */
  mergedCount: number;
  /** Slug of a matching YardFlow microsite (/for, /demo), or undefined when none exists. */
  micrositeSlug?: string;
  /** Live HubSpot deal state for existing accounts (Sprint 5), when available. */
  pipeline?: import('./pipeline-format').PipelineState;
}
