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
  discoveredVia: string[];
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
  discoveredVia: string[];
  excluded: boolean;
  excludeReason?: string;
}
