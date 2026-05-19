# Deep-Audit Dossier — idx 17

## FedEx Ground Hub — Nashville TN
- **Type:** Ground regional sortation hub
- **Address:** 3301 Knight Dr, Nashville, TN 37207
- **Resolved center:** 36.23900, -86.79350
- **Confidence:** high

## Location confirmation
The roster geocode (36.237023, -86.797035, GEOMETRIC_CENTER, moved 5.2 km)
landed on the correct property edge. Step-0 satellite probing (z16-z18)
identified, just NE of the geocode, a long sortation building with dock doors
and trailers backed in on both long faces — the unmistakable FedEx Ground hub
form — adjacent to the Briley/Ellington Parkway. White FedEx delivery vans are
parked in rows in the SW lots. Web research (Yelp, Nashville Chamber, Waze)
confirms FedEx Ground at 3301 Knight Dr, Nashville TN 37207, a 24-hour package
hub. Positively the right site.

## Key views
- **z17 full footprint** — long NE-SW sort building, a parallel secondary
  building to the N, employee/van parking to the SW, trailer drop yards to the
  NE and SW, perimeter road and fence.
- **z18 dock view** — dock doors with trailers backed in along both long
  building faces; high-throughput sort hub.
- **z18 NE** — large trailer drop yard with dense rows of parked trailers.
- **Street View (Knight Dr, 2019)** — the truck entrance.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View up Knight Dr shows a controlled, fenced
  truck entrance: a check-in canopy spanning the drive lanes, perimeter
  chain-link fencing, a US flag. Trucks pass a checkpoint to enter the yard.
- **guardShack = true.** A low building with a green awning sits beside the
  entry lanes, with a canopy over the check-in lanes — a staffed gate/security
  building. `remoteGs` therefore false.
- **dockDoors = "50+".** Dock doors with trailers backed in run along both
  long faces of the main building — well over 100 positions; banded 50+.
- **dropArea = "50+".** Two trailer drop areas — a large NE drop yard with
  dense rows and SW trailer staging — over 50 combined.

## Yard zones & counts
- **perimeter:** whole fenced property incl. building, trailer yards, and SW
  parking — ~75 acres (the SW blue-roof building is a separate parcel,
  excluded).
- **truckGate:** canopy/guard-building checkpoint on the SW (Knight Dr) side.
- **dropYards:** NE drop yard; SW trailer staging rows.
- **dockAprons:** trailer-backing strips along both long building faces.
- **staging:** paved apron inside the gate before the docks (postGateStaging).
- **yardMetrics:** dockDoorCount ~150, trailersVisible ~180, capacity ~260,
  1 truck gate, 3 buildings, ~75 acres, no rail spur.

## Web findings
Yelp/Nashville Chamber/Waze list it as an active FedEx Ground hub at 3301
Knight Dr, open 24 hours, not open to the public. Driver notes warn GPS may
route trucks onto restricted residential roads, consistent with the single
controlled entrance off Knight Dr.

## Final confidence
High. Facility unambiguously identified — FedEx Ground sort-hub form, branded
vans, web corroboration. Gate and guard-building confirmed by Street View. Only
the exact in/out lane split at the canopy is soft, flagged uncertain.
