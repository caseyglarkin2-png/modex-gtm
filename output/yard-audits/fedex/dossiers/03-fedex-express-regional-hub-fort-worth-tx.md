# Deep-Audit Dossier — FedEx Express Regional Hub, Fort Worth TX (idx 03)

## Facility
- **Name:** FedEx Express Regional Hub - Fort Worth TX
- **Type:** Express regional hub (Fort Worth Alliance Airport)
- **Roster address:** 2851 Alliance Gateway Fwy, Fort Worth, TX 76177 (incorrect — see below)
- **Resolved location:** 2001 World Wide Dr, Fort Worth, TX 76177 — east cargo apron of Perot Field / Fort Worth Alliance Airport
- **Locked center:** 32.994650, -97.312900

## Step 0 — Location confirmation
The roster lat/lng (32.965384, -97.297344) was RANGE_INTERPOLATED from the
address "2851 Alliance Gateway Fwy" and landed on a residential subdivision /
small commercial strip roughly 3 km south of the actual hub. The supplied
coordinates were wrong.

Web research established that the FedEx Express Fort Worth Hub operates from
2001 World Wide Dr, on the east cargo ramp of Fort Worth Alliance Airport.
Probing satellite there (zoom 15-20) confirmed a large industrial sort campus:
a white-roofed main sort building with FedEx aircraft parked at airside
positions, a second large sort/cross-dock building immediately south, an
office building with employee parking on the landside, and an extensive
ULD/trailer drop yard between the buildings. This is unambiguously the
air-to-ground regional sort hub. Center locked at 32.99465, -97.31290.

Web findings: FedEx Express opened the Fort Worth Hub in 1997. It is the
primary connection point for small-package airfreight across the Southwest
US and US-Mexico markets. ~600,000 sq ft, 800+ employees, ~100,000 packages
processed daily on two sorts, ~650 flights/month.

## Key views
- **Z15-17 wide:** campus sits on the airport's east cargo apron — main sort
  building, second sort building, office, drop yard, runways to the west.
- **Z18 main building:** large white-roofed sort building; aircraft tails
  visible at airside positions on the west/north edges; vehicle/trailer rows
  to the east.
- **Z20 drop yard (32.9926,-97.3115):** long parallel rows of trailers / ULD
  containers in a dedicated storage yard between the two buildings.
- **Z20 south building dock face (32.9916,-97.3132):** trailers backed into
  dock doors; tractor-trailers maneuvering; container/ULD staging rows.

## Gate / guard shack / docks

### Truck gate — TRUE
Z20 satellite at 32.9921,-97.3092 shows the public access road meeting a
controlled checkpoint: a small booth flanked by sliding gates spanning the
roadway, perimeter fencing on both sides, and lane striping. Street View
(2016/2021 panos on the access road) confirms a manned gate — an overhead
gate-canopy / barrier frame across the lanes, multiple in/out striped lanes,
and perimeter fence. Definitive controlled truck gate.

### Guard shack — TRUE
Street View clearly shows a small, single-vehicle-footprint booth with
windows on multiple sides set beside the entrance lane, carrying a "FedEx
Security" sign. This is a staffed guard shack. `remoteGs` is therefore false.

### Docks
Truck / road-feeder docks line the south sort/cross-dock building face;
trailers are seen backed in. Estimated 25-50 dock doors (band). The drop area
between the buildings holds dozens of trailers/containers — 50+ band.

## Yard zones and counts
- **perimeter:** ~95 acres — core landside hub footprint (buildings + drop
  yard + gate apron), estimate.
- **truckGate:** the checkpoint/guard-booth area on the southeast access road.
- **dropYards:** two boxes — the main inter-building trailer/ULD storage yard,
  plus a secondary trailer row near the south building.
- **dockAprons:** one box along the south building dock face.
- **staging:** wide paved apron just outside the gate (pre-gate queue room).
- **dockDoorCount ~45**, **trailersVisible ~90**, **trailerParkingCapacity
  ~160**, **buildingCount 4**, **truckGateCount 1**, **railServed false**.
  All counts are honest overhead estimates and flagged uncertain.

## Final confidence
**High.** Facility positively identified despite a wrong roster coordinate;
the truck gate and guard shack are confirmed by both satellite and Street
View. Door/trailer counts are overhead estimates flagged in uncertainFields.
