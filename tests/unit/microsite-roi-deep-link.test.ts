import { describe, expect, it } from 'vitest';
import { buildROIDeepLink } from '@/lib/microsites/roi-deep-link';
import type { AccountMicrositeData } from '@/lib/microsites/schema';

function makeAccount(overrides: Partial<AccountMicrositeData> = {}): AccountMicrositeData {
  return {
    slug: 'dannon',
    accountName: 'Dannon',
    vertical: 'cpg',
    tier: 'Tier 1',
    band: 'A',
    priorityScore: 95,
    pageTitle: 't',
    metaDescription: 'd',
    sections: [],
    people: [],
    personVariants: [],
    proofBlocks: [],
    network: {
      facilityCount: '13 plants',
      facilityTypes: ['Manufacturing'],
      geographicSpread: 'North American',
      dailyTrailerMoves: '500/day',
    },
    freight: {
      primaryModes: ['truckload'],
      avgLoadsPerDay: '650',
      detentionCost: '~$3.4M/yr est.',
    },
    signals: {},
    ...overrides,
  };
}

describe('buildROIDeepLink', () => {
  it('always points at yardflow.ai/roi/', () => {
    const link = buildROIDeepLink(makeAccount());
    expect(link.startsWith('https://yardflow.ai/roi/?')).toBe(true);
  });

  it('encodes account name + slug', () => {
    const url = new URL(buildROIDeepLink(makeAccount()));
    expect(url.searchParams.get('account')).toBe('Dannon');
    expect(url.searchParams.get('account_slug')).toBe('dannon');
  });

  it('parses leading numbers out of free-text labels', () => {
    const url = new URL(buildROIDeepLink(makeAccount()));
    expect(url.searchParams.get('facilities')).toBe('13');
    expect(url.searchParams.get('loads_per_day')).toBe('650');
  });

  it('parses dollar amounts with M/K suffixes', () => {
    const url = new URL(buildROIDeepLink(makeAccount()));
    expect(url.searchParams.get('detention_est')).toBe('3400000');
  });

  it('handles K suffix and comma-separated numbers', () => {
    const url = new URL(
      buildROIDeepLink(
        makeAccount({
          network: {
            facilityCount: '2,400 trailer moves/day',
            facilityTypes: ['DC'],
            geographicSpread: 'National',
            dailyTrailerMoves: '2,400/day',
          },
          freight: { primaryModes: [], avgLoadsPerDay: '1,200', detentionCost: '$850K' },
        }),
      ),
    );
    expect(url.searchParams.get('facilities')).toBe('2400');
    expect(url.searchParams.get('loads_per_day')).toBe('1200');
    expect(url.searchParams.get('detention_est')).toBe('850000');
  });

  it('omits params when the source data is missing', () => {
    const url = new URL(
      buildROIDeepLink(
        makeAccount({
          network: undefined,
          freight: undefined,
        }),
      ),
    );
    expect(url.searchParams.has('facilities')).toBe(false);
    expect(url.searchParams.has('primary_mode')).toBe(false);
    expect(url.searchParams.has('detention_est')).toBe(false);
    expect(url.searchParams.has('loads_per_day')).toBe(false);
  });

  it('includes the reader-aware person slug when provided', () => {
    const url = new URL(
      buildROIDeepLink(makeAccount(), { personSlug: 'dan-poland' }),
    );
    expect(url.searchParams.get('p')).toBe('dan-poland');
  });

  it('defaults ref to "memo" and respects override', () => {
    const defaultUrl = new URL(buildROIDeepLink(makeAccount()));
    expect(defaultUrl.searchParams.get('ref')).toBe('memo');

    const overridden = new URL(buildROIDeepLink(makeAccount(), { ref: 'studio-preview' }));
    expect(overridden.searchParams.get('ref')).toBe('studio-preview');
  });
});
