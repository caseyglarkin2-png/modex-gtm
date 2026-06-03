# Yard Audit Dossier — Walmart Perishable DC 3010, Wellford SC

- **Facility:** Walmart Perishable DC 3010 (PDC 3010)
- **Type:** Grocery / Perishable (refrigerated) distribution center, ~725,000 sf, automated
- **Address:** 1065 Fort Prince Blvd, Wellford, SC 29385
- **Audited center:** 34.97365, -82.10150
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Location confirmation

The supplied coordinates (34.974014, -82.097687) sit on a site with **two** large
DC buildings on the Fort Prince Blvd ridge: a refrigerated multi-section complex
on the **west** and a single bare-roof rectangular DC on the **east**.

- The street address 1065 Fort Prince Blvd geocodes ROOFTOP to the **east-facing
  office / employee parking** of the **west complex** (z18 pin view: full car
  lot at the building's east entrance).
- The west complex carries roof-mounted refrigeration banks (dark blue roof
  strips) and a three-tank **ammonia refrigeration farm** at its south edge —
  the cold-side infrastructure expected of a perishable DC. The east building
  has no such equipment.
- Web research (Supply Chain Dive, BusinessWire, Greer Chamber) confirms PDC
  3010 is a 725k sf high-tech automated perishable DC for fresh produce, dairy,
  meat and frozen, serving ~180 stores, grand-opened Sept 2025, GM James Bright.

Conclusion: the **west refrigerated complex is PDC 3010** and is the audited
building. The east bare DC is a separate facility and was excluded.

## Key views

- **z16 wide / z15 context** — established the two-building layout, the wooded
  setting, ponds, and the single south access road off Fort Prince Blvd.
- **z18 geocode pin** — placed the address on the west complex's east office /
  employee lot.
- **z17/z18 docks** — south-facing dock wall with trailers backed in; central
  paved yard packed with parked-trailer rows; ammonia tank farm; a separate
  south maintenance/shop building.
- **z19/z20 gate** — the controlled checkpoint and guard shack at the yard mouth.
- **Street View (intersection pano EYDU-J3azbveHLrMwbAs9A, 2024-06)** — divided
  driveway climbing the hill from Fort Prince Blvd toward the DC.

## Gate / guard shack / dock determinations

- **Truck gate — TRUE.** A divided two-lane entrance driveway runs ~350 m from
  Fort Prince Blvd up the hill to a controlled checkpoint at the yard mouth
  (~34.9717, -82.1024). Entry and exit lanes are split by a median curb.
- **Guard shack — TRUE.** The z20 crop shows a small booth structure sitting in
  the median island where the inbound/outbound lanes split, with a service
  vehicle parked beside it — the classic guard-shack island position. Staffed
  booth, not the main building.
- **remoteGs — FALSE** (a physical guard shack is present).
- **Driveway long — TRUE; post-gate staging — TRUE.** The long divided approach
  plus the large interior yard hold well over 3 trucks before the docks.
- **Fast-lane opportunity — TRUE.** Wide divided gate apron with spare paved
  width to add an express/bypass lane.
- **Docks — 50+.** Multi-section building: primary dock bank along the south
  wall facing the central yard, plus an east-section dock bank. Estimated ~120
  doors from overhead trailer rhythm (count is low-confidence).
- **Drop yard / drop area — TRUE / 50+.** The central paved yard holds organized
  rows of ~100+ parked trailers — a dedicated drop yard distinct from active
  dock staging.

## Yard zones and counts

- **perimeter** — 7-vertex oriented ring tracing the cleared/fenced property
  (≈91.3 acres by shoelace).
- **truckGate** — small quad over the guard-shack island at the yard mouth.
- **dropYards** — one ring over the central trailer-storage yard.
- **dockAprons** — one thin rotated quad hugging the south dock wall at the
  building's angle (trailers back in perpendicular).
- **staging** — null (post-gate holding folded into the interior yard).

**yardMetrics:** dockDoorCount ~120 · trailersVisible ~110 · capacity ~250 ·
truckGateCount 1 · buildingCount 2 (main DC + south maintenance/shop) ·
siteAreaAcres 91.3 · railServed false (no spur).

## Street View meta

- **perimeter** — pano EYDU-J3azbveHLrMwbAs9A (2024-06) at the Fort Prince Blvd
  intersection, heading 15° N up the entrance driveway. hasCoverage true.
- **truckGate** — no pano at the private hilltop gate (metadata ZERO_RESULTS);
  hasCoverage false, no pano id invented.

## Web findings

- Supply Chain Dive / BusinessWire / Spectrum / Shelby Report: PDC 3010, 725k sf,
  automated (robotics + AI), ~2x throughput of a traditional DC, 600+ FTEs,
  serves ~180 stores, third of five new Walmart perishable DCs nationwide.

## Setting

Rural / edge-of-town industrial ridge surrounded by forest and retention ponds,
with scattered residential nearby. Judged **Rural**. connectivityIssue false
(near I-85 / Spartanburg corridor; coverage adequate).

## Final confidence: HIGH

Building identity, gate, guard shack, long driveway, and large drop yard are all
well supported by imagery; only exact dock-door / capacity counts and the
ship-vs-receive split are estimates (flagged in uncertainFields).
