'use client';

/**
 * Add-fact form (GAP Prospecting OS, Sprint 2, S2-T10).
 *
 * Registers one fact and links it to the open hypothesis. Two modes:
 *
 *   Operator knowledge   something the operator knows first-hand. Text is
 *                        required, the date defaults to today, the title is
 *                        optional. The server hard-wires `externalOk: false`:
 *                        first-party, never quotable as public evidence, and
 *                        the form says so.
 *   Public fact          a URL (required, http(s) only), an optional title
 *                        and an optional excerpt. Quotable.
 *
 * Both modes POST /api/gap/signals with the hypothesis's account, then POST
 * the returned id to /api/gap/hypotheses/{id}/signals, then call `onLinked`
 * so the owner refetches the row. Refusals surface the route's `error`
 * string verbatim. The whole form is disabled with a hint once the
 * hypothesis has left draft/review_required, mirroring the service's
 * `narrative_frozen` refusal before the round trip.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { HypothesisStatus } from '@/lib/gap/hypothesis/machine';

export type FactKind = 'operator_knowledge' | 'public';

export interface AddFactFormProps {
  hypothesisId: string;
  accountName: string;
  status: HypothesisStatus | string;
  onLinked: () => void;
}

export const FACTS_FROZEN_HINT = 'Facts can be added while the hypothesis is draft or review required';
export const OPERATOR_FACT_LABEL = 'first-party, never quotable as public evidence';
export const URL_HINT = 'Enter an http(s) URL';
export const TEXT_HINT = 'Type what you know first';

const EDITABLE: ReadonlySet<string> = new Set(['draft', 'review_required']);

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True when `raw` parses as a URL with an http or https scheme. */
export function isHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const json: unknown = await res.json();
    return json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function errorOf(payload: Record<string, unknown>, res: Response): string {
  if (typeof payload.error === 'string') {
    return typeof payload.field === 'string' ? `${payload.error}:${payload.field}` : payload.error;
  }
  return `HTTP ${res.status}`;
}

export function AddFactForm({ hypothesisId, accountName, status, onLinked }: AddFactFormProps) {
  const [kind, setKind] = useState<FactKind>('operator_knowledge');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [observedAt, setObservedAt] = useState(todayIso);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const frozen = !EDITABLE.has(String(status));
  const textReady = text.trim().length > 0;
  const urlReady = isHttpUrl(url);

  function gate(): { disabled: boolean; title?: string } {
    if (frozen) return { disabled: true, title: FACTS_FROZEN_HINT };
    if (busy) return { disabled: true };
    if (kind === 'operator_knowledge' && !textReady) return { disabled: true, title: TEXT_HINT };
    if (kind === 'public' && !urlReady) return { disabled: true, title: URL_HINT };
    return { disabled: false };
  }

  function reset() {
    setText('');
    setUrl('');
    setTitle('');
    setExcerpt('');
    setObservedAt(todayIso());
  }

  async function submit() {
    if (gate().disabled) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const body: Record<string, unknown> = { accountName, kind, observedAt };
    const trimmedTitle = title.trim();
    if (trimmedTitle) body.title = trimmedTitle;
    if (kind === 'operator_knowledge') {
      body.text = text.trim();
    } else {
      body.url = url.trim();
      const trimmedExcerpt = excerpt.trim();
      if (trimmedExcerpt) body.excerpt = trimmedExcerpt;
    }
    try {
      const registered = await fetch('/api/gap/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const registeredPayload = await readJson(registered);
      if (!registered.ok || typeof registeredPayload.id !== 'string') {
        setError(errorOf(registeredPayload, registered));
        return;
      }
      const linked = await fetch(`/api/gap/hypotheses/${encodeURIComponent(hypothesisId)}/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalIds: [registeredPayload.id] }),
      });
      const linkedPayload = await readJson(linked);
      if (!linked.ok) {
        setError(errorOf(linkedPayload, linked));
        return;
      }
      const already = Array.isArray(linkedPayload.already) && linkedPayload.already.length > 0;
      setNotice(already ? 'Already linked' : registeredPayload.created === false ? 'Linked an existing fact' : 'Fact linked');
      reset();
      onLinked();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'network_error');
    } finally {
      setBusy(false);
    }
  }

  const submitGate = gate();

  return (
    <form
      data-testid="add-fact-form"
      className="mt-3 space-y-2 rounded-md border border-[var(--border)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="add-fact-kind" className="text-xs text-[var(--muted-foreground)]">
          Add a fact
        </label>
        <select
          id="add-fact-kind"
          value={kind}
          disabled={frozen || busy}
          onChange={(event) => {
            setKind(event.target.value as FactKind);
            setError(null);
          }}
          className="flex h-8 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm shadow-sm"
        >
          <option value="operator_knowledge">Operator knowledge</option>
          <option value="public">Public fact</option>
        </select>
        {kind === 'operator_knowledge' ? (
          <span data-testid="add-fact-operator-label" className="text-xs text-[var(--muted-foreground)]">
            {OPERATOR_FACT_LABEL}
          </span>
        ) : null}
      </div>

      {frozen ? (
        <p data-testid="add-fact-frozen" className="text-xs text-[var(--muted-foreground)]">
          {FACTS_FROZEN_HINT}
        </p>
      ) : null}

      {kind === 'operator_knowledge' ? (
        <div>
          <label htmlFor="add-fact-text" className="text-xs text-[var(--muted-foreground)]">
            What you know
          </label>
          <Textarea
            id="add-fact-text"
            value={text}
            disabled={frozen || busy}
            onChange={(event) => setText(event.target.value)}
            placeholder="What you saw or were told, in your own words"
            className="mt-1"
          />
        </div>
      ) : (
        <div>
          <label htmlFor="add-fact-url" className="text-xs text-[var(--muted-foreground)]">
            URL
          </label>
          <Input
            id="add-fact-url"
            type="url"
            inputMode="url"
            value={url}
            disabled={frozen || busy}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            className="mt-1"
          />
          {url.trim().length > 0 && !urlReady ? (
            <p data-testid="add-fact-url-error" className="mt-1 text-xs text-[var(--destructive)]">
              {URL_HINT}
            </p>
          ) : null}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor="add-fact-title" className="text-xs text-[var(--muted-foreground)]">
            Title
          </label>
          <Input
            id="add-fact-title"
            value={title}
            disabled={frozen || busy}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short title (optional)"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="add-fact-date" className="text-xs text-[var(--muted-foreground)]">
            Observed on
          </label>
          <Input
            id="add-fact-date"
            type="date"
            value={observedAt}
            disabled={frozen || busy}
            onChange={(event) => setObservedAt(event.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {kind === 'public' ? (
        <div>
          <label htmlFor="add-fact-excerpt" className="text-xs text-[var(--muted-foreground)]">
            Excerpt
          </label>
          <Textarea
            id="add-fact-excerpt"
            value={excerpt}
            disabled={frozen || busy}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="The sentence that carries the fact (optional)"
            className="mt-1"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={submitGate.disabled} title={submitGate.title}>
          {busy ? 'Adding...' : 'Add fact'}
        </Button>
        {notice ? (
          <span data-testid="add-fact-notice" className="text-xs text-[var(--muted-foreground)]">
            {notice}
          </span>
        ) : null}
      </div>
      {error ? (
        <p data-testid="add-fact-error" role="alert" className="text-sm text-[var(--destructive)]">
          Refused: <code className="font-mono">{error}</code>
        </p>
      ) : null}
    </form>
  );
}
