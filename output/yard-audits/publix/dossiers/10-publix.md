# Deep-Audit Dossier — Publix Refrigerated DC, McCalla AL (idx 10)

- **Address:** 7200 Jefferson Metro Pkwy, McCalla, AL 35111
- **Type:** Refrigerated DC (refrigerated cross-dock, ~638,000 sq ft, opened 2017)
- **Resolved center:** 33.300700, -87.050100
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied coordinates (33.301848, -87.050423) landed directly on the correct
building. The site sits inside Jefferson Metropolitan Park (JeffMet McCalla), a
multi-tenant industrial park that also hosts Mercedes-Benz suppliers, McKesson,
Home Depot and others, so it was important to isolate the Publix building from
its neighbors. Confirmed via:
- Web: Alabama News Center (2017 grand opening), Waze/TruckMap/BBB and a
  ClustrMaps record all tie "7200 Jefferson Metro Pkwy" to the Publix
  Distribution Center (638,000 sq ft; 600k warehouse + 38k office/cafeteria).
- Satellite: the building at the supplied point is the largest single footprint
  in the park, with dock banks and trailers wrapping three faces and large
  trailer drop lots — consistent with a 638k sq ft refrigerated DC.
- Street View: the east entrance carries a stone "Publix" monument plus a
  "TRUCK ENTRANCE" sign, with green Publix tractors/trailers at the docks behind.

The neighboring white-roof and blue-roof buildings to the north and east are
separate tenants on adjacent parcels and were excluded from the geofence.

## Key views
- **Wide satellite (z16-17):** isolates the Publix building from the rest of the
  park; large rectangle rotated ~30 deg clockwise (long axis NE-SW).
- **Footprint (z18 SW + NE):** dock doors with trailers backed in along the
  west/SW, south and north/NE faces — a cross-dock. Trailer drop rows fill the
  SW lot (by a pond/wetland) and the east apron.
- **Entrance Street View (pano 8WBC_aXzo6AEPR4bJWP_Qg, 2023-01), headings
  200/230/250/280:** the decisive frames. Heading ~280 shows a chain-link
  sliding gate across the truck drive at the fence line, with slim pole-mounted
  pedestals (kiosk / call-box) beside the lanes. Heading ~250/230 shows the
  Publix monument, a "TRUCK ENTRANCE" sign and a "VISITORS & ASSOCIATES"
  directional sign. A landscaped median splits the entrance into divided
  in/out lanes.
- **West road Street View (pano 9YP7Cagfmw2ZEBqn_-nHRQ, 2026-04):** public-road
  frontage on the west; employee parking behind the tree line. Not the truck
  entrance.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A chain-link sliding gate spans the truck drive at the
  property fence on the NE/east side; perimeter fencing and a clear pinch-point
  with painted lane markings. Not just an open driveway.
- **guardShack = false.** No staffed booth (1-3 vehicle footprint, multi-sided
  windows) at the gate in any heading. Only thin pedestals consistent with a
  kiosk / call-box.
- **remoteGs = true.** Gate present + no guard shack -> remote/kiosk check-in.
  Flagged medium-confidence in `uncertainFields` (cannot fully rule out an
  occasionally-staffed booth not captured in the pano).
- **Docks = 50+.** Cross-dock with dock banks on three faces (north/NE, west/SW,
  south); ~80-120+ doors estimated from overhead imagery. `shipRcvSeparate =
  true` given the physically distinct dock clusters on different faces.

## Yard zones and counts
- **Perimeter:** 5-vertex oriented ring tracing the secured/fenced paved area
  (building + drop yards + east apron + entrance). ~34.6 acres.
- **truckGate:** rotated quad on the NE entrance throat/gate.
- **staging:** divided gate apron outside/at the gate (pre-gate queue room) ->
  `preGateStaging = true`; large interior yard before docks -> `postGateStaging
  = true`; gate->dock approach holds 3+ trucks -> `drivewayLong = true`.
- **dropYards (2):** SW trailer lot (by the pond) and the east apron lot;
  dozens of dropped trailers -> `dropArea = 50+`, `dropYard = true`.
- **dockAprons (3):** thin quads hugging the west/SW, south and north/NE dock
  faces at the building's true angle.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~95, trailer parking
  capacity ~140, 1 truck gate, 1 building, 34.6 acres, rail not served (a
  mainline runs off the west edge but does not spur in). Counts are honest
  overhead estimates, flagged in `uncertainFields`.

## Other classification calls
- `entryExitSeparate = true` (divided in/out lanes), `entryLanes = 1`,
  `exitLanes = 1`.
- `fastLaneOpportunity = true` — wide divided gate apron with unused paved
  width for an express bypass.
- `backupSensitive = false` — entrance is off an internal campus road with a
  long divided apron; a queue would not spill onto a public arterial.
- `urbanRural = Rural` — edge-of-town McCalla, industrial park ringed by
  woods/farmland. `connectivityIssue = false` — active supplier park, not
  isolated. `multipleFacilities = false`, `scale = false`, `multiStep = false`.

## Web findings
- Alabama News Center (2017): Publix opened the McCalla DC, ~300 jobs, 638,000
  sq ft (600k warehouse + 38k office/cafeteria).
- JeffMet McCalla / Birmingham Times / Bhamwiki: the park is a major
  distribution + auto-supplier hub (Mercedes suppliers, McKesson, Home Depot).
- ClustrMaps: 7200 Jefferson Metro Pkwy historically also housed an OfficeMax
  DC before Publix.

## Final confidence: high
Building identity, gate, guard-shack and dock determinations are well supported
by recent Street View and satellite imagery. Door/trailer counts and the
exact remote-check-in mechanism are the only soft spots, flagged accordingly.
