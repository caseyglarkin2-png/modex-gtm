# Oriented Geofences + Driver's-Eye Street View — Design

**Date:** 2026-05-31
**Status:** Approved direction, pending architecture pressure-test + user review
**Repos:** `modex-gtm` (pipeline + microsites), `Flow-State-` (hub/proxy)

## Problem

The yard geofences on the demo microsites render **crooked** because every zone
(property line, truck gate, drop yards, dock aprons, staging) is stored as an
**axis-aligned bbox** `{south, west, north, east}`. Real yards are rarely
square-to-north, so the boxes visibly miss the true footprint. We want
**true oriented polygons**, standardized across all 43 accounts, plus a
**ground-level Street View** perspective to make each microsite premium.

## What we already have (leverage, do not rebuild)

The geomap came from the **`scripts/yard-audit/` subagent pipeline**, run COMPLETE:
43 accounts, 867 facilities, 3,918 geofence features, dossiers, master workbook,
GeoJSON. The pieces:

- `deep-audit-prompt.md` — per-facility audit instructions. **Currently emits
  geofences as bboxes** (line ~52: "Boxes are `{south, west, north, east}`").
- `probe.ts` — fetches Maps Static **and Street View** imagery (`sv` subcommand
  already exists). Uses env `GOOGLE_MAPS_STATIC_API_KEY`.
- `schema.json` — audit output schema.
- `roster.json` per account — geocoded facility list (the input; **done**).
- `build-demo-pack.ts` — assembles `sites/NN-*.json` + roster → the pack JSON
  in `public/demo-packs/<slug>.json`, validated by `DemoPackSchema`.
- `build-geojson.ts`, `build-geofence-links.ts` — regenerate Drive artifacts.

Phase 1 (already shipped on `yns/geofence-v2`): schema v2 `GeoShape = Bbox |
GeoPolygon{ring}` union + polygon rendering (`<Polygon>` not `<Rectangle>`).
Sprint A (already shipped): truck-replay promoted to a "Watch the run" tab.

## Infrastructure status (verified 2026-05-31)

**No billing blocker.** Project `arched-elixir-487618-a6` ("Clawdbot"):
`billingEnabled: true`; Maps Static / Street View / Geocoding all enabled.
Server key "YardFlow Maps server key" live-tested against all three endpoints —
all `HTTP 200` with real imagery; Street View metadata `status: OK`. Key wired
into Vercel `modex-gtm` env (`GOOGLE_MAPS_STATIC_API_KEY`, Production +
Development). Earlier "billing suspended" theory was wrong and is retracted.

## The change — three edits + one re-run

### 0. Street View image proxy (new route)
No Street View / image-proxy route exists in `src/`. Create
`src/app/api/demo/streetview/route.ts` — `GET ?pano=&heading=` proxies the
Street View Static endpoint with the **server-side** key, streams `image/jpeg`,
`Cache-Control: public, max-age=86400`. A `ZoneStreetViewPanel` component renders
`<img src="/api/demo/streetview?...">` inside `SiteDetailPanel`, gated on
`hasCoverage === true`. Zone selection state lives in `SiteDetailPanel`.

### 1. `deep-audit-prompt.md`: bboxes → confirm-or-improve oriented polygons
For each zone, the agent **compares the existing bbox against fresh imagery**:
- If the bbox already tightly matches the real footprint → **confirm it** (a tight
  rectangle is just a 4-vertex ring; no churn).
- If crooked or loose → **trace the true oriented ring** (ordered `{lat,lng}`
  vertices following the real fence/edge).
- Additionally capture, per zone: the **best Street View heading** pointed at
  that feature, and whether **usable pano coverage exists** (from the metadata
  endpoint).
The rest of the 22-field rubric stays **open** — agents may improve any field
they have a better read on. Not a forced rebuild.

### 2. `pack-schema.ts`: add optional per-zone `streetViewMeta` to SiteGeofences
**Correction (architecture review):** the audit output is NOT validated by
`scripts/yard-audit/schema.json` — that file is a **CSV column manifest** for
`generate-csv.ts`. The real contract is `RawSiteJson` in `build-demo-pack.ts`
+ `DemoPackSchema` in `src/lib/demo/pack-schema.ts`. Polygon support already
exists there (`GeoShape = Bbox | GeoPolygon{ring}`); no change needed for
geometry.

The Street View metadata must **not** be embedded in `GeoShape` (it would break
the geometry union + `geofence-geometry.ts`). Add an **optional `streetViewMeta`
block on `SiteGeofences`**, keyed by zone, so all existing packs keep validating:

```ts
const ZoneStreetView = z.object({
  heading: z.number().gte(0).lt(360),
  pano: z.string().min(1),       // Google pano_id
  hasCoverage: z.boolean(),
}).optional();

// inside SiteGeofences:
streetViewMeta: z.object({
  perimeter: ZoneStreetView,
  truckGate: ZoneStreetView,
  dropYards: z.array(ZoneStreetView).optional(),
  dockAprons: z.array(ZoneStreetView).optional(),
  staging: ZoneStreetView,
}).optional(),
```

Bump `schemaVersion` `'1'` → `'2'` so consumers can distinguish polygon+SV packs.

### 3. `build-demo-pack.ts`: fix the bbox-only assumptions (HARD BLOCKER)
Three concrete fixes — without these the build **crashes** on polygon perimeters:

- **`expandBbox` (line ~355) is a hard blocker.** It reads `.west/.south/.east/
  .north` off `s.geofences.perimeter`; a `{ring}` makes the network bbox `NaN`
  and `DemoPackSchema.parse()` throws. Replace with an `expandShape` that uses
  `shapeBounds()` from `geofence-geometry.ts`.
- **`RawSiteJson` geofence fields (lines ~126-142) are typed `Bbox`-only** →
  `tsc` fails on Vercel once sites JSON carries polygons. Retype to `GeoShape`
  and add `streetViewMeta?`.
- **Thread `streetViewMeta`** through the geofences assembly (lines ~265-271),
  spreading it only when present. Keep the `perimeter` presence check.

### 4. Re-run the subagent audit (confirm-or-improve) over existing rosters
Same orchestration as the original run (subagent per idx-range), reading imagery
via `probe.ts`. Inputs (rosters) are done. Then regenerate packs
(`build-demo-pack.ts`) and Drive artifacts (`build-geojson.ts`,
`build-geofence-links.ts`) so workbook/GeoJSON stay congruent.

## Street View UX — anchored to the map, not a standalone gallery

Two perspectives of the **same spot**:
- **Top-down:** the oriented geofence polygon (where each zone is).
- **Ground-level:** what a driver sees pulling into that zone.

Interaction:
- Click a zone chip → polygon highlights on the satellite map **and** a
  ground-level panel swaps to that zone's Street View heading + one-line
  narrative ("Truck gate — drivers check in here").
- A **"Driver's-eye walkthrough"** toggle steps through zones in **load-flow
  order** (gate → guard → dock apron → drop yard → exit) — the narrated
  slideshow, synced to the map; the truck-replay is the motion layer.

**Graceful degradation:** coverage is recorded per zone at build time
(metadata endpoint). The walkthrough only shows zones with a usable pano —
no broken images. Sites/zones without coverage simply omit the ground-level
panel and keep the map.

Images are **server-fetched** (key stays server-side; never exposed to client).

## Data flow

```
roster.json (done) ─┐
                    ├─► [subagent audit, confirm-or-improve] ─► sites/NN-*.json
deep-audit-prompt ──┘        (polygons + per-zone streetView)        │
        (Maps Static + Street View via probe.ts)                     ▼
                                              build-demo-pack.ts ─► public/demo-packs/<slug>.json
                                                                     │
                                       build-geojson / -geofence-links (Drive artifacts)
                                                                     ▼
                              microsite: oriented <Polygon> + zone-anchored Street View walkthrough
```

## The annotation tool (Sprint B) — demoted to QA layer

`/ops/geofence-editor` + `geofence-save` route stay as an **optional human-QA /
spot-fix** layer for perfecting auto-traced anchors. Not the primary capture.
The OSM/building-footprint idea is **dropped** (redundant with audit imagery).

## Build / merge order (from architecture review)

All on `yns/geofence-v2`:
1. `pack-schema.ts`: add `ZoneStreetView` + optional `streetViewMeta`; bump
   `schemaVersion` → `'2'`. Verify existing packs still parse.
2. `build-demo-pack.ts`: retype `RawSiteJson` geofences → `GeoShape` (+ optional
   `streetViewMeta`); replace `expandBbox` → `expandShape` (`shapeBounds`);
   thread `streetViewMeta`.
3. `deep-audit-prompt.md`: confirm-or-improve polygon instruction + per-zone
   `streetViewMeta` capture + updated JSON template.
4. **2–3 account pilot** → regenerate packs with fixed builder → Vercel preview
   verify (chromium + bypass): polygons render oriented, `streetViewMeta`
   populated.
5. `src/app/api/demo/streetview/route.ts` image proxy.
6. `ZoneStreetViewPanel` wired into `SiteDetailPanel`.
7. **Full 43 re-run** → regenerate all packs + Drive artifacts → preview verify.
8. Merge to prod → click-test live links.

**Live-site safeguard:** never commit regenerated polygon packs to a branch
whose deployed code lacks the `expandShape` fix (step 2). `streetViewMeta` is
optional, so old packs + new code is always safe; the only unsafe direction is
new packs + old `expandBbox`. Keep the code fix ahead of any pack regeneration
on the same branch.

Do not fabricate `audits_completed_this_quarter`.

## Open items

- Provide `audits_completed_this_quarter` (real number) for the provenance stamp.
- Vercel **preview** env var for the maps key (CLI quirk blocked it; prod+dev set).
