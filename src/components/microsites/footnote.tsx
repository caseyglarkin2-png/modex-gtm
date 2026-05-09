import type { FootnoteData, ROISourceConfidence } from '@/lib/microsites/schema';

const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

/**
 * Inline numbered marker for a footnote — small bracketed monospace
 * superscript-ish. Keys to a fixed accent color (--memo-accent) so the
 * inline markers, the bottom-of-page list numbers, and the contents-rail
 * accent all align.
 */
export function FootnoteMarker({ n }: { n: number }) {
  return (
    <a
      href={`#fn-${n}`}
      aria-label={`Footnote ${n}`}
      className={`memo-fn-marker ml-0.5 inline-block align-baseline text-[0.72em] font-medium tracking-tight no-underline hover:underline ${FONT_MONO}`}
      style={{ color: 'var(--memo-accent)', verticalAlign: '1px' }}
    >
      [{n}]
    </a>
  );
}

const CONFIDENCE_LABEL: Record<ROISourceConfidence, string> = {
  measured: 'Measured',
  public: 'Public',
  estimated: 'Estimated',
  inferred: 'Inferred',
};

const CONFIDENCE_COLOR: Record<ROISourceConfidence, string> = {
  measured: '#047857',
  public: '#4a4641',
  estimated: '#b45309',
  inferred: '#6b7280',
};

/**
 * Confidence tag rendered next to each source. Renders as a colored dot +
 * uppercase mono label (no brackets). Pip color matches text color.
 *
 * Shipping these inline with every claim is one of the trust mechanics of
 * the memo template — readers see at a glance whether the underlying data
 * is measured, public-data inference, or a soft estimate.
 */
export function ConfidenceBadge({ confidence }: { confidence: ROISourceConfidence }) {
  const color = CONFIDENCE_COLOR[confidence];
  return (
    <span
      className={`inline-flex w-max items-center gap-1.5 text-[9.5px] uppercase tracking-[0.14em] ${FONT_MONO}`}
      style={{ color }}
    >
      <span
        aria-hidden="true"
        className="inline-block size-[5px] rounded-full"
        style={{ background: color }}
      />
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export type NumberedFootnote = FootnoteData & { n: number };

/**
 * Bottom-of-page footnote list — appendix material. Warm hairline rules
 * (dotted between entries), accent-colored footnote numbers, and the
 * uppercase mono "Sources" label that mirrors the contents-rail label.
 */
export function FootnoteList({ footnotes }: { footnotes: NumberedFootnote[] }) {
  if (footnotes.length === 0) return null;
  return (
    <section
      aria-label="Methodology footnotes"
      className={`mt-20 border-t border-[#d8d2c2] pt-8 text-[12.5px] leading-[1.55] text-[#4a4641] ${FONT_SANS}`}
    >
      <p
        className={`mb-5 text-[10px] uppercase tracking-[0.22em] text-[#8a847b] ${FONT_MONO}`}
      >
        Sources
      </p>
      <ol className="m-0 list-none p-0">
        {footnotes.map((fn, i) => (
          <li
            key={fn.id}
            id={`fn-${fn.n}`}
            className={`grid scroll-mt-20 grid-cols-[1.5rem_1fr] gap-x-3 py-3 ${
              i === 0 ? '' : 'border-t border-dotted border-[#d8d2c2]'
            }`}
          >
            <span
              className={`pt-px text-[10.5px] tracking-tight ${FONT_MONO}`}
              style={{ color: 'var(--memo-accent)' }}
            >
              [{fn.n}]
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-[#1a1a1a]">{fn.source}</span>
                <ConfidenceBadge confidence={fn.confidence} />
              </div>
              {fn.detail ? <p className="m-0 text-[#4a4641]">{fn.detail}</p> : null}
              {fn.url ? (
                <a
                  href={fn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block break-all text-[12px] hover:underline"
                  style={{ color: 'var(--memo-accent)' }}
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
