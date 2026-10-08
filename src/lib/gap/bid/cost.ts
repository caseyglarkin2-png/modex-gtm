/**
 * WHAT IT COSTS THEM (Sprint 5 review, R50, 2026-10-07). Pure and client-safe.
 *
 * The buyer has said what the problem costs when they gave an impact, or a number in money or detention terms ("We
 * pay about forty thousand a month in detention at Columbus" is a metric, and it is the cost). A volume figure alone
 * ("300 trailers a day") is not a cost. The account story's "What we need to learn" and NOW's Impact read it the same
 * way, so neither says "nothing on cost" beside a brief that shows the buyer's detention figure.
 */
const COST_WORDS = /\$|\bdollars?\b|\bthousand\b|\bmillion\b|\bcosts?\b|\bpa(?:y|ys|id|ying)\b|\bspend(?:s|ing)?\b|\bdetention\b|\bdemurrage\b|\bfees?\b|\bcharges?\b|\bpenalt(?:y|ies)\b|\bovertime\b/i;

export function isCostBid(b: { type: string; summary?: string | null; quote?: string | null }): boolean {
  if (b.type === 'impact') return true;
  return b.type === 'metric' && (COST_WORDS.test(b.summary ?? '') || COST_WORDS.test(b.quote ?? ''));
}
