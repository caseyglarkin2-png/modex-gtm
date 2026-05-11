import type { ReactNode } from 'react';
import { getMemoAccent } from './memo-theme';
import { MemoRunningHeader, MemoContentsRail } from './memo-shell-chrome';

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

function renderTitle(title: string, emphasis?: string): ReactNode {
  if (!emphasis) return title;
  const idx = title.indexOf(emphasis);
  if (idx < 0) return title;
  return (
    <>
      {title.slice(0, idx)}
      <em
        style={{
          color: 'var(--memo-accent)',
          fontStyle: 'italic',
          fontVariationSettings: "'opsz' 130, 'SOFT' 100, 'WONK' 1",
        }}
      >
        {emphasis}
      </em>
      {title.slice(idx + emphasis.length)}
    </>
  );
}

interface MemoShellProps {
  /** "Dannon" — used in the running-header subtitle and colophon. */
  accountName: string;
  /** Account's accent hex. Resolved to a single accent line via getMemoAccent. */
  accentColor?: string;
  /** ISO date string when the analysis was prepared. */
  preparedDate: string;
  /** Headline shown on the cover and as the running-header title. */
  title: string;
  /** Substring of title to render as italic + accent in the cover H1.
   *  If the substring isn't found in title, the H1 falls back to plain rendering. */
  titleEmphasis?: string;
  /** Reader-aware eyebrow ("Heiko Gerling · Chief Operations Officer"). */
  readerEyebrow?: string;
  /** "13-plant footprint" — context line shown under the cover prepared-for block. */
  contextDetail?: string;
  /** "Casey Larkin · YardFlow" author byline shown on the cover. */
  authorByline: string;
  /** Memo identifier shown in the cover meta-row + colophon (e.g., "YF-DAN-NA-001"). */
  documentId?: string;
  /** Sprint M3 banner flag. Renders a small DRAFT badge in the cover classification. */
  needsHandTuning?: boolean;
  /** Table-of-contents entries for the desktop scrollspy rail. Defaults to []. */
  tocEntries?: { id: string; num: string; label: string }[];
  /** Section content (and the bottom-of-page FootnoteList) rendered into the document column. */
  children: ReactNode;
}

/**
 * "Private Memorandum" shell (Sprint M8 redesign).
 *
 * Treats the page as a bound analyst document, not a webpage. The reader
 * crosses a cover spread (classification chrome, document number,
 * prepared-for) before reaching the body. A running header fades in past
 * the cover. On desktop, a sticky contents rail with scrollspy sits in the
 * left gutter. The document column is set in Fraunces with optical-size
 * adjustments per heading level; metadata is Mona Sans with a tightened
 * width axis; technical scaffolding (document numbers, classification, end
 * marks) is JetBrains Mono.
 *
 * Color budget across the whole page: the brand accent appears in only the
 * cover classification pip, the H1 italicized phrase, the contents-rail
 * active marker, the section eyebrows + numerals, the footnote markers,
 * the soft-action link, and the closing §∎ end-mark. Everything else is
 * warm cream + ink + hairlines.
 */
export function MemoShell({
  accountName,
  accentColor,
  preparedDate,
  title,
  titleEmphasis,
  readerEyebrow,
  contextDetail,
  authorByline,
  documentId,
  needsHandTuning,
  tocEntries = [],
  children,
}: MemoShellProps) {
  const accent = getMemoAccent(accentColor);
  const formattedDate = formatPreparedDate(preparedDate);
  const compactDate = formatCompactDate(preparedDate);
  const recipientName = readerEyebrow ? stripPreparedFor(readerEyebrow) : null;
  const recipientTitle = readerEyebrow ? extractTitle(readerEyebrow) : null;
  const docId = documentId ?? buildFallbackDocId(accountName);

  return (
    <div
      data-shell="memo"
      style={accent.cssVar}
      className={`relative min-h-screen bg-[#f5f1e8] text-[#1a1a1a] antialiased ${FONT_SERIF}`}
    >
      <MemoChromeStyles />

      <PaperGrain />

      {/* Running header (client; fades in past the cover) */}
      <MemoRunningHeader
        title={title}
        subtitle={`${accountName} · ${compactDate}`}
      />

      {/* ── COVER SPREAD ─────────────────────────────────────────── */}
      <section
        data-memo-cover
        aria-label="Cover"
        className="relative flex min-h-screen items-center"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,253,247,0.55) 0%, transparent 60%), #f5f1e8',
        }}
      >
        <div className="mx-auto w-full max-w-5xl px-8 pb-24 pt-20 md:px-12">
          <div
            className={`memo-cover-rise memo-cover-rise-1 mb-24 flex flex-wrap items-center gap-3 border-b border-[#d8d2c2] pb-5 ${FONT_MONO} text-[10.5px] uppercase tracking-[0.22em] text-[#8a847b]`}
          >
            <span
              aria-hidden="true"
              className="size-[5px] rounded-full"
              style={{ background: 'var(--memo-accent)' }}
            />
            <span>Private analysis</span>
            <span className="text-[#a89e8b]">·</span>
            <span>Working memo</span>
            <span className="text-[#a89e8b]">·</span>
            <span>Not for distribution</span>
          </div>

          <div
            className={`memo-cover-rise memo-cover-rise-2 mb-16 flex flex-wrap items-baseline justify-between gap-4 ${FONT_SANS} text-[12px] tracking-[0.04em] text-[#8a847b]`}
          >
            <span
              className={`${FONT_MONO} text-[11px] uppercase tracking-[0.15em]`}
            >
              Memo · {compactDate} · {docId}
            </span>
            <span>{authorByline}</span>
          </div>

          <h1
            className={`memo-cover-rise memo-cover-rise-3 m-0 max-w-[22ch] ${FONT_SERIF} text-[#1a1a1a]`}
            style={{
              fontVariationSettings: "'opsz' 130, 'SOFT' 50, 'WONK' 0",
              fontWeight: 360,
              fontSize: 'clamp(2.5rem, 5.4vw, 4.25rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            {renderTitle(title, titleEmphasis)}
          </h1>

          <dl
            className="memo-cover-rise memo-cover-rise-4 mt-16 grid max-w-2xl grid-cols-[8rem_1fr] gap-x-6 border-t border-[#d8d2c2] pt-7 text-[15px] sm:grid-cols-[8rem_1fr]"
          >
            {recipientName ? (
              <>
                <dt className={`pt-1 ${FONT_MONO} text-[10px] uppercase tracking-[0.18em] text-[#8a847b]`}>
                  Prepared for
                </dt>
                <dd className={`mb-3.5 ${FONT_SANS} text-[#1a1a1a]`}>
                  {recipientTitle ? `${recipientName} · ${recipientTitle}` : recipientName}
                </dd>
              </>
            ) : null}
            <dt className={`pt-1 ${FONT_MONO} text-[10px] uppercase tracking-[0.18em] text-[#8a847b]`}>
              Subject
            </dt>
            <dd className={`mb-3.5 ${FONT_SANS} text-[#1a1a1a]`}>
              {contextDetail ? `${accountName} · ${contextDetail}` : accountName}
            </dd>
            <dt className={`pt-1 ${FONT_MONO} text-[10px] uppercase tracking-[0.18em] text-[#8a847b]`}>
              Date
            </dt>
            <dd className={`mb-3.5 ${FONT_SANS} text-[#1a1a1a]`}>{formattedDate}</dd>
            <dt className={`pt-1 ${FONT_MONO} text-[10px] uppercase tracking-[0.18em] text-[#8a847b]`}>
              Author
            </dt>
            <dd className={`mb-3.5 ${FONT_SANS} text-[#1a1a1a]`}>{authorByline}</dd>
          </dl>
        </div>

        {tocEntries.length > 0 ? (
          <a
            href={`#${tocEntries[0].id}`}
            className={`memo-cover-fade absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 ${FONT_MONO} text-[10.5px] uppercase tracking-[0.22em] text-[#8a847b] transition-colors hover:text-[color:var(--memo-accent)]`}
          >
            <span>Continue</span>
            <span aria-hidden="true" className="memo-cover-nudge text-[14px]">
              ↓
            </span>
          </a>
        ) : null}
      </section>

      {/* ── DOCUMENT BODY ────────────────────────────────────────── */}
      <main className="border-t border-[#d8d2c2] bg-[#f5f1e8] py-24 md:py-32">
        <div className="mx-auto grid max-w-[76rem] grid-cols-1 gap-0 px-6 md:px-8 lg:grid-cols-[11rem_minmax(0,36rem)_14rem] lg:gap-12 lg:px-12">
          <MemoContentsRail entries={tocEntries} />

          <article
            className={[
              'memo-prose w-full max-w-[36rem] text-[#4a4641]',
              FONT_SERIF,
            ].join(' ')}
            style={{
              fontVariationSettings: "'opsz' 14, 'SOFT' 50",
              fontSize: '17.5px',
              lineHeight: 1.72,
            }}
          >
            {children}

            <div
              className="mx-auto mt-24 max-w-[36rem] border-t border-[#d8d2c2] pt-10 text-center text-[10.5px] uppercase tracking-[0.22em] text-[#8a847b]"
              style={{ lineHeight: 1.8 }}
            >
              <div
                className={`mb-5 text-[18px] tracking-normal ${FONT_MONO}`}
                style={{ color: 'var(--memo-accent)' }}
              >
                § ∎
              </div>
              {needsHandTuning ? (
                <div className={`mb-3 ${FONT_MONO} text-[10px] uppercase tracking-[0.18em] text-[#a89e8b]`}>
                  Working analysis · v0
                </div>
              ) : null}
              {`${accountName} · ${docId} · Issued ${formattedDate}`}
              <br />
              <span className={`${FONT_SANS} text-[13px] normal-case tracking-normal text-[#4a4641]`}>
                Set in Fraunces &amp; Mona Sans · Composed by{' '}
                <a
                  href="mailto:casey@freightroll.com"
                  className="border-b border-[#d8d2c2] text-[#4a4641] transition-colors hover:border-[color:var(--memo-accent)] hover:text-[color:var(--memo-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--memo-accent)]"
                >
                  Casey Larkin
                </a>
              </span>
            </div>

            {/* aside column placeholder kept empty in this M8 pass — desktop
                marginalia is mirrored inline via section-level <aside> blocks
                until per-section anchoring is wired up properly */}
          </article>

          <aside aria-hidden="true" className="hidden lg:block" />
        </div>
      </main>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────

/**
 * Inline keyframes + drop-cap ::first-letter rule. Server-rendered as a
 * raw <style> tag so the rules are available before hydration. Scoped via
 * class names (memo-cover-*, memo-prose, memo-lead) — there is no risk of
 * collision with the rest of the app, which uses Tailwind for everything.
 */
function MemoChromeStyles() {
  return (
    <style>{MEMO_CHROME_CSS}</style>
  );
}

const MEMO_CHROME_CSS = `
/* Cover stagger */
@keyframes memo-rise {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes memo-fade {
  to { opacity: 1; }
}
@keyframes memo-nudge {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(4px); }
}
.memo-cover-rise {
  opacity: 0;
  transform: translateY(8px);
  animation: memo-rise 0.9s cubic-bezier(0.2, 0, 0.2, 1) forwards;
}
.memo-cover-rise-1 { animation-delay: 0.1s; }
.memo-cover-rise-2 { animation-delay: 0.45s; }
.memo-cover-rise-3 { animation-delay: 0.7s; animation-duration: 1.1s; }
.memo-cover-rise-4 { animation-delay: 1.15s; }
.memo-cover-fade  { opacity: 0; animation: memo-fade 1.4s ease 1.6s forwards; }
.memo-cover-nudge { animation: memo-nudge 2.5s ease-in-out 3; }

@media (prefers-reduced-motion: reduce) {
  .memo-cover-rise, .memo-cover-fade {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .memo-cover-nudge { animation: none; }
}

/* Memo prose defaults */
.memo-prose p { margin: 0 0 1.15rem; }
.memo-prose p:last-child { margin-bottom: 0; }
.memo-prose strong {
  font-weight: 540;
  color: #1a1a1a;
  font-variation-settings: 'opsz' 14, 'SOFT' 30;
}
.memo-prose em {
  font-style: italic;
  font-variation-settings: 'opsz' 14, 'SOFT' 80, 'WONK' 1;
}
.memo-prose a:not(.memo-fn-marker) {
  color: var(--memo-accent);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--memo-accent) 35%, transparent);
  transition: border-color 0.2s;
}
.memo-prose a:not(.memo-fn-marker):hover {
  border-bottom-color: var(--memo-accent);
}

/* Drop cap on the first paragraph of each section */
.memo-lead::first-letter {
  font-family: var(--font-memo-serif);
  font-variation-settings: 'opsz' 144, 'SOFT' 50, 'WONK' 0;
  font-weight: 320;
  font-size: 4.4em;
  line-height: 0.85;
  float: left;
  margin: 0.05em 0.12em -0.05em 0;
  color: #1a1a1a;
  padding-top: 0.05em;
}

/* Selection */
[data-shell="memo"] ::selection {
  background: color-mix(in srgb, var(--memo-accent) 18%, transparent);
  color: #1a1a1a;
}
`;

/**
 * Fixed-position SVG noise overlay across the whole memo. Inline data URI
 * keeps the texture under a couple hundred bytes and cacheable with the
 * HTML payload.
 */
function PaperGrain() {
  const svg = encodeURIComponent(
    `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>`,
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] opacity-[0.035] mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
      }}
    />
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function formatPreparedDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  // Use UTC to keep ISO 'YYYY-MM-DD' inputs from drifting a day in
  // negative-offset timezones (e.g. PT renders 2026-05-08 as May 7).
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatCompactDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  // UTC-based to match formatPreparedDate.
  const m = parsed.getUTCMonth() + 1;
  const d = parsed.getUTCDate();
  const y = parsed.getUTCFullYear() % 100;
  return `${m}/${d}/${y.toString().padStart(2, '0')}`;
}

function stripPreparedFor(eyebrow: string): string {
  // "Prepared for Heiko Gerling · Chief Operations Officer" → "Heiko Gerling"
  const stripped = eyebrow.replace(/^Prepared for\s+/i, '');
  const dotIdx = stripped.indexOf('·');
  return dotIdx >= 0 ? stripped.slice(0, dotIdx).trim() : stripped;
}

function extractTitle(eyebrow: string): string | null {
  const dotIdx = eyebrow.indexOf('·');
  if (dotIdx < 0) return null;
  return eyebrow.slice(dotIdx + 1).trim();
}

/**
 * Fallback document id when the page didn't pass one explicitly. Pattern:
 * YF-<3-LETTER-SLUG>-001. Stable across renders for the same account.
 */
function buildFallbackDocId(accountName: string): string {
  const slug = accountName
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `YF-${slug}-001`;
}
