import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── HubSpot client mock (fetch path) ─────────────────────────────────────────
const doSearch = vi.fn();
const batchRead = vi.fn();
let hubspotConfigured = true;

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => hubspotConfigured,
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
  getHubSpotClient: () => ({
    crm: {
      deals: {
        searchApi: { doSearch: (...a: unknown[]) => doSearch(...a) },
        batchApi: { read: (...a: unknown[]) => batchRead(...a) },
      },
    },
  }),
}));

import { computeVelocity } from '@/lib/revops/velocity/aggregate';
import { fetchDealStageHistories, resolveVelocityOptions } from '@/lib/revops/velocity/fetch';
import { computePipelineVelocity } from '@/lib/revops/velocity';
import type { DealStageHistory } from '@/lib/revops/velocity/types';

const DAY = 86_400_000;
const base = Date.UTC(2026, 0, 1); // fixed anchor
const at = (days: number) => base + days * DAY;

beforeEach(() => {
  doSearch.mockReset();
  batchRead.mockReset();
  hubspotConfigured = true;
});

// ── Pure aggregation ─────────────────────────────────────────────────────────
describe('computeVelocity', () => {
  it('computes average dwell per stage and stage-conversion counts', () => {
    // Deal 1: Discovery (day 0) -> Solution (day 4) -> Proposal (day 10)
    //   dwell Discovery = 4d, dwell Solution = 6d, Proposal = open (no dwell)
    // Deal 2: Discovery (day 0) -> Solution (day 2) -> Proposal (day 6)
    //   dwell Discovery = 2d, dwell Solution = 4d
    const deals: DealStageHistory[] = [
      {
        id: '1',
        dealname: 'A',
        history: [
          { stage: 'discovery', timestampMs: at(0) },
          { stage: 'solution', timestampMs: at(4) },
          { stage: 'proposal', timestampMs: at(10) },
        ],
      },
      {
        id: '2',
        dealname: 'B',
        history: [
          { stage: 'discovery', timestampMs: at(0) },
          { stage: 'solution', timestampMs: at(2) },
          { stage: 'proposal', timestampMs: at(6) },
        ],
      },
    ];

    const r = computeVelocity(deals);
    expect(r.dealsAnalyzed).toBe(2);
    expect(r.dealsWithDwell).toBe(2);

    const dwell = Object.fromEntries(r.stageDwell.map((s) => [s.stage, s]));
    // Discovery: (4 + 2) / 2 = 3
    expect(dwell.discovery.avgDays).toBe(3);
    expect(dwell.discovery.observations).toBe(2);
    // Solution: (6 + 4) / 2 = 5
    expect(dwell.solution.avgDays).toBe(5);
    // Proposal is the current (final) stage for both — open-ended, no dwell recorded
    expect(dwell.proposal).toBeUndefined();

    const trans = Object.fromEntries(r.transitions.map((t) => [`${t.from}->${t.to}`, t.count]));
    expect(trans['discovery->solution']).toBe(2);
    expect(trans['solution->proposal']).toBe(2);
  });

  it('normalizes out-of-order (newest-first) history correctly', () => {
    // HubSpot returns history newest-first; the aggregator must sort ascending.
    const deals: DealStageHistory[] = [
      {
        id: '1',
        dealname: 'A',
        history: [
          { stage: 'solution', timestampMs: at(5) },
          { stage: 'discovery', timestampMs: at(0) },
        ],
      },
    ];
    const r = computeVelocity(deals);
    const dwell = Object.fromEntries(r.stageDwell.map((s) => [s.stage, s]));
    expect(dwell.discovery.avgDays).toBe(5); // 0 -> 5, dwell in discovery
    expect(dwell.solution).toBeUndefined(); // current stage, open-ended
    expect(r.transitions[0]).toEqual({ from: 'discovery', to: 'solution', count: 1 });
  });

  it('single-entry deals contribute no dwell but still count as analyzed', () => {
    const deals: DealStageHistory[] = [
      { id: '1', dealname: 'A', history: [{ stage: 'discovery', timestampMs: at(0) }] },
    ];
    const r = computeVelocity(deals);
    expect(r.dealsAnalyzed).toBe(1);
    expect(r.dealsWithDwell).toBe(0);
    expect(r.stageDwell).toHaveLength(0);
    expect(r.transitions).toHaveLength(0);
  });

  it('carries warnings through and never throws on empty input', () => {
    const r = computeVelocity([], ['upstream warning']);
    expect(r.dealsAnalyzed).toBe(0);
    expect(r.warnings).toEqual(['upstream warning']);
    expect(r.source).toBe('hubspot-dealstage-history');
  });
});

describe('resolveVelocityOptions', () => {
  it('applies defaults and clamps', () => {
    expect(resolveVelocityOptions()).toMatchObject({ lookbackDays: 180, maxDeals: 300, pipelineId: 'default' });
    expect(resolveVelocityOptions({ lookbackDays: 99999, maxDeals: 99999 })).toMatchObject({
      lookbackDays: 3650,
      maxDeals: 1000,
    });
    expect(resolveVelocityOptions({ pipelineId: null }).pipelineId).toBeNull();
  });
});

// ── Fetch path (mocked HubSpot propertiesWithHistory response) ────────────────
describe('fetchDealStageHistories', () => {
  it('parses a propertiesWithHistory batch response into stage histories', async () => {
    doSearch.mockResolvedValue({ results: [{ id: '11' }, { id: '22' }], paging: undefined });
    batchRead.mockResolvedValue({
      results: [
        {
          id: '11',
          properties: { dealname: 'Acme' },
          // HubSpot returns Date timestamps, newest-first
          propertiesWithHistory: {
            dealstage: [
              { value: 'qualifiedtobuy', timestamp: new Date(at(3)) },
              { value: 'appointmentscheduled', timestamp: new Date(at(0)) },
            ],
          },
        },
        {
          id: '22',
          properties: { dealname: 'Beta' },
          propertiesWithHistory: {
            dealstage: [{ value: 'appointmentscheduled', timestamp: new Date(at(1)) }],
          },
        },
      ],
    });

    const { deals, warnings } = await fetchDealStageHistories();
    expect(warnings).toEqual([]);
    expect(deals).toHaveLength(2);

    const r = computeVelocity(deals, warnings);
    const dwell = Object.fromEntries(r.stageDwell.map((s) => [s.stage, s]));
    // Deal 11: appointmentscheduled 0 -> qualifiedtobuy 3, dwell 3d
    expect(dwell.appointmentscheduled.avgDays).toBe(3);
    expect(r.transitions[0]).toEqual({ from: 'appointmentscheduled', to: 'qualifiedtobuy', count: 1 });
    // Deal 22 single-entry -> no dwell
    expect(r.dealsWithDwell).toBe(1);
  });

  it('fail-soft: returns a warning (never throws) when the search errors', async () => {
    doSearch.mockRejectedValue(new Error('HubSpot 500'));
    const { deals, warnings } = await fetchDealStageHistories();
    expect(deals).toEqual([]);
    expect(warnings.some((w) => w.includes('deal search failed'))).toBe(true);
  });

  it('fail-soft: isolates a failed history-read chunk and keeps partial data', async () => {
    doSearch.mockResolvedValue({ results: [{ id: '11' }], paging: undefined });
    batchRead.mockRejectedValue(new Error('batch read boom'));
    const { deals, warnings } = await fetchDealStageHistories();
    expect(deals).toEqual([]);
    expect(warnings.some((w) => w.includes('history read failed'))).toBe(true);
  });

  it('returns a warning when HubSpot is unconfigured', async () => {
    hubspotConfigured = false;
    const { deals, warnings } = await fetchDealStageHistories();
    expect(deals).toEqual([]);
    expect(warnings[0]).toMatch(/not configured/);
  });
});

describe('computePipelineVelocity (end to end, mocked client)', () => {
  it('fetches and aggregates without throwing', async () => {
    doSearch.mockResolvedValue({ results: [{ id: '11' }], paging: undefined });
    batchRead.mockResolvedValue({
      results: [
        {
          id: '11',
          properties: { dealname: 'Acme' },
          propertiesWithHistory: {
            dealstage: [
              { value: 'presentationscheduled', timestamp: new Date(at(9)) },
              { value: 'qualifiedtobuy', timestamp: new Date(at(4)) },
              { value: 'appointmentscheduled', timestamp: new Date(at(0)) },
            ],
          },
        },
      ],
    });
    const r = await computePipelineVelocity();
    expect(r.dealsAnalyzed).toBe(1);
    expect(r.dealsWithDwell).toBe(1);
    const dwell = Object.fromEntries(r.stageDwell.map((s) => [s.stage, s]));
    expect(dwell.appointmentscheduled.avgDays).toBe(4); // 0 -> 4
    expect(dwell.qualifiedtobuy.avgDays).toBe(5); // 4 -> 9
  });
});
