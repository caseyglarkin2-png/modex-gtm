'use client';

import { Button } from '@/components/ui/button';
import { OnePageSendDialog, type Recipient } from '@/components/email/one-pager-send-dialog';
import { GeneratedContentPreviewDialog } from '@/components/generated-content/generated-content-preview-dialog';
import type { ContentQualityResult } from '@/lib/content-quality';

type AccountGeneratedAssetActionProps = {
  accountName: string;
  recipients: Recipient[];
  asset: {
    id: number;
    content: string;
    content_type: string;
    version: number;
    provider_used?: string | null;
    campaign_type?: string;
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
};

export function AccountGeneratedAssetActions({
  accountName,
  recipients,
  asset,
  previewLabel = 'Preview',
  sendLabel = 'Preview & Send',
  showPreview = true,
  showSend = true,
}: AccountGeneratedAssetActionProps) {
  const sendEnabled = showSend && !['call_script', 'meeting_prep'].includes(asset.content_type);

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {showPreview ? (
        <GeneratedContentPreviewDialog
          accountName={accountName}
          version={asset.version}
          content={asset.content}
          providerUsed={asset.provider_used}
          generatedContentId={asset.id}
          campaignType={asset.campaign_type}
          checklistCompletedItemIds={asset.checklist_completed_item_ids}
          trigger={<Button variant="outline" size="sm">{previewLabel}</Button>}
        />
      ) : null}
      {sendEnabled ? (
        <OnePageSendDialog
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
          }}
          recipients={recipients}
          trigger={<Button size="sm" disabled={recipients.length === 0}>{sendLabel}</Button>}
        />
      ) : null}
    </div>
  );
}
