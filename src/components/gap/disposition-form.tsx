'use client';

/**
 * Disposition form (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * One form, two modes, one contract body. It posts EXACTLY the
 * `POST /api/gap/dispositions` shape through the injected client
 * (`buildDispositionBody` is pure and pinned by tests).
 *
 * Call mode (`mode="call"`, target under 30 seconds): a first row of four
 * large buttons, no_answer | voicemail | gatekeeper | conversation, on keys
 * 1 to 4. The first three post at once with channel `call`, the class as
 * chosen and no BID. `conversation` reveals the class chips (the fifteen
 * classes that are not call-only, keys a to o), then the root cause and
 * impact chips (only once a problem_* class is chosen), the buyer's words,
 * then <BidChips>.
 *
 * Reply mode (`mode="reply"`): the class chips straight away with the
 * reply's ids prefilled; call-only classes are absent from the form.
 *
 * Client-side rules mirror the disposition model the service applies, so the
 * obvious 400s are caught before the round trip: call-only classes only on
 * channel call; problem_confirmed and problem_partially_confirmed need the
 * buyer's words; root cause and impact only with a problem_* class;
 * existing_solution needs the objection. The server still decides, and its
 * 400 field or 409 reason is shown verbatim.
 *
 * An AI suggestion, when present, renders as a chip labelled exactly
 * `AI_SUGGESTION_LABEL` and NEVER pre-selects the class: the human clicks
 * "Use suggestion" or a chip. On 201 the effects show (stopped, unsubscribed,
 * resolution, mirrored) and one interaction ("Done" or Escape) clears.
 *
 * Keyboard: Enter submits when valid (Ctrl or Cmd plus Enter inside a
 * textarea), Escape clears.
 *
 * The form reads only contract fields. Voice: no em dashes, "yards" plural.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  PROBLEM_FAMILIES,
  PROBLEM_FAMILY_CATALOG,
  RESPONSE_CLASSES,
  isProblemFamily,
  type BidType,
  type Channel,
  type ProblemFamily,
  type ResponseClass,
} from '@/lib/gap/taxonomy';
import {
  defaultGapApiClient,
  type ApiErr,
  type DispositionBody,
  type DispositionResult,
  type DispositionSource,
  type GapApiClient,
  type ReplySuggestion,
} from '@/lib/gap/ui/gap-api-client';
import { BidChips, words, type BidDraft } from './bid-chips';

// ---------------------------------------------------------------------------
// Rules (the same the disposition model applies server-side)
// ---------------------------------------------------------------------------

/** Classes a disposition may carry only on channel `call`. */
export const CALL_ONLY_CLASSES = ['no_answer', 'voicemail', 'gatekeeper'] as const satisfies readonly ResponseClass[];
export type CallOnlyClass = (typeof CALL_ONLY_CLASSES)[number];

/** The fifteen classes offered once a conversation happened, in taxonomy order. */
export const CONVERSATION_CLASSES: readonly ResponseClass[] = RESPONSE_CLASSES.filter(
  (c) => !(CALL_ONLY_CLASSES as readonly string[]).includes(c),
);

export const PROBLEM_CLASSES = ['problem_confirmed', 'problem_partially_confirmed', 'problem_rejected'] as const satisfies readonly ResponseClass[];
export const QUOTE_REQUIRED_CLASSES = ['problem_confirmed', 'problem_partially_confirmed'] as const satisfies readonly ResponseClass[];
export const OBJECTION_REQUIRED_CLASSES = ['existing_solution'] as const satisfies readonly ResponseClass[];

export function isProblemClass(value: string | null): boolean {
  return value !== null && (PROBLEM_CLASSES as readonly string[]).includes(value);
}

/** Letter keys for the conversation classes: a, b, c ... in `CONVERSATION_CLASSES` order. */
export const CLASS_KEYS: ReadonlyMap<ResponseClass, string> = new Map(
  CONVERSATION_CLASSES.map((c, i) => [c, String.fromCharCode('a'.charCodeAt(0) + i)]),
);

/** The call-mode first row: three one-tap classes and the reveal. */
export const CALL_FIRST_ROW = [
  { key: '1', label: 'No answer', responseClass: 'no_answer' },
  { key: '2', label: 'Voicemail', responseClass: 'voicemail' },
  { key: '3', label: 'Gatekeeper', responseClass: 'gatekeeper' },
  { key: '4', label: 'Conversation', responseClass: null },
] as const satisfies ReadonlyArray<{ key: string; label: string; responseClass: CallOnlyClass | null }>;

export const AI_SUGGESTION_LABEL = 'suggested, not confirmed';

export type FormRefusal = 'class_required' | 'call_only_class' | 'quote_required' | 'requires_problem_class' | 'objection_required';

export const REFUSAL_TEXT: Record<FormRefusal, string> = {
  class_required: 'Pick a response class',
  call_only_class: 'That class is for calls only',
  quote_required: "A confirmation needs the buyer's words",
  requires_problem_class: 'Root cause and impact need a problem class',
  objection_required: 'Existing solution needs the objection',
};

export interface DispositionDraft {
  responseClass: ResponseClass | null;
  rootCauseClass: string;
  impactClass: string;
  objection: string;
  buyerLanguage: string;
  nextBestAction: string;
  bids: BidDraft[];
}

export interface DispositionPrefill {
  hypothesisId: string;
  personaId?: number | string | null;
  contactEmail: string;
  channel: Channel;
  source: DispositionSource;
  /** Narrows the root cause and impact chips to one family's catalog. */
  problemFamily?: string | null;
  aiSuggestionId?: string | null;
}

export type DraftRefusal = { field: keyof DispositionBody; reason: FormRefusal };

/** Pure. Null means the body may be posted. */
export function validateDraft(draft: DispositionDraft, channel: Channel): DraftRefusal | null {
  const cls = draft.responseClass;
  if (cls === null) return { field: 'responseClass', reason: 'class_required' };
  if ((CALL_ONLY_CLASSES as readonly string[]).includes(cls) && channel !== 'call') {
    return { field: 'responseClass', reason: 'call_only_class' };
  }
  const problem = isProblemClass(cls);
  if (!problem && draft.rootCauseClass.trim().length > 0) return { field: 'rootCauseClass', reason: 'requires_problem_class' };
  if (!problem && draft.impactClass.trim().length > 0) return { field: 'impactClass', reason: 'requires_problem_class' };
  if ((QUOTE_REQUIRED_CLASSES as readonly string[]).includes(cls) && draft.buyerLanguage.trim().length === 0) {
    return { field: 'buyerLanguage', reason: 'quote_required' };
  }
  if ((OBJECTION_REQUIRED_CLASSES as readonly string[]).includes(cls) && draft.objection.trim().length === 0) {
    return { field: 'objection', reason: 'objection_required' };
  }
  return null;
}

/** Pure. The contract body; empty optionals are omitted so the JSON carries no nulls. */
export function buildDispositionBody(prefill: DispositionPrefill, draft: DispositionDraft): DispositionBody {
  if (draft.responseClass === null) throw new Error('class_required');
  const body: DispositionBody = {
    hypothesisId: prefill.hypothesisId,
    contactEmail: prefill.contactEmail.trim().toLowerCase(),
    channel: prefill.channel,
    responseClass: draft.responseClass,
    source: { kind: prefill.source.kind, id: prefill.source.id },
  };
  if (prefill.personaId !== null && prefill.personaId !== undefined && prefill.personaId !== '') body.personaId = prefill.personaId;
  const rootCause = draft.rootCauseClass.trim();
  if (rootCause.length > 0) body.rootCauseClass = rootCause;
  const impact = draft.impactClass.trim();
  if (impact.length > 0) body.impactClass = impact;
  const objection = draft.objection.trim();
  if (objection.length > 0) body.objection = objection;
  const quote = draft.buyerLanguage.trim();
  if (quote.length > 0) body.buyerLanguage = quote;
  const next = draft.nextBestAction.trim();
  if (next.length > 0) body.nextBestAction = next;
  if (draft.bids.length > 0) body.bids = draft.bids.map((bid) => ({ ...bid }));
  if (prefill.aiSuggestionId) body.aiSuggestionId = prefill.aiSuggestionId;
  return body;
}

export function emptyDraft(): DispositionDraft {
  return { responseClass: null, rootCauseClass: '', impactClass: '', objection: '', buyerLanguage: '', nextBestAction: '', bids: [] };
}

/** Root cause and impact chip labels: one family's catalog, else the union across families. */
export function chipOptions(problemFamily: string | null | undefined): { causes: string[]; impacts: string[] } {
  const families: readonly ProblemFamily[] = isProblemFamily(problemFamily) ? [problemFamily] : PROBLEM_FAMILIES;
  const causes = new Set<string>();
  const impacts = new Set<string>();
  for (const family of families) {
    for (const cause of PROBLEM_FAMILY_CATALOG[family].likelyCauses) causes.add(cause);
    for (const impact of PROBLEM_FAMILY_CATALOG[family].impacts) impacts.add(impact);
  }
  return { causes: [...causes], impacts: [...impacts] };
}

/** How the server's refusal is shown: the 409 reason verbatim, the 400 field named. */
export function describeRefusal(err: ApiErr): string {
  if (err.status === 400 && err.field) return `${err.error}: ${err.field}`;
  return err.error;
}

function isTypingTarget(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="mr-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded border border-[var(--border)] px-1 font-mono text-[10px] text-[var(--muted-foreground)]">
      {children}
    </kbd>
  );
}

export function AiSuggestionChip({ suggestion }: { suggestion: ReplySuggestion }) {
  return (
    <Badge data-testid="ai-suggestion" variant="warning" title={suggestion.why}>
      {AI_SUGGESTION_LABEL}: {words(String(suggestion.responseClass))}
    </Badge>
  );
}

interface ChipRowProps {
  label: string;
  testPrefix: string;
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
  disabled: boolean;
  keys?: ReadonlyMap<string, string>;
}

function ChipRow({ label, testPrefix, options, selected, onSelect, disabled, keys }: ChipRowProps) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected === option;
          const key = keys?.get(option);
          return (
            <button
              key={option}
              type="button"
              data-testid={`${testPrefix}-${option}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(active ? '' : option)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'border-[var(--border)] bg-transparent hover:bg-[var(--muted)]'
              }`}
            >
              {key ? <Kbd>{key}</Kbd> : null}
              {words(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EffectsPanel({ result, onDone }: { result: DispositionResult; onDone: () => void }) {
  const effects = result.effects;
  const stopped = Array.isArray(effects?.stopped) ? effects.stopped.length : 0;
  return (
    <div data-testid="disposition-effects" className="space-y-2 rounded-md border border-emerald-600/40 bg-emerald-500/5 p-4 text-sm">
      <p className="font-medium">Recorded</p>
      <ul className="space-y-1">
        <li data-testid="effect-stopped">
          Stopped {stopped} {stopped === 1 ? 'enrollment' : 'enrollments'}
        </li>
        <li data-testid="effect-unsubscribed">Unsubscribed: {effects?.unsubscribed ? 'yes' : 'no'}</li>
        <li data-testid="effect-resolution">
          {effects?.resolution
            ? `Resolution: ${words(String(effects.resolution.outcome))}, confidence ${effects.resolution.confidence}%`
            : 'Resolution: none'}
        </li>
        <li data-testid="effect-mirrored">Mirrored to HubSpot: {effects?.mirrored ? 'yes' : 'no'}</li>
        {Array.isArray(result.bidIds) && result.bidIds.length > 0 ? <li>{result.bidIds.length} BID captured</li> : null}
      </ul>
      <Button type="button" size="sm" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DispositionFormProps {
  mode: 'call' | 'reply';
  prefill: DispositionPrefill;
  suggestion?: ReplySuggestion | null;
  client?: GapApiClient;
  onSubmitted?: (result: DispositionResult) => void;
  onCleared?: () => void;
  autoFocus?: boolean;
}

export function DispositionForm({
  mode,
  prefill,
  suggestion = null,
  client = defaultGapApiClient,
  onSubmitted,
  onCleared,
  autoFocus = true,
}: DispositionFormProps) {
  const channel: Channel = mode === 'call' ? 'call' : prefill.channel;
  const [stage, setStage] = useState<'first_row' | 'classes'>(mode === 'call' ? 'first_row' : 'classes');
  const [draft, setDraft] = useState<DispositionDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState<DraftRefusal | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<DispositionResult | null>(null);
  const [bidSeed, setBidSeed] = useState<{ type: BidType; quote: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);

  const options = useMemo(() => chipOptions(prefill.problemFamily), [prefill.problemFamily]);
  const refusal = validateDraft(draft, channel);
  const problem = isProblemClass(draft.responseClass);
  // Weekend reduction (2026-09-26): when the suggested class needs nothing else (no buyer
  // quote, no objection), agreeing with it is ONE human click that records it. A class that
  // needs the buyer's words still goes through the form; the AI never records anything alone.
  const confirmable = useMemo(() => {
    if (mode !== 'reply' || !suggestion) return null;
    const cls = String(suggestion.responseClass);
    if (!(CONVERSATION_CLASSES as readonly string[]).includes(cls)) return null;
    const candidate: DispositionDraft = { ...emptyDraft(), responseClass: cls as ResponseClass };
    return validateDraft(candidate, channel) === null ? candidate : null;
  }, [mode, suggestion, channel]);

  useEffect(() => {
    if (autoFocus) formRef.current?.focus();
  }, [autoFocus]);

  const patch = useCallback((changes: Partial<DispositionDraft>) => {
    setClientError(null);
    setServerError(null);
    setDraft((current) => ({ ...current, ...changes }));
  }, []);

  function clear() {
    setStage(mode === 'call' ? 'first_row' : 'classes');
    setDraft(emptyDraft());
    setClientError(null);
    setServerError(null);
    setResult(null);
    setBidSeed(null);
    onCleared?.();
  }

  const post = useCallback(
    async (candidate: DispositionDraft) => {
      if (inFlight.current) return;
      const check = validateDraft(candidate, channel);
      if (check) {
        setClientError(check);
        return;
      }
      inFlight.current = true;
      setSubmitting(true);
      setClientError(null);
      setServerError(null);
      try {
        const answer = await client.postDisposition(buildDispositionBody({ ...prefill, channel }, candidate));
        if (answer.ok) {
          setResult(answer.data);
          onSubmitted?.(answer.data);
        } else {
          setServerError(describeRefusal(answer));
        }
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    },
    [channel, client, onSubmitted, prefill],
  );

  function selectClass(next: ResponseClass) {
    const cleared = isProblemClass(next) ? {} : { rootCauseClass: '', impactClass: '' };
    patch({ responseClass: draft.responseClass === next ? null : next, ...cleared });
  }

  /** One tap: post the call-only class with nothing else. */
  function oneTap(cls: CallOnlyClass) {
    const candidate: DispositionDraft = { ...emptyDraft(), responseClass: cls };
    setDraft(candidate);
    void post(candidate);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      clear();
      return;
    }
    if (result || submitting) return;
    const typing = isTypingTarget(event.target);
    if (event.key === 'Enter') {
      if (event.target instanceof HTMLButtonElement) return;
      if (event.target instanceof HTMLTextAreaElement && !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      if (refusal === null) void post(draft);
      else setClientError(refusal);
      return;
    }
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (mode === 'call' && stage === 'first_row') {
      const row = CALL_FIRST_ROW.find((entry) => entry.key === event.key);
      if (!row) return;
      event.preventDefault();
      if (row.responseClass) oneTap(row.responseClass);
      else setStage('classes');
      return;
    }
    if (stage === 'classes') {
      for (const [cls, key] of CLASS_KEYS) {
        if (key === event.key) {
          event.preventDefault();
          selectClass(cls);
          return;
        }
      }
    }
  }

  const busy = submitting || result !== null;

  return (
    <form
      ref={formRef}
      tabIndex={-1}
      data-testid="disposition-form"
      data-mode={mode}
      data-channel={channel}
      onKeyDown={onKeyDown}
      onSubmit={(event) => {
        event.preventDefault();
        if (refusal === null) void post(draft);
        else setClientError(refusal);
      }}
      className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span>{prefill.contactEmail}</span>
        <Badge variant="outline">{channel}</Badge>
        {suggestion ? <AiSuggestionChip suggestion={suggestion} /> : null}
        {suggestion && !result ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (stage === 'first_row') setStage('classes');
              const cls = String(suggestion.responseClass);
              if ((CONVERSATION_CLASSES as readonly string[]).includes(cls)) patch({ responseClass: cls as ResponseClass });
            }}
          >
            Use suggestion
          </Button>
        ) : null}
        {confirmable && !result ? (
          <Button type="button" size="sm" data-testid="confirm-suggestion" disabled={busy} onClick={() => void post(confirmable)}>
            Confirm: {words(String(confirmable.responseClass))}
          </Button>
        ) : null}
      </div>

      {result ? (
        <EffectsPanel result={result} onDone={clear} />
      ) : (
        <>
          {mode === 'call' && stage === 'first_row' ? (
            <div data-testid="call-first-row" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CALL_FIRST_ROW.map((entry) => (
                <Button
                  key={entry.key}
                  type="button"
                  size="lg"
                  variant={entry.responseClass ? 'outline' : 'default'}
                  data-testid={`call-tap-${entry.responseClass ?? 'conversation'}`}
                  disabled={busy}
                  className="h-14 text-base"
                  onClick={() => (entry.responseClass ? oneTap(entry.responseClass) : setStage('classes'))}
                >
                  <Kbd>{entry.key}</Kbd>
                  {entry.label}
                </Button>
              ))}
            </div>
          ) : null}

          {stage === 'classes' ? (
            <div className="space-y-4">
              <ChipRow
                label="Response class"
                testPrefix="class-chip"
                options={CONVERSATION_CLASSES}
                selected={draft.responseClass ?? ''}
                onSelect={(value) => (value ? selectClass(value as ResponseClass) : patch({ responseClass: null }))}
                disabled={busy}
                keys={CLASS_KEYS as ReadonlyMap<string, string>}
              />

              {problem ? (
                <>
                  <ChipRow
                    label="Root cause"
                    testPrefix="root-cause-chip"
                    options={options.causes}
                    selected={draft.rootCauseClass}
                    onSelect={(value) => patch({ rootCauseClass: value })}
                    disabled={busy}
                  />
                  <ChipRow
                    label="Impact"
                    testPrefix="impact-chip"
                    options={options.impacts}
                    selected={draft.impactClass}
                    onSelect={(value) => patch({ impactClass: value })}
                    disabled={busy}
                  />
                </>
              ) : null}

              <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                Buyer&apos;s words{draft.responseClass && (QUOTE_REQUIRED_CLASSES as readonly string[]).includes(draft.responseClass) ? ' (required)' : ''}
                <Textarea
                  aria-label="Buyer language"
                  value={draft.buyerLanguage}
                  disabled={busy}
                  onChange={(event) => patch({ buyerLanguage: event.target.value })}
                  placeholder="What they said about the problem, verbatim"
                  rows={2}
                />
              </label>

              {draft.responseClass === 'existing_solution' || draft.objection.length > 0 ? (
                <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                  Objection{draft.responseClass === 'existing_solution' ? ' (required)' : ''}
                  <Input
                    aria-label="Objection"
                    value={draft.objection}
                    disabled={busy}
                    onChange={(event) => patch({ objection: event.target.value })}
                    placeholder="Already runs a yard management system"
                  />
                </label>
              ) : null}

              <label className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                Next best action (optional)
                <Input
                  aria-label="Next best action"
                  value={draft.nextBestAction}
                  disabled={busy}
                  onChange={(event) => patch({ nextBestAction: event.target.value })}
                  placeholder="Send the two-site comparison by Friday"
                />
              </label>

              {suggestion && suggestion.bids.length > 0 ? (
                <div data-testid="suggested-bids" className="space-y-1 text-xs text-[var(--muted-foreground)]">
                  <p className="font-semibold uppercase tracking-wide">Suggested quotes ({AI_SUGGESTION_LABEL})</p>
                  {suggestion.bids.map((bid, index) => (
                    <p key={index} className="flex items-start gap-2">
                      <Badge variant="outline">{words(String(bid.type))}</Badge>
                      <q className="flex-1">{bid.quote}</q>
                      <button
                        type="button"
                        className="underline"
                        disabled={busy}
                        onClick={() => setBidSeed({ type: bid.type as BidType, quote: bid.quote })}
                      >
                        use
                      </button>
                    </p>
                  ))}
                </div>
              ) : null}

              <BidChips
                value={draft.bids}
                onChange={(bids) => patch({ bids })}
                disabled={busy}
                seed={bidSeed}
                onSeedConsumed={() => setBidSeed(null)}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="sm" data-testid="disposition-submit" disabled={busy || refusal !== null} {...(refusal ? { title: REFUSAL_TEXT[refusal.reason] } : {})}>
                  {submitting ? 'Saving...' : 'Record disposition'}
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={submitting} onClick={clear}>
                  Clear
                </Button>
                <span className="text-xs text-[var(--muted-foreground)]">Enter records, Esc clears</span>
              </div>
            </div>
          ) : null}
        </>
      )}

      {clientError ? (
        <p role="alert" data-testid="client-error" data-field={clientError.field} className="text-xs text-[var(--destructive)]">
          {REFUSAL_TEXT[clientError.reason]}
        </p>
      ) : null}
      {serverError ? (
        <p role="alert" data-testid="server-error" className="text-xs text-[var(--destructive)]">
          {serverError}
        </p>
      ) : null}
    </form>
  );
}
