# Deep-Audit Dossier — Publix Produce DC Lakeland FL (Fresh/Deli)

- **idx:** 3
- **Type:** Produce DC (Fresh Foods / Deli / Dairy manufacturing + distribution)
- **Address:** 3045 New Tampa Hwy, Lakeland, FL 33815
- **Resolved center:** 28.042098, -82.007792
- **Confidence:** high
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation
The supplied coordinates landed directly on a large multi-building industrial
campus, and they were kept. Web research confirms 3045 New Tampa Hwy is the
**Publix Manufacturing Central Warehouse (MCW)** — variously listed as Publix
Fresh Foods Warehouse, Deli Plant, Dairy Plant and Produce/Manufacturing
warehouse. The USDA FSIS establishment directory lists it as **Publix
Supermarkets, Inc. Deli Plant**, a "Large" meat/poultry processing
establishment, at this exact address. This is a manufacturing-plus-distribution
complex and is distinct from the Publix County Line HV/LV DC (idx 1) ~3 km south
and the Frozen DC (idx 2) on Airport Rd. The building cluster matches the
facility type (large processing/warehouse buildings, refrigeration silos,
extensive trailer yards), so the audit proceeded on this site.

## Key views
- **z16/z17 overview:** A large fenced campus of several big white-roof
  warehouses and processing plants bounded by a golf course and retention ponds
  to the N/E/W and by New Tampa Hwy (divided highway) to the S. Trailer drop
  yards wrap the north and west sides; employee parking fills the south frontage.
- **Central checkpoint (z20 @ 28.0395,-82.0070):** A controlled gate on the main
  N-S internal drive — a small guard booth sits in the drive median with a long
  white sliding/swing barrier across the lanes. Lane markings funnel traffic
  through a pinch-point between the south employee lots and the dock core.
- **Street View (pano LG3KSHrUjuj2o7LcGTFJiw, 2011-04):** The only pano on the
  property, on the internal Gate-5 access road. A green **"GATE 5"** sign
  confirms numbered, controlled gates; chain-link perimeter fencing runs on both
  sides of every approach. heading 348 frames the fenced approach toward the gate
  — the arrival view a driver sees.
- **East warehouse dock face (z19 @ 28.0415,-82.0040):** Long dock bank with 20+
  doors and trailers backed in; employee parking and a retention pond to the east.
- **NW trailer yard (z19 @ 28.0432,-82.0095):** Dedicated drop yard packed with
  100+ trailers in dense rows — clearly a high-volume drop operation.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Controlled checkpoint with a sliding/swing barrier across
  the truck lane (satellite), numbered "GATE 5" signage, and a continuous fenced
  perimeter (Street View). Not an open driveway.
- **guardShack = TRUE.** A small ~1-2-car-footprint booth sits in the median of
  the checkpoint drive, beside the barrier, on a fenced, numbered-gate campus
  consistent with a staffed entry.
- **remoteGs = FALSE** (a guard shack is present).
- **dockDoors = 50+.** Multiple large warehouses each carry long dock banks; the
  east warehouse alone shows 20+ doors with trailers backed in, plus dock faces
  on the central buildings and processing plant. ~130 doors estimated campus-wide
  (exact counts obscured by rooftops at z20 — flagged uncertain).

## Yard zones and counts
- **perimeter:** oriented 7-vertex ring tracing the fenced operational footprint
  (excludes the surrounding golf course and ponds). ~113 acres.
- **truckGate:** quad over the central Gate-5 checkpoint median/barrier.
- **dropYards:** (1) the large NW trailer yard; (2) the south-central drop yard
  along the internal spine.
- **dockAprons:** (1) the east-warehouse dock apron; (2) a central-building dock
  apron strip, traced parallel to the building faces.
- **staging:** null (no distinct pre/post-gate staging stall block isolated;
  internal staging is folded into the broad paved yards).
- **yardMetrics:** dockDoorCount ~130, trailersVisible ~320, capacity ~450,
  truckGateCount ~3 (numbered gates), buildingCount ~9, siteAreaAcres ~113,
  railServed false.

## Web findings
- 3045 New Tampa Hwy = Publix Manufacturing Central Warehouse / Fresh Foods /
  Deli / Dairy complex (Waze, TruckMap, Loc8NearMe, Yelp).
- USDA FSIS: "Publix Supermarkets, Inc. Deli Plant" — Large establishment, meat
  and poultry processing, at this address.
- Phone (863) 688-1188 (shared Lakeland Publix warehouse switchboard).

## Final confidence
**High.** Location is unambiguous and corroborated. Gate + guard shack are
directly visible in satellite and supported by the "GATE 5" / fenced-perimeter
Street View. Dock-door and lane counts are honest overhead estimates and are
flagged in `uncertainFields`; no truck scale was resolvable.
