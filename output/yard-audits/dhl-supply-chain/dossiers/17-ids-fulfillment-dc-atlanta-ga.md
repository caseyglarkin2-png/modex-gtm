# Deep-Audit Dossier — idx 17

## DHL Supply Chain - IDS Fulfillment DC - Atlanta GA

**Type:** Multi-Customer E-Commerce Fulfillment Center
**Resolved location:** 495 Coweta Industrial Parkway, Newnan, GA 30265
(Coweta Industrial Park) — building center ~33.41010, -84.72560
**Confidence:** medium

## Step 0 — Location resolution

The roster entry had no address and no coordinates ("COULD NOT PIN DOWN").
Web research resolved it: IDS Fulfillment's Atlanta-metro distribution center
is at **495 Coweta Industrial Parkway, Newnan GA 30265**, marketed as
"Scout 85 Logistics" / "Scout Cold Logistics Center Atlanta-II". It is a
215,822 sq ft Class A rear-load building completed in 2022, leased
full-building (10-year term) to IDS Fulfillment — now part of DHL Supply
Chain after the May 2025 acquisition. The park sits ~3 miles east of I-85
Exit 47 in Newnan, a southwest-Atlanta exurb.

Satellite + Street View probes of Coweta Industrial Park identified the
matching building: a single-tenant white tilt-up **rear-load** warehouse on
the south side of the parkway with a fenced dock yard. One caveat — a Street
View building plate on the NW end read "355", which conflicts with the
marketed street number 495; the 355 plate is likely a suite/door
designation. It is the only building in the park matching the Scout
description (single-tenant ~215k sq ft, rear-load, fully secured, 2022
build), so building identity is high-probability but the number discrepancy
is unresolved — overall confidence is **medium**.

## Key views

- **z17/z18 satellite:** Single rectangular building (~600 ft × ~300 ft) on a
  NW-SE axis. Office front on the NE/road side; all loading docks on the SW
  long face.
- **z19 dock face:** ~35-45 dock positions along the SW face with ~32
  trailers backed in.
- **Street View (May 2025):** White tilt-up building; the SW dock yard is
  enclosed by chain-link fencing with a sliding gate across the truck
  driveway at the SW end. Office front with arched window bays on the NE.

## Gate / guard-shack / dock determinations

- **Truck gate: TRUE.** The SW dock yard is fenced (chain-link) and the truck
  driveway enters through a sliding gate — confirmed in Street View, though
  tree cover partly obscures it (flagged uncertain).
- **Guard shack: FALSE.** No staffed booth at this building's gate. A
  separate guarded gate with a guard booth exists at the much larger DC
  further NE in the park (Averitt Express trailers seen there) — that is a
  different building and not this facility.
- **Remote GS: TRUE.** There is a truck gate but no guard shack, implying
  kiosk / app / call-box check-in.
- **Dock doors: 25-50 band.** Rear-load building, all docks on the SW face;
  ~35-45 positions counted.

## Yard zones and counts

- **Perimeter:** ~289 m × ~232 m parcel = ~16.6 acres.
- **Truck gate zone:** boxed at the SW driveway / sliding gate.
- **Dock apron:** the strip along the SW dock face where trailers back in.
- **Drop yards / staging:** none distinct — trailers are backed at docks; the
  fenced court is narrow with little marked drop parking.
- **yardMetrics:** dockDoorCount ~40, trailersVisible ~32, trailer parking
  capacity ~12 (low — narrow court), truckGateCount 1, buildingCount 1,
  siteAreaAcres 16.6, railServed false.

## Web findings

DHL Supply Chain acquired IDS Fulfillment in May 2025 (1.3M sq ft across
Atlanta / Indianapolis / Salt Lake City / Plainfield IN). IDS's Atlanta
"Southern Fulfillment Center" is the Newnan building at 495 Coweta
Industrial Parkway — a temperature-controlled, fully secured Class A
rear-load building, anchor tenant cited as Pharmavite. Confirmed via IDS
Fulfillment, Colliers, REBusinessOnline, and CommercialSearch listings.

## Final confidence

**Medium.** Address and facility positively resolved by web research; the
audited building matches the Scout description and is the only viable match
in the park. The unresolved "355" vs "495" building-plate discrepancy and
tree-obscured gate keep this at medium rather than high.
