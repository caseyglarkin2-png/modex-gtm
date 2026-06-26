# Deep-Audit Dossier — Kroger Distribution Center, Houston TX (idx 56)

## Resolved location
- **Facility:** Kroger Distribution Center ("Gellhorn Warehouse"), 701 Gellhorn Dr, Houston, TX 77029 — Kroger's primary grocery DC for the Houston region.
- **Resolved center:** 29.78420, -95.27050 (main DC complex). The supplied point (29.783452, -95.269533) landed in the active east truck/trailer yard, SE of the main building; the building cluster is NW of it.
- **How confirmed:** Web search confirmed 701 Gellhorn Dr = Kroger DC / Gellhorn Warehouse (Yelp, Kroger logistics page, Manta, Chamber of Commerce). Satellite z16–z18 around the point showed a very large multi-wing white-roofed grocery DC with dock canopies, an enormous trailer drop yard, and a private tractor fleet — consistent with a primary grocery DC.

## What each key view showed
- **z16/z17 overview:** Large multi-building white-roofed DC; long dock faces with trailer canopies on the south and east; massive trailer drop yard to the SW; employee car park on the SE; rail spur through the property.
- **z18–z21 entrance crops (~29.7834,-95.2700):** A perimeter chain-link fence separates employee parking from the truck lane. A small white **guard booth** (~1-vehicle footprint) sits in the truck lane with yellow hatched markings around it. A second small guard house sits a bit north along the fence. Wide multi-lane paved truck apron.
- **Street View (pano 9M91_PAnJT0WM4NppIYcuQ, 2022-04, @29.78283,-95.26942):** The only nearby coverage — the driver's-eye arrival frame. Shows the wide truck entrance apron, perimeter fence with a Kroger sign, a rail line in the foreground, and the DC dock face with trucks beyond. Confirms a guarded, fenced, multi-lane entrance.

## Gate / guard-shack / dock determinations
- **truckGate = true:** Controlled, fenced truck entrance with a checkpoint pinch-point and hatched lane markings off the east access drive.
- **guardShack = true (→ remoteGs false):** Small staffed booth in the truck lane at the gate, confirmed at z21 and in Street View. A second guard house is present along the fence (postGateStaging checkpoint).
- **dockDoors = 50+:** Long south-facing dock apron on the main building plus a separate east-facing dock face; dock-canopy rhythm implies well over 50 doors (estimated ~130).
- **shipRcvSeparate = true:** Two distinct dock banks on different building faces.

## Yard zones & counts measured
- **Perimeter:** ~45.4 acres fenced footprint (6-vertex oriented ring tracing main building + east yard + SW drop yard + employee parking).
- **dropYards:** (1) large SW trailer drop yard, hundreds of trailers in rows; (2) secondary east truck/trailer yard with private-fleet tractors. **dropArea band = 50+.**
- **dockAprons:** south face of main building + east dock face (canopied).
- **staging:** wide paved apron inside the entrance before the docks (postGateStaging true).
- **Metrics:** ~130 dock doors, ~220 trailers visible, ~350 trailer capacity, 1 truck gate, 2 buildings, **railServed = true** (spur enters NW corner and runs SE through the site).

## Web findings
- Kroger primary Houston DC / Gellhorn Warehouse; ~250–499 staff; operates as a grocery distribution hub with a private tractor fleet. A second Kroger DC exists at 9835 Genard Rd (separate site, not this one).

## Final confidence
**High.** Facility unambiguous and well-imaged. Gate + guard shack confirmed by both z21 satellite and Street View. Uncertain: exact entry/exit lane counts, presence of a truck scale (none clearly seen), and whether to count the complex as 1 vs 2 buildings.

**Summary:** Truck gate — YES (fenced, multi-lane, guarded). Guard shack — YES (booth in truck lane at the gate). Confidence — HIGH.
