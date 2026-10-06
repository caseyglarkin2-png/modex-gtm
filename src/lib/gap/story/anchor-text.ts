/**
 * Client-safe text for the opening-story block (UX-06). The anchor projection (anchor.ts) reaches the research layer
 * (node:fs through research/propose), so a client component must never import a VALUE from it; the one map it needs
 * lives here. anchor.ts re-exports these for the server side.
 */
export type PrimaryBy = 'your choice' | 'their remit' | 'the highest-ranked usable thesis';

/**
 * The remit caution, one sentence, said the same way wherever the opener shows (NEXT on the account page, the call
 * brief): the opening fact may not land on the chosen person's remit, and the eligible person it fits is named.
 */
export function remitCaution(first: string, factLabel: string, fitsBetter: { name: string; title: string | null } | null): string {
  return `Caution: the opening fact is ${factLabel} and may not land on ${first}'s remit${fitsBetter ? `; ${fitsBetter.name}${fitsBetter.title ? `, ${fitsBetter.title},` : ''} fits it` : ''}.`;
}

export const PRIMARY_BY_TEXT: Record<PrimaryBy, string> = {
  'your choice': 'your choice',
  'their remit': 'it lands on their remit',
  'the highest-ranked usable thesis': 'the highest-ranked usable thesis',
};
