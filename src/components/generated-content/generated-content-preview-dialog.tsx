'use client';

import { useState } from 'react';
import { Eye, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';
import { ContentQaChecklistPanel } from '@/components/generated-content/content-qa-checklist-panel';
import { toast } from 'sonner';
import { AssetSendDialog, type AssetSendRecipient } from '@/components/email/asset-send-dialog';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION, DEFAULT_CTA_MODE } from '@/lib/revops/cold-outbound-policy';
import { canDirectSendAsset } from '@/lib/generated-content/asset-send-contract';
import { recordWorkflowMetric } from '@/lib/agent-actions/telemetry';
import { parseAssetProvenanceSummary } from '@/lib/generated-content/asset-selection';
import { sanitizeHtml } from '@/lib/sanitize-html';

type GeneratedContentPreviewDialogProps = {
  accountName: string;
  version: number;
  content: string;
  providerUsed?: string | null;
  generatedContentId?: number;
  contentType?: string | null;
  campaignType?: string;
  checklistCompletedItemIds?: string[];
  recipients?: AssetSendRecipient[];
  versionMetadata?: unknown;
  promptPolicyVersion?: string;
  ctaMode?: string;
  legacyPolicy?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

function sourceLabel(source: ReturnType<typeof resolveGeneratedContentRendering>['source']) {
  if (source === 'json_one_pager') return 'JSON one-pager';
  if (source === 'html') return 'HTML';
  if (source === 'json_invalid') return 'Malformed JSON';
  if (source === 'json_unknown') return 'JSON (raw)';
  return 'Plain text';
}

export function GeneratedContentPreviewDialog({
  accountName,
  version,
  content,
  providerUsed,
  generatedContentId,
  contentType,
  campaignType,
  checklistCompletedItemIds,
  recipients = [],
  versionMetadata,
  promptPolicyVersion = COLD_OUTBOUND_PROMPT_POLICY_VERSION,
  ctaMode = DEFAULT_CTA_MODE,
  legacyPolicy = false,
  open,
  onOpenChange,
  trigger,
}: GeneratedContentPreviewDialogProps) {
  const [savingPlaybook, setSavingPlaybook] = useState(false);
  const [showAdvisoryDetails, setShowAdvisoryDetails] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);
  const rendering = resolveGeneratedContentRendering(content, accountName);
  const rawByDefault = rendering.source === 'json_unknown' || rendering.source === 'json_invalid';
  const sendEnabled = canDirectSendAsset(contentType) && recipients.length > 0;
  const provenance = parseAssetProvenanceSummary(versionMetadata);
  const dialogTrigger = trigger === undefined
    ? (
      <Button variant="outline" size="sm">
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Preview
      </Button>
    )
    : trigger;

  async function saveAsPlaybookBlock() {
    if (savingPlaybook) return;
    setSavingPlaybook(true);
    try {
      const response = await fetch('/api/revops/playbook-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${accountName} v${version} winning block`,
          body: content,
          blockType: 'story',
          accountName,
          generatedContentId: generatedContentId ?? null,
          stage: campaignType ?? null,
          createdBy: 'Casey',
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(payload.error ?? 'Failed to save playbook block');
      toast.success('Saved as playbook block');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save playbook block');
    } finally {
      setSavingPlaybook(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogTrigger ? <DialogTrigger asChild>{dialogTrigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>{accountName} • v{version}</DialogTitle>
          <DialogDescription>Preview the selected generated one-pager version.</DialogDescription>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Provider: {providerUsed ?? 'unknown'}</span>
            <Badge variant="outline">{sourceLabel(rendering.source)}</Badge>
            <Badge variant="outline">Policy {promptPolicyVersion}</Badge>
            <Badge variant={legacyPolicy ? 'secondary' : 'default'}>
              {legacyPolicy ? 'Legacy CTA policy' : `CTA ${ctaMode.replaceAll('_', ' ')}`}
            </Badge>
            <Badge variant="outline">{provenance.freshnessLabel}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{provenance.usedLiveIntel ? 'Live intel' : 'Static context'}</span>
            <span>{provenance.signalCount} signals</span>
            <span>{provenance.recommendedContactCount} contacts</span>
            <span>{provenance.committeeGapCount} committee gaps</span>
          </div>
          {provenance.scopedAccountNames.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Scope: {provenance.scopedAccountNames.join(', ')}
            </p>
          ) : null}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {rawByDefault ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This asset does not have a clean human-readable render yet. Use the raw payload only if you need the underlying content for debugging or regeneration.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawPayload((current) => {
                  const next = !current;
                  if (next) {
                    void recordWorkflowMetric('workspace_detour_rate', {
                      accountName,
                      action: 'raw_payload',
                      value: 1,
                    });
                  }
                  return next;
                })}
              >
                {showRawPayload ? 'Hide raw payload' : 'View raw payload'}
              </Button>
              {showRawPayload ? (
                <div className="rounded-md border bg-slate-50 p-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(rendering.html) }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border bg-slate-50 p-4">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(rendering.html) }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {sendEnabled ? (
              <AssetSendDialog
                accountName={accountName}
                generatedContentId={generatedContentId}
                generatedContent={{
                  account_name: accountName,
                  content,
                  version,
                  provider_used: providerUsed ?? undefined,
                  campaign_type: campaignType,
                  checklist_completed_item_ids: checklistCompletedItemIds,
                  prompt_policy_version: promptPolicyVersion,
                  cta_mode: ctaMode,
                  legacy_policy: legacyPolicy,
                }}
                recipients={recipients}
                trigger={
                  <Button size="sm" className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </Button>
                }
              />
            ) : null}
            <Button variant="outline" size="sm" onClick={saveAsPlaybookBlock} disabled={savingPlaybook}>
              {savingPlaybook ? 'Saving...' : 'Save as Playbook Block'}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAdvisoryDetails((current) => !current)}>
            {showAdvisoryDetails ? 'Hide advisory detail' : 'View advisory detail'}
          </Button>
        </div>
        {generatedContentId && showAdvisoryDetails ? (
          <div className="border-t px-6 py-4">
          <ContentQaChecklistPanel
            generatedContentId={generatedContentId}
            campaignType={campaignType}
            accountName={accountName}
            content={content}
            initialCompleted={checklistCompletedItemIds}
          />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
