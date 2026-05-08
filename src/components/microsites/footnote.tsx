import type { FootnoteData, ROISourceConfidence } from '@/lib/microsites/schema';

/**
 * Inline superscript marker for a footnote — `text¹`. The number is
 * assigned by the section renderer (M2.3) which walks all sections,
 * collects footnotes in order of appearance, and passes the resolved
 * `n` here.
 */
export function FootnoteMarker({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 align-super text-[0.65em] font-semibold text-[var(--memo-accent,theme(colors.cyan.700))]">
      <a
        href={`#fn-${n}`}
        className="no-underline hover:underline"
        aria-label={`Footnote ${n}`}
      >
        {n}
      </a>
    </sup>
  );
}

const CONFIDENCE_LABEL: Record<ROISourceConfidence, string> = {
  measured: 'Measured',
  public: 'Public data',
  estimated: 'Estimated',
  inferred: 'Inferred',
};

const CONFIDENCE_TONE: Record<ROISourceConfidence, string> = {
  measured: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  public: 'border-sky-300 bg-sky-50 text-sky-800',
  estimated: 'border-amber-300 bg-amber-50 text-amber-900',
  inferred: 'border-slate-300 bg-slate-50 text-slate-700',
};

/**
 * Confidence pill rendered next to each footnote source. Shipping these
 * inline with every claim is one of the trust mechanics of the memo
 * template — readers immediately see whether the underlying data is a
 * measured number, a public-data inference, or a soft estimate.
 */
export function ConfidenceBadge({ confidence }: { confidence: ROISourceConfidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${CONFIDENCE_TONE[confidence]}`}
    >
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export type NumberedFootnote = FootnoteData & { n: number };

/**
 * Bottom-of-page footnote list for the memo template. The renderer is
 * responsible for collecting unique footnotes from all sections (in order
 * of first appearance) and passing them here numbered. Same numbers
 * reused inline by FootnoteMarker.
 */
export function FootnoteList({ footnotes }: { footnotes: NumberedFootnote[] }) {
  if (footnotes.length === 0) return null;
  return (
    <section
      aria-label="Methodology footnotes"
      className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600"
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        Sources &amp; methodology notes
      </p>
      <ol className="space-y-2.5 font-serif">
        {footnotes.map((fn) => (
          <li
            key={fn.id}
            id={`fn-${fn.n}`}
            className="grid grid-cols-[1.5rem_1fr] gap-x-2 leading-relaxed scroll-mt-24"
          >
            <span className="font-semibold text-slate-700">{fn.n}.</span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-medium text-slate-800">{fn.source}</span>
                <ConfidenceBadge confidence={fn.confidence} />
              </div>
              {fn.detail ? <p className="text-slate-600">{fn.detail}</p> : null}
              {fn.url ? (
                <a
                  href={fn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block break-all text-xs text-cyan-700 hover:underline"
                >
                  {fn.url}
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Number a list of footnotes by order of first appearance. Same id passed
 * twice gets the same number. Used by the section renderer to keep inline
 * markers and the bottom list in sync.
 */
export function numberFootnotes(footnotes: FootnoteData[]): NumberedFootnote[] {
  const seen = new Map<string, NumberedFootnote>();
  for (const fn of footnotes) {
    if (seen.has(fn.id)) continue;
    seen.set(fn.id, { ...fn, n: seen.size + 1 });
  }
  return [...seen.values()];
}
