# GM CCA - Rancho Cucamonga Parts Distribution Center, CA (idx 34)

**Address:** 9150 Hermosa Ave, Rancho Cucamonga, CA 91730
**Resolved center:** 34.10015, -117.55255
**Confidence:** High

## Identification

GM media and pressroom pages confirm the GM Customer Care & Aftersales (CCA)
Rancho Cucamonga Parts Distribution Center at 9150 Hermosa Ave: opened 2002,
~404,000 sq ft, staffed under UAW Local 6645, fulfilling GM dealer and ACDelco
parts orders. Satellite probing around the address found a large solar-roofed
concrete tilt-up distribution building running E-W, with a dock-door bank and a
screen-walled truck yard along the south public road (6th St). 2025 Street View
along the frontage corroborates the screen wall, landscaped berm, and gated
driveway breaks consistent with a single-tenant parts DC.

Note: an earlier Ford "Parts Distribution Center, Rancho Cucamonga" audit in
this repo reused the same coordinates/building. The street address 9150 Hermosa
is GM's facility, which is the building audited here.

## Key views

- **Wide satellite (z16/z17):** GM building is the southernmost of three parallel
  large warehouses; ballfields/park to the east, dense IE warehouse grid all
  around. No rail anywhere on or adjacent to the parcel.
- **Building (z17/z18):** solar panels cover most of the roof. Docks on the SOUTH
  face only (single-load). North face abuts a shared drive aisle / the next
  warehouse.
- **Dock face (z19/z20/z21):** continuous dock-door bank along the full south
  wall with many trailers (green, red, blue, white) backed in. A separate row of
  drop trailers (no tractors) sits along the inside of the south screen wall.
- **Street View (gate pano sz9cUYWqqIn2cEKRSt-Z1A, 2025-09):** east driveway
  break in the white screen wall shows a dark sliding gate across the opening
  with a small marker post. No staffed booth visible.
- **Street View (perimeter pano uhrZ1pmOhoWs6j0a9VcdmQ, 2025-09):** continuous
  screen/parapet wall along the frontage behind a landscaped berm.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Continuous concrete screen wall rings the south truck
  yard; access via two driveway breaks; east driveway has a visible sliding gate.
- **guardShack = false (uncertain).** No staffed booth visible at either
  driveway in Street View; openings gated but appear unmanned.
- **remoteGs = true (low confidence).** Gate present without a confirmed booth
  implies kiosk / call-box / app check-in.
- **dockDoors = 50+.** Long continuous dock bank across the full south face with
  many trailers backed in; ~55 estimated.

## Yard zones & counts

- **perimeter:** ~20-acre parcel enclosing the building and its south truck court
  / drop yard (4-corner ring, essentially aligned to the road grid).
- **truckGate:** east driveway break in the south screen wall.
- **dropYards:** one ring - the drop-trailer parking row along the inside of the
  south screen wall.
- **dockAprons:** one ring - the long thin paved strip in front of the south dock
  bank.
- **yardMetrics:** dockDoorCount ~55, trailersVisible ~30, trailerParkingCapacity
  ~45, truckGateCount 2, buildingCount 1, siteAreaAcres ~20, railServed false.

## Web findings

- GM media/pressroom: 404,000 sq ft, opened 2002, UAW Local 6645, GM dealer +
  ACDelco parts fulfillment.

## Final confidence

**High** on identification, building, dock band, and the gated screen-wall
perimeter. Lower confidence on guardShack/remoteGs (no booth confirmable from
available imagery), lane counts, and exact dock/trailer counts.

**Gate:** controlled - sliding gate at the screen-wall driveway breaks (true).
**Guard shack:** none visible - remote/kiosk check-in implied (false / uncertain).
**Confidence:** high overall.
