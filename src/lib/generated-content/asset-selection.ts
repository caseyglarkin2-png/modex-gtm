import { canDirectSendAsset } from '@/lib/generated-content/asset-send-contract';
import { isLegacyColdAsset } from '@/lib/revops/cold-outbound-policy';

export type AccountAssetRecord = {
  id: number;
  content_type: string;
  version: number;
  content: string;
  created_at: Date | string;
  version_metadata?: unknown;
  quality?: {
    score: number;
    blockedByThreshold?: boolean;
  } | null;
};

export type AssetFreshnessStatus = 'fresh' | 'aging' | 'stale' | 'never_refreshed';

export type AssetProvenanceSummary = {
  promptPolicyVersion: string | null;
  ctaMode: string | null;
  usedLiveIntel: boolean;
  freshnessStatus: AssetFreshnessStatus;
  freshnessLabel: string;
  signalCount: number;
  recommendedContactCount: number;
  committeeGapCount: number;
  requestedAccountName: string | null;
  persistedAccountName: string | null;
  scopedAccountNames: string[];
};

export type ResolvedAccountAssetSelection<TAsset extends AccountAssetRecord> = {
  latestAsset: TAsset | null;
  latestSendableAsset: TAsset | null;
  recommendedAsset: TAsset | null;
  fallbackAsset: TAsset | null;
  selectedAssetIds: {
    recommended: number | null;
    latest: number | null;
    latestSendable: number | null;
  };
};

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function parseAssetProvenanceSummary(versionMetadata: unknown): AssetProvenanceSummary {
  const metadata = asRecord(versionMetadata);
  const generationInput = asRecord(metadata?.generation_input_contract);
  const freshness = asRecord(generationInput?.freshness ?? metadata?.agent_context_freshness);
  const provenance = asRecord(metadata?.provenance);
  const status = (typeof freshness?.status === 'string'
    ? freshness.status
    : freshness?.stale
      ? 'stale'
      : 'fresh') as AssetFreshnessStatus;

  return {
    promptPolicyVersion: typeof metadata?.prompt_policy_version === 'string' ? metadata.prompt_policy_version : null,
    ctaMode: typeof metadata?.cta_mode === 'string' ? metadata.cta_mode : null,
    usedLiveIntel: Boolean(metadata?.agentContext || generationInput),
    freshnessStatus: status,
    freshnessLabel: status.replaceAll('_', ' '),
    signalCount: asArray(generationInput?.signals).length,
    recommendedContactCount: asArray(generationInput?.recommended_contacts).length,
    committeeGapCount: asArray(generationInput?.committee_gaps).length,
    requestedAccountName: typeof provenance?.requested_account_name === 'string' ? provenance.requested_account_name : null,
    persistedAccountName: typeof provenance?.persisted_account_name === 'string' ? provenance.persisted_account_name : null,
    scopedAccountNames: asArray(provenance?.scoped_account_names).filter((item): item is string => typeof item === 'string'),
  };
}

function assetFreshnessRank(asset: AccountAssetRecord) {
  const freshness = parseAssetProvenanceSummary(asset.version_metadata).freshnessStatus;
  switch (freshness) {
    case 'fresh':
      return 4;
    case 'aging':
      return 3;
    case 'stale':
      return 2;
    case 'never_refreshed':
    default:
      return 1;
  }
}

function isFailedAsset(asset: AccountAssetRecord) {
  const metadata = asRecord(asset.version_metadata);
  return Boolean(metadata?.failed);
}

function isStaleAsset(asset: AccountAssetRecord) {
  const freshness = parseAssetProvenanceSummary(asset.version_metadata).freshnessStatus;
  return freshness === 'stale' || freshness === 'never_refreshed';
}

export function isRecommendedSendableAsset(asset: AccountAssetRecord) {
  if (!canDirectSendAsset(asset.content_type)) return false;
  if (isFailedAsset(asset)) return false;
  if (isLegacyColdAsset(asset.version_metadata, asset.content_type)) return false;
  if (asset.quality?.blockedByThreshold) return false;
  if (isStaleAsset(asset)) return false;
  return true;
}

function compareAssetPriority(left: AccountAssetRecord, right: AccountAssetRecord) {
  const leftFreshness = assetFreshnessRank(left);
  const rightFreshness = assetFreshnessRank(right);
  if (rightFreshness !== leftFreshness) return rightFreshness - leftFreshness;

  const leftQuality = left.quality?.score ?? 0;
  const rightQuality = right.quality?.score ?? 0;
  if (rightQuality !== leftQuality) return rightQuality - leftQuality;

  if (right.version !== left.version) return right.version - left.version;
  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
}

export function resolveAccountAssetSelection<TAsset extends AccountAssetRecord>(
  assets: TAsset[],
): ResolvedAccountAssetSelection<TAsset> {
  const ordered = [...assets].sort((left, right) => {
    if (right.version !== left.version) return right.version - left.version;
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
  const latestAsset = ordered[0] ?? null;
  const latestSendableAsset = ordered.find((asset) => canDirectSendAsset(asset.content_type) && !isFailedAsset(asset)) ?? null;
  const recommendedAsset = [...ordered].filter(isRecommendedSendableAsset).sort(compareAssetPriority)[0] ?? null;
  const fallbackAsset = recommendedAsset ?? latestSendableAsset ?? latestAsset;

  return {
    latestAsset,
    latestSendableAsset,
    recommendedAsset,
    fallbackAsset,
    selectedAssetIds: {
      recommended: recommendedAsset?.id ?? null,
      latest: latestAsset?.id ?? null,
      latestSendable: latestSendableAsset?.id ?? null,
    },
  };
}
