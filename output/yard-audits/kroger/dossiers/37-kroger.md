# Deep-Audit Dossier — idx 37 — Pace Dairy of Minnesota (Rochester Cheese)

**Facility:** Pace Dairy of Minnesota (Rochester Cheese) — Dairy / Cheese Plant
**Address:** 2700 Valleyhigh Drive NW, Rochester, MN 55901
**Resolved center:** 44.05295, -92.51019
**Confidence:** high
**Method:** deep-audit (satellite + Street View + web)

## Location confirmation (Step 0)
The supplied coordinates (44.052935, -92.510192) landed directly on the correct
building. Web search confirmed 2700 Valleyhigh Dr NW = **Pace Dairy Foods**, a
Kroger-owned natural/process cheese plant operating since 1974, ~280 employees,
supplying 2,800+ Kroger-affiliated stores. The satellite shows a large, nearly
square white-roofed industrial building consistent with a cheese/dairy plant
(rooftop refrigeration/process units, attached south office annex), sited in
the NW Rochester industrial park fronting US-52. Positively the right building.

## Key views
- **z18/z19 overview:** Large square building, near north-aligned (slight
  rotation, edges run ~N-S / E-W). A loop driveway encircles the building.
  Truck operations are on the **WEST** face; employee parking is a large lot to
  the south; open field/setback to the north and east.
- **z20 west face:** Full bank of dock doors with ~11 trailers backed in — the
  main shipping/receiving dock and drop yard.
- **SW entrance (satellite z19):** Divided entrance driveway off the US-52
  frontage road; a small structure (the guard booth) sits in the median where
  the drive splits into the property loop.

## Gate / guard-shack determination (Street View, pano wQlU-7y2O2FxR9iJNluPDA, 2012-10)
Decisive evidence. The pano at the SW property entrance (44.05204, -92.51114)
looking north shows a **staffed guard gatehouse**: a small reddish/tan booth
with windows on multiple sides, an awning, and a roof-mounted security camera
dome. It sits in the median splitting a right-hand **entry** lane from a left
**"EXIT ONLY"** lane, with 10-mph and lane-control signage. **Chain-link
perimeter fence** runs across the property line on both sides of the gate. A
truck is visible inside the gate heading toward the docks.

- **truckGate: TRUE** — controlled, fenced, staffed checkpoint.
- **guardShack: TRUE** — booth confirmed; remoteGs = false.
- **entryExitTogether: TRUE** — one gate, booth-median splits one in / one out lane.
- **postGateStaging: TRUE** — long interior loop drive feeds the west dock apron.
- **drivewayLong: TRUE** — gate-to-dock approach holds 3+ trucks.

## Yard zones & counts
- **Perimeter:** ~9.3 acres inside the fence (building + west truck yard +
  north drive + entrance/guard area). Traced as a 7-vertex ring at true
  orientation following the fence/drive edges.
- **Drop yard / dock apron (WEST face):** ~11 trailers visible; ~14 dock doors
  estimated (10-25 band); yard capacity ~18 (10-25 band). `dropYard: true`.
- **Buildings:** 1 (south office annex is attached). No campus.
- **Rail:** none. **Scale:** none visible. **Ship/Rcv separate:** no — single
  west dock bank.

## Web findings
Pace Dairy Foods Company, est. at this site 1974; ~280 associates producing
Kroger-label natural and process cheese for 2,800+ stores; part of Kroger's
35+ manufacturing network. Recognized as a Best Place to Work in SE MN.

## Final confidence: HIGH
Building unambiguous; gate/guard-shack directly verified in Street View;
dock/drop counts are honest overhead estimates (flagged uncertain). Street View
is dated 2012 but the guard-gate infrastructure is permanent and corroborated
by current satellite (booth structure still present in the median).
