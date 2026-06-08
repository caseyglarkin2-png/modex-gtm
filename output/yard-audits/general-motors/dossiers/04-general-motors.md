# GM - Fairfax Assembly, Kansas City KS — Deep Audit

**Facility:** General Motors Fairfax Assembly & Stamping Plant
**Address:** 3201 Fairfax Trafficway, Kansas City, KS 66115
**Type:** Vehicle Assembly Plant (assembly + stamping; XPO inbound logistics)
**Re-pinned center:** 39.1448, -94.6075
**Method:** deep-audit (satellite z15–z19 + Street View + web research)
**Confidence:** high

## Step 0 — Locating the facility

The supplied address point (geocoded to roughly 39.130, -94.618) landed in a
residential neighborhood ~2 km southwest of the real plant. Web research
confirmed GM Fairfax is a ~4.9M sq ft assembly + stamping complex in the
Fairfax Industrial District beside the Missouri River (currently building the
Cadillac XT4 / Chevy Malibu and retooling for the 2027 Chevrolet Bolt EV and
gas Equinox).

Probing satellite NE of the address revealed the unmistakable signature of a
vehicle assembly plant: a multi-million-sq-ft assembly/body/paint building,
thousands of finished vehicles parked in staging lots, and long parallel rail
auto-rack loading tracks. The campus was re-pinned to the main assembly
building.

## Key views

- **Wide (z15):** Two major building clusters — the modern assembly building
  on the NE with large employee parking and finished-vehicle lots, and older
  stamping/industrial buildings on the west, with rail running the SW edge.
- **Assembly building (z16–z17):** Very large gray-roofed assembly/body
  structure; extensive employee parking; finished-vehicle staging lots south
  and east.
- **SE lots + rail (z17):** Thousands of finished vehicles in marked rows;
  long parallel rail auto-rack loading tracks with railcars — confirms
  rail-served outbound vehicle logistics.
- **XPO logistics building (z18–z19):** A long diagonal (NW–SE) sequencing /
  cross-dock building with continuous dock banks down BOTH long faces and
  dozens of trailers backed in nose-out. This is the truck-heavy freight
  building for inbound parts.

## Gate / guard determination

Street View at the south XPO entrance (pano `5xU3ZvxDXiPnGmIirLEcEA`,
captured 2023-12, 39.13567, -94.60859) shows:

- An "XPO Logistics" monument sign at the driveway.
- Chain-link perimeter fencing along the public road with a "Heroes work here"
  banner.
- A tractor backing a trailer into the building's dock doors just inside the
  fence line.

The campus is fully perimeter-fenced with controlled truck drives. A plant of
this scale operates staffed security gatehouses at controlled entries; the
specific booth was not isolated in a single clean frame, so **guardShack** is
flagged in `uncertainFields` (called true on facility-class evidence).
**truckGate: true** (fenced, gated controlled entries). **remoteGs: false**
(guarded, not kiosk-only).

## Yard zones & counts

- **Perimeter:** ~494 acres, traced as an oriented polygon over the core
  operational campus (assembly building, XPO logistics building, finished-
  vehicle lots, rail loading, western stamping buildings).
- **truckGate:** quad over the XPO south entrance drive (~39.1358–39.1360,
  -94.6082 to -94.6090).
- **dropYards:** (1) trailer staging hugging the diagonal XPO building at its
  NW–SE angle; (2) finished-vehicle / trailer staging lot east of the assembly
  building.
- **dockAprons:** long thin quad along the XPO building's dock face at the
  building's true diagonal orientation.
- **Metrics:** dockDoorCount ~130 (overhead estimate; XPO building alone has
  dock banks on both long faces, plus assembly receiving docks),
  trailersVisible ~110, trailerParkingCapacity ~200, truckGateCount 3,
  buildingCount ~8, **railServed: true**.

## Classification highlights

- `dockDoors: "50+"`, `dropArea: "50+"` — very high; XPO sequencing building
  drives both.
- `shipRcvSeparate: true` — inbound parts (XPO building, south) vs finished-
  vehicle outbound (rail/truck, east) are physically separate operations.
- `multipleFacilities: true` — integrated multi-building campus.
- `multiStep: true` — outer fenced perimeter checkpoint + internal building
  access control.
- `fastLaneOpportunity: true` — wide drives / gate aprons at the XPO entrance.
- `urbanRural: "Urban"` — dense Fairfax Industrial District inside the KC metro.
- `scale` left uncertain (no clear weigh platform identified).

## Web findings

- GM Authority / GM.com: GM Fairfax Assembly & Stamping, ~4.9M sq ft, ~2,200+
  employees; built Malibu and Cadillac XT4; ~$390M retool for the 2027 Bolt EV
  and gas Equinox.
- XPO Logistics signage on-site confirms a third-party-run inbound parts
  sequencing / logistics building — the primary truck-dock operation.

## Verdict

- **Truck gate:** YES — fully fenced campus with controlled, gated truck drives.
- **Guard shack:** YES (facility-class evidence; specific booth not isolated,
  flagged uncertain).
- **Confidence:** high.
