/**
 * PROMOTION TO THE POUNCE SPINE (GAP Signal Intelligence B).
 *
 * Do not pollute Pounce: a raw captured signal never writes a PounceTrigger,
 * never stamps HubSpot trigger heat, never pings Slack. A signal is PROMOTED
 * only when (1) its account is resolved and (2) research verified a fact about
 * its story (research_status fact_found): then it is a real, verified account
 * event, and it enters through the ONE canonical write path
 * (src/lib/pounce/ingest.ts ingestTriggers) with the fields derived honestly:
 * the account, the source title and URL, the deterministic Pounce score and
 * categories, the publication date. The spine's own rules then decide Slack and
 * HubSpot (score >= 8 only) and dedupe. Nothing here duplicates that logic.
 */
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { hashUrl, ingestTriggers, type RawTrigger } from '@/lib/pounce/ingest';
import { scoreTrigger } from '@/lib/pounce/score';
import { storyTokens } from './research';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type PromoteRefusal = 'not_found' | 'not_resolved' | 'not_verified' | 'no_link' | 'already_promoted' | 'ignored' | 'not_recent' | 'undated' | 'manual_verify';

/**
 * Production dogfood fix (2026-09-28): a trigger is something happening NOW. A verified story published more than
 * this long ago stays verified evidence but never enters the spine as a new trigger (it pinged Slack and stamped
 * HubSpot heat for a June story in September).
 */
export const PROMOTE_MAX_AGE_MS = 21 * 86_400_000;
/** A Pounce trigger already on the account for the same story (published within this window) is that story. */
export const SAME_STORY_WINDOW_MS = 7 * 86_400_000;

/** Two headlines about one account tell the same story when they share half their specific words (account name removed). */
export function sameStory(a: string, b: string, accountName: string): boolean {
  const ta = storyTokens(a, accountName);
  const tb = storyTokens(b, accountName);
  if (Math.min(ta.size, tb.size) < 2) return false;
  let inter = 0;
  for (const x of ta) if (tb.has(x)) inter += 1;
  return inter / Math.min(ta.size, tb.size) >= 0.5;
}

export function accountSlugFor(accountName: string): string {
  const reg = getAllAccountMicrositeData().find((a) => a.accountName.toLowerCase() === accountName.toLowerCase());
  return reg?.slug ?? accountName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function promoteSignal(
  prisma: PrismaLike,
  id: string,
  deps: { ingest?: typeof ingestTriggers; now?: Date } = {},
): Promise<{ ok: true; triggerId: number | null; created: boolean } | { ok: false; reason: PromoteRefusal }> {
  const now = deps.now ?? new Date();
  const s: Record<string, unknown> | null = await prisma.gapSignal.findUnique({ where: { id } });
  if (!s) return { ok: false, reason: 'not_found' };
  if (s.promoted_trigger_id) return { ok: false, reason: 'already_promoted' };
  // Stabilization B: a source Casey asked GAP to verify is only verified. No trigger, no Slack, no HubSpot heat.
  if ((s.metadata as { manualVerify?: unknown } | null)?.manualVerify) return { ok: false, reason: 'manual_verify' };
  if (s.feedback && s.feedback !== 'use' && s.feedback !== 'good_context') return { ok: false, reason: 'ignored' };
  if (s.resolution !== 'resolved' || !s.account_name) return { ok: false, reason: 'not_resolved' };
  if (s.research_status !== 'fact_found') return { ok: false, reason: 'not_verified' };
  if (!s.url) return { ok: false, reason: 'no_link' };
  // Review B P2: ONE event enters the spine once, whichever of its sources verified first.
  if (s.event_id) {
    const sibling: { id: string } | null = await prisma.gapSignal.findFirst({ where: { event_id: s.event_id, id: { not: id }, promoted_trigger_id: { not: null } }, select: { id: true } });
    if (sibling) return { ok: false, reason: 'already_promoted' };
  }
  if (!s.published_at) return { ok: false, reason: 'undated' };
  const published = new Date(String(s.published_at));
  if (now.getTime() - published.getTime() > PROMOTE_MAX_AGE_MS) return { ok: false, reason: 'not_recent' };
  const accountName = String(s.account_name);
  const title = String(s.title ?? s.url);
  // The same story may already be a trigger (another outlet, another producer): link to it, never a second ping.
  const nearby: Array<{ id: number; title: string; published_at: Date | null; first_seen_at: Date }> = await prisma.pounceTrigger.findMany({
    where: { account_name: { equals: accountName, mode: 'insensitive' }, OR: [{ published_at: { gte: new Date(published.getTime() - SAME_STORY_WINDOW_MS), lte: new Date(published.getTime() + SAME_STORY_WINDOW_MS) } }, { published_at: null, first_seen_at: { gte: new Date(published.getTime() - SAME_STORY_WINDOW_MS) } }] },
    select: { id: true, title: true, published_at: true, first_seen_at: true },
    take: 50,
  });
  const same = nearby.find((t) => sameStory(t.title, title, accountName));
  if (same) {
    await prisma.gapSignal.update({ where: { id }, data: { promoted_trigger_id: same.id, metadata: { ...((s.metadata ?? {}) as Record<string, unknown>), promotedAt: now.toISOString(), promotion: { linkedToExisting: same.id } } } });
    return { ok: true, triggerId: same.id, created: false };
  }
  const { score, categories } = scoreTrigger(title, accountName);
  const raw: RawTrigger = {
    accountSlug: accountSlugFor(accountName),
    accountName,
    title,
    url: String(s.url),
    source: 'web',
    score,
    categories,
    publishedAt: s.published_at ? new Date(String(s.published_at)).toISOString() : null,
  };
  const r = await (deps.ingest ?? ingestTriggers)([raw]);
  const trigger: { id: number } | null = await prisma.pounceTrigger.findUnique({ where: { url_hash: hashUrl(raw.url) }, select: { id: true } });
  await prisma.gapSignal.update({ where: { id }, data: { promoted_trigger_id: trigger?.id ?? null, metadata: { ...((s.metadata ?? {}) as Record<string, unknown>), promotedAt: new Date().toISOString(), promotion: { created: r.created, duplicate: r.duplicate, pinged: r.pinged, stamped: r.stamped } } } });
  return { ok: true, triggerId: trigger?.id ?? null, created: r.created > 0 };
}
