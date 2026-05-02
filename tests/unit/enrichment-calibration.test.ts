import { describe, expect, it } from 'vitest';
import { ENRICHMENT_CALIBRATION_FIXTURES } from '../fixtures/enrichment-calibration';
import { computeCalibrationMetrics } from '@/lib/enrichment/calibration';

describe('enrichment calibration metrics', () => {
  it('computes deterministic precision/recall for threshold candidates', () => {
    const at80 = computeCalibrationMetrics(ENRICHMENT_CALIBRATION_FIXTURES, 80);
    const at85 = computeCalibrationMetrics(ENRICHMENT_CALIBRATION_FIXTURES, 85);

    expect(at80.precision).toBeCloseTo(0.75, 3);
    expect(at80.recall).toBeCloseTo(0.857, 3);
    expect(at85.precision).toBeCloseTo(1, 3);
    expect(at85.recall).toBeCloseTo(0.714, 3);
  });

  it('tracks confusion-matrix counts for auditability', () => {
    const metrics = computeCalibrationMetrics(ENRICHMENT_CALIBRATION_FIXTURES, 80);
    expect(metrics).toMatchObject({
      tp: 6,
      fp: 2,
      tn: 5,
      fn: 1,
    });
  });
});
