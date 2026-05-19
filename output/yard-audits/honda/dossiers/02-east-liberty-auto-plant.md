# Deep-Audit Dossier — Honda East Liberty Auto Plant (ELP)

**Facility:** Honda - East Liberty Auto Plant (ELP), East Liberty OH
**Type:** Auto Assembly Plant
**Address:** 11000 State Route 347, East Liberty, OH 43319
**Resolved center:** 40.32850, -83.54750
**Confidence:** High

## Location confirmation
Roster coordinates (40.329087, -83.549523) landed near the plant center
(geocode moved only ~1.4 km). Satellite probes (z15-z20) confirm a large auto
assembly campus: main assembly building, separate logistics buildings,
finished-vehicle staging lots, retention ponds, and a vehicle test track on
the SW corner — all consistent with Honda ELP at 11000 SR-347.

## Key views
- **z15 overview:** Large assembly building, finished-vehicle lots to the east,
  employee parking and test-track loop to the SW.
- **z16/z18 north & south:** Trailer rows along the north building face and a
  very large multi-row trailer drop yard on the S/SW side with retention ponds.
- **z18 east:** Finished-vehicle staging lot (rows of new cars).
- **z16 south:** Rail spur with staged railcars running south out of the plant
  — facility is rail-served.
- **Street View:** Multiple probes returned ZERO_RESULTS within 400 m of the
  plant; the campus is private with no public Street View reaching the gates.
  Only the wooded SR-347 buffer is imaged.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A major OEM auto assembly plant runs as a fully secured
  private campus with controlled truck entrances. No public Street View reaches
  the gates; treated true based on facility type and the gated road network.
- **guardShack: true** — Guarded entry standard for a high-security auto plant;
  not individually imaged. Listed uncertain.
- **remoteGs: false** — Manned guarded entry assumed.
- **dockDoors: 50+** — Dock banks with trailers backed in on multiple long
  building faces; overhead estimate ~70 doors.
- **dropArea / dropYard: 50+ / true** — Large dedicated trailer drop yards on
  the south and north faces; 150+ trailers visible.
- **shipRcvSeparate: true** — Dock activity on physically separate building
  faces (north logistics docks vs south/east docks).
- **multipleFacilities: true** — Campus of assembly plus logistics buildings,
  plus an on-site vehicle test track.
- **railServed: true** — Rail spur with staged railcars enters from the south.
- **scale: false / multiStep: false** — No truck scale or second checkpoint
  clearly identified.
- **urbanRural: Rural** — Open farmland setting near East Liberty.

## Yard zones & counts (overhead estimates)
- Perimeter: ~560 acres secured campus (fence line approximated).
- Drop yards: 2 major zones boxed (S/SW trailer rows, N building-face rows).
- Dock aprons: 2 banks boxed.
- dockDoorCount ~70, trailersVisible ~180, trailerParkingCapacity ~260,
  truckGateCount 2, buildingCount ~5.

## Web findings
ELP is one of Honda's HLNA-served Ohio assembly plants; americanautoworker.com
and the roster note an East Liberty crossdock. The heavy trailer drop-yard
footprint is consistent with Honda's as-needed supplier logistics model.

## Final confidence: High
Facility identity, scale, dock/drop bands, rail service and campus structure
are clear from imagery. Gate lane geometry and guard-shack specifics are
inferred from facility type — flagged uncertain.
