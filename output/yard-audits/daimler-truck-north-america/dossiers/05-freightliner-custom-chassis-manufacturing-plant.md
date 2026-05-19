# Deep-Audit Dossier — Freightliner Custom Chassis Manufacturing Plant (Gaffney, SC)

**Account:** Daimler Truck North America · **Roster idx:** 5
**Type:** Custom chassis assembly plant (FCCC — RV / motorhome / walk-in-van
chassis)
**Method:** deep-audit · **Confidence:** medium

## Location resolved
- Roster coords (35.074048, -81.68243, ROOFTOP but moved 2489m) landed near the
  plant. Satellite at z16/z17 confirmed a large multi-building manufacturing
  complex with hundreds of completed chassis staged in rows.
- Web search (FCCC contact page, SC Department of Commerce and SC Governor
  releases, FCCC RV pages) confirms the Freightliner Custom Chassis plant at
  552 Hyatt Street, Gaffney SC 29341 — ~289,000 sq ft, three production lines,
  600+ employees, building custom RV/motorhome and walk-in-van chassis.
- Working center: **35.075000, -81.681000** (main plant building).

## Key views
- **z16 / z17 wide** — Large multi-building plant set behind wooded buffers on
  an edge-of-town industrial site; a separate large chassis-storage building and
  lot sit to the east, joined by an internal road.
- **z18 / z19 detail** — Completed chassis staged in long rows around the main
  plant and filling the east storage lot; trailers backed at dock doors on the
  N face; material laydown; rail spur along the SW.
- **z20 internal junction** — A small white ~1-vehicle-footprint structure beside
  a gated paved area at the internal road junction between the main plant and
  the east storage building.
- **Street View (2024-11 panos)** — Chain-link fencing along the Hyatt Street
  frontage and around the east storage yard; gated access between the buildings;
  employee parking open from the road.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The campus is fenced (chain-link along the road and
  around the east storage yard). A gated internal road junction between the main
  plant and the east chassis-storage building controls truck movement; treated
  as a controlled truck gate.
- **guardShack = true (flagged uncertain).** The small white structure at the
  gated internal junction has the footprint and position of a guard/check booth.
  Called guardShack true at medium confidence — it could alternatively be an
  equipment shed.
- **dockDoors = 10-25.** Trailers backed at dock doors on the N face of the main
  plant building; estimate 10-25 doors, flagged uncertain.
- **dropArea = 50+ / dropYard = true.** A very large dedicated finished-chassis
  storage yard sits east of the main plant, plus extensive chassis/trailer
  staging around the plant itself.

## Yard zones and counts
- **perimeter** — Full campus incl. the east storage lot, roughly 35.0715-35.0790
  N by -81.6845 to -81.6760 W, about 120 developed acres.
- **truckGate** — Box at the gated internal road junction / guard structure.
- **dropYards** — Two boxes: the east chassis-storage yard and the N/NW staging
  aprons around the main plant.
- **dockAprons** — One box covering the N-face dock strip of the main plant.
- **staging** — null.
- yardMetrics: ~22 dock doors, ~70 trailers visible, ~250 chassis/trailer
  capacity, 1 truck gate, ~5 buildings, ~120 acres, rail-served = true.

## Web findings
- FCCC and SC Commerce / SC Governor releases confirm the Gaffney plant's
  products (custom RV / motorhome / walk-in-van chassis), ~289,000 sq ft,
  three production lines, and a 2019 Cherokee County expansion adding 193 jobs.
  A separate Service & Training Center exists at 103 Campus Drive. No public
  detail on the gate/guard configuration.

## Final confidence
**medium** — facility positively identified and the major zones (perimeter, the
large east drop yard, dock face) are clear, but the gate/guard determination
rests on a small structure at the internal junction that could be a guard booth
or an equipment shed, and dock-door and lane counts are estimates. Those fields
are flagged uncertain.
