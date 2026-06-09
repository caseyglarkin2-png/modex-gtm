# Deep-Audit Dossier — Amazon SBD2 Fulfillment Center (idx 13)

**Facility:** Amazon SBD2 Fulfillment Center, San Bernardino CA
**Type:** Fulfillment Center
**Address:** 1494 S Waterman Ave, San Bernardino, CA 92408
**Resolved center:** 34.07280, -117.28350
**Confidence:** High
**Method:** deep-audit (satellite + Street View + web)

---

## Step 0 — Location confirmation

The roster supplied approximate coordinates 34.07233, -117.28174 (GEOMETRIC_CENTER
precision). Satellite probes at z15–z18 around that point landed directly on a very
large warehouse with a partial solar-panel roof, dock banks, and trailer drop yards,
bounded by the Santa Ana River wash to the south/west, S Waterman Ave (multi-lane
arterial) to the east, and the I-215 corridor beyond. A web search for "Amazon SBD2
1494 S Waterman Ave San Bernardino" corroborated this exact address (Waze, FLEX
Fulfillment, Chamber of Commerce, youramazonguy all list 1494 S Waterman Ave,
92408; reviews note long driver check-in wait times). The address pin sits on the
**southern solar-roof building** — that is SBD2. An adjacent large warehouse to the
north shares the drop yard between the two buildings, making this a two-building
campus. Resolved center locked at 34.07280, -117.28350.

---

## Key views

- **z15/z16 overview:** Dense Inland Empire logistics corridor. SBD2 is the
  solar-roofed building; wash/greenbelt to the south, wastewater-treatment tanks to
  the west, freeway and office parks to the east. Clearly Urban.
- **z17 full-campus:** Two large buildings. Southern (SBD2) building has long dock
  banks with trailers backed in along its south face; drop-yard trailer rows fill the
  space between the two buildings and along the west edge.
- **NE entrance (z19/z20):** A formal entrance auto-court / plaza with landscaped
  islands, pedestrian crosswalks, curving drives, and a **staffed security building
  with a red/maroon hip roof** just inside the gate.
- **Street View, S Waterman Ave frontage:** Continuous black metal perimeter fencing
  along the entire frontage. At the entrance drive, a **metal sliding/swing gate**
  spans the lane with a **call-box/kiosk pedestal** at the curb cut and the guard
  building behind it.
- **Mid-yard (z18):** Dozens of trailers in organized drop rows plus dock aprons with
  trailers backed in along the north/west dock faces.
- **SW corner (z19):** Paved turnaround/triangular pad; wash beyond. South edge is the
  Santa Ana River bed (undeveloped).

---

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Black metal sliding/swing gate across the controlled
  entrance drive off S Waterman Ave (east side); confirmed by Street View
  (pano `lCEQhIYK8lAI2ARkJB0yEQ`, Feb 2025) showing the gate, call box, and
  continuous perimeter fence.
- **Guard shack — TRUE.** A staffed security building (multi-window, red hip roof) sits
  just inside the gate beside the auto-court (satellite z20 + Street View). Larger than
  a 1-vehicle booth but functions as the staffed checkpoint.
- **Remote GS — FALSE.** A staffed booth is present, so this is guarded, not remote
  (despite the supplementary curb-side call box).
- **Dock doors — 50+.** Long dock banks on the south and north/west building faces of
  SBD2 with many trailers backed in; estimated ~90 doors from overhead.
- **Drop yard / drop area — 50+ / TRUE.** Extensive organized trailer-drop rows
  between the two buildings and along the west edge.
- **Ship/Rcv separate — TRUE (medium).** Dock activity on physically distinct faces
  suggests separate shipping vs receiving clusters.
- **Multiple facilities — TRUE.** Two large building clusters share the campus and
  the central drop yard.
- **Post-gate staging — TRUE.** Large interior auto-court / staging plaza before the
  docks. **Driveway long — TRUE** (deep gate-to-dock approach). **Fast-lane
  opportunity — TRUE** (wide gate apron + unused paved width).
- **Scale — FALSE; Rail-served — FALSE; multiStep — FALSE.**

---

## Yard zones & counts measured

- **Perimeter:** 6-vertex oriented polygon enclosing the southern SBD2 building plus
  its dock/drop yards (fence on Waterman east, wash south/west, access road north).
  Site area ~88.9 acres.
- **Truck gate:** quad over the NE entrance drive / auto-court off Waterman.
- **Drop yards (2):** north drop rows (between buildings) and the west-edge drop rows.
- **Dock aprons (2):** south dock-face apron and north/west dock-face apron.
- **Staging:** interior auto-court plaza just inside the gate.
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~180, capacity ~260,
  truckGateCount 1, buildingCount 2, siteAreaAcres 88.9, railServed false.
  (Counts are honest overhead estimates; flagged in uncertainFields.)

---

## Web findings

SBD2 is an Amazon Inland Empire fulfillment center at 1494 S Waterman Ave, 92408,
operating Sun–Fri ~6:00 AM–11:30 PM, with quick links to I-10/I-215 and Ontario
International Airport (ONT). Driver reviews specifically call out **significant
check-in / pickup wait times** — a direct yard-management pain point consistent with
the large gate auto-court and heavy trailer volume observed.

Sources: Waze SBD2 listing; FLEX Fulfillment SBD2 page; Chamber of Commerce;
youramazonguy address list; warehouse.ninja.

---

## Final confidence: High

Location unambiguous and corroborated; gate, guard building, perimeter fence, docks,
and drop yards all directly visible in satellite and Street View. Exact dock/trailer
counts and the ship/receive-separation call are overhead estimates (listed in
uncertainFields), but the structural classifications are well-supported.
