import { describe, expect, it } from 'vitest';
import {
  isRecommendedSendableAsset,
  parseAssetProvenanceSummary,
  resolveAccountAssetSelection,
  type AccountAssetRecord,
} from '@/lib/generated-content/asset-selection';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION } from '@/lib/revops/cold-outbound-policy';

function makeAsset(overrides: Partial<AccountAssetRecord> = {}): AccountAssetRecord {
  return {
    id: overrides.id ?? 1,
    content_type: overrides.content_type ?? 'one_pager',
    version: overrides.version ?? 1,
    content: overrides.content ?? '{"headline":"Test"}',
    created_at: overrides.created_at ?? new Date('2026-05-05T00:00:00.000Z'),
    version_metadata: overrides.version_metadata ?? {
      prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
      cta_mode: 'scorecard_reply',
      generation_input_contract: {
        signals: [{ title: 'Dock pressure' }],
        recommended_contacts: [{ name: 'Taylor Lane' }],
        committee_gaps: [],
        freshness: { status: 'fresh', stale: false },
      },
      agentContext: { provider: 'clawd' },
    },
    quality: overrides.quality ?? { score: 92, blockedByThreshold: false },
  };
}

describe('asset selection', () => {
  it('parses provenance summary from generation metadata', () => {
    const summary = parseAssetProvenanceSummary({
      prompt_policy_version: 'cold-outbound-v2',
      cta_mode: 'scorecard_reply',
      generation_input_contract: {
        signals: [{ title: 'A' }, { title: 'B' }],
        recommended_contacts: [{ name: 'Taylor Lane' }],
        committee_gaps: ['Finance'],
        freshness: { status: 'aging', stale: false },
      },
      provenance: {
        requested_account_name: 'Boston Beer Company',
        persisted_account_name: 'The Boston Beer Company',
        scoped_account_names: ['Boston Beer Company', 'The Boston Beer Company'],
      },
      agentContext: { status: 'ok' },
    });

    expect(summary).toMatchObject({
      promptPolicyVersion: 'cold-outbound-v2',
      ctaMode: 'scorecard_reply',
      usedLiveIntel: true,
      freshnessStatus: 'aging',
      signalCount: 2,
      recommendedContactCount: 1,
      committeeGapCount: 1,
      requestedAccountName: 'Boston Beer Company',
      persistedAccountName: 'The Boston Beer Company',
      scopedAccountNames: ['Boston Beer Company', 'The Boston Beer Company'],
    });
  });

  it('rejects legacy CTA assets from recommendation', () => {
    const legacy = makeAsset({
      version_metadata: {
        source: 'one_pager_generator',
        prompt_policy_version: 'legacy-policy',
      },
    });

    expect(isRecommendedSendableAsset(legacy)).toBe(false);
    expect(resolveAccountAssetSelection([legacy]).recommendedAsset).toBeNull();
  });

  it('rejects stale assets from recommendation and falls back to a fresher prior version', () => {
    const staleLatest = makeAsset({
      id: 2,
      version: 4,
      version_metadata: {
        prompt_policy_version: COLD_OUTBOUND_PROMPT_POLICY_VERSION,
        cta_mode: 'scorecard_reply',
        generation_input_contract: {
          signals: [{ title: 'Dock pressure' }],
          recommended_contacts: [{ name: 'Taylor Lane' }],
          committee_gaps: [],
          freshness: { status: 'stale', stale: true },
        },
        agentContext: { status: 'ok' },
      },
    });
    const freshPrior = makeAsset({
      id: 1,
      version: 3,
    });

    const selection = resolveAccountAssetSelection([staleLatest, freshPrior]);
    expect(selection.latestAsset?.id).toBe(2);
    expect(selection.recommendedAsset?.id).toBe(1);
    expect(selection.fallbackAsset?.id).toBe(1);
  });

  it('falls back to the latest sendable asset when newer assets are preview-only', () => {
    const previewOnly = makeAsset({
      id: 4,
      version: 5,
      content_type: 'meeting_prep',
    });
    const onePager = makeAsset({
      id: 3,
      version: 4,
      content_type: 'one_pager',
    });

    const selection = resolveAccountAssetSelection([previewOnly, onePager]);
    expect(selection.latestAsset?.id).toBe(4);
    expect(selection.latestSendableAsset?.id).toBe(3);
    expect(selection.recommendedAsset?.id).toBe(3);
    expect(selection.fallbackAsset?.id).toBe(3);
  });

  it('returns null selections when no assets exist', () => {
    expect(resolveAccountAssetSelection([])).toEqual({
      latestAsset: null,
      latestSendableAsset: null,
      recommendedAsset: null,
      fallbackAsset: null,
      selectedAssetIds: {
        recommended: null,
        latest: null,
        latestSendable: null,
      },
      recommendationReason: null,
    });
  });
});
