# Deep-Audit Dossier — idx 21 · Winchester Farms Dairy (Kroger)

**Type:** Dairy Plant
**Address:** 675 Rolling Hills Lane, Winchester, KY 40391
**Resolved center:** 38.01185, -84.18000
**Method:** deep-audit (satellite probe sat/sv) · **Confidence:** high

## Step 0 — Facility confirmation
Supplied coords (38.012217, -84.180142) landed essentially on-target. Satellite at z17/z18 showed a large industrial plant with a cluster of white cryogenic/process silos (a dairy-plant signature), trailers backed into dock banks, and an angled trailer drop yard. Web search confirms Winchester Farms Dairy is Kroger's fluid and cultured dairy plant (operating since 1982) at 675 Rolling Hills Lane. Street View along Rolling Hills Lane corroborated the plant building, perimeter chain-link, branded process silos, and a "Crystal Carriers Inc" trailer at the dock. Locked precise center at 38.01185, -84.18000.

## Site layout
- Single large main plant building sitting roughly square to N-S/E-W with a slight (~10°) clockwise rotation, plus a separate northeast building cluster (white-roofed DC + ancillary structures) on the same campus → `multipleFacilities: true`, buildingCount 3.
- Dock banks with trailers backed in along the **north** and **west** faces; estimated ~34 doors → band **25-50** (overhead estimate, flagged uncertain).
- **Drop yard:** multiple angled trailer rows along the **west** and **southwest** of the building, ~48 trailers visible, capacity ~60 → `dropYard: true`, dropArea **25-50**.
- Employee car parking in the **southeast** lot (excluded from truck-side classification).
- No rail spur into the property → `railServed: false`.

## Gate / guard determination
- **truckGate: true.** The site is entered from Rolling Hills Lane (NE) via a landscaped entrance boulevard that runs SW into the plant. Where the boulevard meets the secured operational yard near the cryogenic silos there is a perimeter chain-link fence with a **sliding rolling gate** (visible as a stored-open rolling gate panel in 2019-06 Street View; perimeter fence reconfirmed in 2026-04 capture). Clear controlled pinch-point.
- **guardShack: false.** No staffed multi-window guard booth at the gate lane — only small process/utility structures. → **remoteGs: true** (kiosk / call-box / app check-in implied).
- **postGateStaging: true / drivewayLong: true.** The entrance boulevard with median gives deep inside-gate queueing (3+ trucks) before the docks.
- **fastLaneOpportunity: true.** Wide paved gate apron and unused boulevard width could host a bypass/express lane.
- entryExitTogether (single gate group); entryLanes 1 / exitLanes 1 (exit uncertain).
- No truck scale (`scale: false`), no clear second checkpoint (`multiStep: false`), not backup-sensitive (ample stacking room).

## Setting
Edge-of-town industrial park off I-64 on the outskirts of Winchester, KY, surrounded by mowed fields → **Rural**. Adequate cellular setting → `connectivityIssue: false`.

## Geofence & metrics
- **Perimeter:** 8-vertex oriented ring tracing the fenced operational lot (building + dock aprons + drop yards + entrance boulevard) ≈ **12.1 acres** (shoelace). Undeveloped wooded slope down to I-64 on the south is excluded.
- Sub-zones traced at the building's true orientation: truckGate (gate at silo line), two dropYards (W + SW trailer rows), two dockAprons (N face + W face), staging (entrance boulevard / post-gate).
- **streetViewMeta:** pano `G-CIJ8yXm7kyhDnAHrJXeA` (entrance boulevard, 2019-06) — heading 192° toward the truck gate, 201° toward the perimeter centroid. No pano coverage inside the private yard (interior centroids returned ZERO_RESULTS).

## Web findings
Kroger's Winchester Farms Dairy — fluid and cultured dairy + Kroger-branded beverages for the Kroger Family of Stores since 1982; 675 Rolling Hills Ln, Winchester KY 40391; phone 859-745-5500 (sources: winchesterkychamber.com, Yelp, Kroger Careers).

## Confidence
**High.** Facility unambiguously identified and corroborated; gate confirmed in two Street View vintages; counts are honest overhead estimates (dockDoorCount, guardShack absence, exitLanes flagged in uncertainFields).
