'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Eye, Mail, AlertCircle } from 'lucide-react';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';
import { buildSendGuardState } from '@/lib/generated-content/send-guard';
import { CONTENT_QUALITY_SEND_BLOCK_THRESHOLD, type ContentQualityResult } from '@/lib/content-quality';
import { ContentQaChecklistPanel } from '@/components/generated-content/content-qa-checklist-panel';
import { getRecipientReadinessFloor } from '@/lib/revops/recipient-readiness';
import { COLD_OUTBOUND_PROMPT_POLICY_VERSION, DEFAULT_CTA_MODE } from '@/lib/revops/cold-outbound-policy';
import { recordWorkflowEvent, recordWorkflowMetric } from '@/lib/agent-actions/telemetry';

export interface Recipient {
  id: number;
  name: string;
  email: string;
  title?: string;
  role_in_deal?: string;
  canonicalStatus?: 'resolved' | 'conflict' | 'unresolved';
  canonicalConflicts?: string[];
  canonicalBlockedReason?: string | null;
  readiness?: {
    score: number;
    tier: 'high' | 'medium' | 'low';
    stale: boolean;
    freshness_days: number | null;
    reasons: string[];
  };
}

export interface OnePageSendDialogProps {
  accountName: string;
  generatedContentId?: number;
  generatedContent: {
    account_name: string;
    content: string;
    version?: number;
    provider_used?: string;
    prompt_policy_version?: string;
    cta_mode?: string;
    legacy_policy?: boolean;
    quality?: ContentQualityResult;
    campaign_type?: string;
    checklist?: {
      complete: boolean;
      requiredComplete: number;
      requiredTotal: number;
      missingRequired: string[];
    };
    checklist_completed_item_ids?: string[];
  };
  queueState?: {
    latestVersion: number;
    pendingJobs: number;
    processingJobs: number;
  };
  recipients: Recipient[];
  initialSelectedRecipientIds?: number[];
  onSuccess?: (result: { sent: number; failed: number; total: number; skipped?: Array<{ to: string; reason: string }> }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function OnePageSendDialog({
  accountName,
  generatedContentId,
  generatedContent,
  queueState,
  recipients: allRecipients,
  initialSelectedRecipientIds,
  onSuccess,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  trigger,
}: OnePageSendDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const defaultSubject = `yard network scorecard for ${accountName}`;
  const [subject, setSubject] = useState(defaultSubject);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [hideStale, setHideStale] = useState(false);
  const [showAdvisoryDetails, setShowAdvisoryDetails] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [lastSendResult, setLastSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    skipped?: Array<{ to: string; reason: string }>;
  } | null>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onControlledOpenChange || setInternalOpen;
  const bodyHtml = resolveGeneratedContentRendering(generatedContent.content, accountName).html;
  const selectedVersion = generatedContent.version ?? 1;
  const latestVersion = queueState?.latestVersion ?? selectedVersion;
  const sendGuardState = buildSendGuardState({
    selectedVersion,
    latestVersion,
    pendingJobs: queueState?.pendingJobs ?? 0,
    processingJobs: queueState?.processingJobs ?? 0,
    previewMode,
    acknowledgedGuard: true,
  });
  const quality = generatedContent.quality;
  const isLowQuality = (quality?.score ?? 100) < CONTENT_QUALITY_SEND_BLOCK_THRESHOLD;
  const readinessFloor = getRecipientReadinessFloor(generatedContent.campaign_type);
  const promptPolicyVersion = generatedContent.prompt_policy_version ?? COLD_OUTBOUND_PROMPT_POLICY_VERSION;
  const ctaMode = generatedContent.cta_mode ?? DEFAULT_CTA_MODE;
  const legacyPolicy = generatedContent.legacy_policy ?? promptPolicyVersion !== COLD_OUTBOUND_PROMPT_POLICY_VERSION;
  const recommendedRecipientIds = useMemo(() => {
    return [...allRecipients]
      .sort((left, right) => (right.readiness?.score ?? 0) - (left.readiness?.score ?? 0))
      .map((recipient) => recipient.id);
  }, [allRecipients]);

  const visibleRecipients = allRecipients.filter((recipient) => {
    const readiness = recipient.readiness;
    if (!readiness) return true;
    if (showHighOnly && readiness.tier !== 'high') return false;
    if (hideStale && readiness.stale) return false;
    return true;
  });

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRecipients(initialSelectedRecipientIds?.length ? initialSelectedRecipientIds : recommendedRecipientIds);
    setSubject(defaultSubject);
    setPreviewMode(false);
    setShowAdvisoryDetails(false);
    setInteractionCount(0);
    setLastSendResult(null);
    void recordWorkflowEvent({
      event: 'asset_send_dialog_opened',
      accountName,
      status: generatedContent.legacy_policy ? 'legacy' : 'current',
      message: generatedContent.cta_mode ?? DEFAULT_CTA_MODE,
    });
    void recordWorkflowMetric('send_from_account_rate', {
      accountName,
      action: 'asset_send',
      status: generatedContent.legacy_policy ? 'legacy' : 'current',
      value: 1,
    });
    if ((initialSelectedRecipientIds?.length ?? 0) > 0) {
      void recordWorkflowMetric('agent_recipient_accept_rate', {
        accountName,
        action: 'asset_send',
        value: initialSelectedRecipientIds?.length ?? 0,
        count: initialSelectedRecipientIds?.length ?? 0,
      });
    }
  }, [
    accountName,
    defaultSubject,
    generatedContent.cta_mode,
    generatedContent.legacy_policy,
    initialSelectedRecipientIds,
    isOpen,
    recommendedRecipientIds,
  ]);

  const handleSelectRecipient = (recipientId: number, checked: boolean) => {
    setInteractionCount((current) => current + 1);
    if (checked) {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    } else {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== recipientId));
    }
  };

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }
    setIsSending(true);
    try {
      const response = await fetch('/api/email/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          recipients: allRecipients
            .filter((r) => selectedRecipients.includes(r.id))
            .map((r) => ({
              to: r.email,
              personaId: r.id,
              personaName: r.name,
              accountName,
              readinessScore: r.readiness?.score,
              readinessTier: r.readiness?.tier,
              stale: r.readiness?.stale,
            })),
          subject,
          bodyHtml,
          generatedContentId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({} as { error?: string }));
        throw new Error(payload.error ?? `Send failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLastSendResult(result);
      void recordWorkflowEvent({
        event: 'asset_send_completed',
        accountName,
        status: 'success',
        message: `${result.sent} sent`,
      });
      void recordWorkflowMetric('preview_to_send_rate', {
        accountName,
        action: 'asset_send',
        status: 'success',
        value: result.sent,
        count: result.total,
      });
      void recordWorkflowMetric('clicks_to_send', {
        accountName,
        action: 'asset_send',
        status: 'success',
        value: interactionCount,
      });
      if (legacyPolicy) {
        void recordWorkflowMetric('legacy_asset_send_rate', {
          accountName,
          action: 'asset_send',
          status: 'legacy',
          value: result.sent,
        });
      }
      toast.success(`Sent to ${result.sent} recipient(s)`);
      onSuccess?.(result);
    } catch (err) {
      void recordWorkflowEvent({
        event: 'asset_send_completed',
        accountName,
        status: 'error',
        message: err instanceof Error ? err.message : 'unknown error',
      });
      toast.error(`Send error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = selectedRecipients.length;
  const selectedRecipientRows = allRecipients.filter((recipient) => selectedRecipients.includes(recipient.id));
  const selectedBelowFloorCount = selectedRecipientRows.filter((recipient) => (recipient.readiness?.score ?? 0) < readinessFloor).length;
  const selectedCanonicalBlockedCount = selectedRecipientRows.filter((recipient) => recipient.canonicalStatus && recipient.canonicalStatus !== 'resolved').length;
  const selectedStaleCount = selectedRecipientRows.filter((recipient) => Boolean(recipient.readiness?.stale)).length;
  const allSelected = selectedRecipients.length > 0 && selectedRecipients.length === visibleRecipients.length;
  const sendDisabledReason = selectedCount === 0
    ? 'Select at least one recipient.'
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh] flex-col">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Send Asset</DialogTitle>
          <DialogDescription>Preview and send this content to selected recipients at {accountName}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-6">
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Content Preview</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {previewMode ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
              <CardDescription>Version {generatedContent.version || 1} • Provider: {generatedContent.provider_used || 'unknown'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-md border p-2">Quality Score: {quality?.score ?? 'n/a'}</div>
                <div className="rounded-md border p-2">Threshold: {CONTENT_QUALITY_SEND_BLOCK_THRESHOLD}</div>
                <div className="rounded-md border p-2">Readiness floor: {readinessFloor}</div>
                <div className="rounded-md border p-2">CTA mode: {ctaMode.replaceAll('_', ' ')}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">Policy {promptPolicyVersion}</Badge>
                {legacyPolicy ? <Badge variant="secondary">Legacy CTA policy</Badge> : <Badge variant="default">Cold-safe CTA policy</Badge>}
                {generatedContent.checklist ? (
                  <Badge variant="outline">
                    Advisory checklist {generatedContent.checklist.requiredComplete}/{generatedContent.checklist.requiredTotal}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
            {previewMode && (
              <CardContent>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {sendGuardState.requiresGuard && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                {sendGuardState.warningMessage}
                {' '}This is a warning only.
              </p>
            </div>
          )}

          {isLowQuality && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                Quality score is below the advisory threshold ({quality?.score ?? 'n/a'} / {CONTENT_QUALITY_SEND_BLOCK_THRESHOLD}).
              </p>
            </div>
          )}

          {/* Subject Line */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subject Line</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>

          {/* Recipients Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recipients ({selectedCount})</CardTitle>
                <Badge variant="outline">{selectedCount} selected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {allRecipients.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-700">No recipients found. Add personas to this account first.</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center space-x-2 border-b pb-3">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={allSelected}
                      onChange={(event) => {
                        setInteractionCount((current) => current + 1);
                        if (!event.target.checked) {
                          setSelectedRecipients([]);
                          return;
                        }
                        setSelectedRecipients(visibleRecipients.map((recipient) => recipient.id));
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="select-all" className="cursor-pointer font-medium">
                      Select all {visibleRecipients.length} recipients
                    </Label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setInteractionCount((current) => current + 1);
                        setSelectedRecipients(recommendedRecipientIds);
                      }}
                    >
                      Select All ({recommendedRecipientIds.length})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setInteractionCount((current) => current + 1);
                        setSelectedRecipients([]);
                      }}
                    >
                      Clear Selection
                    </Button>
                    <span className="text-muted-foreground">
                      All recipients with email are preselected. Use filters only if you want to narrow the send set.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-b pb-3 text-xs">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showHighOnly} onChange={(event) => {
                        setInteractionCount((current) => current + 1);
                        setShowHighOnly(event.target.checked);
                      }} />
                      Show high confidence only
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={hideStale} onChange={(event) => {
                        setInteractionCount((current) => current + 1);
                        setHideStale(event.target.checked);
                      }} />
                      Hide stale
                    </label>
                  </div>

                  {/* Individual Recipients */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {visibleRecipients.map((recipient) => (
                      <div key={recipient.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`recipient-${recipient.id}`}
                          checked={selectedRecipients.includes(recipient.id)}
                          onChange={(event) => handleSelectRecipient(recipient.id, event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`recipient-${recipient.id}`} className="cursor-pointer flex-1">
                          <span className="font-medium">{recipient.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{recipient.email}</span>
                          {recipient.title && <span className="text-xs text-muted-foreground ml-2">({recipient.title})</span>}
                          {recipient.readiness ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs">
                              <span className={recipient.readiness.score >= readinessFloor ? 'text-emerald-700' : 'text-red-700'}>
                                Readiness {recipient.readiness.score} ({recipient.readiness.tier})
                              </span>
                              {recipient.readiness.stale ? <span className="text-amber-700">stale</span> : null}
                            </span>
                          ) : null}
                          {recipient.canonicalStatus && recipient.canonicalStatus !== 'resolved' ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-700">
                              Canonical {recipient.canonicalStatus}
                            </span>
                          ) : null}
                          {recipient.canonicalBlockedReason ? (
                            <span className="ml-2 text-xs text-red-700">{recipient.canonicalBlockedReason}</span>
                          ) : null}
                        </Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setInteractionCount((current) => current + 1);
                              setSelectedRecipients((prev) => prev.filter((id) => id !== recipient.id));
                              toast('Recipient deferred');
                            }}
                          >
                            Defer
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => toast('Use Contacts workspace to replace this contact.')}
                          >
                            Replace Contact
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => window.open(`/contacts?account=${encodeURIComponent(accountName)}`, '_blank')}
                          >
                            Open Contacts
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="rounded-lg border bg-muted/30 p-3 text-xs">
            <p className="font-medium text-foreground">Pre-send validation</p>
            <p className="mt-1 text-muted-foreground">
              Recipients selected: {selectedCount} · Selected below advisory readiness floor: {selectedBelowFloorCount} · Selected with canonical warnings: {selectedCanonicalBlockedCount} · Selected stale: {selectedStaleCount}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 px-2 text-xs"
              onClick={() => setShowAdvisoryDetails((current) => !current)}
            >
              {showAdvisoryDetails ? 'Hide advisory detail' : 'View advisory detail'}
            </Button>
            {sendDisabledReason ? (
              <p className="mt-1 text-amber-700">{sendDisabledReason}</p>
            ) : (
              <p className="mt-1 text-emerald-700">Warnings are advisory only. Send is user-controlled.</p>
            )}
            {showAdvisoryDetails && generatedContentId ? (
              <div className="mt-3">
                <ContentQaChecklistPanel
                  generatedContentId={generatedContentId}
                  campaignType={generatedContent.campaign_type}
                  accountName={accountName}
                  content={generatedContent.content}
                  initialCompleted={generatedContent.checklist_completed_item_ids}
                />
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedCount === 0 || isSending}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Mail className="mr-2 h-4 w-4 animate-pulse" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {selectedCount} Recipient{selectedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>

          {lastSendResult && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">
                Send result: {lastSendResult.sent} sent, {lastSendResult.failed} failed, {lastSendResult.total} total.
              </p>
              {(lastSendResult.skipped?.length ?? 0) > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Skipped: {lastSendResult.skipped?.map((item) => `${item.to} (${item.reason})`).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
