# Deep-Audit Dossier — Coca-Cola Consolidated, Bishopville Production Center, SC

**Roster idx:** 7
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** High

## Location resolution
The roster address (245 Cale Yarborough Hwy) with APPROXIMATE geocode landed in
downtown Bishopville, ~1.4 km from the actual facility. Web research identified
the real site as **South Atlantic Canners, Inc., 601 Cousar Street, Bishopville
SC 29010** — a Coca-Cola production cooperative managed by Coca-Cola Consolidated
(50-year operating history; $28.7M expansion to 300,000 sq ft announced 2023,
four production lines for cans and 10oz/20oz/half-liter/2-liter bottles).

Locked center: **34.2231, -80.2337**. Confirmed via Street View (2024-05): the
south building face carries large "Coca-Cola" branding, and "RED CLASSIC"
trailers (Coca-Cola Consolidated's logistics fleet) are staged on site.

## Key views
- **Wide satellite (z17/z18):** A large connected white-roofed manufacturing
  and warehouse complex with three distinguishable building masses; long dock
  rows; extensive trailer staging. Rail line skirts the north edge.
- **South face (z19/z20):** A long, regular run of dock doors with ~20+
  trailers backed in. Cousar St runs immediately along this face.
- **Southwest (z19/z20):** Dense trailer and material/pallet storage yard;
  Street View shows chain-link fencing around the trailer yard.
- **West face:** Additional dock doors with trailers plus a pallet storage lot.
- **Northeast:** A second trailer cluster near the annex building.

## Gate / guard-shack / dock determinations
- **truckGate: false.** No barrier arm, sliding/swing gate, or checkpoint
  pinch-point at any access point. Street View from multiple headings shows the
  truck driveways as open curb cuts off Cousar St; trucks back directly off the
  road into the south docks. Perimeter chain-link fencing exists around the
  trailer yard, but the truck-access lanes themselves are ungated.
- **guardShack: false.** No staffed booth at the property line. A small
  red-roofed structure in the southwest yard interior is a fuel/canopy-type
  structure, not a gate booth. Listed as uncertain.
- **remoteGs: false** — no truck gate exists, so this is false by rule.
- **Docks:** Long dock-door row on the south face plus a separate run on the
  west face → estimated ~40-50 doors total (band 25-50). The two banks on
  different building faces support shipRcvSeparate: true.
- **postGateStaging: true** — large open paved yard between road frontage and
  the dock doors gives deep truck stacking room (drivewayLong).

## Yard zones and counts
- **Perimeter:** ~44 acres of active industrial parcel (S 34.2216 / W -80.2364
  / N 34.2252 / E -80.2306).
- **Drop yards:** southwest trailer/material yard and a northeast trailer
  cluster.
- **Dock aprons:** south-face apron and west-face apron.
- **yardMetrics:** ~48 dock doors, ~70 trailers visible, ~110-trailer parking
  capacity, 1 truck gate, 3 buildings, ~44 acres, rail line adjacent but no
  spur into the property (railServed false).

## Web findings
South Atlantic Canners is a Coca-Cola production cooperative managed by
Coca-Cola Consolidated. 2023 expansion: $28.7M, +15 jobs, total footprint to
300,000 sq ft, completion targeted Dec 2027. Four production lines.

## Final confidence
**High** for facility identity, layout, gate verdict, and dock/yard scale.
Uncertain: exact dock-door count and entry/exit lane counts (estimated from
overhead imagery); guard-shack call (no booth seen — confident it is false,
but flagged because the southwest structure was ambiguous).
