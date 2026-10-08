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
import { recordFailedResearchAttempt } from './research';
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
  /** Signals left "researching" by a run that died, returned to the queue. */
  requeued: number;
  errors: string[];
}

export async function processSignals(
  prisma: PrismaLike,
  opts: { now: Date; retryLimit?: number; clusterLimit?: number; promoteLimit?: number },
  deps: { fetchHtml?: FetchHtml; ingest?: typeof ingestTriggers } = {},
): Promise<ProcessResult> {
  const res: ProcessResult = { retried: 0, resolvedOnRetry: 0, clustered: 0, joinedEvents: 0, promoted: 0, requeued: 0, errors: [] };
  const fetchHtml = deps.fetchHtml ?? defaultFetchHtml;

  // 1. Retry unreadable pages for signals that still need an account.
  const stuck: Array<Record<string, unknown> & { id: string; url: string; metadata: Record<string, unknown> | null; origin: string; account_hint: string | null }> = await prisma.gapSignal.findMany({
    where: { resolution: 'needs_account', url: { not: null }, title: null, created_at: { gte: new Date(opts.now.getTime() - 14 * 86_400_000) } },
    orderBy: { created_at: 'desc' },
    take: 300,
  });
  // Rows that hit the attempt cap are skipped BEFORE the limit, so they never starve retryable ones.
  const retryable = stuck.filter((s) => Number(((s.metadata ?? {}) as Record<string, unknown>).metaAttempts ?? 1) < META_MAX_ATTEMPTS).slice(0, opts.retryLimit ?? 20);
  for (const s of retryable) {
    const meta = (s.metadata ?? {}) as Record<string, unknown>;
    const attempts = Number(meta.metaAttempts ?? 1);
    res.retried += 1;
    try {
      const m = parseSignalMeta(await fetchHtml(s.url));
      const r = await resolveSignalAccount(prisma, { accountHint: s.account_hint, title: m.title, url: s.url });
      const cls = classifySignal(m.title ?? '', r.accountName);
      // Conditional (final review P1): if Casey named the account while this page was being fetched, his wins.
      await prisma.gapSignal.updateMany({
        where: { id: s.id, resolution: 'needs_account' },
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

  // 1b. A research run that died mid-flight (serverless timeout) never leaves a signal "researching" forever.
  // Each requeue counts as a failed attempt, so a signal that times out every run is settled, never looped.
  const staleRows: Array<{ id: string; metadata: Record<string, unknown> | null }> = await prisma.gapSignal.findMany({
    where: { research_status: 'researching', updated_at: { lt: new Date(opts.now.getTime() - 30 * 60_000) } },
    select: { id: true, metadata: true },
    take: 100,
  });
  for (const r of staleRows) {
    // Batch item 10 (R25): a run that never finished is a failed attempt; the last one is the dead letter, never "no fact".
    await recordFailedResearchAttempt(prisma, r, 'research run did not finish (timed out)', opts.now);
    res.requeued += 1;
  }

  // 2. Cluster resolved sources not yet clustered.
  // Filtered in code: a JSON-path NOT filter drops rows where the key is absent (SQL NULL), i.e. every new source.
  const recent: Array<{ id: string; event_id: string | null; metadata: Record<string, unknown> | null }> = await prisma.gapSignal.findMany({
    where: { resolution: 'resolved', account_name: { not: null }, created_at: { gte: new Date(opts.now.getTime() - 30 * 86_400_000) } },
    select: { id: true, event_id: true, metadata: true },
    // Newest first (review B P2): a full window of already-clustered rows can never starve new sources.
    orderBy: { created_at: 'desc' },
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
    select: { id: true, metadata: true },
    take: 200,
  });
  // Promoted once: a promotion whose trigger row could not be found is not re-sent every pass (filtered before the limit).
  for (const v of verified.filter((x) => !(x as { metadata?: { promotedAt?: string } | null }).metadata?.promotedAt).slice(0, opts.promoteLimit ?? 10)) {
    try {
      const r = await promoteSignal(prisma, v.id, { ingest: deps.ingest, now: opts.now });
      // Old or undated verified stories stay evidence; they are marked so the pass never retries them.
      if (!r.ok && (r.reason === 'not_recent' || r.reason === 'undated' || r.reason === 'manual_verify')) {
        await prisma.gapSignal.update({ where: { id: v.id }, data: { metadata: { ...(((v as { metadata?: Record<string, unknown> | null }).metadata ?? {}) as Record<string, unknown>), promotedAt: opts.now.toISOString(), promotion: { skipped: r.reason } } } });
      }
      if (r.ok) res.promoted += 1;
    } catch (e) {
      res.errors.push(`promote ${v.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 80)}`);
    }
  }
  return res;
}
