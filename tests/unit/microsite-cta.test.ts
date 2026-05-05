import { describe, expect, it } from 'vitest';
import { buildShortOverviewCta, normalizeMicrositeCta } from '@/lib/microsites/cta';

describe('microsite CTA normalization', () => {
  it('rewrites cold booking CTAs into short-overview mailto CTAs', () => {
    const normalized = normalizeMicrositeCta({
      type: 'meeting',
      headline: 'Let us walk the yard network',
      subtext: '30-minute conversation with ROI.',
      buttonLabel: 'Book a Network Audit',
      calendarLink: 'https://calendar.google.com/calendar/u/0/appointments/schedules/example',
    }, 'Americold');

    expect(normalized.buttonLabel).toBe('Should we send the short overview?');
    expect(normalized.calendarLink).toContain('mailto:casey@freightroll.com');
    expect(normalized.calendarLink).toContain('Americold');
  });

  it('leaves non-booking CTAs alone', () => {
    const cta = buildShortOverviewCta('John Deere');
    expect(normalizeMicrositeCta(cta, 'John Deere')).toEqual(cta);
  });
});
