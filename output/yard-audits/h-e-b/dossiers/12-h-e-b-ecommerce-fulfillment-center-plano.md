# Deep-Audit Dossier — H-E-B eCommerce Fulfillment Center, Plano TX (idx 12)

## Facility
- **Name:** H-E-B eCommerce Fulfillment Center - Plano
- **Type:** E-commerce Fulfillment Center (~55,000 sq ft, opened 2023)
- **Address:** 6001 Preston Rd, Plano, TX 75024
- **Resolved coordinates:** 33.054800, -96.796800 (H-E-B store building centroid)

## Step 0 — Location confirmation
Roster geocode (33.055426, -96.796736, ROOFTOP, moved 111 m) landed on a
large white-roofed big-box building. Web research (H-E-B Newsroom, Community
Impact, Local Profile, May 2023) confirms the Plano eFC is ~55,000 sq ft and
is located **next to / attached to the H-E-B Plano retail store at 6001
Preston Rd** — it is H-E-B's first North Texas eFC, dedicated to Curbside and
Home Delivery, ~125 partners. The eFC is not a stand-alone freight building;
it shares the retail store's structure and back-of-house dock. Center locked
at the store building centroid.

## Key views
- **z17 overview:** Large H-E-B grocery store running diagonally NE-SW, vast
  customer parking on the NE/E side, residential subdivision to the west with
  a masonry screen wall, retail pad buildings to the south, Preston Rd to the
  east, a major road with frontage road to the north.
- **z19/z20/z21 SW corner:** A small back-of-house dock recess in the building
  with 2 trailers backed in and a tractor; a service drive runs along the
  screened west wall.
- **Street View (Preston Rd / shopping-center drives, 2018-2024):** Retail
  storefronts, curbside pickup canopy, parking-lot circulation. The back-of-
  house service drive is not covered by public Street View (private route).

## Gate / guard-shack / dock determinations
- **truckGate = false.** Truck access is an open back-of-house service drive
  along the screened west wall that connects directly to the shopping-center
  parking-lot circulation. No barrier arm, no sliding gate, no checkpoint
  pinch-point — it is a normal retail service drive.
- **guardShack = false.** No staffed booth anywhere on the truck route.
- **remoteGs = false.** No truck gate exists.
- **Docks:** A small grocery-store back-of-house dock at the SW corner — approx
  2-4 dock positions, with 2 trailers seen backed in. Banded **0-10**. Single
  dock cluster (shipping/receiving not separated).
- **Staging:** No paved staging area inside or outside; the service drive
  holds only 1-2 trucks at the dock recess (drivewayShort = true).

## Yard zones & counts
- **perimeter:** the H-E-B parcel — store building, dock/service drive, and
  the customer parking lots. ~245 m × 289 m ≈ **17.5 acres** (mostly customer
  parking).
- **truckGate:** null — no controlled gate exists.
- **dockApron:** the SW dock recess and adjacent service-drive strip.
- **dropYards / staging:** none.
- dockDoorCount ~3; trailersVisible ~2; trailerParkingCapacity ~3;
  truckGateCount 1 (uncontrolled service drive); buildingCount 1;
  railServed false.

## Web findings
H-E-B Newsroom / Community Impact / Local Profile (May 2023): Plano eFC,
~55,000 sq ft, attached to the H-E-B Plano store at 6001 Preston Rd, ~125
partners, supporting Curbside and Home Delivery for Plano, Frisco, McKinney
and Allen. First North Texas eFC for H-E-B.

## Confidence
**High** on the overall determination — this is a retail-store-attached eFC
with an uncontrolled back-of-house service drive and a small grocery dock.
Exact dock-door count and entry/exit lane counts are flagged uncertain
because the screen wall and dock canopy partially obscure the overhead view
and no Street View covers the service drive.
