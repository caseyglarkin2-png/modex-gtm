# Deep-Audit Dossier — Publix Distribution Campus, Dacula GA (Atlanta)

- **idx:** 9
- **Facility:** Publix Distribution Campus Dacula GA (Atlanta) — Distribution Campus
- **Address:** 445 Hurricane Trl, Dacula, GA 30019 (Gwinnett County, Atlanta metro)
- **Resolved center:** 33.99080, -83.92950
- **Method:** deep-audit (satellite probe + Street View + web)
- **Confidence:** high (gate/booth specifics medium)

## Step 0 — Locating and confirming the facility
The supplied coordinates (33.990323, -83.927194) landed on the east dock edge of
a very large distribution complex — correct property, but not centered. Satellite
sweep (z14 -> z21) confirmed a major multi-building grocery distribution campus
matching the facility type. Web search corroborated: 445 Hurricane Trail is the
**Publix-Atlanta Warehouse**, a 24/7 receiving DC plus an on-site Atlanta Dairy
processing plant (AJC reported a 41,625 sq ft dairy production expansion). A
TruckersReport driver thread confirmed it as a large appointment-based DC with a
"huge bullpen for overnight parking." Locked center on the main DC building at
33.99080, -83.92950.

## Site layout (what the imagery showed)
- **Main DC building** (large grey/white roof, west-center) — long axis running
  NNW->SSE, rotated ~15-20° clockwise from north. Continuous dock-door banks with
  trailers backed in on **both** long faces (west and east).
- **Dairy / processing complex** (tan roofs, center-right) — connected secondary
  buildings with their own dock activity.
- **South warehouse** (white roof, SE corner) — additional building.
- **Maintenance/utility building** (small, SW) beside the drop yards.
- **Drop yards / "bullpen":** extensive — a large SW gravel lot packed with
  angled trailer rows, plus west and north paved trailer lots. One z19 frame of a
  single SW lot showed dozens of parked trailers in rows.
- **Employee parking:** NW and around the campus.
- **Setting:** dense suburban Atlanta metro — subdivisions, a county rec complex
  (ballfields) to the north, Sugarloaf Pkwy and retail nearby -> **Urban**.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** The entire industrial property is chain-link fenced
  (confirmed directly in Street View along the south frontage: continuous fence +
  tree buffer with the building behind it). Truck traffic funnels through a single
  **SW campus access drive** (Hurricane Trl spur off the Sugarloaf Pkwy
  interchange). The rest of the perimeter is fence and woods, so this is a
  controlled single point of entry.
- **Guard shack — FALSE (medium confidence).** No standalone guard booth was
  positively identified at the entrance drive in satellite, and the entrance is
  set well back behind a wooded buffer with **no Street View coverage on the
  internal access road** (metadata returned ZERO_RESULTS at the gate and at the
  SW public-road junction). Classified `guardShack: false` / `remoteGs: true`
  (gate present, no visible booth -> kiosk/app/call-box check-in), but both flags
  are listed in `uncertainFields` — this is the one area imagery could not close.
- **Driveway depth — LONG.** The approach from the public road up the SW drive
  into the secured yard easily holds a queue of 3+ trucks. Not backup-sensitive:
  the gate is set back with abundant internal stacking room, so a queue would not
  spill onto the public road.
- **Staging — pre and post.** Confirmed overnight "bullpen" parking outside the
  secured yard (driver forum) and wide internal staging lanes/artery between the
  drop yards and the dock faces.
- **Docks — 50+.** Continuous dock-door banks on both faces of the main DC plus
  the dairy/processing and south buildings; trailers backed in across all faces
  (z18/z19). Estimated ~140 doors total (low precision on exact count).
- **Drop area — 50+.** SW gravel bullpen + west/north lots hold well over 100
  parked trailers.
- **Ship/receive separate — TRUE.** Distinct dock banks on physically separate
  building faces / separate buildings (dry DC vs dairy/processing complex).
- **Fast-lane opportunity — TRUE.** Wide access-drive apron and large paved yard
  give ample room to add an express/bypass lane.
- **Multiple facilities — TRUE.** Campus of 4+ distinct structures.
- **Scale — FALSE (uncertain).** No weigh pad positively identified.
- **Rail — FALSE.** No spur enters the property.

## Yard zones traced (oriented polygons)
- **perimeter** — 6-vertex ring around the fenced industrial campus (excludes the
  rec fields/woods to the north); **~136.1 acres**.
- **truckGate** — rotated quad on the SW access drive (the single controlled entry).
- **dropYards** — (1) SW gravel bullpen, (2) west/north trailer lot; both quads
  aligned to the trailer rows.
- **dockAprons** — two long thin quads hugging the west and east dock faces of the
  main DC at the building's true ~15-20° angle.
- **staging** — internal post-gate staging quad between the drop yard and docks.

## yardMetrics
- dockDoorCount: ~140 (50+ band)
- trailersVisible: ~360
- trailerParkingCapacity: ~420
- truckGateCount: 1
- buildingCount: 4
- siteAreaAcres: 136.1
- railServed: false

## Street View
- **perimeter:** pano `j2motd7Pj5uOlEf6_Rthxg` (captured 2025-12) on the south
  frontage road, heading **347°** toward the campus — shows the perimeter fence,
  tree buffer, and the main building behind it (the closest available driver's-eye
  frame).
- **truckGate:** no Street View coverage on the internal SW access drive
  (ZERO_RESULTS) -> `hasCoverage: false`.

## Web findings
- 445 Hurricane Trl = Publix-Atlanta Warehouse, 24/7 receiving, appointment-based;
  on-site Atlanta Dairy processing plant (AJC: ~$/41,625 sq ft dairy expansion,
  44 new jobs). Driver reports: 1-3 hr typical unload, large overnight bullpen,
  on-site amenities. Sources: Yelp, TruckMap, AJC, TruckersReport.

## Final confidence
**High** on layout, perimeter, docks, drop yards, campus, urban setting, and the
presence of a fenced controlled truck entrance. **Medium** specifically on the
guard-shack vs remote-check-in call and the scale/lane counts, because the
entrance sits behind a wooded buffer with no Street View penetration — flagged in
`uncertainFields`.
