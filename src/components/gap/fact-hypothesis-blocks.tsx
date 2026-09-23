/**
 * FACT and HYPOTHESIS blocks (GAP Prospecting OS, Sprint 1, S1-T13).
 *
 * Pure presentational. The two blocks are built to be impossible to confuse:
 * different heading text, a solid left border on FACT versus a dashed border
 * on HYPOTHESIS, and an explicit caption under each ("Observed, cited" versus
 * "Seller inference, unproven"). Nothing here fetches or mutates.
 *
 * FACT renders each observation sentence with its `[S:<id>]` citations as
 * numbered links (href = the signal's evidence_url) or, when the signal has
 * no url, a numbered span whose title carries the evidence text or source
 * kind. Numbering follows first appearance across the whole observation so a
 * signal cited twice keeps one number.
 */

import type { ReactNode } from 'react';
import { extractCitationIds, splitSentences, stripCitations } from '@/lib/gap/hypothesis/observation';

export interface FactSignal {
  id: string;
  title?: string | null;
  source_kind?: string | null;
  evidence_url?: string | null;
  evidence_text?: string | null;
}

export interface FactBlockProps {
  observation: string;
  signals: readonly FactSignal[];
}

const BLOCK_BASE = 'rounded-md p-4 text-sm';

function Caption({ children }: { children: string }) {
  return <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{children}</p>;
}

function Citation({ number, signal }: { number: number; signal: FactSignal | undefined }) {
  const url = signal?.evidence_url?.trim();
  const shared = 'ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 align-baseline text-[11px] font-semibold';
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className={`${shared} border-[var(--primary)] text-[var(--primary)] no-underline hover:underline`}
      >
        {number}
      </a>
    );
  }
  const tooltip = signal?.evidence_text?.trim() || signal?.source_kind || 'signal not linked';
  return (
    <span title={tooltip} className={`${shared} border-[var(--border)] text-[var(--muted-foreground)]`}>
      {number}
    </span>
  );
}

export function FactBlock({ observation, signals }: FactBlockProps) {
  const sentences = splitSentences(observation ?? '');
  const order = extractCitationIds(observation ?? '');
  const numberOf = new Map<string, number>(order.map((id, index) => [id, index + 1]));
  const byId = new Map<string, FactSignal>(signals.map((signal) => [signal.id, signal]));
  const unsupported = sentences.length === 0;

  return (
    <section
      data-testid="fact-block"
      data-block="fact"
      {...(unsupported ? { 'data-state': 'unsupported' } : {})}
      className={`${BLOCK_BASE} border border-l-4 border-[var(--border)] border-l-emerald-600 bg-[var(--muted)]/60`}
    >
      <h3 className="text-xs font-bold tracking-[0.2em] text-emerald-700 dark:text-emerald-400">FACT</h3>
      <Caption>Observed, cited</Caption>
      {unsupported ? (
        <p className="mt-3 italic text-[var(--muted-foreground)]">No cited facts yet</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {sentences.map((sentence, index) => {
            const ids = extractCitationIds(sentence);
            return (
              <li key={index} className="leading-6">
                <span>{stripCitations(sentence)}</span>
                {ids.map((id) => (
                  <Citation key={id} number={numberOf.get(id) ?? 0} signal={byId.get(id)} />
                ))}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export interface HypothesisBlockProps {
  problemHypothesis: string;
  rootCauseHypotheses: readonly string[];
  impactHypotheses: readonly string[];
  whyNow: string | null | undefined;
  falsificationQuestions: readonly string[];
  whatANoMeans: string | null | undefined;
  confidence: number;
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</h4>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function BulletList({ items, empty }: { items: readonly string[]; empty: string }) {
  const kept = items.filter((item) => typeof item === 'string' && item.trim().length > 0);
  if (kept.length === 0) return <p className="italic text-[var(--muted-foreground)]">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {kept.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function HypothesisBlock({
  problemHypothesis,
  rootCauseHypotheses,
  impactHypotheses,
  whyNow,
  falsificationQuestions,
  whatANoMeans,
  confidence,
}: HypothesisBlockProps) {
  return (
    <section
      data-testid="hypothesis-block"
      data-block="hypothesis"
      className={`${BLOCK_BASE} border-2 border-dashed border-amber-500/70 bg-transparent`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-bold tracking-[0.2em] text-amber-700 dark:text-amber-400">HYPOTHESIS</h3>
        <span className="text-xs text-[var(--muted-foreground)]">confidence {confidence}%</span>
      </div>
      <Caption>Seller inference, unproven</Caption>
      <p className="mt-3 italic leading-6">{problemHypothesis}</p>

      <SubSection title="Root causes">
        <BulletList items={rootCauseHypotheses} empty="No root cause proposed" />
      </SubSection>
      <SubSection title="Impacts">
        <BulletList items={impactHypotheses} empty="No impact proposed" />
      </SubSection>
      <SubSection title="Why now">
        {whyNow && whyNow.trim().length > 0 ? (
          <p>{whyNow}</p>
        ) : (
          <p className="italic text-[var(--muted-foreground)]">No trigger named</p>
        )}
      </SubSection>
      <SubSection title="Would prove wrong">
        <BulletList items={falsificationQuestions} empty="No falsification question" />
        {whatANoMeans && whatANoMeans.trim().length > 0 ? (
          <p className="mt-2 text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">A no means: </span>
            {whatANoMeans}
          </p>
        ) : null}
      </SubSection>
    </section>
  );
}
