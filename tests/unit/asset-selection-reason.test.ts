import { describe, expect, it } from 'vitest';
import { resolveAccountAssetSelection } from '@/lib/generated-content/asset-selection';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION } from '@/lib/revops/cold-outbound-policy';

const ONE_PAGER = 'one_pager';

function buildAsset(input: {
  id: number;
  version: number;
  qualityScore?: number;
  freshness?: 'fresh' | 'aging' | 'stale' | 'never_refreshed';
  liveIntel?: boolean;
  createdAt?: string;
}) {
  return {
    id: input.id,
    content_type: ONE_PAGER,
    version: input.version,
    content: '{"headline":"x"}',
    created_at: input.createdAt ?? '2026-05-05T00:00:00.000Z',
    quality: input.qualityScore ? { score: input.qualityScore } : null,
    version_metadata: {
      prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
      cta_mode: 'scorecard_reply',
      generation_input_contract: input.liveIntel
        ? { signals: [{}], recommended_contacts: [{}], committee_gaps: [], freshness: { status: input.freshness ?? 'fresh' } }
        : undefined,
      agent_context_freshness: input.liveIntel
        ? undefined
        : { status: input.freshness ?? 'fresh' },
    },
  };
}

describe('resolveAccountAssetSelection.recommendationReason (S3-T3)', () => {
  it('returns null when there is no recommended asset', () => {
    const result = resolveAccountAssetSelection([]);
    expect(result.recommendedAsset).toBeNull();
    expect(result.recommendationReason).toBeNull();
  });

  it('mentions fresh intel + live-intel + quality score for a single sendable asset', () => {
    const result = resolveAccountAssetSelection([
      buildAsset({ id: 1, version: 3, qualityScore: 4.2, freshness: 'fresh', liveIntel: true }),
    ]);
    expect(result.recommendedAsset?.id).toBe(1);
    expect(result.recommendationReason).toMatch(/Fresh intel/);
    expect(result.recommendationReason).toMatch(/live intel/);
    expect(result.recommendationReason).toMatch(/quality 4\.2\/5/);
    // single sendable draft does not include "of N sendable drafts"
    expect(result.recommendationReason).not.toMatch(/sendable drafts/);
  });

  it('says aging when freshness is aging', () => {
    const result = resolveAccountAssetSelection([
      buildAsset({ id: 1, version: 1, freshness: 'aging', liveIntel: true }),
    ]);
    expect(result.recommendationReason).toMatch(/Aging but usable/);
  });

  it('mentions sendable-draft count when there are multiple sendable assets', () => {
    const result = resolveAccountAssetSelection([
      buildAsset({ id: 1, version: 3, freshness: 'fresh', liveIntel: true }),
      buildAsset({ id: 2, version: 2, freshness: 'fresh', liveIntel: true }),
      buildAsset({ id: 3, version: 1, freshness: 'fresh', liveIntel: true }),
    ]);
    expect(result.recommendationReason).toMatch(/of 3 sendable drafts/);
  });
});
