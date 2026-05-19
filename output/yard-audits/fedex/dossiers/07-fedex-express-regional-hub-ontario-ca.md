# Deep-Audit Dossier — idx 07

## FedEx Express Regional Hub — Ontario CA

**Type:** Express regional hub (Ontario International Airport, So. California)
**Resolved coordinates:** 34.05000, -117.58400
**Confidence:** medium

## Location resolution
The roster geocode (34.062813, -117.592922, address "2710 E Airport Dr")
pointed near the ONT passenger terminals, not the cargo hub. Web research
confirmed FedEx Express opened a new ~251,000 sq ft Southern California regional
hub at Ontario International Airport in November 2020, replacing a 33-year-old
operation on the airport's south side. The new complex has 9 wide-body aircraft
gates, 14 feeder aircraft gates, and 18 truck docks. Satellite probing (z15-z19)
located the cargo sort building and FedEx jet apron on the south-central side of
the airport, just north of Airport Drive, at ~34.0500, -117.5840. Locked center
on the sort building.

## Key views
- **z15/z16 overview** — South cargo area of ONT: the FedEx apron with multiple
  parked aircraft, the cargo sort building, employee parking, and Airport Drive
  forming the southern boundary.
- **z17 hub** — Long N-S sort building with the aircraft apron along its
  east/airside face; employee parking to the west/landside.
- **z18/z19 apron** — Wide-body FedEx aircraft (DC-10/MD-11 type), rows of ULD
  containers staged on the ramp, ground service equipment and dollies, and a
  long row of feeder trailers along the southern apron edge.
- **z19 SW** — A connector road crosses Airport Drive into the hub — the
  vehicle access route.
- **Street View (Airport Drive, 2018-2025)** — A screen/retaining wall lines
  the hub's southern edge with FedEx aircraft visible behind it.

## Gate / guard-shack / dock determinations
- **Truck gate:** Marked `true` but qualified. The hub is inside the airport
  Air Operations Area; the connector road from Airport Drive enters secured
  airport land controlled at SIDA security points. No discrete FedEx truck-yard
  gate booth resolved in imagery — flagged uncertain.
- **Guard shack:** No FedEx guard booth identified at a property line. AOA
  access is badge/credential controlled → `remoteGs = true`.
- **Multi-step:** Airport perimeter security then FedEx ramp control implies a
  staged entry; marked `true`, flagged uncertain (no second booth imaged).
- **Dock doors:** FedEx press material confirms **18 truck docks** at the new
  facility — band `10-25`.
- **Drop area:** A long row of ~25-50 feeder trailers parked along the southern
  apron edge alongside ULD container rows.

## Yard zones and counts
- **Perimeter:** ~690 m N-S x ~970 m E-W → ~165 acres for the FedEx hub
  footprint (building, apron, staging, parking).
- **Truck gate:** boxed at the Airport Drive connector entrance.
- **Drop yard / staging / dock apron:** boxed along the southern and eastern
  apron edge where feeder trailers and ULDs stage.
- **Metrics:** dockDoorCount 18, trailersVisible ~35, trailerParkingCapacity
  ~60, truckGateCount 1, buildingCount 1, siteAreaAcres ~165, railServed false.

## Web findings
- New FedEx Express SoCal hub at ONT: 251,000 sq ft, opened November 2020;
  9 wide-body + 14 feeder aircraft gates, 18 truck docks; ~12,000 packages/hour
  sort capacity (flyontario.com, prnewswire, FreightWaves, AviationPros).
- FedEx had operated at ONT for 33 years on 18.5 acres on the airport's south
  side before the relocation/expansion.

## Final confidence
**Medium.** Facility positively identified and corroborated by FedEx's own
published specs (18 truck docks, gate counts). It is a secured airport
air-cargo hub, so truck-gate/guard-shack semantics differ from a standard yard
and could not be confirmed at street level. Trailer counts are overhead
estimates.
