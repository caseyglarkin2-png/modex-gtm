# Deep-Audit Dossier — Stop & Shop Fresh DC, Freetown (Assonet) MA

- **Facility:** Stop & Shop Fresh DC Freetown MA (ADUSA Supply Chain "Freetown Fresh", refrigerated/perishable)
- **Type:** Fresh DC
- **Address:** 136 South Main Street, Assonet, MA 02702 (shared campus address)
- **Audited center:** 41.77930, -71.09380 (south/fresh building)
- **Gate:** ~41.77890, -71.09115
- **Confidence:** High
- **Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation and the campus split

The supplied coordinates (41.779383, -71.091412) are imprecise (Assonet, city-level); they actually land on the **gate plaza / access road**, not on a building. Satellite probing around the point and a zoom-out to z15 revealed the real ADUSA campus ~300-500 m to the NW.

**The campus holds TWO contiguous large DC buildings, not one combined building:**

1. **Northern building** — the larger mass (employee parking lot to its east, docks on its north and SW faces). This is ADUSA **"Freetown Grocery"** (dry/non-perishable, ~1.1 M sq ft). *Covered by the sister agent.*
2. **Southern building** — the building audited here, ADUSA **"Freetown Fresh"** (refrigerated/perishable). Long flat-roofed mass rotated ~20-25° off north, with docks on its SW face and a very large reefer-trailer drop yard on its east/southeast side.

The two buildings are **joined by a central office/connector spine** (visible at z18, 41.7803,-71.0948 — a multi-level office/link block with the employee lot to the NE) and **share a single guarded entrance plaza**. They are clearly two separable masses sharing one property — **not** one genuinely-combined building. The duplicate (idx 1, grocery) is therefore legitimate and should be kept; this audit covers only the refrigerated fresh portion (south building + its east/SE drop yards), with the fresh/grocery boundary drawn at the connector spine.

Web corroboration: ADUSA / Ahold Delhaize releases list both "Freetown Grocery" and "Freetown Fresh" as Assonet facilities; address 136 S Main St, Assonet MA 02702 confirmed via Yelp (13 reviews), Foursquare, Loc8NearMe, and the facility Facebook page; Teamsters Local coverage (WBSM) confirms an active ~900-job union DC.

## Key views and what they showed

- **z15/z16 wide:** Two large buildings + employee lot + drop yards + retention ponds, set in woods off Route 79.
- **z17 south building (41.7793,-71.0938):** Best footprint view. Fresh building with SW-face docks, NE/E-face dock apron and dense trailer drop rows, a fuel island/service structures in the yard, connector to the grocery building at top-left.
- **z18 roofs:** Flat membrane roofs, regular dock-door rhythm with trailers backed in on both buildings.
- **z19/z20 gate plaza (41.7789,-71.0911):** Wide checkpoint plaza with a center guard-booth island, hatched concrete median, channelizing bollards, and split inbound/outbound lanes.

## Gate / guard-shack / dock determinations (with evidence)

- **truckGate = TRUE.** The internal access road runs ~250 m from the public road, forks at a Y-junction, then funnels north through a controlled checkpoint plaza. Street View (pano `uI2zHoCYzOkXe-FV-6zJfw`, captured 2023-07; best at heading ~319°) shows the roadway splitting around a center island with channelizing bollards and red STOP/check-in signage. Satellite z20 confirms the booth island with hatched median.
- **guardShack = TRUE.** A low single-story **guard booth** (≈1-vehicle footprint, windows, red signage) sits on the gate island. Driver review (TruckersReport / WanderBoat): *"a guard at the gate gives drivers assigned parking spots in the staging area … only allows entry with a PO number."* Manned check-in.
- **remoteGs = FALSE** (booth is staffed, not a kiosk).
- **postGateStaging = TRUE.** Trailers staged along the internal road (Street View shows reefers parked on the shoulder with a "15" speed sign) plus a large paved overflow/staging lot east of the gate, inside the property and before the docks.
- **preGateStaging = FALSE.** No dedicated truck stalls outside the gate; the gate is far up a private drive.
- **drivewayLong = TRUE / backupSensitive = FALSE.** Long approach + deep post-gate plaza hold well over 3 trucks; gate set far back, so no public-road spillback.
- **entry/exit = together, ~1 in / ~1 out lane** around the booth island (estimate from one pano). **fastLaneOpportunity = TRUE** — wide plaza with unused paved width for an express/appointment bypass.
- **dockDoors = 50+** (overhead estimate ~90-100 across the fresh building's SW and NE/E faces + connector).
- **dropArea = 50+ / dropYard = TRUE.** Extensive trailer-only drop rows fill the east/SE yard (hundreds of stalls) — a reefer/perishable drop operation.
- **shipRcvSeparate = TRUE** (separate dock banks on two building faces; medium confidence from overhead).
- **scale = FALSE** (no weigh pad seen). **railServed = FALSE.** **multiStep = FALSE.**
- **multipleFacilities = TRUE** (Fresh + Grocery campus). **urbanRural = Rural** (edge-of-town wooded Assonet).

## Yard zones and counts measured

- **perimeter:** oriented 8-vertex ring around the fresh-DC portion (south building + east/SE drop yards + gate plaza), ~58 acres.
- **truckGate:** quad over the checkpoint plaza/booth island.
- **dropYards:** two oriented quads over the main east drop yard and the SE drop block (trailer rows run NE-SW, parallel to the rows).
- **dockAprons:** two oriented quads hugging the NE/E dock apron and the SW dock face at the building's angle.
- **staging:** quad over the paved overflow/staging lot east of the gate.
- **yardMetrics:** dockDoorCount ≈ 95, trailersVisible ≈ 240, trailerParkingCapacity ≈ 320, truckGateCount 1, buildingCount 1, siteAreaAcres ≈ 58, railServed false. Counts are honest overhead estimates (flagged in uncertainFields).

## Street View metadata

- truckGate / perimeter: pano `uI2zHoCYzOkXe-FV-6zJfw` (gate booth island), 2023-07.
- dropYards: pano `9vK0XofNciTX-CyslbAdOg`.
- staging: pano `2TdyzFCP_cMTZxsP3di1ug`.
- Building interior / dock faces have no closer Street View; all coverage clusters on the internal road near the gate.

## Web findings

- ADUSA "Freetown Fresh" perishable + "Freetown Grocery" dry, both Assonet (Ahold Delhaize self-distribution releases; Progressive Grocer; Supermarket News).
- 136 S Main St, Assonet MA 02702 (Yelp, Foursquare, Loc8NearMe, Facebook).
- Staffed gate with PO-number check-in and assigned staging spots (driver reviews).
- Carrier-reefer trailers visible in-yard (e.g. Atlantic Capes seafood reefer) confirm refrigerated operation.
- ~900 Teamsters jobs; active facility (WBSM).

## Final confidence

**High.** Building positively identified, two-DC campus split resolved, gate + guard booth confirmed by both Street View and driver reviews. Lower-confidence items (exact dock/trailer/lane counts, ship/rcv separation) are flagged in `uncertainFields`.
