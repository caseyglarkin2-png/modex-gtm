/**
 * A FIREFLIES CAPTURE, READ (knowledge program, 2026-10-09). Pure.
 *
 * The vault's sweep writes each call as an immutable capture: "## Call summary (Fireflies)" bullets, "## Action items"
 * grouped under bold names, "## Keywords", then "## Transcript (verbatim)". The vault's own rule: the verbatim is the
 * ground truth; the summary is advisory and has been seen to hallucinate (a 2026-07-16 summary rendered Primo as
 * Nestle's). This reader takes the summary and the action items for the story, bounded, and never the transcript.
 */
export interface FirefliesRead {
  summary: string[];
  actions: Array<{ who: string | null; text: string }>;
  keywords: string[];
}

const SUMMARY_MAX = 6;
const ACTIONS_MAX = 8;

function sections(text: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let current: string | null = null;
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const h = /^##\s+(.+?)\s*$/.exec(raw);
    if (h) {
      current = h[1].toLowerCase();
      out.set(current, []);
      continue;
    }
    if (current) out.get(current)!.push(raw);
  }
  return out;
}

const clean = (s: string) => s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

export function parseFirefliesCapture(text: string): FirefliesRead {
  const secs = sections(text);
  const summaryLines = [...secs.entries()].find(([k]) => k.startsWith('call summary'))?.[1] ?? [];
  const summary = summaryLines
    .map((l) => /^\s*[-*]\s+(.+)$/.exec(l)?.[1] ?? '')
    .filter(Boolean)
    .map((l) => clean(l).replace(/^([^:]{2,60}):\s*/, (_, head: string) => `${head}: `))
    .slice(0, SUMMARY_MAX);
  const actionLines = [...secs.entries()].find(([k]) => k.startsWith('action items'))?.[1] ?? [];
  const actions: Array<{ who: string | null; text: string }> = [];
  let who: string | null = null;
  for (const raw of actionLines) {
    const l = raw.trim();
    if (!l) continue;
    const name = /^\*\*(.+?)\*\*$/.exec(l);
    if (name) {
      who = name[1].trim();
      continue;
    }
    const t = clean(l).replace(/\s*\(\d{1,2}:\d{2}(?::\d{2})?\)\s*$/, '').replace(/^[-*]\s+/, '');
    if (t && actions.length < ACTIONS_MAX) actions.push({ who, text: t });
  }
  const keywordLines = [...secs.entries()].find(([k]) => k.startsWith('keywords'))?.[1] ?? [];
  const keywords = keywordLines.join(' ').split(',').map((k) => k.trim()).filter(Boolean).slice(0, 12);
  return { summary, actions, keywords };
}
