# Deep-Audit Dossier — FedEx Express Regional Hub, Newark NJ (idx 04)

## Facility
- **Name:** FedEx Express Regional Hub - Newark NJ
- **Type:** Express regional hub (Newark Liberty International Airport)
- **Roster address:** 350 Brewster Rd, Newark, NJ 07114 (the EWR airport address)
- **Resolved location:** FedEx Cargo Complex, EWR North Cargo Area —
  Buildings 347 / 156 / 155, 155 Earhart Dr, Newark, NJ 07114
- **Locked center:** 40.706800, -74.171000

## Step 0 — Location confirmation
The roster coordinate (40.707912, -74.171912) was RANGE_INTERPOLATED from the
generic airport address (350 Brewster Rd) and lands directly on the FedEx
Express cargo complex within the EWR North Cargo Area — so the supplied point
was effectively correct for the facility.

Web research confirmed the FedEx Cargo Complex is a ~$60M sort facility
occupying Buildings 347, 156 and most of 155 at 155 Earhart Dr, on the grounds
of Newark Liberty International Airport. FedEx Express (then Federal Express)
opened its second hub at EWR in 1986.

Satellite imagery (zoom 16-20) confirmed an air-cargo building cluster with
FedEx-livery wide-body freighter aircraft (blue tails) parked at multiple
airside positions, an airside ramp covered with ULD containers, dollies and
ground equipment, landside cargo buildings with truck dock bays, and employee
parking. This is unambiguously the FedEx Express air hub. Center locked at
40.70680, -74.17100.

## Key views
- **Z16-17 wide:** EWR North Cargo Area — FedEx building cluster, neighboring
  cargo buildings (UNITED CARGO visible in Street View), highway interchange
  to the north.
- **Z18-19 building cluster:** cargo buildings, FedEx freighters at airside
  positions, rooftop solar on one cargo building, ULD/dolly staging.
- **Z20 airside ramp (40.7067,-74.1718):** apron full of ULD containers,
  dollies and GSE next to the cargo building.
- **Z19 landside dock face (40.7048,-74.1715):** angled/perpendicular truck
  dock bays along the landside building face; employee parking opposite.
- **Street View (Earhart Dr / cargo-area road):** open cargo-area road with
  trucks, trailers and dock doors; FedEx-specific access point not reachable
  by public Street View.

## Gate / guard shack / docks

### Truck gate — TRUE (inferred, flagged uncertain)
The FedEx complex sits entirely inside the secured EWR airport perimeter. The
whole cargo area is access-controlled by the Port Authority, and the airside
fence line between the landside cargo buildings and the aircraft ramp is a
hard security boundary with controlled vehicle gates. A controlled truck gate
is therefore inferred from the secured-airport context — it could not be
directly imaged because public Street View does not reach the FedEx access
point. Flagged uncertain.

### Guard shack — TRUE (inferred, flagged uncertain)
Airport air-cargo hubs of this scale are staffed/guarded at the secured access
point. `guardShack` is inferred true at medium confidence; `remoteGs` false.
Both flagged uncertain.

### Docks
Landside building faces show angled/perpendicular truck dock bays — estimated
25-50 doors. Trailers and a staging strip on the landside give a 10-25 drop
area. Counts are overhead estimates, flagged uncertain.

## Yard zones and counts
- **perimeter:** ~45 acres — FedEx cargo complex footprint within the North
  Cargo Area, estimate.
- **truckGate:** inferred controlled access point on the landside / airside
  boundary.
- **dropYards:** one box — landside trailer/ULD staging.
- **dockAprons:** one box along the landside dock face.
- **staging:** null (no clear pre-gate staging area imaged).
- **dockDoorCount ~40**, **trailersVisible ~30**, **trailerParkingCapacity
  ~70**, **buildingCount 4**, **truckGateCount 1**, **railServed false**.
  All counts are honest overhead estimates and flagged uncertain.

## Final confidence
**Medium.** The facility was positively identified — the FedEx freighter
aircraft on the ramp are conclusive — but the truck-gate and guard-shack
specifics could not be directly observed because the FedEx access point lies
inside the secured airport and is not covered by public Street View. Gate /
guard-shack calls are inferred from secured-airport context and flagged in
uncertainFields.
