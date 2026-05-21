# Deep-Audit Dossier — Kenco MCS Jeffersonville I (Jeffersonville, IN)

**Roster idx:** 1
**Type:** Multi-Client Distribution Center / E-Commerce Fulfillment
**Address:** 201 River Ridge Parkway, Jeffersonville, IN 47130
**Resolved coords:** 38.38585, -85.67760
**Confidence:** High

## Location confirmation
The roster pin (38.387587, -85.676299) lands on the NE corner of a large
rectangular warehouse inside River Ridge Commerce Center. Wide z16/z17
satellite shows a multi-building greenfield industrial park; the building
under the pin is the largest in the immediate cluster. Web research confirms
Kenco operates 201 River Ridge Parkway as its largest AutoStore installation
(49,000 bins, 130 grid robots) — a ~664,800 SF e-commerce fulfillment DC.
Street View from River Ridge Parkway (2026-03) shows the Kenco logo on the
NE-end office block, positively confirming the building. Locked center at the
warehouse centroid, ~38.38585 / -85.67760.

## Key views
- **z16/z17 context** — River Ridge Commerce Center, multiple large DC
  buildings, farmland between them; this building oriented NE-SW.
- **z18 building** — long rectangular warehouse; office/car-parking on the NE
  end, dock operations on the NW (back) face and a secondary bank mid-SE face.
- **NW face (z18/z19/z20)** — primary dock bank: a long continuous run of
  loading doors with trailers backed in and a deep paved drop yard / apron.
- **SE face (z19, Street View)** — a smaller secondary dock bank (~8-12 doors)
  with trailers; SE perimeter drive is a fire-lane / overflow access.
- **NE end** — windowless wall, no docks; office and employee parking only.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** Street View (2026-03) at the NW dock-yard driveway
  shows a sliding chain-link gate set in a continuous perimeter fence across
  the truck lane. Clear controlled entrance.
- **Guard shack: FALSE.** No booth, kiosk-house, or staffed structure beside
  the gate in any Street View heading — the gate is purely a fence opening.
- **Remote GS: TRUE.** Gated entry with no guard shack implies kiosk / app /
  remote check-in.
- **Docks:** NW face long dock bank + separate SE-face dock bank. Roster source
  cites 113 dock doors for the site — banded **50+**. Two physically separate
  dock clusters → `shipRcvSeparate: true`.

## Yard zones and counts
- **Perimeter** — full parcel inside the fenced/landscaped property line:
  road frontage on NW and SE, ~55.3 acres.
- **truckGate** — NW dock-yard driveway gate apron.
- **dropYards** — one deep trailer-storage / drop area along the NW dock apron.
- **dockAprons** — NW back-face apron + SE-face apron.
- **yardMetrics** — dockDoorCount 113 (per source), ~35 trailers visible,
  ~90 trailer-parking capacity (estimate), 1 truck gate, 1 building, 55.3 acres,
  no rail spur.

## Web findings
1si.org, KPI Solutions, DC Velocity and Kenco/BusinessWire releases confirm
the Jeffersonville AutoStore DC at 201 River Ridge Parkway — Kenco's largest
AutoStore install, ~15M units/yr throughput, robotics covering ~a quarter of
the building.

## Final confidence
High. Building positively identified by logo + address; gate and dock
determinations supported by clear 2026-03 Street View and z20 satellite.
Trailer counts/capacity are honest estimates (flagged).
