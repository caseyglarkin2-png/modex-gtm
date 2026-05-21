# SalSon Logistics — Newark NJ Flagship Campus (888 Doremus Avenue)

**idx:** 1 · **Account:** SalSon Logistics · **Type:** Warehouse / Container Yard
**Resolved coordinates:** 40.701641, -74.131704
**Confidence:** High

## Location confirmation
The roster coordinates landed directly on a large industrial property in the
Port Newark / Doremus Avenue corridor — the canonical SalSon East Coast
flagship. salson.com publishes 888 Doremus Avenue, Newark NJ 07114 as its
Newark warehouse and container-yard address; the dossier describes a 55-acre,
multi-location campus with three yards and ~1M sq ft of Class-A warehouse
within a mile of Port Newark, operating 24/7 and processing ~2,000
containers/week. Satellite imagery matches exactly: a single very large
warehouse building (~1M sq ft footprint), extensive container/chassis yards
on multiple sides, an office building at the SE, and an active rail yard
along the north edge. Location locked with high confidence.

## What the key views showed
- **Wide (z16/z17):** The campus sits between an active multi-track rail yard
  (north) and the elevated NJ Turnpike spur (south). Container and trailer
  storage lots wrap the main warehouse on the north, east and south sides.
- **Tight (z18/z19):** The main warehouse roof has a saw-tooth dock line along
  its south face with many trailers backed in. The container/trailer drop
  yards are dense and clearly active.
- **Gate (z20):** At the SW corner (~40.7010, -74.1326) where the property
  meets Doremus Avenue there is a yellow-painted entry apron with painted
  STOP lines and a yellow steel portal/OCR gantry spanning the truck lanes.
- **Street View (Doremus Ave, 2019 + 2024 panos):** Confirms the gated
  entrance — a yellow steel portal gantry over the truck lanes, chainlink
  perimeter fencing on both sides, container stacks visible behind the fence,
  and a small structure beside the gate consistent with a check-in booth.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled truck entrance off Doremus Ave: yellow
  portal gantry, painted STOP lines, fenced pinch-point. Unambiguous.
- **guardShack = true.** A small booth-scale structure sits beside the gantry
  at the gate apron (visible in z20 satellite and Street View). A 24/7 port
  drayage container yard handling ~2,000 containers/week would be staffed at
  the gate. `remoteGs` is therefore false.
- **multiStep = true.** The yellow OCR/portal gantry functions as a first
  inspection/check stage; drivers then proceed into the interior container
  yard / dock staging — a gate-then-yard-control flow typical of a
  PINC-managed container yard (SalSon publicly runs PINC YMS here).
- **dockDoors = "50+".** Loading docks run along the south face of the main
  warehouse with numerous trailers backed in; estimate ~70 doors.

## Yard zones and counts
- **perimeter:** whole ~53-acre campus bounded by the rail yard (N), Doremus
  Ave (W), the auto/trailer parking (E) and the Turnpike spur (S).
- **dropYards:** two large container/chassis drop areas — one south of the
  warehouse, one north toward the rail yard — packed with multicolored
  containers and trailers (z20 confirms 50+ band, capacity ~600 units).
- **dockApron:** strip along the south building face.
- **railServed = true:** active rail yard with siding directly along the
  north property line.
- **multipleFacilities = true:** ~1M sq ft warehouse plus separate office
  building and maintenance/secondary cluster on the campus.

## Web findings
salson.com Newark warehouse and container-yard pages confirm drayage,
chassis management, container yard, transloading, FTZ, and food-grade
warehousing at this address. Phone (973) 986-0200. Account dossier:
55-acre campus, three yards, ~1M sq ft warehouse, 24/7 operation, ~150
SalSon drivers in the port daily, ~100,000 containers/year, PINC (Kaleris)
YMS deployed here.

## Final confidence
**High.** Facility unambiguously identified and corroborated by company
sources; gate, guard booth, docks, drop yards and rail all clearly visible.
Truck-scale presence and exact exit-lane count are the only soft points
(flagged uncertain).
