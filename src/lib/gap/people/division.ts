/**
 * OPERATING UNITS (V2, 2026-10-03). At a multi-division shipper the unit that runs the yard is the division, not the
 * parent (operator review: blending Frito-Lay, PBNA and Quaker into one footprint loses a VP Logistics in a minute).
 *
 * Evidence only: a division is named when a title, a site name or a family account says so. An email domain never
 * assigns one (every PepsiCo division mails from pepsico.com). Divisions that have their own GAP account are linked
 * through the corporate family (Account.parent_brand, family/family.ts); this vocabulary only labels people and
 * sites INSIDE the parent account.
 */

interface DivisionVocabulary {
  parent: string;
  divisions: Array<{ name: string; re: RegExp }>;
}

const VOCAB: readonly DivisionVocabulary[] = [
  {
    parent: 'PepsiCo',
    divisions: [
      { name: 'PBNA', re: /\b(pbna|pepsico beverages|pepsi beverages|beverages north america|na\s*-\s*beverages|north america beverages)\b/i },
      { name: 'Frito-Lay', re: /\bfrito[- ]?lay\b/i },
      { name: 'Quaker', re: /\bquaker\b(?!\s+houghton)/i },
      { name: 'Gatorade', re: /\bgatorade\b/i },
      { name: 'PepsiCo Foods North America', re: /\b(pfna|pepsico foods|foods north america)\b/i },
    ],
  },
];

/** The vocabulary for this account, if it is a multi-division parent we know. */
export const divisionsFor = (accountName: string) => VOCAB.find((v) => v.parent.toLowerCase() === accountName.trim().toLowerCase()) ?? null;

/** The division a text (a title, a site name) names, else null. Never inferred from anything else. */
export function divisionOf(accountName: string, text: string | null | undefined): string | null {
  const v = divisionsFor(accountName);
  if (!v || !text) return null;
  return v.divisions.find((d) => d.re.test(text))?.name ?? null;
}

/** Counts of audited sites by the division their name carries (unnamed sites are counted as such). */
export function sitesByDivision(accountName: string, siteNames: readonly string[]): { counts: Array<[string, number]>; unnamed: number; missing: string[] } | null {
  const v = divisionsFor(accountName);
  if (!v || !siteNames.length) return null;
  const counts = new Map<string, number>();
  let unnamed = 0;
  for (const n of siteNames) {
    const d = divisionOf(accountName, n);
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
    else unnamed += 1;
  }
  const order = (d: string) => v.divisions.findIndex((x) => x.name === d);
  return { counts: [...counts.entries()].sort((a, b) => b[1] - a[1] || order(a[0]) - order(b[0])), unnamed, missing: v.divisions.map((d) => d.name).filter((d) => !counts.has(d)) };
}
