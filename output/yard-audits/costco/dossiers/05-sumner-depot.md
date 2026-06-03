# Yard Audit Dossier — Costco Depot #285, Sumner WA

- **Facility:** Costco Depot #285 (Dry Depot / Pacific Northwest regional cross-dock)
- **Address:** 4000 142nd Ave E, Sumner, WA 98390
- **Resolved center:** 47.21955, -122.24350
- **Maps:** https://www.google.com/maps/@47.21955,-122.24350,400m/data=!3m1!1e3
- **Method:** deep-audit (satellite z15-z21 + Street View, 2025-03 / 2017-08 panos)
- **Confidence:** high

## Location confirmation

Roster coords (47.219706, -122.243194) landed directly on the large L/T-shaped
cross-dock building. Wide z16/z15 satellite plus the street address confirm this
is the Costco Sumner distribution complex on the **west** side of 142nd Ave E in
the Sumner industrial corridor. Web research corroborates: TruckMap and Panjiva
both list "Costco Sumner Depot Dry, 4000 142nd Ave E Ste B, Sumner WA 98390" as a
distribution center (hours Mon-Fri / Sun 5AM-3PM, scheduled appointments). The
buildings to the east of 142nd Ave E are unrelated tenants.

## What the key views showed

- **z16/z17 overview:** A multi-building campus. A long N-S main cross-dock
  (L/T footprint) at the roster coords, a second large E-W cross-dock to the
  north, and a third smaller building at the south end. Dense trailer drop rows
  on the west and east edges and across the central yard.
- **North dock Street View (pano a2c5XTxP5_Gx8T3qSdUWpQ, 2017-08, heading 180):**
  North building's dock face with trailers (McPherson, Knight) backed into dock
  doors behind a **chain-link perimeter fence** along the property line.
- **Main entrance Street View (panos IN9diRJmskbGzHSl2a5FxQ / iTS8xYiNFRerNbtPtQ1Frg,
  2025-03):** Single **signalized** truck entrance off 142nd Ave E. Wide entrance
  apron, crosswalks, signal mast arm, Costco day-cab tractor-trailers staged at
  the driveway mouth. No gate arm or booth AT the public road — access control is
  internal.
- **Central yard z18/z20 satellite:** A **canopied gatehouse straddling the
  internal truck lanes** (~47.2210, -122.2443) between the north drop yard and
  the cross-dock, with orange lane delineators, queued trucks, parked cars and a
  tractor-trailer beside it. This is the driver check-in / security checkpoint.
- **Dock close-ups (z19/z20):** Regular dock-door rhythm with dock levelers and
  trailers backed in along the main building's **west** and **east** faces and
  the north building's **south** face (red dock lines visible). Easily 50+ doors
  total across the campus (estimated ~120).
- **East frontage Street View (multiple 2025-03 panos):** Employee/visitor
  parking behind landscaped berms; the truck operation sits well back from the
  road.

## Gate / guard / dock determinations

- **truckGate = true.** One controlled signalized truck entrance off 142nd Ave E
  feeding an internal canopied checkpoint. Property is fenced (confirmed in the
  north dock pano).
- **guardShack = true (flagged uncertain).** A canopied check-in / security
  building straddles the internal truck lanes with vehicles parked at it. It is
  larger than a 1-3-space booth, so it is flagged in uncertainFields, but it
  functions as the staffed driver report point. `remoteGs` is therefore false.
- **postGateStaging = true.** Striped staging stalls and angled trailer-staging
  rows sit just inside the gatehouse, before the dock faces.
- **dockDoors = 50+.** Dock banks on multiple faces of two cross-dock buildings.
- **dropArea = 50+ / dropYard = true.** Hundreds of drop trailers in dense rows.
- **shipRcvSeparate = true.** Distinct dock clusters on different building faces.
- **multipleFacilities = true.** Three-building campus.
- **scale = false.** No weigh-scale pad positively identified.
- **railServed = false.** Mainline rail runs in the buffer west of the property
  but no spur enters the yard.

## Yard zones & counts (estimates from overhead imagery)

- **perimeter:** ~55 acres, traced inside the fence line (rail buffer west,
  142nd Ave E parking edge east, north building north, south building south).
- **truckGate:** the internal canopied gatehouse / checkpoint lanes.
- **dropYards (3):** west-edge trailer rows, east-edge trailer rows, north yard
  rows.
- **dockAprons (3):** main building west face, main building east face, north
  building south face.
- **staging:** central post-gate staging stalls.
- **Metrics:** dockDoorCount ~120, trailersVisible ~280, trailerParkingCapacity
  ~350, truckGateCount 1, buildingCount 3, siteAreaAcres ~55, railServed false.

## Web findings

TruckMap and Panjiva confirm the facility as the Costco Sumner Dry Depot
distribution center at 4000 142nd Ave E, Ste B; appointment-based receiving,
weekday + Sunday operating hours. Consistent with a high-volume regional
cross-dock.

## Final confidence

**High.** Facility unambiguously identified; gate, fenced perimeter, internal
checkpoint, dock banks, and drop yards all corroborated across satellite and
Street View. `guardShack`, `scale`, and exact lane counts carried as the only
uncertain calls.
