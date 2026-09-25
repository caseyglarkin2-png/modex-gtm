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

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnrollTarget, RoutingExplain } from '@/lib/gap/routing/types';
import type { RoutingAction, RoutingLane } from '@/lib/gap/taxonomy';
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DecisionCard({ item, onAct, acting = false, actError = null }: DecisionCardProps) {
  const chipClass = ACTION_CHIP_CLASS[item.action] ?? 'border-[var(--border)] text-[var(--foreground)]';
  const acted = typeof item.humanAction === 'string' && item.humanAction.length > 0;
  const personaLabel = item.persona.displayName?.trim() || item.persona.email?.trim() || `persona ${String(item.persona.id)}`;
  const tamLabel = item.account.tam === 'in' ? 'TAM in' : item.account.tam === 'out' ? 'TAM out' : 'TAM unknown';
  const tierLabel = item.account.tamTier ? `tier ${item.account.tamTier}` : 'no tier';
  const target = item.target && item.target in TARGET_LABEL ? item.target : null;

  return (
    <article
      data-testid="decision-card"
      data-decision-id={item.id}
      data-action={item.action}
      className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm shadow-sm"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">GAP recommends</p>
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
        {acted ? (
          <p data-testid="acted" className="text-xs text-[var(--muted-foreground)]">
            Acted: {item.humanAction}
            {item.humanActionAt ? ` at ${formatWhen(item.humanActionAt, true)}` : ''}
          </p>
        ) : (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium">Casey:</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" disabled={acting} onClick={() => onAct(String(item.action))}>
                {acting ? 'Saving...' : 'I did this'}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={acting} onClick={() => onAct('other')}>
                I did something else
              </Button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              This only records what you actually did. It never sends an email or enrolls anyone.
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
