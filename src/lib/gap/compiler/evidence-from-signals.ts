/**
 * Linked signals -> compile evidence refs (R3-3, 2026-09-23). Pure.
 *
 * The compile route builds its contract SERVER-SIDE: the evidence a step may
 * cite is the hypothesis's linked `ProspectingSignal` rows, projected here,
 * never a list the caller sends. Every flag fails closed: `external_ok` null
 * reads false, `fresh` is the ONE freshness authority (research/currentness.ts,
 * acceptance batch item 2a: the clock approval, routing and the draftable list
 * read, so an approved story never dead-ends at "cites stale evidence"),
 * `superseded` is only `metadata.superseded === true`, and first-party is the
 * source type alone.
 *
 * This is the enroll service's `evidenceRefsFromSignals` moved to the
 * compiler it serves; the service keeps its own copy until the lead switches
 * that import (tests/unit/gap/evidence-from-signals.test.ts pins parity).
 */

import type { CompileEvidenceRef } from './types';
import { isCurrentFact, isUsableFact } from '../research/currentness';

export interface SignalRow {
  id: string;
  title: string | null;
  evidence_url: string | null;
  external_ok: boolean | null;
  observed_at: Date | string;
  freshness_expires_at: Date | string | null;
  source_type: string | null;
  metadata?: unknown;
  /** Loaded by EVIDENCE_SIGNAL_SELECT; a loaded blank is a keyword hit (red team T6). */
  evidence_text?: string | null;
  source_kind?: string | null;
  /** Item 2a: the signal type, whose window the freshness authority reads. */
  type?: string | null;
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
    const fresh = isCurrentFact(s, now);
    // I06: usable is the gate; fresh stays the label, and the date rides so a historical fact can be cited with it.
    const usable = isUsableFact(s, now);
    const observedAt = s.observed_at ? new Date(s.observed_at as Date | string).toISOString() : null;
    const superseded = isObj(s.metadata) && s.metadata.superseded === true;
    // Red team T6: a loaded signal that quotes nothing is a keyword hit. It
    // names a document; it does not show a fact, so it is never citable.
    const operator = s.source_kind === 'operator_knowledge' || s.source_kind === 'manual';
    const keywordOnly = s.evidence_text !== undefined && !operator && !(s.evidence_text ?? '').trim();
    // Red team T7: the first touch quotes the fact verbatim, so C01 must see
    // the quoted text to cover the numbers in it ("On July 1, 2026, ...").
    const excerpt = (s.evidence_text ?? '').trim();
    out.push({
      id: s.id,
      title: s.title ?? '',
      url: s.evidence_url ?? null,
      ...(excerpt ? { excerpt } : {}),
      externalOk: s.external_ok === true && !keywordOnly,
      ...(keywordOnly ? { keywordOnly: true } : {}),
      fresh,
      usable,
      observedAt,
      superseded,
      firstParty: isFirstParty(s.source_type ?? ''),
    });
  }
  return out;
}
