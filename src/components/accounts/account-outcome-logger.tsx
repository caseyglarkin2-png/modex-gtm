'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OPERATOR_OUTCOME_TAXONOMY, type OutcomeFollowUpRecommendation } from '@/lib/revops/operator-outcomes';
import { beginRefreshDiagnostic, endRefreshDiagnostic } from '@/lib/refresh-diagnostics';
import { useActor } from '@/lib/use-actor';
import { useControllableOpen } from '@/lib/use-controllable-open';

export type AccountOutcomeSourceOption = {
  key: string;
  label: string;
  detail: string;
  sourceKind: string;
  sourceId: string;
  campaignId?: number | null;
  generatedContentId?: number | null;
  sourceMetadata?: Record<string, unknown> | null;
};

type AccountOutcomeLoggerProps = {
  accountName: string;
  createdBy?: string;
  sources: AccountOutcomeSourceOption[];
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};



type OutcomeResponse = {
  success: boolean;
  deduped: boolean;
  outcomeId?: string;
  nextAction?: OutcomeFollowUpRecommendation['nextAction'];
  nextAsset?: OutcomeFollowUpRecommendation['nextAsset'];
  summary?: string;
  error?: string;
};

export function AccountOutcomeLogger({
  accountName,
  createdBy,
  sources,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AccountOutcomeLoggerProps) {
  const actor = useActor();
  const effectiveCreatedBy = createdBy ?? actor;
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { open, setOpen, isControlled } = useControllableOpen(controlledOpen, controlledOnOpenChange);
  const [loading, setLoading] = useState(false);
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>(sources[0]?.key ?? '');
  const [outcomeLabel, setOutcomeLabel] = useState<(typeof OPERATOR_OUTCOME_TAXONOMY)[number]>('positive');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!sources.some((source) => source.key === selectedSourceKey)) {
      setSelectedSourceKey(sources[0]?.key ?? '');
    }
  }, [selectedSourceKey, sources]);

  const selectedSource = useMemo(
    () => sources.find((source) => source.key === selectedSourceKey) ?? sources[0] ?? null,
    [selectedSourceKey, sources],
  );

  function scheduleRefresh(trigger: string) {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      const session = beginRefreshDiagnostic({
        surface: 'account-outcome-logger',
        trigger,
        metadata: { accountName },
      });
      router.refresh();
      endRefreshDiagnostic(session, {
        status: 'success',
        metadata: { accountName },
      });
      refreshTimerRef.current = null;
    }, 350);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSource) {
      toast.error('No engagement source is available for outcome logging');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/operator-outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          outcomeLabel,
          sourceKind: selectedSource.sourceKind,
          sourceId: selectedSource.sourceId,
          campaignId: selectedSource.campaignId ?? null,
          generatedContentId: selectedSource.generatedContentId ?? null,
          sourceMetadata: selectedSource.sourceMetadata ?? null,
          notes: notes.trim() || null,
          createdBy: effectiveCreatedBy,
        }),
      });
      const payload = await response.json().catch(() => ({} as OutcomeResponse));
      if (!response.ok) throw new Error(payload.error ?? 'Outcome logging failed');

      const successMessage = payload.deduped
        ? `Outcome already logged for ${selectedSource.label}`
        : payload.nextAction?.label
          ? `Outcome logged. Next: ${payload.nextAction.label}`
          : `Outcome logged for ${selectedSource.label}`;
      toast.success(successMessage);
      setOpen(false);
      setNotes('');
      setOutcomeLabel('positive');
      scheduleRefresh('outcome-logged');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Outcome logging failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isControlled ? null : (
        <DialogTrigger asChild>
          {trigger ?? <Button size="sm">Log Outcome</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log Outcome for {accountName}</DialogTitle>
          <DialogDescription>
            Record what happened on the latest reply or send so the account page can recalculate the next move.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Engagement source</Label>
            <div className="grid gap-2">
              {sources.length > 0 ? sources.map((source) => {
                const active = source.key === selectedSourceKey;
                return (
                  <button
                    key={source.key}
                    type="button"
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active ? 'border-[var(--primary)] bg-[var(--accent)]/30' : 'border-[var(--border)]'
                    }`}
                    onClick={() => setSelectedSourceKey(source.key)}
                  >
                    <p className="font-medium">{source.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{source.detail}</p>
                  </button>
                );
              }) : (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-3 text-sm text-[var(--muted-foreground)]">
                  No reply or send outcome sources are available yet for this account.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Outcome</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {OPERATOR_OUTCOME_TAXONOMY.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                    outcomeLabel === label ? 'border-[var(--primary)] bg-[var(--accent)]/30' : 'border-[var(--border)]'
                  }`}
                  onClick={() => setOutcomeLabel(label)}
                >
                  {label.replaceAll('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome-notes">Notes</Label>
            <Textarea
              id="outcome-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Capture what happened so the next recommendation has context."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedSource}>
              {loading ? 'Saving...' : 'Save Outcome'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
