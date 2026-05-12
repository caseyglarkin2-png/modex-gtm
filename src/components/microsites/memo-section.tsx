import { Fragment, type ReactNode } from 'react';
import {
  type FootnoteData,
  type MemoMicrositeSection,
  type YnsThesisSection,
  type ObservationSection,
  type ComparableSection,
  type MethodologySection,
  type AboutSection,
  type ArtifactSection,
  type PersonVariant,
} from '@/lib/microsites/schema';
import { YNS_THESIS } from '@/lib/microsites/yns-thesis';
import {
  ConfidenceBadge,
  FootnoteList,
  FootnoteMarker,
  numberFootnotes,
  type NumberedFootnote,
} from './footnote';
import { getMemoAccent } from './memo-theme';
import type { MemoMarginaliaItem } from './memo-marginalia';

/**
 * Extracts one marginalia item per section that carries composition data.
 * Currently only ObservationSection has a composition field — other section
 * types contribute no marginalia item (the gutter doesn't try to fill empty
 * space).
 *
 * Surfaces every other { label, value } pair of each composition (rows 0,
 * 2, 4...) so the right gutter has visible density across the scroll on
 * accounts that have not hand-tuned `marginaliaItems`. Hand-tuned override
 * lives on AccountMicrositeData.marginaliaItems and short-circuits this
 * extraction in page.tsx.
 */
export function extractMarginaliaItems(
  sections: MemoMicrositeSection[],
): MemoMarginaliaItem[] {
  const items: MemoMarginaliaItem[] = [];
  for (const section of sections) {
    if (section.type !== 'observation') continue;
    for (let i = 0; i < section.composition.length; i += 2) {
      const row = section.composition[i];
      if (!row) continue;
      items.push({
        mark: row.label,
        body: row.value,
        sectionId: section.sectionId,
      });
    }
  }
  return items;
}

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

/**
 * Body-flow pull-quote. Renders as a centered max-w-26ch italic Fraunces
 * blockquote with a 2px accent left rule. Use inside Observation
 * hypothesis to break up dense prose and surface the section's punchline.
 * Visually mirrors the MemoPreamble blockquote so the two registers feel
 * like one author.
 */
export function MemoPullQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote
      className={`my-10 max-w-[26ch] border-l-2 border-[color:var(--memo-accent)] pl-6 text-[#1a1a1a] ${FONT_SERIF}`}
      style={{
        fontStyle: 'italic',
        fontVariationSettings: "'opsz' 36, 'SOFT' 100, 'WONK' 1",
        fontWeight: 400,
        fontSize: 'clamp(1.35rem, 1.1vw + 0.85rem, 1.75rem)',
        lineHeight: 1.32,
        letterSpacing: '-0.005em',
      }}
    >
      {children}
    </blockquote>
  );
}

// Section-type → display label for the eyebrow ("§ 01 · OBSERVATION").
// Kept here (not in the schema module) because it's purely presentational.
const EYEBROW_LABEL: Record<MemoMicrositeSection['type'], string> = {
  'yns-thesis': 'The thesis',
  observation: 'Observation',
  comparable: 'Comparable',
  methodology: 'Methodology',
  about: 'Author',
  artifact: 'Artifact',
};

// ── Footnote collection ───────────────────────────────────────────────

function sectionFootnotes(section: MemoMicrositeSection): FootnoteData[] {
  switch (section.type) {
    case 'yns-thesis':
      return YNS_THESIS.footnotes;
    case 'observation':
      return section.footnotes ?? [];
    case 'comparable':
      return section.footnotes ?? [];
    case 'methodology':
      return section.sources;
    case 'about':
      return [];
    case 'artifact':
      return [];
  }
}

export function collectFootnotes(sections: MemoMicrositeSection[]): NumberedFootnote[] {
  const flat = sections.flatMap(sectionFootnotes);
  return numberFootnotes(flat);
}

function indexFootnotes(footnotes: NumberedFootnote[]): Record<string, NumberedFootnote> {
  return Object.fromEntries(footnotes.map((fn) => [fn.id, fn]));
}

/**
 * Splits paragraph bodies on [^id] tokens and replaces them with inline
 * FootnoteMarker components. Unknown ids are left as raw text.
 */
function renderBodyWithFootnotes(
  body: string,
  resolved: Record<string, NumberedFootnote>,
): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[\^([^\]]+)\]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(body)) !== null) {
    if (match.index > cursor) {
      out.push(body.slice(cursor, match.index));
    }
    const fn = resolved[match[1]];
    if (fn) {
      out.push(<FootnoteMarker key={`fn-${key++}`} n={fn.n} />);
    } else {
      out.push(match[0]);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < body.length) out.push(body.slice(cursor));
  return out;
}

// ── Section frame ─────────────────────────────────────────────────────

const SECTION_HEADING_STYLE = {
  fontVariationSettings: "'opsz' 60, 'SOFT' 50",
  fontWeight: 380,
  fontSize: 'clamp(1.65rem, 1.1vw + 1.15rem, 2.2rem)',
  lineHeight: 1.2,
  letterSpacing: '-0.012em',
} as const;

function MemoSectionFrame({
  number,
  numeralClass,
  sectionId,
  eyebrow,
  heading,
  children,
  endMark = true,
}: {
  number: number;
  numeralClass: string;
  sectionId?: string;
  eyebrow: string;
  heading: string;
  children: ReactNode;
  endMark?: boolean;
}) {
  const formatted = String(number).padStart(2, '0');
  return (
    <section id={sectionId} className="mb-24 scroll-mt-20 last:mb-12">
      <p
        className={`mb-4 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] ${FONT_MONO}`}
      >
        <span className={`font-medium ${numeralClass}`}>§ {formatted}</span>
        <span className="text-[#8a847b]">·</span>
        <span className="tracking-[0.18em] text-[#8a847b]">{eyebrow}</span>
      </p>
      <h2
        className={`m-0 mb-7 max-w-[24ch] text-[#1a1a1a] ${FONT_SERIF}`}
        style={SECTION_HEADING_STYLE}
      >
        {heading}
      </h2>
      {children}
      {endMark ? (
        <div className={`mt-12 text-center text-[12px] tracking-[0.4em] text-[#8a847b] ${FONT_MONO}`}>
          ∎ &nbsp;∎ &nbsp;∎
        </div>
      ) : null}
    </section>
  );
}

/**
 * Inline aside used for the observation caveat, the thesis's "Aside" beat,
 * and any inline marginalia.
 *
 * Mobile: hairline-bordered block, inline below the anchor paragraph.
 *
 * Desktop (≥lg): floats right with a negative margin-right of 17rem,
 * pushing the box outside the 36rem document column into the 14rem
 * gutter (3rem grid gap + 14rem gutter width). Doc text doesn't wrap
 * because the float lives entirely outside the doc column. `clear: right`
 * keeps multiple asides from overlapping each other in the gutter.
 *
 * Visually flips from "boxed callout" (mobile) to "true marginalia note"
 * (desktop) — same source order, same anchor relationship to the body
 * paragraph above it.
 */
function MemoAside({ mark, children }: { mark: string; children: ReactNode }) {
  return (
    <aside
      className={[
        // Mobile (default) — boxed callout inline in the doc column.
        'my-5 border-l-2 border-[#a89e8b] bg-[rgba(255,253,247,0.5)] px-4 py-3.5',
        'text-[14.5px] leading-[1.55] text-[#8a847b]',
        FONT_SANS,
        // Desktop — float right into the gutter, lose the box, keep the rule.
        'lg:float-right lg:clear-right lg:w-56 lg:-mr-[17rem] lg:my-1 lg:ml-0 xl:w-64 xl:-mr-[19rem] 2xl:w-[17rem] 2xl:-mr-[20rem]',
        'lg:border-l lg:border-l-[#d8d2c2] lg:bg-transparent lg:px-4 lg:py-0',
        'lg:text-[12.5px] lg:leading-[1.5] lg:text-[#8a847b] xl:text-[13px]',
      ].join(' ')}
    >
      <p
        className={`mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[#6c9384] lg:mb-1 lg:text-[10px] lg:tracking-[0.2em] ${FONT_MONO}`}
      >
        {mark}
      </p>
      <div className="space-y-1.5">{children}</div>
    </aside>
  );
}

// ── Section variants ──────────────────────────────────────────────────

function MemoYnsThesis({
  section,
  index,
  accent,
  resolved,
}: {
  section: YnsThesisSection;
  index: number;
  accent: ReturnType<typeof getMemoAccent>;
  resolved: Record<string, NumberedFootnote>;
}) {
  const headline = section.headlineOverride ?? YNS_THESIS.defaultHeadline;
  return (
    <MemoSectionFrame
      number={index}
      numeralClass={accent.numeralClass}
      sectionId={section.sectionId ?? 'yns-thesis'}
      eyebrow={EYEBROW_LABEL['yns-thesis']}
      heading={headline}
    >
      {YNS_THESIS.paragraphs.map((para, i) => (
        <p key={i} className={i === 0 ? 'memo-lead' : undefined}>
          {renderBodyWithFootnotes(para.body, resolved)}
        </p>
      ))}
    </MemoSectionFrame>
  );
}

function MemoObservation({
  section,
  index,
  accent,
  resolved,
}: {
  section: ObservationSection;
  index: number;
  accent: ReturnType<typeof getMemoAccent>;
  resolved: Record<string, NumberedFootnote>;
}) {
  return (
    <MemoSectionFrame
      number={index}
      numeralClass={accent.numeralClass}
      sectionId={section.sectionId ?? 'observation'}
      eyebrow={EYEBROW_LABEL['observation']}
      heading={section.headline}
    >
      {section.composition.length > 0 ? (
        <dl
          className={`my-7 border-y border-[#d8d2c2] ${FONT_SANS} text-[15px] text-[#4a4641]`}
          style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          {section.composition.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_1.4fr] gap-x-5 py-3 ${
                i === 0 ? '' : 'border-t border-[#e8e2d4]'
              }`}
            >
              <dt
                className="pt-px text-[13px] uppercase tracking-[0.08em] text-[#8a847b]"
                style={{ fontVariationSettings: "'wdth' 95" }}
              >
                {row.label}
              </dt>
              <dd className="m-0 font-medium text-[#1a1a1a]">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {(() => {
        const paragraphs = section.hypothesis.split(/\n\n+/);
        return paragraphs.map((para, i) => (
          <Fragment key={i}>
            <p className={i === 0 ? 'memo-lead' : undefined}>
              {renderBodyWithFootnotes(para, resolved)}
            </p>
            {i === 0 && section.pullQuote ? (
              <MemoPullQuote>{section.pullQuote}</MemoPullQuote>
            ) : null}
          </Fragment>
        ));
      })()}
      {section.caveat ? (
        <MemoAside mark="Caveat">
          <p className="m-0">{section.caveat}</p>
        </MemoAside>
      ) : null}
    </MemoSectionFrame>
  );
}

function MemoComparable({
  section,
  index,
  accent,
  resolved,
}: {
  section: ComparableSection;
  index: number;
  accent: ReturnType<typeof getMemoAccent>;
  resolved: Record<string, NumberedFootnote>;
}) {
  return (
    <MemoSectionFrame
      number={index}
      numeralClass={accent.numeralClass}
      sectionId={section.sectionId ?? 'comparable'}
      eyebrow={EYEBROW_LABEL['comparable']}
      heading={section.headline}
    >
      <p className="memo-lead">
        <strong>{section.comparableName}</strong> — {section.comparableProfile}
      </p>
      {section.metrics.length > 0 ? (
        <ul
          className={`my-7 list-none border-y border-[#d8d2c2] p-0 ${FONT_SANS} text-[15px]`}
        >
          {section.metrics.map((row, i) => (
            <li
              key={row.label}
              className={`grid grid-cols-1 gap-x-3 gap-y-1 py-3.5 sm:grid-cols-[12rem_1fr_6rem] sm:items-center sm:gap-y-0 ${
                i === 0 ? '' : 'border-t border-[#e8e2d4]'
              }`}
              style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
            >
              <span className="font-medium text-[#1a1a1a]">{row.label}</span>
              <span className="flex items-baseline gap-2 text-[14.5px] text-[#8a847b]">
                <span
                  className="text-[#8a847b]"
                  style={{ textDecoration: 'line-through', textDecorationColor: '#a89e8b' }}
                >
                  {row.before}
                </span>
                <span className={`text-[#a89e8b] ${FONT_MONO}`}>→</span>
                <span className="font-medium text-[#1a1a1a]">{row.after}</span>
              </span>
              <span
                className={`text-left text-[11.5px] uppercase tracking-[0.08em] sm:text-right ${FONT_MONO}`}
                style={{ color: 'var(--memo-accent)' }}
              >
                {row.delta}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p>
        <strong>Time to first impact.</strong>{' '}
        {renderBodyWithFootnotes(section.timeline, resolved)}
      </p>
      {section.referenceAvailable ? (
        <p className="mt-5 text-[15px] text-[#8a847b]">
          A peer call with {section.comparableName}&rsquo;s team can be arranged when
          the conversation calls for it.
        </p>
      ) : null}
    </MemoSectionFrame>
  );
}

function MemoMethodology({
  section,
  index,
  accent,
}: {
  section: MethodologySection;
  index: number;
  accent: ReturnType<typeof getMemoAccent>;
}) {
  return (
    <MemoSectionFrame
      number={index}
      numeralClass={accent.numeralClass}
      sectionId={section.sectionId ?? 'methodology'}
      eyebrow={EYEBROW_LABEL['methodology']}
      heading={section.headline}
    >
      <p className="memo-lead">
        Sources used in this analysis, with confidence levels shipped inline so
        you can see exactly which claims are anchored in measured data and which
        are extrapolated from public sources.
      </p>
      <ol
        className={`my-6 list-none p-0 ${FONT_SANS} text-[15px] leading-[1.55] text-[#4a4641]`}
      >
        {section.sources.map((src, i) => (
          <li
            key={src.id}
            className={`grid grid-cols-1 gap-x-6 gap-y-2 border-[#d8d2c2] py-4 sm:grid-cols-[1.3fr_1fr] ${
              i === 0 ? 'border-t' : 'border-t border-[#e8e2d4]'
            } ${i === section.sources.length - 1 ? 'border-b' : ''}`}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-medium text-[#1a1a1a]">{src.source}</span>
              <ConfidenceBadge confidence={src.confidence} />
            </div>
            {src.detail ? <p className="m-0 text-[#4a4641]">{src.detail}</p> : null}
          </li>
        ))}
      </ol>
      {section.unknowns.length > 0 ? (
        <>
          <h3
            className={`mt-8 mb-3 text-[1.15rem] text-[#1a1a1a] ${FONT_SERIF}`}
            style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50", fontWeight: 480 }}
          >
            What we don&rsquo;t know
          </h3>
          <ul
            className={`mt-3 list-none p-0 ${FONT_SANS} text-[15px] leading-[1.6] text-[#4a4641]`}
          >
            {section.unknowns.map((u, i) => (
              <li
                key={i}
                className={`relative py-2 pl-5 ${i === 0 ? '' : 'border-t border-dotted border-[#d8d2c2]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-2 text-[12px] text-[#8a847b] ${FONT_MONO}`}
                  style={{ top: i === 0 ? 0 : '0.5rem' }}
                >
                  ?
                </span>
                {u}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </MemoSectionFrame>
  );
}

function MemoAbout({
  section,
  index,
  accent,
}: {
  section: AboutSection;
  index: number;
  accent: ReturnType<typeof getMemoAccent>;
}) {
  return (
    <MemoSectionFrame
      number={index}
      numeralClass={accent.numeralClass}
      sectionId={section.sectionId ?? 'about'}
      eyebrow={EYEBROW_LABEL['about']}
      heading={section.headline ?? 'About this analysis'}
      endMark={false}
    >
      <p className="memo-lead">{section.authorBio}</p>
      {section.signOff ? <p className="mt-4">{section.signOff}</p> : null}
      <p className="mt-6 text-[15px] text-[#8a847b]">
        Reach the author at{' '}
        <a href={`mailto:${section.authorEmail}`}>{section.authorEmail}</a>.
      </p>
    </MemoSectionFrame>
  );
}

function MemoArtifact({
  section,
  index,
  accent,
}: {
  section: ArtifactSection;
  index: number;
  accent: ReturnType<typeof getMemoAccent>;
}) {
  const a = section.artifact;
  return (
    <MemoSectionFrame
      number={index}
      numeralClass={accent.numeralClass}
      sectionId={section.sectionId ?? 'artifact'}
      eyebrow={EYEBROW_LABEL['artifact']}
      heading={section.headline}
    >
      <figure className="border border-[#d8d2c2] bg-[#fffdf7] p-4">
        <img
          src={a.imageSrc}
          alt={a.imageAlt}
          className="block w-full"
        />
        <figcaption className={`mt-3 text-[12px] tracking-[0.1em] uppercase text-[#4a4641] ${FONT_MONO}`}>
          {a.caption}
        </figcaption>
        <div className={`mt-2 text-[11.5px] tracking-[0.18em] uppercase text-[#8a847b] ${FONT_SANS}`}>
          {a.source}
        </div>
      </figure>
    </MemoSectionFrame>
  );
}

// ── Main entry points ─────────────────────────────────────────────────

interface MemoSectionListProps {
  sections: MemoMicrositeSection[];
  accentColor?: string;
}

/**
 * Renders the prose body — sections only. The footnote list is no longer
 * coupled here; the page composes it after the soft action via
 * <MemoFootnotes sections={...} /> so the order in the document column is
 * sections → soft action → footnotes → colophon.
 */
export function MemoSectionList({ sections, accentColor }: MemoSectionListProps) {
  const accent = getMemoAccent(accentColor);
  const numbered = collectFootnotes(sections);
  const resolved = indexFootnotes(numbered);

  return (
    <>
      {sections.map((section, i) => {
        const num = i + 1;
        switch (section.type) {
          case 'yns-thesis':
            return (
              <MemoYnsThesis
                key={i}
                section={section}
                index={num}
                accent={accent}
                resolved={resolved}
              />
            );
          case 'observation':
            return (
              <MemoObservation
                key={i}
                section={section}
                index={num}
                accent={accent}
                resolved={resolved}
              />
            );
          case 'comparable':
            return (
              <MemoComparable
                key={i}
                section={section}
                index={num}
                accent={accent}
                resolved={resolved}
              />
            );
          case 'methodology':
            return (
              <MemoMethodology key={i} section={section} index={num} accent={accent} />
            );
          case 'about':
            return <MemoAbout key={i} section={section} index={num} accent={accent} />;
          case 'artifact':
            return <MemoArtifact key={i} section={section} index={num} accent={accent} />;
        }
      })}
    </>
  );
}

/**
 * Bottom-of-page footnotes block. Pulled out of MemoSectionList in the M8
 * redesign so the page can place a soft action between the sections and the
 * appendix without splitting the section list around it.
 */
export function MemoFootnotes({ sections }: { sections: MemoMicrositeSection[] }) {
  const numbered = collectFootnotes(sections);
  return <FootnoteList footnotes={numbered} />;
}

/**
 * Build the contents-rail entries from the section list. Same order, same
 * IDs as the rendered sections — the rail anchors and scrollspy line up.
 *
 * Pass `withPreambleFor` to prepend a non-numbered "For {firstName}" entry
 * marked with the reference mark `※`. Use this when a personalized reader
 * has been resolved and a MemoPreamble will render above §01.
 *
 * Pass `withAudio` to insert a non-numbered "Audio brief" entry marked with
 * the play indicator `▷`. The audio register renders just below the
 * personalized preamble (or just below the cover when no preamble), above
 * the §-numbered sections — so the TOC entry slots in the same position
 * (after preamble, before §01) and the scrollspy anchors line up.
 */
export function buildTocEntries(
  sections: MemoMicrositeSection[],
  options?: { withPreambleFor?: string; withAudio?: boolean | { label?: string; id?: string } },
): { id: string; num: string; label: string }[] {
  const entries = sections.map((s, i) => ({
    id: s.sectionId ?? s.type,
    num: `§${String(i + 1).padStart(2, '0')}`,
    label: EYEBROW_LABEL[s.type],
  }));
  const preamble = options?.withPreambleFor
    ? [{ id: 'note', num: '※', label: `For ${options.withPreambleFor}` }]
    : [];
  const audio = options?.withAudio;
  const audioEntry = audio
    ? [
        {
          id: typeof audio === 'object' && audio.id ? audio.id : 'audio',
          num: '▷',
          label: typeof audio === 'object' && audio.label ? audio.label : 'Audio brief',
        },
      ]
    : [];
  return [...preamble, ...audioEntry, ...entries];
}

// ── MemoPreamble ──────────────────────────────────────────────────────

interface MemoPreambleProps {
  variant: PersonVariant;
}

/**
 * Personalized preamble rendered above §01 when ?p=<variant-slug> matches
 * a known PersonVariant. Reads as a "publisher's note" — italic pull
 * quote of the openingHook, then the framingNarrative as a body
 * paragraph, then the stakeStatement set off as a small "what's at stake"
 * line. Distinct visual character from §01 (no numeric eyebrow, no drop
 * cap on the framing paragraph) so the universal thesis still leads as
 * the structural argument.
 */
export function MemoPreamble({ variant }: MemoPreambleProps) {
  const firstName = variant.person.firstName ?? variant.person.name ?? 'you';
  return (
    <section id="note" className="mb-24 scroll-mt-20">
      <p
        className={`mb-4 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] ${FONT_MONO}`}
      >
        <span style={{ color: 'var(--memo-accent)' }}>※</span>
        <span className="text-[#8a847b]">·</span>
        <span className="tracking-[0.18em] text-[#8a847b]">A note for {firstName}</span>
      </p>

      <blockquote
        className={`m-0 mb-8 max-w-[26ch] border-l-2 border-[#a89e8b] pl-5 text-[#1a1a1a] ${FONT_SERIF}`}
        style={{
          fontStyle: 'italic',
          fontVariationSettings: "'opsz' 36, 'SOFT' 100, 'WONK' 1",
          fontWeight: 400,
          fontSize: 'clamp(1.45rem, 1.2vw + 0.95rem, 1.95rem)',
          lineHeight: 1.32,
          letterSpacing: '-0.005em',
        }}
      >
        &ldquo;{variant.openingHook}&rdquo;
      </blockquote>

      <p>{variant.framingNarrative}</p>

      <div
        className={`mt-7 border-t border-[#d8d2c2] pt-5 ${FONT_SANS}`}
      >
        <p
          className={`mb-1.5 text-[10.5px] uppercase tracking-[0.22em] text-[#8a847b] ${FONT_MONO}`}
        >
          What&rsquo;s at stake
        </p>
        <p
          className={`m-0 text-[16.5px] leading-[1.55] text-[#4a4641] ${FONT_SERIF}`}
          style={{
            fontStyle: 'italic',
            fontVariationSettings: "'opsz' 18, 'SOFT' 80",
          }}
        >
          {variant.stakeStatement}
        </p>
      </div>

      <div className={`mt-12 text-center text-[12px] tracking-[0.4em] text-[#8a847b] ${FONT_MONO}`}>
        ∎ &nbsp;∎ &nbsp;∎
      </div>
    </section>
  );
}
