# Deep-Audit Dossier — idx 21

## John Deere Parts Distribution Center — Waterloo, IA

**Type:** Parts Distribution Center
**Address:** 2280 Northeast Dr, Waterloo, IA 50703
**Resolved coords:** 42.50990, -92.28540 (center of the main gray DC building)
**Gate verdict:** No truck gate — open, uncontrolled entrance
**Guard-shack verdict:** No guard shack
**Confidence:** HIGH

---

## Step 0 — Locating the facility

The roster supplied 42.510059, -92.285149 with a geocode `movedMeters` of 2938 — a large shift, so the point needed confirmation. Probing satellite at z16-z17 around that point landed directly on a large distribution warehouse in an industrial pocket NE of Waterloo. Web research confirmed the address:

- Panjiva's buyer report lists **John Deere Parts Distribution Center, 2280 Northeast Dr, Waterloo, IA 50703**.
- Waze / loc8nearme also list **Ryder Integrated Logistics Inc** at the same address — consistent with Ryder running 3PL logistics for a Deere parts DC.
- Street View at the entrance shows a blue **"JOHN DEERE" monument sign** on the grass island, positively identifying the property.

Locked center on the main gray distribution building: **42.50990, -92.28540**.

## Imagery findings

| View | Zoom | What it showed |
|------|------|----------------|
| Overview | 16-17 | Large gray-roofed warehouse running N-S; separate blue-roofed building to the north; row of trailers down the east side. |
| Full property | 16 | Two buildings on one JD parcel + a long drop yard along the east side. A separate industrial campus lies west across the access road (not part of this facility). |
| Entrance | 19 + Street View | Wide open driveway apron off Northeast Dr; JD monument sign; no gate hardware. |
| East dock face | 18-20 | Dock doors along most of the gray building's ~700ft+ east wall with trailers backed in; smaller dock bank on the blue building's SE corner. |
| Drop yard | 19-20 | Multiple rows of parked unhitched trailers running the length of the east side — 50+ capacity. |
| West side | 18 | Building back wall + employee parking; no docks on the west face. |

## Gate / guard-shack / dock determinations

**Truck gate — FALSE.** The facility has a single truck entrance off Northeast Dr. Street View from **2021-06** (standing inside the driveway, looking both north toward the road and south into the property) and from **2025-03** (from the public road looking south into the entrance) both clearly show a wide, open driveway apron with **no barrier arm, no sliding/swing gate, and no checkpoint pinch-point**. Access is uncontrolled.

**Guard shack — FALSE.** No staffed booth (1-3-vehicle footprint, multi-side windows) anywhere near the entrance in any Street View heading. The only small structure is the John Deere sign monument on the grass island.

**remoteGs — FALSE.** Requires a truck gate to exist; there is none.

**Docks — "25-50" (medium confidence).** Loading docks are on the gray building's east face, with trailers backed in along most of its length, plus a smaller dock bank on the blue building's SE corner. Overhead door rhythm and backed-in-trailer count support roughly 40 doors; a parts DC of this size could plausibly have 50+, so the band is flagged uncertain. All docks are single-sided (east face) — no separate ship/receive clusters.

**Drop yard — "50+", dropYard = true.** A dedicated trailer-storage lot runs the entire east side of the gray building with multiple marked rows of unhitched trailers.

## Yard zones and counts

- **perimeter** — captures both buildings and the drop yard: roughly 42.5077-42.5129 N-S, -92.2872 to -92.2832 E-W (~45 acres of used property).
- **truckGate** — the open entrance apron off Northeast Dr (no hardware, but the entry point).
- **dropYards** — one box: the long drop yard east of the gray building.
- **dockAprons** — two: the gray building's east dock apron, and the blue building's SE dock apron.
- **staging** — the gravel/graded staging area NE of the blue building, inside the property.
- **yardMetrics** — ~40 dock doors; ~65 trailers visible; ~90 trailer capacity; 1 truck gate; 2 buildings; ~45 acres; no rail.

Other flags: `multipleFacilities = true` (two-building campus). `postGateStaging = true` and `drivewayLong = true` (long entrance driveway + large internal apron hold 3+ trucks). `fastLaneOpportunity = true` (very wide unmarked entrance apron). `entryExitTogether = true` (single combined driveway). `scale = false`, `multiStep = false`, `railServed = false`.

## Setting

`urbanRural = Rural` — an edge-of-town industrial pocket NE of Waterloo, ringed by active farmland. `connectivityIssue = false` at medium confidence (a neighboring industrial campus and nearby Waterloo development make weak cellular unlikely).

## Web findings

- Panjiva buyer report — confirms the JD Parts Distribution Center name and the 2280 Northeast Dr address.
- Waze / loc8nearme — Ryder Integrated Logistics co-located at the address (3PL operator).
- Deere corporate notes Waterloo includes service-parts operations, consistent with a dedicated parts DC here.

## Final confidence

**HIGH.** Facility positively identified (JD monument sign + corroborating address records). Clear recent satellite (©2026 Airbus/Maxar) and two Street View captures (2021, 2025) confirm the open, ungated, unguarded entrance. Only `dockDoors` (band) and `connectivityIssue` (inference) are flagged uncertain.
