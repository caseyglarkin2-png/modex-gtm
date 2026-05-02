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
import { onePagerToHtml, type OnePagerData } from '@/components/ai/one-pager-preview';

export interface Recipient {
  id: number;
  name: string;
  email: string;
  title?: string;
}

export interface OnePageSendDialogProps {
  accountName: string;
  generatedContentId: number;
  generatedContent: {
    account_name: string;
    content: string;
    version?: number;
    provider_used?: string;
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

function tryParseOnePagerHtml(rawContent: string, accountName: string): string {
  const trimmed = rawContent.trim();
  if (trimmed.startsWith('<')) return rawContent;

  try {
    const parsed = JSON.parse(rawContent) as Partial<OnePagerData>;
    if (parsed && typeof parsed === 'object' && typeof parsed.headline === 'string' && typeof parsed.subheadline === 'string') {
      return onePagerToHtml(parsed as OnePagerData, accountName);
    }
  } catch {
    // Fall through to plain text wrapper.
  }

  return `<div style="white-space:pre-wrap;font-family:Arial,sans-serif;line-height:1.5;">${trimmed}</div>`;
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
  const [lastSendResult, setLastSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
    skipped?: Array<{ to: string; reason: string }>;
  } | null>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onControlledOpenChange || setInternalOpen;
  const bodyHtml = tryParseOnePagerHtml(generatedContent.content, accountName);
  const hasQueueInFlight = (queueState?.pendingJobs ?? 0) > 0 || (queueState?.processingJobs ?? 0) > 0;
  const selectedVersion = generatedContent.version ?? 1;
  const latestVersion = queueState?.latestVersion ?? selectedVersion;
  const isOutdatedVersion = selectedVersion < latestVersion;
  const requiresGuard = hasQueueInFlight || isOutdatedVersion;
  const guardBlocksSend = requiresGuard && (!previewMode || !acknowledgedGuard);

  const handleSelectRecipient = (recipientId: number, checked: boolean) => {
    if (checked) {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    } else {
      setSelectedRecipients(selectedRecipients.filter((id) => id !== recipientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(allRecipients.map((r) => r.id));
    } else {
      setSelectedRecipients([]);
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
              personaName: r.name,
              accountName,
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
  const allSelected = selectedRecipients.length === allRecipients.length;

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

          {requiresGuard && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                {isOutdatedVersion
                  ? `Version ${selectedVersion} is older than latest version ${latestVersion}.`
                  : 'New generation jobs are still in queue for this account.'}
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
                      onChange={(event) => handleSelectAll(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="select-all" className="cursor-pointer font-medium">
                      Select all {allRecipients.length} recipients
                    </Label>
                  </div>

                  {/* Individual Recipients */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allRecipients.map((recipient) => (
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
                        </Label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={selectedCount === 0 || isSending || guardBlocksSend}
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
