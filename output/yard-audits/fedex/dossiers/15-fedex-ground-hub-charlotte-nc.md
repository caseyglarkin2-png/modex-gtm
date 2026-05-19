# Deep-Audit Dossier — FedEx Ground Hub, Charlotte NC (idx 15)

## Facility
- **Name:** FedEx Ground Hub - Charlotte NC
- **Type:** Ground regional sortation hub
- **Address:** 6604 CSX Way, Charlotte, NC 28214
- **Resolved coords:** 35.27270, -80.91810 (building/yard center)
- **Maps:** https://www.google.com/maps/@35.27270,-80.91810,400m/data=!3m1!1e3

## Location confirmation (Step 0)
The roster geocode (35.27311, -80.918347, ROOFTOP, movedMeters 12482) landed
directly on the FedEx cross-dock building rooftop — a large industrial
freight facility consistent with a Ground hub. Probing z16-z18 confirmed a
long NE-SW cross-dock building with continuous dock doors and an extensive
trailer drop yard, in the CSX intermodal industrial corridor of NW Charlotte.
2022 Street View along the access road shows FedEx-branded trailers behind
the perimeter fence and a FedEx dropbox at the entrance — positively the
right building. Locked center at the building/yard centroid.

## Key views
- **z17/z18 overview:** Long cross-dock building, large trailer drop yard to
  the E, employee car park to the SW, CSX rail line bordering the N edge.
- **z20 gate (fedex-15-gate-z20b):** The decisive view — a barrier across the
  W-side truck lane, a pinch-point with lane markings, "NO PARKING" painted
  on the apron, and a small detached structure with an orange/brown roof
  beside the lane (the guard booth).
- **z19 dock view:** Continuous dock doors on both long building faces with
  trailers backed in.
- **Street View 2022:** FedEx trailers and chain-link perimeter fence; FedEx
  dropbox/mailbox at the access road; trees partly obscure the gate from the
  public road but the satellite evidence is unambiguous.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled W-side entrance: barrier arm across the
  truck lane, pinch-point, lane markings, NO PARKING apron markings.
- **guardShack = true.** A small staffed booth (orange/brown roof, ~1-2
  vehicle footprint) sits directly beside the gate lane. remoteGs = false.
- **dockDoors = 50+.** Long cross-dock building, continuous doors both long
  faces; ~110 doors estimated (flagged uncertain).
- **dropArea = 50+ / dropYard = true.** Large E-side drop yard, many rows of
  parked trailers without tractors.

## Yard zones & counts
- **perimeter:** ~28 acres — rail line (N) to access road (S), gate/parking
  (W) to drop-yard edge (E).
- **truckGate:** W-side entrance pinch-point with guard booth.
- **dropYards:** one large area on the E side.
- **dockAprons:** two — the strips in front of each long building face.
- **staging:** paved holding area inside the gate before the docks.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~160,
  trailerParkingCapacity ~200, truckGateCount 1, buildingCount 1,
  siteAreaAcres ~28, railServed false (CSX line borders but does not enter).

## Web findings
Loc8NearMe / Waze list 6604 CSX Way as FedEx Ground (FXG-US/P282/Charlotte
Hub), open 24/7, not public, secured for employees, large parking lot —
consistent with a guarded sortation hub.

## Confidence
**High.** Building positively identified; gate and guard booth clearly
visible in z20 satellite. Door and trailer counts are honest overhead
estimates and flagged uncertain.
