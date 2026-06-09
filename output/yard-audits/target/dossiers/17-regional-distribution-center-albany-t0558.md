# Deep-Audit Dossier — Target Regional Distribution Center Albany (T0558)

- **Facility:** Target Regional Distribution Center Albany (T0558), type RDC
- **Address:** 875 Beta Dr SW, Albany, OR 97321/97322
- **Resolved center:** 44.580200, -123.114000
- **Confidence:** HIGH
- **Method:** deep-audit (satellite z16-21 + Street View + web)

## 1. Location confirmation
The supplied geocode (44.579319, -123.115058) landed directly on a massive
white-roofed distribution building. Zoom-16/17 satellite shows a single very
large L-shaped warehouse with extensive multi-row trailer drop yards to the
north, employee parking to the south, and a mainline railroad running along the
east boundary — a textbook large-format Target RDC. Zoom-20 imagery of the dock
face shows **Target-branded trailers** ("TARGET" legible on trailer roofs)
backed into the dock doors and red yard tractors, confirming ownership.
Web search (Albany Chamber of Commerce, Target careers T0558, Waze/Apple Maps)
confirms "Target Distribution Center, 875 Beta Dr SW, Albany OR" operating
24/7. Resolved center nudged slightly NE of the geocode to the true building
centroid. **Correct facility — high confidence.**

## 2. Key views & what they showed
- **z16 context:** Full footprint — L-shaped DC, huge north drop yard, south
  employee parking, east rail line, single SE access drive. Bounded by farm
  field (south) and treeline/pond (west).
- **z18 dock face (center):** Long continuous bank of dock doors with trailers
  backed in along the north face of the main building.
- **z18 drop yard:** Hundreds of trailers in marked rows across a very large
  paved drop yard north of the building — 300+ trailers visible. `dropYard`.
- **z19/20 SE:** Divided multi-lane private entrance drive off the public road;
  a separate long narrow **fleet maintenance/wash building** with semis and a
  service apron; the truck route curves N-S along the rail buffer.
- **z21 yard checkpoint:** STOP pavement markings and a fenced crossing point
  between the public-accessible employee/visitor apron and the secured truck
  yard; perimeter chain-link fence runs throughout the site.
- **z20 dock close-up:** Target trailers at doors + red yard trucks — confirms
  active, owner-operated dock bank.

## 3. Gate / guard-shack / remote determinations (rigorous)
- **truckGate = TRUE.** The truck operations yard is **fully fenced** (chain-link
  perimeter visible on every edge I probed). Trucks enter via a divided
  multi-lane private drive set deep behind a landscaped buffer, then pass a
  **controlled checkpoint** with STOP pavement markings and fence gates between
  the public apron and the secured yard. This is a controlled truck entrance,
  not an open driveway.
- **guardShack = TRUE (flagged uncertain).** Contextual + structural evidence is
  strong: fully fenced secured yard, a controlled fenced checkpoint, deep
  set-back guarded-campus entrance design, and Target's own job listings for
  **on-site "Security Specialist" roles at T0558**. A distinct booth footprint
  could not be pixel-confirmed at the gate (tree/canopy cover; candidate white
  structures resolved to parked trailers), so `guardShack` is listed in
  `uncertainFields`. Target RDCs of this scale are uniformly manned-gate
  operations, supporting the TRUE call.
- **remoteGs = FALSE.** Because the gate is assessed as staffed (guardShack
  true), remote/kiosk check-in is false.

## 4. Yard zones & counts
- **perimeter:** 8-vertex oriented ring tracing the fence line; **~61.5 acres**
  (shoelace). L-shape: building+parking south, wider drop yard north.
- **dropYards:** one large ring over the north trailer drop yard.
- **dockAprons:** one long thin ring hugging the north dock wall.
- **staging:** pre-gate striped queue apron outside the yard checkpoint.
- **truckGate zone:** the fenced checkpoint between apron and yard.
- **dockDoorCount ≈ 90** (50+ band) — long continuous bank, north face.
- **trailersVisible ≈ 320**, **capacity ≈ 360** — very large drop yard (50+).
- **truckGateCount 1**, **buildingCount 2** (DC + fleet maintenance building).
- **railServed = false** — mainline rail runs along the east boundary outside
  the fence; no spur enters the property.
- **drivewayLong / preGateStaging / postGateStaging = true** — deep divided
  approach + striped pre-gate apron + wide internal yard before docks.
- **fastLaneOpportunity = true** — divided multi-lane entrance with ample paved
  width for an express bypass lane.
- **urbanRural = Rural** — edge-of-town Albany, OR; farm fields adjacent.

## 5. Web findings
- Albany Chamber of Commerce, Target careers (T0558), Waze, Apple/Loc8NearMe:
  confirm "Target Distribution Center, 875 Beta Dr SW, Albany OR," 24/7,
  union facility, hiring Warehouse Operations and **Security Specialist** roles.

## 6. Final confidence
**HIGH** on site identity, truckGate, layout, docks, drop yard, and area.
The single inferred element is the guard-booth structure (gate is unambiguous;
booth inferred from fencing + security staffing) — flagged in `uncertainFields`.
