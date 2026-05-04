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

export type EnrichmentBatchPolicy = {
  batchSize: number;
  maxParallel: number;
  retryBackoffMs: number;
  dailyBudget: number;
};

export function getEnrichmentThresholds(): EnrichmentThresholds {
  return {
    minConfidenceForOverwrite: envNumber('ENRICH_MIN_CONFIDENCE_OVERWRITE', 0.8),
    staleDaysPerson: envNumber('ENRICH_STALE_DAYS_PERSON', 30),
    staleDaysCompany: envNumber('ENRICH_STALE_DAYS_COMPANY', 45),
  };
}

export function getEnrichmentBatchPolicy(): EnrichmentBatchPolicy {
  return {
    batchSize: envNumber('ENRICH_BATCH_SIZE', 40),
    maxParallel: envNumber('ENRICH_MAX_PARALLEL', 2),
    retryBackoffMs: envNumber('ENRICH_RETRY_BACKOFF_MS', 60_000),
    dailyBudget: envNumber('ENRICH_DAILY_BUDGET', 5000),
  };
}

export function isWritebackApplyEnabled(): boolean {
  const raw = process.env.ENRICH_WRITEBACK_APPLY_ENABLED;
  if (!raw) return false;
  return raw === '1' || raw.toLowerCase() === 'true';
}
