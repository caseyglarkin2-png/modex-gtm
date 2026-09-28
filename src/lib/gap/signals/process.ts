/**
 * SIGNAL PROCESSING PASS (GAP Signal Intelligence B), bounded and idempotent:
 *
 *   1. RESOLVING   a link whose page could not be read at capture (paywall,
 *                  timeout, a transient block) is retried, at most 3 times;
 *                  the title and date it yields can resolve the account.
 *   2. CLUSTERING  a resolved source joins an existing event at its account
 *                  when it is the same story (cluster.ts); every source kept.
 *   3. PROMOTION   a resolved signal whose story research VERIFIED enters the
 *                  canonical Pounce spine (promote.ts).
 * Research itself runs in background research (research/background.ts), which
 * follows up queued signals. Nothing here links evidence, touches a hypothesis,
 * drafts, enrolls or sends.
 */
import { clusterSignal } from './cluster';
import { classifySignal, defaultFetchHtml, parseSignalMeta, resolveSignalAccount, type FetchHtml } from './intake';
import { promoteSignal } from './promote';
import type { ingestTriggers } from '@/lib/pounce/ingest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const META_MAX_ATTEMPTS = 3;

export interface ProcessResult {
  retried: number;
  resolvedOnRetry: number;
  clustered: number;
  joinedEvents: number;
  promoted: number;
  errors: string[];
}

export async function processSignals(
  prisma: PrismaLike,
  opts: { now: Date; retryLimit?: number; clusterLimit?: number; promoteLimit?: number },
  deps: { fetchHtml?: FetchHtml; ingest?: typeof ingestTriggers } = {},
): Promise<ProcessResult> {
  const res: ProcessResult = { retried: 0, resolvedOnRetry: 0, clustered: 0, joinedEvents: 0, promoted: 0, errors: [] };
  const fetchHtml = deps.fetchHtml ?? defaultFetchHtml;

  // 1. Retry unreadable pages for signals that still need an account.
  const stuck: Array<Record<string, unknown> & { id: string; url: string; metadata: Record<string, unknown> | null; origin: string; account_hint: string | null }> = await prisma.gapSignal.findMany({
    where: { resolution: 'needs_account', url: { not: null }, title: null, created_at: { gte: new Date(opts.now.getTime() - 14 * 86_400_000) } },
    orderBy: { created_at: 'desc' },
    take: opts.retryLimit ?? 20,
  });
  for (const s of stuck) {
    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    const attempts = Number(meta.metaAttempts ?? 1);
    if (attempts >= META_MAX_ATTEMPTS) continue;
    res.retried += 1;
    try {
      const m = parseSignalMeta(await fetchHtml(s.url));
      const r = await resolveSignalAccount(prisma, { accountHint: s.account_hint, title: m.title, url: s.url });
      const cls = classifySignal(m.title ?? '', r.accountName);
      await prisma.gapSignal.update({
        where: { id: s.id },
        data: {
          title: m.title,
          published_at: m.publishedAt,
          ...(m.siteName ? { source_name: m.siteName } : {}),
          resolution: r.resolution,
          resolution_basis: r.basis,
          account_name: r.accountName,
          ...(r.candidates.length ? { candidates: r.candidates } : {}),
          relevance: cls.relevance,
          categories: cls.categories,
          score: cls.score,
          ...(s.origin === 'casey_share' && r.resolution === 'resolved' ? { research_status: 'queued' } : {}),
          metadata: { ...meta, metaAttempts: attempts + 1, metaError: null, metaRetriedAt: opts.now.toISOString() },
        },
      });
      if (r.resolution === 'resolved') res.resolvedOnRetry += 1;
    } catch (e) {
      await prisma.gapSignal.update({ where: { id: s.id }, data: { metadata: { ...meta, metaAttempts: attempts + 1, metaError: (e instanceof Error ? e.message : String(e)).slice(0, 120), metaRetriedAt: opts.now.toISOString() } } });
    }
  }

  // 2. Cluster resolved sources not yet clustered.
  // Filtered in code: a JSON-path NOT filter drops rows where the key is absent (SQL NULL), i.e. every new source.
  const recent: Array<{ id: string; event_id: string | null; metadata: Record<string, unknown> | null }> = await prisma.gapSignal.findMany({
    where: { resolution: 'resolved', account_name: { not: null }, created_at: { gte: new Date(opts.now.getTime() - 30 * 86_400_000) } },
    select: { id: true, event_id: true, metadata: true },
    orderBy: { created_at: 'asc' },
    take: 1_000,
  });
  const unclustered = recent.filter((r) => (r.metadata as { clustered?: unknown } | null)?.clustered !== true).slice(0, opts.clusterLimit ?? 100);
  for (const s of unclustered) {
    try {
      const eventId = await clusterSignal(prisma, s.id);
      res.clustered += 1;
      if (eventId && eventId !== s.id) res.joinedEvents += 1;
      await prisma.gapSignal.update({ where: { id: s.id }, data: { metadata: { ...((s.metadata ?? {}) as Record<string, unknown>), clustered: true } } });
    } catch (e) {
      res.errors.push(`cluster ${s.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 80)}`);
    }
  }

  // 3. Promote verified, resolved signals through the canonical Pounce path.
  const verified: Array<{ id: string }> = await prisma.gapSignal.findMany({
    where: { research_status: 'fact_found', resolution: 'resolved', promoted_trigger_id: null, url: { not: null }, OR: [{ feedback: null }, { feedback: { in: ['use', 'good_context'] } }] },
    select: { id: true },
    take: opts.promoteLimit ?? 10,
  });
  for (const v of verified) {
    try {
      const r = await promoteSignal(prisma, v.id, { ingest: deps.ingest });
      if (r.ok) res.promoted += 1;
    } catch (e) {
      res.errors.push(`promote ${v.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 80)}`);
    }
  }
  return res;
}
