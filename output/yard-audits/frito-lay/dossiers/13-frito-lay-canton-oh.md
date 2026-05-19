# Deep-Audit Dossier — Frito-Lay Canton OH (idx 13)

## Resolved location
- **Roster address was WRONG:** roster gave "5555 Sterilite St SE, Canton OH
  44730", which geocoded ~17.1 km off (movedMeters 17150) into a generic
  warehouse/distribution area in eastern Canton — not the plant.
- **Correct address:** 4030 16th St SW, Canton, OH 44710 — Frito-Lay North
  America, Rold Gold Foods Division (pretzels), production began 1967, ~150
  employees.
- **Locked center:** 40.78310, -81.42220
- **Confirmation:** Web research (IndustryNet, Yelp, D&B, PotatoPro) gave the
  16th St SW address. Positively confirmed in 2019 Street View: the building
  carries the Frito-Lay red sun logo and there is an orange/yellow Frito-Lay
  "Canton Plant" monument sign at the entrance.

## Key views
- **z17/z18 overview:** Compact manufacturing plant in a dense SW-Canton
  industrial district. Main building with rooftop process equipment and an
  on-site water tower; dock banks on the NW and south faces; trailer drop yard
  to the west; employee parking to the east; a rail line along the south
  perimeter.
- **z19/z20 docks:** Trailers backed into the NW-face docks; a covered loading
  area on the south face; trailer rows in the west drop yard plus a metal
  warehouse/garage building.
- **Street View (2019-05 / 2024-06 / 2025-09):** Frito-Lay-branded plant with
  the red sun logo and monument sign; employee parking and the building front
  open directly to the access road; trailers backed in at the docks. No barrier
  gate or guard booth observed at the entrance.

## Gate / guard-shack / dock determinations
- **truckGate = false (flagged).** No controlled barrier, checkpoint, or
  pinch-point resolved at the plant entrance — the office/parking area and
  building front are open to the access road. The west drop yard has partial
  fencing but no clear truck-gate barrier was visible.
- **guardShack = false.** No guard booth at any entrance. remoteGs = false (no
  gate to gate-control).
- **dockDoors = 25-50.** Dock banks on the NW face (trailers backed in) and a
  covered south-face loading area.
- **dropArea = 25-50 / dropYard = true.** Trailer drop yard west of the plant,
  ~2 rows (~40-50 trailers) plus dock-staged trailers.
- **shipRcvSeparate = true.** Dock clusters on physically separate building
  faces (NW and south).

## Yard zones and counts
- **Perimeter:** ~330 m N-S x ~395 m E-W, ~33 acres (plant + west drop yard).
- **Drop yards:** one west-side trailer yard.
- **Dock aprons:** NW-face apron and south-face apron.
- **Staging:** no distinct pre/post-gate staging area resolved.
- **yardMetrics:** dockDoorCount ~28, trailersVisible ~55, capacity ~70,
  truckGateCount 1 (uncontrolled entrance point), buildingCount 3,
  siteAreaAcres ~33, railServed false (rail runs along the south perimeter; no
  active spur into the plant confirmed).

## Web findings
- 4030 16th St SW, Canton, OH 44710; 330-477-3441. Frito-Lay North America,
  Rold Gold Foods Division — pretzel manufacturing. Plant began production in
  1967; ~150 employees. An older, comparatively small Frito-Lay plant.

## Final confidence: medium
Location is positively confirmed by on-building Frito-Lay branding. Imagery is
adequate; the gate/guard-shack determination (open vs controlled) and the
rail-spur and lane-count calls are flagged given resolution and Street View
coverage limits.
