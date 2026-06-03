# Yard Audit — Costco Depot, Monrovia MD

**Facility:** Costco Wholesale Depot 171 (Refrigerated Depot / Mid-Atlantic regional cross-dock)
**Address:** 5236 Intercoastal Dr, Monrovia, MD 21770 (Frederick County)
**Resolved center:** 39.3754, -77.2805
**Confidence:** High
**Method:** deep-audit (satellite + Street View + web)

---

## Location confirmation

Roster coords (39.377205, -77.27655) landed on the NE edge of the campus, near
the neighboring light-industrial buildings. Wide z15/z16 satellite probes
resolved the actual depot: a very large NW-SE cross-dock building plus a second
large building to the south, ringed by forest and farmland, set well back from
US-40/Old National Pike, with a residential subdivision to the south. True
campus center is ~39.3754, -77.2805. Identity confirmed by the street address,
the 84-acre / ~300-bay cooler-freezer GC project record, and multiple trucker
reviews naming "Costco Distribution Center, 5236 Intercoastal Dr, Monrovia."

Imagery currency: the most recent satellite (Airbus/Maxar 2026) and Street View
(2024-07) both show the facility fully built and operating; the 2024 Street View
also shows active expansion/construction near the NE entrance and visitor lot.

---

## Key views

- **z15/z16 campus** — full property: long diagonal cross-dock, a separate
  south building, extensive trailer drop yards, an internal loop road, forest
  and farm surroundings. Rural/edge-of-town setting.
- **z18 core** — main building with continuous dock doors and trailers backed in
  along both long faces; diamond skylight/solar roof pattern; drop-yard rows.
- **z18/z19 NE entrance** — access road sweeps in past a retention pond; the
  truck route splits with painted directional lane arrows; ancillary structure
  cluster and red-roofed canopies near the throat.
- **Street View (2024-07)** at the entrance junction — a **"TRUCK ENTRANCE
  ONLY"** sign and a tractor-trailer heading into the property; the approach is a
  wide multi-lane paved junction. Public Street View coverage **stops at the
  entrance throat** (ZERO_RESULTS beyond), consistent with a private/gated road.

---

## Gate / guard-shack / dock determinations

- **truckGate: TRUE.** Controlled truck entrance on the NE side: "TRUCK
  ENTRANCE ONLY" signage, directional lane arrows separating the truck route
  from the visitor/employee road, and public Street View terminating at the
  entrance throat (private beyond). Trucker reviews describe checking in "at the
  gate."
- **guardShack: TRUE.** Driver reviews explicitly report being "greeted by very
  friendly security" at the gate and note "the yard drivers don't have radios to
  the gate" — a staffed check-in gate. The booth sits inside the private throat
  (~39.3766, -77.2777), past Street View coverage; a small structure cluster is
  visible there in satellite. (remoteGs therefore FALSE.)
- **preGateStaging / postGateStaging: TRUE.** Reviews mention "curb parking
  outside the gate for waiting on dispatch" (pre-gate) and a top-notch paging
  system that pages drivers to doors after they queue inside (post-gate).
- **dockDoors: 50+ (firm).** Reviews reference doors numbered in the 500-553
  range; the main cross-dock has continuous doors with trailers backed in along
  BOTH long faces, plus the south building. Overhead estimate ~260 doors.
- **dropArea / dropYard: 50+ / TRUE.** Hundreds of drop trailers in long angled
  rows fill the SW yard, the central yard, and a north drop area; yard
  drivers/spotters are referenced in reviews.
- **shipRcvSeparate: TRUE.** Dock banks on both opposite faces of the main
  building plus the separate south building.
- **multipleFacilities: TRUE.** Two distinct large buildings + ancillary
  canopy/shop structures on one 84-acre campus.
- **fastLaneOpportunity: TRUE.** Very wide multi-lane entrance apron with unused
  paved width for an appointment/express bypass.
- **scale:** not confirmed in available imagery (possible inside the private
  throat) — left false, flagged uncertain.
- **railServed: FALSE.** No rail spur enters the property.
- **urbanRural: Rural.** 84-acre campus ringed by forest/farmland, set back from
  the highway; neighboring light-industrial to the NE but the broader setting is
  rural (per rubric tie-breaker).

---

## Yard zones & counts measured

- **perimeter** — 11-vertex ring tracing the fenced property along the
  forest/loop-road boundary (~84 acres).
- **truckGate** — quad over the NE entrance throat off the Intercoastal Dr
  internal road.
- **dropYards** — SW drop yard, central yard, and north drop area (3 rings).
- **dockAprons** — NE and SW long faces of the main cross-dock (oriented to its
  ~125° NW-SE axis) and the south building's dock face.
- **staging** — pre-gate curb/apron waiting area outside the gate.
- **yardMetrics** — dockDoorCount ~260, trailersVisible ~450, capacity ~600,
  truckGateCount 1, buildingCount 2, siteAreaAcres ~84, railServed false.

streetViewMeta: perimeter + truckGate both reference the nearest public pano at
the entrance (cD2v-OIUlFFs3FKOv64Jqw, 2024-07), headings 258° / 292° toward the
facility.

---

## Web findings

- Address/identity: Costco Wholesale Depot 171, "Frederick Wet 1053 / Dry 1052,"
  est. ~2010 (Yelp, Manta, D&B, Panjiva, Wikimapia).
- Trucker reviews (TruckersReport, TruckMap, WarehouseRating): friendly on-site
  security at the gate; top-notch paging system; doors numbered ~500-553;
  yard drivers without gate radios; curb parking + food truck outside the gate;
  highly variable wait times (check in ~2 hrs early before a 5am rush).

---

## Final confidence

**High.** Facility positively identified; gate/guard/dock calls corroborated by
both imagery and independent driver reviews. Lower-confidence items (exact
entry/exit lane counts, presence of a scale, exact door/trailer counts) are
flagged in `uncertainFields`.
