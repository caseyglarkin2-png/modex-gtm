# Deep-Audit Dossier — H-E-B eCommerce Fulfillment Center, Katy TX (idx 11)

## Facility
- **Name:** H-E-B eCommerce Fulfillment Center - Katy
- **Type:** E-commerce Fulfillment Center (H-E-B's first stand-alone eFC; opened Sept 2023)
- **Address:** 2102 Elrod Rd, Katy, TX 77449
- **Resolved coordinates:** 29.803050, -95.760550

## Step 0 — Location confirmation
Roster geocode (29.803276, -95.760307, ROOFTOP, moved 1206 m) landed on a
large white-roofed L-shaped warehouse. Web research (H-E-B Newsroom,
Community Impact, REBusinessOnline, Swisslog) confirms a ~100,000 sq ft
stand-alone eFC at 2102 Elrod Rd — at the time of opening H-E-B's largest eFC,
using Swisslog automation. Satellite at z18-z20 shows an L-shaped warehouse
with a continuous bank of awning-covered dock doors on the WEST face and
trailers backed in. 2023-07 and 2024 Street View along Elrod Rd shows the
building with H-E-B branding and a tall H-E-B monument sign at the entrance
corner. Positive ID; center locked at 29.803050, -95.760550 (building
centroid).

## Key views
- **z18 overview:** L-shaped warehouse, dock apron on the west, employee
  parking lots to the south/southeast, an H-E-B fuel station / convenience
  store at the SW corner of the parcel, open field to the east.
- **z19/z20 west face:** Continuous row of dock doors (~12-15) with sun
  canopies; trailers and a box van backed in.
- **Street View (Elrod Rd, 2023-07 / 2024-11/12):** Confirmed the dock face,
  the green ornamental security fence along the road frontage, and the truck
  entrance driveway.

## Gate / guard-shack / dock determinations
- **truckGate = false.** The truck entrance is a wide open curb-cut off Elrod
  Rd at the NW of the property. A green ornamental metal security fence runs
  along the road frontage, but it terminates open at the driveway — no barrier
  arm, no sliding/swing gate, no checkpoint pinch-point. Multiple Street View
  headings (75°, 90°, 110°) all show an uncontrolled open driveway directly
  into the dock apron.
- **guardShack = false.** No staffed booth at the entrance — only a tall
  red/metal H-E-B monument sign at the corner.
- **remoteGs = false.** No truck gate exists, so there is no remote check-in
  either.
- **Docks:** ~12-15 awning-covered dock doors along the full west face →
  banded **10-25**. Single dock cluster, so shipping/receiving not separated.
- **Staging:** Wide deep paved dock apron inside the property provides ample
  internal queueing (postGateStaging = true, drivewayLong = true). No paved
  staging outside the property line (preGateStaging = false).

## Yard zones & counts
- **perimeter:** entire parcel — Elrod Rd buffer on west, the south public
  road, field/tree line on east and north. ~250 m × 169 m ≈ **10.5 acres**.
- **truckGate box:** the open driveway curb-cut at the NW corner.
- **dockApron:** strip in front of the west dock bank.
- **staging:** the deeper paved area between the dock apron and the road edge.
- **dropYards:** none formally striped — left empty.
- dockDoorCount ~14; trailersVisible ~7; trailerParkingCapacity ~12;
  truckGateCount 1; buildingCount 1; railServed false.

## Web findings
H-E-B Newsroom and Community Impact (Sept 2023): Katy eFC at 2102 Elrod Rd,
100,000+ sq ft, the company's first stand-alone eFC and at opening its
largest, with Swisslog automation, 300+ partners, serving Houston-area
Curbside and Home Delivery. TDLR construction record 2021-2022, 102,898 sq ft.

## Confidence
**High.** Facility positively identified, recent (2023-2024) Street View
clearly resolves the open uncontrolled truck entrance. Trailer counts and the
drop-area band are honest overhead estimates (flagged in uncertainFields).
