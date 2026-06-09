# Deep-Audit Dossier — Sam's Club Distribution Center, Shakopee MN (idx 09)

- **Facility:** Sam's Club Distribution Center Shakopee MN
- **Type:** Distribution Center
- **Address:** 7400 Hentges Way, Shakopee, MN 55379
- **Resolved center:** 44.79255, -93.42620
- **Maps (satellite):** https://www.google.com/maps/@44.79255,-93.42620,400m/data=!3m1!1e3
- **Method:** deep-audit (current high-res satellite + Street View metadata)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied coordinates (44.79338, -93.423903) landed on the NE corner of the
correct property. Web research confirms a Sam's Club multipurpose DC, ~365,000
sq ft, in Shakopee's new **Southwest Logistics Center** near Hwy 169/101, that
opened in **March 2024**. Satellite at zoom 16-18 shows a single large
rectangular distribution building with truck aprons and dock doors on its north
and south faces, employee/visitor parking and an office on the east, a roundabout
on Hentges Way to the east, and a multi-track rail yard along the south boundary.
This matches a Sam's Club DC, not an office or unrelated property. The building
long axis runs WSW-ENE, rotated roughly 8° counter-clockwise from east-west, so
every geofence zone is traced as a rotated quad rather than a north-aligned box.
Locked center: 44.79255, -93.42620.

## Key views
- **Wide (z16-17):** Full single building, north and south dock aprons full of
  trailers, east-side car parking + office, roundabout, and an adjacent rail
  yard to the south separated by a vegetated buffer.
- **North dock band (z18-19):** A long bank of dock doors with ~25-30 trailers
  backed in, plus a separate staging/drop row of trailers parked nose-out to the
  north. Doors continue past both frame edges.
- **South dock face (z19):** A second dock bank with ~25 trailers backed in along
  the south wall; a vegetated buffer then the multi-track rail yard below it.
- **NE entrance / gate (z20-21):** The perimeter truck drive comes off Hentges
  Way and pinches to a single controlled truck lane at the building's NE corner.
- **Street View:** The only road pano is on Hentges Way at the roundabout
  (pano `_yxeEf5Q8DXVansnuK76jw`, 44.792818, -93.421519, captured **2022-04**).
  That capture predates the building — it shows the roundabout newly built but the
  DC parcel still empty farmland. Street View is therefore stale and could not be
  used to confirm the gate; the gate/guard/dock calls rest on current satellite.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** At z20-21 the NE entry throat shows chevron/crosshatch
  gore markings at a single controlled truck lane, with two tractor-trailers
  (one red tractor) queued in the lane in the current imagery. The truck yard is
  curbed/separated from the adjacent car parking, so the truck lane is the
  controlled pinch-point where the property meets the public road.
- **Guard shack — TRUE.** A small standalone white booth (~1-2 parking-stall
  footprint) sits beside the truck entry lane at the NE pinch point, distinct from
  the main office building, in the position of a gatehouse next to the gore
  markings. `remoteGs` is therefore false.
- **Dock doors — 50+.** Banks on two faces: the north face shows 25-30 doors with
  trailers and continues off-frame; the south face carries a second substantial
  bank. A 365,000 sq ft DC with two loaded dock faces is firmly in the 50+ band
  (overhead estimate ~110 doors total).
- **Ship/Receive separate — TRUE.** The two dock clusters are on physically
  opposite (north vs south) building faces.

## Yard zones & counts
- **Perimeter:** 8-vertex oriented ring tracing the fenced paved property
  (north + south aprons, east entry drive to the roundabout, west edge),
  ~33-34 acres.
- **Truck gate:** rotated quad at the NE single controlled lane.
- **Drop yard:** one ring along the north staging row of nose-out trailers.
- **Dock aprons:** two rings — one hugging the north dock wall, one the south
  dock wall, each at the building's ~8° angle.
- **Staging:** post-gate paved truck court between the gate and the docks.
- **yardMetrics:** dockDoorCount ~110, trailersVisible ~95, trailerParkingCapacity
  ~120, truckGateCount 1, buildingCount 1, siteAreaAcres ~33.5, railServed false.

## Other classification notes
- **Driveway long / post-gate staging — TRUE:** deep internal truck court holds
  3+ trucks between gate and docks.
- **Fast-lane opportunity — TRUE:** wide gate apron and generous paved court give
  room for an express/bypass lane.
- **Entry/exit together — TRUE:** single NE gate lane group serves both; entry 1
  lane, exit inferred 1.
- **Drop yard — TRUE:** dedicated nose-out trailer staging row on the north apron.
- **Rail served — FALSE:** the south-boundary rail yard is separated by a
  vegetated buffer; no spur enters the docks. (Adjacency noted.)
- **Urban/Rural — RURAL:** edge-of-town logistics park amid farmland, ponds, a
  rail yard and aggregate lots; not dense metro fabric.
- **Scale — uncertain/false:** no weigh pad positively identified in the truck path.

## Web findings
- Bring Me The News / Twin Cities Business / Walmart corporate / Construction Dive:
  Sam's Club announced (Nov 2023) two new DCs incl. the Minneapolis-area site in
  Shakopee; ~365,000 sq ft multipurpose DC, 80+ jobs, in the Southwest Logistics
  Center near Hwy 169/101, expected to open March 2024. Consistent with the
  completed building seen in current satellite imagery.

## Final confidence
**High.** Building positively identified and corroborated by multiple sources;
current high-res satellite clearly shows the controlled truck gate, the adjacent
guard booth, two dock faces, and the staging/drop yard. The only limitation is
stale (pre-construction) Street View, which did not affect the satellite-based
determinations. Lower-confidence items flagged: `scale`, `exitLanes`,
`connectivityIssue`.
