/**
 * Microsite / demo engagement report.
 *
 * Reusable readout of the prospect engagement captured by the microsite
 * tracker (MicrositeEngagement, Railway Postgres). Reuses the app's own
 * aggregator `buildMicrositeAnalyticsSummary` — the same summary the
 * /engagement Inbox renders via `dbGetMicrositeAnalytics` — so this matches
 * what the product shows, and adds a /demo funnel tally for the demo-surface
 * features we shipped (sim hero, fused network band, ROI / audit CTAs).
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/microsite-engagement-report.ts
 *
 * DATABASE_URL must point at the target DB (.env.local carries prod).
 */
import { prisma } from '../src/lib/prisma';
import { buildMicrositeAnalyticsSummary } from '../src/lib/microsites/analytics';

// ★-marked ids are the sections / CTAs this demo work introduced, so a glance
// tells us whether prospects reach and act on them.
const FEATURE_SECTIONS = new Set(['featured-sim-hero', 'network-insight', 'site-what-this-means']);
const FEATURE_CTAS = new Set([
  'microsite-inline-roi',
  'microsite-run-roi',
  'demo-book-audit',
  'microsite-sticky-book-audit',
  'demo-watch-replay',
]);

function tally(arrays: (string[] | null | undefined)[]): [string, number][] {
  const m = new Map<string, number>();
  for (const arr of arrays) for (const x of arr ?? []) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

async function main() {
  const rows = await prisma.micrositeEngagement.findMany();

  // Mirror src/lib/db.ts dbGetMicrositeAnalytics() so the headline numbers
  // match the /engagement Inbox exactly.
  const summary = buildMicrositeAnalyticsSummary(
    rows.map((s) => ({
      account_name: s.account_name,
      account_slug: s.account_slug,
      person_name: s.person_name,
      person_slug: s.person_slug,
      path: s.path,
      sections_viewed: s.sections_viewed,
      cta_ids: s.cta_ids,
      variant_history: s.variant_history,
      scroll_depth_pct: s.scroll_depth_pct,
      duration_seconds: s.duration_seconds,
      updated_at: s.updated_at,
      metadata: s.metadata,
    })),
  );

  console.log('=== Microsite engagement (all surfaces) ===');
  console.log(`  sessions ${summary.totalSessions} human / ${summary.rawSessions} raw (bots ${summary.botSessions}, suspect ${summary.suspectSessions})`);
  console.log(`  uniquePeople ${summary.uniquePeople}  accountsEngaged ${summary.accountsEngaged}`);
  console.log(`  highIntent ${summary.highIntentSessions}  ctaSessions ${summary.ctaSessions}  roiSessions ${summary.roiSessions}`);
  console.log(`  avgScroll ${summary.avgScrollDepthPct}%  avgDuration ${summary.avgDurationSeconds}s`);
  if (summary.hotAccounts.length) {
    console.log('  hot accounts:');
    for (const a of summary.hotAccounts.slice(0, 10)) {
      console.log(`    ${a.accountName}  score ${a.engagementScore}  sessions ${a.sessionCount}  ${a.primarySignal}`);
    }
  }

  const demo = rows.filter((r) => r.path.startsWith('/demo/'));
  console.log(`\n=== /demo funnel: ${demo.length} sessions ===`);
  console.log('  sections viewed (* = sections this work shipped):');
  for (const [s, n] of tally(demo.map((d) => d.sections_viewed))) {
    console.log(`    ${FEATURE_SECTIONS.has(s) ? '*' : ' '} ${s}: ${n}`);
  }
  console.log('  CTA clicks (* = our CTAs):');
  for (const [c, n] of tally(demo.map((d) => d.cta_ids))) {
    console.log(`    ${FEATURE_CTAS.has(c) ? '*' : ' '} ${c}: ${n}`);
  }
  if (demo.length) {
    const avg = (f: (d: (typeof demo)[number]) => number) =>
      Math.round(demo.reduce((s, d) => s + (f(d) || 0), 0) / demo.length);
    console.log(`  avg scroll ${avg((d) => d.scroll_depth_pct)}%  avg duration ${avg((d) => d.duration_seconds)}s`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
