/**
 * THE REPORT PARSERS (intelligence wiring, IW03, 2026-10-09). Pure, deterministic, no model.
 *
 * Three producers already write daily reports: the Yards First Brief and the Freight X Signal Desk (ChatGPT
 * conversations) and the Codex HubSpot Activity & Engagement automation. Each report is a narrative with atomic
 * developments inside it. These readers cut a report into IntelligenceRecordInput records along the report's OWN
 * structure (its headings and bold labels), keeping the substantive passage verbatim, the producer's confidence and
 * limitations verbatim, its commentary apart, its drafted posts and messages as archived suggestions, and the whole
 * report as a `report` container so nothing the cut did not understand is lost. Nothing here infers a date the report
 * did not state, resolves an account, or rewrites a sentence.
 */
import { cleanSourceUrl, type IntelSource, type IntelligenceRecordInput } from './intelligence-record';

const MONTHS: Record<string, number> = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12, jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n: number) => String(n).padStart(2, '0');
/** "October 9, 2026" -> "2026-10-09"; null when the words are not a date. */
export function dateFromWords(words: string): string | null {
  const m = /([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(words);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${pad(month)}-${pad(Number(m[2]))}`;
}

/** A capture wraps the entity markers in private-use characters (U+E200..U+E202): cut before any match. */
const PRIVATE_USE = /[-]/g;
/** The ChatGPT citation markers and entity wrappers, cut to their words. */
export function stripMarkers(s: string): string {
  return s
    .replace(PRIVATE_USE, '')
    .replace(/:chatgpt-content-reference\{[^}]*\}/g, '')
    .replace(/entity\["[a-z]+","((?:[^"\\]|\\.)*)","(?:[^"\\]|\\.)*"\]/g, '$1')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
const unbold = (s: string) => s.replace(/\*\*/g, '').trim();
const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};
/** Every [label](url) in a text, as sources (tracking parameters cut), in order, deduplicated by url. */
export function linksOf(text: string): IntelSource[] {
  const out: IntelSource[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const url = cleanSourceUrl(m[2]);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, publisher: hostOf(url), label: stripMarkers(unbold(m[1])) || null });
  }
  return out;
}
/** The people the entity markers name. */
export function peopleOf(text: string): string[] {
  const out: string[] = [];
  for (const m of text.replace(PRIVATE_USE, '').matchAll(/entity\["people","((?:[^"\\]|\\.)*)"/g)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}
/** The companies and organisations the entity markers name. */
export function organisationsOf(text: string): string[] {
  const out: string[] = [];
  for (const m of text.replace(PRIVATE_USE, '').matchAll(/entity\["(?:company|organization)","((?:[^"\\]|\\.)*)"/g)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item';
/** A paragraph's words without links' urls (the label stays), markers cut. */
const prose = (s: string) => stripMarkers(s.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '$1')).replace(/\*\*/g, '').trim();

export interface ParseOptions {
  /** The producer's run id for this report (a message id, an automation run). */
  runId: string;
  /** The capture date (YYYY-MM-DD) for a report that does not state its own date. */
  capturedOn: string;
  /** When the producer collected the report, if known. */
  collectedAt?: string | null;
}

export interface ParsedReport {
  reportedOn: string;
  reportedOnBasis: 'stated' | 'captured';
  records: IntelligenceRecordInput[];
  /** The container record (the narrative as captured); always first in `records`. */
  container: IntelligenceRecordInput;
}

/** The blocks of a passage: each starts at a line that opens with a bold label and runs to the next. */
function boldBlocks(lines: string[]): Array<{ label: string | null; head: string; body: string[] }> {
  const blocks: Array<{ label: string | null; head: string; body: string[] }> = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    // A "Sources:" line that is not bold still starts its own block (it follows the score line in some issues).
    const m = /^\*\*([^*]+?)\*\*(.*)$/.exec(line.trim()) ?? (/^((?:Direct )?Sources?):\s*(.*)$/i.exec(line.trim()) ? (() => { const s = /^((?:Direct )?Sources?):\s*(.*)$/i.exec(line.trim())!; return [s[0], `${s[1]}:`, s[2]] as unknown as RegExpExecArray; })() : null);
    if (m) {
      const inner = m[1].trim();
      const colon = inner.indexOf(':');
      const label = colon > 0 ? inner.slice(0, colon).trim() : inner.replace(/[.:]$/, '').trim();
      const headRest = colon > 0 ? inner.slice(colon + 1).trim() : '';
      blocks.push({ label, head: `${headRest}${headRest && m[2].trim() ? ' ' : ''}${m[2].trim()}`.trim(), body: [] });
      continue;
    }
    if (!blocks.length) blocks.push({ label: null, head: '', body: [] });
    blocks[blocks.length - 1].body.push(line);
  }
  return blocks;
}
const joinBody = (b: { head: string; body: string[] }) => [b.head, ...b.body].join('\n').replace(/\n{3,}/g, '\n\n').trim();

// ------------------------------------------------------------------------------------------------ Yards First Brief

/**
 * "# Yards First Daily | October 9, 2026", "## 2. Decision-grade signals", "### 1. NEW: <title>", then bold labels:
 * Development (the substance), Score/Confidence (the uncertainty), Sources (links), and the commentary labels (Why now,
 * Yard implication, Editorial opportunity, Commercial opportunity, Casey's move) kept apart as interpretation.
 */
export function parseYardsFirstReport(text: string, opts: ParseOptions): ParsedReport {
  const body = text.replace(/\r/g, '');
  const dateLine = /^#\s+Yards First Daily\s*\|\s*(.+)$/m.exec(body);
  const stated = dateLine ? dateFromWords(dateLine[1]) : null;
  const reportedOn = stated ?? opts.capturedOn;
  const basis: 'stated' | 'captured' = stated ? 'stated' : 'captured';
  const producer = 'yards_first_brief';
  const common = { producer, producerRunId: opts.runId, reportedOn, reportedOnBasis: basis, collectedAt: opts.collectedAt ?? null } as const;
  const idBase = stated ? reportedOn : opts.runId;
  const container: IntelligenceRecordInput = { ...common, producerItemId: `${idBase}#report`, kind: 'report', title: `Yards First Daily, ${reportedOn}`, text: body.trim(), sources: linksOf(body), archive: { reportRef: opts.runId, section: null }, visibility: 'archive' };
  const records: IntelligenceRecordInput[] = [container];
  const sections = body.split(/^(?=##\s)/m);
  const signalsSection = sections.find((s) => /^##\s+\d+\.\s+Decision-grade signal/i.test(s)) ?? null;
  if (!signalsSection) return { reportedOn, reportedOnBasis: basis, records, container };
  const items = signalsSection.split(/^(?=###\s)/m).slice(1);
  items.forEach((item, i) => {
    const lines = item.split('\n');
    const h = /^###\s+(?:(\d+)\.\s*)?(?:([A-Z][A-Z -]{1,20}):\s*)?(.+?)\s*$/.exec(lines[0]) ?? null;
    const n = h?.[1] ? Number(h[1]) : i + 1;
    const status = h?.[2]?.trim() ?? null;
    const title = stripMarkers(unbold(h?.[3] ?? lines[0].replace(/^###\s*/, '')));
    const blocks = boldBlocks(lines.slice(1).filter((l, j, all) => !(l.trim() === '' && (all[j - 1] ?? '').trim() === '')));
    const dev = blocks.find((b) => b.label && /^development/i.test(b.label)) ?? blocks.find((b) => b.label === null) ?? blocks[0] ?? null;
    const score = blocks.find((b) => b.label && /^(score|confidence)/i.test(b.label)) ?? null;
    const sourceBlocks = blocks.filter((b) => b.label && /sources?$/i.test(b.label));
    const interpretation = blocks
      .filter((b) => b !== dev && b !== score && !sourceBlocks.includes(b) && b.label)
      .map((b) => `${b.label}: ${prose(joinBody(b))}`.replace(/:\s*$/, ''))
      .filter((s) => s.length > (s.indexOf(':') + 2));
    const sources = linksOf(item);
    const passage = dev ? prose(joinBody(dev)) : '';
    const uncertainty = score ? prose(`${score.label}: ${joinBody(score)}`) : null;
    const cut = !score && i === items.length - 1;
    records.push({
      ...common,
      producerItemId: `${idBase}#${n}`,
      kind: 'development',
      title,
      text: passage,
      sources,
      personHints: peopleOf(item),
      producerStatus: status,
      uncertainty,
      interpretation: interpretation.length ? interpretation.join('\n') : null,
      archive: { reportRef: opts.runId, section: `Decision-grade signal ${n}${cut ? ' (the capture ends inside it)' : ''}` },
      visibility: 'digest',
    });
  });
  return { reportedOn, reportedOnBasis: basis, records, container };
}

// ------------------------------------------------------------------------------------------- Freight X Signal Desk

/**
 * "# Signal Desk | Friday, October 9, 2026" (older issues state no date), "### 1. POST THIS" or "**1) POST THIS**",
 * "### 2. REPLY HERE", "### 3. RELATIONSHIP MOVE", "## Other conversations ..." with "### <title>" under it, and the
 * reserve posts. The observation is the prose; drafted posts and replies (writing blocks, blockquotes) are suggestions;
 * "Action:" lines are interpretation; the people named are hints.
 */
export function parseSignalDeskReport(text: string, opts: ParseOptions): ParsedReport {
  const body = text.replace(/\r/g, '');
  const dateLine = /^#\s+Signal Desk\s*\|\s*(.+)$/m.exec(body);
  const stated = dateLine ? dateFromWords(dateLine[1]) : null;
  const reportedOn = stated ?? opts.capturedOn;
  const basis: 'stated' | 'captured' = stated ? 'stated' : 'captured';
  const producer = 'freight_x_signal_desk';
  const common = { producer, producerRunId: opts.runId, reportedOn, reportedOnBasis: basis, collectedAt: opts.collectedAt ?? null } as const;
  const idBase = stated ? reportedOn : opts.runId;
  // The writing blocks (drafted posts, replies, documents) are suggestions wherever they sit.
  const writing: string[] = [];
  const withoutWriting = body.replace(/:::writing\{[^}]*\}\n([\s\S]*?)\n:::/g, (_, inner: string) => {
    writing.push(inner.trim());
    return `\n[[suggestion ${writing.length}]]\n`;
  });
  const container: IntelligenceRecordInput = { ...common, producerItemId: `${idBase}#report`, kind: 'report', title: `Signal Desk, ${reportedOn}`, text: body.trim(), sources: linksOf(body), suggestions: writing, archive: { reportRef: opts.runId, section: null }, visibility: 'archive' };
  const records: IntelligenceRecordInput[] = [container];
  // Blocks: a markdown heading, or a line that is only a bold label ("**1) POST THIS**", "**POST 2**").
  const lines = withoutWriting.split('\n');
  const blocks: Array<{ heading: string; parent: string; lines: string[] }> = [];
  let parent = '';
  for (const l of lines) {
    const h2 = /^##\s+(.+)$/.exec(l);
    const h3 = /^###\s+(.+)$/.exec(l);
    const boldOnly = /^\*\*([^*]+)\*\*\s*$/.exec(l.trim());
    if (h2 && !/^#\s/.test(l)) {
      parent = h2[1].trim();
      blocks.push({ heading: parent, parent: '', lines: [] });
      continue;
    }
    if (h3 || (boldOnly && /^(\d+[).]|POST|REPLY|RELATIONSHIP)/i.test(boldOnly[1]))) {
      blocks.push({ heading: (h3?.[1] ?? boldOnly?.[1] ?? '').trim(), parent, lines: [] });
      continue;
    }
    if (blocks.length) blocks[blocks.length - 1].lines.push(l);
  }
  let n = 0;
  for (const b of blocks) {
    const heading = stripMarkers(unbold(b.heading));
    const head = heading.toLowerCase();
    const parentHead = b.parent.toLowerCase();
    const isMove = /post this|reply here|relationship move/.test(head);
    const isOther = /other (conversations|people)/.test(parentHead);
    const isReserve = /reserve posts|more worth posting/.test(head) || /reserve posts|more worth posting/.test(parentHead) || /^post \d+$/.test(head);
    if (!isMove && !isOther && !isReserve) continue;
    const content = b.lines.join('\n');
    if (!content.trim()) continue;
    const quotes: string[] = [];
    const rest: string[] = [];
    let quote: string[] = [];
    const flush = () => { if (quote.length) { quotes.push(quote.join('\n').trim()); quote = []; } };
    for (const l of content.split('\n')) {
      if (/^>\s?/.test(l)) { quote.push(l.replace(/^>\s?/, '')); continue; }
      flush();
      rest.push(l);
    }
    flush();
    const suggestions = [...quotes, ...[...content.matchAll(/\[\[suggestion (\d+)\]\]/g)].map((m) => writing[Number(m[1]) - 1]).filter(Boolean)];
    const interpretation: string[] = [];
    const passage: string[] = [];
    for (const l of rest) {
      const t = l.trim();
      if (!t || /^\[\[suggestion \d+\]\]$/.test(t) || /^---+$/.test(t)) continue;
      if (/^\*\*(action|next action|follow|reply|post|connect)\b/i.test(t) || /^(reply|note|exact note):?$/i.test(t)) { interpretation.push(prose(t)); continue; }
      // A line that is only a link is a source, not prose.
      if (/^\**\[[^\]]+\]\(https?:\/\/[^)]+\)\**\s*$/.test(t)) continue;
      passage.push(prose(t));
    }
    n += 1;
    const people = peopleOf(content);
    const firstBold = /\*\*([^*]+)\*\*/.exec(content);
    const moveWord = heading.replace(/^\d+[).]\s*/, '').toLowerCase();
    // A move about a person is titled by the person; a post by its thesis (the first bold sentence); the rest by the heading.
    const title = isMove
      ? people.length && !/post this/.test(head)
        ? `${people[0]} (${moveWord})`.slice(0, 200)
        : stripMarkers(unbold(firstBold?.[1] ?? passage[0] ?? heading)).replace(/([?!])\.$/, '$1').replace(/\.$/, '').slice(0, 200)
      : heading.slice(0, 200);
    const textOut = passage.join('\n\n').trim();
    if (!textOut && !suggestions.length) continue;
    // "Exact note:" and "Reply:" lead into a drafted message (a suggestion), not a read.
    const interpretationOut = interpretation.map((l) => l.replace(/\s*(Exact note|Reply|Note):?\s*$/i, '').trim()).filter(Boolean);
    records.push({
      ...common,
      producerItemId: `${idBase}#${n}-${slug(isMove ? heading : heading)}`,
      kind: 'observation',
      title,
      text: textOut || title,
      sources: linksOf(content),
      personHints: people,
      accountHint: null,
      producerStatus: isMove ? heading.replace(/^\d+[).]\s*/, '') : isReserve ? 'reserve post' : 'conversation',
      interpretation: interpretationOut.length ? interpretationOut.join('\n') : null,
      suggestions,
      archive: { reportRef: opts.runId, section: b.parent ? `${b.parent} / ${b.heading}` : b.heading },
      visibility: isReserve ? 'archive' : 'digest',
    });
  }
  return { reportedOn, reportedOnBasis: basis, records, container };
}

// ----------------------------------------------------------------------- Codex HubSpot Activity & Engagement report

/**
 * "## HubSpot Activity & Engagement — Thu, Oct. 8" (no year: the capture's), the scorecard bullets (the container),
 * "### Strongest current buying signals" bullets: "**[Name — Company](record url)** — label, confidence. <the
 * substance>. [Evidence](url) (Oct. 8). Next: ..." The record ids come from the HubSpot urls; the date in brackets
 * after the evidence link is the event date; "Next:" is interpretation; "not verified" and "Jake/shared context"
 * sentences are uncertainty.
 */
export function parseHubSpotActivityReport(text: string, opts: ParseOptions & { year?: number }): ParsedReport {
  const body = text.replace(/\r/g, '');
  const year = opts.year ?? Number(opts.capturedOn.slice(0, 4));
  const head = /^##\s+HubSpot Activity & Engagement\s*[—-]+\s*(.+)$/m.exec(body);
  const stated = head ? dateFromWords(`${head[1].replace(/^[A-Za-z]+,\s*/, '').replace(/\.\s/, ' ')} ${year}`.replace(/(\d)\s+(\d{4})\s+\d{4}$/, '$1 $2')) : null;
  const reportedOn = stated ?? opts.capturedOn;
  const basis: 'stated' | 'captured' = stated ? 'stated' : 'captured';
  const producer = 'codex_hubspot_report';
  const common = { producer, producerRunId: opts.runId, reportedOn, reportedOnBasis: basis, collectedAt: opts.collectedAt ?? null } as const;
  const idBase = stated ? reportedOn : opts.runId;
  const gap = /^Data gap:\s*(.+)$/m.exec(body)?.[1]?.trim() ?? null;
  const inbox = [...body.matchAll(/::inbox-item\{([^}]*)\}/g)].map((m) => m[1].replace(/"/g, '').trim());
  const scope = /^Scope:\s*(.+)$/m.exec(body)?.[1]?.trim() ?? null;
  const container: IntelligenceRecordInput = { ...common, producerItemId: `${idBase}#report`, kind: 'report', title: `HubSpot Activity & Engagement, ${reportedOn}`, text: body.trim(), sources: linksOf(body), uncertainty: [scope ? `Scope: ${scope}` : null, gap ? `Data gap: ${gap}` : null].filter(Boolean).join('\n') || null, suggestions: inbox, archive: { reportRef: opts.runId, section: null }, visibility: 'archive' };
  const records: IntelligenceRecordInput[] = [container];
  const signals = body.split(/^###\s+Strongest current buying signals\s*$/m)[1]?.split(/^(?:###\s|Data gap:|::inbox-item)/m)[0] ?? '';
  const bullets = signals.split(/^-\s+(?=\*\*)/m).map((s) => s.trim()).filter(Boolean);
  for (const bullet of bullets) {
    const one = bullet.replace(/\s*\n\s*/g, ' ');
    const headM = /^\*\*(.+?)\*\*\s*[—-]+\s*(.*)$/.exec(one);
    if (!headM) continue;
    const headRaw = headM[1];
    const link = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/.exec(headRaw);
    const headText = stripMarkers(link ? link[1] : headRaw);
    const contactId = link ? /\/record\/0-1\/(\d+)/.exec(link[2])?.[1] ?? null : null;
    const parts = headText.split(/\s+[—-]+\s+/);
    const person = contactId && parts.length === 2 ? parts[0].trim() : null;
    const accountHint = contactId && parts.length === 2 ? parts[1].trim() : null;
    const after = headM[2];
    const sentences = after.split(/(?<=[.!?])\s+(?=[A-Z\[])/);
    const labelSentence = sentences[0] ?? '';
    const producerStatus = labelSentence.split(',')[0].replace(/\*\*/g, '').trim().slice(0, 60) || null;
    const evidence = /\[Evidence\]\((https?:\/\/[^)]+)\)\s*(?:\((\w+)\.?\s+(\d{1,2})\))?/.exec(after);
    const engagementId = evidence ? (() => { try { const f = new URL(evidence[1]).searchParams.get('filters'); const m = f ? /"value":"(\d+)"/.exec(f) : null; return m?.[1] ?? null; } catch { return null; } })() : null;
    const eventDate = evidence?.[2] && evidence[3] ? dateFromWords(`${evidence[2]} ${evidence[3]}, ${year}`) : null;
    const next = /\bNext:\s*(.+?)(?:\s*$)/.exec(prose(after))?.[1] ?? null;
    const substance = sentences.slice(1).filter((s) => !/^\[Evidence\]/.test(s) && !/^Next:/.test(s) && !/\[Evidence\]/.test(s)).map(prose).filter(Boolean);
    const uncertaintyBits = [labelSentence.replace(/\*\*/g, '').replace(/\.$/, '').trim(), ...substance.filter((s) => /not verified|shared context|rather than|unverified|partial/i.test(s))];
    const textOut = substance.filter((s) => !uncertaintyBits.includes(s)).join(' ').trim();
    const sources: IntelSource[] = [...(link ? [{ url: cleanSourceUrl(link[2]), publisher: 'app.hubspot.com', label: 'HubSpot contact record' }] : []), ...(evidence ? [{ url: cleanSourceUrl(evidence[1]), publisher: 'app.hubspot.com', label: 'HubSpot engagement (evidence)' }] : [])];
    records.push({
      ...common,
      producerItemId: `${idBase}#${contactId ?? engagementId ?? slug(headText)}`,
      kind: 'engagement',
      title: headText,
      text: textOut || prose(after),
      sources,
      sourceRecordIds: [...(contactId ? [{ system: 'hubspot', type: 'contact', id: contactId }] : []), ...(engagementId ? [{ system: 'hubspot', type: 'engagement', id: engagementId }] : [])],
      eventDate,
      accountHint,
      personHints: person ? [person] : [],
      producerStatus,
      uncertainty: uncertaintyBits.join(' ') || null,
      interpretation: next ? `Next: ${next}` : null,
      archive: { reportRef: opts.runId, section: 'Strongest current buying signals' },
      visibility: 'digest',
    });
  }
  return { reportedOn, reportedOnBasis: basis, records, container };
}

/** The parser for a known producer; null for an unknown one. */
export function parserFor(producer: string): ((text: string, opts: ParseOptions & { year?: number }) => ParsedReport) | null {
  switch (producer) {
    case 'yards_first_brief': return parseYardsFirstReport;
    case 'freight_x_signal_desk': return parseSignalDeskReport;
    case 'codex_hubspot_report': return parseHubSpotActivityReport;
    default: return null;
  }
}
