# Deep-Audit Dossier — Target Import Distribution Center Rialto (T3806)

- **Facility:** Target Import Distribution Center Rialto (T3806)
- **Type:** Import Warehouse / Regional Distribution Center
- **Address:** 3105 N Mango Ave, Rialto, CA 92377
- **Resolved center:** 34.15315, -117.42600 (campus center, between the two warehouses)
- **Method:** deep-audit (satellite zoom 15-21 + Street View + web research)
- **Confidence:** HIGH

## Location confirmation
Geocoded point (34.153258, -117.430557) landed on the **west** warehouse of a
two-building Target campus — correct facility, just one building over from
center. Web research confirms this is Target's Rialto import warehouse + regional
distribution center: a **3.1M-sq-ft campus on ~240 acres** (opened with then-Gov.
Schwarzenegger; "Welcomes New 3.1 Million-Square-Foot Campus to the Inland
Empire"). Job postings reference store code **T3806** at this Rialto site. The
overhead footprint (two ~1.5M-sqft buildings flanking a central trailer yard)
matches a 3M+ sqft import DC. Resolved center moved slightly east to the true
campus midpoint.

## Key views
- **Wide z15/z16:** Two enormous white-roofed warehouses (west + east) with a
  vast central trailer drop yard and rooftop solar; fenced rectangle bounded by
  residential to the north, a public road to the south, and arterials E/W.
- **Central spine z18 (roundabout):** Divided-boulevard truck circulation between
  the buildings; hundreds of trailers in herringbone rows left and right; gate
  complex at the south end of the spine.
- **Gate complex z19/z20/z21 (~34.1531,-117.4244):** A gatehouse building with a
  **canopy extending over the inbound truck lanes**, painted channelization
  islands, "STOP" markings, and a **queue of tractor-trailers** funneling through
  a single checkpoint. Adjacent tractor parking yard (red cabs) and admin parking.
- **Dock faces z19:** Regular rhythm of dock doors with trailers backed in along
  the west building's east wall and the east building's west wall (both facing
  the central yard), plus perimeter dock faces.
- **South entrance Street View (2007 pano, the only public coverage):** Long
  approach road heading north off the south public road into the campus —
  confirms a deep driveway approach. No interior Street View (secured private site).

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Mid-campus checkpoint where all truck traffic is pinched
  into channelized lanes (painted islands, directional arrows, queued trucks).
  Not an open driveway.
- **guardShack = TRUE.** A dedicated gatehouse building with a canopy over the
  truck lanes and windows on multiple sides sits beside the lanes (z20/z21) —
  a staffed guard booth distinct from the warehouses.
- **remoteGs = FALSE.** A physical guard booth is present, so this is not a
  remote/kiosk check-in.
- **dockDoors = "50+".** Hundreds of dock doors across four building faces
  (two interior dock banks facing the central yard + perimeter faces). Estimate
  ~320 doors.
- **dropArea / dropYard = "50+" / TRUE.** The central yard between the buildings
  is a dedicated trailer-storage lot holding many hundreds of parked trailers.

## Yard zones & counts (overhead estimates)
- Perimeter: ~160 ac fenced operational rectangle (full parcel ~240 ac with
  southern graded land).
- Drop yards: central spine (primary, between buildings) + east-side yard.
- Dock aprons: long thin strips along the two interior dock walls.
- Truck gate: checkpoint quad at the south end of the central spine.
- dockDoorCount ≈ 320; trailersVisible ≈ 600; trailerParkingCapacity ≈ 800;
  truckGateCount = 1; buildingCount = 2; railServed = false.

## Other classification calls
- **multipleFacilities = TRUE** (two large warehouses, one campus).
- **shipRcvSeparate = TRUE** (distinct interior dock banks on the two buildings).
- **drivewayLong = TRUE / fastLaneOpportunity = TRUE** (long approach, wide
  multi-lane gate apron with room for an express lane).
- **pre/postGateStaging = TRUE** (apron/queue room outside and inside the gate).
- **entryExitTogether = TRUE**, entryLanes/exitLanes ≈ 2/2 (estimated; uncertain).
- **urbanRural = "Urban"** (dense Inland Empire industrial/residential fabric).
- **scale = uncertain** (no weigh platform positively identified).

## Web findings
- MarketScreener / Target Corp: 3.1M-sq-ft Rialto campus, Inland Empire.
- Target jobs site: warehouse operations openings tagged **T3806**, Rialto.
- Multiple directories confirm 3105 N Mango Ave, Rialto CA 92377 as the Target
  Distribution Center / Import Warehouse.

## Final confidence: HIGH
Facility unambiguously identified; gate, guard booth, dock band, and drop yard
all visible at high zoom. Lower-confidence items (exact lane counts, presence of
a scale, exact trailer capacity) flagged in `uncertainFields`.
