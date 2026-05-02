import { describe, expect, it } from 'vitest';
import { computeGenerationMetrics, type GenerationJobMetricRow } from '@/lib/admin/generation-metrics';

function ts(value: string) {
  return new Date(value);
}

describe('computeGenerationMetrics', () => {
  it('computes queue and duration metrics', () => {
    const rows: GenerationJobMetricRow[] = [
      {
        status: 'completed',
        provider_used: 'ai_gateway',
        started_at: ts('2026-05-01T10:00:00.000Z'),
        completed_at: ts('2026-05-01T10:00:10.000Z'),
        created_at: ts('2026-05-01T10:00:00.000Z'),
      },
      {
        status: 'completed',
        provider_used: 'ai_gateway',
        started_at: ts('2026-05-01T10:01:00.000Z'),
        completed_at: ts('2026-05-01T10:01:30.000Z'),
        created_at: ts('2026-05-01T10:01:00.000Z'),
      },
      {
        status: 'failed',
        provider_used: 'openai',
        started_at: ts('2026-05-01T10:02:00.000Z'),
        completed_at: ts('2026-05-01T10:02:05.000Z'),
        created_at: ts('2026-05-01T10:02:00.000Z'),
      },
      {
        status: 'pending',
        provider_used: null,
        started_at: null,
        completed_at: null,
        created_at: ts('2026-05-01T10:03:00.000Z'),
      },
      {
        status: 'processing',
        provider_used: 'ai_gateway',
        started_at: ts('2026-05-01T10:04:00.000Z'),
        completed_at: null,
        created_at: ts('2026-05-01T10:04:00.000Z'),
      },
    ];

    const metrics = computeGenerationMetrics(rows);

    expect(metrics.total).toBe(5);
    expect(metrics.completed).toBe(2);
    expect(metrics.failed).toBe(1);
    expect(metrics.pending).toBe(1);
    expect(metrics.processing).toBe(1);
    expect(metrics.successRatePct).toBe(40);
    expect(metrics.avgDurationSeconds).toBe(20);
    expect(metrics.p50DurationSeconds).toBe(10);
    expect(metrics.p95DurationSeconds).toBe(30);
    expect(metrics.providerBreakdown[0]).toEqual({ provider: 'ai_gateway', count: 3 });
  });
});
