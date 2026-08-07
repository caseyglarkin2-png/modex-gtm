# YNS Live Demo — Sprint Plan

> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read `git log --since=7d`, the live system, and `plans/README.md`. Last verified 2026-08-06.


**Status:** Approved 2026-05-20
**Branch:** `feat/yns-demo` (off `feat/yard-audit-generator`)
**Companion plan:** `yns-microsite-redesign-sprint-plan.md` (the microsite memo — D-sprints embed into it, they do not replace it)

## North Star

A prospect lands on **any** entry point — microsite, /YNS hub, cold email, /demo/{slug} — and within 3 seconds sees **their own network**: real satellite tiles, real geofence rectangles overlaid in color, real archetype mix, real dock counts. Within 30 seconds they've watched a truck step through their real gate → drop yard → dock apron geometry, narrated as flowDRIVER / flowSPOTTER. Within 2 minutes they've shocked demand on a network slider and watched variance compound across their real plants.

The artifact is the proof: "we already mapped you. here. look."

## Architecture — one implementation, three surfaces

```
                                ┌────────────────────────────────────────┐
                                │   data substrate (already exists)      │
                                │   modex-gtm/output/yard-audits/        │
                                │   867 facility JSONs · 3,918 geofences │
                                └──────────────┬─────────────────────────┘
                                               │
                  ┌────────────────────────────▼────────────────────────────┐
                  │  D1: pack generator  →  /public/demo-packs/{slug}.json  │
                  │  + clawd account_research.json sidecar                  │
                  │  + per-site Static Maps satellite (cached tiles)        │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                  ┌────────────────────────────▼────────────────────────────┐
                  │   modex-gtm  /demo/[account]/page.tsx   (canonical)     │
                  │   Tier 1 atlas → Tier 2 replay → Tier 3 sim             │
                  └────────┬───────────────┬──────────────────────┬─────────┘
                           │               │                      │
                           ▼               ▼                      ▼
              yardflow.ai/demo/   yardflow.ai/YNS hub      microsite embed
              [slug]              "see live →" CTA         <DemoEmbed />
              (vercel rewrite,    (link)                   (in <Observation>)
              same as /for/)
```

**One route, three surfaces.** Same trick as M1.2: `flow-state-site` rewrites `yardflow.ai/demo/:path*` → `modex-gtm.vercel.app/demo/:path*`. The microsite at `yardflow.ai/for/{slug}` is the front door; it embeds the demo inline AND deep-links to the standalone for cold-paste.

## Data pack format

Contract frozen in **`src/lib/demo/pack-schema.ts`** (D0.4, this commit). Validated by **`tests/unit/demo-pack-schema.test.ts`**.

`/public/demo-packs/{slug}.json` — what every surface consumes:

```ts
{
  schemaVersion: '1',
  builtAt: '<iso>',
  account: { slug, displayName, archetype, siteCount, coverageNote },
  research: { /* clawd account_research.json — pillars, news, mandate */ } | null,
  network: {
    bbox: [w,s,e,n],
    archetypeMix: { '#1': n, '#3': n, ... },
    totals: { dockDoors, trailerCapacity, gates, railServed, acres },
    sites: [
      {
        id, name, type, archetype, archetypeName, confidence, uncertainFields,
        center: { lat, lng },
        geofences: { perimeter, truckGate, dropYards[], dockAprons[], staging },
        yardMetrics, classification,        // 22-field gate/dock classification
        scenario?,                          // D3 populates
        dossierExcerpt?, mapsUrl, tiles?
      }, …
    ]
  }
}
```

## Sprints

Each card uses the same acceptance contract as the M-sprints — `Task ID / Assertion / Demo / Commit boundary`.

### Sprint D0 — Housekeeping & contracts (½ day) — **in progress**

| ID | Task | Assertion | Status |
|---|---|---|---|
| D0.1 | Delete `output/yard-audits/mondelez - Copy/` stale snapshot | Folder gone | ✓ |
| D0.2 | Close stale UNFI `in_progress`/`pending` tasks → won't-fix-needs-internal-records | Task list mirrors RUN-STATUS.md | skipped (RUN-STATUS is the SoT) |
| D0.3 | Write this doc | File exists, references companion plan | ✓ (this file) |
| D0.4 | Freeze `DemoPack` contract — `src/lib/demo/pack-schema.ts` + 10 unit tests | `npm run test:unit -- demo-pack-schema` green | ✓ |

### Sprint D1 — Pack generator (1–2 days) — **CLOSED 2026-05-21**

**Goal:** Convert all 43 accounts into validated `DemoPack`s + pre-fetched satellite tiles + clawd research sidecars.

| ID | Task | Assertion | Status |
|---|---|---|---|
| D1.1 | `scripts/yard-audit/build-demo-pack.ts <slug>` reads roster + sites/*.json + dossier excerpts → emits `public/demo-packs/{slug}.json`, validated against `DemoPackSchema.parse` | One account pack ≤500KB; `parseDemoPack` clean | ✅ — 42 packs, 5–162 KB each, 4.1 MB total |
| D1.2 | `scripts/yard-audit/fetch-demo-tiles.ts <slug>` fetches z17 + z18 Static-Maps tiles per site → `public/demo-packs/tiles/{slug}/{id}-z{z}.jpg` + `_tiles.json` sidecar (reuses `probe.ts` env loader) | Tiles resolve in browser at correct URL | ✅ — 1,644 JPEGs across 42 accounts; sidecars wired into pack builder |
| D1.3 | `scripts/yard-audit/merge-clawd-research.ts <slug>` pulls per-account record from `clawd-control-plane/artifacts/yardflow/account_research.json` → pack `research` field; null when no record | Pack diff shows research keys for known slugs; unknown → `null` (no throw) | ✅ — fuzzy slug lookup picks richest record across duplicate keys (clawd has both `mondelez` rich + `mondelezinternational` sparse) |
| D1.4 | `scripts/yard-audit/build-all-packs.ts` runs D1.1+D1.2+D1.3 over all 43 accounts | All 43 packs + tiles present under `public/demo-packs/` | ✅ — 42/43 packs built (kraft-heinz failed: 27/27 site JSONs are Phase-0 stubs with no `geofences.perimeter`; designed-for case, surfaced cleanly) |
| D1.5 | `.vercelignore` + `.gitignore` audit — packs ship to Vercel, raw `output/yard-audits/sites/*.json` do not; tiles (484 MB) handled separately | Tiles excluded from git + vercel; pack JSONs ship | ✅ — gitignore excludes `public/demo-packs/tiles/`; vercelignore matches |

**D1 outcome — what's in the repo:**

- **42 demo packs** at `public/demo-packs/{micrositeSlug}.json` totaling 4.1 MB
- **822 audited sites · 43,516 dock doors · 121,280 trailer-parking capacity · 214 rail-served** — same totals as RUN-STATUS.md (867 facilities − 45 stubs filtered out: kraft-heinz 27 + unresolvable 18)
- **1,644 satellite JPEGs** at `public/demo-packs/tiles/{slug}/` — gitignored, regenerable via `npx tsx scripts/yard-audit/build-all-packs.ts --tiles`
- **`DemoPack` schema frozen** at `src/lib/demo/pack-schema.ts` with 13 unit tests covering all real-data shape variants

**Surfaced D2 work — tile hosting (locked: Vercel Blob):** Tiles total 484 MB; too heavy for the Vercel deploy bundle. D2 adds a `scripts/yard-audit/upload-tiles-to-blob.ts` step that pushes every tile to Vercel Blob and rewrites `Tile.url` in each pack to the returned blob URL. Storage cost is ~$0.07/mo for 484 MB at $0.15/GB; blobs are immutable, CDN-cached, no egress charge. Per-account dev workflow: build pack → upload tiles → re-stamp pack URLs → re-merge clawd. The single-vendor lock-in is acceptable since we're already deployed on Vercel.

**Real-data shape discoveries — schema updates already shipped:**

- `classification.entryLanes / exitLanes` made nullable (99 sites are offices / VACs without truck lanes)
- `yardMetrics.*` made nullable (brokerage outposts have no docks/trailers/gates)
- Band enums extended with `'NONE'` (offices, bulk mills with no dock doors)
- Stub sites (no `geofences.perimeter`) filtered from pack with `droppedStubCount` surfaced in coverage note
- `fieldNotes` coerced to string-only (3 round-2 sites had stray boolean values)

**Pack-builder behavior to remember when running again:**
1. Always run in order: `build-demo-pack.ts` → `merge-clawd-research.ts` → `fetch-demo-tiles.ts`
2. The builder overwrites the pack — research must be re-merged after every rebuild (orchestrator handles this)
3. Tiles cache by file presence — re-running is a no-op unless `--force` is passed

### Sprint D2 — Tier 1 Network Atlas + microsite embed (2–3 days)

**Goal:** Read-only demo proving we have the data. Real map, real polygons, archetype distribution, classification panel. **Lands on the Mondelez microsite as the new Observation visual.**

| ID | Task | Assertion | Commit |
|---|---|---|---|
| D2.1 | `src/app/demo/[account]/page.tsx` — server component, reads `/public/demo-packs/{slug}.json`, 404 if missing | `/demo/mondelez-international` SSRs network header + site count | route |
| D2.2 | `<NetworkAtlas pack={pack}/>` — Leaflet + free ESRI World Imagery tiles at network bbox, one marker per site, click→detail panel | All N sites visible on US map; clicking opens panel | component + tests |
| D2.3 | `<SiteDetailPanel site={...}/>` — satellite tile + **overlaid geofence rectangles** (perimeter blue, truckGate orange, dropYards green, dockApron purple, staging amber) + classification table + dossier excerpt | 5 polygon overlays at correct coords on tile; 12-px stroke + 18% fill opacity | component + visual test |
| D2.4 | `<ArchetypeMixChart pack={pack}/>` — donut linking each archetype to filtered map | Donut sums to siteCount; clicking #6 filters map to campus sites | component |
| D2.5 | `<CoverageHonesty pack={pack}/>` banner — "We've audited X of an estimated Y plants. The N not shown: …" | Banner appears when `coverageNote.capHit` or `auditedCount < estimatedFootprint`; suppressed otherwise | banner |
| D2.6 | OG image generator for `/demo/[account]` matching memo aesthetic — network bbox screenshot + site count | `<meta og:image>` resolves to 1200×630 with plant count | opengraph-image.tsx |
| D2.7 | Public access on `/demo/[account]` (drop middleware guard like M1.1) + `flow-state-site` vercel.json rewrite | Incognito `yardflow.ai/demo/mondelez-international` 200s + renders | middleware + flow-state-site |
| **D2.8** | **`<DemoEmbed tier="atlas"/>` swapped into the Mondelez microsite Observation section, replacing the static `mondelez-international-coverage-map.svg`** | Microsite shows live atlas inline at `/for/mondelez-international` | microsite content update |

**Demo at end of D2:** Send Mondelez prospect `yardflow.ai/demo/mondelez-international` OR `yardflow.ai/for/mondelez-international` — same atlas renders in both. Real 22 plants on a US map, click Richmond → see the satellite tile with 5 colored geofence polygons drawn over the real gate, drop yard, dock apron, staging. Archetype donut shows mix. **No simulation yet.**

### Sprint D3 — Tier 2 Driver Journey Replay (interactive site-level sim)

**Goal:** Watch a truck step through real geometry. Per-archetype canned scenarios play on real polygons.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| D3.1 | `src/lib/demo/scenarios.ts` — for each archetype #1–#10 define canonical step sequence; populates `Site.scenario` in pack builder | 10 scenario fns; each returns ordered `ScenarioStep[]` | lib + unit tests |
| D3.2 | `<DriverJourneyReplay site={...}/>` — animated truck dot polygon-to-polygon at right zoom; classification fields highlight as relevant; narration per step | One full replay < 30s, all polygons hit | component + e2e |
| D3.3 | "Without YNS / With YNS" toggle — same scenario, with-YNS = shorter waits, fewer steps; derived from archetype baseline/yns wait fields | Toggle visibly changes step count + total; numbers tie to yardMetrics | component |
| D3.4 | Per-site share URL `/demo/[account]?site={id}&play=1` | Cold link auto-plays correct site | router param |
| D3.5 | "See live →" CTA on every microsite Observation section linking to `/demo/[account]?site={topArchetypeSite}` | All 43 microsites; link resolves | template + per-account |

**Demo at end of D3:** Microsite reader clicks "see this run on your Richmond bakery →", lands on replay, watches truck stuck at gate then re-run with flowDRIVER. They get it.

### Sprint D4 — Tier 3 Network Simulator (the "demand-shock" port)

**Goal:** Port `public/YNS/assets/future-state-reference/yns-network/` Figma prototype to real data. All N facilities, throughput modeled from `yardMetrics` + archetype, demand-shock slider compounds variance.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| D4.1 | `src/lib/demo/network-sim.ts` — deterministic sim: `baselineThroughput = dockDoors × shifts × turnsPerDoor(archetype)`; variance multiplier from classification (gateBackup, multipleFacilities, fastLaneOpp); demand-shock = +X% inbound | Pure-function model; 100 unit tests covering archetypes + edges | model + tests |
| D4.2 | `<NetworkSimulator pack={pack}/>` — all sites on bbox map pulsing at throughput rate; slider 0–200% demand; map colors red where variance compounds | Slider deterministically shifts site colors; total throughput readout updates | component |
| D4.3 | "Drop YNS in" toggle (network-wide) — re-runs sim with archetype-specific YNS uplift; deltas overlaid per site | Toggle produces visible network-wide swing; total delta annotated | component |
| D4.4 | Scenario presets per account ("Q4 peak", "demand shock", "carrier cuts", "weather") | 4 preset chips per account; each loads in one click | preset config |
| D4.5 | Sim accuracy disclaimer footer — anti-selling tone, "modeled from public data, ranges not point estimates" | Footer present, ties to methodology footnotes | component |

**Demo at end of D4:** Prospect runs Q4-peak shock on their 22-plant network, sees Tatamy + Aurora go red while Richmond holds, toggles YNS and the red flips. Reaches for the CFO.

### Sprint D5 — Embed & distribution

**Goal:** Demo everywhere — microsite, /YNS hub, cold email, /roi/ handoff, share OG cards.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| D5.1 | `<DemoEmbed account slug tier/>` — single component, iframe-friendly, drops into any modex-gtm page | Embed renders standalone on a test route | component |
| D5.2 | Microsites get `<DemoEmbed tier="atlas"/>` in Observation across all 43 accounts (extends D2.8 to non-Mondelez) | All accounts with packs show live atlas inline; accounts without packs render static SVG (graceful fallback) | per-account |
| D5.3 | `yardflow.ai/YNS` hub gets "see live on a real network →" hero CTA → defaults to Mondelez demo + "or enter your company:" → slug match → redirect | yardflow.ai/YNS includes new CTA + lookup | flow-state-site |
| D5.4 | `/roi/` calculator deep-link pre-fills archetype mix **from the demo pack** | `/roi/?from=demo&account=mondelez-international` lands on pre-filled calc | flow-state-site |
| D5.5 | Cold email template variant: "I mapped your 22 plants — see them →" + deep link + OG preview | One send shows correct OG card in Gmail | templates.ts |

### Sprint D6 — Coverage backfill (optional, hero accounts only)

**Goal:** Expand past the 30-site cap for accounts we'll demo first.

| ID | Task | Assertion | Commit |
|---|---|---|---|
| D6.1 | `scripts/yard-audit/extract-facilities.ts --cap=0 the-home-depot` — re-run roster discovery without 30-cap; diff vs existing | Diff shows ~40 missing HD RDCs/SDCs/MDOs | one expansion commit |
| D6.2 | Deep-audit the diff (subagent batch like original run) | New sites have JSON + dossier; CSV regenerated; pack rebuilt | per-account commit |
| D6.3 | Repeat for FedEx + UNFI + 1–2 others as narrative needs | RUN-STATUS.md updated | as needed |

## Critical path

```
D0 → D1 → D2 → D5.2 (embed rollout) → D3 → D5.{1,3,4,5} → D4 → D6
       ╰──── shippable as Tier 1 here ────╯
                              ╰─── shippable as Tier 2 here ───╯
                                                          ╰── Tier 3 ──╯
```

Each tier is independently shippable. Shipping D0–D2 alone gets the Mondelez microsite a live atlas and the demo URL.

## Risk register

| Risk | Mitigation |
|---|---|
| Geofence polygons look bad on busy tiles | D2.3 — 12-px stroke + 18% fill opacity verified on 5 sample sites before merge |
| Google Static Maps quota over 867 sites | D1.2 caches; one-time fetch; fall back to OSM/ESRI free if hit |
| 30-site cap embarrasses on HD / FedEx | D2.5 honesty banner + D6 backfill for hero accounts |
| Sim overclaims in D4 | D4.5 disclaimer; all numbers tied to yardMetrics + archetype |
| Cross-repo rewrite regresses /for/ | D2.7 includes Playwright spec asserting both `/for/` AND `/demo/` resolve on yardflow.ai post-deploy |

## What ships first

D0 + D1 + D2 against Mondelez. 2–3 days work. Result: `yardflow.ai/demo/mondelez-international` is live, the Vision 2030 microsite gets the atlas embed (D2.8), demo URL exists for any Mondelez conversation. Then D3 vs D4 prioritization based on Mondelez team reaction.
