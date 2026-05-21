# Deep-Audit Dossier — Honda Precision Parts of Georgia (Transmission Plant), Tallapoosa GA

**Roster idx:** 9
**Type:** Transmission Plant
**Address:** 550 Honda Parkway, Tallapoosa, GA 30176
**Resolved center:** 33.69100, -85.28450 (centroid of the main plant building)
**Confidence:** medium

## Location confirmation
The roster pin (33.691229, -85.283853) landed directly on the plant. Satellite
probes z16-z21 confirmed the building: a large light-roofed manufacturing plant
set deep in forested terrain near Tallapoosa, Haralson County, GA. Extensive
dock lines with trailers backed in along the south/southwest faces, employee
parking on the east, and a controlled truck checkpoint on the east access road
positively identify it as Honda Precision Parts of Georgia (HPP-GA), Honda's
Georgia transmission/CVT plant. Building center adjusted slightly to 33.6910,
-85.2845.

## Key views
- **z16 / z17 overview** — single large plant building surrounded by dense
  woodland; long dock lines with trailers along the south and southwest faces;
  paved employee parking lots to the east.
- **z18 south dock** — many trailers backed into docks plus trailers parked in
  organized rows (drop yard).
- **z18 east access** — the truck route runs around the building's east side; a
  checkpoint structure with trailers staged just past it.
- **z20 truck gate** — a small guard-booth-sized structure positioned beside/in
  the truck lanes with a parked vehicle next to it and painted lane markings
  splitting the truck path into multiple lanes.
- **Street View** — pano coverage is limited to a residential road east of the
  plant; SV does not reach the truck gate.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A controlled truck checkpoint sits on the east access
  road, with painted lane markings dividing the truck path into multiple lanes
  through the checkpoint — a clear controlled truck gate.
- **guardShack = true.** A small booth-sized structure stands beside/in the
  truck lanes at the checkpoint with a parked vehicle next to it — a staffed
  guard shack, high confidence from z20 imagery.
- **remoteGs = false** — physical guard booth present.
- **dockDoors = 50+** — extensive dock lines with trailers backed in on the
  south and southwest building faces; ~50 doors estimated.
- **dropArea = 25-50 / dropYard = true** — multiple organized trailer-parking
  rows, ~110 trailers visible.
- **shipRcvSeparate = true (flagged uncertain)** — dock banks appear on two
  distinct building faces (south and southwest).
- **postGateStaging = true / drivewayLong = true** — trailers staged on the
  apron just inside the checkpoint; broad internal aprons give deep queuing.
- **fastLaneOpportunity = true** — truck lanes are already split into 2+ marked
  lanes with paved width for an express bypass.
- **connectivityIssue = true (flagged uncertain)** — the plant is rural and
  ringed by dense forest, away from town fabric; cellular coverage may be weak.
- **railServed = false** — no rail spur into the property.
- **multipleFacilities = false** — single plant building plus minor support
  structures.
- **scale = false / multiStep = false** — none identified.

## Yard zones and counts
- **Perimeter:** plant property ≈ 130 acres (much surrounding land is forest
  buffer).
- **Truck gate:** checkpoint on the east access road.
- **Drop yards:** two trailer-storage areas — south apron and near the
  checkpoint.
- **Dock aprons:** south and southwest building faces.
- **Staging:** apron just inside the truck checkpoint.
- **Metrics:** ~50 dock doors, ~110 trailers visible, ~180 trailer capacity,
  1 truck gate, 3 buildings, rail-served = false. Counts are honest overhead
  estimates.

## Web findings
Honda Precision Parts of Georgia — Honda's Georgia transmission plant in
Tallapoosa, supplying transmissions/CVTs to Honda's North American assembly
plants. Confirmed via americanautoworker.com facility record and Yelp/Waze
listings.

## Final confidence
**Medium.** Building, perimeter, controlled truck gate, guard booth, dock lines
and drop yards are all confirmed from satellite imagery (the guard booth is
clearly visible at z20). Dock-door and trailer counts are overhead estimates;
Street View does not reach the truck gate, so lane counts and ship/receive
separation are inferred.
