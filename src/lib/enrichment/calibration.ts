export type CalibrationSample = {
  id: string;
  score: number;
  expectedPositive: boolean;
};

export type CalibrationMetrics = {
  threshold: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
};

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function computeCalibrationMetrics(
  samples: CalibrationSample[],
  threshold: number,
): CalibrationMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const sample of samples) {
    const predictedPositive = sample.score >= threshold;
    if (predictedPositive && sample.expectedPositive) tp++;
    if (predictedPositive && !sample.expectedPositive) fp++;
    if (!predictedPositive && !sample.expectedPositive) tn++;
    if (!predictedPositive && sample.expectedPositive) fn++;
  }

  const precision = ratio(tp, tp + fp);
  const recall = ratio(tp, tp + fn);
  const f1 = ratio(2 * precision * recall, precision + recall);

  return { threshold, tp, fp, tn, fn, precision, recall, f1 };
}
