/**
 * Linked signals -> compile evidence refs (R3-3, 2026-09-23). Pure.
 *
 * The compile route builds its contract SERVER-SIDE: the evidence a step may
 * cite is the hypothesis's linked `ProspectingSignal` rows, projected here,
 * never a list the caller sends. Every flag fails closed: `external_ok` null
 * reads false, an unstated freshness reads from `observed_at` against the
 * spec's 45-day window (section 6), `superseded` is only `metadata.superseded
 * === true`, and first-party is the source type alone.
 *
 * This is the enroll service's `evidenceRefsFromSignals` moved to the
 * compiler it serves; the service keeps its own copy until the lead switches
 * that import (tests/unit/gap/evidence-from-signals.test.ts pins parity).
 */

import type { CompileEvidenceRef } from './types';

/** Evidence freshness window for a per-hypothesis compile contract (spec section 6, 45 days). */
export const EVIDENCE_MAX_AGE_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SignalRow {
  id: string;
  title: string | null;
  evidence_url: string | null;
  external_ok: boolean | null;
  observed_at: Date | string;
  freshness_expires_at: Date | string | null;
  source_type: string | null;
  metadata?: unknown;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFirstParty(sourceType: string): boolean {
  return sourceType.startsWith('first_party') || sourceType === 'crm' || sourceType === 'manual';
}

/** Linked signals as compile evidence refs, fail-closed on every unstated flag. */
export function evidenceRefsFromSignals(signals: readonly SignalRow[], now: Date): CompileEvidenceRef[] {
  const out: CompileEvidenceRef[] = [];
  for (const s of signals) {
    if (!s || typeof s.id !== 'string') continue;
    const observed = s.observed_at instanceof Date ? s.observed_at : new Date(s.observed_at);
    const expires = s.freshness_expires_at
      ? s.freshness_expires_at instanceof Date
        ? s.freshness_expires_at
        : new Date(s.freshness_expires_at)
      : null;
    const fresh = expires
      ? expires.getTime() > now.getTime()
      : !Number.isNaN(observed.getTime()) && now.getTime() - observed.getTime() <= EVIDENCE_MAX_AGE_DAYS * DAY_MS;
    const superseded = isObj(s.metadata) && s.metadata.superseded === true;
    out.push({
      id: s.id,
      title: s.title ?? '',
      url: s.evidence_url ?? null,
      externalOk: s.external_ok === true,
      fresh,
      superseded,
      firstParty: isFirstParty(s.source_type ?? ''),
    });
  }
  return out;
}
