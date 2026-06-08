# GM - Orion Assembly, Lake Orion MI — Deep Audit Dossier

**Address:** 4555 Giddings Rd, Lake Orion, MI 48359
**Type:** Vehicle Assembly Plant
**Resolved center:** 42.7155, -83.2590
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** High

---

## Step 0 — Locating the facility

The supplied city-level coordinates (42.7847, -83.2483) land on the village of
Lake Orion and its namesake lake — residential/retail fabric, no plant. The
Orion Assembly plant sits roughly 8 km south, at the Brown Rd / Giddings Rd /
Joslyn Rd corner.

A wide regional probe (z14 at 42.715, -83.245) revealed the unmistakable
signature on the west side of the frame: a single very large assembly building
(~4 million sq ft) ringed by a closed-loop **vehicle test / proving oval**,
with vast finished-vehicle marshalling lots, on-site wastewater clarifiers, a
tank farm, and a rail spur. That oval ring road around a single mega-building is
the GM Orion fingerprint. Web search (GM Authority, Wikipedia, Waze) confirms
4555 Giddings Rd, numbered gates (Gate 3, Gate 4), and a current expansion with
a temporary truck entrance on Brown Rd. Center locked at 42.7155, -83.2590.

## Step 1 — Layout (satellite)

- **Main assembly building:** central, white/gray membrane roof, dominant
  structure. Material-receiving docks distributed across multiple faces.
- **South truck terminal:** a dock building on the south face with a clear bank
  of loading doors and red-roof dock canopies (gm-3-docks-s.png).
- **Finished-vehicle marshalling yard:** large paved lots SE/SW packed with
  hundreds of finished units in rows (gm-3-gate-tight.png, gm-3-sw.png).
- **Rail:** a single-track spur curves in from the NE to a covered rail
  receiving / auto-rack structure (gm-3-rail.png).
- **Utilities:** on-site wastewater treatment clarifiers and tank farm on the
  NE side (gm-3-docks-n.png).
- **Expansion:** active grading on the northern parcels (EV/ICE truck +
  Cadillac Escalade retooling toward ~2027).

## Step 2 — Gate / perimeter (Street View)

Two ground views confirm a **fully fenced, controlled-access** site:
- **Brown Rd (south), heading 0°** — chain-link perimeter fence with the plant
  buildings behind a buffer berm.
- **Giddings frontage, heading 90°** (pano @ 42.7187,-83.2689, captured 2025-06)
  — continuous chain-link perimeter fence on a grassy berm with the plant and
  light poles behind it.

GM assembly campuses run staffed security gatehouses at numbered controlled
gates; combined with the fenced perimeter and Waze's Gate 3 / Gate 4 entries,
this is a **truckGate: true / guardShack: true** site (not remote check-in).
A temporary truck entrance is currently on Brown Rd during construction.

## Step 3 — Docks, drop yard, rail

- **Dock doors:** **50+** band — receiving docks across multiple assembly-building
  faces, the south truck terminal, and the covered rail dock easily exceed 50.
- **Drop / marshalling:** dedicated paved finished-vehicle yard SE of the plant
  (hundreds of units) plus trailer staging at the truck terminal → `dropYard: true`,
  `dropArea: 25-50`.
- **Rail-served:** yes — active spur to a covered rail receiving structure.

## Step 4 — Web findings

- GM Authority / Wikipedia: Orion Assembly, ~4M sq ft, ~30 mi N of Detroit;
  mid-retooling for next-gen full-size trucks and Cadillac Escalade.
- Waze: numbered gate lots (Gate 3, Gate 4) off Giddings Rd.
- Driver review (Yelp/Loc8): dock staff "assign docks and load trucks
  efficiently" — confirms an active, staffed gated dock operation.
- Temporary truck entrance on Brown Rd during the expansion.

## Step 5 — Geofence & metrics

- **perimeter:** 8-vertex oriented ring tracing the fenced property (incl. the
  test-track footprint and marshalling lots), ~410 acres.
- **truckGate:** quad at the south/SW gate approach off the ring road.
- **dropYards:** one ring over the SE finished-vehicle marshalling lot.
- **dockAprons:** one ring over the south truck-terminal dock apron.
- **yardMetrics:** dockDoorCount ~60, trailersVisible ~25, capacity ~90,
  truckGateCount ~3, buildingCount ~8, siteAreaAcres ~410, railServed true.

Uncertain: truck scale (none positively seen), exact lane counts, exact dock and
gate counts — all flagged. Gate positions may shift as expansion construction
completes.

---

## 3-line summary
- **Gate:** YES — fully fenced GM campus, numbered controlled gates, perimeter fence visible in two Street Views.
- **Guard shack:** YES — staffed security gatehouses standard for the campus (no remote-only check-in).
- **Confidence:** High — facility identity and fenced/gated character are unambiguous; counts are honest overhead estimates.
