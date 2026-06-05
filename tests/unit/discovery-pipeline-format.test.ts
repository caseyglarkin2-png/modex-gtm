import { describe, expect, it } from 'vitest';
import {
  hubspotStageLabel,
  daysSince,
  isStaleDeal,
  mapDealToPipelineState,
  STALE_DAYS,
} from '@/lib/discovery/pipeline-format';

const NOW = new Date('2026-06-04T00:00:00Z').getTime();
const iso = (daysAgo: number) => new Date(NOW - daysAgo * 86400000).toISOString();

describe('hubspotStageLabel', () => {
  it('maps standard HubSpot deal stages to readable labels', () => {
    expect(hubspotStageLabel('decisionmakerboughtin')).toBe('Meeting');
    expect(hubspotStageLabel('contractsent')).toBe('Proposal');
    expect(hubspotStageLabel('closedwon')).toBe('Closed Won');
    expect(hubspotStageLabel('closedlost')).toBe('Closed Lost');
  });

  it('falls back gracefully for unknown stages', () => {
    expect(hubspotStageLabel('')).toBe('Unknown');
    expect(hubspotStageLabel('some_custom_stage')).toBeTruthy();
  });
});

describe('daysSince / isStaleDeal', () => {
  it('counts whole days since an ISO timestamp', () => {
    expect(daysSince(iso(21), NOW)).toBe(21);
    expect(daysSince(iso(0), NOW)).toBe(0);
  });

  it('flags a deal stale only past the threshold', () => {
    expect(isStaleDeal(iso(STALE_DAYS), NOW)).toBe(true);
    expect(isStaleDeal(iso(STALE_DAYS - 1), NOW)).toBe(false);
    expect(isStaleDeal(null, NOW)).toBe(false);
  });
});

describe('mapDealToPipelineState', () => {
  it('builds a pipeline state from deal properties + resolved owner', () => {
    const state = mapDealToPipelineState(
      {
        dealname: 'YardFlow - GXO Logistics',
        dealstage: 'decisionmakerboughtin',
        amount: '50000',
        closedate: iso(-30),
        hubspot_owner_id: '111',
        notes_last_contacted: iso(25),
        hs_next_step: 'Send pilot proposal',
      },
      'Casey Larkin',
      NOW,
    );
    expect(state.stage).toBe('Meeting');
    expect(state.owner).toBe('Casey Larkin');
    expect(state.amount).toBe(50000);
    expect(state.nextStep).toBe('Send pilot proposal');
    expect(state.isStale).toBe(true); // last activity 25d ago
  });

  it('prefers notes_last_contacted but falls back to last-modified', () => {
    const state = mapDealToPipelineState(
      { dealstage: 'qualifiedtobuy', hs_lastmodifieddate: iso(2) },
      null,
      NOW,
    );
    expect(state.stage).toBe('Contacted');
    expect(state.owner).toBeNull();
    expect(state.isStale).toBe(false);
    expect(state.lastActivity).not.toBeNull();
  });
});
