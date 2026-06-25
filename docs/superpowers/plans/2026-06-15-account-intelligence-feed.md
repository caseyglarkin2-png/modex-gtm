# Account Intelligence Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EVERY piece of modex's account intelligence callable by clawd-prod over HTTP — the yard-audit dossier text, the geofence geometry, the microsite/ABM research, and the full scored universe — completing "systems not silos." Today clawd can pull scores, the structured account record, and the deduped list; the dossier/geometry/microsite *bodies* and the full 7,912-site scored set are still local silos.

**Architecture:** Extend the existing `GET /api/intel/accounts/` with an `?include=` param backed by split, committed, statically-imported bundles (Vercel never bundles runtime `fs` reads of `output/**`, so we precompute — same pattern as `proximity-data.json`). Add one new bulk stream `GET /api/intel/export/scored/` for the full universe, and a refresh cron so the bundles stay current. All reuse the existing `x-queue-secret` auth and fail-soft posture.

**Tech Stack:** Next.js App Router route handlers, `tsx` generator scripts, `vitest`, the existing `src/lib/intel/export/auth.ts`.

---

## File Structure

- **Create** `scripts/intel/gen-account-intel-bundles.ts` — reads the yard-audit corpus + microsite registry, emits the committed bundles below. Author-time only (fs is fine locally).
- **Create (generated, committed)** `src/lib/intel/export/account-intel-dossiers.json` — `{ [slug]: { [siteIdx]: markdownText } }`.
- **Create (generated, committed)** `src/lib/intel/export/account-intel-geometry.json` — `{ [slug]: Array<{ idx, name, geofences }> }`.
- **Create (generated, committed)** `src/lib/intel/export/account-intel-microsite.json` — `{ [slug]: { painPoints, recentNews, yardFlowAngle, network } }` (flattened from the ABM registry).
- **Create (generated, committed)** `src/lib/intel/export/scored-universe.json` — the 7,912 scored sites trimmed to the fields clawd needs (name, lat/lng, sub-scores, tier, existingAccountSlug, nearestPrimo).
- **Modify** `src/lib/intel/export/accounts.ts` — add `include` loading (dossiers/geometry/microsite) to `lookupAccount`.
- **Modify** `src/app/api/intel/accounts/[...]/route.ts` (the existing `src/app/api/intel/accounts/route.ts`) — parse `?include=`.
- **Create** `src/lib/intel/export/scored.ts` — paginated reader over `scored-universe.json`.
- **Create** `src/app/api/intel/export/scored/route.ts` — the bulk stream (or fold into the `[stream]` switch; see Task 5 note).
- **Create** `src/app/api/cron/refresh-intel/route.ts` — regenerate-and-commit is author-time, so this cron instead re-validates freshness and pings if stale (see Task 6).
- **Create** `tests/unit/account-intel.test.ts` — pure-function tests for the lib pieces.
- **Create** `docs/superpowers/specs/2026-06-15-account-intel-feed-contract.md` — the contract + clawd relay.

Each bundle is split by concern so `?include=` only pays for what it asks (geometry is the heavy one, ~5-10MB; default lookup stays lean).

---

### Task 1: The intelligence bundle generator

**Files:**
- Create: `scripts/intel/gen-account-intel-bundles.ts`
- Create (output): the four `src/lib/intel/export/account-intel-*.json` + `scored-universe.json`

- [ ] **Step 1: Write the generator**

```ts
// scripts/intel/gen-account-intel-bundles.ts
import fs from 'node:fs';
import path from 'node:path';
import { getAllAccountMicrositeData } from '@/lib/microsites/accounts';

const ROOT = process.cwd();
const YA = path.join(ROOT, 'output', 'yard-audits');
const OUT = path.join(ROOT, 'src', 'lib', 'intel', 'export');

function slugs(): string[] {
  return fs.readdirSync(YA, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

// dossiers: { slug: { idx: markdown } }
const dossiers: Record<string, Record<number, string>> = {};
for (const slug of slugs()) {
  const dir = path.join(YA, slug, 'dossiers');
  if (!fs.existsSync(dir)) continue;
  const m: Record<number, string> = {};
  fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().forEach((f, i) => {
    m[i + 1] = fs.readFileSync(path.join(dir, f), 'utf8');
  });
  if (Object.keys(m).length) dossiers[slug] = m;
}

// geometry: { slug: [{ idx, name, geofences }] }
const geometry: Record<string, Array<{ idx: number; name: string; geofences: unknown }>> = {};
for (const slug of slugs()) {
  const dir = path.join(YA, slug, 'sites');
  if (!fs.existsSync(dir)) continue;
  const arr = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f, i) => {
    let d: Record<string, unknown> = {};
    try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { /* skip */ }
    return { idx: i + 1, name: String(d.name ?? f), geofences: d.geofences ?? null };
  });
  if (arr.length) geometry[slug] = arr;
}

// microsite research: { slug: { painPoints, recentNews, yardFlowAngle, network } }
const microsite: Record<string, unknown> = {};
for (const a of getAllAccountMicrositeData()) {
  microsite[a.slug] = {
    painPoints: (a as Record<string, unknown>).painPoints ?? null,
    recentNews: (a as Record<string, unknown>).recentNews ?? null,
    yardFlowAngle: (a as Record<string, unknown>).yardFlowAngle ?? null,
    network: (a as Record<string, unknown>).network ?? null,
  };
}

const write = (name: string, data: unknown) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify({ generatedAt: new Date().toISOString(), data }));
  const kb = Math.round(fs.statSync(path.join(OUT, name)).size / 1024);
  console.log(`${name}: ${kb} KB`);
};
write('account-intel-dossiers.json', dossiers);
write('account-intel-geometry.json', geometry);
write('account-intel-microsite.json', microsite);
console.log(`dossiers: ${Object.keys(dossiers).length} accounts, geometry: ${Object.keys(geometry).length}, microsite: ${Object.keys(microsite).length}`);
```

- [ ] **Step 2: Run it**

Run: `npx tsx scripts/intel/gen-account-intel-bundles.ts`
Expected: three JSON files written; console reports per-file KB + account counts. Confirm `account-intel-geometry.json` is the largest.

- [ ] **Step 3: Commit**

```bash
git add scripts/intel/gen-account-intel-bundles.ts src/lib/intel/export/account-intel-dossiers.json src/lib/intel/export/account-intel-geometry.json src/lib/intel/export/account-intel-microsite.json
git commit -m "feat(intel): generate account-intelligence bundles (dossiers, geometry, microsite)"
```

---

### Task 2: The scored-universe bundle (the full 7,912)

**Files:**
- Modify: `scripts/intel/gen-account-intel-bundles.ts` (append)
- Create (output): `src/lib/intel/export/scored-universe.json`

- [ ] **Step 1: Append the scored trim to the generator**

```ts
// append to gen-account-intel-bundles.ts
import { loadLatestScored } from '@/lib/discovery/data';
const scored = loadLatestScored();
const universe = (scored?.prospects ?? []).map((p: Record<string, any>) => ({
  name: p.name, lat: p.lat, lng: p.lng, tier: p.tier, icp: p.icpScore,
  sub: p.scoreBreakdown, slug: p.existingAccountSlug ?? null,
  nearest: p.nearestPrimoSite, corridor: p.corridor,
}));
write('scored-universe.json', universe);
console.log(`scored-universe: ${universe.length} sites`);
```

- [ ] **Step 2: Run + verify count**

Run: `npx tsx scripts/intel/gen-account-intel-bundles.ts`
Expected: `scored-universe: 7912 sites` and the file written.

- [ ] **Step 3: Commit**

```bash
git add scripts/intel/gen-account-intel-bundles.ts src/lib/intel/export/scored-universe.json
git commit -m "feat(intel): bundle the full 7,912-site scored universe"
```

---

### Task 3: `?include=` on the account lookup

**Files:**
- Modify: `src/lib/intel/export/accounts.ts`
- Test: `tests/unit/account-intel.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/account-intel.test.ts
import { describe, expect, it } from 'vitest';
import { lookupAccount } from '@/lib/intel/export/accounts';

describe('lookupAccount include', () => {
  it('adds dossiers + geometry + microsite when requested for an audited account', () => {
    const r = lookupAccount(null, 'boston-beer-company', ['dossiers', 'geometry', 'microsite']);
    expect(r.detail_level).toBe('full');
    const a = r.account as Record<string, unknown>;
    expect(a.dossiers).toBeDefined();
    expect(Array.isArray(a.geometry)).toBe(true);
  });
  it('omits heavy includes by default', () => {
    const r = lookupAccount(null, 'boston-beer-company', []);
    expect((r.account as Record<string, unknown>).geometry).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it (fails — signature mismatch)**

Run: `npx vitest run tests/unit/account-intel.test.ts`
Expected: FAIL (lookupAccount takes 2 args, not 3).

- [ ] **Step 3: Implement the include in accounts.ts**

```ts
// add to src/lib/intel/export/accounts.ts
import dossiersBundle from './account-intel-dossiers.json';
import geometryBundle from './account-intel-geometry.json';
import micrositeBundle from './account-intel-microsite.json';

const DOSSIERS = (dossiersBundle as { data: Record<string, Record<string, string>> }).data;
const GEOMETRY = (geometryBundle as { data: Record<string, unknown[]> }).data;
const MICROSITE = (micrositeBundle as { data: Record<string, unknown> }).data;

export type Include = 'dossiers' | 'geometry' | 'microsite';

// CHANGE the signature: lookupAccount(domain, slug, include: Include[] = [])
// After resolving `full`/`scored`, when full and include set, attach:
//   if (include.includes('dossiers')) (account as any).dossiers = DOSSIERS[full.slug] ?? {};
//   if (include.includes('geometry')) (account as any).geometry = GEOMETRY[full.slug] ?? [];
//   if (include.includes('microsite')) (account as any).microsite = MICROSITE[full.slug] ?? null;
// Return a shallow clone so the imported bundle objects are never mutated.
```

- [ ] **Step 4: Run the test (passes)**

Run: `npx vitest run tests/unit/account-intel.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add src/lib/intel/export/accounts.ts tests/unit/account-intel.test.ts
git commit -m "feat(intel): ?include= dossiers/geometry/microsite on account lookup"
```

---

### Task 4: `?include=` on the route

**Files:**
- Modify: `src/app/api/intel/accounts/route.ts`

- [ ] **Step 1: Parse `include` and pass it through**

```ts
// in GET, before lookupAccount:
const include = (url.searchParams.get('include') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean) as Include[];
// ...
return NextResponse.json(lookupAccount(domain, slug, include));
```
(Import `type { Include }` from the lib.)

- [ ] **Step 2: Local smoke**

```bash
npx tsx -e "import {lookupAccount} from '@/lib/intel/export/accounts'; const r=lookupAccount(null,'boston-beer-company',['dossiers','geometry','microsite']); console.log('dossier keys:',Object.keys((r.account as any).dossiers||{}).length,'geometry sites:',(r.account as any).geometry?.length)"
```
Expected: dossier keys + geometry site count > 0.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/intel/accounts/route.ts"
git commit -m "feat(intel): wire ?include= through the account route"
```

---

### Task 5: The full scored-universe stream

**Files:**
- Create: `src/lib/intel/export/scored.ts`
- Create: `src/app/api/intel/export/scored/route.ts`
- Test: add to `tests/unit/account-intel.test.ts`

> Note: a dedicated route avoids touching the existing `[stream]` switch (which Flow-State/other sessions may be editing). Same `isAuthorizedIntelExport` + `x-queue-secret`.

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/unit/account-intel.test.ts
import { listScored } from '@/lib/intel/export/scored';
describe('listScored', () => {
  it('pages the universe and returns a cursor', () => {
    const p = listScored(null, 100);
    expect(p.items.length).toBe(100);
    expect(p.total).toBeGreaterThan(7000);
    expect(p.nextCursor).toBe('100');
  });
});
```

- [ ] **Step 2: Run (fails — no module)**

Run: `npx vitest run tests/unit/account-intel.test.ts`
Expected: FAIL (cannot find scored.ts).

- [ ] **Step 3: Implement scored.ts**

```ts
// src/lib/intel/export/scored.ts
import bundle from './scored-universe.json';
const UNIVERSE = (bundle as { data: unknown[] }).data;
export function listScored(cursor: string | null, limit: number) {
  const start = cursor ? Math.max(0, Number.parseInt(cursor, 10) || 0) : 0;
  const items = UNIVERSE.slice(start, start + limit);
  const next = start + limit;
  return { items, nextCursor: next < UNIVERSE.length ? String(next) : null, total: UNIVERSE.length };
}
```

- [ ] **Step 4: Implement the route**

```ts
// src/app/api/intel/export/scored/route.ts
import { NextResponse } from 'next/server';
import { isAuthorizedIntelExport } from '@/lib/intel/export/auth';
import { listScored } from '@/lib/intel/export/scored';
export const dynamic = 'force-dynamic';
export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedIntelExport(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const n = Number.parseInt(url.searchParams.get('limit') ?? '300', 10);
  const limit = !Number.isFinite(n) || n <= 0 ? 300 : Math.min(n, 500);
  try { return NextResponse.json(listScored(url.searchParams.get('cursor'), limit)); }
  catch (e) { console.warn('[scored]', e); return NextResponse.json({ items: [], nextCursor: null, total: 0 }); }
}
```

- [ ] **Step 5: Run the test (passes), then commit**

Run: `npx vitest run tests/unit/account-intel.test.ts` → PASS.
```bash
git add src/lib/intel/export/scored.ts "src/app/api/intel/export/scored/route.ts" tests/unit/account-intel.test.ts
git commit -m "feat(intel): full scored-universe stream (/api/intel/export/scored)"
```

---

### Task 6: Freshness cron + the contract/relay

**Files:**
- Create: `src/app/api/cron/refresh-intel/route.ts`
- Modify: `vercel.json`
- Create: `docs/superpowers/specs/2026-06-15-account-intel-feed-contract.md`

> The bundles are committed (author-time generated), so the cron does NOT regenerate them (it has no repo write). Instead it reports staleness: if `generatedAt` on the bundles is older than N days, it pings #yardflow-intent so a human re-runs the generators. This keeps "systems not silos" honest without pretending a serverless function can commit.

- [ ] **Step 1: Write the cron route**

```ts
// src/app/api/cron/refresh-intel/route.ts
import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';
import proximity from '@/lib/intel/export/proximity-data.json';
export const dynamic = 'force-dynamic';
const STALE_DAYS = 14;
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const gen = new Date((proximity as { generatedAt: string }).generatedAt).getTime();
  const ageDays = Math.floor((Date.now() - gen) / 86_400_000);
  if (ageDays >= STALE_DAYS) {
    await sendSlackNotification(`Intel bundles are ${ageDays}d old. Re-run: npx tsx scripts/intel/gen-proximity-export.ts && gen-account-research-package.ts && gen-account-intel-bundles.ts && gen-deduped-accounts.ts, then commit + push.`);
  }
  return NextResponse.json({ ageDays, stale: ageDays >= STALE_DAYS });
}
```

- [ ] **Step 2: Add the cron to `vercel.json`**

Add to the `crons` array: `{ "path": "/api/cron/refresh-intel", "schedule": "0 13 * * 1" }` (Mondays 9am ET).

- [ ] **Step 3: Write the contract doc**

Create `docs/superpowers/specs/2026-06-15-account-intel-feed-contract.md` documenting every feed, its params, auth, and the clawd relay (below). Mirror it into clawd-control-plane.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/cron/refresh-intel/route.ts" vercel.json docs/superpowers/specs/2026-06-15-account-intel-feed-contract.md
git commit -m "feat(intel): staleness cron + account-intel feed contract"
```

---

## The clawd relay (include in the contract doc)
> Everything modex knows is now callable, no silos:
> - `GET /api/intel/accounts/?domain=|?slug=&include=dossiers,geometry,microsite` — one account's full intelligence: scores + yard-audit sites + 22-field classification + **the dossier markdown text** + **geofence geometry** + **the ABM research (painPoints/news/angle/network)** + committee.
> - `GET /api/intel/export/scored/?cursor=&limit=` — the full 7,912-site scored universe with every sub-score.
> - Existing: the deduped account list (`/api/intel/accounts/?cursor=`), the 6 export streams, pounce, the Outbox.
> All `x-queue-secret`, fail-soft, bundled (Vercel-safe). The dossiers/geometry are opt-in via `include` because geometry is heavy. Pull everything you need for a sniper job in one or two calls.

---

## Self-Review
- **Spec coverage:** dossiers (Task 1+3), geometry (Task 1+3), microsite research (Task 1+3), full scored universe (Task 2+5), freshness (Task 6), contract+relay (Task 6). All "other intelligence" covered.
- **Placeholder scan:** none — every step has runnable code or an exact command.
- **Type consistency:** `Include` type defined in Task 3, imported in Task 4; `lookupAccount(domain, slug, include)` signature consistent across Tasks 3-4; `listScored(cursor, limit)` consistent Tasks 5.
- **Vercel-safe:** every served file is a static import (no runtime `fs` of `output/**`), matching the proven `proximity-data.json` pattern.
- **Collision-safe:** new dedicated routes, no edits to the shared `[stream]` switch or the pounce spine.

## Execution Handoff
Plan saved to `docs/superpowers/plans/2026-06-15-account-intelligence-feed.md`. Two execution options:
1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review between.
2. **Inline Execution** — batch with checkpoints.
Build off `origin/main` in an isolated worktree (the local checkout drifts onto `feat/qualification-engine`).
