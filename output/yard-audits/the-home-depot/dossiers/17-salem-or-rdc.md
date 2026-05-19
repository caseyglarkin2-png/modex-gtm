# Deep-Audit Dossier — Home Depot RDC, Salem OR (idx 17)

**Facility:** Home Depot Rapid Deployment Center (DC #5639)
**Address:** 4999 Depot Court SE, Salem, OR 97317
**Resolved center:** 44.90460, -122.96170
**Confidence:** High

## Location resolution
The roster coordinate (44.904755, -122.962671) landed in the central truck yard
of the facility — within ~150 m of the building, accurate enough for Step 0.
Web research confirms 4999 Depot Court SE is Home Depot's RDC: a ~467,000 sq ft
building opened in 2010 in the Mill Creek Corporate Center industrial district
just east of Interstate 5, serving HD stores across OR, WA, ID, MT and WY,
running 24 hours Monday-Friday. Satellite imagery shows one long white
distribution building running NE-SW, with dock doors on both long faces and a
large trailer drop yard wrapping its SW and NE sides. The locked center sits on
that building. A second very large building lies to the SW; it is a separate
tenant in the same corporate park and is excluded from the HD perimeter.

## Key views
- **z16/z17 wide:** Two huge DC buildings in a planned industrial park. The HD
  RDC is the NE building. Hundreds of trailers fill the marked drop-yard stalls
  between and around it.
- **z20 central yard (44.9047, -122.9627):** A small dark-roofed booth sits in
  the middle of the main truck drive, with gate islands and lane markings
  fanning out around it. A tractor-trailer and several cars are queued at it —
  this is the manned check-in / guard point controlling the internal yard.
- **z19 dock face (44.9036, -122.9599):** Long regular rhythm of dock doors with
  trailers backed in along the NE long face of the RDC.
- **z19 SE entrance:** Truck-only driveway off Depot Court SE, well set back from
  the public road behind landscaped berms.
- **Street View (2016-08, Depot Court SE):** Panos along the road show the
  property's chain-link perimeter fence with rows of parked trailers behind it;
  the gate itself is set back beyond the camera reach.

## Determinations
- **truckGate = true.** A controlled truck entrance off Depot Court SE feeds an
  internal checkpoint with gate islands and painted lanes — a clear pinch-point.
- **guardShack = true.** The small (~1-vehicle-footprint) dark-roofed booth in
  the central truck drive, set beside the gate islands with trucks queued at it,
  is a staffed guard booth — not the main building. `remoteGs` is therefore
  false.
- **multiStep = false.** Single checkpoint stage; no second booth or scale house
  observed after the gate.
- **scale = false.** No truck scale pad seen.
- **shipRcvSeparate = true.** Cross-dock RDC layout — dock doors run along both
  long building faces (inbound one side, outbound the other).
- **fastLaneOpportunity = true.** The gate apron and surrounding yard are very
  wide, with ample unused paved width to add an express/bypass lane.

## Yard zones and counts
- **Perimeter:** ~72 acres capturing the RDC building and its drop yards.
- **Dock doors:** 50+ band; ~130 doors estimated across both long faces.
- **Drop yard:** 50+ band; the marked-stall yards SW and NE of the building hold
  an estimated 230 trailers visible, with capacity for ~300.
- **Buildings:** 1 (the HD RDC). The neighbouring SW building is a separate
  facility, excluded.
- **Rail:** No spur enters the property — not rail-served.

## Web findings
KATU / SupplierWiki / commercial-listing records confirm: 467,000 sq ft, built
2010, DC #5639 designated a Rapid Deployment Center, ~200 jobs, 24/5 operation,
serving the Pacific Northwest replenishment region from a site adjacent to I-5.

## Final confidence: High
Facility identity and layout are unambiguous. Only the precise inbound/outbound
lane counts at the checkpoint are estimates from overhead gate-island markings.
