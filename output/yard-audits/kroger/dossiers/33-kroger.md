# Deep-Audit Dossier — Compton Creamery (Kroger Manufacturing) — idx 33

**Facility:** Compton Creamery / Kroger Manufacturing (Ralph's dairy brand)
**Type:** Dairy Plant
**Address:** 2201 S Wilmington Ave, Compton, CA 90220
**Resolved center:** 33.87098, -118.23868
**Confidence:** High

## Step 0 — Location confirmation
Supplied coords (33.871152, -118.239871) landed directly on a large industrial
plant complex in Compton's industrial district, just south of CA-91. Web search
confirmed 2201 S Wilmington Ave = **Kroger Manufacturing — Compton Creamery**
(a dairy/creamery plant under the Ralph's banner), APN 7319-034-026. This is the
manufacturing creamery, distinct from the nearby Ralphs grocery DC. The
identifying tell on satellite: a circular **dairy silo / tank farm** on the
plant's west-center (z18), characteristic of a fluid-milk processing plant —
not a plain grocery DC. Building cluster, trailer drop yard, and silos all
consistent with a dairy plant. Center locked to the plant centroid.

## Steps 1–3 — Imagery findings
- **Wide (z16/z17):** A ~31-acre grid-aligned campus bounded by CA-91 + a
  frontage road and employee parking to the **north**, an E-W cross street to
  the **south**, a street west of the silos to the **west**, and **Wilmington
  Ave** to the **east**. Multiple white-roof plant/warehouse buildings, the
  dairy tank farm, and a large trailer drop yard.
- **Truck entrance (Street View, 2025-07, pano 8vfi1tHcUw6Ak3JX03h1GA):** Off
  Wilmington Ave on the east side. Chain-link perimeter fencing with sliding
  gates at the driveway mouth; the driveway runs west to an internal checkpoint.
- **Gate / guard shack (z21):** A small white booth (~1–2 vehicle footprint) on
  a paved island mid-yard, with a **shade canopy** over the inbound lane and
  **multiple painted STOP bars** on both inbound and outbound sides. Lane islands
  and bollards separate the lanes. This is a staffed guarded checkpoint —
  `truckGate: true`, `guardShack: true`, `remoteGs: false`.
- **Docks:** Heavy. Trailer-backed dock banks on multiple building faces — a
  long south-wall dock line plus separate trailer-backed banks along the
  north/interior buildings. Counted bands put `dockDoors: 50+`. Distinct dock
  clusters on different faces → `shipRcvSeparate: true`.
- **Drop yard:** Large dedicated trailer-storage lot east of the plant, dense
  rows of parked trailers without tractors → `dropYard: true`, `dropArea: 50+`.

## Yard zones & counts (honest overhead estimates)
- `perimeter` — 7-vertex ring tracing the fenced campus, ~**31.0 acres**.
- `truckGate` — quad over the guard-booth checkpoint island + STOP lanes.
- `dropYards` — the east trailer drop lot.
- `dockAprons` — south-wall dock apron + a north interior dock apron.
- `staging` — pre-gate apron between Wilmington Ave and the internal booth.
- dockDoorCount ≈ 55 (est, flagged), trailersVisible ≈ 120,
  trailerParkingCapacity ≈ 140, truckGateCount 1, buildingCount 4,
  railServed false (no spur enters the property).

## Web findings
Listed as Kroger Manufacturing — Compton Creamery / "Kroger Compton Creamery
(Ralph's)" in dairy-plant directories (Dairy Foods USA dairy-plants list);
LoopNet parcel 2201 S Wilmington Ave, APN 7319-034-026. Operating as a Ralph's
dairy processing plant; the adjacent Ralphs grocery distribution center is a
separate property.

## Classification rationale (highlights)
- Guarded gate set back from Wilmington with a deep approach → `drivewayLong`,
  `postGateStaging`, `preGateStaging` (apron outside the internal booth).
- Wide island-separated multi-lane gate apron → `fastLaneOpportunity: true`.
- Entry/exit through the same Wilmington point → `entryExitTogether`.
- Dense urban LA industrial fabric → `urbanRural: Urban`,
  `connectivityIssue: false`.
- 4+ building campus → `multipleFacilities: true`.
- No truck scale clearly visible → `scale: false` (flagged uncertain).

**Confidence: high.** Gate, guard shack, dock heaviness, and drop yard all
directly visible. Uncertain: exact dock-door count, trailer capacity, presence
of a scale.
