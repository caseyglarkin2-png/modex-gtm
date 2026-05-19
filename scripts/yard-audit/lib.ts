/**
 * Phase 0.4 — Yard Audit shared library.
 *
 * Single source of truth for:
 *  - the Classification type (satellite-derived fields, matching Jake's
 *    Kraft CSV columns and parse-kraft-baseline.ts),
 *  - assignArchetype(): the first-match precedence documented in
 *    archetype-key.json,
 *  - small helpers shared by generate-csv.ts.
 *
 * Scripts are run from the repo root (`npx tsx scripts/yard-audit/...`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Band = '0-10' | '10-25' | '25-50' | '50+' | 'NONE';
export type UrbanRural = 'Urban' | 'Rural';
export type Confidence = 'high' | 'medium' | 'low';

/** The satellite-derived field set. Mirrors Jake's Kraft sheet 1:1. */
export interface Classification {
  truckGate: boolean;
  guardShack: boolean;
  remoteGs: boolean;
  preGateStaging: boolean;
  postGateStaging: boolean;
  drivewayLong: boolean;
  drivewayShort: boolean;
  backupSensitive: boolean;
  entryExitTogether: boolean;
  entryExitSeparate: boolean;
  entryLanes: number | null;
  exitLanes: number | null;
  fastLaneOpportunity: boolean;
  dockDoors: Band;
  dropArea: Band;
  shipRcvSeparate: boolean;
  urbanRural: UrbanRural | null;
  connectivityIssue: boolean;
  multipleFacilities: boolean;
  scale: boolean;
  dropYard: boolean;
  /**
   * #5 (multi-step check-in) is NOT a single boolean visible from one
   * overhead frame — set true only when imagery clearly shows a second
   * checkpoint stage. Left undefined otherwise.
   */
  multiStep?: boolean;
}

interface ArchetypeKey {
  archetypes: { id: string; name: string }[];
}

const ARCHETYPE_KEY: ArchetypeKey = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/yard-audit/archetype-key.json'), 'utf8'),
);

/** '#1' -> 'Gate + GS (not BU sens.)', etc. */
export const ARCHETYPE_NAME = new Map<string, string>(
  ARCHETYPE_KEY.archetypes.map((a) => [a.id, a.name]),
);

export interface ArchetypeResult {
  archetype: string; // '#1'..'#10'
  archetypeName: string;
  confidence: Confidence;
  reason: string;
}

/**
 * Assign a yard archetype from a Classification.
 *
 * First-match precedence — see archetype-key.json `assignmentPrecedence`.
 * Order matters: a guarded site carrying several flags resolves to the
 * first rule it matches (e.g. backup-sensitive outranks an on-site scale).
 */
export function assignArchetype(c: Classification): ArchetypeResult {
  const make = (id: string, confidence: Confidence, reason: string): ArchetypeResult => ({
    archetype: id,
    archetypeName: ARCHETYPE_NAME.get(id) ?? '',
    confidence,
    reason,
  });

  const gate = c.truckGate;
  const gs = c.guardShack;

  // 1 — open site
  if (!gate && !gs) return make('#3', 'high', 'No truck gate and no guard shack.');

  // 2 — gated, unstaffed, remote check-in
  if (gate && !gs && c.remoteGs) {
    return make('#9', 'high', 'Truck gate, no guard shack, remote check-in.');
  }

  // 3..10 — guarded entries; first distinguishing flag wins.
  // #6 (campus) is checked first: Jake classifies a multi-building campus as
  // #6 even when the gate is also backup-sensitive (calibrated on Kraft
  // Champaign, the one site carrying both flags).
  if (gate && gs) {
    if (c.multipleFacilities)  return make('#6', 'high', 'Guarded entry; multi-building campus.');
    if (c.backupSensitive)     return make('#4', 'high', 'Guarded entry; backup-sensitive gate geometry.');
    if (c.shipRcvSeparate)     return make('#10', 'high', 'Guarded entry; shipping and receiving on separate dock clusters.');
    if (c.fastLaneOpportunity) return make('#7', 'high', 'Guarded entry; physical room to add a bypass / fast lane.');
    if (c.scale)               return make('#8', 'high', 'Guarded entry; on-site truck scale.');
    if (c.entryExitSeparate)   return make('#2', 'high', 'Guarded entry; physically separate entry / exit lanes.');
    if (c.multiStep)           return make('#5', 'medium', 'Guarded entry; multi-step check-in observed.');
    return make('#1', 'high', 'Guarded entry; no other distinguishing flag.');
  }

  // Fallback — gate without a guard shack and without confirmed remote
  // check-in. Nearest match is #9; flag low-confidence for human review.
  if (gate && !gs) {
    return make('#9', 'low', 'Truck gate, no guard shack; remote check-in unconfirmed — nearest match #9.');
  }
  // Guard shack but no clear gate — unusual; nearest guarded archetype.
  return make('#1', 'low', 'Guard shack without a clear truck gate — nearest match #1.');
}

/** Round a fraction to a whole-percent string, e.g. (2, 27) -> "7%". */
export function pct(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : '0%';
}
