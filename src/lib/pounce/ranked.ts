/**
 * The Pounce Spine — read side. Turns the raw PounceTrigger ledger into
 * account heat (for clawd's outreach-queue prioritization) and per-account
 * latest triggers (for the /for LIVE SIGNAL ribbon).
 *
 * Heat = Σ (normScore · fit · recency):
 *   - normScore normalizes each source's raw score to 0-100 (clawd is already
 *     0-100; the news/X taxonomy scales up) so producers are comparable.
 *   - fit is the audited yard footprint (dock doors) — a hot signal on a
 *     yard-heavy account outranks the same signal on a vendor with no yards.
 *   - recency decays each trigger over ~2 weeks, so "who's hot" is live.
 */
import { prisma } from '@/lib/prisma';
import { accountFit, normalizeScore } from './fit';

const HALFLIFE_DAYS = 14;

export interface RankedTrigger {
  title: string;
  url: string;
  source: string;
  score: number; // raw, as the source emitted it
  normScore: number; // normalized to 0-100 across sources
  categories: string[];
  seenAt: string;
  publishedAt: string | null;
}

export interface RankedAccount {
  accountSlug: string;
  accountName: string;
  heat: number; // Σ normScore · fit · recency
  fit: number; // 0.1 (no audited pack) .. 1.0 (>=2000 audited dock doors)
  triggerCount: number;
  topTrigger: RankedTrigger;
  lastSeenAt: string;
}

function decay(ageMs: number): number {
  const ageDays = ageMs / 86_400_000;
  return Math.exp(-ageDays / HALFLIFE_DAYS);
}

function toTrigger(r: {
  title: string; url: string; source: string; score: number;
  categories: string[]; first_seen_at: Date; published_at: Date | null;
}): RankedTrigger {
  return {
    title: r.title,
    url: r.url,
    source: r.source,
    score: r.score,
    normScore: normalizeScore(r.score, r.source),
    categories: r.categories,
    seenAt: r.first_seen_at.toISOString(),
    publishedAt: r.published_at ? r.published_at.toISOString() : null,
  };
}

export async function rankAccounts(opts: {
  days?: number;
  minScore?: number;
  limit?: number;
} = {}): Promise<RankedAccount[]> {
  const days = opts.days ?? 30;
  const minScore = opts.minScore ?? 6;
  const limit = opts.limit ?? 50;
  const since = new Date(Date.now() - days * 86_400_000);

  const rows = await prisma.pounceTrigger.findMany({
    where: { dismissed: false, score: { gte: minScore }, first_seen_at: { gte: since } },
    orderBy: { first_seen_at: 'desc' },
  });

  const now = Date.now();
  const byAccount = new Map<string, RankedAccount>();
  for (const r of rows) {
    const t = toTrigger(r);
    const fit = accountFit(r.account_slug);
    const weighted = t.normScore * fit * decay(now - r.first_seen_at.getTime());
    const cur = byAccount.get(r.account_slug);
    if (!cur) {
      byAccount.set(r.account_slug, {
        accountSlug: r.account_slug,
        accountName: r.account_name,
        heat: weighted,
        fit,
        triggerCount: 1,
        topTrigger: t,
        lastSeenAt: t.seenAt,
      });
    } else {
      cur.heat += weighted;
      cur.triggerCount += 1;
      // rows are first_seen_at desc; keep the highest normScore as the headline.
      if (t.normScore > cur.topTrigger.normScore) cur.topTrigger = t;
    }
  }

  return [...byAccount.values()]
    .map((a) => ({ ...a, heat: Math.round(a.heat * 10) / 10 }))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, limit);
}

/** Latest non-dismissed trigger for one account (the /for ribbon source). */
export async function latestForAccount(slug: string): Promise<RankedTrigger | null> {
  const r = await prisma.pounceTrigger.findFirst({
    where: { account_slug: slug, dismissed: false },
    orderBy: { first_seen_at: 'desc' },
  });
  return r ? toTrigger(r) : null;
}
