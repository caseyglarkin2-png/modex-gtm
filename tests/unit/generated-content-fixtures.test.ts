import { describe, expect, it } from 'vitest';
import { buildGeneratedContentFixtures } from '../fixtures/generated-content';

describe('buildGeneratedContentFixtures', () => {
  it('returns versions, queue states, and recipient scenarios used by sprint tests', () => {
    const fixtures = buildGeneratedContentFixtures();

    const gmVersions = fixtures.generatedContent
      .filter((item) => item.accountName === 'General Mills')
      .map((item) => item.version);
    const queueStatuses = fixtures.generationJobs.map((job) => job.status);
    const noRecipient = fixtures.personas.find((persona) => persona.accountName === 'No Recipient Co');

    expect(gmVersions).toEqual([1, 2]);
    expect(queueStatuses).toContain('failed');
    expect(queueStatuses).toContain('pending');
    expect(queueStatuses).toContain('processing');
    expect(noRecipient?.email).toBeNull();
    expect(noRecipient?.doNotContact).toBe(true);
  });
});
