# Deep-Audit Dossier — Amazon DFW7 Fulfillment Center, Fort Worth TX

- **Roster idx:** 7
- **Facility:** Amazon DFW7 Fulfillment Center (Sortable FC)
- **Address:** 700 Westport Pkwy, Fort Worth, TX 76177 (AllianceTexas)
- **Resolved center:** 32.9701, -97.3358
- **Method:** deep-audit (satellite probe + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied pin (32.971437, -97.335757) landed on the building. Web search
confirmed DFW7 at 700 Westport Pkwy in the AllianceTexas logistics hub near
I-35W / SH-170 / Perot Field Alliance Airport — a ~1.1M sq ft robotics sortable
FC on ~68 acres developed by Hillwood. Satellite probing (z16-z21) positively
identified a single large white-roofed warehouse whose long axis runs roughly
N-S, tilted ~10° east of north, spanning ~32.9730 (north) to ~32.9676 (south),
~600 m long. Building footprint traces to ~880k sq ft, consistent with a
multi-floor 1.1M sq ft FC. Neighboring blue/grey/brown warehouses to the NW, NE,
and SE are separate parcels (different roofs, own trailer yards), so this is a
single-building site, not a campus. Center locked at 32.9701, -97.3358.

## Key views
- **z16 overview (center):** single long building, dock-and-trailer wall on the
  WEST face, employee parking lots and van staging on the EAST, undeveloped land
  to the south, Westport Pkwy frontage to the north.
- **NW corner (z19):** west dock wall lined with trailers backed into doors under
  solar canopies; wide truck apron drive running the building's full length.
- **NE / north entry (z18-19):** car/employee entrance off Westport Pkwy into
  large parking lots with a shaded pedestrian walkway to the building.
- **West gate (z19) + Street View (2023-02):** the truck checkpoint — see below.
- **South end (z18):** south building wall, van/trailer lot, SE exit drive
  curving east to the perimeter road.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** The truck drive comes south off Westport Pkwy down the
  WEST side of the building. Street View (pano `6k8519RXsITmkFC3Q48auw`, Feb 2023)
  looking south down the drive clearly shows a checkpoint: a small gatehouse
  straddling the lanes, yellow barrier arms, protective bollards, yellow-striped
  lane dividers and a red-curbed median. Satellite z19 shows the pinch point and
  a tractor staged at the booth.
- **Guard shack — TRUE.** A small staffed booth (~1-2 vehicle footprint) sits
  between the inbound/outbound lanes at the gate, distinct from the main building.
  Visible both in Street View and overhead. `remoteGs` therefore false.
- **Pre-gate staging — TRUE / Post-gate staging — TRUE.** The ~120 m+ entry drive
  from the Westport stop bar to the gate gives outside stacking room (pre-gate),
  and there is paved holding inside the gate before the dock apron (post-gate).
  Drive is long enough for a 3+ truck queue → `drivewayLong: true`.
- **Fast-lane opportunity — TRUE.** The gate apron is wide and multi-lane with a
  red-curbed median and unused paved width — physical room for an express/bypass
  lane. Estimated ~2 inbound / ~2 outbound lanes (flagged uncertain).
- **Dock doors — 50+.** The entire ~600 m west wall is a near-continuous run of
  dock doors with trailers backed in under canopies; point estimate ~140 doors
  (approximate, band is firm).
- **Entry/exit together — TRUE.** A single west truck gate handles both
  directions; no separate out-gate at a different property point.
- **Ship/Rcv separate — FALSE.** All truck dock activity is on the one west face.

## Yard zones measured
- **Perimeter:** 4-corner oriented ring tracing the fenced property (west buffer
  fence, Westport frontage north, drainage swale east, undeveloped south).
  Area ≈ **78.8 acres** (includes yard + parking; published parcel ~68 ac).
- **Truck gate:** rotated quad over the west checkpoint, aligned to the entry drive.
- **Drop yards (array, 2):** the west apron trailer line, plus the south
  van/trailer lot — dedicated trailer staging separate from active dock backing.
- **Dock aprons (array, 1):** long thin quad hugging the west dock wall at the
  building's angle.
- **Staging:** pre-gate apron on the entry drive between Westport Pkwy and the gate.
- **Street View meta:** truckGate → pano `6k8519RXsITmkFC3Q48auw` heading 165°
  (driver's arrival frame down the gate drive); perimeter → pano
  `hhLEDVfXmFPYHQbSKyDZGg` heading 289°. Both have coverage.

### yardMetrics
- dockDoorCount ≈ 140 (50+ band) · trailersVisible ≈ 95 · trailerParkingCapacity
  ≈ 160 · truckGateCount 1 · buildingCount 1 · siteAreaAcres 78.8 · railServed false

## Web findings
- DFW7 = Amazon sortable Fulfillment Center, 1.1M sq ft on ~68 acres in
  AllianceTexas; 24/7 operation, robotics-driven, 1,500+ associates; serves the
  DFW metroplex and North Texas. Hillwood-developed, near Perot Field Alliance
  Airport. Employees-only, not a public drop-off.
- No rail spur serves the site; freight is truck/air (Alliance Airport adjacent).

## Urban vs rural
Judged **Rural** per the rubric tie-break: a large stand-alone industrial park on
the Fort Worth / Haslet edge surrounded by warehouses, open land and an airport,
not dense metro fabric.

## Final confidence: HIGH
Building identity, gate, guard shack, dock band, and drop yard are all directly
evidenced by satellite + Street View. Lane counts and exact dock/trailer
point-counts are honest overhead estimates (flagged in `uncertainFields`).
