# GM - Defiance Operations, Defiance OH — Deep Audit Dossier

**Roster idx:** 24
**Type:** Foundry / Casting Plant
**Resolved center:** 41.28430, -84.31680
**Confidence:** Medium

## Location resolution

The roster default geocode (41.2825, -84.4488) was WRONG — it landed on
farmland at a bend of the Maumee River roughly 10 km west of the plant. State
Route 281 runs east-west, and the GM Defiance foundry actually sits on the
SOUTH bank of the Maumee River about 5 miles east-northeast of downtown
Defiance. I relocated the true plant by probing satellite eastward along
SR-281 and confirmed the address (26427 State Route 281, Defiance OH 43512)
against whereorg and americanautoworker listings.

Satellite at the resolved point shows the unmistakable signature of a large
foundry: a massive multi-roof industrial building (dark/aged roofs), settling
and cooling ponds plus slag and sand storage spread across the north toward
the river, employee parking lots fronting SR-281 with a landscaped circular
main entrance, and rail sidings curling into the northeast. Locked the plant
center at ~41.2843, -84.3168.

## Facility background (web)

GM Defiance Operations (GM Powertrain Defiance Foundry / Casting Operations)
is an aluminum and iron foundry and machining center of roughly 1.9 million
sq ft. First iron was poured in August 1948. It casts cylinder blocks and
heads (I4/V6/V8) for GM engines across Buick, Cadillac, Chevrolet and GMC.
Around 530 hourly workers (UAW Local 211) per 2022 figures; GM has invested
$180M+ since 2013, including a 2023 $55M investment for engine and EV castings.

## Key views

- **z14/z15 context** — single large foundry complex on the rural south bank
  of the Maumee, settling ponds and sand/slag yards to the north, farmland
  south of SR-281, rail to the NE.
- **z16/z17 overview** — main foundry building center; employee lots and a
  landscaped main entrance on the SR-281 (south) frontage to the east; the
  active freight operation (docks + trailer drop rows) on the west/southwest.
- **West truck yard (z19/z20)** — a wide paved driveway opens straight off
  SR-281 into an open truck yard; organized rows of ~24 drop trailers to the
  west, staged tractor-trailers (red cabs) center, dock doors with trailers
  backed in along the building faces.
- **NE rail (z17)** — multiple parallel rail sidings and spurs run into the
  north/northeast of the plant.
- **Street View along SR-281 (2025-05, pano FH9VnAH3jRua6BR8Q11AcA)** — open
  frontage at the west truck entrance: parked trailer rows, a broad open paved
  apron, freight buildings behind. No barrier arm, no sliding gate, no guard
  booth at the road.

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE (medium confidence).** The west truck entrance off
  SR-281 (~41.2823, -84.3192) is an open, wide paved driveway. Street View and
  z19/z20 satellite show no barrier arm, sliding gate, or guard booth at the
  road. Flagged uncertain because a foundry of this scale could run an
  internal check-in not resolvable from the public road.
- **Guard shack: FALSE.** No staffed booth structure resolved at either the
  west truck entrance or the eastern employee/visitor drive. remoteGs FALSE
  as a consequence (no gate established).
- **Post-gate staging: true.** A very large open paved truck yard sits inside
  the property between the SR-281 frontage and the dock/freight buildings.
- **Driveway long: true.** The open approach into the west yard is long/deep
  with room to queue 3+ trucks before the docks.
- **Dock doors: 10-25 (~18 est).** Across the west/southwest freight building
  faces, trailers seen backed in. Modest relative to the 1.9M sq ft building;
  exact count partly obscured — flagged uncertain.
- **Ship/Rcv separate: false.** Freight concentrated in one west/southwest
  dock + drop-yard cluster; no clearly separate second dock bank confirmed.
- **Fast-lane opportunity: true.** The west entrance is a very wide open apron
  with ample unused width for an express/check-in lane.

## Yard zones and counts

- **Perimeter:** the active industrial footprint (building, west truck yard,
  ponds, slag/sand storage) on the south bank of the Maumee, ~235 acres.
  Excludes the farmland south of SR-281.
- **Truck gate zone:** the open west driveway apron off SR-281.
- **Drop yard:** west trailer lot, banded 25-50 (~24+ trailers in rows,
  capacity ~80). dropYard true.
- **Dock apron:** strip in front of the southwest freight dock bank.
- **Buildings:** 1 (single large interconnected multi-roof foundry).
- **Rail:** multiple sidings/spurs into the north/northeast — railServed true.
- **Street View:** SR-281 frontage pano FH9VnAH3jRua6BR8Q11AcA (2025-05) at
  the west truck entrance is the driver's-eye arrival view; plant interior has
  no Street View coverage (ZERO_RESULTS at the perimeter centroid).

## Final confidence

**Medium.** The facility is positively identified — the roster geocode was
wrong and I relocated the true foundry on SR-281 east of Defiance, corroborated
by address listings and the unmistakable foundry layout. The truck-gate and
guard-shack calls are FALSE based on an open, ungated, unguarded west truck
entrance in 2025 Street View; flagged uncertain in case of an internal
check-in. Dock-door count and lane counts are honest estimates from overhead
imagery.
