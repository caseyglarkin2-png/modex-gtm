# Deep-Audit Dossier — PFG idx 20

## Performance Foodservice - Louisville KY
**Address:** 2201 Ampere Dr, Louisville, KY 40299
**Type:** Broadline Foodservice Distribution Center
**Resolved coords:** 38.21080, -85.54900
**Confidence:** Medium

---

## Location resolution
The roster pin (38.211292, -85.549169, ROOFTOP, ~100 m offset) landed
directly on the correct building. Web research confirmed 2201 Ampere Dr as
Performance Foodservice - Louisville (formerly Reinhart Foodservice — TruckMap
still lists the Reinhart name). The facility sits in the Bluegrass Industrial
Park area of Jeffersontown / east Louisville, Jefferson County. Locked center:
38.21080, -85.54900.

## What the imagery showed
- **z17 / z18 satellite:** A single long white-roof industrial building among
  several near-identical buildings in a multi-tenant industrial park. The PFG
  unit has a continuous bank of dock doors along its south face with a paved
  truck apron and several trailers parked/backed in.
- **z19 satellite (dock side):** Dock doors lining the south face, trailers
  backed in and a handful parked on the apron. The apron is open and bordered
  by a tree line and an internal park road — no fence, no gate.
- **Street View (Nov 2024), Ampere Dr / street frontage:** The street-facing
  side is a flush office/flex elevation with windows and a small office entry,
  fronted by employee parking. No barrier arm, no guard booth, no perimeter
  fencing — a fully open multi-tenant industrial-park frontage.

## Gate / guard-shack determination
- **truckGate: false** — no barrier arm, sliding gate, or checkpoint
  pinch-point. The dock apron is reached by open driveways within the
  industrial park; the building is not perimeter-fenced.
- **guardShack: false** — no staffed booth anywhere on the approach.
- **remoteGs: false** — no gate exists, so no remote check-in implied.

## Yard zones & counts
- **Perimeter:** ~21.8 acres scoped to the PFG-occupied building section and
  its south truck apron (the full multi-tenant building/park is larger).
- **Dock doors:** 25-50 band — a continuous dock bank on the south face;
  ~28 estimated for the PFG section. The building is multi-tenant, so the
  exact PFG share is uncertain — flagged.
- **Drop area:** 10-25 band — a modest apron holding ~12-14 trailers; no
  dedicated large trailer-storage lot, so dropYard=false.
- **Driveway:** short — compact apron, only 1-2 trucks deep between dock face
  and the bordering road/tree line.
- **Buildings:** 1 (PFG unit within one long multi-tenant industrial
  building).
- **Rail:** none.

## Web findings
- Performance Foodservice - Louisville; formerly Reinhart Foodservice (PFG
  acquired Reinhart Dec 2019).
- Driver reviews note overnight parking available and quick unloading turns.

## Setting
Urban — Bluegrass Industrial Park, Jeffersontown / east Louisville, inside the
Louisville metropolitan fabric.

## Final confidence: MEDIUM
Building positively identified and gate/guard status clear. Confidence held to
medium because the structure is multi-tenant — the precise PFG-occupied dock
count and trailer-parking share cannot be cleanly isolated from overhead
imagery. Counts flagged in uncertainFields.
