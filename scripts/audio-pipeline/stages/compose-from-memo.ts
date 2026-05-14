/**
 * Memo-body source extractor for the audio pipeline.
 *
 * For hand-tuned accounts (Kraft-Heinz, Dannon, etc.) we already have a
 * rich 5-section memo on disk. Rather than asking Gemini to do a parallel
 * deep-research pass — which risks NotebookLM saying things the memo
 * doesn't — we feed the rendered memo body straight into NotebookLM.
 *
 * Output is a single coherent markdown document NotebookLM will treat as
 * one source. Section ordering matches the on-page render so the audio
 * "mirrors the document" exactly.
 */

import type {
  AccountMicrositeData,
  ComparableSection,
  MethodologySection,
  ObservationSection,
} from '@/lib/microsites/schema';
import { resolveMemoSections } from '@/lib/microsites/memo-compat';
import { YNS_THESIS } from '@/lib/microsites/yns-thesis';

export interface MemoSourceOutput {
  /** Plain markdown source body to paste into NotebookLM. */
  source: string;
  /** Customization prompt to paste into NotebookLM's "Customize" dialog. */
  customizationPrompt: string;
}

export function composeFromMemo(account: AccountMicrositeData): MemoSourceOutput {
  const sections = resolveMemoSections(account);

  const lines: string[] = [];
  lines.push(`# ${account.accountName} — Yard Network Operating Layer`);
  lines.push('');
  lines.push(`Vertical: ${account.vertical}`);
  if (account.coverFootprint) lines.push(`Footprint: ${account.coverFootprint}`);
  lines.push('');
  lines.push(`Cover thesis: ${account.coverHeadline ?? `Yard execution as a network constraint for ${account.accountName}`}.`);
  lines.push('');

  lines.push(`## ${YNS_THESIS.defaultHeadline}`);
  lines.push('');
  for (const p of YNS_THESIS.paragraphs) {
    lines.push(stripFootnoteMarkers(p.body));
    lines.push('');
  }

  for (const section of sections) {
    if (section.type === 'yns-thesis') continue;
    if (section.type === 'artifact') continue;

    if (section.type === 'observation') {
      const o = section as ObservationSection;
      lines.push(`## ${o.headline}`);
      lines.push('');
      if (o.composition.length > 0) {
        lines.push('Network composition:');
        for (const row of o.composition) {
          lines.push(`- ${row.label}: ${row.value}`);
        }
        lines.push('');
      }
      for (const para of o.hypothesis.split(/\n\n+/)) {
        lines.push(stripFootnoteMarkers(para));
        lines.push('');
      }
      if (o.pullQuote) {
        lines.push(`Pull quote: "${o.pullQuote}"`);
        lines.push('');
      }
      if (o.caveat) {
        lines.push(`Caveat: ${o.caveat}`);
        lines.push('');
      }
      continue;
    }

    if (section.type === 'comparable') {
      const c = section as ComparableSection;
      lines.push(`## ${c.headline}`);
      lines.push('');
      lines.push(`Comparable: ${c.comparableName}. ${c.comparableProfile}`);
      lines.push('');
      if (c.metrics.length > 0) {
        lines.push('Measured outcomes:');
        for (const m of c.metrics) {
          lines.push(`- ${m.label}: ${m.before} → ${m.after} (${m.delta})`);
        }
        lines.push('');
      }
      if (c.timeline) {
        lines.push(`Timeline: ${c.timeline}`);
        lines.push('');
      }
      continue;
    }

    if (section.type === 'methodology') {
      const m = section as MethodologySection;
      lines.push(`## ${m.headline}`);
      lines.push('');
      lines.push('Sources:');
      for (const s of m.sources) {
        const detail = s.detail ? ` — ${s.detail}` : '';
        lines.push(`- ${s.source} [${s.confidence}]${detail}`);
      }
      lines.push('');
      if (m.unknowns.length > 0) {
        lines.push('What we do not know:');
        for (const u of m.unknowns) lines.push(`- ${u}`);
        lines.push('');
      }
      continue;
    }

    if (section.type === 'about') {
      lines.push(`## ${section.headline ?? 'About this analysis'}`);
      lines.push('');
      lines.push(section.authorBio);
      lines.push('');
      if (section.signOff) {
        lines.push(section.signOff);
        lines.push('');
      }
      continue;
    }
  }

  const source = lines.join('\n').trim() + '\n';
  const customizationPrompt = buildCustomizationPrompt(account);

  return { source, customizationPrompt };
}

function buildCustomizationPrompt(account: AccountMicrositeData): string {
  const primary = account.personVariants[0]?.person;
  const reader = primary
    ? `${primary.name}, ${primary.title} at ${account.accountName}`
    : `the senior supply-chain executive at ${account.accountName}`;

  const driver = account.signals?.urgencyDriver
    ? `\n- Urgency driver: ${account.signals.urgencyDriver}`
    : '';

  return [
    `Produce a private audio brief, not a "deep dive" podcast. The audience is one person: ${reader}.`,
    '',
    'Tone: anti-sales, observational, peer-to-peer — a colleague briefing another colleague. Willing to be wrong out loud. No hype, no sales pitch, no glossary for a general audience.',
    '',
    'The document is a five-section memo: the YNS thesis (universal), an observation about this specific network, a comparable case (Primo Brands), the methodology behind the analysis, and a brief about-the-author close. Walk those five beats in order. Do not invent claims the document does not make.',
    '',
    'CRITICAL FRAMING — non-negotiable, supersedes any conflicting instinct:',
    '',
    '1. The yard layer is BELOW the existing visibility / control / planning tower at this account, not above it. The yard execution layer FEEDS the tower the ground truth it cannot operate without. Never imply the yard layer sits "above" the planning or visibility stack.',
    '',
    '2. When citing Primo Brands measured outcomes — turn time, dock-office headcount, per-site profit impact — say "we measured" or "we observed" — NOT "Primo measured" or "they measured." We deployed YardFlow at Primo and measured the outcomes ourselves; the Primo CFO and ops team validated.',
    '',
    '3. Truck turn time improvement is "up to 50%" — a ceiling, not a guarantee. Frame the 48-minute → 24-minute Primo result as "the upper bound of measured improvement at the comparable network." Do not say "we will get you 50%" or "expect 50%" about this account.',
    '',
    '4. Do NOT say or imply this account\'s yards are running on radios and clipboards. Most Tier 1 CPG / retail / 3PL networks already have site-level yard automation in place. The wedge is the NETWORK-LEVEL operating layer beneath the visibility tower — not a tech-absence story. Working capital is held hostage by tribal knowledge, inconsistent processes across sites, and uneven visibility into how each yard actually executes.',
    '',
    '5. Pilot timing is roughly 90 days kickoff-to-deployed-pilot (discovery, integration, configuration, live deployment), with front-end cadence dependent on the account\'s resource availability and any existing yard-tech footprint at the chosen site. The first measurable impact is read inside 30-60 days of monitored post-deployment operation. Do NOT collapse this to "30-60 days" as the all-in timeline — be exhaustive about both phases.',
    '',
    `Account context:${driver}`,
    `- Account: ${account.accountName}`,
    `- Vertical: ${account.vertical}`,
    account.coverFootprint ? `- Footprint: ${account.coverFootprint}` : '',
    '',
    'Target 15-20 minutes. Open with the universal YNS thesis. Land on the single most important thing for this executive to internalize after listening.',
    '',
    'Avoid generalities about logistics. Every claim should be traceable to a specific line in the source document.',
  ]
    .filter(Boolean)
    .join('\n');
}

function stripFootnoteMarkers(text: string): string {
  return text.replace(/\[\^[^\]]+\]/g, '').replace(/  +/g, ' ').trim();
}
