import { describe, expect, it } from 'vitest';
import {
  OPERATOR_OUTCOME_TAXONOMY,
  applyOutcomeWeightToPlaybookScore,
  auditOperatorOutcomeQuality,
  buildOutcomeFollowUpRecommendation,
  buildOutcomeTrend,
  derivePromptRecommendations,
  parseOperatorOutcomeLabel,
} from '@/lib/revops/operator-outcomes';

describe('operator outcomes contracts', () => {
  it('defines stable outcome taxonomy and parser', () => {
    expect(OPERATOR_OUTCOME_TAXONOMY).toEqual([
      'positive',
      'neutral',
      'negative',
      'wrong-person',
      'bad-timing',
      'closed-won',
      'closed-lost',
    ]);
    expect(parseOperatorOutcomeLabel('positive')).toBe('positive');
    expect(parseOperatorOutcomeLabel('not-valid')).toBeNull();
  });

  it('builds trends and recommendations from outcomes', () => {
    const rows = [
      { id: '1', account_name: 'A', campaign_id: 1, generated_content_id: 11, outcome_label: 'wrong-person', source_kind: 'engagement', source_id: '1', notes: null, created_at: new Date('2026-05-02T10:00:00.000Z') },
      { id: '2', account_name: 'A', campaign_id: 1, generated_content_id: 11, outcome_label: 'wrong-person', source_kind: 'engagement', source_id: '2', notes: null, created_at: new Date('2026-05-03T10:00:00.000Z') },
      { id: '3', account_name: 'A', campaign_id: 1, generated_content_id: 11, outcome_label: 'positive', source_kind: 'engagement', source_id: '3', notes: 'Good fit', created_at: new Date('2026-05-04T10:00:00.000Z') },
    ];

    const trend = buildOutcomeTrend(rows, 5, new Date('2026-05-05T00:00:00.000Z'));
    expect(trend).toHaveLength(5);
    const positiveDay = trend.find((point) => point.day === '2026-05-04');
    expect(positiveDay?.counts.positive).toBe(1);

    const recommendations = derivePromptRecommendations(rows);
    expect(recommendations.some((entry) => entry.key === 'persona-targeting-tighten')).toBe(true);
  });

  it('audits missing/ambiguous/conflicting and applies ranking weight', () => {
    const now = new Date();
    const issues = auditOperatorOutcomeQuality([
      {
        id: 'missing-1',
        account_name: 'A',
        campaign_id: 1,
        generated_content_id: 10,
        outcome_label: '',
        source_kind: 'queue-item',
        source_id: 'x',
        notes: null,
        created_at: now,
      },
      {
        id: 'ambiguous-1',
        account_name: 'A',
        campaign_id: 1,
        generated_content_id: 10,
        outcome_label: 'neutral',
        source_kind: 'queue-item',
        source_id: 'y',
        notes: 'short',
        created_at: now,
      },
      {
        id: 'conflict-pos',
        account_name: 'B',
        campaign_id: null,
        generated_content_id: 11,
        outcome_label: 'positive',
        source_kind: 'queue-item',
        source_id: '1',
        notes: null,
        created_at: now,
      },
      {
        id: 'conflict-neg',
        account_name: 'B',
        campaign_id: null,
        generated_content_id: 11,
        outcome_label: 'negative',
        source_kind: 'queue-item',
        source_id: '2',
        notes: null,
        created_at: now,
      },
    ]);

    expect(issues.some((issue) => issue.issueType === 'missing')).toBe(true);
    expect(issues.some((issue) => issue.issueType === 'ambiguous')).toBe(true);
    expect(issues.some((issue) => issue.issueType === 'conflicting')).toBe(true);

    const weighted = applyOutcomeWeightToPlaybookScore(1, [
      { outcome_label: 'closed-won' },
      { outcome_label: 'positive' },
      { outcome_label: 'negative' },
    ]);
    expect(weighted).toBe(1.2);
  });

  it('maps outcomes into a concrete follow-up action and asset recommendation', () => {
    const wrongPerson = buildOutcomeFollowUpRecommendation({
      outcomeLabel: 'wrong-person',
      stageIntent: 'engaged',
      coverageGapCount: 2,
      hasMeetingSignal: false,
      notes: 'Need the transportation director instead',
    });
    expect(wrongPerson).toMatchObject({
      latestOutcomeLabel: 'wrong-person',
      nextAction: {
        label: 'Replace the contact before the next send',
        route: '#committee',
        tone: 'blocked',
      },
      nextAsset: {
        route: '#outreach',
      },
    });

    const positive = buildOutcomeFollowUpRecommendation({
      outcomeLabel: 'positive',
      stageIntent: 'discovery',
      coverageGapCount: 0,
      hasMeetingSignal: false,
    });
    expect(positive).toMatchObject({
      latestOutcomeLabel: 'positive',
      nextAction: {
        label: 'Convert the warm response into a meeting',
        route: '#history',
        tone: 'ready',
      },
    });
  });
});
