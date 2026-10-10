/**
 * PRESENTATION SCRUBS for the seller's emails (the Gmail action UI audit, GUI-11, 2026-10-10). Pure, client-safe.
 *
 * The vault's own syntax ([[wiki links]], a trailing "per [[RETIREMENT-HANDOFF]] since..."), a URL cut mid-way by an
 * earlier clip, and repeated state words leaked into the digest and the assignments. These scrubs take them out of
 * the words a seller reads; they never change stored text.
 */

/** "[[RETIREMENT-HANDOFF]]" -> "RETIREMENT-HANDOFF"; "[[Kenco|the account]]" -> "the account". */
export function scrubWiki(s: string): string {
  return s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1');
}

/** A URL left cut by an earlier clip ("https://gusto.com/some/pa...") is dropped from the words, never shown half. */
export function dropCutUrls(s: string): string {
  return s.replace(/\s*https?:\/\/\S*(?:\.\.\.|…)(?=\s|$)/g, '').replace(/\s{2,}/g, ' ').trim();
}

/** Cut at a sentence end past `max`, else at a word; a run with no sentence end is cut hard at twice `max`. */
export function clipWords(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const head = t.slice(0, max + 1);
  const ends = [...head.matchAll(/[.!?](?=\s|$)/g)].map((m) => m.index as number);
  if (ends.length) return t.slice(0, ends[ends.length - 1] + 1).trim();
  const space = head.lastIndexOf(' ');
  return `${t.slice(0, space > max / 2 ? space : max).trim()}...`.slice(0, max * 2);
}

/** The one scrub the renderers apply to every line of prose. */
export const cleanLine = (s: string): string => dropCutUrls(scrubWiki(s)).replace(/\s+([,.;:])/g, '$1').trim();

/** A sentence that repeats one already printed (after scrubbing and case) is dropped; order kept. */
export function dedupeSentences(lines: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    const key = cleanLine(l).toLowerCase().replace(/[^a-z0-9 ]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}
