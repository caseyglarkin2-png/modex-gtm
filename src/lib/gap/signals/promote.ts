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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type PromoteRefusal = 'not_found' | 'not_resolved' | 'not_verified' | 'no_link' | 'already_promoted' | 'ignored';

export function accountSlugFor(accountName: string): string {
  const reg = getAllAccountMicrositeData().find((a) => a.accountName.toLowerCase() === accountName.toLowerCase());
  return reg?.slug ?? accountName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function promoteSignal(
  prisma: PrismaLike,
  id: string,
  deps: { ingest?: typeof ingestTriggers } = {},
): Promise<{ ok: true; triggerId: number | null; created: boolean } | { ok: false; reason: PromoteRefusal }> {
  const s: Record<string, unknown> | null = await prisma.gapSignal.findUnique({ where: { id } });
  if (!s) return { ok: false, reason: 'not_found' };
  if (s.promoted_trigger_id) return { ok: false, reason: 'already_promoted' };
  if (s.feedback && s.feedback !== 'use' && s.feedback !== 'good_context') return { ok: false, reason: 'ignored' };
  if (s.resolution !== 'resolved' || !s.account_name) return { ok: false, reason: 'not_resolved' };
  if (s.research_status !== 'fact_found') return { ok: false, reason: 'not_verified' };
  if (!s.url) return { ok: false, reason: 'no_link' };
  const accountName = String(s.account_name);
  const title = String(s.title ?? s.url);
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
  await prisma.gapSignal.update({ where: { id }, data: { promoted_trigger_id: trigger?.id ?? null } });
  return { ok: true, triggerId: trigger?.id ?? null, created: r.created > 0 };
}
