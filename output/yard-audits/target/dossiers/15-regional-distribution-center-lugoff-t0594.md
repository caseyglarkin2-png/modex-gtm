# Deep-Audit Dossier — Target Regional Distribution Center Lugoff (T0594)

- **Facility:** Target Regional Distribution Center Lugoff (T0594)
- **Type:** RDC (regional distribution center)
- **Address:** 22 Corporate Dr, Lugoff, SC 29078 (Heritage Pointe Industrial Park)
- **Resolved center:** lat **34.17950**, lng **-80.67980**
- **Geocoded input:** 34.179839, -80.68179 (landed on the western edge / a neighbor footprint; corrected east to the true building/yard center)
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** HIGH

## Location confirmation
The supplied geocode sat near the western perimeter of the property, close to a
smaller neighboring industrial building. Satellite probes (z15–z20) and web
research positively identify the correct facility as the single massive
~1.35 M sq ft distribution warehouse to the east, with its long axis running
NW→SE and an enormous trailer drop yard filling the SE/east side.

Web corroboration (multiple directories + Target sourcing): Target opened this
RDC in June 2003; **1.35 million sq ft on a 184-acre parcel** in Heritage Pointe
Industrial Park; serves SC/NC/GA/VA; **238 overhead doors**, 7.5 mi of
conveyors; designed for **1,200+ trailers and 775 autos**; operates 24/7.
The footprint, door banks and trailer yard seen in imagery match these figures,
confirming identity. (Note: a secondary address "166 Corporate Dr / Target DC
0594" also appears — same campus address family.)

## Key views and what they showed
- **wide-z16 / full-z15 / perimeter-z16** — Whole property: one giant warehouse,
  wooded buffer on N/E/S, access only from the W (Corporate Dr off US-1). Long
  axis NW–SE; trailer yard on the SE/E.
- **overview-z17 / traileryard-z18 / sw-z17** — East/SE apron packed with
  hundreds of trailers in long parallel rows = large dedicated drop yard.
- **west-entry-z18 / main-entrance-z19 / entrance-inner-z19** — NW long face is
  the office/employee side with large auto lots (~775-car capacity).
- **truck-split-z19 / gatehouse-z20** — SW corner: truck driveway pinches around
  a **small square guard-booth island** (~34.17760,-80.68250); in/out lanes
  split around it before fanning into the dock court and east trailer yard.
- **sv-entrance-ne / sv-near-building / sv-booth (Street View 2023)** — Approach
  drive (Corporate Dr) winds through a wooded buffer with **chain-link
  perimeter fencing** visible and a property sign; confirms a single controlled
  approach.
- **se-far-z18 / s-publicroad-z17** — S and E are forest with no second public
  exit; reinforces single point of access.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** A controlled truck entrance exists at the SW corner: the
  truck driveway narrows around a booth island and is the only vehicular access
  to the fenced property (wooded buffer on all other sides). Perimeter
  chain-link fence visible in Street View.
- **guardShack = TRUE.** A small ~1-vehicle-footprint square booth sits in the
  landscaped island at the gate split (clearly resolved at z20), positioned to
  control truck flow into the dock yard — classic staffed guard booth.
- **remoteGs = FALSE.** A physical staffed booth is present, so this is not a
  kiosk/remote-only check-in.
- **dockDoors = 50+.** Web sources cite 238 overhead doors; imagery confirms long
  banks of dock doors with trailers backed in along the SW wall and SE-facing
  walls.
- **dropYard / dropArea = TRUE / 50+.** Dedicated on-site trailer storage on the
  E/SE holds hundreds of parked trailers; designed for 1,200+ trailers.

## Yard zones and counts measured
- **perimeter** — 8-vertex oriented ring tracing the active operational footprint
  (building + paved trailer yard + auto parking) at the lot's true NW–SE angle.
  Area ≈ **68.5 acres** (the 184-ac parcel includes the wooded buffer outside the
  active fence).
- **truckGate** — small rotated quad over the SW gate/booth split.
- **dropYards** — one large rotated quad over the SE/E trailer storage apron.
- **dockAprons** — two rotated quads hugging the SW dock wall and an SE-facing
  dock bank, parallel to the building.
- **yardMetrics:** dockDoorCount 238 (web), trailersVisible ~420 (overhead
  estimate), trailerParkingCapacity ~1,200 (web), truckGateCount 1,
  buildingCount 1, siteAreaAcres 68.5, railServed false (no rail spur visible).

## Street View
Best driver's-eye frame is pano **7r69Owm32ovhJKvwrJmvUQ** (2023-02) on the
Corporate Dr approach at 34.176818,-80.682790, heading ~17° toward the gate.
Used for both perimeter and truckGate zones.

## Web findings (summary)
Opened June 2003; 1.35 M sq ft; 184 acres; 238 overhead doors; 7.5 mi conveyor;
1,200+ trailer / 775 auto capacity; serves SC/NC/GA/VA; 24/7 operation.

## Final confidence
**HIGH.** Building identity, gate, guard booth, dock band and drop yard are all
corroborated by both imagery and independent web sources. Lower-confidence
fields (exact entry/exit lane counts, ship/rcv separation) are flagged in
`uncertainFields`.
