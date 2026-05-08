import type { FootnoteData, ROISourceConfidence } from '@/lib/microsites/schema';

const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

/**
 * Inline numbered marker for a footnote — rendered as a small bracketed
 * monospace numeral instead of a CSS-default <sup>. Reads as academic
 * print rather than HTML default. The number is assigned by the section
 * renderer (M2.3) which walks all sections, collects footnotes in order
 * of appearance, and passes the resolved `n` here.
 */
export function FootnoteMarker({ n }: { n: number }) {
  return (
    <a
      href={`#fn-${n}`}
      aria-label={`Footnote ${n}`}
      className={`ml-0.5 inline-block align-baseline text-[0.72em] font-medium tracking-tight text-[var(--memo-accent)] no-underline hover:underline ${FONT_MONO}`}
    >
      [{n}]
    </a>
  );
}

const CONFIDENCE_LABEL: Record<ROISourceConfidence, string> = {
  measured: 'measured',
  public: 'public',
  estimated: 'estimated',
  inferred: 'inferred',
};

const CONFIDENCE_TONE: Record<ROISourceConfidence, string> = {
  measured: 'text-emerald-700',
  public: 'text-slate-600',
  estimated: 'text-amber-700',
  inferred: 'text-slate-500',
};

/**
 * Confidence tag rendered next to each footnote source. The earlier version
 * of this badge was a saturated pill (rounded-full with emerald/sky/amber
 * background fills) — that read as SaaS marketing, not memo. The new
 * version is a bracketed monospace tag, no background, hairline-tone-only.
 *
 * Shipping these inline with every claim is one of the trust mechanics of
 * the memo template — readers immediately see whether the underlying data
 * is a measured number, a public-data inference, or a soft estimate.
 */
export function ConfidenceBadge({ confidence }: { confidence: ROISourceConfidence }) {
  return (
    <span
      className={`inline-block text-[10px] uppercase tracking-[0.12em] ${CONFIDENCE_TONE[confidence]} ${FONT_MONO}`}
    >
      [{CONFIDENCE_LABEL[confidence]}]
    </span>
  );
}

export type NumberedFootnote = FootnoteData & { n: number };

/**
 * Bottom-of-page footnote list for the memo template. Set in the same
 * sans face as body metadata — footnotes are appendix copy, not
 * headlines. Same numbers as inline FootnoteMarker.
 */
export function FootnoteList({ footnotes }: { footnotes: NumberedFootnote[] }) {
  if (footnotes.length === 0) return null;
  return (
    <section
      aria-label="Methodology footnotes"
      className={`mt-16 border-t border-slate-200 pt-6 text-[13px] leading-[1.55] text-slate-600 ${FONT_SANS}`}
    >
      <p
        className={`mb-4 text-[10px] uppercase tracking-[0.22em] text-slate-500 ${FONT_MONO}`}
      >
        Sources
      </p>
      <ol className="space-y-3">
        {footnotes.map((fn) => (
          <li
            key={fn.id}
            id={`fn-${fn.n}`}
            className="grid grid-cols-[2rem_1fr] gap-x-3 scroll-mt-24"
          >
            <span
              className={`text-[11px] tracking-tight text-slate-400 ${FONT_MONO}`}
            >
              [{fn.n}]
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-slate-800">{fn.source}</span>
                <ConfidenceBadge confidence={fn.confidence} />
              </div>
              {fn.detail ? <p className="text-slate-600">{fn.detail}</p> : null}
              {fn.url ? (
                <a
                  href={fn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block break-all text-[12px] text-[var(--memo-accent)] hover:underline"
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
