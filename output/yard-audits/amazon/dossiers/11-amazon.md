# Deep-Audit Dossier — Amazon CMH1 Fulfillment Center, Etna OH (idx 11)

**Facility:** Amazon CMH1 Fulfillment Center
**Type:** Fulfillment Center (large multi-story Amazon FC)
**Address:** 11999 National Rd SW, Etna, OH 43062
**Resolved center:** 39.9525, -82.7122
**Maps (satellite):** https://www.google.com/maps/@39.9525,-82.7122,400m/data=!3m1!1e3
**Method:** deep-audit (satellite z16-z19 + Street View)
**Confidence:** high

---

## Step 0 — Location confirmation
The supplied approximate coords (39.9534, -82.7133) landed on the north edge of
a large white-roof distribution building. Web search confirmed the address
"11999 National Rd SW, Etna, OH 43062" maps to Amazon Fulfillment Center CMH1
(Waze/Pataskala Chamber/Warehouse Worker Network listings). Satellite at z16/z17
showed one very large multi-story FC bounded by National Rd SW on the north and
I-70 on the south — consistent with a large Amazon sortable FC. Locked center at
39.9525, -82.7122 (the supplied point was ~120m too far north).

## Site layout
- One very large multi-story fulfillment building, long axis NW-SE.
- North: National Rd SW with a deep grass setback.
- South: I-70 with a wooded buffer and a retention pond at the SW/SE corners.
- West: residential treeline buffer.
- East/SE: stormwater ponds and woods.
- East of the building: an extensive employee-parking grid (cars, not trucks).
- SW/west building face: the primary truck dock — continuous trailer rows.
- SE: a dedicated trailer drop yard with angled stalls.

## Key views and what they showed
- **NE entrance (Street View 2024-07/08, pano ReUzacbaFDYuKmXYl7MuiA @
  39.9563,-82.7099):** the main signalized drive off National Rd SW runs straight
  south into the employee lots and building. Open multi-lane road, no barrier arm,
  no guard booth, no checkpoint. A small sign on the shoulder, nothing else.
- **National Rd Street View (2024-07):** confirms the signalized intersection and
  the wide open entrance throat — no gate at the public road.
- **NW dock drive (Street View 2016-10):** a quieter west access road heading SE
  toward the building's dock corner; 10 mph sign, open road, no gate visible.
- **z19 SW/west dock face:** two long continuous banks of trailers backed into
  dock doors along the entire SW wall, with a wide dock apron drive lane. 60+
  trailer positions visible across the crops.
- **z18/z19 SE corner:** a dedicated drop yard, ~40-50 angled trailer stalls
  filled with trailers, bounded by retention ponds.
- **z17/z18 east side:** car parking grid only — employee parking, not truck yard.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Neither public-road entrance has a barrier arm, sliding
  gate, or pinch-point checkpoint. Both are open. (Amazon FCs of this type run
  truck check-in internally at the yard, not at a road gatehouse.)
- **guardShack = false.** No staffed booth at either entrance; the entrance
  Street View shows an open lane with no booth.
- **remoteGs = false.** Requires a controlled truck gate to be true; there is no
  road gate here.
- **dockDoors = 50+.** Two long dock banks along the SW/west face, 60+ positions
  per crops, plus additional doors. Easily 50+.
- **dropArea / dropYard = 50+ / true.** Dedicated SE drop yard (~40-50 angled
  stalls) plus dock-side trailer rows.

## Yard zones traced
- **perimeter** — 6-vertex ring around the property inside the
  treeline/pond/road boundary (~92.8 acres).
- **truckGate** — quad over the NE entrance throat at National Rd SW.
- **dropYards** — one ring over the SE angled-stall drop yard.
- **dockAprons** — two rings hugging the SW/west dock banks at the building's
  NW-SE angle.
- **staging** — null (no distinct pre/post-gate staging stall block; interior
  aprons handle holding).

## yardMetrics (overhead estimates)
- dockDoorCount: ~110 (two long SW/west banks)
- trailersVisible: ~130 (dock-backed + drop yard)
- trailerParkingCapacity: ~220 (drop yard + dock rows)
- truckGateCount: 2 (NE main drive, NW dock drive — both open)
- buildingCount: 1
- siteAreaAcres: 92.8 (from perimeter polygon)
- railServed: false

## Web findings
Address and CMH1 designation confirmed via multiple business listings (Waze
live-map, Pataskala Area Chamber member listing, Warehouse Worker Network,
Foursquare, D&B). Sortable Amazon FCs of this class run ~800k+ sq ft; exact
square footage not published. No public detail contradicting the open-campus,
no-gatehouse read from imagery.

## Final confidence: HIGH
Facility unambiguous, recent (2024-2025) Street View at the decisive entrance,
high-res satellite for docks and drop yard. Lower-confidence items flagged in
uncertainFields: entry/exit lane counts (estimated from overhead), ship/receive
separation, and trailer-parking capacity.
