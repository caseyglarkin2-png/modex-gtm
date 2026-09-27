/**
 * THE FIRST-TOUCH OPENER LIMIT (final Monday P1, 2026-09-27). Pure.
 *
 * A GAP first touch opens with ONE verified outreach fact, quoted whole with
 * its source (research/propose.ts citedQuote). The compiler's C07 word count
 * (compiler/checks/c07-structure.ts) excludes at most MAX_QUOTED_WORDS of
 * verified quoted words from the 45..80 step-1 range; every quoted word past
 * that counts as ours, so an observation quoting more than that can never
 * pass Send. The audit defect: research joined EVERY found fact into the
 * observation, the thesis was approved and used, and it only failed at Send.
 *
 * This is the same number, applied where the opener is decided (evidence
 * choice, research proposal) and again before a thesis can be approved or put
 * in use, so a known-invalid opener never becomes active.
 */
import { MAX_QUOTED_WORDS } from '../compiler/checks/c07-structure';
import { stripMarkers, wordCount } from '../compiler/text';

/** The most quoted source words one first-touch opener may carry (the compiler's C07 exclusion cap). */
export const OPENER_MAX_QUOTED_WORDS = MAX_QUOTED_WORDS;

const QUOTED = /"([^"\n]*)"/g;

/** Words inside the observation's quotes (citation tokens inside a quote are not words). */
export function openerQuotedWords(observation: string | null | undefined): number {
  let n = 0;
  for (const m of String(observation ?? '').matchAll(QUOTED)) n += wordCount(stripMarkers(m[1]));
  return n;
}

/** Does this observation fit a first touch the compiler can pass? */
export function openerFits(observation: string | null | undefined): boolean {
  return openerQuotedWords(observation) <= OPENER_MAX_QUOTED_WORDS;
}

/** Does this one fact, quoted whole, fit a first-touch opener? */
export function factFitsOpener(excerpt: string | null | undefined): boolean {
  return wordCount(stripMarkers(String(excerpt ?? ''))) <= OPENER_MAX_QUOTED_WORDS;
}
