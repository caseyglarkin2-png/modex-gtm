export type GenerationJobMetricRow = {
  status: string;
  provider_used: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
};

export type GenerationMetricsSnapshot = {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  successRatePct: number;
  avgDurationSeconds: number;
  p50DurationSeconds: number;
  p95DurationSeconds: number;
  providerBreakdown: Array<{ provider: string; count: number }>;
};

function toSeconds(ms: number): number {
  return Math.round((ms / 1000) * 10) / 10;
}

function percentile(sortedDurationsMs: number[], percentileValue: number): number {
  if (sortedDurationsMs.length === 0) return 0;
  const idx = Math.min(
    sortedDurationsMs.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedDurationsMs.length) - 1),
  );
  return sortedDurationsMs[idx] ?? 0;
}

export function computeGenerationMetrics(rows: GenerationJobMetricRow[]): GenerationMetricsSnapshot {
  const total = rows.length;
  const completedRows = rows.filter((row) => row.status === 'completed');
  const failed = rows.filter((row) => row.status === 'failed').length;
  const pending = rows.filter((row) => row.status === 'pending').length;
  const processing = rows.filter((row) => row.status === 'processing').length;
  const completed = completedRows.length;

  const durationsMs = completedRows
    .filter((row) => row.started_at && row.completed_at)
    .map((row) => row.completed_at!.getTime() - row.started_at!.getTime())
    .filter((ms) => ms >= 0)
    .sort((left, right) => left - right);

  const avgDurationMs = durationsMs.length > 0
    ? durationsMs.reduce((sum, ms) => sum + ms, 0) / durationsMs.length
    : 0;

  const providersMap = rows.reduce<Map<string, number>>((acc, row) => {
    const provider = row.provider_used ?? 'unknown';
    acc.set(provider, (acc.get(provider) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  const providerBreakdown = Array.from(providersMap.entries())
    .map(([provider, count]) => ({ provider, count }))
    .sort((left, right) => right.count - left.count);

  return {
    total,
    completed,
    failed,
    pending,
    processing,
    successRatePct: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgDurationSeconds: toSeconds(avgDurationMs),
    p50DurationSeconds: toSeconds(percentile(durationsMs, 50)),
    p95DurationSeconds: toSeconds(percentile(durationsMs, 95)),
    providerBreakdown,
  };
}
