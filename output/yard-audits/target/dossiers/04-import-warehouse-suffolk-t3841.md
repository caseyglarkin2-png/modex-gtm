# Deep-Audit Dossier — Target Import Warehouse Suffolk (T3841)

- **Facility:** Target Upstream / Import Distribution Center #T3841
- **Address:** 300 Manning Bridge Rd, Suffolk, VA 23434
- **Resolved center:** 36.70680, -76.66330
- **Method:** deep-audit (satellite + Street View + web)
- **Final confidence:** medium

## 1. Location confirmation
The geocoded point (36.707537, -76.665095) landed on the roof of an enormous
single-building warehouse in the Suffolk industrial corridor. Web search
confirmed the facility identity: **Target Upstream Distributor Center #T3841,
300 Manning Bridge Rd, Suffolk VA 23434** (Hampton Roads Chamber directory,
Target careers T3841 listings, Waze/TruckMap "Target Import Distribution
Center" place). The building footprint (~1.0-1.05M sq ft, ~24 ac) and the very
large NE trailer drop yard are fully consistent with a Target upstream import
DC. The supplied coordinates were essentially correct (on the building); I
re-centered to the building/yard centroid at 36.70680, -76.66330.

No neighboring-building mix-up: the adjacent large warehouses to the W/NW
(separate buildings across Manning Bridge Rd and a service road) are distinct
properties and were excluded.

## 2. Site layout (what the key views showed)
- **Overall (z15-z16):** One massive warehouse, long axis NW-SE, ~1,050 m x
  ~215 m. Office/employee-parking and retention ponds on the SW face; the
  entire truck operation (dock apron + drop yard) on the NE face. A perimeter
  loop road encircles the building. Surroundings: woods and farmland with a
  small residential pocket to the E — edge-of-town **Rural** setting.
- **NE face (z18-z20):** Continuous dock apron with dock-leveler rhythm and
  trailers backed into doors along the full ~1 km face, then a wide internal
  drive, then a large marked **drop yard** of parked trailers in multiple rows.
  A paved laydown/maintenance area (pallets/equipment) sits inside the yard
  near the N end.
- **North end (z19):** A stormwater detention structure (twin circular ponds +
  control box) — explicitly NOT a guard booth — with the perimeter road
  wrapping around.
- **NW entrance (z19-z20):** The private access road tees off Manning Bridge Rd
  and feeds the perimeter loop at the building's NW corner. A few trucks were
  parked on the access-road shoulder. The driveway pinches to a single throat.

## 3. Gate / guard-shack / remote determinations
- **truckGate = true.** Single private access road off the public Manning
  Bridge Rd into a tree-lined / fenced property with one entrance throat and a
  continuous perimeter loop. Street View has **no coverage on the private
  drive** (panos snap back to Manning Bridge Rd at 36.7107,-76.6677; the road
  east is residential), so the barrier arm itself is not directly imaged — but
  a Target upstream import DC of this scale is access-controlled, and the
  single-throat geometry supports a controlled gate.
- **guardShack = false.** No 1-3-car booth structure is visible at the entrance
  throat or anywhere on the perimeter across z18-z20. The only small structures
  are the N-end stormwater control and the in-yard laydown pad — neither a
  gatehouse.
- **remoteGs = true.** Gate present, no guard shack imaged → kiosk / appointment
  / app check-in implied (standard for modern Target upstream DCs). Flagged
  uncertain.

## 4. Yard zones & counts (from overhead imagery)
- **dockDoorCount ≈ 120** → band **50+**. Dock-leveler rhythm + trailers backed
  in along essentially the full NE face.
- **dropArea** trailer drop yard on the NE, many rows, capacity into the
  hundreds → band **50+**; `dropYard = true`. Trailers visible ~160;
  capacity ~250.
- **postGateStaging = true** — wide apron + internal laydown give inside-gate
  holding before docks. `preGateStaging = false`.
- **drivewayLong = true** — long approach from gate to docks holds 3+ trucks.
- **fastLaneOpportunity = true** — very wide gate apron / perimeter width.
- **entryExitTogether = true** (single shared gate); entry/exit lanes assumed
  1/1, not resolvable from overhead → uncertain.
- **shipRcvSeparate = false**, **multipleFacilities = false** (one building),
  **scale = false** (no scale pad seen, low confidence), **multiStep = false**,
  **railServed = false** (no spur).
- **siteAreaAcres ≈ 74.6** (shoelace from perimeter ring; building ~24 ac).

## 5. Geofences
- **perimeter** — 8-vertex oriented ring tracing the fenced property at its
  true NW-SE angle (building + NE drop yard + SW parking/ponds).
- **truckGate** — quad over the NW entrance throat / driveway tee.
- **dropYards[0]** — rotated quad over the NE trailer drop yard, parallel to the
  building face.
- **dockAprons[0]** — long thin rotated quad hugging the NE dock wall.
- **streetViewMeta** — perimeter & truckGate both reference the nearest public
  pano on Manning Bridge Rd (pano `TqG0JuES9NOxZ2DmH18gjg`, 2023-03), headings
  141° / 102° aimed toward the property.

## 6. Web findings
- Hampton Roads Chamber / Target careers confirm T3841 = Target Upstream
  Distributor Center, 300 Manning Bridge Rd, Suffolk VA 23434; phone
  757-923-7400; operates 24/7. Employee reviews are general (pay/schedule);
  no trucker-specific gate/check-in detail was found.

## 7. Confidence
**Medium.** Facility identity, layout, dock band, drop yard, and rural setting
are high-confidence from clear satellite. The gate-control specifics
(guard shack vs. remote kiosk, lane counts, scale) are inferred because the
private access road has no Street View coverage — these are flagged in
`uncertainFields`.

### Source links
- https://business.hrchamber.com/member-directory/Details/target-upstream-distributor-ctr-t3841-3589950
- https://corporate.target.com/jobs/w02/82/seasonal-full-time-hourly-warehouse-operations-openings-t3841
- https://truckmap.com/place/target-import-distribution-center-300-manning-bridge-rd-suffolk-va-23434-usa/local_map
