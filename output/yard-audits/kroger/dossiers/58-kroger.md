# Deep-Audit Dossier — idx 58 · Kroger Delta Distribution Center, Memphis TN

**Type:** Distribution Center (grocery)
**Address:** 5079 Bledsoe Rd, Memphis, TN 38141
**Resolved center:** 35.0112, -89.8688
**Confidence:** High
**Method:** deep-audit (satellite + Street View + web)

## Step 0 — Location confirmation
The supplied approximate point (35.012787, -89.86689) landed on the NE edge of a large
white-roofed industrial complex in the Holmes/Bledsoe Rd industrial corridor of
southeast Memphis. Satellite probes (z15–z19) revealed a major L-shaped distribution
building with an enormous trailer drop yard — consistent with a grocery DC, not an
office. Web search corroborated 5079 Bledsoe Rd as the **Kroger Delta Memphis
Distribution Center** (24/7 operation, ~250–499 staff, gated, appointment-only, guard
shack, outside overnight parking/staging, 3–5 hr driver wait times). Locked center at
35.0112, -89.8688.

## Key views
- **z16 overview (trace):** L-shaped Kroger complex — long E–W wing along the south, a
  NW–SE wing, dense drop yard filling the NW quadrant, employee parking on the SE toward
  Bledsoe Rd. Bordered by woods on the W/N, other warehouses + Bledsoe Rd on the E.
- **z18 NW corner:** drop yard packed with hundreds of trailers in parallel angled
  (~10° off N–S) rows; a narrow central canopy/maintenance structure; woods to the W,
  tree line to the N.
- **z19 yard core:** long continuous dock-door bank on the south building's north face
  (30+ doors in one segment) with trailers backed in; tractors maneuvering in the central
  paved holding yard.
- **z19 SE:** employee/visitor car parking (fenced), not truck-side.

## Street View evidence
- **Bledsoe Rd, looking NW (Mar 2025):** Kroger building across a **chain-link-fenced**
  lot; perimeter fencing confirmed.
- **Bledsoe Rd staging frame (Mar 2025, pano JzhcSaHwyodbx2d9ci87MQ):** multiple
  tractor-trailers (J.B. Hunt 360box and others) queued/parked along the road — the
  pre-gate staging area drivers describe ("park first, then check in at the guard shack").
- **Bledsoe Rd, east drop row (Nov 2025):** long row of parked trailers (Premier, Prime)
  forming a second drop yard along the east frontage.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Reviews confirm gated, appointment-only entry; perimeter fence
  visible; controlled truck entry off Bledsoe Rd. Single combined entry/exit.
- **guardShack = true.** Driver reviews explicitly describe checking in at a guard shack
  after staging. Existence high-confidence; exact booth footprint not isolated in
  overhead imagery (likely at the interior yard pinch-point) — noted uncertain.
- **remoteGs = false** (staffed booth present, so not remote/kiosk).
- **preGateStaging = true** (trucks queue on Bledsoe Rd before the gate).
- **postGateStaging = true** (large interior paved yard before the dock face).
- **dockDoors = "50+"** (~110 est. across the south wing + L-wing dock faces).
- **shipRcvSeparate = true** (dock banks on more than one building face) — medium conf.
- **fastLaneOpportunity = true** (very wide gate apron / abundant paved width).

## Yard zones & counts
- **perimeter:** ~46.3 acres fenced operational parcel (6-vertex oriented ring following
  the woods/grass/Bledsoe edges; building rotated a few degrees off north).
- **dropYards:** (1) large NW yard, (2) east-frontage row along Bledsoe.
- **dockAprons:** long thin quad hugging the south building's north dock wall at building
  angle.
- **staging:** pre-gate truck queue strip on Bledsoe Rd.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~280, trailerParkingCapacity ~350,
  truckGateCount 1, buildingCount 2 (Kroger complex + a separate adjacent south building),
  siteAreaAcres 46.3, railServed false (no rail spur into the property).

## Web findings
Kroger Delta Memphis DC, 5079 Bledsoe Rd — 24/7, ~250–499 staff, gated with entrance
security, strict appointment requirement, outside overnight parking (~21 spaces),
guard-shack check-in after staging, long (3–5 hr) driver wait times. (Sources: Warehouse
Rating, Loc8NearMe, BusinessYab, Foursquare, TruckMap.)

## Final confidence
**High.** Facility unambiguously identified and corroborated by multiple sources; gate,
guard shack, staging, perimeter fence, large drop yard, and a 50+ dock bank all
evidenced. Uncertain: exact guard-shack location, presence of a truck scale, ship/receive
separation, and any second checkpoint (multiStep left false).
