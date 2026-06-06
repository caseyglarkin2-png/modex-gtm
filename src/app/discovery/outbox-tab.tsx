'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Plus, RotateCcw, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DraftQueueItem } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  approveBatch,
  createSequence,
  deleteSequence,
  enrollInSequence,
  listQueue,
  listSequences,
  removeDraft,
  renderDraftPreview,
  retryDraft,
  runDueNow,
  sendNow,
  unenrollFromSequence,
  updateDraft,
} from './queue-actions';

type SequenceSummary = { id: number; name: string; steps: unknown };

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  draft: { label: 'draft', className: 'text-neutral-500 border-neutral-500/30' },
  approved: { label: 'approved', className: 'text-blue-600 border-blue-600/40' },
  sending: { label: 'sending', className: 'text-blue-600 border-blue-600/40' },
  sent: { label: 'sent', className: 'text-emerald-600 border-emerald-600/30' },
  failed: { label: 'failed', className: 'text-red-600 border-red-600/40' },
  skipped: { label: 'skipped', className: 'text-amber-600 border-amber-600/40' },
};

type StatusFilter = 'all' | 'draft' | 'approved' | 'failed' | 'sent';
const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'failed', label: 'Failed' },
  { value: 'sent', label: 'Sent' },
];

interface OutboxRowProps {
  item: DraftQueueItem;
  onRefresh: () => void;
  selected: boolean;
  onToggleSelect: (id: number) => void;
}

function OutboxRow({ item, onRefresh, selected, onToggleSelect }: OutboxRowProps) {
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.body);
  // Body pane mode: 'closed' keeps the row compact; 'edit' shows the textarea;
  // 'preview' shows a faithful render of the real branded email in an iframe.
  const [mode, setMode] = useState<'closed' | 'edit' | 'preview'>('closed');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const locked = item.status === 'sent';
  const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.draft;
  // A failed row that already reached Gmail must not be re-sent — it needs a manual reconcile.
  const needsReview = item.status === 'failed' && item.provider_message_id != null;
  const retryable = item.status === 'failed' && item.provider_message_id == null;

  async function saveSubject() {
    if (subject === item.subject) return;
    // Subject edits change the rendered email, so drop any cached preview.
    setPreviewHtml(null);
    const r = await updateDraft(item.id, { subject });
    if (!r.ok) {
      toast.error('Could not save subject');
      setSubject(item.subject);
    }
  }

  async function saveBody() {
    if (body === item.body) return;
    // Body edits change the rendered email, so drop any cached preview.
    setPreviewHtml(null);
    const r = await updateDraft(item.id, { body });
    if (!r.ok) {
      toast.error('Could not save body');
      setBody(item.body);
    }
  }

  // Fetch (or re-fetch) the real branded-email render for the Preview pane.
  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const r = await renderDraftPreview(item.id);
      if (r.ok) setPreviewHtml(r.html);
      else toast.error('Could not render preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [item.id]);

  function showEdit() {
    setMode((m) => (m === 'edit' ? 'closed' : 'edit'));
  }

  function showPreview() {
    if (mode === 'preview') {
      setMode('closed');
      return;
    }
    setMode('preview');
    if (!previewHtml) void loadPreview();
  }

  async function handleSend() {
    setSending(true);
    try {
      const res = await sendNow(item.id);
      if ('status' in res && res.status === 'sent') {
        toast.success('Sent');
        onRefresh();
      } else if ('status' in res && res.status === 'skipped') {
        toast.message(`Skipped: ${res.skippedReason}`);
        onRefresh();
      } else if ('status' in res && res.status === 'failed') {
        toast.error(`Failed: ${res.errorMessage}`);
        onRefresh();
      } else if ('reason' in res) {
        toast.error(`Could not send: ${res.reason}`);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const r = await removeDraft(item.id);
      if (r.ok) onRefresh();
      else toast.error(`Could not remove: ${r.reason}`);
    } finally {
      setRemoving(false);
    }
  }

  async function handleRetry() {
    setRetrying(true);
    try {
      const r = await retryDraft(item.id);
      if (r.ok) {
        toast.success('Re-queued for sending');
        onRefresh();
      } else {
        toast.error(`Could not retry: ${r.reason}`);
      }
    } finally {
      setRetrying(false);
    }
  }

  async function handleUnenroll() {
    setUnenrolling(true);
    try {
      const r = await unenrollFromSequence([item.id]);
      if (r.ok) {
        toast.success('Unenrolled');
        onRefresh();
      } else {
        toast.error(`Could not unenroll: ${r.reason}`);
      }
    } finally {
      setUnenrolling(false);
    }
  }

  const canUnenroll =
    item.sequence_id != null && (item.status === 'draft' || item.status === 'approved');

  return (
    <li className="space-y-2 rounded-md border border-[var(--border)] p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {!locked && (
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={selected}
              onChange={() => onToggleSelect(item.id)}
              aria-label={`Select ${item.to_email}`}
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-medium">{item.to_email}</span>
              {needsReview ? (
                <Badge
                  variant="outline"
                  className="text-[9px] text-amber-600 border-amber-600/40"
                  title="Send failed after the message reached Gmail. Reconcile by hand; do not re-send."
                >
                  sent · needs review
                </Badge>
              ) : (
                <Badge variant="outline" className={`text-[9px] ${style.className}`}>
                  {style.label}
                </Badge>
              )}
              {item.sequence_id != null && (
                <Badge
                  variant="outline"
                  className="text-[9px] text-purple-600 border-purple-600/40"
                  title="Enrolled in a sequence"
                >
                  {`seq · step ${(item.step_index ?? 0) + 1}`}
                </Badge>
              )}
              {item.variant_key && (
                <Badge
                  variant="outline"
                  className="text-[9px] text-indigo-600 border-indigo-600/40"
                  title="A/B variant"
                >
                  {item.variant_key}
                </Badge>
              )}
            </div>
            <div className="truncate text-xs text-[var(--muted-foreground)]">
              {item.account_name}
              {item.persona_name ? ` · ${item.persona_name}` : ''}
            </div>
            {item.status === 'approved' && item.scheduled_for && (
              <div className="text-[11px] text-[var(--muted-foreground)]">
                Scheduled {new Date(item.scheduled_for).toLocaleString()}
              </div>
            )}
            {item.status === 'sent' && item.sent_at && (
              <div className="text-[11px] text-[var(--muted-foreground)]">
                Sent {new Date(item.sent_at).toLocaleString()}
              </div>
            )}
            {item.status === 'failed' && item.error_message && (
              <div className="text-[11px] text-red-600">{item.error_message}</div>
            )}
            {item.status === 'skipped' && item.skipped_reason && (
              <div className="text-[11px] text-amber-600">{item.skipped_reason}</div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canUnenroll && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={handleUnenroll}
              disabled={unenrolling || sending || removing || retrying}
            >
              {unenrolling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Unenroll
            </Button>
          )}
          {retryable && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={handleRetry}
              disabled={retrying || sending || removing}
            >
              {retrying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Retry
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleSend}
            disabled={locked || needsReview || sending || removing || retrying}
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send now
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleRemove}
            disabled={locked || sending || removing || retrying}
          >
            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Remove
          </Button>
        </div>
      </div>

      <Input
        className="h-7 text-xs"
        value={subject}
        disabled={locked}
        onChange={(e) => setSubject(e.target.value)}
        onBlur={saveSubject}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        aria-label="Subject"
      />

      <div className="inline-flex overflow-hidden rounded-md border border-[var(--border)] text-[11px] font-medium">
        <button
          type="button"
          onClick={showEdit}
          aria-pressed={mode === 'edit'}
          className={`px-2 py-1 ${
            mode === 'edit'
              ? 'bg-[var(--muted)] text-[var(--foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={showPreview}
          aria-pressed={mode === 'preview'}
          className={`border-l border-[var(--border)] px-2 py-1 ${
            mode === 'preview'
              ? 'bg-[var(--muted)] text-[var(--foreground)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Preview
        </button>
      </div>

      {mode === 'edit' && (
        <textarea
          className="w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-xs"
          rows={8}
          value={body}
          disabled={locked}
          onChange={(e) => setBody(e.target.value)}
          onBlur={saveBody}
          aria-label="Body"
        />
      )}

      {mode === 'preview' &&
        (previewLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-[var(--muted-foreground)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Rendering preview...
          </div>
        ) : previewHtml ? (
          <iframe
            srcDoc={previewHtml}
            sandbox=""
            title="Email preview"
            className="w-full rounded-md border border-[var(--border)] bg-white"
            style={{ height: 420 }}
          />
        ) : (
          <p className="py-4 text-xs text-[var(--muted-foreground)]">Preview unavailable.</p>
        ))}

      {item.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt="Proof preview"
          className="max-h-32 rounded-md border border-[var(--border)]"
        />
      )}
    </li>
  );
}

interface OutboxTabProps {
  onCountChange?: (n: number) => void;
}

export function OutboxTab({ onCountChange }: OutboxTabProps) {
  const [items, setItems] = useState<DraftQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Batch-action UI state
  const [sendingBatch, setSendingBatch] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelRef = useRef(false);
  const [retryingBatch, setRetryingBatch] = useState(false);
  const [runningDue, setRunningDue] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [staggerMinutes, setStaggerMinutes] = useState(2);
  const [scheduling, setScheduling] = useState(false);
  const [abEnabled, setAbEnabled] = useState(false);
  const [abSubjectA, setAbSubjectA] = useState('');
  const [abSubjectB, setAbSubjectB] = useState('');

  // Sequences UI state
  const [sequences, setSequences] = useState<SequenceSummary[]>([]);
  const [showSequences, setShowSequences] = useState(false);
  const [seqName, setSeqName] = useState('');
  const [seqFollowups, setSeqFollowups] = useState<
    { delayDays: number; subjectTemplate: string; bodyTemplate: string }[]
  >([{ delayDays: 3, subjectTemplate: '', bodyTemplate: '' }]);
  const [creatingSeq, setCreatingSeq] = useState(false);
  const [enrollSeqId, setEnrollSeqId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const refreshSequences = useCallback(() => {
    listSequences().then(setSequences);
  }, []);

  useEffect(() => {
    refreshSequences();
  }, [refreshSequences]);

  async function handleCreateSequence() {
    if (!seqName.trim()) {
      toast.error('Name the sequence first');
      return;
    }
    setCreatingSeq(true);
    try {
      const steps = [
        { stepIndex: 0, delayDays: 0 },
        ...seqFollowups.map((s, i) => ({
          stepIndex: i + 1,
          delayDays: s.delayDays,
          ...(s.subjectTemplate.trim() ? { subjectTemplate: s.subjectTemplate.trim() } : {}),
          ...(s.bodyTemplate.trim() ? { bodyTemplate: s.bodyTemplate.trim() } : {}),
        })),
      ];
      const res = await createSequence(seqName.trim(), steps);
      if (res.ok) {
        toast.success('Sequence created');
        setSeqName('');
        setSeqFollowups([{ delayDays: 3, subjectTemplate: '', bodyTemplate: '' }]);
        refreshSequences();
      } else {
        toast.error(`Could not create: ${res.reason}`);
      }
    } finally {
      setCreatingSeq(false);
    }
  }

  async function handleDeleteSequence(id: number) {
    const res = await deleteSequence(id);
    if (res.ok) {
      toast.success('Sequence deleted');
      refreshSequences();
    } else {
      toast.error(`Could not delete: ${res.reason}`);
    }
  }

  async function handleEnroll() {
    const sequenceId = Number(enrollSeqId);
    if (!sequenceId) {
      toast.error('Pick a sequence first');
      return;
    }
    setEnrolling(true);
    try {
      const res = await enrollInSequence([...selectedIds], sequenceId);
      if (res.ok) {
        toast.success(`${res.enrolled} enrolled`);
        clearSelection();
        refresh();
      } else {
        toast.error(`Could not enroll: ${res.reason}`);
      }
    } finally {
      setEnrolling(false);
    }
  }

  const refresh = useCallback(() => {
    setLoading(true);
    listQueue()
      .then((rows) => {
        setItems(rows);
        onCountChange?.(
          rows.filter(
            (i) => i.status === 'draft' || i.status === 'approved' || i.status === 'failed',
          ).length,
        );
        // Drop selections that no longer exist.
        setSelectedIds((prev) => {
          const live = new Set(rows.map((r) => r.id));
          const next = new Set([...prev].filter((id) => live.has(id)));
          return next.size === prev.size ? prev : next;
        });
      })
      .finally(() => setLoading(false));
  }, [onCountChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  );

  // Selectable = visible rows that are not already sent.
  const selectableVisible = useMemo(() => visible.filter((i) => i.status !== 'sent'), [visible]);
  const selected = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );
  const selectedRetryable = useMemo(
    () => selected.filter((i) => i.status === 'failed' && i.provider_message_id == null),
    [selected],
  );

  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((i) => selectedIds.has(i.id));

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const i of selectableVisible) next.delete(i.id);
      } else {
        for (const i of selectableVisible) next.add(i.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleSendAll() {
    setSendingBatch(true);
    cancelRef.current = false;
    const total = selected.length;
    setSendProgress({ done: 0, total });
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    let cancelled = false;
    try {
      for (let i = 0; i < selected.length; i++) {
        if (cancelRef.current) {
          cancelled = true;
          break;
        }
        const res = await sendNow(selected[i].id);
        if ('status' in res && res.status === 'sent') sent++;
        else if ('status' in res && res.status === 'skipped') skipped++;
        else failed++;
        setSendProgress({ done: i + 1, total });
      }
      const parts = [`${sent} sent`];
      if (skipped) parts.push(`${skipped} skipped`);
      if (failed) parts.push(`${failed} failed`);
      toast.message(`${parts.join(', ')}${cancelled ? ' (cancelled)' : ''}`);
      clearSelection();
      refresh();
    } finally {
      setSendingBatch(false);
      setSendProgress(null);
      cancelRef.current = false;
    }
  }

  async function handleApproveSchedule() {
    if (!scheduledFor) {
      toast.error('Pick a date and time first');
      return;
    }
    const aSubject = abSubjectA.trim();
    const bSubject = abSubjectB.trim();
    const useExperiment = abEnabled && aSubject !== '' && bSubject !== '';
    if (abEnabled && !useExperiment) {
      toast.error('Fill in both Variant A and Variant B subjects, or uncheck A/B');
      return;
    }
    setScheduling(true);
    try {
      const experiment = useExperiment
        ? {
            name: `Subject A/B ${new Date().toISOString().slice(0, 10)}`,
            variants: [
              { variantKey: 'A', subject: aSubject, split: 50, isControl: true },
              { variantKey: 'B', subject: bSubject, split: 50 },
            ],
          }
        : undefined;
      const res = await approveBatch([...selectedIds], {
        scheduledFor: new Date(scheduledFor),
        staggerMinutes,
        ...(experiment ? { experiment } : {}),
      });
      if (res.ok) {
        toast.success(
          useExperiment
            ? `${res.approved} approved & scheduled · A/B: 50/50 on subject`
            : `${res.approved} approved & scheduled`,
        );
        setShowSchedule(false);
        setAbEnabled(false);
        setAbSubjectA('');
        setAbSubjectB('');
        clearSelection();
        refresh();
      } else {
        toast.error(`Could not schedule: ${res.reason}`);
      }
    } finally {
      setScheduling(false);
    }
  }

  async function handleRetryFailed() {
    setRetryingBatch(true);
    let ok = 0;
    let bad = 0;
    try {
      for (const item of selectedRetryable) {
        const r = await retryDraft(item.id);
        if (r.ok) ok++;
        else bad++;
      }
      const parts = [`${ok} re-queued`];
      if (bad) parts.push(`${bad} skipped`);
      toast.message(parts.join(', '));
      clearSelection();
      refresh();
    } finally {
      setRetryingBatch(false);
    }
  }

  async function handleRunDue() {
    setRunningDue(true);
    try {
      const res = await runDueNow();
      if (res.ok) {
        toast.message(`${res.sent} sent, ${res.failed} failed, ${res.skipped} skipped`);
        refresh();
      } else {
        toast.error(`Run due: ${res.reason}`);
      }
    } finally {
      setRunningDue(false);
    }
  }

  const batchBusy = sendingBatch || retryingBatch || scheduling;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Outbox — staged drafts</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {items.length.toLocaleString()} {items.length === 1 ? 'draft' : 'drafts'} queued
            {items.length === 200 ? ' (showing latest 200)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleRunDue}
            disabled={runningDue}
          >
            {runningDue ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Run due now
          </Button>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-1">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            className="h-7 px-2 text-xs"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Sequences panel */}
      <div className="rounded-md border border-[var(--border)] text-xs">
        <button
          type="button"
          onClick={() => setShowSequences((v) => !v)}
          className="flex w-full items-center gap-1 p-2 font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {showSequences ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Sequences ({sequences.length})
        </button>
        {showSequences && (
          <div className="space-y-3 border-t border-[var(--border)] p-2">
            <div className="space-y-2">
              <span className="font-medium">New sequence</span>
              <Input
                className="h-7 text-xs"
                placeholder="Sequence name"
                value={seqName}
                onChange={(e) => setSeqName(e.target.value)}
                aria-label="Sequence name"
              />
              <div className="space-y-1">
                <span className="text-[var(--muted-foreground)]">
                  Follow-ups (days after prior step)
                </span>
                {seqFollowups.map((step, i) => (
                  <div key={i} className="space-y-1 rounded-md border border-[var(--border)] p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted-foreground)]">Step {i + 1}</span>
                      <Input
                        type="number"
                        min={0}
                        className="h-7 w-20 text-xs"
                        value={step.delayDays}
                        onChange={(e) =>
                          setSeqFollowups((prev) =>
                            prev.map((s, j) =>
                              j === i ? { ...s, delayDays: Number(e.target.value) } : s,
                            ),
                          )
                        }
                        aria-label={`Follow-up step ${i + 1} delay days`}
                      />
                      <span className="text-[var(--muted-foreground)]">days</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-7 px-2 text-xs"
                        onClick={() => setSeqFollowups((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Remove follow-up step ${i + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      className="h-7 text-xs"
                      placeholder="optional subject override"
                      value={step.subjectTemplate}
                      onChange={(e) =>
                        setSeqFollowups((prev) =>
                          prev.map((s, j) =>
                            j === i ? { ...s, subjectTemplate: e.target.value } : s,
                          ),
                        )
                      }
                      aria-label={`Follow-up step ${i + 1} subject override`}
                    />
                    <textarea
                      className="w-full rounded-md border border-[var(--border)] bg-transparent p-2 text-xs"
                      rows={2}
                      placeholder="optional body override"
                      value={step.bodyTemplate}
                      onChange={(e) =>
                        setSeqFollowups((prev) =>
                          prev.map((s, j) => (j === i ? { ...s, bodyTemplate: e.target.value } : s)),
                        )
                      }
                      aria-label={`Follow-up step ${i + 1} body override`}
                    />
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() =>
                    setSeqFollowups((prev) => [
                      ...prev,
                      { delayDays: 3, subjectTemplate: '', bodyTemplate: '' },
                    ])
                  }
                >
                  <Plus className="h-3 w-3" />
                  Add step
                </Button>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-7 gap-1 text-xs"
                onClick={handleCreateSequence}
                disabled={creatingSeq}
              >
                {creatingSeq ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Create
              </Button>
            </div>
            {sequences.length > 0 && (
              <ul className="space-y-1 border-t border-[var(--border)] pt-2 text-[var(--muted-foreground)]">
                {sequences.map((s) => (
                  <li key={s.id} className="flex items-center gap-1">
                    <span className="min-w-0 truncate">
                      {s.name}{' '}
                      <span className="text-[10px]">
                        ({Array.isArray(s.steps) ? s.steps.length : 0} steps)
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6 px-1 text-xs"
                      onClick={() => handleDeleteSequence(s.id)}
                      aria-label={`Delete sequence ${s.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Select-all (visible) */}
      {selectableVisible.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleSelectAllVisible}
            aria-label="Select all visible"
          />
          Select all visible ({selectableVisible.length})
        </label>
      )}

      {/* Batch actions bar */}
      {selectedIds.size > 0 && (
        <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--muted)]/30 p-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{selectedIds.size} selected</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={handleSendAll}
              disabled={batchBusy}
            >
              {sendingBatch ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              {sendingBatch
                ? `Sending ${sendProgress?.done ?? 0}/${sendProgress?.total ?? 0}`
                : 'Send all now'}
            </Button>
            {sendingBatch && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  cancelRef.current = true;
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={() => setShowSchedule((v) => !v)}
              disabled={batchBusy}
            >
              Approve &amp; schedule
            </Button>
            {selectedRetryable.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={handleRetryFailed}
                disabled={batchBusy}
              >
                {retryingBatch ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Retry failed ({selectedRetryable.length})
              </Button>
            )}
            {sequences.length > 0 && (
              <span className="flex items-center gap-1">
                <select
                  className="h-7 rounded-md border border-[var(--border)] bg-transparent px-1 text-xs"
                  value={enrollSeqId}
                  onChange={(e) => setEnrollSeqId(e.target.value)}
                  aria-label="Sequence to enroll in"
                >
                  <option value="">Sequence…</option>
                  {sequences.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={handleEnroll}
                  disabled={batchBusy || enrolling || !enrollSeqId}
                >
                  {enrolling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Enroll in sequence
                </Button>
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={clearSelection}
              disabled={batchBusy}
            >
              Clear
            </Button>
          </div>

          {showSchedule && (
            <div className="space-y-2 border-t border-[var(--border)] pt-2">
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--muted-foreground)]">Schedule for</span>
                  <Input
                    type="datetime-local"
                    className="h-7 w-auto text-xs"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    aria-label="Scheduled for"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[var(--muted-foreground)]">Stagger (min)</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-7 w-20 text-xs"
                    value={staggerMinutes}
                    onChange={(e) => setStaggerMinutes(Number(e.target.value))}
                    aria-label="Stagger minutes"
                  />
                </label>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 gap-1 text-xs"
                  onClick={handleApproveSchedule}
                  disabled={scheduling}
                >
                  {scheduling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Confirm schedule
                </Button>
              </div>

              <label className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  checked={abEnabled}
                  onChange={(e) => setAbEnabled(e.target.checked)}
                  aria-label="A/B test subject lines"
                />
                A/B test subject lines
              </label>

              {abEnabled && (
                <div className="space-y-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[var(--muted-foreground)]">Variant A subject</span>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Variant A subject"
                      value={abSubjectA}
                      onChange={(e) => setAbSubjectA(e.target.value)}
                      aria-label="Variant A subject"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[var(--muted-foreground)]">Variant B subject</span>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Variant B subject"
                      value={abSubjectB}
                      onChange={(e) => setAbSubjectB(e.target.value)}
                      aria-label="Variant B subject"
                    />
                  </label>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Variants are split 50/50 deterministically; reply/open reporting is in HubSpot
                    (each variant has its own subject).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {visible.length > 0 ? (
        <ul className="space-y-2">
          {visible.map((item) => (
            <OutboxRow
              key={item.id}
              item={item}
              onRefresh={refresh}
              selected={selectedIds.has(item.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </ul>
      ) : !loading ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          {items.length === 0
            ? 'No drafts queued yet. Add contacts from the worklist.'
            : 'No drafts match this filter.'}
        </p>
      ) : null}
    </div>
  );
}
