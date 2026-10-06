'use client';

/**
 * Call mode client (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Loads the pre-call brief through the GAP API client, renders
 * <PreCallBrief> above <DispositionForm mode="call">. The form's source is
 * `{ kind: 'call', id }` with a fresh id per attempt (the unique
 * `(source_kind, source_id)` makes each call disposition idempotent on its
 * own id); a new id is issued after every recorded disposition so a second
 * call on the same persona never collides with the first.
 */

import { useCallback, useEffect, useState } from 'react';
import { defaultGapApiClient, type CallBrief, type CallPursuit, type GapApiClient } from '@/lib/gap/ui/gap-api-client';
import { DispositionForm } from '@/components/gap/disposition-form';
import { PreCallBrief } from '@/components/gap/pre-call-brief';

export function callSourceId(personaId: string, now: () => number = Date.now): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
  return `call:${personaId}:${now()}:${random}`;
}

/** The route param as the API expects it: a number when it is one, else the string. */
export function personaIdParam(raw: string): number | string {
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

export function CallMode({
  personaId,
  client = defaultGapApiClient,
  onRecorded,
  hypothesis,
  hideContact = false,
}: {
  personaId: string;
  /** Execution acceptance: hide the prospect's email and phone in the brief (see PreCallBrief). */
  hideContact?: boolean;
  client?: GapApiClient;
  /**
   * Release C review SF2: the card's own hypothesis. The brief picks the
   * persona's newest hypothesis, which can be a different card's; an inline
   * call records against the card it was opened from.
   */
  hypothesis?: { id: string; problemFamily: string };
  /** Red team T8: the class just recorded, so an inline caller can keep a no-answer card retryable. */
  onRecorded?: (responseClass: string) => void;
}) {
  const [brief, setBrief] = useState<CallBrief | null>(null);
  // UX-06: undefined while checking, null when unreadable (no opener either way), else the account's state.
  const [pursuit, setPursuit] = useState<CallPursuit | null | undefined>(client.getCallPursuit ? undefined : null);
  const [pursuitChecked, setPursuitChecked] = useState(!client.getCallPursuit);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceId, setSourceId] = useState(() => callSourceId(personaId));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Ops closeout 17: the brief of the CARD's hypothesis (the one this call records against).
    const answer = hypothesis?.id ? await client.getCallBrief(personaIdParam(personaId), hypothesis.id) : await client.getCallBrief(personaIdParam(personaId));
    if (answer.ok) setBrief(answer.data);
    else setError(answer.error);
    setLoading(false);
  }, [client, personaId, hypothesis?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!client.getCallPursuit) return;
    let alive = true;
    void client.getCallPursuit(personaIdParam(personaId)).then((r) => {
      if (!alive) return;
      setPursuit(r.ok ? r.data.pursuit : null);
      setPursuitChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [client, personaId]);

  if (loading) return <p className="text-sm italic text-[var(--muted-foreground)]">Loading the brief...</p>;
  if (error || !brief) {
    return (
      <p role="alert" className="text-sm text-[var(--destructive)]">
        Could not load the brief: <code className="font-mono">{error ?? 'empty'}</code>
      </p>
    );
  }

  const contactEmail = brief.persona?.email ?? '';

  return (
    <div className="space-y-6">
      <PreCallBrief brief={{ ...brief, pursuit: pursuit ?? null }} hideContact={hideContact} checking={!pursuitChecked} stateUnreadable={pursuitChecked && !!client.getCallPursuit && pursuit === null} />
      {(hypothesis ?? brief.hypothesis) && contactEmail ? (
        <DispositionForm
          key={sourceId}
          mode="call"
          client={client}
          prefill={{
            hypothesisId: (hypothesis ?? brief.hypothesis)!.id,
            personaId: brief.persona.id,
            contactEmail,
            channel: 'call',
            source: { kind: 'call', id: sourceId },
            problemFamily: (hypothesis ?? brief.hypothesis)!.problemFamily,
          }}
          onSubmitted={(_result, responseClass) => {
            // SHOULD FIX (Opus adversarial review, 2026-09-24): a submit
            // alone never cleared the form (that only happens on Escape or
            // an explicit reset), so `sourceId` survived a successful post
            // and a second genuine call tap reused it, colliding with the
            // first on the unique (source_kind, source_id) and reading back
            // as a 409 -- exactly the case the module doc above already
            // promised was handled ("a new id is issued after every
            // recorded disposition"), but the code never did it.
            setSourceId(callSourceId(personaId));
            onRecorded?.(responseClass);
            void load();
          }}
          onCleared={() => setSourceId(callSourceId(personaId))}
        />
      ) : (
        <p data-testid="call-form-unavailable" className="text-sm italic text-[var(--muted-foreground)]">
          {brief.hypothesis ? 'This persona has no email on file, so a disposition cannot be keyed to a contact.' : 'No active hypothesis to disposition against.'}
        </p>
      )}
    </div>
  );
}
