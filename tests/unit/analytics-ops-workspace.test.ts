import { describe, expect, it } from 'vitest';
import { parseAnalyticsTab } from '@/lib/analytics-workspace';
import { parseOpsTab } from '@/lib/ops-workspace';
import { extractLatestProofSummary } from '@/lib/proof-ledger';

describe('analytics workspace tab parsing', () => {
  it('parses known tabs and defaults to overview', () => {
    expect(parseAnalyticsTab('overview')).toBe('overview');
    expect(parseAnalyticsTab('campaigns')).toBe('campaigns');
    expect(parseAnalyticsTab('email-engagement')).toBe('email-engagement');
    expect(parseAnalyticsTab('infographic-performance')).toBe('infographic-performance');
    expect(parseAnalyticsTab('pipeline')).toBe('pipeline');
    expect(parseAnalyticsTab('quarterly')).toBe('quarterly');
    expect(parseAnalyticsTab('unknown')).toBe('overview');
    expect(parseAnalyticsTab(undefined)).toBe('overview');
  });
});

describe('ops workspace tab parsing', () => {
  it('parses known tabs and defaults to proof-ledger', () => {
    expect(parseOpsTab('proof-ledger')).toBe('proof-ledger');
    expect(parseOpsTab('cron-health')).toBe('cron-health');
    expect(parseOpsTab('generation-metrics')).toBe('generation-metrics');
    expect(parseOpsTab('provider-health')).toBe('provider-health');
    expect(parseOpsTab('feature-flags')).toBe('feature-flags');
    expect(parseOpsTab('connector-health')).toBe('connector-health');
    expect(parseOpsTab('coverage')).toBe('coverage');
    expect(parseOpsTab('unknown')).toBe('proof-ledger');
    expect(parseOpsTab(undefined)).toBe('proof-ledger');
  });
});

describe('proof ledger latest summary parser', () => {
  it('extracts latest sprint deployment and tested routes', () => {
    const markdown = `
## Sprint 8 Entry: Unified Work Queue

\`\`\`text
- Deployment URL: https://example.com/old
- Deployment ID: old_id
- Routes tested:
  - /queue
\`\`\`

## Sprint 9 Entry: Pipeline + Activity Consolidation

\`\`\`text
- Deployment URL: https://example.com/new
- Deployment ID: new_id
- Routes tested:
  - /pipeline
  - /pipeline?tab=meetings
  - /activities?filter=follow-up
- Routes changed:
  - /pipeline
\`\`\`
`;

    const summary = extractLatestProofSummary(markdown);
    expect(summary).not.toBeNull();
    expect(summary?.sprintHeading).toBe('Sprint 9 Entry: Pipeline + Activity Consolidation');
    expect(summary?.deploymentUrl).toBe('https://example.com/new');
    expect(summary?.deploymentId).toBe('new_id');
    expect(summary?.testedRoutes).toEqual(['/pipeline', '/pipeline?tab=meetings', '/activities?filter=follow-up']);
  });
});
