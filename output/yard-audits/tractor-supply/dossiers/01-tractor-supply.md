# Deep-Audit Dossier — Tractor Supply Distribution Center, Pendleton IN

**Facility:** Tractor Supply Distribution Center Pendleton IN (idx 1)
**Type:** Distribution Center
**Address:** 320 Enterprise Dr, Pendleton, IN 46064
**Resolved center:** 39.99820, -85.77280
**Method:** deep-audit (satellite + Street View)
**Confidence:** high

---

## Step 0 — Location confirmation
The supplied approximate coordinates (39.998337, -85.772929) landed directly on
the roof of the correct building — no correction needed. A zoom-17 satellite
crop at the point showed a single very large distribution building ringed by
loading docks and trailers on three faces, consistent with a DC (not an office).
A zoom-15/16 context pull placed it on the west edge of Pendleton IN, hard
against I-69, with farm fields to the west and south and apartment/light-
industrial development to the east. Web search confirmed 320 Enterprise Dr,
Pendleton IN 46064 as the Tractor Supply Pendleton Distribution Center
(TruckMap, Waze, Nextdoor, Yellowpages all corroborate the address and that it
is a TSC distribution center). Building positively identified.

## Key views and what they showed
- **z17 / z16 overview:** Large rectangular building, long axis roughly N-S and
  slightly rotated. Docks with trailers on the **west**, **south**, and **east**
  faces. A lighter/white roof section on the east face reads as a newer
  expansion. Employee parking sits north of the building; a graded expansion pad
  and retention pond sit further north; a drainage canal runs the west edge.
- **z19 NE corner:** Enterprise Dr loops in from the NE; a tractor-trailer is
  parked on the entry drive; the truck driveway pinches toward a single
  entrance.
- **z18/z19 west + south:** Long banks of dock doors with dozens of trailers
  backed in along the west face and the south face; a drainage canal/treeline
  beyond the west fence.
- **z19 SE / drop yard:** Fishbone (angled) rows of parked trailers form a
  dedicated drop yard on the east side, plus a large open paved south yard for
  maneuvering and trailer storage.

## Gate / guard-shack / dock determinations (with evidence)
- **Truck gate — TRUE.** Street View at the NE entrance (pano 39.99989,
  -85.77089, captured 2025-06) shows a **chain-link perimeter fence with slatted
  privacy panels** and a **wide sliding/swing gate opening** across the truck
  drive. **Concrete jersey barriers** (orange-topped) channel arriving traffic
  into the lane. This is a controlled, fenced, gated entry — not an open
  driveway.
- **Guard shack — FALSE.** No staffed booth (no small multi-window structure
  beside the lane) is visible in any Street View heading (W/SW/NW/inward). Entry
  control is fence + gate + barriers only.
- **Remote GS — TRUE.** Gate present but unmanned implies kiosk / call-box / app
  check-in.
- **Dock doors — 50+.** Loading docks run along three building faces (west long
  bank, south bank, east bank) with trailers backed in across all three;
  estimated ~180 doors total — comfortably in the 50+ band.
- **Ship/Rcv separate — TRUE (medium confidence).** Dock activity is split
  across physically separate building faces (west bank vs south/east banks),
  consistent with separate shipping and receiving clusters.

## Yard zones and counts
- **Perimeter:** Oriented 5-vertex ring tracing the paved yard inside the fence,
  following the canal curve on the NW and the treeline on the south/SE.
  **~34.9 acres.**
- **Truck gate zone:** Quad over the NE gate opening, aligned to the entry drive.
- **Staging:** Pre-gate apron on the Enterprise Dr curve just outside the gate
  (pre-gate truck wait room); a large paved yard inside the gate also serves as
  post-gate staging.
- **Drop yards (array, 2):** (1) east-side fishbone trailer rows; (2) south
  paved trailer yard.
- **Dock aprons (array, 3):** thin quads hugging the west, south, and east dock
  faces at the building's true orientation.
- **yardMetrics:** dockDoorCount ~180, trailersVisible ~240, trailerParking
  capacity ~320, truckGateCount 1, buildingCount 1, siteAreaAcres 34.9,
  railServed false (no spur enters the property). Counts are honest overhead
  estimates.

## Street View metadata
Road coverage exists at the NE entrance (pano captured 2025-06). truckGate
camera heading 220° and perimeter camera heading 225° both point from the road
pano toward the gate/yard. `hasCoverage: true` for both; pano id left blank
(probe.ts resolves the live pano id at render time from the metadata endpoint).

## Setting / connectivity
Edge-of-town Pendleton IN: bordered by I-69 and farmland with adjacent apartment
and light-industrial development to the east. Broader setting is **Rural** (small
town surrounded by fields), but not isolated — development is nearby, so
`connectivityIssue: false`.

## Web findings
320 Enterprise Dr, Pendleton, IN 46064; "Tractor Supply Company — Pendleton
Distribution Center"; phone (765) 778-8721. Corroborated by TruckMap, Waze,
Nextdoor, Facebook, Yellowpages, and Chamber of Commerce listings as a TSC
distribution center serving the Midwest store network.

## Final confidence
**High.** Building unambiguously identified; gate, fence, and absence of a guard
shack are clearly visible in 2025-06 Street View; dock and yard layout clear in
high-zoom satellite. Lower-confidence items (lane counts, exact ship/rcv split,
trailer capacity) flagged in `uncertainFields`.
