import { describe, expect, it } from 'vitest';
import { buildSendJobFixtures } from '../fixtures/send-jobs';

describe('buildSendJobFixtures', () => {
  it('includes all workflow states and retry candidates', () => {
    const fixtures = buildSendJobFixtures();
    const statuses = fixtures.jobs.map((job) => job.status);
    const retryableFailures = fixtures.recipients.filter((recipient) => recipient.status === 'failed' && recipient.retryable);

    expect(statuses).toContain('pending');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('partial');
    expect(statuses).toContain('failed');
    expect(retryableFailures.length).toBeGreaterThan(0);
  });
});
