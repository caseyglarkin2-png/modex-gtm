import { describe, expect, it } from 'vitest';
import {
  buildRegenerationPromptContext,
  buildSideBySideDiff,
  buildSignalToContentMapping,
  computeLearningReviewSlaDueAt,
  inferSignalKind,
  nextLearningReviewStatus,
} from '@/lib/revops/engagement-learning';

describe('engagement learning loop utilities', () => {
  it('maps signal to content with deterministic signal kind', () => {
    const mapping = buildSignalToContentMapping({
      sourceKind: 'send-failure',
      sourceId: '41',
      accountName: 'General Mills',
      campaignId: 7,
      generatedContentId: 101,
      signalContext: 'Mailbox does not exist',
    });

    expect(mapping.signalKind).toBe('bounce');
    expect(mapping.generatedContentId).toBe(101);
    expect(mapping.evidenceSnapshot.signalContext).toContain('Mailbox');
  });

  it('builds regeneration prompt context from mapping evidence', () => {
    const mapping = buildSignalToContentMapping({
      sourceKind: 'email-log',
      sourceId: '11',
      accountName: 'General Mills',
      outcomeLabel: 'wrong-person',
      signalContext: 'Recipient asked to route to VP Distribution',
    });
    const prompt = buildRegenerationPromptContext(mapping);
    expect(prompt.headline).toContain('Regenerate');
    expect(prompt.prompt).toContain('wrong-person');
    expect(prompt.prompt).toContain('VP Distribution');
  });

  it('computes side-by-side diff rows for changed and unchanged lines', () => {
    const rows = buildSideBySideDiff('line one\nline two', 'line one\nline three');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.changed).toBe(false);
    expect(rows[1]?.changed).toBe(true);
  });

  it('enforces learning-review status transitions and SLA windows', () => {
    expect(inferSignalKind('email-log', 'positive')).toBe('positive-signal');
    expect(nextLearningReviewStatus('proposed', 'review')).toBe('in-review');
    expect(nextLearningReviewStatus('approved', 'deploy')).toBe('deployed');
    expect(nextLearningReviewStatus('deployed', 'approve')).toBeNull();

    const createdAt = new Date('2026-05-01T00:00:00Z');
    expect(computeLearningReviewSlaDueAt(createdAt, 'proposed')?.toISOString()).toContain('2026-05-08');
    expect(computeLearningReviewSlaDueAt(createdAt, 'approved')?.toISOString()).toContain('2026-05-03');
    expect(computeLearningReviewSlaDueAt(createdAt, 'deployed')).toBeNull();
  });
});
