# Discovery Hub — Build Sprint Plan

> **STATUS: DELIVERED.** All six sprints shipped; `/discovery` is live (route: `src/app/discovery/page.tsx`). The hub surfaces net-new prospects from corridor-scan + ICP-scoring, with tier filtering, satellite map clustering, and HubSpot push. Retained as reference for build patterns. Last verified 2026-08-06.

> **For the agent:** This is an atomic, sequential build plan. Work one task at a
> time, top to bottom. Each task has a **Goal**, the **Files** it touches, the
> **Pattern** to mirror (a real file already in this repo — read it before
> writing), and a **Done when** acceptance gate. Do not skip the per-sprint
> **Verification gate**. Do not start a task until the previous one's gate is green.
>
> **Prime directive:** mirror existing conventions exactly. This app already has a
> design system, a `DataTable`, a `MetricCard`, a Leaflet map pattern, and a nav
> registry. We are *reusing*, not inventing.

---

## 0. Context (read first)

**What this is:** a new `/discovery` route — a "Discovery Hub" dashboard that
surfaces the net-new prospects produced by the corridor-scan + ICP-scoring
pipeline (`scripts/prospect-discovery/`). It lets Casey see ranked prospects,
filter by tier/corridor, view them on a satellite map clustered by corridor, and
push the good ones to HubSpot.

**The data source** is the newest file matching
`output/prospect-discovery/scored-prospects-*.json`, produced by
`npx tsx scripts/prospect-discovery/score-and-rank.ts`. **Run the pipeline before
building** so you have real data to render against.

**The data contract** (from `scripts/prospect-discovery/score-and-rank.ts`):

```ts
interface ScoredProspect {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  icpScore: number;                 // 0–100
  tier: 'A' | 'B' | 'C' | 'D';      // A≥70, B 50–69, C 30–49, D <30
  scoreBreakdown: {
    verticalMatch: number;          // 0–25
    enterpriseScale: number;        // 0–25
    networkComplexity: number;      // 0–25
    primoProximity: number;         // 0–10
    corridorDensity: number;        // 0–5
    placeTypeBonus: number;         // 0–10
  };
  isExistingAccount: boolean;
  existingAccountSlug?: string;
  nearestPrimoSite: { name: string; distanceMiles: number };
  corridor: string;
  discoveredVia: string[];
}

interface Corridor {
  name: string;
  center: { lat: number; lng: number };
  radiusMiles: number;
  totalProspects: number;
  tierACount: number;
  avgIcpScore: number;
  topProspects: string[];
}

interface ScoredOutput {
  generatedAt: string;
  inputFile: string;
  totalDiscoveries: number;
  existingAccountMatches: number;
  netNewProspects: number;
  tierA: number; tierB: number; tierC: number; tierD: number;
  corridors: Corridor[];
  prospects: ScoredProspect[];
}
```

**Design system reference** (read these — they ARE the spec):
- Page composition: `src/app/accounts/page.tsx`
- Table: `src/app/accounts/accounts-table.tsx` + `src/components/data-table.tsx`
- Metric tiles: `src/components/metric-card.tsx`
- Tier/band badge: `src/components/band-badge.tsx` + `src/lib/constants.ts` (`BAND_COLORS`)
- Multi-marker Leaflet map (dynamic, `ssr:false`): `src/components/demo/network-atlas.tsx` → `network-atlas-inner.tsx`
- Single-site satellite map (Esri tiles, polygons): `src/components/demo/site-detail-map-inner.tsx`
- Nav registry: `src/lib/navigation.ts`
- Status chips: `src/components/status-badge.tsx`

**Guardrails:**
- New route must be `export const dynamic = 'force-dynamic'` (data is read at request time).
- Client components only where interactivity demands it (`'use client'`); keep the page a Server Component.
- Any map component must be a dynamic import with `ssr: false` — Leaflet touches `window`.
- Do not edit the pipeline scripts. The UI consumes their output; it does not change scoring.
- Reuse `DataTable`, `MetricCard`, `BandBadge`, `Card`. Do not hand-roll tables or cards.
- Keep CSS to the existing token vars (`var(--primary)`, `var(--muted-foreground)`, etc.).

---

## Sprint 0 — Data Layer & Types (6 tasks)

> Goal: one typed, tested server-side loader that turns the newest scored JSON
> into clean view models. Everything downstream imports from here.

### S0-T1 · Shared types module
- **Goal:** Port the data contract into the app as the single source of truth.
- **Files:** create `src/lib/discovery/types.ts`.
- **Pattern:** plain exported interfaces; mirror the contract above verbatim.
- **Done when:** `ScoredProspect`, `Corridor`, `ScoredOutput`, plus a
  `ProspectRow` view-model type (flattened for the table) are exported and
  `npx tsc --noEmit` passes.

### S0-T2 · Loader: find + parse newest scored file
- **Goal:** Read the latest `scored-prospects-*.json` from `output/prospect-discovery/`.
- **Files:** create `src/lib/discovery/data.ts` with `loadLatestScored(): ScoredOutput | null`.
- **Pattern:** mirror the file-resolution logic in
  `scripts/prospect-discovery/score-and-rank.ts` (`resolveInputFile` — readdir,
  filter prefix, sort desc, take first). Use `node:fs` + `path`. Return `null`
  (don't throw) when the dir/file is absent.
- **Important:** the dated `scored-prospects-*.json` files are **gitignored**
  (they're regenerated locally and on CI/Vercel they won't exist). Resolution
  order: (1) newest dated `scored-prospects-*.json`, else (2) the committed
  `output/prospect-discovery/SAMPLE-scored-prospects.json`, else (3) `null`.
  This guarantees the Vercel preview and CI tests always have data to render.
- **Done when:** a unit call returns the parsed object against the committed
  `SAMPLE-scored-prospects.json`, and `null` only when even the sample is absent.

### S0-T3 · View-model mappers
- **Goal:** Convert `ScoredProspect` → `ProspectRow` (adds `cityState` parsed from
  address, `slug` from placeId, flattened breakdown fields for sortable columns).
- **Files:** add `toProspectRow()` + `extractCityState()` to `src/lib/discovery/data.ts`.
- **Pattern:** copy `extractCityState` from `score-and-rank.ts`; slugify via the
  same regex used in `src/app/accounts/page.tsx`.
- **Done when:** `toProspectRow` is pure, typed, and every row has non-empty
  `name`, `tier`, numeric `icpScore`.

### S0-T4 · Selectors / aggregates
- **Goal:** Derive the dashboard headline numbers without recomputing in the page.
- **Files:** add `getDiscoverySummary(output)` to `src/lib/discovery/data.ts`
  returning `{ totalNetNew, tierACount, corridorCount, avgScore, generatedAt }`.
- **Pattern:** the `reduce`/`filter` aggregate style in `accounts/page.tsx`
  (`bandCounts`, `readyBandsCount`).
- **Done when:** numbers match the JSON's own `tierA`/`netNewProspects` fields.

### S0-T5 · Filter helper (pure)
- **Goal:** One pure function the client can call for tier/corridor/min-score/search.
- **Files:** add `filterProspects(rows, { tier?, corridor?, minScore?, q? })` to
  `src/lib/discovery/data.ts`.
- **Pattern:** the filter-chip approach in `accounts/page.tsx`; keep it pure (no React).
- **Done when:** unit-style spot checks pass (tier='A' returns only A rows, etc.).

### S0-T6 · Loader unit test
- **Goal:** Lock the loader/mappers against the committed sample JSON.
- **Files:** create `src/lib/discovery/data.test.ts` (match the repo's test runner —
  check `package.json` scripts; likely `vitest`).
- **Pattern:** find an existing `*.test.ts` and mirror its imports/structure.
- **Done when:** `npm test -- discovery` (or the repo's equivalent) is green.

> **🚦 Sprint 0 gate:** `npx tsc --noEmit` clean · `npm run lint` clean · loader test green.

---

## Sprint 1 — Route Skeleton & Navigation (5 tasks)

### S1-T1 · Register the nav module
- **Goal:** Add "Discovery" to the sidebar + command palette.
- **Files:** `src/lib/navigation.ts`.
- **Pattern:** copy an existing `canonicalNavModules` entry; use the `Compass`
  (or `Telescope`/`Radar`) lucide icon; `href: '/discovery'`,
  `aliases: ['/discovery']`. Add a matching `commandRoutes` entry.
- **Done when:** nav renders Discovery, and any existing navigation snapshot/test
  is updated and green.

### S1-T2 · Route shell
- **Goal:** Create the page as a Server Component that loads data once.
- **Files:** create `src/app/discovery/page.tsx`.
- **Pattern:** the top of `src/app/accounts/page.tsx` — `export const dynamic =
  'force-dynamic'`, `metadata`, `<Breadcrumb>`, intro `<p>`. Call
  `loadLatestScored()`.
- **Done when:** `/discovery` renders without error in `npm run dev`.

### S1-T3 · Empty / no-data state
- **Goal:** Graceful state when no scored file exists yet.
- **Files:** `src/app/discovery/page.tsx`.
- **Pattern:** the empty-state `TableRow` in `data-table.tsx`; use a `Card` with a
  one-liner "Run `score-and-rank.ts` to populate."
- **Done when:** with the output dir empty, the page shows the prompt, no crash.

### S1-T4 · Metric row
- **Goal:** Four `MetricCard`s across the top.
- **Files:** `src/app/discovery/page.tsx`.
- **Pattern:** the `grid gap-4 md:grid-cols-4` MetricCard row in `accounts/page.tsx`.
  Show: Net-new prospects, Tier A, Corridors, Avg ICP score. Tones per the
  existing convention (blue for A, etc.).
- **Done when:** tiles show numbers from `getDiscoverySummary`.

### S1-T5 · "Last scanned" provenance line
- **Goal:** Surface `generatedAt` + source file so the data's freshness is visible.
- **Files:** `src/app/discovery/page.tsx`.
- **Pattern:** the muted `text-xs text-[var(--muted-foreground)]` caption style.
- **Done when:** renders e.g. "Scored 2026-06-04 · from corridor-scan-2026-06-04.json".

> **🚦 Sprint 1 gate:** `/discovery` loads with metrics + provenance; nav tests green; build passes.

---

## Sprint 2 — Prospect Table (6 tasks)

### S2-T1 · Table client component
- **Goal:** A `ProspectsTable` wrapping `DataTable<ProspectRow>`.
- **Files:** create `src/app/discovery/prospects-table.tsx` (`'use client'`).
- **Pattern:** `src/app/accounts/accounts-table.tsx` exactly (columns array +
  `DataTable` + `searchKey="name"`).
- **Done when:** table renders all net-new prospects, searchable by name.

### S2-T2 · Core columns
- **Goal:** Rank, Name, City/State, Corridor, Vertical-ish.
- **Files:** `prospects-table.tsx`.
- **Pattern:** `columns: Column<ProspectRow>[]` with responsive `className`
  (`hidden lg:table-cell`) as in accounts-table.
- **Done when:** columns sortable; responsive hides correctly at breakpoints.

### S2-T3 · ICP score + Tier columns
- **Goal:** Score as mono-bold; Tier via `BandBadge`.
- **Files:** `prospects-table.tsx`.
- **Pattern:** `priority_score` (mono) and `priority_band` (`<BandBadge>`) renders
  in accounts-table. Confirm `BAND_COLORS` in `src/lib/constants.ts` has A/B/C/D;
  if not, extend it (tier D = gray).
- **Done when:** A rows show the A badge color, score right-aligned mono.

### S2-T4 · Score-breakdown columns
- **Goal:** Show the 3 dimensions that drive ranking: Enterprise Scale, Network
  Complexity, Vertical (the other three are minor — keep them in the detail sheet).
- **Files:** `prospects-table.tsx`.
- **Pattern:** numeric columns, `hidden xl:table-cell`, sortable.
- **Done when:** sorting by Enterprise Scale reorders correctly.

### S2-T5 · "Existing account" indicator
- **Goal:** Flag rows where `isExistingAccount` so they're visibly deprioritized.
- **Files:** `prospects-table.tsx`.
- **Pattern:** the `HotBadge`/inline-badge composition in accounts-table's name
  cell. Use a muted "In CRM" chip linking to `/accounts/{existingAccountSlug}`.
- **Done when:** existing-account rows are visually distinct; net-new are default.

### S2-T6 · Wire table into page
- **Goal:** Render `<ProspectsTable>` below the metric row.
- **Files:** `src/app/discovery/page.tsx`.
- **Pattern:** `<AccountsTable accounts={accounts} />` at the bottom of accounts page.
- **Done when:** full page = breadcrumb + metrics + provenance + table, all live.

> **🚦 Sprint 2 gate:** table sorts/searches across all columns; existing-account rows flagged; lint+types+build green.

---

## Sprint 3 — Corridor Map (6 tasks)

### S3-T1 · Dynamic map wrapper
- **Goal:** `ssr:false` wrapper so Leaflet never runs on the server.
- **Files:** create `src/components/discovery/corridor-map.tsx`.
- **Pattern:** `src/components/demo/network-atlas.tsx` verbatim (dynamic import,
  pulse skeleton with reserved height to avoid CLS).
- **Done when:** importing it in a client context renders the skeleton then map.

### S3-T2 · Map inner: base satellite layer
- **Goal:** Esri World Imagery tiles, fit to all prospect bounds.
- **Files:** create `src/components/discovery/corridor-map-inner.tsx` (`'use client'`).
- **Pattern:** `site-detail-map-inner.tsx` (TileLayer URL + attribution + a
  `FitToBounds` helper like `FitToPerimeter`).
- **Done when:** map opens framed to the full US prospect spread.

### S3-T3 · Prospect markers
- **Goal:** One marker per prospect, colored by tier.
- **Files:** `corridor-map-inner.tsx`.
- **Pattern:** the marker-rendering loop in `network-atlas-inner.tsx`
  (`CircleMarker` keyed by id). Color from a tier→color map aligned to `BAND_COLORS`.
- **Done when:** markers render at correct lat/lng, tier colors legible on satellite.

### S3-T4 · Corridor halos
- **Goal:** Draw each `Corridor` as a faint circle (center + radiusMiles).
- **Files:** `corridor-map-inner.tsx`.
- **Pattern:** the low-`fillOpacity` `Polygon`/`Circle` overlays in
  `site-detail-map-inner.tsx`. Convert miles→meters for Leaflet `Circle` radius.
- **Done when:** corridors read as soft clusters under the markers.

### S3-T5 · Marker popups
- **Goal:** Click a marker → name, city, ICP score, tier, nearest Primo.
- **Files:** `corridor-map-inner.tsx`.
- **Pattern:** Leaflet `Popup` child of the marker; keep content minimal/typed.
- **Done when:** popup shows correct prospect fields.

### S3-T6 · Map ↔ page integration
- **Goal:** Place the map in a `Card` above or beside the table.
- **Files:** `src/app/discovery/page.tsx` (+ a thin client island to pass data in).
- **Pattern:** the `grid gap-6 xl:grid-cols-[...]` two-pane layout in accounts page.
  Reserve explicit map height (`h-[480px]`) to prevent layout shift.
- **Done when:** map + table coexist, no CLS, no hydration warnings.

> **🚦 Sprint 3 gate:** map renders all prospects + corridor halos with zero console errors; build passes.

---

## Sprint 4 — Tabs, Corridors View & Scanner Panel (5 tasks)

### S4-T1 · Tab scaffold
- **Goal:** Split the hub into "Prospects" / "Corridors" / "Scan" tabs.
- **Files:** `src/app/discovery/page.tsx` (+ a `'use client'` tabs island if needed).
- **Pattern:** the `?tab=` URL-driven tabs used across Studio/Pipeline (see
  `commandRoutes` hrefs like `/studio?tab=briefs`) and `src/components/ui/tabs`.
- **Done when:** tab state persists in the URL; default = Prospects.

### S4-T2 · Corridors tab: ranked corridor cards
- **Goal:** One card per `Corridor`, sorted by `avgIcpScore × totalProspects`.
- **Files:** create `src/app/discovery/corridors-view.tsx`.
- **Pattern:** the "Coverage Snapshot" card list in `accounts/page.tsx`.
  Show name, totalProspects, tierACount, avgIcpScore, top-3 `topProspects`.
- **Done when:** corridor ranking matches the console output of `score-and-rank.ts`.

### S4-T3 · Corridor → table cross-filter
- **Goal:** Clicking a corridor card filters the Prospects tab to that corridor.
- **Files:** `corridors-view.tsx`, `prospects-table.tsx`.
- **Pattern:** the filter-chip + URL-param pattern (`?corridor=`) from accounts page.
  Reuse `filterProspects` from S0-T5.
- **Done when:** clicking "Upper Macungie Township" shows only its prospects + a clearable chip.

### S4-T4 · Tier / min-score filter bar
- **Goal:** Quick filters: tier chips (A/B/C/D) + a min-score control.
- **Files:** `src/app/discovery/filter-bar.tsx` (`'use client'`).
- **Pattern:** the active-filter-chips block in `accounts/page.tsx`; `Select` from
  `src/components/ui/select`.
- **Done when:** filters compose (tier + corridor + score) and reflect in URL.

### S4-T5 · Scan tab: read-only run status
- **Goal:** Show the last scan's stats and the exact command to refresh — no live
  API calls from the browser (the scanner is a CLI/server job).
- **Files:** create `src/app/discovery/scan-panel.tsx`.
- **Pattern:** a `Card` with `ScoredOutput` meta (generatedAt, totalDiscoveries,
  anchors) + a copy-able command block. Mirror muted-caption styling.
- **Done when:** panel shows real counts and the `npx tsx ... score-and-rank.ts` command.

> **🚦 Sprint 4 gate:** all three tabs work, cross-filter works, URL state survives refresh; build passes.

---

## Sprint 5 — Actions: Detail Sheet & HubSpot Push (5 tasks)

### S5-T1 · Prospect detail sheet
- **Goal:** Row click opens a side `Sheet` with the full record.
- **Files:** create `src/app/discovery/prospect-detail-sheet.tsx` (`'use client'`).
- **Pattern:** `src/components/ui/sheet`; lay out all six `scoreBreakdown`
  dimensions as labeled bars, plus address, discoveredVia, nearest Primo.
- **Done when:** clicking a table row opens the sheet with correct data.

### S5-T2 · Score-breakdown viz
- **Goal:** Visualize the 6 dimensions vs their max (25/25/25/10/5/10).
- **Files:** `prospect-detail-sheet.tsx`.
- **Pattern:** simple token-colored bars (`bg-[var(--primary)]` width %). No new deps.
- **Done when:** bars are proportional and labeled with raw/max values.

### S5-T3 · Server action: push one prospect to HubSpot
- **Goal:** A server action wrapping the existing push logic.
- **Files:** create `src/app/discovery/actions.ts` (`'use server'`).
- **Pattern:** reuse the client + dedup logic from
  `scripts/prospect-discovery/push-to-hubspot.ts` and `src/lib/hubspot/client.ts`
  (`withHubSpotRetry`). Search-by-domain-then-name before create.
- **Done when:** action upserts a single prospect; returns `{ ok, hubspotId? , skipped? }`.

### S5-T4 · Push button + optimistic state
- **Goal:** "Push to HubSpot" button in the detail sheet (and a row action).
- **Files:** `prospect-detail-sheet.tsx`, `prospects-table.tsx`.
- **Pattern:** the row-action composition in
  `src/components/accounts/account-row-actions.tsx`; `useTransition` for pending state.
- **Done when:** clicking pushes, shows pending → success/skip, disables on success.

### S5-T5 · Guard existing accounts
- **Goal:** Never push `isExistingAccount` rows; offer "Open in Accounts" instead.
- **Files:** `prospect-detail-sheet.tsx`.
- **Pattern:** conditional render keyed on `existingAccountSlug`.
- **Done when:** existing-account rows show a link, not a push button.

> **🚦 Sprint 5 gate:** detail sheet + breakdown viz complete; HubSpot push works against a dry-run/sandbox first; build passes.

---

## Sprint 6 — Polish, Tests & Ship (4 tasks)

### S6-T1 · Loading & error boundaries
- **Goal:** Route-level `loading.tsx` + `error.tsx`.
- **Files:** `src/app/discovery/loading.tsx`, `src/app/discovery/error.tsx`.
- **Pattern:** any existing route's loading/error files; reuse skeleton style.
- **Done when:** slow/failed loads degrade gracefully.

### S6-T2 · a11y + keyboard parity
- **Goal:** Table j/k nav, focus rings, aria labels match the rest of the app.
- **Files:** discovery components.
- **Pattern:** `DataTable` already ships j/k + focus outline — verify it works here;
  add `aria-label`s to the map and filter controls.
- **Done when:** keyboard-only flow works; no axe console violations.

### S6-T3 · Tests
- **Goal:** Cover the loader, filters, and the HubSpot action's dedup branch.
- **Files:** `src/lib/discovery/*.test.ts`, action test.
- **Pattern:** existing test files; mock the HubSpot client.
- **Done when:** `npm test` green; meaningful assertions, not smoke-only.

### S6-T4 · PR + ship
- **Goal:** Finalize on `claude/eloquent-knuth-DgOHV`, update PR #202.
- **Files:** none (git).
- **Pattern:** conventional commits; update the PR body's test plan with the new
  `/discovery` checklist. Confirm Vercel preview renders the route.
- **Done when:** CI green, Vercel preview shows `/discovery` live, PR description current.

> **🚦 Sprint 6 gate:** `npm run lint && npx tsc --noEmit && npm run build` all green; preview verified.

---

## Definition of Done (whole feature)
- `/discovery` is in the sidebar and command palette.
- Metrics, provenance, ranked table, satellite corridor map, and three tabs all work.
- Filters (tier + corridor + min-score + search) compose and persist in the URL.
- Detail sheet shows the full 6-dimension breakdown.
- Push-to-HubSpot works and refuses existing accounts.
- Zero console errors, no CLS on the map, lint/types/build/tests all green.
- PR #202 updated; Vercel preview verified.

## Sequencing rules
1. Strictly sequential **within** a sprint.
2. Do not cross a 🚦 gate with a red check.
3. Commit per task (or per tight pair) with a conventional message.
4. If a pattern file contradicts this plan, the **pattern file wins** — match the
   codebase, and note the deviation in the commit body.
