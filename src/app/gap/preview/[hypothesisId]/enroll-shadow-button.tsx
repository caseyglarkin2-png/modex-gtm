'use client';

/**
 * "Emit enroll row (shadow)" (GAP Prospecting OS, Sprint 3, S3-T12).
 *
 * The only action the preview page offers this sprint. POSTs
 * /api/gap/enroll with `mode: 'shadow'`, which the service answers by
 * auditing the would-be row and creating nothing. There is deliberately no
 * live button here (spec section 10, progression step 3 is human-reviewed
 * enrollment through the enroll table; the live path stays on the API with
 * `confirm: true`). The route's `error` string is surfaced verbatim.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface EnrollShadowButtonProps {
  hypothesisId: string;
  personaId: number;
  sequenceVersionId: string;
  compileIds: string[];
  decisionId?: string | null;
  disabled?: boolean;
}

type Outcome = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; summary: string } | { kind: 'error'; error: string };

function summarize(result: Record<string, unknown>): string {
  if (result.kind === 'enroll_row') {
    const row = result.row as { enrollCount?: number; skipCount?: number } | undefined;
    return `enroll row emitted (shadow): ${row?.enrollCount ?? 0} to enroll, ${row?.skipCount ?? 0} skipped`;
  }
  if (result.kind === 'modex_shadow') {
    const wouldBe = result.wouldBe as { toEmail?: string } | undefined;
    return `would queue step 0 to ${wouldBe?.toEmail ?? 'unknown'} (shadow, nothing created)`;
  }
  return `shadow result: ${String(result.kind ?? 'ok')}`;
}

export function EnrollShadowButton({
  hypothesisId,
  personaId,
  sequenceVersionId,
  compileIds,
  decisionId,
  disabled,
}: EnrollShadowButtonProps) {
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });

  async function emit() {
    setOutcome({ kind: 'busy' });
    try {
      const res = await fetch('/api/gap/enroll', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          hypothesisId,
          personaId,
          sequenceVersionId,
          compileIds,
          ...(decisionId ? { decisionId } : {}),
          mode: 'shadow',
        }),
      });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const error = typeof body.error === 'string' ? body.error : typeof body.reason === 'string' ? body.reason : `HTTP ${res.status}`;
        setOutcome({ kind: 'error', error });
        return;
      }
      setOutcome({ kind: 'ok', summary: summarize(body) });
    } catch (err) {
      setOutcome({ kind: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={emit} disabled={disabled || outcome.kind === 'busy'} data-testid="emit-enroll-row">
        {outcome.kind === 'busy' ? 'Emitting' : 'Emit enroll row (shadow)'}
      </Button>
      {outcome.kind === 'ok' ? <span className="text-sm text-emerald-700 dark:text-emerald-400">{outcome.summary}</span> : null}
      {outcome.kind === 'error' ? (
        <span className="text-sm text-[var(--destructive)]" role="alert">
          {outcome.error}
        </span>
      ) : null}
    </div>
  );
}
