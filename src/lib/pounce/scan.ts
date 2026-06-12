/**
 * Pounce Engine — scan orchestrator (Phase 1, Task 3).
 *
 * Watchlist = every audited /for account (the microsite registry), which is
 * exactly the set we have spear pages and demo packs for: when a trigger
 * fires, the artifact to send already exists. One Google News fetch per
 * account with a politeness gap; items filtered to the scan window, scored,
 * deduped by URL, returned sorted hot-first.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';
import { fetchAccountNews, type NewsItem } from './news';
import { scoreTrigger } from './score';

export interface PounceTrigger {
  slug: string;
  account: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  score: number;
  categories: string[];
}

export interface PounceScanResult {
  triggers: PounceTrigger[];
  accountsScanned: number;
  itemsSeen: number;
  windowHours: number;
  errors: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The composed per-account query: brand name + supply-chain context terms. */
function accountQuery(name: string): string {
  return `"${name}" (supply chain OR logistics OR distribution OR plant OR warehouse OR freight OR autonomous)`;
}

/**
 * Watchlist = every audited account. The demo-pack directory is the canonical
 * audited set (every /for spear has a pack; the microsite registry is the
 * older, smaller memo set — pepsico, walmart, costco etc. are pack-only).
 * Union of both, pack displayName preferred.
 */
async function buildWatchlist(): Promise<{ slug: string; name: string }[]> {
  const byKey = new Map<string, { slug: string; name: string }>();
  for (const a of getAllAccountMicrositeData()) {
    byKey.set(a.slug, { slug: a.slug, name: a.accountName });
  }
  try {
    const dir = join(process.cwd(), 'public', 'demo-packs');
    for (const f of await readdir(dir)) {
      if (!f.endsWith('.json')) continue;
      const slug = f.replace(/\.json$/, '');
      try {
        const pack = JSON.parse(await readFile(join(dir, f), 'utf8'));
        const name = pack?.account?.displayName;
        if (typeof name === 'string' && name) byKey.set(slug, { slug, name });
      } catch {
        // unreadable pack: keep whatever the registry had
      }
    }
  } catch {
    // packs dir missing (shouldn't happen): registry-only watchlist
  }
  return [...byKey.values()];
}

export async function runPounceScan(opts: {
  hours: number;
  minScore: number;
  slugs?: string[];
}): Promise<PounceScanResult> {
  const all = await buildWatchlist();
  const watch = opts.slugs?.length ? all.filter((a) => opts.slugs!.includes(a.slug)) : all;
  const cutoff = Date.now() - opts.hours * 3600_000;
  const seen = new Set<string>();
  const triggers: PounceTrigger[] = [];
  const errors: string[] = [];
  let itemsSeen = 0;

  for (const acct of watch) {
    let items: NewsItem[] = [];
    try {
      items = await fetchAccountNews(accountQuery(acct.name));
    } catch (e) {
      errors.push(`${acct.slug}: ${e instanceof Error ? e.message : 'fetch failed'}`);
    }
    itemsSeen += items.length;
    for (const item of items) {
      if (item.publishedAt.getTime() < cutoff) continue;
      const key = item.url.replace(/[?#].*$/, '');
      if (seen.has(key)) continue;
      seen.add(key);
      const { score, categories } = scoreTrigger(item.title, acct.name);
      if (score < opts.minScore) continue;
      triggers.push({
        slug: acct.slug,
        account: acct.name,
        title: item.title,
        url: item.url,
        source: item.source,
        publishedAt: item.publishedAt.toISOString(),
        score,
        categories,
      });
    }
    await sleep(300);
  }

  triggers.sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt));
  return { triggers, accountsScanned: watch.length, itemsSeen, windowHours: opts.hours, errors };
}
