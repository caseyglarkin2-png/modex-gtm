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

const FONT_SANS = 'font-[family-name:var(--font-memo-sans)]';
const FONT_MONO = 'font-[family-name:var(--font-memo-mono)]';

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
 * FootnoteMarker components. Unknown ids are left as raw text — the
 * renderer logs but doesn't crash.
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

// ── Section frame: numeral + content ──────────────────────────────────
//
// Earlier version: heavy 4px brand-saturated border-l-4 on every section.
// Replaced with a small two-digit numeral set in the brand accent (the only
// place per-section color appears) and a hairline rule above the H2. Pulls
// the eye to the writing, not the chrome.

function MemoSectionFrame({
  number,
  numeralClass,
  sectionId,
  children,
}: {
  number: number;
  numeralClass: string;
  sectionId?: string;
  children: ReactNode;
}) {
  const formatted = String(number).padStart(2, '0');
  return (
    <section id={sectionId} className="scroll-mt-24">
      <p
        className={`mb-4 text-[11px] tracking-[0.18em] ${numeralClass} ${FONT_MONO}`}
      >
        §{formatted}
      </p>
      {children}
    </section>
  );
}

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
    >
      <h2>{headline}</h2>
      <div className="mt-5 space-y-5">
        {YNS_THESIS.paragraphs.map((para, i) => (
          <p key={i}>{renderBodyWithFootnotes(para.body, resolved)}</p>
        ))}
      </div>
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
    >
      <h2>{section.headline}</h2>
      {section.composition.length > 0 ? (
        <dl
          className={`mt-5 grid gap-x-8 gap-y-0 text-[14px] sm:grid-cols-2 ${FONT_SANS}`}
        >
          {section.composition.map((row) => (
            <div
              key={row.label}
              className="flex justify-between border-b border-slate-200 py-2.5"
            >
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-medium text-slate-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-6">{renderBodyWithFootnotes(section.hypothesis, resolved)}</p>
      {section.caveat ? (
        <p className="mt-4 border-l-2 border-slate-200 pl-4 text-[14.5px] italic leading-relaxed text-slate-500">
          {section.caveat}
        </p>
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
    >
      <h2>{section.headline}</h2>
      <p className="mt-5">
        <strong>{section.comparableName}</strong> — {section.comparableProfile}
      </p>
      {section.metrics.length > 0 ? (
        <ul
          className={`mt-5 divide-y divide-slate-200 border-y border-slate-200 ${FONT_SANS}`}
        >
          {section.metrics.map((row) => (
            <li
              key={row.label}
              className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-baseline gap-x-4 py-3 text-[14.5px]"
            >
              <span className="font-medium text-slate-800">{row.label}</span>
              <span className="text-slate-500">
                <span className="text-slate-400">{row.before}</span>
                <span className="mx-2 text-slate-300">→</span>
                <span className="text-slate-800">{row.after}</span>
              </span>
              <span
                className={`text-right text-[10px] uppercase tracking-[0.12em] text-slate-400 ${FONT_MONO}`}
              >
                [{row.delta}]
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-5">
        <strong>Time to first impact.</strong>{' '}
        {renderBodyWithFootnotes(section.timeline, resolved)}
      </p>
      {section.referenceAvailable ? (
        <p className="mt-3 text-[14px] text-slate-500">
          A peer call with {section.comparableName}’s team can be arranged when
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
    >
      <h2>{section.headline}</h2>
      <p className="mt-5">Sources used in this analysis, with confidence levels:</p>
      <ul className={`mt-5 space-y-4 text-[14.5px] ${FONT_SANS}`}>
        {section.sources.map((src) => (
          <li key={src.id} className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-medium text-slate-800">{src.source}</span>
              <ConfidenceBadge confidence={src.confidence} />
            </div>
            {src.detail ? <p className="text-slate-600">{src.detail}</p> : null}
          </li>
        ))}
      </ul>
      {section.unknowns.length > 0 ? (
        <>
          <h3 className="mt-7">What we don’t know</h3>
          <ul
            className={`mt-3 space-y-1.5 text-[14.5px] text-slate-600 ${FONT_SANS}`}
          >
            {section.unknowns.map((u, i) => (
              <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-x-1">
                <span className="text-slate-400">·</span>
                <span>{u}</span>
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
    >
      <h2>{section.headline ?? 'About this analysis'}</h2>
      <p className="mt-5">{section.authorBio}</p>
      {section.signOff ? <p className="mt-4">{section.signOff}</p> : null}
      <p className="mt-4 text-[14px] text-slate-500">
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
      <FootnoteList footnotes={numbered} />
    </>
  );
}
