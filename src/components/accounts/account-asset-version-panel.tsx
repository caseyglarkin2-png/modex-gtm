'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AccountGeneratedAssetActions } from '@/components/accounts/account-generated-asset-actions';
import { parseAssetProvenanceSummary, resolveAccountAssetSelection, type AccountAssetRecord } from '@/lib/generated-content/asset-selection';
import type { AssetSendRecipient } from '@/components/email/asset-send-dialog';
import type { ContentQualityResult } from '@/lib/content-quality';

type AccountAssetVersionPanelProps<TAsset extends Omit<AccountAssetRecord, 'quality'> & {
  provider_used?: string | null;
  campaign_type?: string;
  quality?: ContentQualityResult | null;
  checklist?: {
    complete: boolean;
    requiredComplete: number;
    requiredTotal: number;
    missingRequired: string[];
  };
  checklist_completed_item_ids?: string[];
}> = {
  accountName: string;
  assets: TAsset[];
  recipients: AssetSendRecipient[];
  initialSelectedRecipientIds?: number[];
};

export function AccountAssetVersionPanel<TAsset extends Omit<AccountAssetRecord, 'quality'> & {
  provider_used?: string | null;
  campaign_type?: string;
  quality?: ContentQualityResult | null;
  checklist?: {
    complete: boolean;
    requiredComplete: number;
    requiredTotal: number;
    missingRequired: string[];
  };
  checklist_completed_item_ids?: string[];
}>({
  accountName,
  assets,
  recipients,
  initialSelectedRecipientIds,
}: AccountAssetVersionPanelProps<TAsset>) {
  const selection = useMemo(() => resolveAccountAssetSelection(assets), [assets]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(selection.fallbackAsset?.id ?? null);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? selection.fallbackAsset ?? null;
  const provenance = selectedAsset ? parseAssetProvenanceSummary(selectedAsset.version_metadata) : null;

  if (!selectedAsset) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
        No generated asset versions yet. Generate with live intel to create the first account asset.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Account Asset Versions</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Switch between recommended, latest, and prior versions without leaving the account page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selection.recommendedAsset ? (
            <Button size="sm" variant={selectedAsset.id === selection.recommendedAsset.id ? 'default' : 'outline'} onClick={() => setSelectedAssetId(selection.recommendedAsset!.id)}>
              Recommended
            </Button>
          ) : null}
          {selection.latestAsset ? (
            <Button size="sm" variant={selectedAsset.id === selection.latestAsset.id ? 'default' : 'outline'} onClick={() => setSelectedAssetId(selection.latestAsset!.id)}>
              Latest
            </Button>
          ) : null}
          {selection.latestSendableAsset && selection.latestSendableAsset.id !== selection.latestAsset?.id ? (
            <Button size="sm" variant={selectedAsset.id === selection.latestSendableAsset.id ? 'default' : 'outline'} onClick={() => setSelectedAssetId(selection.latestSendableAsset!.id)}>
              Latest Sendable
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="text-xs font-medium text-[var(--muted-foreground)]">Version</label>
        <select
          value={String(selectedAsset.id)}
          onChange={(event) => setSelectedAssetId(Number(event.target.value))}
          className="h-9 rounded-md border border-[var(--border)] bg-background px-3 text-sm"
        >
          {assets
            .slice()
            .sort((left, right) => right.version - left.version)
            .map((asset) => (
              <option key={asset.id} value={asset.id}>
                v{asset.version} · {asset.content_type.replaceAll('_', ' ')}
              </option>
            ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Selected</p>
          <p className="mt-1 font-medium">{selectedAsset.content_type.replaceAll('_', ' ')} · v{selectedAsset.version}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Freshness</p>
          <p className="mt-1 font-medium">{provenance?.freshnessLabel ?? 'unknown'}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Signals Used</p>
          <p className="mt-1 font-medium">{provenance?.signalCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="text-[10px] uppercase text-[var(--muted-foreground)]">Contacts Used</p>
          <p className="mt-1 font-medium">{provenance?.recommendedContactCount ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {provenance?.promptPolicyVersion ? <Badge variant="outline">{provenance.promptPolicyVersion}</Badge> : null}
        {provenance?.ctaMode ? <Badge variant="outline">CTA {provenance.ctaMode.replaceAll('_', ' ')}</Badge> : null}
        {provenance?.usedLiveIntel ? <Badge>Live intel</Badge> : <Badge variant="secondary">No live intel</Badge>}
        {provenance?.committeeGapCount ? <Badge variant="secondary">{provenance.committeeGapCount} committee gaps</Badge> : null}
      </div>

      {provenance?.scopedAccountNames.length ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          Scope: {provenance.scopedAccountNames.join(', ')}
        </p>
      ) : null}

      <AccountGeneratedAssetActions
        accountName={accountName}
        asset={{
          ...selectedAsset,
          quality: selectedAsset.quality ?? undefined,
        }}
        recipients={recipients}
        initialSelectedRecipientIds={initialSelectedRecipientIds}
      />
    </div>
  );
}
