import type { Site } from './pack-schema';

/**
 * Yard operational-complexity scoring — the data layer behind the atlas
 * "complexity glow" (#2) and the per-site "what this means" read (#3).
 *
 * Design intent: this is an *observational* read, not a sales overlay. Every
 * factor is a field the audit actually recorded (gate config, drop-yard load,
 * dock scale, flow separation). We surface what's there and let the operator
 * draw the conclusion. No "pain", no dollar claims, no on-the-nose pitch —
 * the labels are neutral descriptions of what the yard contains.
 */

export interface ComplexityFactor {
  key: string;
  /** Neutral, audit-grounded description shown to the prospect. */
  label: string;
  /** Contribution to the raw score. */
  points: number;
}

export interface SiteComplexity {
  raw: number;
  factors: ComplexityFactor[];
}

/**
 * Score one site from its classification + yard metrics. Factors are only
 * added when the audit actually observed them, so a simple site (office HQ,
 * small cross-dock) scores low and stays a plain dot — not everything is busy.
 */
export function scoreSite(site: Site): SiteComplexity {
  const c = site.classification;
  const y = site.yardMetrics;
  const f: ComplexityFactor[] = [];

  // Dock scale — more doors, more orchestration.
  if (c.dockDoors === '50+') f.push({ key: 'docks', label: '50+ dock doors', points: 2 });
  else if (c.dockDoors === '25-50') f.push({ key: 'docks', label: '25-50 dock doors', points: 1.5 });
  else if (c.dockDoors === '10-25') f.push({ key: 'docks', label: '10-25 dock doors', points: 1 });

  // Trailer-yard scale.
  const trailers = y.trailerParkingCapacity ?? 0;
  if (trailers >= 200) f.push({ key: 'trailers', label: 'Large trailer yard', points: 1 });
  else if (trailers >= 75) f.push({ key: 'trailers', label: 'Sizable trailer yard', points: 0.5 });

  // Drop-and-hook load — where spotter coordination compounds.
  if (c.dropYard || c.dropArea === '50+' || c.dropArea === '25-50')
    f.push({ key: 'drop', label: 'Active drop yard', points: 1.5 });
  else if (c.dropArea === '10-25') f.push({ key: 'drop', label: 'Drop area', points: 0.75 });

  // Gate configuration.
  if (c.guardShack) f.push({ key: 'guard', label: 'Staffed gate', points: 0.5 });
  if (c.entryExitSeparate) f.push({ key: 'sepgate', label: 'Separate in/out gates', points: 0.5 });
  if (c.multiStep) f.push({ key: 'multistep', label: 'Multi-step check-in', points: 1 });
  if (c.preGateStaging || c.postGateStaging) f.push({ key: 'staging', label: 'Gate staging', points: 0.5 });

  // Flow separation + dock handling.
  if (c.shipRcvSeparate) f.push({ key: 'shiprcv', label: 'Separate ship/receive', points: 0.5 });
  if (c.backupSensitive) f.push({ key: 'backup', label: 'Backup-sensitive docks', points: 0.5 });
  if (c.connectivityIssue) f.push({ key: 'conn', label: 'Connectivity gap', points: 0.5 });

  // Audit-flagged fast-lane candidate (a structural read, stated as such).
  if (c.fastLaneOpportunity) f.push({ key: 'fastlane', label: 'Fast-lane candidate', points: 1 });

  const raw = f.reduce((s, x) => s + x.points, 0);
  f.sort((a, b) => b.points - a.points);
  return { raw, factors: f };
}

export interface SiteIntensity extends SiteComplexity {
  /** 0..1 glow intensity, min-max normalized across the network. */
  intensity: number;
}

/**
 * Score every site and normalize raw scores to a 0..1 glow intensity,
 * relative to THIS network's own range. Relative (not absolute) so every
 * prospect's map has visible contrast — the brightest dots are this
 * network's most complex yards, which is exactly what the legend claims.
 */
export function networkIntensities(sites: Site[]): Map<string, SiteIntensity> {
  const scored = sites.map((s) => ({ id: s.id, ...scoreSite(s) }));
  const raws = scored.map((s) => s.raw);
  const min = Math.min(...raws);
  const max = Math.max(...raws);
  const span = max - min;

  const out = new Map<string, SiteIntensity>();
  for (const s of scored) {
    const intensity = span > 0 ? (s.raw - min) / span : s.raw > 0 ? 0.5 : 0;
    out.set(s.id, { raw: s.raw, factors: s.factors, intensity });
  }
  return out;
}
