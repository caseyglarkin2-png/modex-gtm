import facilityFactsData from '../data/facility-facts.json';
import {
  buildFacilityFactMap,
  normalizeAccountKey,
  type FacilityFactRecord,
} from './facility-counts';

const facilityFacts = facilityFactsData as FacilityFactRecord[];
const facilityFactMap = buildFacilityFactMap(facilityFacts);

export function getFacilityFacts(): FacilityFactRecord[] {
  return facilityFacts;
}

export function getFacilityFact(accountName: string): FacilityFactRecord | undefined {
  return facilityFactMap.get(normalizeAccountKey(accountName));
}

export function getFacilityCountLabel(accountName: string, fallback: string): string {
  return getFacilityFact(accountName)?.facilityCount ?? fallback;
}

export function getFacilityCountLowerBound(accountName: string, fallback?: number): number | undefined {
  return parseFacilityCountLowerBound(getFacilityFact(accountName)?.facilityCount) ?? fallback;
}

export function parseFacilityCountLowerBound(value: string | null | undefined): number | undefined {
  if (!value) return undefined;

  const match = value.trim().match(/(\d[\d,]*)/);
  if (!match) return undefined;

  const parsed = Number.parseInt(match[1].replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function hasFacilityFact(accountName: string): boolean {
  return facilityFactMap.has(normalizeAccountKey(accountName));
}