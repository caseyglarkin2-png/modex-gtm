# Deep-Audit Dossier — Publix Distribution Campus, Lakeland FL (County Line)

- **idx:** 1
- **Type:** Distribution Campus (Publix HV/LV — High Velocity / Low Velocity grocery warehouse)
- **Address:** 2600 County Line Rd, Lakeland, FL 33811
- **Confirmed center:** 28.0145, -82.0510
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied coordinates (28.014113, -82.051206) landed on the west end of the
correct building. Web search confirmed 2600 County Line Rd as the **Publix
HV/LV Warehouse** (Yelp, Waze, Foursquare, Chamber of Commerce listings; phone
863-688-1188; operates 24/7). Satellite at z15-z16 shows this is a single
enormous distribution building (~600 m long, sawtooth/skylight roof) sitting on
an island parcel ringed by stormwater retention ponds and woods, SW of
Lakeland, in an industrial corridor of comparable big-box DCs. This is the main
DC building + yard at the address — locked the center at 28.0145, -82.0510.

## Key views
- **z16/z15 wide:** single large DC, long axis roughly E-W with a slight
  rotation (east end sits a touch north). Only road access is a private access
  road branching east off County Line Rd, crossing a causeway between two ponds.
- **z18 west end:** employee/visitor parking lot + white office annex on the
  west; warehouse to the east. The access road funnels to a single controlled
  entry point.
- **z17 south face:** continuous bank of dock doors along the entire south wall
  with trailers backed in on a wide apron.
- **z18 NE corner:** continuous dock doors along the north face with trailers
  backed in; a circular water tank near the NE corner; trailer-storage drop
  yard begins on the east end.
- **z17/z18 east end:** dedicated drop yard, multiple rows of parked trailers.

## Gate / guard-shack determination (decisive — Street View)
- **Truck gate: YES.** Pano `72xVFOCkwfKwy1yeLvc21w` (captured 2023-12) at
  28.01404, -82.05419 shows a controlled entry: an island booth straddling the
  entry road, raised barrier-arm mechanisms and bollards on the lanes either
  side, crosswalk, and "PRIVATE PROPERTY / NO TRESPASSING / NO SOLICITING"
  signage. Confirmed in z21 satellite as a small green-roofed structure
  straddling the drive with lanes passing on both sides.
- **Guard shack: YES.** Same pano shows a uniformed guard (blue shirt,
  clipboard) at the booth window. Classic ~1-vehicle-footprint booth with
  windows on multiple sides, set in the center of the entry-road island —
  not the main building.
- **remoteGs: NO** — staffed booth present, so not a kiosk/call-box setup.
- **Configuration:** single combined entry complex (entryExitTogether) with one
  inbound and one outbound lane passing either side of the central booth
  (entryLanes/exitLanes = 1, low confidence). Wide approach apron leaves room to
  add an express/bypass lane → **fastLaneOpportunity: true**.

## Yard zones & counts
- **Perimeter:** oriented 6-vertex ring tracing the paved/developed property
  inside the pond-and-woods boundary; **~68.1 acres**.
- **Drop yard (east end):** one oriented quad over the east trailer-storage
  rows (dozens of trailers) → dropYard true, dropArea 50+.
- **Dock aprons:** two long thin oriented quads — one along the **north** face,
  one along the **south** face. Dock-door rhythm runs the full length of both
  faces (~180 doors total estimated) → dockDoors 50+. Two separate dock banks on
  opposite faces → **shipRcvSeparate: true**.
- **Staging:** post-gate paved holding area between the guard booth and the dock
  faces (postGateStaging true; deep approach → drivewayLong true).
- **yardMetrics:** dockDoorCount ~180, trailersVisible ~140, drop capacity ~90,
  truckGateCount 1, buildingCount 1, siteAreaAcres 68.1, railServed false.
  (Counts are honest overhead estimates; trailer counts and lane counts flagged
  low-confidence.)

## Web findings
- Publix HV/LV Warehouse, 2600 County Line Rd, Lakeland FL 33811; 24/7
  operation; corporate Publix driver map references this as the "(NEW HV/LV)"
  Lakeland warehouse. Part of the Publix Lakeland distribution complex (separate
  Frozen, Produce/Deli, and grocery DCs are nearby — those are other roster
  idxs, not this parcel, so multipleFacilities is left false for this site).

## Final confidence
**High.** Building positively identified and corroborated; gate and staffed
guard shack confirmed unambiguously at street level. Lower-confidence items
(entry/exit lane counts, exact trailer capacity, connectivity inference) are
listed in `uncertainFields`.

---
**3-line summary**
- Gate: YES — controlled island entry with barrier arms (Street View + z21 sat).
- Guard shack: YES — staffed booth, guard visible at window.
- Confidence: high.
