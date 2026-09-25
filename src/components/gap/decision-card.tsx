/**
 * Decision card (GAP Prospecting OS, Sprint 2, S2-T11).
 *
 * Pure presentational. One routing decision from GET /api/gap/queue: the
 * action chip, the rule that fired, the account / persona / hypothesis
 * lines, the five questions plus "Would prove us wrong" as a definition
 * list, the evidence and signal counts, the enroll target, and the
 * "I did this" / "I did something else" pair that reports back through
 * `onAct`. Once `humanAction` is set the buttons go away and the card shows
 * what was done and when.
 *
 * Every explain field is rendered as a React text node, never as HTML. The
 * card reads only the fields named in `QueueItem`; private intent
 * (`intentScore`, `lastIntentSource`) is not part of the contract and the
 * card never reaches for it, so a wider object cannot leak through here.
 *
 * Voice: no em dashes, "yards" plural, "production capacity".
 */

import { useState } from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnrollTarget, RoutingExplain } from '@/lib/gap/routing/types';
import { HUMAN_ACTIONS, type HumanAction, type RoutingAction, type RoutingLane } from '@/lib/gap/taxonomy';
import { RECOMMENDED_HUMAN_ACTION } from '@/lib/gap/routing/agreement';
import { HypothesisStatusBadge, formatWhen } from './hypothesis-drawer';

// ---------------------------------------------------------------------------
// Queue row shape (the GET /api/gap/queue contract, S2-T7)
// ---------------------------------------------------------------------------

export interface QueueItemAccount {
  name: string;
  hubspotCompanyId: string | null;
  tam: 'in' | 'out' | 'unknown' | string;
  tamTier: 'A' | 'B' | 'C' | '' | string;
  heatTier: number;
}

export interface QueueItemPersona {
  id: number | string;
  personaKey: string;
  displayName: string | null;
  email: string | null;
  hubspotContactId: string | null;
}

export interface QueueItemHypothesis {
  id: string;
  status: string;
  family: string;
  confidence: number;
}

export interface QueueItem {
  id: string;
  action: RoutingAction | string;
  lane: RoutingLane | string;
  ruleId: string;
  priority: number;
  blocked: boolean;
  target: EnrollTarget | null;
  explain: RoutingExplain;
  account: QueueItemAccount;
  persona: QueueItemPersona;
  hypothesis: QueueItemHypothesis | null;
  humanAction: string | null;
  humanActionAt: string | null;
  createdAt: string;
}

export interface DecisionCardProps {
  item: QueueItem;
  onAct: (action: string) => void;
  acting?: boolean;
  /** Inline note from the last act attempt, e.g. "already acted". */
  actError?: string | null;
}

// ---------------------------------------------------------------------------
// Presentation tables
// ---------------------------------------------------------------------------

/** One colour per action so a scan of the queue reads without the text. */
const ACTION_CHIP_CLASS: Record<string, string> = {
  call_now: 'border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400',
  enroll_gap_sequence: 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400',
  approve_hypothesis: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
  one_off_email: 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-400',
  research_required: 'border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300',
  nurture: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  linkedin_manual_task: 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400',
  do_not_contact: 'border-transparent bg-[var(--destructive)] text-white',
};

export const TARGET_LABEL: Record<EnrollTarget, string> = {
  hubspot_native: 'Rig-built sequence exists',
  build_required: 'Sequence not built',
  modex_queue: 'Secondary lane',
};

const TARGET_VARIANT: Record<EnrollTarget, NonNullable<BadgeProps['variant']>> = {
  hubspot_native: 'success',
  build_required: 'warning',
  modex_queue: 'info',
};

/** Label text is pinned by tests; change here and there together. */
export const EXPLAIN_LABELS: ReadonlyArray<{ key: keyof RoutingExplain; label: string }> = [
  { key: 'whyAccount', label: 'Why this account' },
  { key: 'whyPerson', label: 'Why this person' },
  { key: 'whyProblem', label: 'Why this problem' },
  { key: 'whyNow', label: 'Why now' },
  { key: 'whyAction', label: 'Why this action' },
  { key: 'wouldProveWrong', label: 'Would prove us wrong' },
];

function words(value: string): string {
  return value.replace(/_/g, ' ');
}

function textOf(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : 'Not stated';
}

function countOf(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Plain-English, human-readable phrasing for every HumanAction, used both by
 * the "I did something else" chooser and to render an already-acted card.
 */
export const HUMAN_ACTION_LABEL: Record<HumanAction, string> = {
  researched: 'I researched it',
  approved_hypothesis: 'I approved the hypothesis',
  called: 'I called',
  emailed: 'I emailed',
  enrolled_by_hand: 'I enrolled manually',
  linkedin_messaged: 'I messaged on LinkedIn',
  deferred: 'I deferred it',
  do_not_contact: 'I marked do not contact',
  dismissed: 'I dismissed this recommendation',
};

/**
 * A safety refusal (blocked: true) is not a human decision request -- there
 * is nothing for Casey to agree or disagree with, so it gets its own plain-
 * English panel instead of the recommends/actually-did apparatus. Keyed by
 * `ruleId` (the two blocked rules today: R0 `suppressed`, R0b
 * `suppression_unknown`); anything else blocked falls back to a generic
 * "system block" message rather than presenting it as a live recommendation.
 */
const BLOCKED_COPY: Record<string, { title: string; body: string; remediation?: string }> = {
  suppressed: {
    title: 'Do not contact',
    body: 'This person or account is suppressed. GAP will not recommend outreach.',
  },
  suppression_unknown: {
    title: 'Suppression status unknown',
    body: 'GAP could not verify whether this person is safe to contact. No outbound action is allowed until suppression can be verified.',
    remediation: 'Retry routing when the suppression service is available.',
  },
};

function blockedCopyFor(ruleId: string): { title: string; body: string; remediation?: string } {
  return (
    BLOCKED_COPY[ruleId] ?? {
      title: 'System block',
      body: `GAP refused to recommend an action here (rule ${ruleId}).`,
    }
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DecisionCard({ item, onAct, acting = false, actError = null }: DecisionCardProps) {
  const [choosingOther, setChoosingOther] = useState(false);
  const [chosenOther, setChosenOther] = useState<HumanAction | ''>('');

  const chipClass = ACTION_CHIP_CLASS[item.action] ?? 'border-[var(--border)] text-[var(--foreground)]';
  const acted = typeof item.humanAction === 'string' && item.humanAction.length > 0;
  const personaLabel = item.persona.displayName?.trim() || item.persona.email?.trim() || `persona ${String(item.persona.id)}`;
  const tamLabel = item.account.tam === 'in' ? 'TAM in' : item.account.tam === 'out' ? 'TAM out' : 'TAM unknown';
  const tierLabel = item.account.tamTier ? `tier ${item.account.tamTier}` : 'no tier';
  const target = item.target && item.target in TARGET_LABEL ? item.target : null;
  const recommendedHumanAction = item.action in RECOMMENDED_HUMAN_ACTION ? RECOMMENDED_HUMAN_ACTION[item.action as RoutingAction] : null;
  const otherOptions = HUMAN_ACTIONS.filter((a) => a !== recommendedHumanAction);

  return (
    <article
      data-testid="decision-card"
      data-decision-id={item.id}
      data-action={item.action}
      className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm shadow-sm"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {item.blocked ? 'System block' : 'GAP recommends'}
      </p>
      <header className="mt-1 flex flex-wrap items-center gap-2">
        <Badge data-testid="action-chip" className={chipClass}>
          {words(String(item.action))}
        </Badge>
        <span className="font-mono text-xs text-[var(--muted-foreground)]">{item.ruleId}</span>
        <span className="text-xs text-[var(--muted-foreground)]">priority {item.priority}</span>
        <Badge variant="outline">{words(String(item.lane))}</Badge>
        {item.blocked ? <Badge variant="destructive">blocked</Badge> : null}
        {target ? (
          <Badge data-testid="target-chip" variant={TARGET_VARIANT[target]}>
            {TARGET_LABEL[target]}
          </Badge>
        ) : null}
      </header>

      <div className="mt-3 space-y-1">
        <p data-testid="account-line" className="font-medium">
          {item.account.name}
          <span className="ml-2 font-normal text-[var(--muted-foreground)]">
            {tamLabel}, {tierLabel}, heat tier {item.account.heatTier}
          </span>
        </p>
        <p data-testid="persona-line">
          {personaLabel}
          <span className="ml-2 text-[var(--muted-foreground)]">{words(item.persona.personaKey)}</span>
        </p>
        <div data-testid="hypothesis-line" className="flex flex-wrap items-center gap-2">
          {item.hypothesis ? (
            <>
              <span>{words(item.hypothesis.family)}</span>
              <HypothesisStatusBadge status={item.hypothesis.status} />
              <span className="text-[var(--muted-foreground)]">confidence {item.hypothesis.confidence}%</span>
            </>
          ) : (
            <span className="italic text-[var(--muted-foreground)]">No hypothesis</span>
          )}
        </div>
      </div>

      <dl data-testid="explain" className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[max-content_1fr]">
        {EXPLAIN_LABELS.map(({ key, label }) => (
          <div key={key} className="contents">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</dt>
            <dd className="leading-6">{textOf(item.explain?.[key])}</dd>
          </div>
        ))}
      </dl>

      <p data-testid="evidence-counts" className="mt-3 text-xs text-[var(--muted-foreground)]">
        {countOf(item.explain?.evidenceIds)} evidence, {countOf(item.explain?.signalIds)} signals
      </p>

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {item.blocked ? (
          (() => {
            const copy = blockedCopyFor(item.ruleId);
            return (
              <div data-testid="blocked-panel" className="w-full space-y-1 border-t border-[var(--border)] pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--destructive)]">{copy.title}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{copy.body}</p>
                {copy.remediation ? <p className="text-xs italic text-[var(--muted-foreground)]">{copy.remediation}</p> : null}
              </div>
            );
          })()
        ) : acted ? (
          <p data-testid="acted" className="text-xs text-[var(--muted-foreground)]">
            Acted: {HUMAN_ACTION_LABEL[item.humanAction as HumanAction] ?? item.humanAction}
            {item.humanActionAt ? ` at ${formatWhen(item.humanActionAt, true)}` : ''}
          </p>
        ) : (
          <div className="w-full space-y-2 border-t border-[var(--border)] pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Casey actually did</p>
            {choosingOther ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="What did you actually do?"
                  className="h-9 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm shadow-sm"
                  value={chosenOther}
                  onChange={(event) => setChosenOther(event.target.value as HumanAction)}
                >
                  <option value="">Choose what you did...</option>
                  {otherOptions.map((option) => (
                    <option key={option} value={option}>
                      {HUMAN_ACTION_LABEL[option]}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" disabled={acting || !chosenOther} onClick={() => chosenOther && onAct(chosenOther)}>
                  {acting ? 'Saving...' : 'Record'}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={acting} onClick={() => setChoosingOther(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={acting || !recommendedHumanAction}
                  onClick={() => recommendedHumanAction && onAct(recommendedHumanAction)}
                >
                  {acting ? 'Saving...' : 'I did this'}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={acting} onClick={() => setChoosingOther(true)}>
                  I did something else
                </Button>
              </div>
            )}
            <p className="text-[11px] text-[var(--muted-foreground)]">
              These buttons record your action. They do not send email or enroll anyone.
            </p>
          </div>
        )}
        {actError ? (
          <span role="alert" data-testid="act-error" className="text-xs text-[var(--destructive)]">
            {actError}
          </span>
        ) : null}
      </footer>
    </article>
  );
}
