# Deep-Audit Dossier — NFI Distribution Center, 910 Nestle Way, Breinigsville PA

- **Facility:** NFI Distribution Center Breinigsville PA (910 Nestle)
- **Type:** Distribution Center (cross-dock terminal)
- **Address:** 910 Nestle Way, Breinigsville, PA 18031
- **Resolved center:** **40.56815, -75.65055** (building centroid)
- **Method:** deep-audit · **Confidence:** high

## Location confirmation
The supplied approximate coordinates (40.567315, -75.649346) proved to be a
Google **ROOFTOP** geocode of 910 Nestle Way (returned lat 40.5673153,
lng -75.6493462) — but that point lands on the car-parking lot / internal road
at the **southeast edge** of the parcel, not the building. I re-centered the
audit on the building itself at **40.56815, -75.65055**.

Identity was confirmed three ways:
1. **Google geocode** — rooftop match to "910 Nestle Way, Breinigsville, PA 18031."
2. **NFI / LoopNet facility profile** — 910 Nestle Way is a **cross-dock terminal**
   with **47 dock doors w/ levelers**, **51 off-wall trailer parking**, 24-ft
   ceiling, ~350 car spaces, small (~500 SF) office. The overhead imagery shows
   exactly that: a long, narrow building with loading doors on **both** long
   faces (true cross-dock) and large trailer drop yards.
3. **Disambiguation from the sister site (idx 01):** the large
   single-footprint DC to the **northeast** (visible upper-right in the z16/z17
   frames) is a *different* building. I deliberately audited the long, narrow
   cross-dock building to its southwest — the one the 910 Nestle Way address
   pins to.

## What each key view showed
- **z15 / z16 wide:** Edge-of-town industrial park (Liberty Park / Nestle Way)
  surrounded by farm fields and woods; several large warehouses. 910 is the long
  cross-dock building center-left.
- **z17 / z18 building:** Cross-dock terminal running roughly E–W (long axis
  bearing ~105°, rotated off north). Trailers backed into docks on **both** the
  north and south faces. Large paved staging lot to the east; extensive trailer
  drop-yard rows to the NE and E.
- **z19 west/east ends:** West end joins a larger warehouse block; green
  dock-leveler pads visible along the south wall. East end terminates at a
  curving internal road beside the drop yards.
- **z19 / z20 south driveway:** A single open driveway descends from the yard
  across a grass buffer to the public road (Nestle Way). Standard curb-cut +
  painted stop bar — **no barrier arm, no gate, no booth**.
- **Street View:** No coverage on the immediate access road (private park, set
  back behind a farm field). Public-road panes to the east and south show only a
  distant chain-link perimeter line across a lawn and a residential street —
  insufficient to read a gate, but confirming perimeter fencing exists.

## Gate / guard-shack / dock determinations
- **truckGate = FALSE.** The south driveway meets Nestle Way as an open paved
  connection with no barrier arm, sliding/swing gate, or checkpoint pinch-point.
  Eastern access junctions are likewise open. The trailer yard is open-access.
- **guardShack = FALSE.** No 1–3-stall booth structure found at any entrance in
  z19/z20 imagery of the south driveway, the eastern access road, or the
  NE drop-yard road.
- **remoteGs = FALSE.** No gate exists, so by definition remoteGs is false.
- **dockDoors = "25-50".** Cross-dock with doors on both long faces; NFI flyer
  states 47 dock doors. Banded 25-50.
- **dropArea = "50+".** Dedicated drop yards (NE diagonal rows, east cluster,
  south-edge row) hold well over 50 parked trailers in the imagery.
- **shipRcvSeparate = TRUE.** Cross-dock = inbound and outbound at physically
  separate dock banks on opposite building faces.

## Yard zones & counts (from overhead imagery)
- **perimeter:** oriented 8-vertex ring tracing the fenced parcel (building +
  aprons + drop yards + staging). Shoelace area ≈ **30.5 acres**.
- **truckGate zone:** quad over the south driveway connection to Nestle Way.
- **dockAprons:** two long thin quads hugging the north and south dock walls at
  the building's ~105° angle.
- **dropYards:** three rings — NE diagonal trailer rows, east cluster, and the
  south-edge row.
- **staging:** paved internal lot east of the building (post-gate staging).
- **Metrics:** dockDoorCount 47 (flyer-corroborated); trailersVisible ~150;
  trailerParkingCapacity ~180 (est); truckGateCount 2 (both open); buildingCount
  1; siteAreaAcres 30.5; railServed false (no spur).

## Web findings
- NFI leases **254,000 SF** here; **Ocean Spray** is the anchor customer
  (long-running NFI/Ocean Spray Lehigh Valley partnership).
- LoopNet/NFI profile: cross-dock terminal, **47 dock doors w/ levelers**,
  **51 off-wall trailer parking**, 24-ft clear, ~350 car spaces, ~500 SF office.
- Sits off I-78 Exit 49 in the Nestle Way / Liberty Park industrial cluster
  (the sister NFI DC at 200 Nestle Way — 384,500 SF, built 2021 — is a separate
  building).

## Final confidence
**High.** Building identity is triple-confirmed (rooftop geocode + flyer specs +
cross-dock morphology) and the open, ungated yard is clearly readable in z19/z20
satellite imagery. Lane counts, exact trailer capacity, and the connectivity
inference are the only soft fields (flagged in `uncertainFields`); the absence of
on-site Street View prevents a ground-level read of the entrance but the overhead
evidence for "no gate / no guard shack" is unambiguous.
