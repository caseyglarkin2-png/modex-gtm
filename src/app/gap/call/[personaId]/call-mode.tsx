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
import { defaultGapApiClient, type CallBrief, type GapApiClient } from '@/lib/gap/ui/gap-api-client';
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

export function CallMode({ personaId, client = defaultGapApiClient }: { personaId: string; client?: GapApiClient }) {
  const [brief, setBrief] = useState<CallBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceId, setSourceId] = useState(() => callSourceId(personaId));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const answer = await client.getCallBrief(personaIdParam(personaId));
    if (answer.ok) setBrief(answer.data);
    else setError(answer.error);
    setLoading(false);
  }, [client, personaId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      <PreCallBrief brief={brief} />
      {brief.hypothesis && contactEmail ? (
        <DispositionForm
          key={sourceId}
          mode="call"
          client={client}
          prefill={{
            hypothesisId: brief.hypothesis.id,
            personaId: brief.persona.id,
            contactEmail,
            channel: 'call',
            source: { kind: 'call', id: sourceId },
            problemFamily: brief.hypothesis.problemFamily,
          }}
          onSubmitted={() => void load()}
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
