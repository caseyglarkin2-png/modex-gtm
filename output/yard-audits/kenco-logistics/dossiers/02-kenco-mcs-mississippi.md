# Deep-Audit Dossier — Kenco MCS Mississippi (Olive Branch, MS)

**Roster idx:** 2
**Type:** Multi-Client Distribution Center
**Address:** 11244 S Distribution Cove, Olive Branch, MS 38654
**Resolved coords:** 34.98890, -89.78290
**Confidence:** High

## Location confirmation
The roster pin (34.988452, -89.782908) lands squarely on a very large N-S
oriented warehouse inside an Olive Branch logistics park adjacent to an
airport runway. Web research (LoopNet, Colliers, CommercialCafe) confirms
11244 S Distribution Cove = "Olive Branch Distribution Center II," a large
distribution building; the Kenco warehousing map lists this Mississippi MCS
site at ~800,000 SF. The pinned building's scale, cross-dock layout and
trailer yards are consistent. Locked center at the warehouse centroid,
~34.98890 / -89.78290.

## Key views
- **z16 context** — large industrial park west of an airport runway;
  several big DCs. Pinned building is the brown/white-roofed N-S structure.
- **z17/z18 building** — single very large cross-dock; roof shows two colors
  (white north section, brown south section) but reads as one continuous
  building. Dock doors with trailers on BOTH long faces.
- **W face (z18)** — long continuous dock bank, trailers backed in, and a
  deep striped trailer-parking drop yard against open farmland.
- **E face (z19)** — long dock bank plus a large striped drop yard with many
  marked trailer stalls.
- **S end (z19 + Street View 2022/2023)** — office block, employee parking,
  and a large paved roundabout serving as a truck turnaround.
- **N end (z17)** — employee parking; truck courts continue along both faces.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** No barrier arm, sliding/swing gate, or checkpoint
  pinch-point anywhere the truck courts meet the public road. Truck courts on
  both faces are open and flow directly onto S Distribution Cove. Confirmed
  across z18-z20 satellite and Street View of the S entrance/roundabout.
- **Guard shack: FALSE.** No booth on the property. The S end has only an
  office building and a paved turnaround.
- **Remote GS: FALSE.** No gate at all, so no remote check-in implied.
- **Docks:** Long dock banks on both the W and E long faces of an ~800,000 SF
  cross-dock — banded **50+**. Two physically separate dock clusters →
  `shipRcvSeparate: true`.

## Yard zones and counts
- **Perimeter** — full parcel: building plus W and E truck courts/drop yards,
  ~59.8 acres.
- **truckGate** — null (no controlled gate).
- **dropYards** — two large striped trailer drop yards, one per long face.
- **dockAprons** — W-face and E-face dock aprons.
- **yardMetrics** — ~130 dock doors (estimate), ~90 trailers visible,
  ~200 trailer-parking capacity (estimate), 0 truck gates, 1 building,
  59.8 acres, no rail spur.

## Web findings
LoopNet / Colliers / CommercialCafe list 11244 S Distribution Cove as Olive
Branch Distribution Center II. Kenco operates an ~800,000 SF Multi-Client DC
in Olive Branch per its warehousing map; the Chervon/Skil distribution
relationship is also tied to Kenco's Olive Branch operations.

## Final confidence
High on location, gate, guard-shack and dock-side determinations — the open,
ungated layout is unambiguous in clear satellite + Street View. Door and
trailer counts are honest overhead estimates (flagged in uncertainFields).
