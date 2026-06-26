# Yard Deep-Audit — idx 49 · Kenlake Foods (Kroger), Murray KY

## Location & confirmation
- Given address: 300 N L.P. Miller St, Murray, KY 42071. Supplied approx coords
  (36.611222, -88.328239) landed ~2.5 km WEST in a residential block next to
  Murray State University — wrong building.
- Web research (Macrae's / Kentucky Cabinet for Economic Development / foodproduction.us)
  confirms Kenlake Foods is a wholly-owned Kroger manufacturing subsidiary
  (dry mixes, drink mixes, oatmeal, salted nuts; $24M expansion announced 2023)
  and gave coords ~36.6146, -88.2994.
- Satellite probing locked the real plant at **36.6122, -88.2988** — a large,
  contiguous multi-building industrial manufacturing complex (sawtooth-roof
  production hall + north flat-roof warehouse) on the east edge of downtown
  Murray, bounded by Olive St (N) and the N L.P. Miller / Maple St grid.
  Positively the right facility (large beverage/food manufacturing plant).

## Key views
- **z17/z18 overview:** one big connected plant complex; sawtooth manufacturing
  building center, flat-roof warehouse to the north, internal paved truck yard
  between them, large paved trailer lot on the WEST side, employee parking on
  the south.
- **Street View (2026-03), north entry / Olive St:** open paved truck lot off
  the public street — a red Volvo tractor-trailer parked in the open, rows of
  blue waste/recycling containers, NO gate and NO booth. Chain-link fence rings
  only the employee parking, not the truck approach.
- **SV east frontage looking S:** public street between the plant (fenced
  employee lot, monument "Kenlake Foods" sign) and a neighboring lot; trucks
  visible inside; no controlled entrance.

## Gate / guard / docks
- **truckGate: FALSE** — multiple open paved access points straight off public
  streets; no barrier arm, sliding/swing gate, or checkpoint pinch-point at any
  approach checked.
- **guardShack: FALSE** — no booth structure anywhere near truck lanes.
- **remoteGs: FALSE** — no gate to imply kiosk/app check-in.
- **Docks:** face the internal north yard between the two buildings; roof shadow
  obscures an exact count — estimated **10–25** (band), ~18 doors.
- **postGateStaging: TRUE / drivewayLong: TRUE** — deep internal paved yard holds
  a 3+ truck queue before the docks.

## Yard zones & counts
- Perimeter traced as a 6-vertex ring around the core plant property
  (~**16.4 acres**), oriented to the slightly-rotated street grid.
- Drop yard: paved trailer lot with angled drop stalls on the west side
  (**dropArea 10–25**, capacity ~30 trailers, ~6 visible).
- Dock apron: thin quad against the north internal-yard dock wall.
- buildingCount 2 (production hall + warehouse, contiguous → not a multi-facility
  campus). railServed false. scale false.
- Street View coverage OK at both perimeter and truck-gate centroids (panos
  recorded).

## Web findings
- Kroger subsidiary, ~20+ yrs in Murray, 800+ SKUs (dry/drink mixes, oatmeal,
  nuts, puddings/gelatins); 2023 $24M expansion / +15 jobs. Older urban plant.

## Confidence
**HIGH** — facility unambiguously identified; gate/guard verdicts confirmed on
recent (2026-03) Street View from several headings. Soft spots: exact dock-door
count and ship/receive separation (overhead roof shadow) — flagged.
