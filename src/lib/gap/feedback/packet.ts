/**
 * The note shape and its debug packet (client-safe: no node or server imports). The packet holds only what the note
 * already holds, so no secret can be in it.
 */
export type FeedbackType = 'bug' | 'friction' | 'data' | 'research' | 'copy' | 'idea' | 'keep' | 'other';
export type FeedbackStatus = 'open' | 'later' | 'fixed' | 'dismissed';
export interface FeedbackContextShape {
  route?: string;
  lane?: string;
  accountName?: string;
  accountSlug?: string;
  personId?: string;
  signalId?: string;
  sourceUrl?: string;
  hypothesisId?: string;
  cardId?: string;
  surface?: string;
  viewport?: { w: number; h: number };
  device?: 'phone' | 'tablet' | 'desktop';
  errorCode?: string;
}

export interface FeedbackItem {
  id: string;
  note: string;
  type: FeedbackType | null;
  status: FeedbackStatus;
  context: FeedbackContextShape;
  build: string | null;
  createdAt: string;
  actor: string;
  statusAt: string | null;
}

/** A concise, Claude-ready report of one note. Only what the note already holds: no secrets can be in it. */
export function debugPacket(f: FeedbackItem): string {
  const c = f.context;
  const obj = [c.accountName && `account ${c.accountName}`, !c.accountName && c.accountSlug && `account ${c.accountSlug}`, c.personId && `person ${c.personId}`, c.hypothesisId && `hypothesis ${c.hypothesisId}`, c.cardId && `card ${c.cardId}`, c.signalId && `signal ${c.signalId}`, c.sourceUrl && `source ${c.sourceUrl}`].filter(Boolean).join(', ');
  return [
    `GAP DOGFOOD NOTE ${f.id}`,
    `WHAT CASEY SAID: ${f.note}`,
    `TYPE: ${f.type ?? 'unclassified'} · STATUS: ${f.status}`,
    `WHERE IT HAPPENED: ${c.surface ?? 'unknown surface'}${c.lane ? ` (lane ${c.lane})` : ''}`,
    `ACCOUNT / OBJECT: ${obj || 'none recorded'}`,
    `BUILD SHA: ${f.build ?? 'unknown'}`,
    `ROUTE: ${c.route ?? 'unknown'}`,
    `ERROR CODE: ${c.errorCode ?? 'none'}`,
    `DEVICE: ${c.device ?? 'unknown'}${c.viewport ? ` ${c.viewport.w}x${c.viewport.h}` : ''}`,
    `TIME: ${f.createdAt}`,
  ].join('\n');
}
