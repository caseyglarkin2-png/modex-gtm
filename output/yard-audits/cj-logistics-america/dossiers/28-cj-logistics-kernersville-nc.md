# CJ Logistics - Kernersville NC — Deep Audit Dossier

**Idx:** 28
**Type:** Distribution Center
**Resolved coords:** 36.1263, -80.06235 (700 N Main St, Kernersville NC 27284)
**Confidence:** medium

## Location resolution
Roster supplied no street address (source: Indeed CJ Logistics America
locations list) and city-centroid coords (36.1199, -80.0736).

Web research identified the CJ Logistics America Kernersville facility at
**700 N Main St, Kernersville NC 27284** (Yahoo Local listing for "CJ
Logistics America - Kernersville"; Indeed CJ Logistics America NC
locations). Geocoding API returned ROOFTOP precision at 36.1261, -80.0627;
satellite confirmed a large industrial / distribution building in the
Kernersville town fabric. (Note: 200 Forum Pkwy, Rural Hall NC is a
separate nearby CJ location, not this one.)

## Key views
- **z16/z17 overview:** Large warehouse / former-manufacturing building in
  a mixed urban setting — residential, commercial and other industrial
  buildings around it. N Main St runs along the NW; a water tower stands
  near the SE corner.
- **z18/z19 south face:** Row of dock doors along the south face with a
  truck court of marked trailer/auto parking stalls.
- **z19/z20 north face:** Auto parking lot and N Main St frontage on the
  office side.
- **z20/z21 SE entrance:** The truck driveway / gate at the SE corner.
- **Street View 2026-03:** A rolling/cantilever gate spans the truck
  driveway with a STOP sign and "PRIVATE PROPERTY NO TRESPASSING" signage;
  continuous chain-link perimeter fencing around the whole property. No
  staffed guard booth visible at the gate lane.

## Gate / guard-shack / dock determinations
- **truckGate: true** — 2026-03 Street View clearly shows a rolling gate
  across the truck driveway at the SE corner, with signage and full
  chain-link perimeter fencing.
- **guardShack: false** — No staffed booth at the gate lane. A small white
  peaked-roof building sits set back along the building line near the gate
  but does not read as a gate-side guard booth. Flagged uncertain.
- **remoteGs: true** — Gate present, no booth at the lane → remote
  badge/kiosk check-in inferred (medium confidence).
- **dockDoors: 25-50** — Older industrial/manufacturing-style building with
  a row of dock doors along the south face; ~35 doors estimated. Approx.
- **dropArea: 10-25 / dropYard: true** — South truck court has marked
  trailer/auto parking stalls; ~15 trailers visible.
- **shipRcvSeparate: false** — Docks on a single (south) face only.
- **drivewayShort: true** — Gate close to the public road with a modest
  truck court.

## Yard zones and counts
- **perimeter:** ~24 acres — building plus south truck court and north
  auto parking.
- **truckGate:** rolling gate at the SE corner driveway.
- **dropYards:** marked trailer parking in the south truck court.
- **dockAprons:** south-face dock apron.
- **railServed: false** — no rail spur.

## Web findings
- 700 N Main St documented as the CJ Logistics America Kernersville
  facility (Yahoo Local; Indeed NC locations; Greater Winston-Salem
  chamber member directory). CJ Logistics America also operates a separate
  facility at 200 Forum Pkwy, Rural Hall NC.

## Final confidence
**Medium.** Facility positively identified at 700 N Main St; the truck gate
and full perimeter fencing are clearly visible in recent (2026-03) Street
View. Confidence held at medium because the roster gave no address, and the
guard-shack determination is uncertain (a small building near the gate is
ambiguous). Dock and trailer counts are honest overhead estimates.
