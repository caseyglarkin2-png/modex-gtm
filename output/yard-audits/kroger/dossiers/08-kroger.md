# Deep-Audit Dossier — Fred Meyer Grocery Distribution Center, Puyallup WA

- **Account:** Kroger (Fred Meyer division)
- **Facility (idx 8):** Fred Meyer Grocery Distribution Center
- **Address:** 349 Valley Ave NW, Puyallup, WA 98371
- **Resolved center:** 47.20985, -122.29855
- **Method:** deep-audit (Google satellite via probe.ts + Street View + web research)
- **Confidence:** medium

## Location confirmation (Step 0)

The supplied coordinates (47.208991, -122.299558) landed on a road junction at
the south edge of a large industrial district. Probing satellite z16-z18 around
that point and cross-checking the street address and a Waze "Distribution
Center Truck Entrance - Fred Meyer, Valley Ave NW" result confirmed the
facility is the large white-roofed distribution campus immediately **north** of
Valley Ave NW.

The campus is two large connected DC buildings sharing one fenced truck court:
1. **Main DC** — a long building running roughly E-W with a continuous loading
   dock face along its entire **south** wall.
2. **Second DC building** — a large building running NW-SE just south/east of the
   main building, with a dock bank on its **west** face.

To the south across Valley Ave NW is a Korum Nissan dealership and other retail
(separate). To the east, a through rail corridor (BNSF/Tacoma line) plus a
landscaped buffer and an internal road separate the Fred Meyer property from
unrelated warehouses. The employee/fleet parking and office sit at the SW
corner. The southern Fred Meyer retail **store** (rooftop units, customer lot)
near the original coords is a separate building and is **not** the DC.

## What the key views showed

- **Wide / overview (z16-17):** Two connected white-roof DC buildings with a
  very large trailer drop yard between/south of them; field/open land to the
  north; rail corridor to the east; dense industrial/retail fabric all around.
- **Dock face (z18-20, south wall of main building):** Continuous regular rhythm
  of dock doors running the full length of the south wall, trailers backed in
  along nearly the whole face (~50-60 doors on the main building alone). The
  second building adds a west-facing dock bank with trailers backed in.
- **Drop yard (z18-20):** Dense rows of parked trailers (drop trailers without
  tractors), hundreds of stalls. A yard-jockey / spotter truck is visible
  mid-yard, confirming active controlled drop-yard operations.
- **SW entrance (Street View, 2025-06, pano @ 47.20823,-122.29971):** A
  signalized intersection on Valley Ave NW opens into the property. The frame
  shows landscaped traffic islands, fleet vans and light vehicles, a "do not
  enter" wayfinding sign directing flow, and street lighting. This is the main
  arrival point; the actual access-control checkpoint sits back from the public
  road behind a tree/landscape buffer and is not visible from the street.
- **Entrance throat (z20):** A vegetated buffer fences the trailer drop yard off
  from the employee car lots and the public road — the yard is a controlled,
  enclosed area, not an open drive-through.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Single controlled truck entrance off the SW signalized
  intersection. The drop yard is fully fenced/buffered from the public road and
  car lots, and yard-jockey operations confirm a controlled facility. Clear
  checkpoint pinch-point where the property meets Valley Ave NW.
- **guardShack = false (flagged).** No guard booth is positively visible in
  satellite or Street View. The check-in point is set back from the road behind
  vegetation, so a booth cannot be confirmed. Called false on visible evidence;
  listed in uncertainFields. (A grocery DC of this class commonly runs a guarded
  or kiosk-controlled gate, so this could flip with better imagery.)
- **remoteGs = true (flagged).** Set per the rule: gate present, no visible guard
  shack → implies kiosk / call-box / app check-in. Would flip to false if a
  setback guard booth exists.
- **dockDoors = "50+".** Continuous south dock face of the main building plus the
  second building's west dock bank put the total well into the 50+ band
  (estimate ~95 doors total).
- **postGateStaging = true, drivewayLong = true.** Deep internal truck court
  between the gate and the dock faces holds far more than 3 trucks.
- **fastLaneOpportunity = true.** Wide entrance apron and large internal court
  give room to add an express/bypass lane.

## Yard zones and counts measured

- **perimeter:** 7-vertex ring tracing the fenced property (main DC + second
  building + drop yard), bounded N by open field, W by the access road/employee
  lot, S by Valley Ave NW, E by the rail corridor. ≈ **34.1 acres**.
- **truckGate:** quad over the SW controlled entrance throat.
- **dropYards:** one large ring over the central/south trailer drop yard.
- **dockAprons:** two rings — the long thin apron hugging the main building's
  south dock wall, and the apron along the second building's west dock face.
- **staging:** null (no distinct pre-gate staging apron visible on the public
  road; queueing is internal).
- **yardMetrics:** dockDoorCount ~95, trailersVisible ~240, capacity ~320,
  truckGateCount 1, buildingCount 2, siteAreaAcres 34.1, railServed false (rail
  line runs past the east edge but no spur enters the property).

## Web findings

- TruckMap, Manta, Chamber of Commerce, Waze and Nextdoor all confirm "Fred
  Meyer Distribution Center, 349 Valley Ave NW, Puyallup, WA 98371", phone
  253-770-6842. Listings note overnight secured/well-lit customer (driver)
  parking and live load/unload, hours roughly 7:00 AM-midnight most days. A Waze
  entry specifically names a "Distribution Center Truck Entrance" off Valley Ave
  NW, consistent with the SW entrance identified.

## Final confidence

**Medium.** Building identity, perimeter, dock scale, drop yard, and the single
controlled truck entrance are all high-confidence from clear satellite. The
guard-shack / remote-check-in determination and the exact entry/exit lane and
ship-vs-receive split are lower-confidence because the internal checkpoint sits
behind a landscape buffer that neither satellite nor Street View resolves; those
fields are flagged in uncertainFields.
