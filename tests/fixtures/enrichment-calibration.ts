import type { CalibrationSample } from '@/lib/enrichment/calibration';

export const ENRICHMENT_CALIBRATION_FIXTURES: CalibrationSample[] = [
  { id: 'c1', score: 97, expectedPositive: true },
  { id: 'c2', score: 94, expectedPositive: true },
  { id: 'c3', score: 90, expectedPositive: true },
  { id: 'c4', score: 88, expectedPositive: true },
  { id: 'c5', score: 85, expectedPositive: true },
  { id: 'c6', score: 84, expectedPositive: false },
  { id: 'c7', score: 82, expectedPositive: true },
  { id: 'c8', score: 80, expectedPositive: false },
  { id: 'c9', score: 78, expectedPositive: false },
  { id: 'c10', score: 75, expectedPositive: false },
  { id: 'c11', score: 72, expectedPositive: true },
  { id: 'c12', score: 68, expectedPositive: false },
  { id: 'c13', score: 65, expectedPositive: false },
  { id: 'c14', score: 60, expectedPositive: false },
];
