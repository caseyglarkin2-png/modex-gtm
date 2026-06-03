# Yard Audit Dossier — Costco Depot, College Park GA

- **Facility:** Costco Depot, College Park GA (Dry Depot — Southeast regional cross-dock)
- **Address:** 4250 S Fulton Pkwy, College Park, GA 30349
- **Resolved center:** 33.61600, -84.53330
- **Method:** deep-audit (satellite + Street View)
- **Confidence:** high

## Location confirmation

Roster coordinates (33.617501, -84.533008) landed within the property. A z16
satellite pull showed a very large solar-roofed distribution building wrapped by
dense rows of trailers in the lower-center of frame — consistent with a Costco
cross-dock. Web search confirmed the address: TruckMap, Hotfrog, Waze and driver
review sites all list "Costco Distribution Center, 4250 S Fulton Pkwy, College
Park / Union City, GA 30349," phone 404-461-0000. Driver reviews describe a
structured truck check-in (attendant issues a pager, then calls the driver with a
dock-door number), drop-and-hook service, and overnight secured truck parking —
all consistent with a guarded regional cross-dock. Center re-pinned on the main
building at 33.6160, -84.5333.

## Key views

- **z16 / z15 wide:** Property sits in an industrial park off S Fulton Pkwy,
  bounded N by the divided parkway, W/S by woods, E by a loop road and a separate
  (non-Costco) warehouse. Tree buffers screen the site on all sides.
- **z17 / z18 overview:** Main building is a large rectangular/L-shaped cross-dock,
  long axis running NW–SE, with a photovoltaic roof. Dense trailer rows on the
  west, south and east faces (dock aprons) plus dedicated drop-yard lots. A
  solar-carport employee lot sits N/NW of the building; a separate car lot is at
  the NW.
- **z18–z20 detail:** Continuous dock banks with trailers backed in along multiple
  building faces; hundreds of trailers staged in marked rows. A second, smaller
  dock-served building stands on the SW side of the same property → two buildings.
- **Entrance (z19/z20 + Street View):** A single private divided entrance road
  leaves S Fulton Pkwy and curves SW into the property.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Street View pano `sqDchmDuUdwg5rhCsh3UTA` (2023-01) at
  the entrance shows a divided private access road with a STOP sign, striped
  median island and crosswalk markings — the single controlled truck entrance.
  The outer road mouth is open/landscaped (no arm at the parkway), but the
  controlled check-in is set back inside the yard. `truckGateCount: 1`,
  `entryExitTogether: true`.
- **Guard shack — TRUE (medium-confidence, flagged).** Not crisply resolvable in
  satellite at this resolution and screened by trees in Street View, but multiple
  independent driver reviews describe a staffed attendant check-in with a pager
  system and dock-door dispatch — i.e. a manned booth, not kiosk/app-only.
  Therefore `remoteGs: false`. Listed in `uncertainFields`.
- **Dock doors — 50+.** Continuous dock rhythm with backed-in trailers along the
  NE/N, SW and S faces of the main building plus the secondary building; overhead
  door count is well above 100 across the complex.
- **Drop area / drop yard — 50+ / TRUE.** Several dedicated trailer-storage lots
  (north strip along the access road, NW lot, and a central lot) packed with
  trailers parked without tractors, separate from active dock staging.
- **Ship/Rcv separate — TRUE (medium).** Distinct dock banks on opposite building
  faces read as separated inbound/outbound flow.

## Yard zones and counts

- **Perimeter:** 6-vertex oriented ring tracing the fenced property inside the
  treeline; ~59.6 acres (computed from the polygon).
- **Truck gate:** quad over the divided entrance off S Fulton Pkwy.
- **Drop yards:** three rings — N access-road strip, NW lot, and central/S lot.
- **Dock aprons:** two rings hugging the west and south dock faces at the
  building's true NW–SE angle.
- **Staging:** post-gate paved apron inside the entrance (pager-call waiting area).
- **Metrics:** dockDoorCount ~130, trailersVisible ~320, trailerParkingCapacity
  ~420, truckGateCount 1, buildingCount 2, siteAreaAcres 59.6, railServed false.
  Counts are honest overhead estimates.

## Street View

- Entrance/perimeter pano `sqDchmDuUdwg5rhCsh3UTA` (2023-01), camera heading 193°
  points from the parkway entrance SSW into the property — the arrival frame a
  driver sees. Used for both `perimeter` and `truckGate`. Adjacent newer panos
  (2025-11) on the parkway are screened by the tree buffer.

## Web findings

- Confirmed Costco Distribution Center at the audited address (TruckMap, Hotfrog,
  Waze, Foursquare, review aggregators).
- Operational detail from driver reviews: attendant/pager check-in, dock-door
  dispatch, drop-and-hook, overnight secured truck parking, early-arrival
  turn-away (>2 hrs early) — all reinforcing a guarded, high-throughput cross-dock.

## Final confidence

**High.** Facility unambiguously identified and the layout (cross-dock with 100+
dock doors, large drop yards, single divided truck entrance) is clear from
imagery. The guard-shack call rests on driver-review corroboration rather than a
direct overhead read, so it (with scale and exact lane counts) is flagged in
`uncertainFields`.
