'use client';

/**
 * Hypothesis drawer (GAP Prospecting OS, Sprint 1, S1-T13).
 *
 * One hypothesis, opened from the list. Renders the FACT and HYPOTHESIS
 * blocks, the linked signals, the event history, and the action buttons the
 * machine's LEGAL_TRANSITIONS table allows from the current status. The
 * buttons PATCH /api/gap/hypotheses/{id} with `{action, reason?, outcome?}`
 * and surface the route's `error` string verbatim (the machine's refusal
 * reason, e.g. `no_evidence`), never a generic message.
 *
 * Two client-side gates mirror the machine so an operator sees the refusal
 * before the round trip: Approve and Activate are disabled until the
 * observation carries a citation AND at least one linked signal has
 * evidence; the reason-taking actions (withdraw, reject_review,
 * close_unresolved) are disabled until a reason is typed. The server still
 * decides; these gates only stop the obvious 409s.
 *
 * Facts are registered and linked from the Signals section through
 * <AddFactForm> (S2-T10): POST /api/gap/signals, then POST
 * /api/gap/hypotheses/{id}/signals. After a link the drawer asks its owner
 * to refetch through `onChanged`; an owner that only wired `onTransition`
 * gets a same-status result with the `signals_linked` effect, which the
 * list page already answers with a refetch.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LEGAL_TRANSITIONS, isTerminalStatus, type HypothesisAction, type HypothesisStatus, type ResolutionOutcome } from '@/lib/gap/hypothesis/machine';
import { extractCitationIds } from '@/lib/gap/hypothesis/observation';
import { AddFactForm } from './add-fact-form';
import { FactBlock, HypothesisBlock, type FactSignal } from './fact-hypothesis-blocks';

// ---------------------------------------------------------------------------
// Row shapes (what getHypothesis / listHypotheses return, snake_case columns)
// ---------------------------------------------------------------------------

export interface SignalRow extends FactSignal {
  source_type?: string | null;
  observed_at?: string | Date | null;
  confidence?: number | null;
  external_ok?: boolean | null;
}

export interface HypothesisSignalLink {
  hypothesis_id?: string;
  signal_id: string;
  role?: string | null;
  signal?: SignalRow | null;
}

export interface HypothesisEventRow {
  id: string;
  action: string;
  actor: string;
  from_status: string | null;
  to_status: string | null;
  reason?: string | null;
  created_at: string | Date;
}

export interface HypothesisRow {
  id: string;
  account_name: string;
  problem_family: string;
  persona: string;
  status: HypothesisStatus;
  confidence: number;
  observation: string;
  problem_hypothesis: string;
  root_cause_hypotheses?: unknown;
  impact_hypotheses?: unknown;
  why_now?: string | null;
  falsification_questions?: unknown;
  what_a_no_means?: string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  signals?: HypothesisSignalLink[];
  events?: HypothesisEventRow[];
}

export interface TransitionResponse {
  from: HypothesisStatus;
  to: HypothesisStatus;
  effects: string[];
}

export interface HypothesisDrawerProps {
  hypothesis: HypothesisRow;
  onClose: () => void;
  onTransition: (result: TransitionResponse) => void;
  /** The row changed without a status move (a fact was linked). Falls back to `onTransition` with a same-status result. */
  onChanged?: () => void;
  /** Fast review mode (S5): Previous/Next through the current filtered list without closing the drawer. */
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

// ---------------------------------------------------------------------------
// Presentation helpers (exported for the list page)
// ---------------------------------------------------------------------------

const STATUS_VARIANT: Record<HypothesisStatus, NonNullable<BadgeProps['variant']>> = {
  draft: 'secondary',
  review_required: 'warning',
  approved: 'info',
  active: 'success',
  confirmed: 'success',
  partially_confirmed: 'success',
  rejected: 'destructive',
  unresolved: 'outline',
  expired: 'outline',
};

export function HypothesisStatusBadge({ status }: { status: HypothesisStatus | string }) {
  const variant = STATUS_VARIANT[status as HypothesisStatus] ?? 'outline';
  return <Badge variant={variant}>{String(status).replace(/_/g, ' ')}</Badge>;
}

// Re-exported for client callers; the implementations are plain (server-safe) in lib/gap/ui/format.ts.
import { asStringList, formatWhen } from '@/lib/gap/ui/format';
export { asStringList, formatWhen };

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

const ACTION_ORDER: readonly HypothesisAction[] = [
  'submit',
  'approve',
  'activate',
  'resolve',
  'close_unresolved',
  'expire',
  'reject_review',
  'withdraw',
];

/**
 * Seller-facing button copy. The backend action name (and the whole state
 * machine) is unchanged -- this is presentation only, so a Casey who never
 * hears "submit" or "activate" still knows exactly what pressing the button
 * does. Keep the underlying HypothesisAction visible via ACTION_ORDER /
 * legalActionsFor(), never rename the action itself.
 */
const ACTION_LABEL: Record<HypothesisAction, string> = {
  submit: 'Ready for review',
  approve: 'Approve hypothesis',
  activate: 'Use in routing',
  resolve: 'Resolve',
  close_unresolved: 'Close, unresolved',
  expire: 'Expire',
  reject_review: 'Needs work',
  withdraw: 'Reject hypothesis',
};

const REASON_ACTIONS: ReadonlySet<HypothesisAction> = new Set(['withdraw', 'reject_review', 'close_unresolved']);
const EVIDENCE_ACTIONS: ReadonlySet<HypothesisAction> = new Set(['approve', 'activate']);
const DESTRUCTIVE_ACTIONS: ReadonlySet<HypothesisAction> = new Set(['withdraw', 'reject_review', 'close_unresolved', 'expire']);
const OUTCOMES: readonly ResolutionOutcome[] = ['confirmed', 'partially_confirmed', 'rejected'];

export const NEEDS_CITED_FACT = 'Needs at least one cited fact';

/** The primary ("what do I do with this") action for each status, when one exists. */
const PRIMARY_ACTION: Partial<Record<HypothesisStatus, HypothesisAction>> = {
  draft: 'submit',
  review_required: 'approve',
  approved: 'activate',
};

/** Server refusal reasons (machine error codes), translated to plain English. Unknown codes fall back to the raw string, never hidden. */
const REFUSAL_TEXT: Record<string, string> = {
  no_evidence: NEEDS_CITED_FACT,
  GAP_HYPOTHESIS_FROZEN: 'This hypothesis is frozen and can no longer be edited.',
  invalid_transition: 'That action is not available from the current status.',
  reason_required: 'A reason is required for this action.',
};

export function describeRefusal(code: string): string {
  return REFUSAL_TEXT[code] ?? code;
}

/** The actions the machine table allows from `status`, in display order. */
export function legalActionsFor(status: HypothesisStatus): HypothesisAction[] {
  const legal = new Set(LEGAL_TRANSITIONS.filter((row) => row.from === status).map((row) => row.action));
  return ACTION_ORDER.filter((action) => legal.has(action));
}

function nonBlank(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True when the observation cites something AND a linked signal carries evidence. */
export function hasCitedFact(hypothesis: Pick<HypothesisRow, 'observation' | 'signals'>): boolean {
  const cited = extractCitationIds(hypothesis.observation ?? '').length > 0;
  const evidenced = (hypothesis.signals ?? []).some(
    (link) => nonBlank(link.signal?.evidence_url) || nonBlank(link.signal?.evidence_text),
  );
  return cited && evidenced;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HypothesisDrawer({ hypothesis, onClose, onTransition, onChanged, onPrevious, onNext, hasPrevious, hasNext }: HypothesisDrawerProps) {
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState<ResolutionOutcome>('confirmed');
  const [busy, setBusy] = useState<HypothesisAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);

  // A fresh hypothesis in the drawer (Previous/Next, or opening a new row)
  // never inherits the previous one's "just activated" banner.
  useEffect(() => {
    setJustActivated(false);
  }, [hypothesis.id]);

  const status = hypothesis.status;
  const terminal = isTerminalStatus(status);
  const actions = terminal ? [] : legalActionsFor(status);
  const evidenced = hasCitedFact(hypothesis);
  const needsReasonInput = actions.some((action) => REASON_ACTIONS.has(action));
  const needsOutcome = actions.includes('resolve');
  const links = hypothesis.signals ?? [];
  const factSignals: FactSignal[] = links.flatMap((link) => (link.signal ? [link.signal] : []));
  const events = hypothesis.events ?? [];
  const primaryAction = PRIMARY_ACTION[status];
  const secondaryActions = actions.filter((action) => action !== primaryAction);
  // When a primary action exists, the sticky decision area above already
  // renders it plus every non-reason secondary action; this lower section
  // then carries only the reason-requiring actions (which need the Reason
  // input right here) so no button renders twice with the same name.
  const lowerActions = primaryAction ? actions.filter((action) => REASON_ACTIONS.has(action)) : actions;
  const showFastReview = Boolean(onPrevious || onNext);

  async function run(action: HypothesisAction) {
    setBusy(action);
    setError(null);
    const body: Record<string, unknown> = { action };
    if (REASON_ACTIONS.has(action)) body.reason = reason.trim();
    if (action === 'resolve') body.outcome = outcome;
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesis.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      const payload = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
      if (!res.ok) {
        setError(typeof payload.error === 'string' ? describeRefusal(payload.error) : `HTTP ${res.status}`);
        return;
      }
      setReason('');
      setJustActivated(payload.to === 'active');
      onTransition({
        from: payload.from as HypothesisStatus,
        to: payload.to as HypothesisStatus,
        effects: asStringList(payload.effects),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'network_error');
    } finally {
      setBusy(null);
    }
  }

  const canAdvance = status === 'draft' || status === 'review_required';

  async function advance(kind: 'approve' | 'approve_and_use') {
    setBusy(kind === 'approve' ? 'approve' : 'activate');
    setError(null);
    try {
      const res = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesis.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advance: kind }),
      });
      const payload = ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
      if (!res.ok) {
        const code = typeof payload.detail === 'string' ? payload.detail.replace(/^.*refused: /, '') : typeof payload.error === 'string' ? payload.error : `HTTP ${res.status}`;
        setError(describeRefusal(code));
        return;
      }
      setJustActivated(payload.to === 'active');
      onTransition({ from: status, to: (payload.to as HypothesisStatus) ?? status, effects: [] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'network_error');
    } finally {
      setBusy(null);
    }
  }

  function afterFactLinked() {
    if (onChanged) onChanged();
    else onTransition({ from: status, to: status, effects: ['signals_linked'] });
  }

  function disabledFor(action: HypothesisAction): { disabled: boolean; title?: string } {
    if (busy !== null) return { disabled: true };
    if (EVIDENCE_ACTIONS.has(action) && !evidenced) return { disabled: true, title: NEEDS_CITED_FACT };
    if (REASON_ACTIONS.has(action) && !nonBlank(reason)) return { disabled: true, title: 'Type a reason first' };
    return { disabled: false };
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle>{hypothesis.account_name}</SheetTitle>
            <HypothesisStatusBadge status={status} />
            {terminal ? <Badge variant="outline">Closed</Badge> : null}
          </div>
          <SheetDescription>
            {hypothesis.problem_family.replace(/_/g, ' ')} for {hypothesis.persona.replace(/_/g, ' ')}. Confidence {hypothesis.confidence}%.
            {hypothesis.updated_at ? ` Updated ${formatWhen(hypothesis.updated_at)}.` : ''}
          </SheetDescription>
        </SheetHeader>

        {justActivated ? (
          <div data-testid="hypothesis-activated-banner" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--accent)] p-3 text-sm">
            <p>Approved and in use. Run routing and this person gets a recommendation.</p>
            <Button asChild type="button" size="sm" variant="outline">
              <Link href="/gap">Go to Queue</Link>
            </Button>
          </div>
        ) : null}

        {!terminal && primaryAction ? (
          <section
            data-testid="hypothesis-sticky-decision"
            className="sticky top-0 z-10 mt-4 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              What do I do with this?
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {canAdvance ? (
                <>
                  <Button type="button" disabled={disabledFor('approve').disabled} title={disabledFor('approve').title} onClick={() => void advance('approve_and_use')}>
                    {busy === 'activate' ? 'Approving...' : 'Approve + use'}
                  </Button>
                  <Button type="button" variant="ghost" disabled={disabledFor('approve').disabled} onClick={() => void advance('approve')}>
                    {busy === 'approve' ? 'Approving...' : 'Approve only'}
                  </Button>
                </>
              ) : null}
              {!canAdvance && (() => {
                const gate = disabledFor(primaryAction);
                return (
                  <Button type="button" disabled={gate.disabled} title={gate.title} onClick={() => void run(primaryAction)}>
                    {busy === primaryAction ? `${ACTION_LABEL[primaryAction]}...` : ACTION_LABEL[primaryAction]}
                  </Button>
                );
              })()}
              {secondaryActions
                .filter((action) => !REASON_ACTIONS.has(action) && !(canAdvance && (action === 'submit' || action === 'approve')))
                .map((action) => {
                  const gate = disabledFor(action);
                  return (
                    <Button
                      key={action}
                      type="button"
                      variant="outline"
                      disabled={gate.disabled}
                      title={gate.title}
                      onClick={() => void run(action)}
                    >
                      {busy === action ? `${ACTION_LABEL[action]}...` : ACTION_LABEL[action]}
                    </Button>
                  );
                })}
              {secondaryActions.some((action) => REASON_ACTIONS.has(action)) ? (
                <span className="text-xs text-[var(--muted-foreground)]">
                  See Actions below for {secondaryActions.filter((a) => REASON_ACTIONS.has(a)).map((a) => ACTION_LABEL[a]).join(' / ')} (needs a reason)
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        {showFastReview ? (
          <div data-testid="hypothesis-review-nav" className="mt-3 flex items-center justify-between text-sm">
            <Button type="button" variant="outline" size="sm" disabled={!hasPrevious} onClick={() => onPrevious?.()}>
              Previous
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!hasNext} onClick={() => onNext?.()}>
              Next
            </Button>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <FactBlock observation={hypothesis.observation ?? ''} signals={factSignals} />
          <HypothesisBlock
            problemHypothesis={hypothesis.problem_hypothesis ?? ''}
            rootCauseHypotheses={asStringList(hypothesis.root_cause_hypotheses)}
            impactHypotheses={asStringList(hypothesis.impact_hypotheses)}
            whyNow={hypothesis.why_now}
            falsificationQuestions={asStringList(hypothesis.falsification_questions)}
            whatANoMeans={hypothesis.what_a_no_means}
            confidence={hypothesis.confidence}
          />
        </div>

        <section className="mt-6" data-testid="hypothesis-signals">
          <h3 className="text-sm font-semibold">Signals ({links.length})</h3>
          {links.length === 0 ? (
            <p className="mt-2 text-sm italic text-[var(--muted-foreground)]">No signals linked</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--border)] rounded-md border border-[var(--border)]">
              {links.map((link) => {
                const signal = link.signal;
                const url = signal?.evidence_url?.trim();
                return (
                  <li key={link.signal_id} className="flex flex-col gap-1 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{signal?.title ?? link.signal_id}</span>
                      {link.role === 'primary' ? <Badge variant="info">primary</Badge> : null}
                      {signal?.external_ok === false ? <Badge variant="warning">internal only</Badge> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                      <span>{signal?.source_kind ?? 'unknown source'}</span>
                      {typeof signal?.confidence === 'number' ? <span>confidence {signal.confidence}%</span> : null}
                      {signal?.observed_at ? <span>observed {formatWhen(signal.observed_at)}</span> : null}
                      {url ? (
                        <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          source
                        </a>
                      ) : signal?.evidence_text ? (
                        <span title={signal.evidence_text}>evidence text</span>
                      ) : (
                        <span>no evidence</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!terminal ? (
            <AddFactForm
              hypothesisId={hypothesis.id}
              accountName={hypothesis.account_name}
              status={status}
              onLinked={afterFactLinked}
            />
          ) : null}
        </section>

        {!terminal ? (
          <section className="mt-6" data-testid="hypothesis-actions">
            <h3 className="text-sm font-semibold">Actions</h3>
            {needsReasonInput ? (
              <div className="mt-2">
                <label htmlFor="hypothesis-reason" className="text-xs text-[var(--muted-foreground)]">
                  Reason
                </label>
                <Input
                  id="hypothesis-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Required for withdraw, reject review and close unresolved"
                  className="mt-1"
                />
              </div>
            ) : null}
            {needsOutcome ? (
              <div className="mt-2">
                <label htmlFor="hypothesis-outcome" className="text-xs text-[var(--muted-foreground)]">
                  Outcome
                </label>
                <select
                  id="hypothesis-outcome"
                  value={outcome}
                  onChange={(event) => setOutcome(event.target.value as ResolutionOutcome)}
                  className="mt-1 flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {OUTCOMES.map((option) => (
                    <option key={option} value={option}>
                      {option.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {lowerActions.map((action) => {
                const gate = disabledFor(action);
                return (
                  <Button
                    key={action}
                    type="button"
                    size="sm"
                    variant={DESTRUCTIVE_ACTIONS.has(action) ? 'outline' : 'default'}
                    disabled={gate.disabled}
                    title={gate.title}
                    onClick={() => void run(action)}
                  >
                    {busy === action ? `${ACTION_LABEL[action]}...` : ACTION_LABEL[action]}
                  </Button>
                );
              })}
            </div>
            {error ? (
              <p data-testid="hypothesis-action-error" role="alert" className="mt-3 text-sm text-[var(--destructive)]">
                Refused: <code className="font-mono">{error}</code>
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-6" data-testid="hypothesis-events">
          <h3 className="text-sm font-semibold">History ({events.length})</h3>
          {events.length === 0 ? (
            <p className="mt-2 text-sm italic text-[var(--muted-foreground)]">No events recorded</p>
          ) : (
            <ol className="mt-2 space-y-2 text-xs">
              {events.map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-mono text-[var(--muted-foreground)]">{formatWhen(event.created_at, true)}</span>
                  <span className="font-medium">{event.action}</span>
                  <span className="text-[var(--muted-foreground)]">{event.actor}</span>
                  <span>
                    {event.from_status ?? 'new'} to {event.to_status ?? 'same'}
                  </span>
                  {event.reason ? <span className="italic text-[var(--muted-foreground)]">{event.reason}</span> : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </SheetContent>
    </Sheet>
  );
}
