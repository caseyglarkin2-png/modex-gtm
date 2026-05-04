import { describe, expect, it } from 'vitest';
import { runConnectorIncidentDrill } from '@/lib/revops/incident-drills';

describe('connector incident drills', () => {
  it('returns deterministic remediation plans for required scenarios', () => {
    const auth = runConnectorIncidentDrill('auth_failure');
    const burst = runConnectorIncidentDrill('rate_limit_burst');
    const drift = runConnectorIncidentDrill('schema_drift');

    expect(auth.severity).toBe('high');
    expect(auth.slaMinutes).toBe(15);
    expect(auth.remediationPath).toContain('rotate_token');

    expect(burst.severity).toBe('medium');
    expect(burst.remediationPath).toContain('increase_backoff');

    expect(drift.remediationPath).toContain('review_mapping_contract_versions');
  });
});
