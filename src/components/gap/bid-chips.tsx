'use client';

/**
 * BID chips (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * One chip per `BID_TYPES` entry. Selecting a chip opens a capture panel:
 * the buyer's words (`rawBuyerLanguage`, required, at least
 * `BID_QUOTE_MIN_LENGTH` characters), an optional normalized summary, and
 * for `impact` and `metric` a numeric value with a unit (the unit is
 * required whenever a value is given). "Add" stays disabled until
 * `validateBidDraft` returns null, so a BID can never be added without a
 * quote. Added BIDs list below the chips with a remove control; the parent
 * owns the array through `value` / `onChange` and folds it into the
 * disposition body.
 *
 * Nothing here fetches. Voice: no em dashes, "yards" plural.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BID_TYPES, type BidType } from '@/lib/gap/taxonomy';
import type { DispositionBidInput } from '@/lib/gap/ui/gap-api-client';

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export type BidDraft = DispositionBidInput;

export const BID_QUOTE_MIN_LENGTH = 3;

/** BID types that may carry a numeric value and unit. */
export const NUMERIC_BID_TYPES = ['impact', 'metric'] as const satisfies readonly BidType[];

export function isNumericBidType(type: string): boolean {
  return (NUMERIC_BID_TYPES as readonly string[]).includes(type);
}

export type BidDraftError = 'quote_required' | 'quote_too_short' | 'invalid_numeric_value' | 'unit_required';

export const BID_ERROR_TEXT: Record<BidDraftError, string> = {
  quote_required: "The buyer's words are required",
  quote_too_short: `Quote at least ${BID_QUOTE_MIN_LENGTH} characters`,
  invalid_numeric_value: 'Value must be a number',
  unit_required: 'A value needs a unit',
};

export interface BidPanelState {
  type: BidType;
  rawBuyerLanguage: string;
  normalizedSummary: string;
  numericValue: string;
  unit: string;
}

/** Pure. The one rule set that gates "Add"; the parent never re-checks. */
export function validateBidDraft(state: BidPanelState): BidDraftError | null {
  const quote = state.rawBuyerLanguage.trim();
  if (quote.length === 0) return 'quote_required';
  if (quote.length < BID_QUOTE_MIN_LENGTH) return 'quote_too_short';
  if (isNumericBidType(state.type)) {
    const raw = state.numericValue.trim();
    if (raw.length > 0) {
      if (!Number.isFinite(Number(raw))) return 'invalid_numeric_value';
      if (state.unit.trim().length === 0) return 'unit_required';
    }
  }
  return null;
}

/** Pure. Panel state to the contract's BID shape; empty optionals are omitted, never null. */
export function toBidDraft(state: BidPanelState): BidDraft {
  const draft: BidDraft = { type: state.type, rawBuyerLanguage: state.rawBuyerLanguage.trim() };
  const summary = state.normalizedSummary.trim();
  if (summary.length > 0) draft.normalizedSummary = summary;
  if (isNumericBidType(state.type)) {
    const raw = state.numericValue.trim();
    if (raw.length > 0 && Number.isFinite(Number(raw))) {
      draft.numericValue = Number(raw);
      const unit = state.unit.trim();
      if (unit.length > 0) draft.unit = unit;
    }
  }
  return draft;
}

function emptyPanel(type: BidType): BidPanelState {
  return { type, rawBuyerLanguage: '', normalizedSummary: '', numericValue: '', unit: '' };
}

export function words(value: string): string {
  return value.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface BidChipsProps {
  value: readonly BidDraft[];
  onChange: (next: BidDraft[]) => void;
  disabled?: boolean;
  /** Opens the panel for this type with the quote prefilled (a human chose it). */
  seed?: { type: BidType; quote: string } | null;
  onSeedConsumed?: () => void;
}

export function BidChips({ value, onChange, disabled = false, seed = null, onSeedConsumed }: BidChipsProps) {
  const [panel, setPanel] = useState<BidPanelState | null>(null);
  const [lastSeed, setLastSeed] = useState<BidChipsProps['seed']>(null);

  if (seed && seed !== lastSeed) {
    setLastSeed(seed);
    setPanel({ ...emptyPanel(seed.type), rawBuyerLanguage: seed.quote });
    onSeedConsumed?.();
  }

  const error = panel ? validateBidDraft(panel) : null;
  const counts = new Map<string, number>();
  for (const bid of value) counts.set(bid.type, (counts.get(bid.type) ?? 0) + 1);

  function open(type: BidType) {
    if (disabled) return;
    setPanel((current) => (current && current.type === type ? null : emptyPanel(type)));
  }

  function add() {
    if (!panel || validateBidDraft(panel) !== null) return;
    onChange([...value, toBidDraft(panel)]);
    setPanel(null);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function update(patch: Partial<BidPanelState>) {
    setPanel((current) => (current ? { ...current, ...patch } : current));
  }

  return (
    <div data-testid="bid-chips" className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Buyer input (BID)</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="BID types">
          {BID_TYPES.map((type) => {
            const active = panel?.type === type;
            const count = counts.get(type) ?? 0;
            return (
              <button
                key={type}
                type="button"
                data-testid={`bid-chip-${type}`}
                aria-pressed={active}
                disabled={disabled}
                onClick={() => open(type)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'border-[var(--border)] bg-transparent hover:bg-[var(--muted)]'
                }`}
              >
                {words(type)}
                {count > 0 ? <span className="ml-1 rounded-full bg-[var(--muted)] px-1.5 text-[10px] text-[var(--foreground)]">{count}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {panel ? (
        <div data-testid="bid-panel" data-bid-type={panel.type} className="space-y-2 rounded-md border border-[var(--border)] p-3">
          <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
            Buyer&apos;s words ({words(panel.type)})
            <Textarea
              aria-label="Quote"
              value={panel.rawBuyerLanguage}
              onChange={(event) => update({ rawBuyerLanguage: event.target.value })}
              placeholder="What they said, in their words"
              rows={2}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
            Summary (optional)
            <Input
              aria-label="Summary"
              value={panel.normalizedSummary}
              onChange={(event) => update({ normalizedSummary: event.target.value })}
              placeholder="One line in our words"
            />
          </label>
          {isNumericBidType(panel.type) ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                Value (optional)
                <Input
                  aria-label="Value"
                  inputMode="decimal"
                  value={panel.numericValue}
                  onChange={(event) => update({ numericValue: event.target.value })}
                  placeholder="e.g. 45"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                Unit
                <Input
                  aria-label="Unit"
                  value={panel.unit}
                  onChange={(event) => update({ unit: event.target.value })}
                  placeholder="minutes per truck, dollars per month"
                />
              </label>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="bid-add"
              disabled={error !== null}
              {...(error ? { title: BID_ERROR_TEXT[error] } : {})}
              onClick={add}
            >
              Add {words(panel.type)}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPanel(null)}>
              Cancel
            </Button>
            {error ? <span className="text-xs text-[var(--muted-foreground)]">{BID_ERROR_TEXT[error]}</span> : null}
          </div>
        </div>
      ) : null}

      {value.length > 0 ? (
        <ul data-testid="bid-added-list" className="space-y-1">
          {value.map((bid, index) => (
            <li
              key={`${bid.type}-${index}`}
              data-testid="bid-added"
              data-bid-type={bid.type}
              className="flex items-start gap-2 rounded-md bg-[var(--muted)]/60 px-3 py-2 text-sm"
            >
              <Badge variant="outline">{words(bid.type)}</Badge>
              <span className="flex-1">
                <q>{bid.rawBuyerLanguage}</q>
                {bid.normalizedSummary ? <span className="ml-2 text-xs text-[var(--muted-foreground)]">{bid.normalizedSummary}</span> : null}
                {typeof bid.numericValue === 'number' ? (
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    {bid.numericValue} {bid.unit ?? ''}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label={`Remove ${words(bid.type)}`}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                disabled={disabled}
                onClick={() => remove(index)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
