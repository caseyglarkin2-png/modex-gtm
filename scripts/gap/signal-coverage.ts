/**
 * GAP Signal Intelligence: COVERAGE TELEMETRY (read-only).
 *
 *   npx tsx scripts/gap/signal-coverage.ts [--days 7] [--out docs/gap/signal-coverage-latest.md]
 *
 * Is the intelligence engine useful? Over the watched priority universe and the
 * last N days: signals discovered by source class, signal events vs sources
 * (duplicate reduction), account resolution, what entered research, what
 * research yielded (verified, sayable, context only, nothing usable,
 * contradiction), research duration, 7-day signal and verified-evidence
 * coverage, accounts never researched, active-deal and opportunity-unknown
 * accounts, and Casey-shared turnaround. Small numbers are printed as counts
 * with their denominators; nothing here is a score and nothing is written to
 * the database. This is telemetry, not a seller dashboard.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { loadWatchProfiles } from '../../src/lib/gap/signals/watch';
import { listAllCurrent } from '../../src/lib/gap/routing/queue';
import { heldDealAccounts } from '../../src/lib/gap/deals/in-deals';
import { outreachFactRefusal } from '../../src/lib/gap/research/evidence-gate';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? (process.argv[i + 1] ?? d) : d;
};
const pct = (n: number, d: number) => (d ? `${n}/${d} (${Math.round((100 * n) / d)}%)` : `${n}/0`);
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const mins = (ms: number | null) => (ms === null ? 'n/a' : ms < 120_000 ? `${Math.round(ms / 1000)} s` : ms < 3_600_000 ? `${Math.round(ms / 60_000)} min` : `${(ms / 3_600_000).toFixed(1)} h`);

/** The source class a signal represents for coverage (discovery is Google News; a company newsroom is its own class). */
function coverageClass(s: { origin: string; source_class: string; resolution_basis: string | null }): string {
  if (s.origin === 'casey_share' || s.origin === 'conference_note') return s.origin === 'conference_note' ? 'social/user-shared (conference)' : s.resolution_basis === 'company_newsroom' || s.resolution_basis === 'domain' ? 'company newsroom (shared)' : `${s.source_class} (shared)`;
  if (s.resolution_basis === 'company_newsroom' || s.resolution_basis === 'domain') return 'company newsroom';
  return ({ sec_filing: 'SEC', job_posting: 'jobs', procurement: 'procurement / government', press_release: 'press release', social: 'social', news: 'news' } as Record<string, string>)[s.source_class] ?? 'other';
}

async function main() {
  const days = Number(arg('--days', '7'));
  const out = arg('--out', 'docs/gap/signal-coverage-latest.md');
  const prisma = new PrismaClient();
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);
  try {
    const profiles = await loadWatchProfiles(prisma);
    const universe = new Set(profiles.map((p) => p.accountName));
    const queue = await listAllCurrent(prisma).catch(() => ({ items: [] as Array<{ ruleId: string | null; account: { name: string } }> }));
    const inDeal = new Set(heldDealAccounts(queue.items as never));
    const unknownOpp = new Set((queue.items as Array<{ ruleId: string | null; account: { name: string } }>).filter((i) => i.ruleId === 'opportunity_unknown').map((i) => i.account.name));

    const signals: Array<{ id: string; origin: string; source_class: string; resolution: string; resolution_basis: string | null; research_status: string; relevance: string; account_name: string | null; event_id: string | null; created_at: Date; metadata: Record<string, unknown> | null; feedback: string | null }> =
      await prisma.gapSignal.findMany({ where: { created_at: { gte: since } }, select: { id: true, origin: true, source_class: true, resolution: true, resolution_basis: true, research_status: true, relevance: true, account_name: true, event_id: true, created_at: true, metadata: true, feedback: true } });
    const events = new Set(signals.map((s) => s.event_id ?? s.id));
    const byClass = new Map<string, number>();
    for (const s of signals) byClass.set(coverageClass(s), (byClass.get(coverageClass(s)) ?? 0) + 1);
    const accountsWithSignal = new Set(signals.filter((s) => s.account_name && universe.has(s.account_name)).map((s) => s.account_name!));
    const resolved = signals.filter((s) => s.resolution === 'resolved').length;
    const ambiguous = signals.filter((s) => s.resolution === 'ambiguous').length;
    const needs = signals.filter((s) => s.resolution === 'needs_account').length;
    const entered = signals.filter((s) => s.research_status !== 'none');
    const settled = entered.filter((s) => ['fact_found', 'no_usable_fact', 'contradiction'].includes(s.research_status));
    const factFound = signals.filter((s) => s.research_status === 'fact_found').length;
    const contradiction = signals.filter((s) => s.research_status === 'contradiction').length;
    const noUsable = signals.filter((s) => s.research_status === 'no_usable_fact').length;
    const contextOnly = signals.filter((s) => s.feedback === 'good_context' || (s.relevance !== 'outreach_evidence_candidate' && s.resolution === 'resolved')).length;
    const repeatShares = signals.reduce((a, s) => a + Math.max(0, (Array.isArray((s.metadata ?? {}).shares) ? ((s.metadata ?? {}).shares as unknown[]).length : 0) - 1), 0);
    const discoveryAudits: Array<{ payload: Record<string, unknown> }> = await prisma.gapAuditEvent.findMany({ where: { kind: 'signal.discovery', created_at: { gte: since } }, select: { payload: true } });
    const discoveryDupes = discoveryAudits.reduce((a, r) => a + Number(r.payload?.duplicates ?? 0), 0);
    const discoveryItems = discoveryAudits.reduce((a, r) => a + Number(r.payload?.items ?? 0), 0);
    const discoveryOther = discoveryAudits.reduce((a, r) => a + Number(r.payload?.otherAccount ?? 0), 0);

    const turnaround = signals
      .filter((s) => s.origin === 'casey_share' && (s.metadata as { research?: { at?: string } } | null)?.research?.at)
      .map((s) => new Date(String((s.metadata as { research: { at: string } }).research.at)).getTime() - new Date(s.created_at).getTime());

    const runs: Array<{ account_name: string; started_at: Date | null; completed_at: Date | null; created_at: Date; provider_status: Record<string, unknown> | null }> = await prisma.researchRun.findMany({
      where: { created_at: { gte: since }, run_key: { startsWith: 'gap_research:' } },
      select: { account_name: true, started_at: true, completed_at: true, created_at: true, provider_status: true },
    });
    const researchedAccounts = new Set(runs.map((r) => r.account_name));
    const durations = runs.filter((r) => r.started_at && r.completed_at).map((r) => new Date(r.completed_at!).getTime() - new Date(r.started_at!).getTime());
    const everResearched: Array<{ account_name: string }> = await prisma.researchRun.findMany({ where: { run_key: { startsWith: 'gap_research:' } }, select: { account_name: true }, distinct: ['account_name'] });
    const ever = new Set(everResearched.map((r) => r.account_name));

    const facts: Array<Record<string, unknown> & { account_name: string; freshness_expires_at: Date | null; ingested_at: Date }> = await prisma.prospectingSignal.findMany({
      where: { source_kind: 'evidence_record', metadata: { path: ['verified'], equals: 'excerpt_found_at_source' } },
      select: { id: true, account_name: true, source_kind: true, source_type: true, title: true, evidence_text: true, evidence_url: true, external_ok: true, observed_at: true, freshness_expires_at: true, metadata: true, ingested_at: true },
    });
    const newFacts = facts.filter((f) => new Date(f.ingested_at) >= since);
    const live = (f: { freshness_expires_at: Date | null }) => !f.freshness_expires_at || new Date(f.freshness_expires_at) > now;
    const sayable = newFacts.filter((f) => live(f) && outreachFactRefusal(f as never, f.account_name) === null);
    const coveredByEvidence = new Set(facts.filter((f) => live(f) && universe.has(f.account_name)).map((f) => f.account_name));

    const lines = [
      `# GAP Signal Intelligence coverage (read-only telemetry)`,
      ``,
      `Generated ${now.toISOString()}, window ${days} days. Counts with denominators; small N, read accordingly.`,
      ``,
      `## Priority universe`,
      `- watched priority accounts: ${universe.size}`,
      `- with a signal in the window: ${pct([...accountsWithSignal].length, universe.size)}`,
      `- with a live verified fact (any time): ${pct([...coveredByEvidence].filter((a) => universe.has(a)).length, universe.size)}`,
      `- researched in the window: ${pct([...researchedAccounts].filter((a) => universe.has(a)).length, universe.size)} (all accounts: ${researchedAccounts.size})`,
      `- never researched: ${[...universe].filter((a) => !ever.has(a)).length}`,
      `- routing holds for an open deal (excluded from the proactive backlog): ${[...inDeal].length}${inDeal.size ? ` (${[...inDeal].slice(0, 8).join(', ')})` : ''}`,
      `- opportunity truth UNKNOWN on a current card: ${[...unknownOpp].length}`,
      ``,
      `## Signals (window)`,
      `- source documents captured: ${signals.length}; signal events: ${events.size}; sources per event: ${events.size ? (signals.length / events.size).toFixed(2) : 'n/a'}`,
      `- duplicate sources collapsed: clustering ${signals.length - events.size}, repeat shares ${repeatShares}, discovery duplicates ${discoveryDupes}`,
      `- by source class: ${[...byClass.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('; ') || 'none'}`,
      `- origin: Casey-shared ${signals.filter((s) => s.origin === 'casey_share').length}, conference notes ${signals.filter((s) => s.origin === 'conference_note').length}, discovered ${signals.filter((s) => s.origin === 'discovery').length}`,
      `- discovery: ${discoveryAudits.length} account-asks, ${discoveryItems} stories seen, ${discoveryOther} left for another account`,
      `- resolution: resolved ${pct(resolved, signals.length)}, ambiguous ${pct(ambiguous, signals.length)}, needs account ${pct(needs, signals.length)}`,
      `- entered research: ${pct(entered.length, signals.length)}; settled ${settled.length}`,
      `- fact ready ${factFound}, nothing usable ${noUsable}, contradiction ${contradiction}; context (resolved, not an outreach candidate) ${contextOnly}`,
      `- Casey-shared turnaround (capture to research outcome): median ${mins(median(turnaround))} over ${turnaround.length}`,
      ``,
      `## Research (window)`,
      `- runs ${runs.length}, distinct accounts ${researchedAccounts.size}; median run duration ${mins(median(durations))}`,
      `- new verified facts ${newFacts.length} on ${new Set(newFacts.map((f) => f.account_name)).size} accounts; sayable now (live, passes the outreach-fact gate) ${pct(sayable.length, newFacts.length)}`,
      `- verified-fact yield per researched account: ${researchedAccounts.size ? (newFacts.length / researchedAccounts.size).toFixed(2) : 'n/a'}`,
    ];
    writeFileSync(out, `${lines.join('\n')}\n`);
    console.log(lines.join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}

main();
