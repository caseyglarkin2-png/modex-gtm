/**
 * Sibling hypotheses: one account thesis, several people (group review, 2026-09-25).
 *
 * The dogfood cohort wrote one hypothesis row per person (PepsiCo has nine),
 * and routing/execution still need that per-person row. Review does not: the
 * thesis is one intellectual decision. This module DERIVES a group, no schema:
 * rows share a group only when their material thesis is identical:
 *
 *   account_name, problem_family, the observation (citation tokens kept, so
 *   the cited facts must be the same), problem_hypothesis, root causes,
 *   impacts, falsification questions, what a "no" means, and the exact set of
 *   linked signals.
 *
 * Persona and primary_persona_id may differ; status may differ (a group can
 * hold drafts and already-active rows). Same account + same family alone is
 * NOT enough: different evidence or a different causal thesis is a different
 * group. The fingerprint is deterministic (sha256 of the normalized parts).
 */
import { createHash } from 'node:crypto';

export interface ThesisRow {
  id: string;
  account_name: string;
  problem_family: string;
  observation: string | null;
  problem_hypothesis: string | null;
  root_cause_hypotheses: unknown;
  impact_hypotheses: unknown;
  falsification_questions: unknown;
  what_a_no_means: string | null;
  status: string;
  primary_persona_id: number | null;
  signalIds: string[];
}

const norm = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map(norm).sort() : []);

export function thesisFingerprint(row: ThesisRow): string {
  const parts = {
    account: norm(row.account_name),
    family: norm(row.problem_family),
    observation: norm(row.observation),
    hypothesis: norm(row.problem_hypothesis),
    rootCauses: list(row.root_cause_hypotheses),
    impacts: list(row.impact_hypotheses),
    falsification: list(row.falsification_questions),
    whatANoMeans: norm(row.what_a_no_means),
    signals: [...new Set(row.signalIds)].sort(),
  };
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

export interface ThesisGroup<T extends ThesisRow = ThesisRow> {
  fingerprint: string;
  accountName: string;
  problemFamily: string;
  members: T[];
}

/** Groups of two or more rows sharing one material thesis. Singletons are not groups. */
export function groupSiblings<T extends ThesisRow>(rows: readonly T[]): ThesisGroup<T>[] {
  const by = new Map<string, T[]>();
  for (const r of rows) {
    const fp = thesisFingerprint(r);
    by.set(fp, [...(by.get(fp) ?? []), r]);
  }
  return [...by.entries()]
    .filter(([, members]) => members.length >= 2)
    .map(([fingerprint, members]) => ({ fingerprint, accountName: members[0].account_name, problemFamily: members[0].problem_family, members }));
}

/** Statuses a group review may move forward (the machine's reviewable states). */
export const REVIEWABLE_STATUSES: ReadonlySet<string> = new Set(['draft', 'review_required']);
