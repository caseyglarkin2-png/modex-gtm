# Deep-Audit Dossier — Cheney Brothers, Florence SC (new cold DC)

**Account:** Performance Food Group (Cheney Brothers subsidiary)
**Roster idx:** 1
**Type:** Refrigerated/Freezer Distribution Center
**Address:** 2491 Florence Harllee Blvd, Florence, SC 29506
**Locked coordinates:** 34.271014, -79.694676 (graded pad center)
**Final confidence:** LOW — greenfield site, building not yet built in available imagery.

## Step 0 — Location confirmation
The roster coordinates (ROOFTOP geocode, 166 m moved) land inside the Pee Dee
Commerce City East Industrial Park off Florence Harllee Blvd, just south of
I-95 in Florence County, SC. Web research confirms this is the correct site:
A M King and FCEDP both name 2491 Florence Harllee Blvd / Pee Dee Commerce City
East Industrial Park as the Cheney Brothers Florence DC. The S.C. Governor's
office, WMBF, and the Greater Florence Chamber confirm a $42.5M expansion
announced March 2026.

## Key views
- **Satellite z16/z17/z18:** The roster point sits on a large trapezoidal
  earthwork/grading pad. The pad shows raw graded earth and stone base, silt
  fencing along the south edge, a retention pond at the SW corner, and a
  partially built access road off Florence Harllee Blvd. No building shell,
  no dock doors, no trailer parking, no gate structure are present. The
  completed buildings visible to the NE and E in wide views are separate
  tenants of the industrial park (large DCs with their own trailer yards).
- **Street View (Feb 2024), heading N from 34.2698,-79.6935:** Confirms the
  on-the-ground state — bare graded dirt, silt fence, construction equipment
  (excavator/dozer) on the pad, a fire hydrant at the road edge. No structure.

## Gate / guard-shack / dock determination
Not classifiable. There is no building, no truck entrance, no docks and no
guard booth in any imagery. `truckGate`, `guardShack`, `remoteGs` and all
yard-feature flags are reported `false` / `NONE` solely because the physical
yard does not yet exist — they are listed in `uncertainFields`.

## Yard zones and counts
- **perimeter:** Drawn around the visible ~50-acre graded site, bounded south
  by Florence Harllee Blvd. This is the planned property footprint, not a
  measured operating yard.
- All sub-zones (`truckGate`, `dropYards`, `dockAprons`, `staging`) are
  null/empty — nothing built.
- `yardMetrics`: dockDoorCount 0, buildingCount 0, trailers 0. Planned spec
  (not visible): 386,047 sq ft, 45 dock positions, ~50 acres.

## Web findings
- A M King: 386,047 sf refrigerated/freezer DC, 45 dock positions, ~50 acres,
  multi-temperature (dry 100,963 sf; freezer 90,095 sf; cooler 60,683 sf),
  plus office, retail, test kitchen. Described as A M King's 4th Cheney
  Brothers project.
- FCEDP / S.C. Governor (March 2026): $42.5M expansion, 85 new jobs; total
  Cheney Brothers investment in Florence County now $108.5M. Original
  groundbreaking 2023.

## Final confidence: LOW
The facility is a greenfield distribution center still under construction in
the imagery available. A meaningful truck-yard classification is impossible
until the building and yard are complete. Recommend re-auditing once newer
satellite imagery shows the finished structure.
