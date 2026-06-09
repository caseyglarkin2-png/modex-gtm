# Deep-Audit Dossier — Sam's Club Distribution Center, New Braunfels TX

- **Facility:** Sam's Club Distribution Center New Braunfels TX (Walmart/Sam's Club regional DC)
- **Type:** Distribution Center
- **Address:** 4002 N IH 35, New Braunfels, TX 78130
- **Confirmed center:** 29.73430, -98.06410
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation

The supplied coordinates (29.734335, -98.064532) landed directly on the
building. Satellite at z16/z15 showed a single very large industrial
distribution building on the SE side of I-35, with cross-dock loading on both
long faces and extensive trailer drop yards — unmistakably a big-box regional
DC, not an office. Web search corroborated the address (4002 I-35 N) and the
operation: TruckMap/TruckerPath list it as "Walmart/Sam's Club Distribution
Center," appointment-required deliveries, ~40-minute load times. Street View at
the N entrance shows a "WAL-MART Distribution Services" sign on the building
wall, confirming this is the Walmart-operated Sam's Club DC. Locked center at
29.73430, -98.06410.

## Site layout

The main building is a large cross-dock running on a NW–SE long axis (rotated
~30–35° off north — every geofence below is traced to that orientation, not
to a north box). Key zones:

- **Main DC building** — cross-dock with dock doors and backed-in trailers
  along both long faces (SW and NE).
- **Employee/auto parking** — a large dark paved lot on the NE side fed from
  the I-35 frontage road (cars, not trucks).
- **Truck gate** — at the N corner where the truck drive meets the I-35
  frontage road.
- **SW drop yard** — a very large trailer-storage lot SW of the building,
  dozens of long rows of parked drop trailers.
- **SE secondary building + yard** — a separate smaller building
  (maintenance/transportation) to the SE with its own small docks and more
  trailer rows; same fenced property = campus.

## Gate / guard-shack determination (rigorous)

**truckGate = TRUE.** The truck entrance is at the N corner off the I-35
frontage road. Satellite (z18/z20) shows a dedicated truck drive entering from
the frontage to a checkpoint apron. Street View from the only nearby road pano
(`6YhsOK6P85aaVVAVb_aohg`, captured 2018-12) at heading ~230° looks straight
down the checkpoint: striped truck lanes, painted "STOP" on the pavement,
channelizing yellow bollards, and gate infrastructure across the lanes against
the WAL-MART Distribution Services wall. This is a controlled, guarded truck
entry — not an open driveway.

**guardShack = TRUE.** A small single-vehicle-footprint metal guard booth with
side windows and a covered canopy walkway sits beside the inbound lane at the
gate. Clearly visible in Street View headings 290° and 230° (the booth dominates
the right of the 230° frame) and as a small white-roofed structure beside the
entrance drive in satellite z18 at the N corner.

**remoteGs = FALSE** — there is a staffed booth, so this is not a kiosk/call-box
remote check-in.

**Gate flow:** entry and exit share the same checkpoint apron (entryExitTogether
= true). ~2 inbound / ~2 outbound lanes (sun glare in the 2018 pano makes the
exact split an estimate — flagged uncertain). The apron is wide with unused
paved width, so **fastLaneOpportunity = true** (room to add an express/
appointment bypass). A deep paved staging area sits inside the gate before the
docks (postGateStaging = true; drivewayLong = true).

## Docks, drop yard, counts (from z17–z20 imagery)

- **dockDoors = "50+"** — continuous dock-door rhythm with trailers backed in
  along both long faces of the cross-dock plus the secondary building. Estimated
  ~180 doors total.
- **dropArea = "50+" / dropYard = true** — the SW and SE yards are wall-to-wall
  parked drop trailers in dozens of rows; hundreds of stalls.
- **shipRcvSeparate = true** — docks operate from two distinct building faces
  (SW and NE), consistent with separate shipping/receiving clusters (inferred
  from overhead).
- **scale = false** — no clear truck scale/weigh pad found in the truck path
  (flagged uncertain).
- **railServed = false** — no rail spur enters the property.

## yardMetrics

| metric | value |
|---|---|
| dockDoorCount | ~180 |
| trailersVisible | ~600 |
| trailerParkingCapacity | ~750 |
| truckGateCount | 1 |
| buildingCount | 2 |
| siteAreaAcres | 86.3 (from perimeter polygon, shoelace) |
| railServed | false |

## Geofences

- **perimeter** — 7-vertex oriented ring tracing the fenced operational
  property (main building + employee lot + SW drop yard + SE secondary
  building/yard), ~86 acres.
- **truckGate** — quad over the N-corner checkpoint/booth, aligned to the
  entrance drive.
- **dropYards** — two rings: the large SW trailer-storage lot and the SE yard.
- **dockAprons** — two long thin quads hugging the SW and NE dock faces at the
  building angle.
- **staging** — post-gate apron between the booth and the building.

### Street View metadata

- **truckGate** — pano `6YhsOK6P85aaVVAVb_aohg` (2018-12), heading 128°
  (camera from the frontage pano toward the gate/booth). This is the
  driver's-eye arrival frame: the guarded checkpoint and booth.
- **perimeter** — pano `CAoSFENJSE0wb2dLRUlDQWdJRFI4NDli` (Momentum 360,
  2023-05), heading 328° toward building center.

## Setting

- **urbanRural = Rural.** Edge-of-town industrial site on the I-35 corridor NE
  of New Braunfels with open farmland to the E and S. Per the rubric tie-break
  ("small-town industrial" -> Rural).
- **connectivityIssue = false.** On a major interstate corridor with adjacent
  development; cellular coverage is not a concern.
- **multipleFacilities = true** — main DC plus separate SE building on the same
  property (campus).

## Web findings

- TruckMap / TruckerPath list "Walmart/Sam's Club Distribution Center," 4002
  I-35 N, New Braunfels TX 78130; appointments required; driver reviews report
  ~40-minute loads, longer (1hr+) if arriving ~6am.
- Building signage in Street View reads "WAL-MART Distribution Services,"
  confirming Walmart operates this Sam's Club DC.

## Final confidence: HIGH

Building identity, gate, guard shack, docks, and drop yard are all directly
evidenced in satellite + Street View. Uncertain (estimated) fields: exact
entry/exit lane counts (sun glare in 2018 pano), presence of a truck scale,
and the ship/receive separation inference.
