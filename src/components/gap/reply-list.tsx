'use client';

/**
 * Reply list (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Rows from `GET /api/gap/replies`: subject or snippet, a source badge
 * (gmail for `inbound_message`, hubspot for `hubspot_engagement`), the
 * contact, the account, the hypothesis, when it arrived, and whether the
 * address is enrolled. An "AI suggestion" chip appears ONLY when the row
 * carries a `suggestion`, labelled exactly `AI_SUGGESTION_LABEL`; the list
 * never chooses a class for the human. A "dispositioned" badge marks a row
 * that carries `dispositionId` (only `state=all` returns those). Clicking a row asks the owner to
 * toggle it; the owner renders the disposition form inline through
 * `renderExpanded` with the reply's ids prefilled.
 *
 * Pure presentational; the page owns fetching and selection.
 * Voice: no em dashes, "yards" plural.
 */

import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ReplyItem, ReplySourceKind } from '@/lib/gap/ui/gap-api-client';
import { formatWhen } from './hypothesis-drawer';
import { AiSuggestionChip } from './disposition-form';

export type SourceBadge = 'gmail' | 'hubspot' | 'other';

export const SOURCE_BADGE: Record<ReplySourceKind, SourceBadge> = {
  inbound_message: 'gmail',
  hubspot_engagement: 'hubspot',
};

export function sourceBadgeOf(kind: string): SourceBadge {
  return (SOURCE_BADGE as Record<string, SourceBadge>)[kind] ?? 'other';
}

export function enrollmentLabel(item: Pick<ReplyItem, 'enrollmentId' | 'enrollmentStatus'>): string {
  if (typeof item.enrollmentStatus === 'string' && item.enrollmentStatus.trim().length > 0) {
    return item.enrollmentStatus.replace(/_/g, ' ');
  }
  return item.enrollmentId ? 'enrolled' : 'not enrolled';
}

export function hypothesisLabel(item: Pick<ReplyItem, 'hypothesisId' | 'hypothesisTitle'>): string {
  if (typeof item.hypothesisTitle === 'string' && item.hypothesisTitle.trim().length > 0) {
    return item.hypothesisTitle.replace(/_/g, ' ');
  }
  return `hypothesis ${item.hypothesisId}`;
}

export interface ReplyListProps {
  items: readonly ReplyItem[];
  expandedId: string | null;
  onToggle: (item: ReplyItem) => void;
  renderExpanded: (item: ReplyItem) => ReactNode;
  loading?: boolean;
  error?: string | null;
}

export function ReplyList({ items, expandedId, onToggle, renderExpanded, loading = false, error = null }: ReplyListProps) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-[var(--destructive)]">
        Could not load replies: <code className="font-mono">{error}</code>
      </p>
    );
  }
  if (loading) return <p className="text-sm italic text-[var(--muted-foreground)]">Loading replies...</p>;
  if (items.length === 0) {
    return <p data-testid="reply-list-empty" className="text-sm italic text-[var(--muted-foreground)]">No replies waiting for a disposition.</p>;
  }

  return (
    <ul data-testid="reply-list" className="space-y-2">
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const badge = sourceBadgeOf(item.source?.kind);
        return (
          <li
            key={item.id}
            data-testid="reply-row"
            data-reply-id={item.id}
            data-expanded={expanded}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] text-sm shadow-sm"
          >
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => onToggle(item)}
              className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-[var(--muted)]/60"
            >
              <span className="flex flex-wrap items-center gap-2">
                <Badge data-testid="source-badge" variant={badge === 'gmail' ? 'info' : badge === 'hubspot' ? 'warning' : 'outline'}>
                  {badge}
                </Badge>
                <span className="font-medium">{item.subject?.trim() || '(no subject)'}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{formatWhen(item.receivedAt, true)}</span>
                {item.dispositionId ? (
                  <Badge data-testid="reply-dispositioned" variant="outline">
                    dispositioned
                  </Badge>
                ) : null}
                {item.suggestion ? <AiSuggestionChip suggestion={item.suggestion} /> : null}
              </span>
              <span data-testid="reply-snippet" className="line-clamp-2 text-[var(--muted-foreground)]">
                {item.snippet}
              </span>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                <span data-testid="reply-contact">{item.contactEmail}</span>
                <span data-testid="reply-account">{item.accountName}</span>
                <span data-testid="reply-hypothesis">{hypothesisLabel(item)}</span>
                <span data-testid="reply-enrollment">{enrollmentLabel(item)}</span>
              </span>
            </button>
            {expanded ? (
              <div data-testid="reply-expanded" className="border-t border-[var(--border)] p-3">
                {renderExpanded(item)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
