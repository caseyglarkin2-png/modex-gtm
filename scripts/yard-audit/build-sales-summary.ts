/**
 * Phase 4 — Sales summary one-pagers + master INDEX.
 *
 * For each account, emits output/yard-audits/<slug>/<slug>-sales-summary.md —
 * a sales-ready one-pager: facility count, % truck-gated, % guarded, % rural,
 * fast-lane-opportunity count, rail-served count, total dock doors, total
 * trailer capacity, the archetype distribution, and a one-line recommended
 * YardFlow entry point inferred from the facility mix.
 *
 * Also emits output/yard-audits/INDEX.md — a master table linking every
 * account to its sales summary with the headline stats.
 *
 * Works off Phase-2 site JSONs, or the Kraft baseline.json when present.
 *
 * Run: npx tsx scripts/yard-audit/build-sales-summary.ts            (all)
 *      npx tsx scripts/yard-audit/build-sales-summary.ts <slug> ... (named)
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignArchetype, pct, ARCHETYPE_NAME, type Classification } from './lib.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUD = join(ROOT, 'output', 'yard-audits');

interface Site {
  name?: string;
  classification: Classification;
  yardMetrics?: {
    dockDoorCount?: number;
    trailerParkingCapacity?: number;
    railServed?: boolean;
  };
}

interface Stats {
  slug: string;
  display: string;
  facilities: number;
  gated: number;
  guarded: number;
  rural: number;
  fastLane: number;
  rail: number;
  dropYard: number;
  dockDoors: number;
  trailerCap: number;
  archetypes: Array<[string, number]>; // sorted desc by count
  topArchetype: string;
  recommendation: string;
}

function loadSites(dir: string): Site[] {
  const sitesDir = join(dir, 'sites');
  if (existsSync(sitesDir)) {
    return readdirSync(sitesDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => JSON.parse(readFileSync(join(sitesDir, f), 'utf8')) as Site);
  }
  const baseline = join(dir, 'baseline.json');
  if (existsSync(baseline)) {
    return (JSON.parse(readFileSync(baseline, 'utf8')).sites ?? []) as Site[];
  }
  return [];
}

function accountDisplayName(dir: string, slug: string): string {
  const rosterP = join(dir, 'roster.json');
  if (existsSync(rosterP)) {
    try { return JSON.parse(readFileSync(rosterP, 'utf8')).account || slug; } catch { /* fall through */ }
  }
  const baseline = join(dir, 'baseline.json');
  if (existsSync(baseline)) {
    try { return JSON.parse(readFileSync(baseline, 'utf8')).account || slug; } catch { /* fall through */ }
  }
  return slug;
}

/**
 * One-line recommended YardFlow entry point, inferred from the facility mix.
 * Ordered most-specific first; first match wins.
 */
function recommendEntryPoint(s: {
  facilities: number;
  gated: number;
  guarded: number;
  rural: number;
  fastLane: number;
  rail: number;
  dropYard: number;
}): string {
  const n = s.facilities;
  if (n === 0) return 'No audited facilities — re-run the audit before pitching.';
  const f = (x: number) => x / n;

  if (f(s.dropYard) >= 0.5 && f(s.fastLane) >= 0.3) {
    return 'Lead with drop-yard turn-time — heavy trailer pools plus room to add fast lanes makes detention the clearest ROI story.';
  }
  if (f(s.fastLane) >= 0.4) {
    return 'Lead with gate fast-lane throughput — most sites have physical room for a bypass, so pitch appointment-driven express check-in.';
  }
  if (f(s.guarded) >= 0.6) {
    return 'Lead with guard-booth automation — a guarded majority means the win is digitizing check-in and cutting gate dwell.';
  }
  if (f(s.rural) >= 0.4) {
    return 'Lead with offline-tolerant check-in — a rural-heavy footprint needs YardFlow to work through connectivity gaps.';
  }
  if (f(s.dropYard) >= 0.5) {
    return 'Lead with drop-yard visibility — large trailer pools mean trailer-location tracking is the fastest pain to quantify.';
  }
  if (f(s.gated) < 0.4) {
    return 'Lead with gate establishment + visibility — many open sites have no checkpoint, so YardFlow can stand up a virtual gate.';
  }
  if (s.rail > 0) {
    return 'Lead with multimodal yard coordination — rail-served sites add intermodal trailer moves YardFlow can sequence.';
  }
  return 'Lead with gate-to-dock orchestration — a balanced mix favors a full check-in-through-dock-assignment pilot.';
}

function computeStats(slug: string, display: string, sites: Site[]): Stats {
  const n = sites.length;
  const gated = sites.filter((s) => s.classification?.truckGate).length;
  const guarded = sites.filter((s) => s.classification?.guardShack).length;
  const rural = sites.filter((s) => s.classification?.urbanRural === 'Rural').length;
  const fastLane = sites.filter((s) => s.classification?.fastLaneOpportunity).length;
  const dropYard = sites.filter((s) => s.classification?.dropYard).length;
  const rail = sites.filter((s) => s.yardMetrics?.railServed).length;
  const dockDoors = sites.reduce((a, s) => a + (s.yardMetrics?.dockDoorCount ?? 0), 0);
  const trailerCap = sites.reduce((a, s) => a + (s.yardMetrics?.trailerParkingCapacity ?? 0), 0);

  const archCount: Record<string, number> = {};
  for (const s of sites) {
    const a = assignArchetype(s.classification).archetype;
    archCount[a] = (archCount[a] ?? 0) + 1;
  }
  // Sort by count desc, then by archetype number asc for stable output.
  const archetypes = Object.entries(archCount).sort(
    (a, b) => b[1] - a[1] || Number(a[0].slice(1)) - Number(b[0].slice(1)),
  );
  const topArchetype = archetypes.length ? archetypes[0][0] : '—';

  const recommendation = recommendEntryPoint({
    facilities: n, gated, guarded, rural, fastLane, rail, dropYard,
  });

  return {
    slug, display, facilities: n, gated, guarded, rural, fastLane, rail,
    dropYard, dockDoors, trailerCap, archetypes, topArchetype, recommendation,
  };
}

function buildOnePager(s: Stats): string {
  const n = s.facilities;
  const L: string[] = [];
  L.push(`# ${s.display} — YardFlow Yard Audit Summary`, '');
  L.push(`**${n} facilit${n === 1 ? 'y' : 'ies'} audited.**`, '');

  L.push('## Yard profile', '');
  L.push('| Metric | Value |');
  L.push('|---|---|');
  L.push(`| Facilities | ${n} |`);
  L.push(`| Truck-gated | ${s.gated} (${pct(s.gated, n)}) |`);
  L.push(`| Guarded (staffed shack) | ${s.guarded} (${pct(s.guarded, n)}) |`);
  L.push(`| Rural / connectivity-exposed | ${s.rural} (${pct(s.rural, n)}) |`);
  L.push(`| Fast-lane opportunity | ${s.fastLane} (${pct(s.fastLane, n)}) |`);
  L.push(`| Drop-yard operations | ${s.dropYard} (${pct(s.dropYard, n)}) |`);
  L.push(`| Rail-served | ${s.rail} (${pct(s.rail, n)}) |`);
  L.push(`| Total dock doors | ${s.dockDoors.toLocaleString('en-US')} |`);
  L.push(`| Total trailer-parking capacity | ${s.trailerCap.toLocaleString('en-US')} |`);
  L.push('');

  L.push('## Archetype distribution', '');
  L.push('| Archetype | Name | Sites | Share |');
  L.push('|---|---|---|---|');
  for (const [id, count] of s.archetypes) {
    L.push(`| ${id} | ${ARCHETYPE_NAME.get(id) ?? ''} | ${count} | ${pct(count, n)} |`);
  }
  L.push('');

  L.push('## Recommended YardFlow entry point', '');
  L.push(s.recommendation, '');
  return L.join('\n');
}

function listAccounts(): string[] {
  return readdirSync(AUD)
    .filter((d) => {
      try { return statSync(join(AUD, d)).isDirectory(); } catch { return false; }
    })
    .sort();
}

function buildIndex(all: Stats[]): string {
  const L: string[] = [];
  L.push('# YardFlow Prospect Yard Audit — Master Index', '');
  L.push(`${all.length} accounts. Each links to its sales-summary one-pager.`, '');
  L.push('| Account | Facilities | Truck-Gated | Guarded | Fast-Lane | Rail | Dock Doors | Trailer Cap | Top Archetype |');
  L.push('|---|---|---|---|---|---|---|---|---|');

  const t = { fac: 0, gate: 0, guard: 0, fast: 0, rail: 0, dock: 0, cap: 0 };
  for (const s of all) {
    const link = `[${s.display}](./${s.slug}/${s.slug}-sales-summary.md)`;
    L.push(
      `| ${link} | ${s.facilities} | ${s.gated} (${pct(s.gated, s.facilities)}) | ` +
      `${s.guarded} (${pct(s.guarded, s.facilities)}) | ` +
      `${s.fastLane} (${pct(s.fastLane, s.facilities)}) | ${s.rail} | ` +
      `${s.dockDoors.toLocaleString('en-US')} | ${s.trailerCap.toLocaleString('en-US')} | ` +
      `${s.topArchetype} (${ARCHETYPE_NAME.get(s.topArchetype) ?? ''}) |`,
    );
    t.fac += s.facilities; t.gate += s.gated; t.guard += s.guarded;
    t.fast += s.fastLane; t.rail += s.rail; t.dock += s.dockDoors; t.cap += s.trailerCap;
  }
  L.push(
    `| **TOTAL** | **${t.fac}** | **${t.gate}** | **${t.guard}** | **${t.fast}** | ` +
    `**${t.rail}** | **${t.dock.toLocaleString('en-US')}** | ` +
    `**${t.cap.toLocaleString('en-US')}** | |`,
  );
  L.push('');
  return L.join('\n');
}

function main(): void {
  const requested = process.argv.slice(2);
  const accounts = requested.length ? requested : listAccounts();
  const all: Stats[] = [];

  for (const slug of accounts) {
    const dir = join(AUD, slug);
    if (!existsSync(dir)) {
      console.warn(`  skip ${slug} — no such account folder`);
      continue;
    }
    const sites = loadSites(dir);
    if (sites.length === 0) continue;
    const display = accountDisplayName(dir, slug);
    const stats = computeStats(slug, display, sites);
    writeFileSync(join(dir, `${slug}-sales-summary.md`), buildOnePager(stats));
    all.push(stats);
    console.log(`  ${slug}: ${stats.facilities} sites, top ${stats.topArchetype}`);
  }

  // Only rewrite the master INDEX on a full run — a partial run would drop
  // accounts that weren't requested this pass.
  if (requested.length === 0) {
    all.sort((a, b) => a.slug.localeCompare(b.slug));
    writeFileSync(join(AUD, 'INDEX.md'), buildIndex(all));
    console.log(`\nINDEX.md rewritten — ${all.length} accounts.`);
  } else {
    console.log(`\n${all.length} sales summaries written (partial run — INDEX.md left untouched).`);
  }
}

main();
