import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildWaveTimeRemaining } from '@/lib/wave-time-remaining';

describe('buildWaveTimeRemaining (S5-T1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns green when more than 7 days remain', () => {
    vi.setSystemTime(new Date('2026-04-01T08:00:00.000Z'));
    expect(buildWaveTimeRemaining('4/16')).toEqual({ label: '15d left', tone: 'green' });
  });

  it('returns amber when 1-7 days remain', () => {
    vi.setSystemTime(new Date('2026-04-01T08:00:00.000Z'));
    expect(buildWaveTimeRemaining('4/4')).toEqual({ label: '3d left', tone: 'amber' });
    expect(buildWaveTimeRemaining('4/8')).toEqual({ label: '7d left', tone: 'amber' });
  });

  it('returns red "Last day" when 0 days remain', () => {
    vi.setSystemTime(new Date('2026-04-01T08:00:00.000Z'));
    expect(buildWaveTimeRemaining('4/1')).toEqual({ label: 'Last day', tone: 'red' });
  });

  it('returns red "Overdue Xd" when the wave end has passed', () => {
    vi.setSystemTime(new Date('2026-04-05T08:00:00.000Z'));
    expect(buildWaveTimeRemaining('4/1')).toEqual({ label: 'Overdue 4d', tone: 'red' });
  });

  it('rolls dates that are >6 months in the past forward to next year', () => {
    vi.setSystemTime(new Date('2026-12-15T08:00:00.000Z'));
    // 3/24 in 2026 is ~9 months in the past — interpret as 2027 instead.
    const result = buildWaveTimeRemaining('3/24');
    expect(result.tone).toBe('green');
    expect(result.label).toMatch(/d left/);
  });
});
