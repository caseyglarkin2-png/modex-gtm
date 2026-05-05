'use client';

import { Button } from '@/components/ui/button';
import { AssetSendDialog, type AssetSendRecipient } from '@/components/email/asset-send-dialog';
import { GeneratedContentPreviewDialog } from '@/components/generated-content/generated-content-preview-dialog';
import type { ContentQualityResult } from '@/lib/content-quality';
import { isLegacyColdAsset } from '@/lib/revops/cold-outbound-policy';
import { canDirectSendAsset } from '@/lib/generated-content/asset-send-contract';

type AccountGeneratedAssetActionProps = {
  accountName: string;
  recipients: AssetSendRecipient[];
  asset: {
    id: number;
    content: string;
    content_type: string;
    version: number;
    provider_used?: string | null;
    campaign_type?: string;
    version_metadata?: unknown;
    quality?: ContentQualityResult;
    checklist?: {
      complete: boolean;
      requiredComplete: number;
      requiredTotal: number;
      missingRequired: string[];
    };
    checklist_completed_item_ids?: string[];
  };
  previewLabel?: string;
  sendLabel?: string;
  showPreview?: boolean;
  showSend?: boolean;
  initialSelectedRecipientIds?: number[];
};

export function AccountGeneratedAssetActions({
  accountName,
  recipients,
  asset,
  previewLabel = 'Preview',
  sendLabel = 'Preview & Send',
  showPreview = true,
  showSend = true,
  initialSelectedRecipientIds,
}: AccountGeneratedAssetActionProps) {
  const sendEnabled = showSend && canDirectSendAsset(asset.content_type);
  const legacyPolicy = isLegacyColdAsset(asset.version_metadata, asset.content_type);
  const versionMetadata = asset.version_metadata && typeof asset.version_metadata === 'object'
    ? asset.version_metadata as Record<string, unknown>
    : null;
  const promptPolicyVersion = typeof versionMetadata?.prompt_policy_version === 'string'
    ? versionMetadata.prompt_policy_version
    : undefined;
  const ctaMode = typeof versionMetadata?.cta_mode === 'string'
    ? versionMetadata.cta_mode
    : undefined;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {showPreview ? (
        <GeneratedContentPreviewDialog
          accountName={accountName}
          version={asset.version}
          content={asset.content}
          providerUsed={asset.provider_used}
          generatedContentId={asset.id}
          contentType={asset.content_type}
          campaignType={asset.campaign_type}
          checklistCompletedItemIds={asset.checklist_completed_item_ids}
          recipients={recipients}
          promptPolicyVersion={promptPolicyVersion}
          ctaMode={ctaMode}
          legacyPolicy={legacyPolicy}
          trigger={<Button variant="outline" size="sm">{previewLabel}</Button>}
        />
      ) : null}
      {sendEnabled ? (
        <AssetSendDialog
          accountName={accountName}
          generatedContentId={asset.id}
          generatedContent={{
            account_name: accountName,
            content: asset.content,
            version: asset.version,
            provider_used: asset.provider_used ?? undefined,
            quality: asset.quality,
            campaign_type: asset.campaign_type,
            checklist: asset.checklist,
            checklist_completed_item_ids: asset.checklist_completed_item_ids,
            prompt_policy_version: promptPolicyVersion,
            cta_mode: ctaMode,
            legacy_policy: legacyPolicy,
          }}
          recipients={recipients}
          initialSelectedRecipientIds={initialSelectedRecipientIds}
          trigger={<Button size="sm" disabled={recipients.length === 0}>{sendLabel}</Button>}
        />
      ) : null}
    </div>
  );
}
