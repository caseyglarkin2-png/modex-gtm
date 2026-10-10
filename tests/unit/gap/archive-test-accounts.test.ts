// @vitest-environment node
/**
 * The prepared park of the two production test accounts (scripts/gap/archive-test-accounts.ts; NOT applied; Casey
 * decides, docs/gap/E2E_ACCOUNTS_CLEANUP_2026-10-10.md). Pinned: the park changes only the four named Account columns
 * and records each previous value; the restore writes those values back and refuses, by name, a field that moved
 * after the park; a park of an already parked row changes nothing; importing the script runs nothing.
 */
import { describe, expect, it } from 'vitest';
import { PARK, TEST_ACCOUNTS, parkChanges, restorePlan } from '../../../scripts/gap/archive-test-accounts';

const row = { id: 1884, name: 'E2E Boston Beer Company', tier: 'Tier 1', priority_band: 'A', pipeline_stage: 'targeted', outreach_status: 'Not started', notes: null, hubspot_company_id: null };

describe('the park and its restore (pure)', () => {
  it('changes only the four columns, records their previous values, and restores them exactly', () => {
    expect(TEST_ACCOUNTS).toEqual(['E2E Boston Beer Company', 'The E2E Boston Beer Company']);
    const changed = parkChanges(row);
    expect(changed).toEqual({
      pipeline_stage: { from: 'targeted', to: 'archived_test_fixture' },
      tier: { from: 'Tier 1', to: 'Tier 3' },
      priority_band: { from: 'A', to: 'D' },
      outreach_status: { from: 'Not started', to: 'Archived (test fixture)' },
    });
    const parked = { ...row, ...PARK };
    expect(parkChanges(parked)).toEqual({});
    expect(restorePlan(parked, changed)).toEqual({ data: { pipeline_stage: 'targeted', tier: 'Tier 1', priority_band: 'A', outreach_status: 'Not started' }, refused: [] });
  });

  it('refuses to restore a field someone changed after the park, by name', () => {
    const changed = parkChanges(row);
    const moved = { ...row, ...PARK, tier: 'Tier 2' };
    expect(restorePlan(moved, changed)).toEqual({ data: { pipeline_stage: 'targeted', priority_band: 'A', outreach_status: 'Not started' }, refused: ['tier is "Tier 2", not the parked "Tier 3"'] });
  });
});
