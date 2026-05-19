# Deep-Audit Dossier — idx 16

## FedEx Ground Hub — Independence KY (Northern Kentucky / Cincinnati)
- **Type:** Ground regional sortation hub
- **Address:** 11000 Toebben Dr, Independence, KY 41051
- **Resolved center:** 38.94100, -84.61700
- **Confidence:** high

## Location confirmation
The roster geocode (38.940144, -84.61537, GEOMETRIC_CENTER, moved 13.2 km) landed
on the correct industrial park but not precisely on the building. Step-0
satellite probing (z15-z18) of the Toebben Drive industrial park in Independence
identified a large cross/H-shaped sortation building. Street View from the
internal access road (pano 38.9408, -84.6126, captured 2024-10) shows a FedEx
Ground tractor-trailer on the access road and the building face lettered
"FedEx". A second pano shows a FedEx Ground over-the-road trailer
("fedex.com / 1.800.GoFedEx / FedEx Ground") at the gate approach. Web research
(SCI Steel project page) confirms the "FedEx Ground NOKY (Northern Kentucky) Hub
Expansion" at 11000 Toebben, Independence, KY 41051. Positively the right site.

## Key views
- **z16 footprint** — full fenced property: a large white-roofed sortation
  building, dense trailer rows on the W/NW, employee parking and offices on the
  S, and a large eastern drop/parking lot across the access road.
- **z19 NW dock view** — long building faces lined with dock doors, trailers
  backed in along multiple banks in dense rows: a high-throughput sort hub.
- **z19 S face** — offices/admin (green roof sections) fronting a large
  employee parking lot; not a dock face.
- **z20/z21 gate** — the truck entrance where the access road meets the
  property.

## Gate / guard-shack / dock determinations
- **truckGate = true.** z20/z21 satellite clearly shows a cantilever sliding
  gate spanning the inbound truck lane, chain-link perimeter fence with
  barbed-wire top on both sides (also confirmed in Street View along the access
  road), vehicles queued at the gate. Controlled entrance.
- **guardShack = true (flagged uncertain).** A small white structure (~1
  vehicle footprint) sits beside the lane just inside the gate. Footprint is
  small enough it could be an unstaffed kiosk; classified as a guard shack given
  this is a major staffed sortation hub. `remoteGs` therefore false.
- **dockDoors = "50+".** Dock doors with trailers backed in run along multiple
  long faces of the building — well over 100 positions; banded 50+.
- **dropArea = "50+".** Two distinct dense trailer-storage lots (NW of the
  building, and the large eastern lot across the access road).

## Yard zones & counts
- **perimeter:** whole fenced property incl. building, NW trailer yards, S
  employee lot, and eastern drop lot — ~110 acres.
- **truckGate:** single gate/booth area on the NE access road.
- **dropYards:** NW trailer-storage rows; large eastern drop/parking lot.
- **dockAprons:** trailer-backing strips along the N/W building faces.
- **staging:** paved south apron inside the gate before docks (postGateStaging).
- **yardMetrics:** dockDoorCount ~160, trailersVisible ~220, capacity ~320,
  1 truck gate, 2 buildings, ~110 acres, no rail spur.

## Web findings
SCI Steel and BSC contractor pages document a 153,600 sq ft NOKY hub expansion.
Waze/Yelp/D&B list it as FedEx Ground NOKY 0406, an active ground sortation hub.
One directory marks the retail counter "CLOSED" but the hub remains operational.

## Final confidence
High. Facility unambiguously identified and corroborated by Street View FedEx
branding and web sources. Gate confirmed by satellite; guard-shack call and
exact lane counts flagged as the only soft points.
