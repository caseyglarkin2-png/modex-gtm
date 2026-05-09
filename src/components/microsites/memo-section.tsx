import type { ReactNode } from 'react';
import {
  type FootnoteData,
  type MemoMicrositeSection,
  type YnsThesisSection,
  type ObservationSection,
  type ComparableSection,
  type MethodologySection,
  type AboutSection,
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

const FONT_SERIF = 'font-[family-name:var(--font-memo-serif)]';
const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

// Section-type → display label for the eyebrow ("§ 01 · OBSERVATION").
// Kept here (not in the schema module) because it's purely presentational.
const EYEBROW_LABEL: Record<MemoMicrositeSection['type'], string> = {
  'yns-thesis': 'The thesis',
  observation: 'Observation',
  comparable: 'Comparable',
  methodology: 'Methodology',
  about: 'Author',
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
  fontSize: 'clamp(1.5rem, 2.4vw, 1.85rem)',
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
        className={`mb-4 flex items-center gap-2.5 text-[10px] uppercase tracking-[0.24em] ${FONT_MONO}`}
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
        <div className={`mt-12 text-center text-[11px] tracking-[0.4em] text-[#8a847b] ${FONT_MONO}`}>
          ∎ &nbsp;∎ &nbsp;∎
        </div>
      ) : null}
    </section>
  );
}

/**
 * Inline aside used for the observation caveat, the thesis's "Aside" beat,
 * and any inline marginalia. On desktop these will eventually flow into
 * the right gutter; for now they sit inline as a hairline-bordered block.
 */
function MemoAside({ mark, children }: { mark: string; children: ReactNode }) {
  return (
    <aside
      className={`my-5 border-l-2 border-[#a89e8b] bg-[rgba(255,253,247,0.5)] px-4 py-3.5 text-[13px] leading-[1.55] text-[#8a847b] ${FONT_SANS}`}
    >
      <p className={`mb-1.5 text-[9.5px] uppercase tracking-[0.18em] text-[#6c9384] ${FONT_MONO}`}>
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
          className={`my-7 border-y border-[#d8d2c2] ${FONT_SANS} text-[13.5px] text-[#4a4641]`}
          style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
        >
          {section.composition.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_1.4fr] gap-x-5 py-2.5 ${
                i === 0 ? '' : 'border-t border-[#e8e2d4]'
              }`}
            >
              <dt
                className="pt-px text-[12.5px] uppercase tracking-[0.08em] text-[#8a847b]"
                style={{ fontVariationSettings: "'wdth' 95" }}
              >
                {row.label}
              </dt>
              <dd className="m-0 font-medium text-[#1a1a1a]">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="memo-lead">
        {renderBodyWithFootnotes(section.hypothesis, resolved)}
      </p>
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
          className={`my-7 list-none border-y border-[#d8d2c2] p-0 ${FONT_SANS} text-[13.5px]`}
        >
          {section.metrics.map((row, i) => (
            <li
              key={row.label}
              className={`grid grid-cols-1 gap-x-3 gap-y-1 py-3 sm:grid-cols-[12rem_1fr_6rem] sm:items-center sm:gap-y-0 ${
                i === 0 ? '' : 'border-t border-[#e8e2d4]'
              }`}
              style={{ fontVariantNumeric: 'lining-nums tabular-nums' }}
            >
              <span className="font-medium text-[#1a1a1a]">{row.label}</span>
              <span className="flex items-baseline gap-2 text-[13px] text-[#8a847b]">
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
                className={`text-left text-[10.5px] uppercase tracking-[0.08em] sm:text-right ${FONT_MONO}`}
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
        <p className="mt-5 text-[14px] text-[#8a847b]">
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
        className={`my-6 list-none p-0 ${FONT_SANS} text-[13.5px] leading-[1.5] text-[#4a4641]`}
      >
        {section.sources.map((src, i) => (
          <li
            key={src.id}
            className={`grid grid-cols-1 gap-x-6 gap-y-2 border-[#d8d2c2] py-4 sm:grid-cols-[1.3fr_1fr] ${
              i === 0 ? 'border-t' : 'border-t border-[#e8e2d4]'
            } ${i === section.sources.length - 1 ? 'border-b' : ''}`}
          >
            <div className="flex flex-col gap-1.5">
              <span className="text-[13.5px] font-medium text-[#1a1a1a]">{src.source}</span>
              <ConfidenceBadge confidence={src.confidence} />
            </div>
            {src.detail ? <p className="m-0 text-[#4a4641]">{src.detail}</p> : null}
          </li>
        ))}
      </ol>
      {section.unknowns.length > 0 ? (
        <>
          <h3
            className={`mt-8 mb-3 text-[1.05rem] text-[#1a1a1a] ${FONT_SERIF}`}
            style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 50", fontWeight: 480 }}
          >
            What we don&rsquo;t know
          </h3>
          <ul
            className={`mt-3 list-none p-0 ${FONT_SANS} text-[13.5px] leading-[1.6] text-[#4a4641]`}
          >
            {section.unknowns.map((u, i) => (
              <li
                key={i}
                className={`relative py-2 pl-5 ${i === 0 ? '' : 'border-t border-dotted border-[#d8d2c2]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-2 text-[11px] text-[#8a847b] ${FONT_MONO}`}
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
      <p className="mt-6 text-[14px] text-[#8a847b]">
        Reach the author at{' '}
        <a href={`mailto:${section.authorEmail}`}>{section.authorEmail}</a>.
      </p>
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
 */
export function buildTocEntries(
  sections: MemoMicrositeSection[],
): { id: string; num: string; label: string }[] {
  return sections.map((s, i) => ({
    id: s.sectionId ?? s.type,
    num: `§${String(i + 1).padStart(2, '0')}`,
    label: EYEBROW_LABEL[s.type],
  }));
}
