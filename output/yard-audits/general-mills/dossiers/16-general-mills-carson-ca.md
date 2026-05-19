# Deep-Audit Dossier — General Mills, Carson CA (idx 16)

## Resolved location
- **Address:** 1375 Beachey Place, Carson, CA 90746
- **Locked center:** 33.86340, -118.24560
- **Confidence in location:** High

The roster geocode (33.862789, -118.245132, ROOFTOP, moved 1291 m) landed on
the south-east corner of the correct building. OpenStreetMap places Beachey
Place at 33.86216, -118.24539, which matches the road that fronts the building
in Street View — confirming Beachey Place is the street the facility's gated
entrance opens onto. Multiple business directories (TruckMap, CMac, Yellow
Pages, Manta) confirm General Mills operates at 1375 Beachey Place. The
building is a large modern industrial warehouse / production facility
consistent with a General Mills manufacturing plant. Note: a stale
warehouse-lease listing claimed only 2 dock doors; satellite imagery clearly
contradicts this (40+ doors with trailers backed in), so the listing is
disregarded.

## Key views
- **Satellite z16-z18 (overview):** Large rectangular white-roof warehouse
  oriented N-S in the dense Watson industrial park, bounded by public streets
  on all four sides. Trailer-heavy dock aprons on both the east and west
  faces.
- **Satellite z19 (east face):** ~20-24 dock doors with roughly 22 trailers
  backed in along the east apron / drop lane.
- **Satellite z19 (west face):** ~15-18 dock doors with ~14 trailers backed
  in along the west apron.
- **Satellite z20 (south entrance):** Wide paved truck driveway off Beachey
  Place, perimeter fencing, office portion, internal parking. No standalone
  guard-booth structure.
- **Street View 2025-03 (entrance):** Two black sliding gates flanking the
  driveway, continuous black wrought-iron perimeter fence, monument sign at
  curb, and a blue check-in / kiosk post just inside the gate. No guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled entrance: two sliding gates across the
  truck driveway plus a fully fenced perimeter (Street View, satellite z20).
- **guardShack = false.** No 1-3-vehicle-footprint booth beside the gate in
  any view.
- **remoteGs = true.** Gate present but unstaffed; a kiosk/call-box post is
  visible inside the gate, implying remote / app check-in.
- **dockDoors = 25-50.** ~40 total (≈24 east + ≈16 west). Counted as a band.
- **shipRcvSeparate = true.** Dock banks sit on two distinct building faces
  (east and west) operating as separate clusters.
- **dropYard = true.** Long trailer drop lanes run the full length of both
  the east and west faces.

## Yard zones and counts
- **Perimeter:** ~14.8 acres, ~301 m N-S x ~199 m E-W, bounded by Beachey
  Place (south) and industrial streets on the other three sides.
- **Truck gate:** single gated driveway on the south face.
- **Drop yards:** two — east apron/drop lane and west apron/drop lane.
- **Dock aprons:** east face and west face.
- **Staging:** no distinct pre-gate staging; post-gate yard depth is ample.
- **Metrics:** dockDoorCount ~40, trailersVisible ~36, trailerParkingCapacity
  ~55, truckGateCount 1, buildingCount 1, railServed false.

## Web findings
General Mills is listed at 1375 Beachey Place across multiple directories;
shipping/receiving is by appointment. Facility is in the Watson industrial
park in Carson, with quick access to I-405 and I-110.

## Final confidence
**High.** Building positively identified; gate/dock/yard determinations are
well-supported by both 2025 Street View and recent satellite imagery. Dock
counts and lane counts are honest overhead estimates (flagged uncertain).
