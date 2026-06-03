# Yard Audit Dossier — Costco Mira Loma Depot

**Facility:** Costco Mira Loma Depot (Costco SoCal regional cross-dock)
**Type:** Refrigerated + Dry Depot (cold building + ~670k sq ft dry building, ~1M sq ft total)
**Address:** 11600 Riverside Dr, Mira Loma, CA 91752 (Jurupa Valley)
**Resolved center:** 34.014300, -117.536600
**Method:** deep-audit (satellite z15-z20 + Street View + web)
**Confidence:** high

## Location confirmation
Roster coords (34.016243, -117.535734) landed on the north edge of the correct
complex. Confirmed it is the Costco depot by:
- The street number **"11600"** painted on the north building wall, read directly
  in Street View along the I-15 frontage road (sv-f1).
- Address match to 11600 Riverside Dr across multiple business listings and
  TruckMap.
- Built form: a ~1M sq ft solar-roofed cross-dock with a separate north building,
  ringed by multi-hundred-trailer drop yards — exactly the depot archetype.

The depot is the central solar-roofed building cluster plus the north (gray-roof)
building. It is bounded by **I-15 and its frontage road** to the north,
**Riverside Dr** to the west, a service road to the south, and a **separate
white-roofed DC** to the east (its own docks, yards and parking — excluded from
the geofence; the dividing line is the internal road near lng -117.5335).

## Key views
- **z15/z16 overview** — single large interconnected campus; trailer rows fill
  the yards on every building face.
- **North dock (z18, 34.016/-117.5375)** — north building's south face is a dock
  line (red door band) with trailers backed in; a deep drop yard of organized
  trailer rows sits directly below it.
- **South face (z18, 34.0123/-117.5382)** — the main building's south dock band
  feeds into massive multi-row trailer staging; hundreds of trailers visible.
- **South-central / east (z18)** — the long solar "finger" building has dock
  doors with trailers backed in on **both east and west faces**, ringed by drop
  yards — clear shipping/receiving separation across building faces.
- **East boundary (z18, 34.014/-117.5332)** — confirms the white-roofed DC to the
  east is a distinct property.

## Gate / guard-shack / dock determinations
- **Truck gate: YES.** The site is fully secured — every public frontage I walked
  in Street View (Riverside Dr west, the south service road, the I-15 frontage
  road) is a continuous manicured hedge + chain-link line with no open driveway.
  Trucks enter through one controlled apron opening off the **north I-15 frontage
  road**, wrapping around the east end of the north building into the yard.
- **Guard shack: YES.** Driver reviews describe the live procedure: "get in the
  **left lane at the guard shack**," check in (with appointment paperwork),
  and receive paperwork back **with a pager**; some check-ins use a small
  **kiosk**. That is a staffed booth with multiple inbound lanes — guardShack
  true, remoteGs false. The gate booth sits at the pinch point of the entrance
  apron (tree cover obscures the booth itself from directly overhead, but the
  lane geometry and the driver evidence are conclusive).
- **Pre-gate staging: YES** — bobtails/trailers stage along the frontage road and
  the south road outside the gate (seen parked at the curb in Street View and
  satellite).
- **Post-gate staging: YES** — a wide paved holding apron inside the gate between
  the north building and the main building before trucks reach doors.
- **Dock doors: 50+ (est. ~150).** Counted across the north building (both faces)
  and the main solar building's east, west and south finger faces. Solar roofing
  obscures exact door counts but the 50+ band is firm.
- **Drop area: 50+ (est. ~600 trailers visible, ~750 capacity).** Angled-parked
  trailer rows blanket the yards on every face — a dedicated drop-yard operation.
- **Ship/Rcv separate: YES** — distinct dock banks on physically different
  building faces.
- **Fast-lane opportunity: YES** — the entrance apron off the frontage road is
  very wide, with paved room to add an appointment/express bypass lane.

## Yard zones & counts (yardMetrics)
- dockDoorCount ~150 (band 50+) · trailersVisible ~600 · trailerParkingCapacity
  ~750 · truckGateCount 1 · buildingCount 2 · siteAreaAcres ~93.4 (from the
  traced perimeter) · railServed false (no spur enters the property).
- Geofences traced as oriented rings: full perimeter; the north-frontage truck
  gate apron; four drop yards (west, central, east-edge, and the north-building
  drop yard); three dock aprons (north-building south face, and the two long
  finger faces of the main building); a post-gate staging quad.

## Web findings
- ~1M sq ft dry + cold regional depot; one of Costco's primary SoCal hubs;
  appointment-driven inbound. Driver reports: arrive 15 min early, check in at the
  guard shack / kiosk, average ~4.5 hr to unload (1.5 hr if early). 24-hr
  operation early week. Phone (951) 361-3606.

## Final confidence
**High.** Building identity, dock pattern, drop-yard scale, urban setting, and
ship/rcv separation are all directly read from imagery. The gate + guard shack +
multi-lane check-in are corroborated by first-hand driver descriptions; exact
inbound/outbound lane counts and the precise door count are flagged as estimates
(tree/solar occlusion), but the bands and the gate/guard-shack verdicts are firm.

## Street View
Best driver-arrival frame: I-15 frontage-road pano `pFfIHk_Fz9Tzg2Hvn_lBcg`
(34.01752, -117.53514, captured 2023-12), camera heading ~171° looking south into
the gate apron. Same pano reused for the perimeter view (heading ~201°).
