/**
 * Stabilization C3: provenance backfill for research runs from before rich source records (2026-10-01), which kept
 * only { url, reason } for the pages they looked at.
 *
 *   npx tsx scripts/gap/backfill-source-provenance.ts [--days 120] [--max 250]            # dry run
 *   npx tsx scripts/gap/backfill-source-provenance.ts [--days 120] [--max 250] --apply    # write
 *
 * For each such page it reads the page's own metadata (title, article publication date, site name) and stores it
 * at provider_status.result.provenance[url]. PROVENANCE ONLY: no verification state, evidence status, currentness
 * or hypothesis changes; the run's reasons and outcome are untouched. A page it cannot read stays UNKNOWN.
 */
import { PrismaClient } from '@prisma/client';
import { parseSignalMeta } from '../../src/lib/gap/signals/intake';
import { SEARCH_REDIRECT } from '../../src/lib/gap/sources/source-copy';

const arg = (k: string, d: number) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? Number(process.argv[i + 1] ?? d) : d;
};

async function readMeta(url: string): Promise<{ title: string | null; publishedAt: string | null; publisher: string | null } | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YardFlowResearch/1.0)', Accept: 'text/html,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(12_000) });
    if (!res.ok || !/html/i.test(res.headers.get('content-type') ?? 'text/html')) return null;
    const m = parseSignalMeta((await res.text()).slice(0, 400_000));
    return { title: m.title ?? null, publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null, publisher: m.siteName ?? null };
  } catch {
    return null;
  }
}

async function main() {
  const apply = process.argv.includes('--apply');
  const days = arg('--days', 120);
  const max = arg('--max', 250);
  const prisma = new PrismaClient();
  try {
    const runs: Array<{ id: string; account_name: string; provider_status: Record<string, unknown> | null }> = await prisma.researchRun.findMany({
      where: { run_key: { startsWith: 'gap_research:' }, created_at: { gte: new Date(Date.now() - days * 86_400_000) } },
      select: { id: true, account_name: true, provider_status: true },
      orderBy: { created_at: 'desc' },
    });
    const todo: Array<{ run: (typeof runs)[number]; urls: string[] }> = [];
    let pages = 0;
    for (const r of runs) {
      const result = (r.provider_status?.result ?? null) as Record<string, unknown> | null;
      if (!result || Array.isArray(result.sources) || !Array.isArray(result.rejected)) continue;
      const have = (result.provenance ?? {}) as Record<string, unknown>;
      const urls = [...new Set((result.rejected as Array<{ url?: string }>).map((x) => String(x.url ?? '')).filter((u) => /^https?:\/\//.test(u) && !SEARCH_REDIRECT.test(u) && !have[u]))];
      if (!urls.length) continue;
      const take = urls.slice(0, Math.max(0, max - pages));
      if (!take.length) break;
      pages += take.length;
      todo.push({ run: r, urls: take });
    }
    console.log(`legacy runs needing provenance: ${todo.length}; pages to read: ${pages} (cap ${max})`);
    let found = 0;
    let unknown = 0;
    for (const t of todo) {
      const provenance: Record<string, unknown> = { ...(((t.run.provider_status?.result as Record<string, unknown>)?.provenance ?? {}) as Record<string, unknown>) };
      for (let i = 0; i < t.urls.length; i += 5) {
        const batch = t.urls.slice(i, i + 5);
        const metas = await Promise.all(batch.map(readMeta));
        batch.forEach((u, j) => {
          const m = metas[j];
          if (m && (m.title || m.publishedAt || m.publisher)) {
            provenance[u] = { ...m, backfilledAt: new Date().toISOString() };
            found += 1;
          } else unknown += 1;
        });
      }
      if (apply) {
        const ps = (t.run.provider_status ?? {}) as Record<string, unknown>;
        await prisma.researchRun.update({ where: { id: t.run.id }, data: { provider_status: { ...ps, result: { ...((ps.result ?? {}) as Record<string, unknown>), provenance } } } });
      }
    }
    console.log(`${apply ? 'applied' : 'dry run'}: provenance recovered for ${found} pages; ${unknown} stay UNKNOWN`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
