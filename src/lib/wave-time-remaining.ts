/**
 * Computes a time-remaining badge label + tone for a MODEX wave window.
 *
 * Wave end dates are stored as plain "M/D" strings in WAVE_META, so we
 * pick the closest interpretation: this calendar year if the date is still
 * ahead OR within the last ~6 months, otherwise next year. This avoids
 * showing "Overdue 270d" for a wave that's just 3 months past on its way
 * to repeating next year.
 *
 * Tone thresholds:
 *   > 7 days     → green   ("Xd left")
 *   1-7 days     → amber   ("Xd left")
 *   = 0          → red     ("Last day")
 *   -1 to -7     → red     ("Overdue Xd")
 *   < -7         → neutral ("Wrapped Xd ago")  // wave clearly concluded; alarm is misleading
 */
export type WaveTimeRemaining = {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'neutral';
};

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 180;

export function buildWaveTimeRemaining(endDateStr: string, now = new Date()): WaveTimeRemaining {
  const [m, d] = endDateStr.split('/').map((part) => Number.parseInt(part, 10));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let end = new Date(now.getFullYear(), m - 1, d);
  if (end.getTime() < today.getTime() - SIX_MONTHS_MS) {
    end = new Date(now.getFullYear() + 1, m - 1, d);
  }
  const days = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < -7) return { label: `Wrapped ${Math.abs(days)}d ago`, tone: 'neutral' };
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, tone: 'red' };
  if (days === 0) return { label: 'Last day', tone: 'red' };
  if (days <= 7) return { label: `${days}d left`, tone: 'amber' };
  return { label: `${days}d left`, tone: 'green' };
}
