'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';
import { buildSendGuardState } from '@/lib/generated-content/send-guard';
import { previewVariantAllocation, type ExperimentMetric } from '@/lib/experiments/split';
import type { WorkspaceRecipient } from '@/lib/generated-content/queries';
import { getRecipientReadinessFloor } from '@/lib/revops/recipient-readiness';
import { getStrategyPreset, getStrategyWarning, type PacingMode } from '@/lib/revops/send-strategy';
import { ContentQaChecklistPanel } from '@/components/generated-content/content-qa-checklist-panel';

export type BulkPreviewItem = {
  accountName: string;
  generatedContentId: number;
  version: number;
  providerUsed?: string | null;
  campaignType?: string;
  infographicType?: string;
  stageIntent?: string;
  sequencePosition?: number | null;
  bundleId?: string | null;
  latestVersion: number;
  pendingJobs: number;
  processingJobs: number;
  content: string;
  checklist?: {
    complete: boolean;
    requiredComplete: number;
    requiredTotal: number;
    missingRequired: string[];
  };
  checklistCompletedItemIds?: string[];
  recipients: WorkspaceRecipient[];
};

type BulkPreviewDialogProps = {
  items: BulkPreviewItem[];
  onJobCreated?: (jobId: number) => void;
};

type VariantDraft = {
  variantKey: string;
  label: string;
  subject: string;
  opening: string;
  cta: string;
  split: number;
  isControl: boolean;
};

const DEFAULT_SUBJECT = 'MODEX 2026 - Yard Protocol Opportunities';

export function BulkPreviewDialog({ items, onJobCreated }: BulkPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [experimentEnabled, setExperimentEnabled] = useState(false);
  const [experimentName, setExperimentName] = useState('Cold Start Subject/Opening Test');
  const [primaryMetric, setPrimaryMetric] = useState<ExperimentMetric>('reply_rate');
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [hideStale, setHideStale] = useState(false);
  const [sendSequenceOffsetByItem, setSendSequenceOffsetByItem] = useState<Record<number, number>>({});
  const [strategyPreset, setStrategyPreset] = useState<PacingMode>('balanced');
  const [strategy, setStrategy] = useState(getStrategyPreset('balanced'));
  const [deferredAccounts, setDeferredAccounts] = useState<Record<string, boolean>>({});
  const [variants, setVariants] = useState<VariantDraft[]>([
    {
      variantKey: 'control',
      label: 'Control',
      subject: `${DEFAULT_SUBJECT} (Control)`,
      opening: 'Reaching out because this account matches our highest-priority lane for yard protocol adoption.',
      cta: 'Would you be open to a quick workflow review next week?',
      split: 50,
      isControl: true,
    },
    {
      variantKey: 'challenger',
      label: 'Challenger',
      subject: `${DEFAULT_SUBJECT} (Challenger)`,
      opening: 'Built this with your operation in mind based on current network and facility profile signals.',
      cta: 'Open to a 15-minute walkthrough to compare this approach with your current process?',
      split: 50,
      isControl: false,
    },
  ]);

  const itemStates = useMemo(() => {
    return items
      .filter((item) => !deferredAccounts[item.accountName])
      .sort((left, right) => (left.sequencePosition ?? 999) - (right.sequencePosition ?? 999))
      .map((item) => {
        const filteredRecipients = item.recipients.filter((recipient) => {
          if (showHighOnly && recipient.readiness?.tier !== 'high') return false;
          if (hideStale && recipient.readiness?.stale) return false;
          return true;
        });
        const readinessFloor = getRecipientReadinessFloor(item.campaignType);
        const sendableRecipients = filteredRecipients.filter((recipient) => {
          if (recipient.canonicalStatus && recipient.canonicalStatus !== 'resolved') return false;
          return (recipient.readiness?.score ?? 0) >= readinessFloor;
        });
        return {
          item,
          filteredRecipients,
          sendableRecipients,
          skippedByPolicyCount: filteredRecipients.length - sendableRecipients.length,
          rendering: resolveGeneratedContentRendering(item.content, item.accountName),
          guard: buildSendGuardState({
            selectedVersion: item.version,
            latestVersion: item.latestVersion,
            pendingJobs: item.pendingJobs,
            processingJobs: item.processingJobs,
            previewMode: true,
            acknowledgedGuard: acknowledged[item.generatedContentId] ?? false,
          }),
        };
      });
  }, [acknowledged, deferredAccounts, hideStale, items, showHighOnly]);

  const requiresAcknowledgement = itemStates.filter(({ guard }) => guard.requiresGuard).map(({ item }) => item.generatedContentId);
  const allAcknowledged = requiresAcknowledgement.every((id) => acknowledged[id]);
  const hasRecipients = itemStates.some(({ sendableRecipients }) => sendableRecipients.length > 0);
  const totalRecipients = itemStates.reduce((sum, { sendableRecipients }) => sum + sendableRecipients.length, 0);
  const skippedAccounts = itemStates.filter(({ sendableRecipients }) => sendableRecipients.length === 0).length;
  const autoSkippedRecipients = itemStates.reduce((sum, { item, filteredRecipients, skippedByPolicyCount }) => (
    sum + (item.recipients.length - filteredRecipients.length) + skippedByPolicyCount
  ), 0);
  const splitTotal = variants.reduce((sum, variant) => sum + variant.split, 0);
  const hasControl = variants.some((variant) => variant.isControl);
  const allocationPreview = useMemo(
    () => previewVariantAllocation(
      totalRecipients,
      variants.map((variant, idx) => ({
        variantId: `draft-${idx}`,
        variantKey: variant.variantKey,
        split: variant.split,
      })),
    ),
    [totalRecipients, variants],
  );
  const experimentValid = !experimentEnabled || (splitTotal === 100 && hasControl && variants.length >= 2);
  const queueDisabled = submitting || !hasRecipients || !allAcknowledged || !experimentValid;
  const checklistBlockingItems = itemStates.filter(({ item }) => item.checklist && !item.checklist.complete);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) => current.map((variant, idx) => (idx === index ? { ...variant, ...patch } : variant)));
  }

  async function enqueueSendJob() {
    if (experimentEnabled && !experimentValid) {
      toast.error('Experiment split must total 100% and include one control variant.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        guardWarningsAcknowledged: true,
        requestedBy: 'Casey',
        strategy,
        experiment: experimentEnabled
          ? {
            name: experimentName,
            primaryMetric,
            split: Object.fromEntries(variants.map((variant) => [variant.variantKey, variant.split])),
            variants: variants.map((variant) => ({
              variantKey: variant.variantKey,
              subject: variant.subject,
              opening: variant.opening,
              cta: variant.cta,
              split: variant.split,
              isControl: variant.isControl,
            })),
          }
          : undefined,
        items: itemStates
          .filter(({ sendableRecipients }) => sendableRecipients.length > 0)
          .map(({ item, rendering, sendableRecipients }) => ({
            generatedContentId: item.generatedContentId,
            accountName: item.accountName,
            bundleId: item.bundleId ?? null,
            sequencePosition: sendSequenceOffsetByItem[item.generatedContentId]
              ?? item.sequencePosition
              ?? null,
            subject: `${DEFAULT_SUBJECT} at ${item.accountName}`,
            bodyHtml: rendering.html,
            recipients: sendableRecipients.map((recipient) => ({
              to: recipient.email,
              personaId: recipient.id,
              personaName: recipient.name,
              accountName: item.accountName,
              readinessScore: recipient.readiness?.score,
              readinessTier: recipient.readiness?.tier,
              stale: recipient.readiness?.stale,
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

        <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-xs md:grid-cols-6">
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
          <div>
            <p className="text-muted-foreground">Auto-Skipped Recipients</p>
            <p className="text-sm font-semibold text-amber-700">{autoSkippedRecipients}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Checklist Blocks</p>
            <p className="text-sm font-semibold text-amber-700">{checklistBlockingItems.length}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Recipient Readiness + Send Strategy</p>
              <p className="text-xs text-muted-foreground">Filter low-confidence recipients and control pacing/caps before queueing.</p>
            </div>
            <select
              className="rounded border bg-background px-2 py-1 text-xs"
              value={strategyPreset}
              onChange={(event) => {
                const preset = event.target.value as PacingMode;
                setStrategyPreset(preset);
                setStrategy(getStrategyPreset(preset));
              }}
            >
              <option value="safe">Safe</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">{getStrategyWarning(strategyPreset)}</p>
          <div className="grid gap-2 md:grid-cols-4">
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Timezone</span>
              <input
                className="w-full rounded border bg-background px-2 py-1"
                value={strategy.timezone_window.timezone}
                onChange={(event) => setStrategy((prev) => ({
                  ...prev,
                  timezone_window: { ...prev.timezone_window, timezone: event.target.value },
                }))}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Window Start</span>
              <input
                type="number"
                min={0}
                max={23}
                className="w-full rounded border bg-background px-2 py-1"
                value={strategy.timezone_window.start_hour}
                onChange={(event) => setStrategy((prev) => ({
                  ...prev,
                  timezone_window: { ...prev.timezone_window, start_hour: Number.parseInt(event.target.value, 10) || 0 },
                }))}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Window End</span>
              <input
                type="number"
                min={1}
                max={24}
                className="w-full rounded border bg-background px-2 py-1"
                value={strategy.timezone_window.end_hour}
                onChange={(event) => setStrategy((prev) => ({
                  ...prev,
                  timezone_window: { ...prev.timezone_window, end_hour: Number.parseInt(event.target.value, 10) || 0 },
                }))}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Daily Cap</span>
              <input
                type="number"
                min={1}
                className="w-full rounded border bg-background px-2 py-1"
                value={strategy.daily_cap}
                onChange={(event) => setStrategy((prev) => ({ ...prev, daily_cap: Number.parseInt(event.target.value, 10) || 1 }))}
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Domain Cap</span>
              <input
                type="number"
                min={1}
                className="w-full rounded border bg-background px-2 py-1"
                value={strategy.domain_cap}
                onChange={(event) => setStrategy((prev) => ({ ...prev, domain_cap: Number.parseInt(event.target.value, 10) || 1 }))}
              />
            </label>
            <label className="flex items-center gap-2 text-xs md:col-span-2">
              <input type="checkbox" checked={showHighOnly} onChange={(event) => setShowHighOnly(event.target.checked)} />
              Show high confidence only
            </label>
            <label className="flex items-center gap-2 text-xs md:col-span-2">
              <input type="checkbox" checked={hideStale} onChange={(event) => setHideStale(event.target.checked)} />
              Hide stale
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Variant Experiment Builder</p>
              <p className="text-xs text-muted-foreground">Create A/B/n subject and body variants before queueing.</p>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={experimentEnabled}
                onChange={(event) => setExperimentEnabled(event.target.checked)}
              />
              Enable experiment
            </label>
          </div>

          {experimentEnabled && (
            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Experiment Name</span>
                  <input
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                    value={experimentName}
                    onChange={(event) => setExperimentName(event.target.value)}
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Primary Metric</span>
                  <select
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                    value={primaryMetric}
                    onChange={(event) => setPrimaryMetric(event.target.value as ExperimentMetric)}
                  >
                    <option value="reply_rate">Reply Rate</option>
                    <option value="meeting_rate">Meeting Rate</option>
                    <option value="positive_reply_rate">Positive Reply Rate</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div key={variant.variantKey} className="grid gap-2 rounded-md border p-2 md:grid-cols-12">
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium">{variant.label}</p>
                      <label className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={variant.isControl}
                          onChange={(event) => updateVariant(index, { isControl: event.target.checked })}
                        />
                        Control
                      </label>
                    </div>
                    <label className="space-y-1 text-xs md:col-span-4">
                      <span className="text-muted-foreground">Subject</span>
                      <input
                        className="w-full rounded border bg-background px-2 py-1"
                        value={variant.subject}
                        onChange={(event) => updateVariant(index, { subject: event.target.value })}
                      />
                    </label>
                    <label className="space-y-1 text-xs md:col-span-3">
                      <span className="text-muted-foreground">Opening</span>
                      <input
                        className="w-full rounded border bg-background px-2 py-1"
                        value={variant.opening}
                        onChange={(event) => updateVariant(index, { opening: event.target.value })}
                      />
                    </label>
                    <label className="space-y-1 text-xs md:col-span-2">
                      <span className="text-muted-foreground">CTA</span>
                      <input
                        className="w-full rounded border bg-background px-2 py-1"
                        value={variant.cta}
                        onChange={(event) => updateVariant(index, { cta: event.target.value })}
                      />
                    </label>
                    <label className="space-y-1 text-xs md:col-span-1">
                      <span className="text-muted-foreground">Split %</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        className="w-full rounded border bg-background px-2 py-1"
                        value={variant.split}
                        onChange={(event) => {
                          const value = Number.parseInt(event.target.value, 10);
                          updateVariant(index, { split: Number.isFinite(value) ? value : 0 });
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 rounded-md border bg-muted/20 p-2 text-xs md:grid-cols-3">
                <p>
                  Split Total: <span className={splitTotal === 100 ? 'text-emerald-700' : 'text-red-700'}>{splitTotal}%</span>
                </p>
                <p>
                  Holdout/Control: <span className={hasControl ? 'text-emerald-700' : 'text-red-700'}>{hasControl ? 'Present' : 'Missing'}</span>
                </p>
                <p>Recipients in Experiment: {totalRecipients}</p>
              </div>

              <div className="rounded-md border p-2 text-xs">
                <p className="mb-1 font-medium">Deterministic Allocation Preview</p>
                <div className="grid gap-1 md:grid-cols-2">
                  {allocationPreview.map((row) => (
                    <p key={row.variantKey}>
                      {row.variantKey}: <span className="font-semibold">{row.expectedCount}</span> recipients
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {itemStates.map(({ item, rendering, guard, filteredRecipients, sendableRecipients, skippedByPolicyCount }) => (
            <div key={item.generatedContentId} className="rounded-lg border p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.accountName} • v{item.version}</p>
                  <p className="text-xs text-muted-foreground">
                    Provider: {item.providerUsed ?? 'unknown'} • Sendable recipients: {sendableRecipients.length}/{item.recipients.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Type: {item.infographicType ?? 'cold_hook'} • Stage: {item.stageIntent ?? 'cold'}
                    {item.bundleId ? ` • Bundle ${item.bundleId} #${item.sequencePosition ?? '-'}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Readiness floor: {getRecipientReadinessFloor(item.campaignType)} • Checklist {item.checklist?.requiredComplete ?? 0}/{item.checklist?.requiredTotal ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    High confidence: {filteredRecipients.filter((recipient) => recipient.readiness?.tier === 'high').length}
                    {' '}• Stale: {filteredRecipients.filter((recipient) => recipient.readiness?.stale).length}
                    {' '}• Auto-skipped by readiness: {skippedByPolicyCount}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {guard.requiresGuard && <Badge className="bg-amber-100 text-amber-900">Needs Review</Badge>}
                  {sendableRecipients.length === 0 && <Badge className="bg-red-100 text-red-900">No Sendable Recipients</Badge>}
                  {item.checklist && !item.checklist.complete && <Badge className="bg-amber-100 text-amber-900">Checklist Incomplete</Badge>}
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

              {sendableRecipients.length === 0 && (
                <p className="mb-2 text-xs text-red-600">No sendable recipients remain for this account after filters and readiness policy. It will be skipped.</p>
              )}
              <div className="mb-2 flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => toast('Use Contacts workspace to replace contact coverage.')}
                >
                  Replace Contact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => window.open(`/contacts?account=${encodeURIComponent(item.accountName)}`, '_blank')}
                >
                  Open Contacts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    setDeferredAccounts((prev) => ({ ...prev, [item.accountName]: true }));
                    toast(`${item.accountName} deferred from this send batch`);
                  }}
                >
                  Defer
                </Button>
              </div>
              {item.bundleId ? (
                <div className="mb-2 rounded-md border p-2 text-xs">
                  <p className="text-muted-foreground">Send sequence control</p>
                  <label className="mt-1 flex items-center gap-2">
                    <span>Sequence position</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      className="w-20 rounded border bg-background px-2 py-1"
                      value={sendSequenceOffsetByItem[item.generatedContentId] ?? item.sequencePosition ?? 1}
                      onChange={(event) => {
                        const value = Number.parseInt(event.target.value, 10);
                        setSendSequenceOffsetByItem((prev) => ({
                          ...prev,
                          [item.generatedContentId]: Number.isFinite(value) ? value : (item.sequencePosition ?? 1),
                        }));
                      }}
                    />
                  </label>
                </div>
              ) : null}
              <ContentQaChecklistPanel
                generatedContentId={item.generatedContentId}
                campaignType={item.campaignType}
                accountName={item.accountName}
                content={item.content}
                initialCompleted={item.checklistCompletedItemIds}
                onSaved={() => undefined}
              />

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
            disabled={queueDisabled || checklistBlockingItems.length > 0}
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
