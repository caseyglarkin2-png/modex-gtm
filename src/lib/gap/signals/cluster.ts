/**
 * STORY CLUSTERING (GAP Signal Intelligence B): one event, many sources.
 *
 * A press release, a Reuters piece, a trade-press rewrite and a syndicated
 * copy are ONE event. Conservative and deterministic: two sources are the same
 * event only when they belong to the SAME resolved account, were published (or
 * captured) within 4 days of each other, and share the story's specific words
 * (title-word overlap >= 0.5, account name removed) or the same URL slug.
 * Different events at one account stay apart. Nothing is merged away: every
 * source keeps its row; they share `event_id` (the earliest source's id).
 * The event's primary source (press release, filing, the company's newsroom)
 * is preferred for verification.
 */
import { storyTokens } from './research';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const CLUSTER_WINDOW_MS = 4 * 86_400_000;
export const CLUSTER_MIN_OVERLAP = 0.5;

export interface ClusterRow {
  id: string;
  url: string | null;
  title: string | null;
  account_name: string | null;
  published_at: Date | string | null;
  created_at: Date | string;
  event_id: string | null;
}

function slugTokens(url: string | null): Set<string> {
  if (!url) return new Set();
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean);
    const slug = [...seg].reverse().find((s) => s.includes('-') && s.split('-').length >= 4) ?? '';
    return new Set(slug.toLowerCase().split('-').filter((w) => w.length >= 3 && !/^\d+$/.test(w)));
  } catch {
    return new Set();
  }
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

const when = (r: ClusterRow) => new Date(r.published_at ?? r.created_at).getTime();

/** Pure: are these two sources the same event? */
export function sameEvent(a: ClusterRow, b: ClusterRow): boolean {
  if (!a.account_name || a.account_name !== b.account_name) return false;
  if (Math.abs(when(a) - when(b)) > CLUSTER_WINDOW_MS) return false;
  const sa = slugTokens(a.url);
  const sb = slugTokens(b.url);
  if (sa.size >= 4 && sb.size >= 4 && jaccard(sa, sb) >= 0.8) return true;
  if (!a.title || !b.title) return false;
  const ta = storyTokens(a.title, a.account_name);
  const tb = storyTokens(b.title, b.account_name);
  return Math.min(ta.size, tb.size) >= 3 && jaccard(ta, tb) >= CLUSTER_MIN_OVERLAP;
}

/** Attach one resolved source to an existing event at its account, if one matches. Returns the event id. */
export async function clusterSignal(prisma: PrismaLike, id: string): Promise<string | null> {
  const row: ClusterRow | null = await prisma.gapSignal.findUnique({ where: { id }, select: { id: true, url: true, title: true, account_name: true, published_at: true, created_at: true, event_id: true } });
  if (!row?.account_name) return null;
  const t = when(row);
  const peers: ClusterRow[] = await prisma.gapSignal.findMany({
    where: {
      account_name: row.account_name,
      id: { not: row.id },
      resolution: 'resolved',
      OR: [{ feedback: null }, { feedback: { in: ['use', 'good_context'] } }],
      created_at: { gte: new Date(Math.min(t, Date.now()) - 45 * 86_400_000) },
    },
    select: { id: true, url: true, title: true, account_name: true, published_at: true, created_at: true, event_id: true },
    orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    take: 300,
  });
  const match = peers.find((p) => sameEvent(row, p));
  const eventId = match ? (match.event_id ?? match.id) : (row.event_id ?? row.id);
  if (eventId !== row.event_id) await prisma.gapSignal.update({ where: { id: row.id }, data: { event_id: eventId } });
  return eventId;
}
