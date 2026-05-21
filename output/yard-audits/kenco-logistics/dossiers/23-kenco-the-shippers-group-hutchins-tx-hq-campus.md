# Deep-Audit Dossier — Kenco / The Shippers Group, Hutchins TX HQ campus (idx 23)

## Resolved location
- Address: 1015 W Wintergreen Road, Hutchins, TX 75141 (TSG "WG-2" facility)
- Locked center: 32.62620, -96.71600 (center of the main warehouse)
- Roster coordinate (32.625775, -96.716523, ROOFTOP) landed on the south edge
  of the warehouse; confirmed correct building via satellite + web search.
- This is the former corporate HQ and a 560,000 SF distribution warehouse of
  The Shippers Group; TSG was acquired by Kenco Logistics in January 2024.

## Key views
- z16 wide: large warehouse SW of two big DC buildings in a DFW logistics
  park along I-45 in Hutchins; the building at the roster point fronts W
  Wintergreen Road on its south side.
- z18/z19 east face: long bank of dock doors on the east face with trailers
  backed in; drop trailers also parked along the NE yard.
- z18 north: a rail line runs along the NW edge of the property with a spur
  into the site.
- Street View 2026-02 / 2026-04: chain-link perimeter fence runs all the way
  around the dock/yard area; the SE truck entrance driveway has a sliding gate.
  A flagpole and a long low metal building sit beside the entrance.

## Gate / guard-shack / dock determinations
- **truckGate: true** — the yard is fully fenced ("secured yard" per TSG's own
  facility page) and the SE truck entrance driveway is closed by a sliding
  chain-link gate. Clear controlled entrance.
- **guardShack: false** — no dedicated 1-3-car guard booth at the gate. There
  IS a long metal building beside the entrance, but its size/shape indicates an
  office / annex / maintenance building, not a gatehouse.
- **remoteGs: true** — there is a controlled truck gate but no identifiable
  guard booth, implying kiosk / call-box / app-based check-in. (Flagged
  uncertain — a small booth could be obscured.)
- **dockDoors: "50+"** — TSG facility page: 89 dock doors + 5 rail doors;
  satellite confirms a long east-face dock bank with trailers.
- **dropArea / dropYard: "25-50" / true** — unhitched trailers parked in the
  east and NE secured yard, separate from active dock staging.
- **railServed: true** — facility page states Union Pacific Railroad service
  with 5 rail doors; a rail line and spur are visible at the NW edge.
- **scale / multiStep: false** — no truck scale or second checkpoint visible.
- **multipleFacilities: false** — single facility/parcel (main warehouse +
  one annex building); not a multi-cluster campus.

## Yard zones and counts
- perimeter: the full fenced parcel — approx 39 acres.
- truckGate: SE entrance driveway off W Wintergreen Road with sliding gate.
- dropYards: east / NE secured trailer yard.
- dockAprons: paved strip along the east face dock bank.
- yardMetrics: ~89 dock doors, ~55 trailers visible, ~90 trailer capacity,
  1 truck gate, 2 buildings, ~39 acres, rail-served.

## Web findings
- The Shippers Group facility page + LogiCore + iwla1891: 1015 W Wintergreen
  Rd (WG-2) — 560,000 SF, built 2018, 109,000 SF cooler, 89 dock doors, 5 rail
  doors, secured yard, served by Union Pacific Railroad, multi-client food-grade
  BRC-certified, tilt-wall construction. Opened 2019 as TSG's new HQ after ~30
  years at the Forney Road warehouse.
- Kenco acquired The Shippers Group January 2024.

## Final confidence: HIGH
Building positively identified and corroborated by TSG's own facility
documentation. Imagery is clear and recent (2026). The only uncertain calls are
guardShack vs remoteGs (no booth clearly visible but a small one could be
hidden) and the exact inbound/outbound lane counts at the gate.
