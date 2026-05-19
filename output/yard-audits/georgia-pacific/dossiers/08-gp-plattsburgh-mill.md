# Deep-Audit Dossier — GP Plattsburgh Mill, Plattsburgh NY (idx 08)

## Resolved location
- **Locked center:** 44.7112, -73.4525
- **Address:** Mill on Margaret Street, City of Plattsburgh, NY 12901 (roster
  lists 1 Georgia-Pacific Rd; web sources give 327 Margaret St)
- The roster point (44.710302, -73.451029, ROOFTOP) landed on the mill. Step-0
  satellite confirmed a large (~1 million sq ft) tissue mill on the west shore
  of Lake Champlain — the former Vanity Fair Paper Mill, GP-owned since 1963,
  producing Quilted Northern bath tissue.

## Key views
- **z16/z17 overview** — Dense industrial complex inside the city: a large
  warehouse at the north, the process mill in the center, an office building
  on Margaret St, rail along the west edge, residential and commercial fabric
  on all sides.
- **z18 warehouse crops** — Large NW warehouse with dock banks; trailers staged
  along the SW face.
- **z19 SW crops** — Trailer rows inside a fenced lot near the SW gate.
- **Street View (SW plant road, Oct 2022)** — A chain-link perimeter fence
  with green privacy slats and a swing/sliding gate clearly labeled **"GATE 1"**;
  trailers parked just inside the fence; no staffed booth at the gate.
- **Street View (Margaret St, Aug 2023)** — Brick office building; a rail car
  at a mill rail dock confirming rail service.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE** — Labeled "GATE 1" swing gate in the chain-link
  perimeter fence on the SW plant road.
- **guardShack: FALSE / remoteGs: TRUE** — No staffed guard booth at GATE 1;
  it is an unattended numbered swing gate, consistent with remote/badge access.
- **drivewayShort / backupSensitive: TRUE** — Tight urban-edge geometry: the
  gate opens onto a narrow plant road with little stacking room; a truck queue
  would spill onto the road.
- **dockDoors: 25-50** — Dock banks on the NW warehouse and process buildings;
  ~28 estimated, partly obscured (flagged uncertain).
- **dropArea: 25-50 / dropYard TRUE** — Multiple trailer-parking rows inside
  the SW fence and along the warehouse.
- **shipRcvSeparate: TRUE** — Distinct dock clusters on the warehouse vs the
  process buildings.
- **railServed: TRUE** — Rail line along the west edge entering the mill; rail
  car at a mill dock in Street View.
- **urbanRural: Urban** — Inside the City of Plattsburgh, dense residential and
  commercial surroundings.
- **multipleFacilities: TRUE** — Multi-building campus.

## Yard zones / counts
- Perimeter geofence (~128 acres) covers the in-city mill footprint.
- truckGate box at the SW "GATE 1".
- dropYards boxed at the SW fenced lot and the warehouse SW apron.
- dockApron box along the NW warehouse.
- yardMetrics: ~28 dock doors, ~45 trailers visible, ~70 capacity, 2 truck
  gates (signage implies more than one), ~14 buildings, ~128 acres, rail-served.

## Web findings
- ~1 million sq ft tissue mill on Margaret St; former Vanity Fair Paper Mill,
  GP-owned since 1963; 24/7 operation producing Quilted Northern toilet paper.
  Recent investment in bath tissue production.

## Confidence
**High** — facility positively identified; truck gate ("GATE 1"), fencing,
trailers and rail clearly visible. Dock-door count, exact lane counts, and
truck-scale presence are the uncertain items.
