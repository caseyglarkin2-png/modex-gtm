/**
 * Client-safe text for the opening-story block (UX-06). The anchor projection (anchor.ts) reaches the research layer
 * (node:fs through research/propose), so a client component must never import a VALUE from it; the one map it needs
 * lives here. anchor.ts re-exports these for the server side.
 */
export type PrimaryBy = 'your choice' | 'their remit' | 'the highest-ranked usable thesis';

export const PRIMARY_BY_TEXT: Record<PrimaryBy, string> = {
  'your choice': 'your choice',
  'their remit': 'it lands on their remit',
  'the highest-ranked usable thesis': 'the highest-ranked usable thesis',
};
