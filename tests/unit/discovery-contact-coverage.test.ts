import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CuratedRow } from '@/lib/discovery/types';

const mockedPrisma = {
  persona: {
    findMany: vi.fn(),
  },
  draftQueueItem: {
    groupBy: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { computeContactCoverage, loadContactCoverage } = await import(
  '@/lib/discovery/contact-coverage'
);

function mkCurated(p: Partial<CuratedRow>): CuratedRow {
  return {
    name: 'Acme Co',
    address: '1 Main St, Springfield, IL 62701, USA',
    cityState: 'Springfield, IL',
    lat: 40,
    lng: -75,
    placeId: Math.random().toString(36).slice(2),
    icpScore: 50,
    tier: 'B',
    verticalMatch: 0,
    enterpriseScale: 0,
    networkComplexity: 0,
    primoProximity: 0,
    corridorDensity: 0,
    placeTypeBonus: 0,
    isExistingAccount: false,
    nearestPrimoName: 'US PL Allentown Factory',
    nearestPrimoDistance: 100,
    corridor: 'Springfield, IL',
    discoveredVia: [],
    excluded: false,
    segment: 'shipper',
    confidence: 'medium',
    mergedCount: 0,
    ...p,
  };
}

describe('computeContactCoverage — exact-name attribution', () => {
  it('counts distinct emails attributed by exact prospect name (the DraftQueueItem path)', () => {
    const row = mkCurated({ name: 'JB Hunt Transport Services', placeId: 'jbh' });
    const out = computeContactCoverage(
      [row],
      [
        { accountName: 'JB Hunt Transport Services', email: 'a@jbhunt.com' },
        { accountName: 'JB Hunt Transport Services', email: 'b@jbhunt.com' },
        { accountName: 'Some Other Co', email: 'x@other.com' },
      ],
    );
    expect(out.get('jbh')).toBe(2);
  });

  it('leaves unmatched rows out of the map (readers treat missing as 0)', () => {
    const row = mkCurated({ name: 'Nobody Knows LLC', placeId: 'nk' });
    const out = computeContactCoverage([row], [{ accountName: 'Other', email: 'x@y.com' }]);
    expect(out.has('nk')).toBe(false);
  });
});

describe('computeContactCoverage — union and dedup by lowercased email', () => {
  it('counts the same email once across Persona and draft-queue sources, case-insensitively', () => {
    const row = mkCurated({ name: 'Acme Co', placeId: 'acme' });
    const out = computeContactCoverage(
      [row],
      [
        { accountName: 'Acme Co', email: 'Jane.Doe@acme.com', fallbackId: 'p1' },
        { accountName: 'Acme Co', email: 'jane.doe@acme.com' },
        { accountName: 'Acme Co', email: 'john@acme.com' },
      ],
    );
    expect(out.get('acme')).toBe(2);
  });

  it('counts a persona without an email as one contact lead', () => {
    const row = mkCurated({ name: 'Acme Co', placeId: 'acme' });
    const out = computeContactCoverage(
      [row],
      [
        { accountName: 'Acme Co', email: null, fallbackId: 'p1' },
        { accountName: 'Acme Co', email: '', fallbackId: 'p2' },
        { accountName: 'Acme Co', email: 'jane@acme.com', fallbackId: 'p3' },
      ],
    );
    expect(out.get('acme')).toBe(3);
  });
});

describe('computeContactCoverage — brand-key attribution (Persona path)', () => {
  it('attaches a Persona account to a row that carries the brand token', () => {
    const row = mkCurated({ name: 'PepsiCo Beverages North America', placeId: 'pep' });
    const out = computeContactCoverage(
      [row],
      [{ accountName: 'PepsiCo', email: 'vp.ops@pepsico.com', fallbackId: 'p1' }],
    );
    expect(out.get('pep')).toBe(1);
  });

  it('unions exact-name and brand-key matches without double counting', () => {
    const row = mkCurated({ name: 'PepsiCo Beverages North America', placeId: 'pep' });
    const out = computeContactCoverage(
      [row],
      [
        { accountName: 'PepsiCo', email: 'vp.ops@pepsico.com', fallbackId: 'p1' },
        { accountName: 'PepsiCo Beverages North America', email: 'VP.OPS@pepsico.com' },
        { accountName: 'PepsiCo Beverages North America', email: 'dir.yard@pepsico.com' },
      ],
    );
    expect(out.get('pep')).toBe(2);
  });

  it('stays conservative: a place-word account name never attaches by brand key', () => {
    const row = mkCurated({ name: 'Georgia Pacific Plant', placeId: 'gp' });
    const out = computeContactCoverage(
      [row],
      [{ accountName: 'Georgia', email: 'someone@georgia.gov', fallbackId: 'p1' }],
    );
    expect(out.has('gp')).toBe(false);
  });
});

describe('loadContactCoverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('unions personas and draft-queue recipients per row', async () => {
    mockedPrisma.persona.findMany.mockResolvedValue([
      { persona_id: 'p1', account_name: 'Acme Co', email: 'jane@acme.com' },
      { persona_id: 'p2', account_name: 'Acme Co', email: null },
    ]);
    mockedPrisma.draftQueueItem.groupBy.mockResolvedValue([
      { account_name: 'Acme Co', to_email: 'jane@acme.com' },
      { account_name: 'Acme Co', to_email: 'john@acme.com' },
    ]);

    const row = mkCurated({ name: 'Acme Co', placeId: 'acme' });
    const out = await loadContactCoverage([row]);

    expect(out.get('acme')).toBe(3);
    expect(mockedPrisma.persona.findMany).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.draftQueueItem.groupBy).toHaveBeenCalledTimes(1);
    const groupByArgs = mockedPrisma.draftQueueItem.groupBy.mock.calls[0][0];
    expect(groupByArgs.by).toEqual(['account_name', 'to_email']);
    expect(groupByArgs.where).toEqual({ status: { not: 'skipped' } });
  });

  it('fails soft: any Prisma error returns an empty Map and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedPrisma.persona.findMany.mockRejectedValue(new Error('no database'));
    mockedPrisma.draftQueueItem.groupBy.mockResolvedValue([]);

    const out = await loadContactCoverage([mkCurated({ placeId: 'x' })]);

    expect(out.size).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('skips the database entirely for an empty worklist', async () => {
    const out = await loadContactCoverage([]);
    expect(out.size).toBe(0);
    expect(mockedPrisma.persona.findMany).not.toHaveBeenCalled();
  });
});
