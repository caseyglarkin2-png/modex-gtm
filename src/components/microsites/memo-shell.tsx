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
  /** Sprint M3 banner flag. When true, renders a subtle "needs hand-tuning" strip at the top. */
  needsHandTuning?: boolean;
  /** Section content (and the bottom-of-page FootnoteList) rendered into the document column. */
  children: ReactNode;
}

/**
 * Light-memo shell for the YNS Microsite Redesign (Sprint M2).
 *
 * Replaces the dark MicrositeShell's slate-950-with-spotlights theatre with
 * a clean white document layout: narrow readable column, serif headlines,
 * sans body, system-default reading affordances. No sticky CTA. No header
 * "book a call" button. The page exists to be read end-to-end and shared
 * with a champion's team, not to push the prospect into a conversation.
 *
 * Color shows up exactly twice on the page (a vertical accent rule per
 * section + footnote markers). The trust signal is the writing + sourcing,
 * not visual flair.
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
      className="min-h-screen bg-white font-sans text-slate-800 antialiased [font-feature-settings:'cv02','cv03','cv04','cv11']"
    >
      {needsHandTuning ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          This is a generic analysis. A custom version is in flight.
        </div>
      ) : null}

      <article className="mx-auto max-w-[44rem] px-6 py-12 md:py-20">
        <header className="mb-12 space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Private analysis · prepared {preparedDate}
          </p>

          <h1 className="font-serif text-3xl font-semibold leading-tight text-slate-900 md:text-4xl md:leading-[1.15]">
            {title}
          </h1>

          {(readerEyebrow || contextDetail) ? (
            <div className="space-y-1 text-sm text-slate-600">
              {readerEyebrow ? <p className="font-medium text-slate-700">{readerEyebrow}</p> : null}
              {contextDetail ? <p>{contextDetail}</p> : null}
            </div>
          ) : null}

          <p className="text-sm text-slate-500">{authorByline}</p>
        </header>

        <div className="space-y-12 text-base leading-7 text-slate-700 [&_h2]:mt-0 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:text-slate-700 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_a]:text-[var(--memo-accent)] [&_a]:no-underline hover:[&_a]:underline">
          {children}
        </div>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <p>YardFlow by FreightRoll · {accountName} private brief</p>
        </footer>
      </article>
    </div>
  );
}
