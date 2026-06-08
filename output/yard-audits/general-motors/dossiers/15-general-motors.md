# GM - Toledo Propulsion Systems, Toledo OH — Deep Audit (idx 15)

**Address:** 1455 W Alexis Rd, Toledo, OH 43612
**Resolved center:** 41.7106, -83.5748
**Type:** Transmission / propulsion plant (GM)
**Confidence:** High

## Location confirmation

The roster's approximate coordinates landed in a residential block east of the
true plant. A wide satellite sweep showed the actual facility: a large
light-roofed industrial complex on the **west** side of a N-S rail corridor
running along W Alexis Rd. Web research confirms GM Toledo Propulsion Systems
(formerly "Toledo Transmission") at 1455 W Alexis Rd is a roughly 2.8M sq ft,
~151-acre transmission factory (Wikipedia "Toledo Transmission"; GM facilities
page; building manufactures 6-/8-/10-speed RWD and 9-speed FWD transmissions).
Center re-pinned to the main building complex.

## What the key views showed

- **Wide / context (z15-16):** Plant complex west of the rail line; a long
  N-S rail corridor; and a large vehicle/trailer storage lot east of the rail
  abutting the residential grid. W Alexis Rd runs E-W along the south frontage.
- **Plant complex (z16-18):** One large connected manufacturing building
  (light roof) plus a big gray-roofed building SW; trailers backed into dock
  banks on the north and west faces; rail boxcars on the eastern spurs.
- **North drop yard (z17-18):** A dedicated trailer-storage yard with dozens of
  trailers parked in organized marked rows (well into the 50+ band), separate
  from active dock staging, with internal circulation drives and rail to the east.
- **South frontage (Street View, 2024-06):** Office/admin entrance with a GM
  monument sign, employee parking, and continuous perimeter chain-link fencing
  along W Alexis Rd. This is the visitor/employee point, not the truck gate.
- **West truck driveway (Street View + z19 sat):** A fenced driveway on the
  SW/west side leads north into the dock/yard area; gated, lane-controlled, with
  a small structure consistent with a gatehouse at the entry. Pano
  `ZKbQ2JR7BrT0TnShsrdvdw` @ 41.70706,-83.57543.

## Gate / guard / dock determinations

- **truckGate: true** — Fully fenced site; freight circulation enters through a
  controlled, fenced/gated driveway on the west side off W Alexis Rd. Open,
  uncontrolled access ruled out by continuous perimeter fence in every SV frame.
- **guardShack: true (flagged uncertain)** — A small gatehouse-footprint
  structure sits at the west truck driveway; the booth is not crisply resolved
  in overhead imagery, so it is listed in `uncertainFields`, but staffed guarded
  entry is standard for a GM powertrain plant of this scale.
- **remoteGs: false** — Guarded entry, not a bare kiosk-only gate.
- **dockDoors: 50+** — Long dock-door banks with trailers backed in across the
  north and west building faces.
- **dropArea / dropYard: 50+ / true** — Large organized trailer drop yard north
  of the plant.
- **shipRcvSeparate: true** — Distinct dock clusters on separate (north vs west)
  building faces.
- **railServed: true** — Multiple active N-S rail spurs run through the property
  with boxcars parked on them.
- **multiStep: false** — No clearly resolved second checkpoint after the gate.

## Yard zones and counts measured

- **perimeter** — Traced around the western plant complex from the W Alexis Rd
  frontage (south) up to the north drop-yard edge, bounded on the east by the
  rail corridor; ~151 acres (matches published site size).
- **truckGate** — West-side fenced driveway entry off W Alexis Rd.
- **dropYards** — North trailer-storage yard (rows of parked trailers).
- **dockAprons** — Strip along the west/north building face where trailers back in.
- **yardMetrics:** dockDoorCount ~55, trailersVisible ~70, trailerParking
  capacity ~120, truckGateCount 2 (west freight drive + south office/employee),
  buildingCount 3, siteAreaAcres ~151, railServed true.

## Web findings

- 2.8M sq ft, ~151 acres; GM transmission factory ("Toledo Transmission" /
  "Toledo Propulsion Systems"); 6-/8-/10-speed RWD and 9-speed FWD transmissions.
- 2026 reporting: GM shifting the plant away from EV drive units, adding another
  transmission line; ongoing investment in the Alexis Rd factory.

## Final confidence

**High.** Facility identity, fenced controlled freight access, rail service, and
a large drop yard are all clearly evidenced. Exact lane counts, the precise
guard-booth footprint, dock-door count, and any truck scale are honest overhead
estimates and are flagged in `uncertainFields`.

3-line summary:
- Gate: TRUE — fully fenced site, controlled west-side freight driveway off W Alexis Rd.
- Guard shack: TRUE (uncertain) — gatehouse-footprint structure at the truck drive; booth not crisply resolved.
- Confidence: HIGH.
