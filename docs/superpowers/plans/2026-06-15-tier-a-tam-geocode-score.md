# Tier-A TAM Geocode-and-Score Implementation Plan

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all **727 Tier-A TAM accounts** a real, geocoded proximity/composite score by thoroughly discovering every facility (not a sample), geocoding it, computing distance-to-Primo + corridor density, combining with the fit we already stamped, and writing the composite back to each HubSpot company.

**Architecture (reverse-engineered from the existing pipeline):** Reuse the proven yard-audit facility pipeline — a **discovery agent** (`discovery-prompt.md`) web-researches all facilities → `roster.json`, then `geocode-roster.ts` resolves ROOFTOP coords. The corridor scanner is NOT used (it only finds places near Primo, not all of a company's facilities). A durable **work ledger** drives a resumable, local, multi-hour batch; a new **geo-scorer** turns geocoded rosters into composites; a **stamper** writes them to HubSpot. Filesystem rosters are the primary checkpoint (roster exists = facility-discovery done).

**Tech Stack:** `tsx` scripts, the existing `scripts/yard-audit/{discovery-prompt.md,geocode-roster.ts}`, `src/lib/discovery/{scoring.ts,reference-sites.ts}`, the HubSpot private-app token, `vitest`. Runs locally on Casey's box (the `GOOGLE_MAPS_STATIC_API_KEY` + the long runtime live there).

**Cost envelope:** geocoding ~$55 (11k facilities @ $5/1k); the real cost is 727 discovery-agent dispatches (LLM web research). Negligible API spend, long wall-clock — by design.

---

## File Structure

- **Create** `scripts/intel/tam-geo/ledger.ts` — durable work-ledger over `output/intel/tam-geo/ledger.jsonl` (one row per account: slug, name, domain, tier, fit, status `pending|roster|geocoded|scored|stamped`, counts, error). One responsibility: track + resume.
- **Create** `scripts/intel/tam-geo/seed-ledger.ts` — seed the 727 Tier-A accounts from `output/intel/tam-scoring.json` into the ledger (idempotent).
- **Create** `scripts/intel/tam-geo/slugify.ts` — deterministic `slug(name)` shared by roster paths + the ledger.
- **Create** `scripts/intel/tam-geo/discover-batch.ts` — the resumable facility-discovery dispatcher: for the next N `pending` accounts, emit a discovery work-item (account + the discovery-prompt) and, once an agent writes `output/yard-audits/<slug>/roster.json`, advance the ledger to `roster`. (The discovery agents themselves are dispatched by the executor; see Task 3.)
- **Create** `scripts/intel/tam-geo/geocode-pending.ts` — run `geocode-roster.ts` over every `roster`-status account, advance to `geocoded`.
- **Create** `scripts/intel/tam-geo/score.ts` — PURE geo-scorer: roster facilities + reference sites + stamped fit → `{ nearest_distance_mi, proximity_score, corridor_density, composite_score, nearest_primo_site, facilities }`.
- **Create** `scripts/intel/tam-geo/score-pending.ts` — score every `geocoded` account, write `output/intel/tam-geo/scores/<slug>.json`, advance to `scored`.
- **Create** `scripts/intel/tam-geo/stamp-pending.ts` — batch-update HubSpot companies (by domain) from the `scored` results, advance to `stamped`.
- **Create** `scripts/intel/tam-geo/run.ts` — the orchestrator: seed → discover → geocode → score → stamp, resumable, with a progress + cost report; `--phase=<name>` to run one phase, `--limit=<n>` to bound a batch.
- **Create** `tests/unit/tam-geo.test.ts` — pure-function tests (ledger transitions, slugify, the geo-scorer math).

The discovery agent step is orchestration (LLM web research), not a unit-testable function; everything around it (ledger, geocode wrapper, scorer, stamper) is deterministic and tested.

---

### Task 1: The work ledger (durable, resumable)

**Files:** Create `scripts/intel/tam-geo/ledger.ts`, `scripts/intel/tam-geo/slugify.ts`; Test `tests/unit/tam-geo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/tam-geo.test.ts
import { describe, expect, it } from 'vitest';
import { slugify } from '../../scripts/intel/tam-geo/slugify';

describe('slugify', () => {
  it('is deterministic, kebab, ascii', () => {
    expect(slugify('The Boston Beer Company, Inc.')).toBe('the-boston-beer-company-inc');
    expect(slugify('J.B. Hunt Transport')).toBe('j-b-hunt-transport');
  });
});
```

- [ ] **Step 2: Run it → FAIL** (`npx vitest run tests/unit/tam-geo.test.ts` — module missing)

- [ ] **Step 3: Implement slugify.ts**

```ts
// scripts/intel/tam-geo/slugify.ts
export function slugify(name: string): string {
  return (name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 4: Implement ledger.ts** (append-only JSONL, last-write-wins per slug)

```ts
// scripts/intel/tam-geo/ledger.ts
import fs from 'node:fs';
import path from 'node:path';

export type Status = 'pending' | 'roster' | 'geocoded' | 'scored' | 'stamped' | 'error';
export interface LedgerRow {
  slug: string; name: string; domain: string | null; tier: string;
  fit: number | null; status: Status; facilities?: number; error?: string; at: string;
}
const DIR = path.join(process.cwd(), 'output', 'intel', 'tam-geo');
const FILE = path.join(DIR, 'ledger.jsonl');

export function load(): Map<string, LedgerRow> {
  const m = new Map<string, LedgerRow>();
  if (!fs.existsSync(FILE)) return m;
  for (const line of fs.readFileSync(FILE, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line) as LedgerRow; m.set(r.slug, r); } catch { /* skip */ }
  }
  return m;
}
export function append(row: Omit<LedgerRow, 'at'>): void {
  fs.mkdirSync(DIR, { recursive: true });
  fs.appendFileSync(FILE, `${JSON.stringify({ ...row, at: new Date().toISOString() })}\n`);
}
export function byStatus(status: Status): LedgerRow[] {
  return [...load().values()].filter((r) => r.status === status);
}
```

- [ ] **Step 5: Add the ledger-transition test + run**

```ts
// append to tam-geo.test.ts — uses a temp cwd is overkill; assert pure shape instead
import type { LedgerRow, Status } from '../../scripts/intel/tam-geo/ledger';
it('status type covers the pipeline', () => {
  const statuses: Status[] = ['pending', 'roster', 'geocoded', 'scored', 'stamped', 'error'];
  expect(statuses.length).toBe(6);
});
```
Run: `npx vitest run tests/unit/tam-geo.test.ts` → PASS.

- [ ] **Step 6: Commit**
```bash
git add scripts/intel/tam-geo/slugify.ts scripts/intel/tam-geo/ledger.ts tests/unit/tam-geo.test.ts
git commit -m "feat(tam-geo): durable work ledger + slugify"
```

---

### Task 2: Seed the 727 Tier-A accounts

**Files:** Create `scripts/intel/tam-geo/seed-ledger.ts`

- [ ] **Step 1: Implement the seeder** (reads the already-fetched `output/intel/tam-scoring.json`)

```ts
// scripts/intel/tam-geo/seed-ledger.ts
import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './slugify';
import { load, append } from './ledger';

const tam = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'output', 'intel', 'tam-scoring.json'), 'utf8'));
const tierA = (tam.companies as Array<Record<string, string>>).filter((c) => c.tam_tier === 'A');
const have = load();
let seeded = 0;
for (const c of tierA) {
  const slug = slugify(c.name || c.id);
  if (have.has(slug)) continue;
  append({ slug, name: c.name ?? '', domain: (c.domain || '').toLowerCase() || null, tier: 'A',
    fit: c.yardflow_fit_score != null && c.yardflow_fit_score !== '' ? Number(c.yardflow_fit_score) : null,
    status: 'pending' });
  seeded += 1;
}
console.log(`Tier-A accounts: ${tierA.length} | seeded: ${seeded} | already in ledger: ${tierA.length - seeded}`);
```

- [ ] **Step 2: Run + verify**
Run: `npx tsx scripts/intel/tam-geo/seed-ledger.ts`
Expected: `Tier-A accounts: 727 | seeded: 727` (first run). Re-run → `seeded: 0` (idempotent).

- [ ] **Step 3: Commit**
```bash
git add scripts/intel/tam-geo/seed-ledger.ts output/intel/tam-geo/ledger.jsonl
git commit -m "feat(tam-geo): seed 727 Tier-A accounts into the ledger"
```

---

### Task 3: Facility discovery (the thorough, "don't be lazy" step)

**Files:** Create `scripts/intel/tam-geo/discover-batch.ts`

> This is the long pole. For each `pending` account, a discovery AGENT runs `scripts/yard-audit/discovery-prompt.md` against the company (name + domain) and writes `output/yard-audits/<slug>/roster.json` — ALL facilities (DCs, plants, warehouses, terminals) with street addresses, capped at 30, sourced from D&B / Panjiva / 10-Ks / job postings / freight DBs. The executor dispatches these agents in batches; `discover-batch.ts` lists the next batch and reconciles completed rosters into the ledger.

- [ ] **Step 1: Implement the batch lister/reconciler**

```ts
// scripts/intel/tam-geo/discover-batch.ts
import fs from 'node:fs';
import path from 'node:path';
import { byStatus, append, load } from './ledger';

const ROOT = process.cwd();
const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '20');
const rosterPath = (slug: string) => path.join(ROOT, 'output', 'yard-audits', slug, 'roster.json');

// Reconcile: any pending account whose roster.json now exists -> advance to 'roster'.
let advanced = 0;
for (const r of byStatus('pending')) {
  if (fs.existsSync(rosterPath(r.slug))) {
    let n = 0;
    try { n = (JSON.parse(fs.readFileSync(rosterPath(r.slug), 'utf8')).facilities ?? []).length; } catch { /* */ }
    append({ ...r, status: 'roster', facilities: n });
    advanced += 1;
  }
}

// Emit the next batch to research (accounts still pending with NO roster).
const next = byStatus('pending').filter((r) => !fs.existsSync(rosterPath(r.slug))).slice(0, limit);
console.log(`reconciled ${advanced} new rosters. Next ${next.length} to discover:`);
for (const r of next) console.log(`  ${r.slug}\t${r.name}\t${r.domain ?? ''}`);
console.log(`\nDispatch one discovery agent per row using scripts/yard-audit/discovery-prompt.md; each writes output/yard-audits/<slug>/roster.json. Re-run this to reconcile.`);
```

- [ ] **Step 2: Run the reconciler (no rosters yet → lists the batch)**
Run: `npx tsx scripts/intel/tam-geo/discover-batch.ts --limit=20`
Expected: lists 20 accounts to research.

- [ ] **Step 3: Dispatch discovery agents (executor action, not a code step)**
For each listed account, dispatch a subagent with `scripts/yard-audit/discovery-prompt.md` as its instructions + the account name/domain. Each agent web-researches the company's facilities and writes `output/yard-audits/<slug>/roster.json` (the schema: `{ account, facilityCount, facilities: [{ idx, name, city, state, type, address, source, lat, lng }] }`). Run in batches of ~10-20 parallel agents; this phase spans the whole run.

- [ ] **Step 4: Reconcile + commit progress**
Re-run `discover-batch.ts` to advance completed rosters to `roster` status.
```bash
git add scripts/intel/tam-geo/discover-batch.ts
git commit -m "feat(tam-geo): resumable facility-discovery dispatcher"
```
(Commit roster.json files in batches as they land; they are the durable checkpoint.)

---

### Task 4: Geocode the rosters

**Files:** Create `scripts/intel/tam-geo/geocode-pending.ts`

- [ ] **Step 1: Implement (wraps the proven geocode-roster.ts)**

```ts
// scripts/intel/tam-geo/geocode-pending.ts
import { execFileSync } from 'node:child_process';
import { byStatus, append } from './ledger';

const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '50');
const todo = byStatus('roster').slice(0, limit);
console.log(`geocoding ${todo.length} rosters...`);
for (const r of todo) {
  try {
    execFileSync('npx', ['tsx', 'scripts/yard-audit/geocode-roster.ts', r.slug], { stdio: 'inherit' });
    append({ ...r, status: 'geocoded' });
  } catch (e) {
    append({ ...r, status: 'error', error: e instanceof Error ? e.message : String(e) });
  }
}
console.log('done geocoding batch');
```

- [ ] **Step 2: Run on the geocoded rosters**
Run: `npx tsx scripts/intel/tam-geo/geocode-pending.ts --limit=50` (after rosters exist).
Expected: each roster geocoded (ROOFTOP coords), advanced to `geocoded`. Cheap (~$5/1k).

- [ ] **Step 3: Commit**
```bash
git add scripts/intel/tam-geo/geocode-pending.ts
git commit -m "feat(tam-geo): geocode pending rosters via geocode-roster.ts"
```

---

### Task 5: The geo-scorer (proximity + density + composite)

**Files:** Create `scripts/intel/tam-geo/score.ts`; Test `tests/unit/tam-geo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// append to tam-geo.test.ts
import { scoreAccount } from '../../scripts/intel/tam-geo/score';
it('scores proximity from the nearest facility and blends the stamped fit', () => {
  // a facility ~0mi from a reference site -> proximity ~100
  const ref = [{ lat: 40.5333, lng: -75.6333 }]; // Allentown Primo
  const r = scoreAccount(
    { facilities: [{ lat: 40.5333, lng: -75.6333 }, { lat: 34.0, lng: -118.0 }] },
    ref, 70, [],
  );
  expect(r.nearest_distance_mi).toBeLessThan(1);
  expect(r.proximity_score).toBeGreaterThan(95);
  // composite = 0.55*prox + 0.30*fit + 0.15*density, scaled 0-100
  expect(r.composite_score).toBeGreaterThan(70);
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement score.ts** (mirrors `src/lib/discovery/scoring.ts`: exp-decay proximity, density/5 cap)

```ts
// scripts/intel/tam-geo/score.ts
const R_MI = 3958.7613;
const toRad = (d: number) => (d * Math.PI) / 180;
export function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(s)));
}
const PROX_DECAY_MI = 30;
const proximityComponent = (mi: number) => Math.exp(-Math.max(0, mi) / PROX_DECAY_MI);
const densityComponent = (n: number) => Math.min(1, n / 5);

export interface Site { lat: number; lng: number; name?: string }
export interface RefSite { lat: number; lng: number; name?: string }
export interface AccountScore {
  nearest_distance_mi: number; proximity_score: number; corridor_density: number;
  composite_score: number; nearest_primo_site: string | null; facilities: number;
}
// allFacilities = every TAM facility (for corridor density); fit = stamped 0-100 (or null).
export function scoreAccount(
  roster: { facilities: Site[] }, refSites: RefSite[], fit: number | null, allFacilities: Site[],
): AccountScore {
  const facs = (roster.facilities ?? []).filter((f) => typeof f.lat === 'number' && typeof f.lng === 'number');
  let best = Infinity, bestRef: RefSite | null = null;
  for (const f of facs) for (const s of refSites) {
    const d = haversineMi(f.lat, f.lng, s.lat, s.lng);
    if (d < best) { best = d; bestRef = s; }
  }
  const dist = Number.isFinite(best) ? best : null;
  // density: max neighbors-within-5mi across this account's facilities (excluding self)
  let density = 0;
  for (const f of facs) {
    let n = 0;
    for (const o of allFacilities) if (o !== f && haversineMi(f.lat, f.lng, o.lat, o.lng) <= 5) n += 1;
    if (n > density) density = n;
  }
  const proxC = dist == null ? 0 : proximityComponent(dist);
  const fit01 = (fit ?? 0) / 100;
  const composite = Math.round((0.55 * proxC + 0.3 * fit01 + 0.15 * densityComponent(density)) * 100 * 100) / 100;
  return {
    nearest_distance_mi: dist == null ? -1 : Math.round(dist * 10) / 10,
    proximity_score: Math.round(proxC * 100),
    corridor_density: density,
    composite_score: composite,
    nearest_primo_site: bestRef?.name ?? null,
    facilities: facs.length,
  };
}
```

- [ ] **Step 4: Run → PASS, commit**
```bash
git add scripts/intel/tam-geo/score.ts tests/unit/tam-geo.test.ts
git commit -m "feat(tam-geo): geo-scorer (proximity+density+composite from geocoded rosters)"
```

---

### Task 6: Score-pending + stamp-pending + orchestrator

**Files:** Create `score-pending.ts`, `stamp-pending.ts`, `run.ts`

- [ ] **Step 1: score-pending.ts** — load every `geocoded` roster, build the global facility set (all TAM facilities, for density), score each, write `output/intel/tam-geo/scores/<slug>.json`, advance to `scored`.

```ts
// scripts/intel/tam-geo/score-pending.ts
import fs from 'node:fs';
import path from 'node:path';
import { REFERENCE_SITES } from '@/lib/discovery/reference-sites';
import { byStatus, append } from './ledger';
import { scoreAccount, type Site } from './score';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'output', 'intel', 'tam-geo', 'scores');
fs.mkdirSync(OUT, { recursive: true });
const refs = REFERENCE_SITES.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name }));
const readRoster = (slug: string) => JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'yard-audits', slug, 'roster.json'), 'utf8'));

const geocoded = byStatus('geocoded');
const allFac: Site[] = [];
const rosters = new Map<string, { facilities: Site[] }>();
for (const r of geocoded) {
  try { const ro = readRoster(r.slug); rosters.set(r.slug, ro); for (const f of ro.facilities ?? []) if (typeof f.lat === 'number') allFac.push(f); } catch { /* */ }
}
let scored = 0;
for (const r of geocoded) {
  const ro = rosters.get(r.slug);
  if (!ro) { append({ ...r, status: 'error', error: 'roster unreadable' }); continue; }
  const s = scoreAccount(ro, refs, r.fit, allFac);
  fs.writeFileSync(path.join(OUT, `${r.slug}.json`), JSON.stringify({ slug: r.slug, domain: r.domain, ...s }, null, 2));
  append({ ...r, status: 'scored', facilities: s.facilities });
  scored += 1;
}
console.log(`scored ${scored} accounts -> output/intel/tam-geo/scores/`);
```

- [ ] **Step 2: stamp-pending.ts** — batch-update HubSpot companies (by domain) from `scores/<slug>.json`, advance to `stamped`. Reuse the `output/intel/hubspot-companies.json` index for the company id.

```ts
// scripts/intel/tam-geo/stamp-pending.ts  (Node, private-app token)
import fs from 'node:fs';
import path from 'node:path';
import { byStatus, append } from './ledger';
const ROOT = process.cwd();
const TOKEN = (fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/HUBSPOT_ACCESS_TOKEN\s*=\s*"?([^"\n\r]+)"?/) || [])[1];
const hs = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'intel', 'hubspot-companies.json'), 'utf8'));
const idByDomain = new Map<string, string>(); for (const c of hs.companies) if (c.domain) idByDomain.set(c.domain.toLowerCase(), c.id);
const today = new Date().toISOString().slice(0, 10);
const dry = process.argv.includes('--dry-run');
const inputs: Array<{ id: string; properties: Record<string, string> }> = [];
const skip: string[] = [];
for (const r of byStatus('scored')) {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'output', 'intel', 'tam-geo', 'scores', `${r.slug}.json`), 'utf8'));
  const id = r.domain ? idByDomain.get(r.domain) : undefined;
  if (!id) { skip.push(r.slug); continue; }
  const p: Record<string, string> = { yardflow_proximity_score: String(s.proximity_score), yardflow_corridor_density: String(s.corridor_density), yardflow_yard_facilities: String(s.facilities), yardflow_score_at: today };
  if (s.composite_score != null) p.yardflow_composite_score = String(s.composite_score);
  if (s.nearest_distance_mi >= 0) p.yardflow_nearest_primo_mi = String(s.nearest_distance_mi);
  if (s.nearest_primo_site) p.yardflow_nearest_primo_site = s.nearest_primo_site;
  inputs.push({ id, properties: p });
}
console.log(`to stamp: ${inputs.length} | no-domain-match skip: ${skip.length}`);
if (dry) process.exit(0);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
(async () => {
  for (let i = 0; i < inputs.length; i += 100) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/companies/batch/update', { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: inputs.slice(i, i + 100) }) });
    if (!res.ok) { console.error('batch failed', res.status, (await res.text()).slice(0, 140)); continue; }
    await sleep(200);
  }
  for (const r of byStatus('scored')) if (r.domain && idByDomain.get(r.domain)) append({ ...r, status: 'stamped' });
  console.log('stamped.');
})();
```

- [ ] **Step 3: run.ts** — orchestrator + progress/cost report (`--phase=seed|discover|geocode|score|stamp|status`). Prints the ledger status histogram + estimated geocode cost. (Compose the prior scripts; `status` reads the ledger and prints counts per status.)

- [ ] **Step 4: tsc + the full test, then commit**
```bash
npx tsc --noEmit 2>&1 | grep -E "tam-geo|error TS" | head
npx vitest run tests/unit/tam-geo.test.ts
git add scripts/intel/tam-geo/score-pending.ts scripts/intel/tam-geo/stamp-pending.ts scripts/intel/tam-geo/run.ts
git commit -m "feat(tam-geo): score-pending + stamp-pending + orchestrator"
```

---

## How to run it (the long, resumable loop)
1. `npx tsx scripts/intel/tam-geo/seed-ledger.ts` (727 → ledger).
2. Loop until `status` shows 0 pending: `discover-batch.ts --limit=20` lists the next batch → dispatch discovery agents **in waves of ~5 concurrent** → re-run to reconcile. (The long pole; resumable — roster.json is the checkpoint.)
   - **Throttle (learned in the 2026-06-15 pilot):** a 17-wide concurrent dispatch tripped a server-side rate limit and 13 of 17 agents returned empty. Keep concurrency at ~5; the rate limit is on simultaneous agent spawns, not total volume. List 20 with `--limit=20`, then fan out 5 at a time.
3. `geocode-pending.ts --limit=50` (repeat until 0 roster-status). Retries `error`-status accounts automatically.
4. `score-pending.ts` (one pass once geocoding is done; re-runnable).
5. `stamp-pending.ts --dry-run` → review → `stamp-pending.ts`. Run all steps **from the repo root** (the scripts resolve paths via `process.cwd()`).
6. `run.ts --phase=status` any time for the progress + cost report.
Crash/reboot safe at every step: the ledger + filesystem rosters are the durable state.

## Self-Review
- **Spec coverage:** thorough facility discovery (Task 3, the discovery agent — not the near-Primo scanner), geocoding (Task 4, the proven cheap path), proximity+density+composite (Task 5), HubSpot stamp (Task 6), resumability (the ledger + filesystem rosters, every task). Cost report (Task 6 run.ts).
- **Placeholder scan:** none — deterministic steps have full code; the one non-code step (dispatching discovery agents) is explicitly an executor action with the exact prompt + output schema.
- **Type consistency:** `Status` (ledger) reused across all phase scripts; `scoreAccount(roster, refs, fit, allFacilities)` signature consistent Task 5↔6; `Site`/`AccountScore` shared.
- **"Don't be lazy":** discovery agent finds ALL facilities (D&B/Panjiva/10-K/jobs), caps at 30/account; density uses the full TAM facility set; composite reuses the real scoring math. No sampling.
- **Honest limits:** accounts with no resolvable facilities score proximity 0 (logged, not faked); no-domain accounts skip the stamp (logged). The fit is the already-stamped tam-derived value; an optional enhancement is to prefer KNOWN_BRANDS fit where the company is one of the 257 known brands.

## Execution Handoff
Plan saved to `docs/superpowers/plans/2026-06-15-tier-a-tam-geocode-score.md`. Two options:
1. **Subagent-Driven (recommended)** — fresh subagent per task; the discovery phase (Task 3) is itself a long fan-out of discovery agents.
2. **Inline Execution** — batch with checkpoints.
Runs locally (the Google key + the multi-hour runtime are on the box). The discovery phase is the cost + time; everything else is minutes.
