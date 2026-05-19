# Deep-Audit Dossier — Home Depot SDC, Savannah GA (idx 20)

**Facility:** Home Depot Stocking Distribution Center — "Crossroads" DC
(DCs #5150 / 5155 / 5157 / 5160)
**Address:** 125 Crossroads Pkwy, Savannah, GA 31407
**Resolved center:** 32.15820, -81.20380
**Confidence:** Medium

## Location resolution
The roster coordinate (32.158137, -81.203756) landed dead-center on a colossal
single distribution building — the Crossroads SDC. Web research confirms 125
Crossroads Pkwy is Home Depot's 1.4-million-sq-ft Crossroads Distribution
Center, opened 1995 and acquired by Home Depot on January 29, 2025 for
$145.5M from the Savannah Economic Development Authority. It operates 24/5 and
draws thousands of import containers from the Port of Savannah. The locked
center is the building centroid.

## Key views
- **z16/z17 wide:** One enormous distribution building running NW-SE, ringed by
  trailer / container parking along both long faces, with employee parking and
  a curved access drive at the NW. Woodland and water-retention ponds surround
  the property.
- **z19 NW corner:** The truck-yard entrance — an access drive curving into the
  property past a round white storage tank and a maintenance canopy, feeding the
  trailer-parking rows.
- **z21 dock yards / NE & SW faces:** Dense rows of trailers and import
  containers backed into dock doors on both long faces; property perimeter fence
  visible.
- **Street View (2025-11, Crossroads Pkwy access drive):** A metal swing-gate /
  barrier with a central island and bollards spans the access road, with orange
  traffic cones beyond — a controlled truck entrance set far back in the woods.

## Determinations
- **truckGate = true.** Confirmed by Street View — a metal swing-gate / barrier
  across the access road, and a fully fenced truck-yard perimeter.
- **guardShack = UNCERTAIN (recorded false / remoteGs true).** No standalone
  guard booth was positively resolved. The roadway barrier sits unmanned in the
  woods with no booth; the NW truck-yard entrance shows a maintenance canopy and
  a round storage tank, not a clear guard booth. The site is a 1995-vintage
  import DC newly acquired by HD (Jan 2025), so security posture may be evolving.
  The booth call and `remoteGs` are flagged uncertain for human review.
- **multiStep = false.** No second checkpoint stage observed.
- **scale = false.** No truck scale pad seen.
- **shipRcvSeparate = true.** Cross-dock SDC — dock doors on both long faces.
- **drivewayLong = true.** Long wooded access drive plus a deep internal truck
  yard give 3+ truck stacking room.
- **backupSensitive = false.** Gate set far back from public roads — no queue
  would reach a through road.
- **urbanRural = Rural.** Edge-of-metro site ringed by woodland and ponds
  outside Savannah's dense fabric.

## Yard zones and counts
- **Perimeter:** ~154 acres capturing the SDC building and both trailer yards.
- **Dock doors:** 50+ band; ~200 doors estimated across both long faces of the
  1.4M sq ft building (approximate).
- **Drop yard:** 50+ band; ~300 trailers / import containers visible, capacity
  ~380.
- **Buildings:** 1.
- **Rail:** No spur enters the property — not rail-served.

## Web findings
HD corporate news, Traded.co and the Savannah Chamber confirm: the Crossroads
DC at 125 Crossroads Pkwy — 1.4M sq ft, opened 1995, bought by Home Depot Jan 29
2025 for $145.5M (with surrounding land), feeding off Port of Savannah import
container volume; 24/5 operation.

## Final confidence: Medium
Facility identity, the truck gate and the dock layout are clear. The guard-booth
determination could not be positively resolved from available imagery, so
`guardShack` / `remoteGs` and the lane counts are flagged uncertain.
