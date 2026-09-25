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
import Link from 'next/link';
import { ExternalLink, Linkedin, Mail, Phone } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnrollTarget, RoutingExplain } from '@/lib/gap/routing/types';
import { HUMAN_ACTIONS, type HumanAction, type RoutingAction, type RoutingLane } from '@/lib/gap/taxonomy';
import { RECOMMENDED_HUMAN_ACTION } from '@/lib/gap/routing/agreement';
import {
  hubspotCompanyUrl,
  hubspotContactUrl,
  mailtoHref,
  sellerActionLabel,
  telHref,
} from '@/lib/gap/routing/seller-action';
import { cardReadiness } from '@/lib/gap/routing/card-readiness';
import type { SuppressionClass } from '@/lib/gap/suppression/provenance';
import { HypothesisStatusBadge } from './hypothesis-drawer';
import { formatWhen } from '@/lib/gap/ui/format';

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
  title?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
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
  /** Provenance class of the suppression the router saw (optional for older payloads). */
  suppression?: { class: SuppressionClass; hits: string[] } | null;
  touch?: { state: 'waiting' | 'due' | 'complete' | 'stopped' | 'unknown'; stepIndex?: number; dueAt?: string; reason?: string; detail?: string; sentCount: number } | null;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DecisionCard({ item, onAct, acting = false, actError = null }: DecisionCardProps) {
  const [choosingOther, setChoosingOther] = useState(false);
  const [chosenOther, setChosenOther] = useState<HumanAction | ''>('');

  const chipClass = ACTION_CHIP_CLASS[item.action] ?? 'border-[var(--border)] text-[var(--foreground)]';
  const acted = typeof item.humanAction === 'string' && item.humanAction.length > 0;
  const personaLabel = item.persona.displayName?.trim() || item.persona.email?.trim() || `persona ${String(item.persona.id)}`;
  const firstName = item.persona.displayName?.trim()?.split(/\s+/)[0] ?? null;
  const tamLabel = item.account.tam === 'in' ? 'TAM in' : item.account.tam === 'out' ? 'TAM out' : 'TAM unknown';
  const tierLabel = item.account.tamTier ? `tier ${item.account.tamTier}` : 'no tier';
  const target = item.target && item.target in TARGET_LABEL ? item.target : null;
  const recommendedHumanAction = item.action in RECOMMENDED_HUMAN_ACTION ? RECOMMENDED_HUMAN_ACTION[item.action as RoutingAction] : null;
  const otherOptions = HUMAN_ACTIONS.filter((a) => a !== recommendedHumanAction);
  const sellerLabel = sellerActionLabel(item.action, firstName, item.account.name);
  const mailto = mailtoHref(item.persona.email);
  const tel = telHref(item.persona.phone ?? null);
  const contactUrl = item.persona.hubspotContactId ? hubspotContactUrl(item.persona.hubspotContactId) : null;
  const companyUrl = item.account.hubspotCompanyId ? hubspotCompanyUrl(item.account.hubspotCompanyId) : null;
  const readiness = cardReadiness({
    id: item.id,
    action: String(item.action),
    blocked: item.blocked,
    ruleId: item.ruleId,
    account: { name: item.account.name, hubspotCompanyId: item.account.hubspotCompanyId },
    persona: {
      id: item.persona.id,
      displayName: item.persona.displayName,
      email: item.persona.email,
      phone: item.persona.phone ?? null,
      linkedinUrl: item.persona.linkedinUrl ?? null,
      hubspotContactId: item.persona.hubspotContactId,
    },
    hypothesis: item.hypothesis ? { id: item.hypothesis.id, status: item.hypothesis.status } : null,
    suppression: item.suppression ?? null,
    touch: item.touch ?? null,
  });

  return (
    <article
      data-testid="decision-card"
      data-decision-id={item.id}
      data-action={item.action}
      className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm shadow-sm"
    >
      {item.blocked ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--destructive)]">System block</p>
      ) : (
        <p data-testid="seller-action-label" className="text-base font-semibold">
          {sellerLabel}
        </p>
      )}

      <div className="mt-2 space-y-1">
        <p data-testid="account-line" className="font-medium">
          {item.account.name}
          <span className="ml-2 font-normal text-xs text-[var(--muted-foreground)]">
            {tamLabel}, {tierLabel}, heat tier {item.account.heatTier}
          </span>
        </p>
        <p data-testid="persona-line">
          {personaLabel}
          <span className="ml-2 text-[var(--muted-foreground)]">{item.persona.title || words(item.persona.personaKey)}</span>
        </p>
      </div>

      {!item.blocked ? (
        <div data-testid="contact-buttons" className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {mailto ? (
            <a href={mailto} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
              <Mail className="h-3 w-3" /> Email
            </a>
          ) : (
            <span className="italic text-[var(--muted-foreground)]">email unavailable</span>
          )}
          {tel ? (
            <a href={tel} className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
              <Phone className="h-3 w-3" /> Call
            </a>
          ) : (
            <span className="italic text-[var(--muted-foreground)]">phone unavailable</span>
          )}
          {item.persona.linkedinUrl ? (
            <a
              href={item.persona.linkedinUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]"
            >
              <Linkedin className="h-3 w-3" /> LinkedIn
            </a>
          ) : (
            <span className="italic text-[var(--muted-foreground)]">LinkedIn unavailable</span>
          )}
          {contactUrl ? (
            <a
              href={contactUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]"
            >
              <ExternalLink className="h-3 w-3" /> HubSpot contact
            </a>
          ) : null}
          {companyUrl ? (
            <a
              href={companyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]"
            >
              <ExternalLink className="h-3 w-3" /> HubSpot account
            </a>
          ) : null}
        </div>
      ) : null}

      {readiness.state !== 'blocked' && readiness.warning ? (
        <div data-testid="suppression-warning" className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
          <p className="font-semibold">{readiness.warning.title}</p>
          <p className="mt-1 text-[var(--muted-foreground)]">{readiness.warning.body}</p>
        </div>
      ) : null}

      {readiness.state === 'actionable' ? (
        <div data-testid="readiness-actionable" className="mt-3 flex flex-wrap items-center gap-2">
          {readiness.primary.href ? (
            <a
              href={readiness.primary.href}
              {...(readiness.primary.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              {readiness.primary.label}
            </a>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">{'note' in readiness.primary ? readiness.primary.note : null}</p>
          )}
          {readiness.secondary.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]">
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}

      {readiness.state === 'missing_prerequisite' ? (
        <div data-testid="missing-prerequisite" className="mt-3 space-y-2 rounded-md border border-dashed border-[var(--border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Missing prerequisite</p>
          <p className="text-xs">{readiness.missing}</p>
          <a
            href={readiness.fix.href}
            {...(readiness.fix.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            className="inline-flex rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]"
          >
            {readiness.fix.label}
          </a>
        </div>
      ) : null}

      <details className="mt-3 text-xs" data-testid="routing-details">
        <summary className="cursor-pointer select-none font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Routing details
        </summary>
        <header className="mt-2 flex flex-wrap items-center gap-2">
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

        <div data-testid="hypothesis-line" className="mt-2 flex flex-wrap items-center gap-2">
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
      </details>

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {readiness.state === 'blocked' ? (
          <div data-testid="blocked-panel" className="w-full space-y-1 border-t border-[var(--border)] pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--destructive)]">{readiness.title}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{readiness.body}</p>
            {readiness.remediation ? <p className="text-xs italic text-[var(--muted-foreground)]">{readiness.remediation}</p> : null}
          </div>
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
