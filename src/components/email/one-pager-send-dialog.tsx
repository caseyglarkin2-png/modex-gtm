'use client';

import { useState } from 'react';
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

export interface Recipient {
  id: number;
  name: string;
  email: string;
  title?: string;
  role_in_deal?: string;
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
  generatedContentId: number;
  generatedContent: {
    account_name: string;
    content: string;
    version?: number;
    provider_used?: string;
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
  onSuccess,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  trigger,
}: OnePageSendDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [subject, setSubject] = useState(`MODEX 2026 – Yard Protocol Opportunities at ${accountName}`);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [acknowledgedGuard, setAcknowledgedGuard] = useState(false);
  const [acknowledgedLowQuality, setAcknowledgedLowQuality] = useState(false);
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [hideStale, setHideStale] = useState(false);
  const [checklistComplete, setChecklistComplete] = useState(Boolean(generatedContent.checklist?.complete));
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
    acknowledgedGuard,
  });
  const quality = generatedContent.quality;
  const isLowQuality = (quality?.score ?? 100) < CONTENT_QUALITY_SEND_BLOCK_THRESHOLD;
  const qualityBlocksSend = isLowQuality && !acknowledgedLowQuality;
  const readinessFloor = getRecipientReadinessFloor(generatedContent.campaign_type);
  const checklistBlocksSend = !checklistComplete;

  const visibleRecipients = allRecipients.filter((recipient) => {
    const readiness = recipient.readiness;
    if (!readiness) return true;
    if (showHighOnly && readiness.tier !== 'high') return false;
    if (hideStale && readiness.stale) return false;
    return true;
  });

  const handleSelectRecipient = (recipientId: number, checked: boolean) => {
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
    const selected = allRecipients.filter((recipient) => selectedRecipients.includes(recipient.id));
    const belowFloor = selected.filter((recipient) => (recipient.readiness?.score ?? 0) < readinessFloor);
    if (belowFloor.length > 0) {
      toast.error(`Readiness floor ${readinessFloor} not met for ${belowFloor.length} recipient(s).`);
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
        throw new Error(`Send failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLastSendResult(result);
      toast.success(`Sent to ${result.sent} recipient(s)`);
      onSuccess?.(result);
    } catch (err) {
      toast.error(`Send error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = selectedRecipients.length;
  const selectedRecipientRows = allRecipients.filter((recipient) => selectedRecipients.includes(recipient.id));
  const selectedBelowFloorCount = selectedRecipientRows.filter((recipient) => (recipient.readiness?.score ?? 0) < readinessFloor).length;
  const selectedStaleCount = selectedRecipientRows.filter((recipient) => Boolean(recipient.readiness?.stale)).length;
  const allSelected = selectedRecipients.length > 0 && selectedRecipients.length === visibleRecipients.length;
  const sendDisabledReason = selectedCount === 0
    ? 'Select at least one recipient.'
    : sendGuardState.guardBlocksSend
      ? 'Review and acknowledge guardrails first.'
      : qualityBlocksSend
        ? 'Quality risk must be acknowledged before send.'
        : checklistBlocksSend
          ? 'Complete required QA checklist items before send.'
          : selectedBelowFloorCount > 0
            ? `Remove ${selectedBelowFloorCount} recipient(s) below readiness floor ${readinessFloor}.`
            : null;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-h-screen max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send One-Pager</DialogTitle>
          <DialogDescription>Preview and send this content to selected recipients at {accountName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">One-Pager Preview</CardTitle>
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
                <div className="rounded-md border p-2">Checklist: {generatedContent.checklist?.requiredComplete ?? 0}/{generatedContent.checklist?.requiredTotal ?? 0}</div>
              </div>
              <ContentQaChecklistPanel
                generatedContentId={generatedContentId}
                campaignType={generatedContent.campaign_type}
                initialCompleted={generatedContent.checklist_completed_item_ids}
                onSaved={() => setChecklistComplete(true)}
              />
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
                {' '}Preview and confirm before sending.
              </p>
              <label className="mt-2 flex items-center gap-2 text-xs text-amber-800">
                <input
                  type="checkbox"
                  checked={acknowledgedGuard}
                  onChange={(event) => setAcknowledgedGuard(event.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-primary focus:ring-primary"
                />
                I reviewed this version and want to send it anyway.
              </label>
            </div>
          )}

          {isLowQuality && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                Quality score is below send threshold ({quality?.score ?? 'n/a'} / {CONTENT_QUALITY_SEND_BLOCK_THRESHOLD}).
              </p>
              <label className="mt-2 flex items-center gap-2 text-xs text-red-800">
                <input
                  type="checkbox"
                  checked={acknowledgedLowQuality}
                  onChange={(event) => setAcknowledgedLowQuality(event.target.checked)}
                  className="h-4 w-4 rounded border-red-300 text-primary focus:ring-primary"
                />
                I acknowledge quality risk and approve this send.
              </label>
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

                  <div className="flex flex-wrap items-center gap-4 border-b pb-3 text-xs">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showHighOnly} onChange={(event) => setShowHighOnly(event.target.checked)} />
                      Show high confidence only
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={hideStale} onChange={(event) => setHideStale(event.target.checked)} />
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
                        </Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
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
              Recipients selected: {selectedCount} · Below readiness floor: {selectedBelowFloorCount} · Stale readiness: {selectedStaleCount}
            </p>
            {sendDisabledReason ? (
              <p className="mt-1 text-amber-700">{sendDisabledReason}</p>
            ) : (
              <p className="mt-1 text-emerald-700">Ready to send.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedCount === 0 || isSending || sendGuardState.guardBlocksSend || qualityBlocksSend || checklistBlocksSend || selectedBelowFloorCount > 0}
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
      </DialogContent>
    </Dialog>
  );
}
