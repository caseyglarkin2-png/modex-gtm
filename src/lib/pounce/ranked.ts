/**
 * The Pounce Spine — read side. Turns the raw PounceTrigger ledger into
 * account heat (for clawd's outreach-queue prioritization) and per-account
 * latest triggers (for the /for LIVE SIGNAL ribbon).
 *
 * Heat is recency-weighted: each trigger contributes score * exp(-ageDays/H),
 * so a fresh high-score story lights an account up and decays over ~2 weeks.
 * That makes "who's hot right now" a live ranking, not a lifetime tally.
 */
import { prisma } from '@/lib/prisma';

const HALFLIFE_DAYS = 14;

export interface RankedTrigger {
  title: string;
  url: string;
  source: string;
  score: number;
  categories: string[];
  seenAt: string;
  publishedAt: string | null;
}

export interface RankedAccount {
  accountSlug: string;
  accountName: string;
  heat: number;
  triggerCount: number;
  topTrigger: RankedTrigger;
  lastSeenAt: string;
}

function decay(ageMs: number): number {
  const ageDays = ageMs / 86_400_000;
  return Math.exp(-ageDays / HALFLIFE_DAYS);
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
    const t: RankedTrigger = {
      title: r.title,
      url: r.url,
      source: r.source,
      score: r.score,
      categories: r.categories,
      seenAt: r.first_seen_at.toISOString(),
      publishedAt: r.published_at ? r.published_at.toISOString() : null,
    };
    const weighted = r.score * decay(now - r.first_seen_at.getTime());
    const cur = byAccount.get(r.account_slug);
    if (!cur) {
      byAccount.set(r.account_slug, {
        accountSlug: r.account_slug,
        accountName: r.account_name,
        heat: weighted,
        triggerCount: 1,
        topTrigger: t,
        lastSeenAt: t.seenAt,
      });
    } else {
      cur.heat += weighted;
      cur.triggerCount += 1;
      // rows are first_seen_at desc, so the first-seen per account is the latest;
      // keep the highest-score trigger as the headline.
      if (t.score > cur.topTrigger.score) cur.topTrigger = t;
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
  if (!r) return null;
  return {
    title: r.title,
    url: r.url,
    source: r.source,
    score: r.score,
    categories: r.categories,
    seenAt: r.first_seen_at.toISOString(),
    publishedAt: r.published_at ? r.published_at.toISOString() : null,
  };
}
