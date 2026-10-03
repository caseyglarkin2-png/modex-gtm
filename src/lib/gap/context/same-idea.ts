/**
 * Two lines say the same thing in different words (click test round 4: Kroger's Giant Eagle merger as "we announced"
 * and "the Company announced"; PepsiCo's Gatik partnership as a condition and as a quote). Exact-text dedupe misses
 * these. Same idea = they share a named party other than the account AND enough of their words, or nearly all of
 * their words. Two different events at two places share neither.
 */
const STOP_PROPER = new Set(['on', 'the', 'we', 'our', 'company', 'inc', 'corporation', 'corp', 'co', 'north', 'america', 'american', 'united', 'states', 'this', 'that', 'in', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'recent', 'event', 'ongoing', 'condition']);

const words = (t: string) => new Set(t.toLowerCase().replace(/[’']s\b/g, '').split(/[^a-z0-9-]+/).filter((w) => w.length >= 4));
const proper = (t: string, account: string) => {
  const own = new Set(account.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  return new Set((t.match(/\b[A-Z][a-zA-Z&-]{2,}\b/g) ?? []).map((w) => w.toLowerCase().replace(/[’']s$/, '')).filter((w) => !STOP_PROPER.has(w) && !own.has(w)));
};

/** Names and numbers: what makes two otherwise similar lines different events (Reno vs Dallas, site 1 vs site 2). */
const marks = (t: string, account: string) => new Set([...proper(t, account), ...(t.match(/\b\d+(?:[.,]\d+)?\b/g) ?? [])]);

export function sameIdea(a: string, b: string, accountName: string): boolean {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return false;
  // Each names something the other does not: two events, however alike the wording.
  const ma = marks(a, accountName);
  const mb = marks(b, accountName);
  if ([...ma].some((x) => !mb.has(x)) && [...mb].some((x) => !ma.has(x))) return false;
  const inter = [...wa].filter((w) => wb.has(w)).length;
  const jaccard = inter / (wa.size + wb.size - inter);
  if (jaccard >= 0.6) return true;
  const pb = proper(b, accountName);
  const sharedParty = [...proper(a, accountName)].some((w) => pb.has(w));
  return sharedParty && jaccard >= 0.25;
}
