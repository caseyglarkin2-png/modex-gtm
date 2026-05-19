# Deep-Audit Dossier — idx 16

## Ford - Sharonville Transmission Plant, Sharonville OH

**Type:** Transmission Plant
**Address:** 3000 E Sharon Rd, Cincinnati (Sharonville), OH 45241
**Locked coordinates:** 39.27229, -84.42525
**Confidence:** high

## Step 0 — Location confirmation

The roster coordinate (39.272893, -84.424205) landed inside the building of a
very large single-structure industrial complex. Web research (Ford Authority,
AmericanAutoWorker, BBB) confirms this is Ford's Sharonville Transmission Plant
— established 1958, producing the 10R140 (Super Duty) and 10R80 10-speed
transmissions plus individual gears. The complex is bounded by Mosteller Rd on
the west, a CSX/active rail line on the north, open land and woods on the east,
and employee parking lots / Reading Rd corridor on the south. Center re-locked
to the building-complex centroid at 39.27229, -84.42525.

## Key views

- **Wide z15-16:** One contiguous plant building filling most of a fenced
  parcel; large employee parking lots and an employee ball field on the south;
  rail yard immediately east.
- **NW corner z19-21:** The truck/trailer operations — a large drop yard with
  rows of trailers parked under canopy structures, a wide internal road, and a
  paved gate apron meeting Mosteller Rd.
- **West side (Mosteller Rd) Street View, 2025-06:** Continuous chain-link
  perimeter fence with a wide grass berm; plant set well back. The grass
  "driveway" mid-berm is a mowing path, not a truck entrance.
- **NW gate Street View, 2025-06:** Truck-yard entrance — chain-link fence,
  Ford signboard, wide paved apron and gate opening into the canopy drop yard.
- **North edge z19:** Rail line with a spur reaching the building's north face;
  the plant is rail-served.
- **SW / S building face:** Dock banks, tanks, a circular structure; secondary
  drop area and dock apron.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Fenced truck-yard entrance on the NW side off Mosteller
  Rd: continuous perimeter fence, Ford signboard, gate opening, wide paved
  apron. A second controlled access serves the SW dock area.
- **guardShack = false / remoteGs = true.** No distinct staffed booth resolved
  at the NW truck gate in z21 satellite or Street View. Controlled gate without
  a visible booth implies kiosk / remote check-in. Marked low-confidence on the
  guard-shack absence.
- **dockDoors = 25-50.** Dock banks on the SW and N building faces; ~30 doors
  estimated, partly obscured by trailer canopies.
- **dropArea / dropYard = true, 50+.** Major dedicated trailer-storage yard on
  the NW side (dozens of trailers under/around canopy structures), plus a
  second drop area on the SW side.

## Yard zones and counts

- **Perimeter:** ~168 acres inside the fenced parcel (Mosteller Rd W, rail N,
  woods E, parking/Reading Rd S).
- **Truck gate:** NW corner apron off Mosteller Rd.
- **Drop yards:** NW canopy trailer yard (primary) + SW trailer rows.
- **Dock aprons:** SW truck-yard dock face + N rail-served face.
- **Staging:** Paved post-gate area between the NW gate and the canopy yard.
- **Metrics:** ~95 trailers visible, ~130 capacity, 2 truck gates, 1 building,
  rail-served = true.

## Web findings

Ford Authority / AmericanAutoWorker / BBB confirm Sharonville Transmission
Plant, 3000 E Sharon Rd, est. 1958; produces 10R140 and 10R80 transmissions
and gears for Super Duty and F-150. A "Sharon Rd & Ford Entrance" transit stop
corroborates a designated plant entrance.

## Final confidence

**High.** Facility unambiguously identified; layout, fenced perimeter, truck
gate, drop yards and rail service all clearly read from satellite + Street
View. Uncertainty limited to the guard-shack absence and exact dock/lane
counts, listed in `uncertainFields`.
