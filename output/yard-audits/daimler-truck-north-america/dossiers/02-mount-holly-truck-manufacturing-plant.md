# Deep-Audit Dossier — Mount Holly Truck Manufacturing Plant (Mount Holly, NC)

**Account:** Daimler Truck North America · **Roster idx:** 2
**Type:** Truck assembly plant (Freightliner medium-duty Business Class M2 / SD)
**Method:** deep-audit · **Confidence:** medium

## Location resolved
- Roster coords (35.322672, -81.00161) were geocoded GEOMETRIC_CENTER and moved
  2149m, so treated as approximate. They landed inside a large industrial
  campus near the Catawba River, ringed by residential subdivisions.
- Web search (DTNA career-locations page, Waze, FreightWaves) confirms the
  Freightliner Mount Holly truck plant at 1800/1803 N Main Street, Mount Holly
  NC 28120 — established 1979, building medium-duty M2/SD trucks and e-coated
  cabs for Western Star. The campus has two large buildings joined by an
  internal road: a sprawling SW main assembly building and a large NE
  rail-served building.
- Working center: **35.323000, -81.001500** (between the two buildings).

## Key views
- **z14 / z16 wide** — Two-building industrial campus surrounded by woods and
  suburban residential subdivisions; Catawba River to the east.
- **z16 / z17 buildings** — SW: large multi-roof assembly building with admin
  block and big employee lots on the NW. NE: long rail-served rectangular
  building with materials/lumber staged outside and an active quarry pit to its
  SE.
- **z19 drop yard** — Dedicated trailer drop yard between the buildings; many
  rows of dropped (tractor-less) trailers.
- **z19 dock areas** — Trailers backed against the NW and S/SE faces of the SW
  building; extensive yard laydown and storage tanks.
- **Street View** — Only residential subdivision roads (Augustus St area, panos
  2023-04) carry coverage; the plant access road is set back behind a wooded
  buffer and the gate itself is not visible from any public pano.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A controlled industrial campus; the access road enters
  from the residential road network to the NE and runs through a wooded buffer
  to the yard. The gate is set true on the basis of it being a fenced
  manufacturing campus with a single channelized access road, with the truckGate
  box placed at the access-road head.
- **guardShack = false / remoteGs = true.** The gate is not reachable in Street
  View, so a guard booth could be neither confirmed nor ruled out. Defaulted to
  remote check-in; flagged uncertain.
- **dockDoors = 25-50.** Trailers backed against multiple faces of the SW
  building; estimate 25-50 doors, flagged uncertain because some faces are
  partially obscured.
- **dropArea = 50+ / dropYard = true.** Clear dedicated trailer drop yard
  between the two buildings with many rows of dropped trailers.

## Yard zones and counts
- **perimeter** — Full campus, roughly 35.3185-35.3310 N by -81.0058 to
  -80.9955 W, about 130 developed acres (the box includes wooded buffer).
- **truckGate** — Head of the NE access road off the residential street grid.
- **dropYards** — One box covering the inter-building trailer drop yard.
- **dockAprons** — One box covering the SW building's S/SE dock face.
- **staging** — null.
- yardMetrics: ~35 dock doors, ~130 trailers visible, ~200 trailer capacity,
  1 truck gate, ~4 buildings, ~130 acres, rail-served = true.

## Web findings
- DTNA / Freightliner career page: established 1979, medium-duty M2 and SD
  Business Class production plus e-coated Western Star cabs. FreightWaves
  reported the 700,000th truck milestone here. MarkLines lists it as an active
  OEM assembly plant. No public detail on gate or guard-booth configuration.

## Final confidence
**medium** — facility positively identified and major zones (perimeter, drop
yard, docks) are clear, but the truck gate sits behind a wooded buffer with no
Street View coverage, so the guard-shack determination, lane counts, and any
truck scale could not be confirmed. Those fields are flagged uncertain.
