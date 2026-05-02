function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

export type EnrichmentThresholds = {
  minConfidenceForOverwrite: number;
  staleDaysPerson: number;
  staleDaysCompany: number;
};

export function getEnrichmentThresholds(): EnrichmentThresholds {
  return {
    minConfidenceForOverwrite: envNumber('ENRICH_MIN_CONFIDENCE_OVERWRITE', 0.8),
    staleDaysPerson: envNumber('ENRICH_STALE_DAYS_PERSON', 30),
    staleDaysCompany: envNumber('ENRICH_STALE_DAYS_COMPANY', 45),
  };
}

export function isWritebackApplyEnabled(): boolean {
  const raw = process.env.ENRICH_WRITEBACK_APPLY_ENABLED;
  if (!raw) return false;
  return raw === '1' || raw.toLowerCase() === 'true';
}
