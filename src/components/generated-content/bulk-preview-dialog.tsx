'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';
import { buildSendGuardState } from '@/lib/generated-content/send-guard';
import type { WorkspaceRecipient } from '@/lib/generated-content/queries';

export type BulkPreviewItem = {
  accountName: string;
  generatedContentId: number;
  version: number;
  providerUsed?: string | null;
  latestVersion: number;
  pendingJobs: number;
  processingJobs: number;
  content: string;
  recipients: WorkspaceRecipient[];
};

type BulkPreviewDialogProps = {
  items: BulkPreviewItem[];
  onJobCreated?: (jobId: number) => void;
};

export function BulkPreviewDialog({ items, onJobCreated }: BulkPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const itemStates = useMemo(() => items.map((item) => ({
    item,
    rendering: resolveGeneratedContentRendering(item.content, item.accountName),
    guard: buildSendGuardState({
      selectedVersion: item.version,
      latestVersion: item.latestVersion,
      pendingJobs: item.pendingJobs,
      processingJobs: item.processingJobs,
      previewMode: true,
      acknowledgedGuard: acknowledged[item.generatedContentId] ?? false,
    }),
  })), [acknowledged, items]);

  const requiresAcknowledgement = itemStates.filter(({ guard }) => guard.requiresGuard).map(({ item }) => item.generatedContentId);
  const allAcknowledged = requiresAcknowledgement.every((id) => acknowledged[id]);
  const hasRecipients = itemStates.some(({ item }) => item.recipients.length > 0);
  const totalRecipients = itemStates.reduce((sum, { item }) => sum + item.recipients.length, 0);
  const skippedAccounts = itemStates.filter(({ item }) => item.recipients.length === 0).length;

  async function enqueueSendJob() {
    setSubmitting(true);
    try {
      const payload = {
        guardWarningsAcknowledged: true,
        requestedBy: 'Casey',
        items: itemStates
          .filter(({ item }) => item.recipients.length > 0)
          .map(({ item, rendering }) => ({
            generatedContentId: item.generatedContentId,
            accountName: item.accountName,
            subject: `MODEX 2026 – Yard Protocol Opportunities at ${item.accountName}`,
            bodyHtml: rendering.html,
            recipients: item.recipients.map((recipient) => ({
              to: recipient.email,
              personaName: recipient.name,
              accountName: item.accountName,
            })),
          })),
      };

      const response = await fetch('/api/email/send-bulk-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({} as { error?: string; job?: { id: number } }));
      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to enqueue async send job');
      }

      toast.success(`Send job #${json.job?.id ?? 'created'} queued`);
      setOpen(false);
      if (json.job?.id) onJobCreated?.(json.job.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enqueue async send job');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Bulk Preview & Queue Send ({items.length})</Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Preview</DialogTitle>
          <DialogDescription>Review selected generated content before queueing async send.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Accounts In Scope</p>
            <p className="text-sm font-semibold text-foreground">{itemStates.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recipients In Scope</p>
            <p className="text-sm font-semibold text-foreground">{totalRecipients}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Warnings To Acknowledge</p>
            <p className="text-sm font-semibold text-amber-700">{requiresAcknowledgement.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Auto-Skipped Accounts</p>
            <p className="text-sm font-semibold text-red-700">{skippedAccounts}</p>
          </div>
        </div>

        <div className="space-y-4">
          {itemStates.map(({ item, rendering, guard }) => (
            <div key={item.generatedContentId} className="rounded-lg border p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.accountName} • v{item.version}</p>
                  <p className="text-xs text-muted-foreground">
                    Provider: {item.providerUsed ?? 'unknown'} • Recipients: {item.recipients.length}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {guard.requiresGuard && <Badge className="bg-amber-100 text-amber-900">Needs Review</Badge>}
                  {item.recipients.length === 0 && <Badge className="bg-red-100 text-red-900">No Recipients</Badge>}
                  <Badge variant="outline">{rendering.source}</Badge>
                </div>
              </div>

              {guard.requiresGuard && (
                <div className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  <p>{guard.warningMessage} Preview reviewed for this item.</p>
                  <label className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={acknowledged[item.generatedContentId] ?? false}
                      onChange={(event) => setAcknowledged((prev) => ({
                        ...prev,
                        [item.generatedContentId]: event.target.checked,
                      }))}
                    />
                    I acknowledge this warning.
                  </label>
                </div>
              )}

              {item.recipients.length === 0 && (
                <p className="mb-2 text-xs text-red-600">No eligible recipients for this account. It will be skipped.</p>
              )}

              <div className="max-h-64 overflow-y-auto rounded-md border bg-slate-50 p-2">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: rendering.html }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={enqueueSendJob}
            disabled={submitting || !hasRecipients || !allAcknowledged}
            className="flex-1"
          >
            {submitting ? 'Queueing…' : 'Queue Async Send Job'}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
