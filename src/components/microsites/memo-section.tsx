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

// ── Footnote collection ───────────────────────────────────────────────
//
// The renderer walks all sections, extracts FootnoteData[] in document
// order, and runs numberFootnotes() once. The same numbered map is then
// passed to inline FootnoteMarkers (via lookup by id) and to the bottom
// FootnoteList. No client state.

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

// ── Per-section renderers ─────────────────────────────────────────────

function MemoSectionFrame({
  accentRuleClass,
  sectionId,
  children,
}: {
  accentRuleClass: string;
  sectionId?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={sectionId}
      className={`scroll-mt-24 border-l-4 ${accentRuleClass} pl-6 md:pl-8`}
    >
      {children}
    </section>
  );
}

function MemoYnsThesis({
  section,
  accent,
  resolved,
}: {
  section: YnsThesisSection;
  accent: ReturnType<typeof getMemoAccent>;
  resolved: Record<string, NumberedFootnote>;
}) {
  const headline = section.headlineOverride ?? YNS_THESIS.defaultHeadline;
  return (
    <MemoSectionFrame accentRuleClass={accent.ruleClass} sectionId={section.sectionId ?? 'yns-thesis'}>
      <h2>{headline}</h2>
      <div className="mt-3 space-y-4">
        {YNS_THESIS.paragraphs.map((para, i) => (
          <p key={i}>{renderBodyWithFootnotes(para.body, resolved)}</p>
        ))}
      </div>
    </MemoSectionFrame>
  );
}

function MemoObservation({
  section,
  accent,
  resolved,
}: {
  section: ObservationSection;
  accent: ReturnType<typeof getMemoAccent>;
  resolved: Record<string, NumberedFootnote>;
}) {
  return (
    <MemoSectionFrame accentRuleClass={accent.ruleClass} sectionId={section.sectionId ?? 'observation'}>
      <h2>{section.headline}</h2>
      {section.composition.length > 0 ? (
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {section.composition.map((row) => (
            <div key={row.label} className="flex justify-between border-b border-slate-100 py-1.5">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-medium text-slate-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-4">{renderBodyWithFootnotes(section.hypothesis, resolved)}</p>
      {section.caveat ? (
        <p className="mt-3 text-sm italic text-slate-500">{section.caveat}</p>
      ) : null}
    </MemoSectionFrame>
  );
}

function MemoComparable({
  section,
  accent,
  resolved,
}: {
  section: ComparableSection;
  accent: ReturnType<typeof getMemoAccent>;
  resolved: Record<string, NumberedFootnote>;
}) {
  return (
    <MemoSectionFrame accentRuleClass={accent.ruleClass} sectionId={section.sectionId ?? 'comparable'}>
      <h2>{section.headline}</h2>
      <p className="mt-3">
        <strong>{section.comparableName}</strong> — {section.comparableProfile}
      </p>
      {section.metrics.length > 0 ? (
        <table className="mt-4 w-full table-auto border-collapse text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Metric</th>
              <th className="py-2 pr-4 font-medium">Before</th>
              <th className="py-2 pr-4 font-medium">After</th>
              <th className="py-2 pr-4 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {section.metrics.map((row) => (
              <tr key={row.label} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-800">{row.label}</td>
                <td className="py-2 pr-4 text-slate-600">{row.before}</td>
                <td className="py-2 pr-4 text-slate-800">{row.after}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{row.delta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <p className="mt-4">
        <strong>Time to first impact:</strong> {renderBodyWithFootnotes(section.timeline, resolved)}
      </p>
      {section.referenceAvailable ? (
        <p className="mt-3 text-sm text-slate-500">
          Reference availability: a peer call with {section.comparableName}’s team can be arranged when the conversation calls for it.
        </p>
      ) : null}
    </MemoSectionFrame>
  );
}

function MemoMethodology({
  section,
  accent,
}: {
  section: MethodologySection;
  accent: ReturnType<typeof getMemoAccent>;
}) {
  return (
    <MemoSectionFrame accentRuleClass={accent.ruleClass} sectionId={section.sectionId ?? 'methodology'}>
      <h2>{section.headline}</h2>
      <p className="mt-3">Sources used in this analysis, with confidence levels:</p>
      <ul className="mt-3 space-y-2 text-sm">
        {section.sources.map((src) => (
          <li key={src.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-slate-800">{src.source}</span>
            <ConfidenceBadge confidence={src.confidence} />
            {src.detail ? <span className="block w-full text-slate-600">{src.detail}</span> : null}
          </li>
        ))}
      </ul>
      {section.unknowns.length > 0 ? (
        <>
          <h3 className="mt-6">What we don’t know</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            {section.unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </>
      ) : null}
    </MemoSectionFrame>
  );
}

function MemoAbout({
  section,
  accent,
}: {
  section: AboutSection;
  accent: ReturnType<typeof getMemoAccent>;
}) {
  return (
    <MemoSectionFrame accentRuleClass={accent.ruleClass} sectionId={section.sectionId ?? 'about'}>
      <h2>{section.headline ?? 'About this analysis'}</h2>
      <p className="mt-3">{section.authorBio}</p>
      {section.signOff ? <p className="mt-3">{section.signOff}</p> : null}
      <p className="mt-3 text-sm text-slate-600">
        Reach the author at{' '}
        <a href={`mailto:${section.authorEmail}`}>{section.authorEmail}</a>.
      </p>
      {/* The /roi/ deep link gets injected here by the Sprint M4 wiring. */}
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
        switch (section.type) {
          case 'yns-thesis':
            return <MemoYnsThesis key={i} section={section} accent={accent} resolved={resolved} />;
          case 'observation':
            return <MemoObservation key={i} section={section} accent={accent} resolved={resolved} />;
          case 'comparable':
            return <MemoComparable key={i} section={section} accent={accent} resolved={resolved} />;
          case 'methodology':
            return <MemoMethodology key={i} section={section} accent={accent} />;
          case 'about':
            return <MemoAbout key={i} section={section} accent={accent} />;
        }
      })}
      <FootnoteList footnotes={numbered} />
    </>
  );
}
