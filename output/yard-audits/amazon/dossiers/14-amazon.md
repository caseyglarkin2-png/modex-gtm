# Deep-Audit Dossier — Amazon TPA1 Fulfillment Center, Ruskin FL (idx 14)

**Facility:** Amazon TPA1 Fulfillment Center
**Type:** Fulfillment Center
**Address:** 3350 Laurel Ridge Ave, Ruskin, FL 33570
**Resolved center:** 27.726800, -82.387200
**Method:** deep-audit (satellite probe + Street View + web research)
**Confidence:** high

---

## Step 0 — Facility confirmation

The supplied coordinates (27.727553, -82.388056) landed on the NW corner of a
very large white distribution building. Probing satellite z16–z18 around that
point and cross-checking the street address confirmed the right building: a
single ~1M+ sq ft fulfillment center oriented NNW–SSE, set on the rural fringe
SE of Tampa with I-75 running along its east side, employee parking wrapping the
north/west, and a truck dock/drop yard along the east face. Web research
(Tampa Bay Chamber, FLEX Fulfillment, youramazonguy, nmfclist) all place Amazon
TPA1 at 3350 Laurel Ridge Ave, Ruskin FL 33570 — consistent with this building.
The supplied coords sit on the building's NW roof corner; I locked the true site
center at 27.7268, -82.3872.

---

## Key views and what they showed

- **Wide z16/z17 (whole site):** Long white FC building rotated ~12° east of
  north. West side = associate car parking (incl. solar carport canopies).
  East face (toward I-75) = the dock line with trailers backed in plus a second
  trailer row in the drop yard. South end = the truck gate/checkpoint and a
  staging apron. I-75 to the east; a wastewater-treatment plant and open land
  beyond.
- **East mid-building z19 (dock face):** Continuous rhythm of dock doors running
  the entire east wall with trailers backed in, a wide truck court, and a second
  staged trailer row beyond it. Yard tractors (hostlers) visible moving in the
  court. This is the dock apron + drop yard.
- **South end z18/z19:** Truck access road curves up from Laurel Ridge Ave to a
  checkpoint pinch-point with lane striping/crosswalk markings and small
  booth-sized structure(s) beside the lane; a large round water/fire tank sits
  just east of the entrance. Covered (solar carport) parking on the west.
- **SE corner z20:** Rows of parked trailers (drop yard) with a wide drive lane
  and fire-lane markings.
- **Street View — west public road (pano N_lPZyK0j_8mB--1Gie8pQ, 2025-01):**
  Looking ESE toward the site, red sleeper-cab tractors are staged on a paved
  apron beside the white water tank, with the FC building behind — a clear
  pre-gate staging area. The internal gate itself is not reachable by Street
  View (set behind a tree buffer; the only nearby pano on the east is on I-75
  and sees only the highway).

---

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** The south truck driveway off Laurel Ridge Ave pinches
  at a checkpoint with lane striping where it enters the secured east drop yard
  (z19, ~27.7252,-82.3858). Not an open driveway.
- **Guard shack — TRUE (flagged uncertain).** A small booth-footprint
  structure sits beside the truck lane at the checkpoint — consistent with a
  staffed guard booth, which is standard at Amazon FCs of this size. Exact
  roofline is at the edge of satellite resolution and no Street View reaches the
  internal gate, so it is listed in `uncertainFields`. `remoteGs` = false
  because a booth is present.
- **Dock doors — 50+ (est. ~120).** Continuous dock-door line with trailers
  backed in runs the full east building face. Single dock bank → `shipRcvSeparate`
  = false.
- **Drop yard — TRUE, dropArea 50+.** A second trailer row east of the dock
  apron plus the SE drop lot hold many parked trailers without tractors.

---

## Yard zones and counts measured

- **perimeter** — 6-vertex oriented ring around the full fenced property
  (west parking + building + east dock/drop yard + south gate/staging),
  ~65.4 acres.
- **truckGate** — rotated quad over the south checkpoint apron.
- **dockAprons** — one long thin quad hugging the east dock wall at the
  building's ~12° angle.
- **dropYards** — two rings: the long east trailer row and the SW/south
  trailer lot.
- **staging** — pre/post-gate apron at the SW approach where trucks queue.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~140,
  trailerParkingCapacity ~200, truckGateCount 1, buildingCount 1,
  siteAreaAcres 65.4, railServed false. Counts are honest overhead estimates.
- **streetViewMeta:** truckGate → pano `N_lPZyK0j_8mB--1Gie8pQ` heading 57°
  (the staged-truck approach frame, the most valuable driver's-eye view);
  perimeter → pano `PsJUzMPaQhpFtpbdQe5R0g` heading 117°. Both hasCoverage true.

---

## Other classification notes

- **preGateStaging / postGateStaging — TRUE.** Staging apron outside the gate
  (Street View shows staged tractors) and a wide internal truck court before the
  docks.
- **drivewayLong — TRUE.** The internal court easily holds a 3+ truck queue.
- **entryExitTogether — TRUE.** Single south gate group; `entryLanes` ~2,
  `exitLanes` ~1 (both estimated/uncertain).
- **fastLaneOpportunity — TRUE.** Wide gate apron + broad truck court leave room
  for an express/bypass lane.
- **backupSensitive — FALSE.** Gate sits deep inside the property off an
  internal access road with ample stacking room; a queue would not spill onto a
  public road.
- **urbanRural — Rural.** Edge-of-town site on Tampa's rural fringe beside I-75,
  bordered by open land/farmland and a wastewater plant.
- **connectivityIssue — FALSE.** Directly on the I-75 corridor with dense
  development across the highway; cellular coverage is fine.
- **multipleFacilities — FALSE** (single building). **scale — FALSE**
  (no weigh pad seen). **multiStep — FALSE** (no distinct second checkpoint).
- **railServed — FALSE.**

---

## Web findings

Amazon TPA1 is a large-scale fulfillment center at 3350 Laurel Ridge Ave,
Ruskin FL 33570, open 24/7, with scheduled delivery appointments and driver
wait areas — consistent with the gated, staged, high-dock-count yard observed.
Sources: Tampa Bay Chamber, FLEX Fulfillment, youramazonguy FC address list,
nmfclist, chamberofcommerce.com.

---

## Final confidence: high

Building identity, gate presence, dock band, and drop yard are all clearly
evidenced. The guard-shack call and exact entry/exit lane counts are the only
soft spots (limited resolution at the internal gate, no Street View there) and
are flagged in `uncertainFields`.
