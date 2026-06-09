# Deep-Audit Dossier — Target Regional Distribution Center Chambersburg (T0589)

- **Facility:** Target Regional Distribution Center Chambersburg (T0589), RDC
- **Address:** 3001 Archer Dr, Chambersburg, PA 17202 (roster listed 17201; assessor/listings say 17202)
- **Resolved center:** 39.8878, -77.6735
- **Confidence:** HIGH
- **Maps:** https://www.google.com/maps/@39.8878,-77.6735,400m/data=!3m1!1e3

## 1. Location confirmation (the geocode landed on a neighbor)
The supplied geocode (39.891039, -77.671691) landed on an **employee parking lot
between two large buildings**. Wider satellite (z15) showed two candidate
facilities:
- A **blue-roofed building** to the north — smaller; this is a SEPARATE neighbor.
- A **massive light/white-roofed building** to the south/southwest — by far the
  largest footprint on the parcel.

Web research corroborates the Target RDC as a **~1.3M sq ft warehouse on a
~99–130-acre site** anchoring **Rita Tech Park** in Guilford Township along
**I-81** (Walsh Group / Langan project pages; CVB Alliance member listing for
"Target Distribution Center T0589"). The very large white-roofed building matches
this description (enormous plain roof, single huge building, extensive trailer
drop yards). The blue-roofed neighbor is much too small to be a 1.3M sq ft RDC.

I therefore audited the **large white-roofed building** (center ≈ 39.8878,
-77.6735), not the building nearest the raw geocode. The building's long axis runs
NNW–SSE, **parallel to I-81** which forms the east boundary; a rail line + Archer
Dr corridor form the west boundary.

## 2. Key views
- **wide/context z15–z16:** Single dominant RDC building, drop yards on the west,
  I-81 diagonally to the east, employee parking at the north end, gate at the south.
- **center z17:** West building face = continuous loading docks with dozens of
  trailers backed in; immediately west, large trailer drop yards in marked rows
  (hundreds of trailers). The east two-thirds of the roof is plain warehouse.
- **east z17:** East face (toward I-81) has **no docks** — just building wall and a
  grass setback to the highway. Docks are single-sided (west).
- **gate area z19 + Street View:** South/SW entrance has a **guard booth/gatehouse
  canopy spanning the inbound lane**, with a tractor-trailer queued at it, yellow
  lane markings, light poles, and perimeter chain-link fence. An office/amenity
  building sits just north of the booth.

## 3. Gate / guard-shack / remote determinations (rigor focus)
- **truckGate = TRUE.** Controlled truck entrance at the south property line
  (~39.8843, -77.6777). Evidence: Street View pano `mlac-CAWOgXfcDblQC8HTQ`
  (2012-09) shows a gatehouse canopy across the lane with a truck stopped at it;
  z19 satellite shows the same booth structure straddling the road plus a
  perimeter fence with the access road as the only break.
- **guardShack = TRUE.** A small staffed booth with a flat canopy roof spans the
  entry lane (multi-window booth footprint beside the lane). It is clearly
  distinct from the larger office/amenity building to its north.
- **remoteGs = FALSE.** A manned booth is physically present, so this is a staffed
  gate, not a kiosk/call-box check-in.
- Entry/exit run together at this single south gate (`entryExitTogether`), with a
  wide apron and multiple lanes (≈2 in / 1 out) — room for a fast/bypass lane
  (`fastLaneOpportunity`). Truck queue depth is long (gate→dock approach holds 3+
  trucks; `drivewayLong`).

## 4. Yard zones & counts (overhead estimates)
- **dockDoors: 50+** (~120 estimated) — continuous west-face dock bank, ~1.3M sq ft RDC.
- **dropArea / dropYard: 50+ / TRUE** — large dedicated west & north trailer
  storage lots, hundreds of trailers in marked rows.
- **trailersVisible ≈ 350; trailerParkingCapacity ≈ 500** (honest estimates).
- **buildingCount: 1** main RDC (+ a small gate/office structure, not counted as a
  separate facility cluster). `multipleFacilities: false`.
- **scale: false** — no weigh platform seen in the truck path.
- **railServed: false** — a rail line parallels the west edge but no spur enters
  the property.
- **siteAreaAcres ≈ 120** from the traced perimeter polygon (within the
  99–130-acre figures reported for the parcel).

### Geofences
- **perimeter:** 5-vertex oriented ring tracing the fenced parcel (NNW–SSE long
  axis, parallel to I-81). ~120 acres.
- **truckGate:** rotated quad over the south gate booth + entry lanes.
- **dropYards:** one ring over the west-side trailer storage field.
- **dockAprons:** thin quad hugging the west building wall where trailers back in.
- **staging:** null (queueing happens on the entry drive / yard).
- **streetViewMeta:** truckGate pano `mlac-CAWOgXfcDblQC8HTQ` (heading ~290°,
  driver's arrival view of the gate); perimeter pano `ohwicw_ypxHrrsj1qjVuUg`
  (2025-05, I-81 side, heading ~291°).

## 5. Web findings
- ~1.3M sq ft RDC, ~99–130-acre site, anchors Rita Tech Park along I-81 (Walsh
  Group, Langan, CVB Alliance listings).
- 24/7 operation (Yellowpages/BBB); Target security & operations roles posted for
  this RDC (corporate.target.com) — consistent with a staffed guarded gate.
- Phone 717-375-1600.

## 6. Setting
Edge-of-town industrial park outside Chambersburg, surrounded by farmland → **Rural**
per rubric. Not isolated (interstate-adjacent, town nearby) → `connectivityIssue:
false`.

## 7. Final confidence: HIGH
Building positively identified against size/parcel facts; gate, guard booth, docks,
and drop yards all confirmed in satellite + Street View. Lower-precision items
(exact dock count, exit-lane count, ship/rcv separation) flagged in
`uncertainFields`.
