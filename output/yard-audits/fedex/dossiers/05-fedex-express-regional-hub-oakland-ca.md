# Deep-Audit Dossier — FedEx Express Regional Hub, Oakland CA (idx 05)

## Facility
- **Name:** FedEx Express Regional Hub - Oakland CA
- **Type:** Express regional hub (Oakland International Airport)
- **Roster address:** 8455 Pardee Dr, Oakland, CA 94621 (a FedEx Ship Center,
  NOT the hub — see below)
- **Resolved location:** FedEx Express Oakland Regional Hub, 1 Sally Ride Way,
  Oakland, CA 94621 — airside at Oakland International Airport
- **Locked center:** 37.720113, -122.219569

## Step 0 — Location confirmation
The roster address (8455 Pardee Dr) was geocoded ROOFTOP but points to a
**FedEx Ship Center** — a customer-facing retail / pickup location roughly
2 miles from the airport in the Pardee Dr industrial area. That is not the
regional hub.

Web research established that the FedEx Express Oakland Regional Hub (the West
Coast hub) is at **1 Sally Ride Way, Oakland CA 94621**, on the airside at
Oakland International Airport — a ~233,000 sq ft air / ground / trucking sort
center that can sort ~12,000 packages/day for the greater Bay Area.

Satellite imagery (zoom 16-20) at 37.72011,-122.21957 confirmed the hub:
multiple FedEx sort buildings, an aircraft maintenance hangar, FedEx-livery
wide-body freighter aircraft (purple/red tails) parked at airside positions,
ULD container and dolly staging, and large rooftop solar arrays. Street View
on the perimeter road showed a barbed-wire chain-link fence and a
"No Trespassing / Restricted Area / Authorized Personnel Only" sign — a
secured airport perimeter. Center locked at 37.72011, -122.21957.

## Key views
- **Z16-17 wide:** FedEx hub complex airside at OAK — sort buildings,
  maintenance hangar, cargo aircraft, ramp; bounded by wetland on the
  north/west.
- **Z18 building cluster:** sort buildings with rooftop solar, ULD/dolly
  staging, trailers and GSE.
- **Z20 dock face (37.7202,-122.2182):** trailers backed into dock doors,
  a tractor-trailer staged, long ULD container rows.
- **Z20 internal road (37.7198,-122.2205):** tractors/trailers parked along
  an internal road, ULD staging.
- **Street View (perimeter road / Air Cargo Way):** barbed-wire secured
  airport fence with "Restricted Area / Authorized Personnel" signage; FedEx
  freighter aircraft and the OAK control tower visible inside the fence.

## Gate / guard shack / docks

### Truck gate — TRUE (inferred, flagged uncertain)
The FedEx hub sits entirely inside the secured OAK airport perimeter. Street
View at the perimeter road directly shows a barbed-wire chain-link fence and
a "No Trespassing / Restricted Area / Authorized Personnel Only" sign. Truck
access into the hub is through a controlled airport security gate off Air
Cargo Way. A controlled truck gate is inferred from this secured-airport
context; the FedEx-specific gate could not be directly imaged because public
Street View does not reach the internal hub roads. Flagged uncertain.

### Guard shack — TRUE (inferred, flagged uncertain)
Secured-airport air-cargo hubs of this scale are staffed/guarded at the
controlled access point. `guardShack` inferred true at medium confidence;
`remoteGs` false. Both flagged uncertain.

### Docks
Z20 imagery shows trailers backed into dock doors along the building landside
face plus long ULD container rows — estimated 25-50 dock doors. Trailers and
tractors along internal roads give a 25-50 drop area. Counts are overhead
estimates, flagged uncertain.

## Yard zones and counts
- **perimeter:** ~70 acres — FedEx hub footprint (buildings + ramp + landside),
  estimate.
- **truckGate:** inferred controlled airport security gate off Air Cargo Way.
- **dropYards:** one box — landside trailer/ULD staging.
- **dockAprons:** one box along the building landside dock face.
- **staging:** null (no clear pre-gate staging area imaged).
- **dockDoorCount ~35**, **trailersVisible ~40**, **trailerParkingCapacity
  ~80**, **buildingCount 4**, **truckGateCount 1**, **railServed false**.
  All counts are honest overhead estimates and flagged uncertain.

## Final confidence
**Medium.** The facility was positively identified — the FedEx freighter
aircraft on the ramp and the resolved 1 Sally Ride Way address are conclusive,
and the roster's Pardee Dr address was correctly identified as the wrong
(retail) site. But the truck-gate and guard-shack specifics could not be
directly observed because the FedEx access point lies inside the secured
airport and is not covered by public Street View. Gate / guard-shack calls
are inferred from the directly-imaged secured perimeter and flagged in
uncertainFields.
