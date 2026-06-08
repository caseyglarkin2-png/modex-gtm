# Ultium Cells - Lordstown (Warren), OH — Deep Audit (idx 26)

**Address (roster):** 2440 Ohltown Rd, Warren, OH 44481
**Resolved center:** 41.1538, -80.8635
**Type:** Battery cell plant (GM / LG Energy Solution JV — "Ultium Cells")
**Confidence:** Medium

## Location confirmation

The roster address "2440 Ohltown Rd" geocodes to a residential subdivision off
Ohltown Rd, ~2.5 km NE of the plant (the first wide z16 sweep showed only houses
and farm fields). Stepping the satellite sweep south and west uncovered the
real facility: a single enormous white-roof manufacturing building immediately
**east of the former GM Lordstown Assembly complex** and its rail yard, off Tod
Ave SW / Henn Pkwy in Lordstown (mailing city Warren). Web research confirms the
**Ultium Cells Lordstown** battery cell plant — a GM / LG Energy Solution joint
venture, ~2.8M sq ft on ~156 acres, ~30 GWh annual capacity, producing cells
since Aug 2022 and past its 100-millionth cell by late 2024 (Ultium Cells site;
GM investor releases; GMAuthority facility page). Center re-pinned to the plant
building at 41.1538, -80.8635.

## What the key views showed

- **Wide / context (z14-16):** The plant building sits east of the sprawling
  Lordstown Assembly complex (far SW) and its large multi-track rail yard (NW).
  Farmland and woods surround the parcel; Ohltown Rd runs N-S along the east edge.
- **Building footprint (z16-17):** One dominant white-roof rectangle running
  roughly N-S with a slight rotation — consistent with ~2.8M sq ft. Employee car
  lots on the SE and a smaller ancillary building near the south entrance.
- **South face (z18 — sgate/sdock/swdock):** The principal material-handling
  dock bank. Trailers and intermodal containers (orange/blue/white) backed into
  dock doors along the south wall, with trailers staged on the paved apron and a
  perimeter loop road wrapping south and east.
- **West face (z18 — wface):** Back-of-house process/utility side — electrical
  yards, chiller arrays, modular process structures, and a pipe/conveyor bridge.
  Not a truck-dock face.
- **NW corner (nwgate):** Extensive multi-track rail yard (former Lordstown
  Assembly yard) plus laydown/stockpile area and retention ponds.
- **East frontage (Street View, Ohltown Rd, 2025-07, pano `74GAaClbbaTB0N8e1IOlRA`):**
  The plant is set far back across an open grass field; the Ohltown frontage has
  no truck approach. Truck circulation is internal, entering from the SW.
- **Entrance pano (2024-02):** Only an aerial/drone pano is published over the
  access roads — no ground-level Street View at the truck gate itself (typical
  for a secured campus). Plant visible at distance with process steam venting.

## Gate / guard / dock determinations

- **truckGate: true (uncertain)** — The public Ohltown Rd frontage is open field
  with no truck approach. Freight enters from the SW/south via internal
  Lordstown-complex roads to a fenced, controlled gate near the SW corner. A
  secured cell plant (valuable IP, lithium hazmat) runs controlled gated access;
  exact gate hardware not crisply resolved from overhead, so flagged.
- **guardShack: true (uncertain)** — A small gatehouse-footprint structure sits
  at the SW truck approach; standard for a GM/LG JV cell plant. Booth not
  positively resolved as a staffed booth, so flagged. **remoteGs: false.**
- **dockDoors: 25-50 (~35)** — A single principal south-face dock bank with
  trailers/containers backed in. No second large dock bank on a separate face
  was resolved, so **shipRcvSeparate: false** (flagged).
- **dropArea / dropYard: 10-25 / true** — Trailers and containers dropped on the
  south apron and SW lots without tractors; surrounding flat ground is largely
  contractor laydown / expansion area rather than marked trailer stalls.
- **postGateStaging: true; drivewayLong: true; backupSensitive: false** — Deep
  internal aprons and a perimeter loop road give a long multi-truck approach far
  from any public road.
- **railServed: true (uncertain)** — A large active rail yard sits immediately
  NW and a rail line runs the west property corridor; the complex is rail-served.
  A spur entering the cell building directly was not positively confirmed, so
  flagged.
- **scale: false (flagged); multiStep: false** — No weigh pad or second
  checkpoint resolved.

## Yard zones and counts measured

- **perimeter** — Oriented ring around the developed/fenced parcel: the N-S
  plant building, west process yards, SE employee parking, south staging/laydown,
  and retention ponds; ~156 acres (matches published site size).
- **truckGate** — Small quad at the SW internal truck approach.
- **dropYards** — South-apron trailer/container drop area.
- **dockAprons** — Long thin quad hugging the south dock wall.
- **streetViewMeta** — perimeter uses the Ohltown frontage pano
  `74GAaClbbaTB0N8e1IOlRA` (heading 270° toward the plant, 2025-07); truckGate
  has no ground-level pano (hasCoverage false).
- **yardMetrics:** dockDoorCount ~35, trailersVisible ~30, trailerParkingCapacity
  ~60, truckGateCount 1, buildingCount 2, siteAreaAcres ~156, railServed true.

## Web findings

- Ultium Cells Lordstown — GM / LG Energy Solution JV; ~2.8M sq ft, ~156 acres,
  ~30 GWh/yr; ~2,200 employees.
- Groundbreaking May 2020; cell production began Aug 2022; >100M cells by late
  2024. Active, ramped facility with ongoing site expansion/laydown visible.

## Final confidence

**Medium.** Facility identity, footprint, south dock bank, drop area, and rail
adjacency are clearly evidenced. The truck gate / guard booth are inferred from
the secured-campus profile and SW approach (no public-road Street View at the
gate), and dock-door count, lane counts, the direct rail spur, ship/rcv
separation, and any scale are honest overhead estimates — all flagged in
`uncertainFields`.

3-line summary:
- Gate: TRUE (uncertain) — secured campus, internal SW truck approach; Ohltown frontage is open field with no public truck access.
- Guard shack: TRUE (uncertain) — gatehouse-footprint structure at the SW approach; booth not crisply resolved.
- Confidence: MEDIUM.
