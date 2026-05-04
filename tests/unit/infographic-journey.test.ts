import { describe, expect, it } from 'vitest';
import {
  buildBundleStageSequence,
  buildInfographicMetadata,
  detectInfographicDrift,
  evaluateInfographicTemplateQuality,
  evaluatePromotionCandidate,
  mapOutcomeToNextInfographic,
  parseInfographicMetadata,
  recommendInfographicType,
  summarizeInfographicPerformance,
  transitionJourneyState,
} from '@/lib/revops/infographic-journey';

describe('infographic journey contracts', () => {
  it('parses and builds instrumentation metadata', () => {
    const built = buildInfographicMetadata({
      infographic_type: 'proof_snapshot',
      stage_intent: 'proposal',
      bundle_id: 'bundle_123',
      sequence_position: 3,
    });
    expect(built).toEqual({
      infographicType: 'proof_snapshot',
      stageIntent: 'proposal',
      bundleId: 'bundle_123',
      sequencePosition: 3,
    });

    const parsed = parseInfographicMetadata({
      infographic: {
        infographic_type: 'executive_roi',
        stage_intent: 'customer',
      },
    });
    expect(parsed.infographicType).toBe('executive_roi');
    expect(parsed.stageIntent).toBe('customer');
  });

  it('recommends infographic type by stage and outcome', () => {
    const cold = recommendInfographicType({ stageIntent: 'cold' });
    expect(cold.recommended).toBe('cold_hook');

    const wrongPerson = recommendInfographicType({ stageIntent: 'proposal', recentOutcomes: ['wrong-person'] });
    expect(wrongPerson.recommended).toBe('diagnostic_gap');
  });

  it('scores template quality and reports missing hints', () => {
    const quality = evaluateInfographicTemplateQuality(
      'implementation_plan',
      'Phase 1 owner assignment and timeline with implementation milestones.',
    );
    expect(quality.score).toBeGreaterThan(60);
    expect(quality.matched).toContain('timeline');
    expect(quality.ready).toBe(true);
  });

  it('builds bundle stage sequences and maps assets', () => {
    expect(buildBundleStageSequence('cold_to_meeting')).toEqual(['cold', 'engaged', 'discovery']);
    expect(buildBundleStageSequence('custom', ['proposal', 'proposal', 'customer'])).toEqual(['proposal', 'customer']);
  });

  it('transitions journey state and maps next infographic', () => {
    const transition = transitionJourneyState({
      fromStage: 'discovery',
      outcomeLabel: 'positive',
    });
    expect(transition.toStage).toBe('evaluation');

    const next = mapOutcomeToNextInfographic({
      stageIntent: 'evaluation',
      outcomeLabel: 'positive',
    });
    expect(next.nextType).toBe('proof_snapshot');
  });

  it('computes leaderboard, promotion candidate, and drift', () => {
    const leaderboard = summarizeInfographicPerformance([
      {
        infographicType: 'proof_snapshot',
        stageIntent: 'proposal',
        sequencePosition: 2,
        sends: 40,
        engagements: 20,
        meetings: 8,
        deals: 2,
        dealValue: 100000,
        holdoutSends: 15,
        holdoutEngagements: 4,
      },
    ]);
    expect(leaderboard[0].confidence).toBe('high');

    const candidate = evaluatePromotionCandidate({
      row: leaderboard[0],
      reviewWindowsStable: 2,
    });
    expect(candidate.status).toBe('candidate');

    const drift = detectInfographicDrift({
      baselineRate: 0.4,
      currentRate: 0.2,
    });
    expect(drift.drifting).toBe(true);
  });
});
