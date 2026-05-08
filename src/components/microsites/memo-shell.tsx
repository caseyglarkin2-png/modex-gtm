import type { ReactNode } from 'react';
import { getMemoAccent } from './memo-theme';

interface MemoShellProps {
  /** "General Mills" — used in the title line. */
  accountName: string;
  /** Account's accent hex (e.g. '#059669'). Resolved to a single accent line + footnote-marker color via getMemoAccent. */
  accentColor?: string;
  /** ISO date or 'YYYY-MM-DD' string when the analysis was prepared. */
  preparedDate: string;
  /** Display title — e.g. "Yard execution as a network constraint for General Mills". The page builds this from accountName. */
  title: string;
  /**
   * Reader-aware eyebrow ("prepared for Dan Poland"). Set by Sprint M5
   * when ?p= resolves to a known PersonProfile; left undefined for the
   * universal version.
   */
  readerEyebrow?: string;
  /** "47-plant footprint" — the network shape one-liner shown under the title. */
  contextDetail?: string;
  /** "Casey Larkin · YardFlow" — author byline shown under the context detail. */
  authorByline: string;
  /** Sprint M3 banner flag. When true, renders a small DRAFT badge in the corner — not a full-width strip. */
  needsHandTuning?: boolean;
  /** Section content (and the bottom-of-page FootnoteList) rendered into the document column. */
  children: ReactNode;
}

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

/**
 * Light-memo shell for the YNS Microsite Redesign (Sprint M2 + senior-eye
 * polish pass).
 *
 * Aesthetic: the FT/Stripe-Press school of long-form. Newsreader for
 * display + body sets a serif voice that reads "thoughtful, screen-native";
 * Inter Tight for metadata reads "operator memo, not magazine"; JetBrains
 * Mono for the few moments we want a typewriter beat (DRAFT badge,
 * confidence brackets). 670px column. 17/30 body. No CTA, no chrome.
 *
 * Color budget across the entire page: accent shows up only in (1) the
 * footnote markers, (2) the small section numerals, (3) inline links. The
 * trust signal is the writing + sourcing, not visual flair.
 */
export function MemoShell({
  accountName,
  accentColor,
  preparedDate,
  title,
  readerEyebrow,
  contextDetail,
  authorByline,
  needsHandTuning,
  children,
}: MemoShellProps) {
  const accent = getMemoAccent(accentColor);
  return (
    <div
      data-shell="memo"
      style={accent.cssVar}
      className={`relative min-h-screen bg-[#fbfaf7] text-slate-800 antialiased ${FONT_SANS}`}
    >
      {needsHandTuning ? (
        <span
          className={`pointer-events-none fixed right-4 top-4 z-10 select-none rounded-sm border border-slate-300 bg-white/80 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500 shadow-sm backdrop-blur-sm ${FONT_MONO}`}
        >
          Draft · v0
        </span>
      ) : null}

      <article className="mx-auto max-w-[42rem] px-6 pb-24 pt-16 md:pb-32 md:pt-24">
        <header className="mb-14 md:mb-16">
          <div className="flex items-baseline gap-3 border-b border-slate-200 pb-4">
            <span
              className={`text-[10px] uppercase tracking-[0.22em] text-slate-500 ${FONT_MONO}`}
            >
              Private analysis
            </span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className={`text-[11px] text-slate-500 ${FONT_SANS}`}>
              {formatPreparedDate(preparedDate)}
            </span>
          </div>

          <h1
            className={`mt-7 text-[clamp(2rem,4.5vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.015em] text-slate-900 ${FONT_SERIF}`}
          >
            {title}
          </h1>

          {(readerEyebrow || contextDetail) ? (
            <div className="mt-5 space-y-1 text-[15px] leading-relaxed text-slate-600">
              {readerEyebrow ? (
                <p className="text-slate-700">
                  <span className="text-slate-400">Prepared for </span>
                  <span className="text-slate-800">{stripPreparedFor(readerEyebrow)}</span>
                </p>
              ) : null}
              {contextDetail ? <p className="text-slate-500">{contextDetail}</p> : null}
            </div>
          ) : null}

          <p className="mt-6 text-[13px] text-slate-500">{authorByline}</p>
        </header>

        <div
          className={[
            'space-y-14 text-[17px] leading-[1.7] text-slate-700',
            // Headings: serif, slightly tighter, near-black
            `[&_h2]:${FONT_SERIF}`,
            '[&_h2]:mt-0 [&_h2]:text-[1.5rem] [&_h2]:font-medium [&_h2]:leading-snug [&_h2]:tracking-[-0.005em] [&_h2]:text-slate-900',
            `[&_h3]:${FONT_SERIF}`,
            '[&_h3]:text-[1.0625rem] [&_h3]:font-medium [&_h3]:text-slate-900',
            // Body emphasis
            '[&_p]:text-slate-700',
            '[&_strong]:font-semibold [&_strong]:text-slate-900',
            // Inline links — accent color, hover underline
            '[&_a]:text-[var(--memo-accent)] [&_a]:no-underline hover:[&_a]:underline',
          ].join(' ')}
        >
          {children}
        </div>

        <footer className="mt-20 border-t border-slate-200 pt-5">
          <p className={`text-[11px] uppercase tracking-[0.18em] text-slate-400 ${FONT_MONO}`}>
            {accountName} · {formatPreparedDate(preparedDate)}
          </p>
        </footer>
      </article>
    </div>
  );
}

/**
 * Turn ISO 'YYYY-MM-DD' or any Date-parseable string into "May 8, 2026".
 * Falls back to the raw string if parsing fails — never crashes the
 * memo header.
 */
function formatPreparedDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * The reader resolver returns "Prepared for Dan Poland · VP Supply Chain".
 * The header re-renders that with greyer "Prepared for" so the name reads
 * as the focal element. This strips the prefix when it's there so we don't
 * end up with "Prepared for Prepared for Dan Poland".
 */
function stripPreparedFor(eyebrow: string): string {
  return eyebrow.replace(/^Prepared for\s+/i, '');
}
