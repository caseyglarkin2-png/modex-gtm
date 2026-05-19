# Deep-Audit Dossier — Home Depot RDC, Monroe OH (idx 5)

**Facility:** Home Depot RDC #5084 (Rapid Deployment Center)
**Address:** 500 Gateway Blvd, Monroe, OH 45050
**Resolved center:** 39.43460, -84.32130
**Confidence:** High

## Location resolution
The roster geocode (39.434303, -84.321602, ROOFTOP, moved 337 m) landed
directly on the correct building. The site sits inside the "Gateway"
business park north of Monroe, OH (Warren County), between I-75 and an open
agricultural belt to the east. Web confirmation: multiple business listings
(Foursquare, Waze, SupplierWiki HD DC list) place HD RDC #5084 at 500 Gateway
Blvd, Monroe. The target is the central of three large distribution buildings
in the park — a single, very long (~580 m) cross-dock structure with trailers
backed in along both long faces. The west building and other park buildings
are separate tenants and were excluded.

## What the imagery showed
- **Building:** One long, narrow cross-dock RDC running roughly N–S, ~580 m
  long and ~75 m wide. Continuous loading-dock doors line BOTH the east and
  the west faces — the classic RDC "flow-through" cross-dock layout. Estimated
  ~220 dock doors total across both faces (z18/z19 imagery shows an unbroken
  rhythm of bays with trailers backed in solid).
- **East apron (z19):** Docks fully occupied by backed-in trailers, plus a
  second parallel row of parked trailers in the apron lane — a working drop
  line. The east edge is bordered by a drainage channel / pond and then open
  field.
- **North end (z19):** A large marked trailer drop yard packed with trailers,
  with employee car parking immediately NW of it.
- **South end:** The building's south end terminates against a retention pond;
  trailers staged in the apron wrap the pond edge.
- **Setting:** Suburban industrial — multiple large DC buildings, retail, and
  I-75 nearby. Classed Urban.

## Gate / guard-shack determination
Public Street View covers only the Gateway-park public roads; the RDC's own
truck entrance and check-in are internal to the private campus and not
directly imaged. However, **trucker reviews of RDC 5084 are explicit**: drivers
describe a gated check-in with a **"guard shack"** staffed by check-in
personnel, in-gate processing of **10–20 minutes per truck**, and **10–12
trucks queued at the entrance** waiting to be in-gated.

- **truckGate: TRUE** — controlled, staffed in-gate check-in confirmed by
  driver reviews; the campus ring road is the controlled truck approach.
- **guardShack: TRUE** — drivers explicitly reference a "guard shack."
- **remoteGs: FALSE** — a staffed booth is present, so not a remote/kiosk gate.

## Yard zones & counts
- **Dock doors:** 50+ band (~220 estimated, both faces).
- **Drop area:** 50+ band — north drop yard plus the east-apron trailer row.
- **Trailers visible:** ~300 across docks, drop yard, and aprons.
- **Trailer parking capacity:** ~360.
- **Truck gates:** 1 controlled campus entrance.
- **Buildings:** 1 (target RDC only).
- **Site area:** ~73 acres (perimeter box ~820 m × ~360 m developed footprint).
- **Rail:** Not served — no spur enters the property.

## Other classification notes
- **shipRcvSeparate: TRUE** — inbound and outbound run from physically separate
  dock banks on opposite long faces.
- **drivewayLong / postGateStaging / preGateStaging: TRUE** — the deep ring-road
  approach plus the 10–12-truck reported queue indicate ample staging both
  before and after the gate.
- **fastLaneOpportunity: TRUE** — wide ring-road apron with unused paved width
  at the campus entrance; the 10–20 min in-gate time is a clear bypass-lane
  use case.
- **dropYard: TRUE** — dedicated marked trailer-storage lot at the north end.
- **scale / multiStep / multipleFacilities: FALSE** — no weigh platform, no
  second checkpoint, single building.

## Web findings
Driver reviews flag slow in-gate processing (10–20 min) and entrance queueing
(10–12 trucks) — a textbook yard-throughput pain point and a strong YardFlow
hook for an HD RDC. SupplierWiki HD DC list and HD's own store locator confirm
the facility identity and DC number (#5084).

## Final confidence
**High.** Building positively identified, layout and yard zones clearly read
from satellite at z16–z19, and the gate/guard-shack call is corroborated by
explicit driver reviews. Lane counts are estimates (booth not imaged) and are
flagged as uncertain.
