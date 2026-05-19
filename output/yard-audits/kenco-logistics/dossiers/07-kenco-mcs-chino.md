# Deep-Audit Dossier — Kenco MCS Chino (Chino, CA)

**Roster idx:** 7
**Facility:** Kenco MCS Chino — Multi-Client Distribution Center
**Resolved coords:** 33.96700, -117.66150
**Confidence:** high

## Location resolution

The roster gives 6509 Kimball Avenue, Chino CA 91708 with a ROOFTOP geocode
moved 217 m. Probing the roster point landed on a large white-roof warehouse in
the Chino logistics district south of Kimball Avenue. **Step 0 confirmation:** a
z20 satellite probe of the building's roof shows the painted address number
**"6509"** clearly legible (appears mirrored/rotated in overhead view). This is
the Kenco MCS Chino building. The Kimball Avenue intersection street sign and
block-number plates (6400 / 6500) corroborate the address.

Note: a neighboring building to the east carries a solar-paneled roof and the
building west carries roof number "15122" — these are separate properties. The
Kenco facility is the central white-roof cross-dock building.

## Key views

- **Wide satellite (z15-z17):** dense Chino industrial park; multiple Class-A
  warehouses; Kimball Avenue runs E-W along the north edge.
- **6509 building (z17-z18):** long N-S cross-dock warehouse, ~445 m x 194 m
  footprint. Office and auto parking front Kimball Avenue at the north end;
  second office at the south end.
- **West face (z18-z19):** dock apron with trailers backed in; a drop yard with
  parked trailers and stacked materials/pallets at the SW.
- **East face (z19):** docks along a divided truck corridor (truck lane plus a
  landscaped median) shared with the solar-roofed building to the east.
- **Street View (Kimball Avenue, 2025-10):** office fronts and auto parking on
  the north face; chain-link fencing visible at the truck-corridor entrance; a
  J.B. Hunt intermodal truck and an Amazon truck observed using the access road.
- **Street View (truck corridor):** chain-link fence around the truck yard; no
  guard booth visible.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The truck yards on both the west and east faces are
  enclosed by chain-link fencing (confirmed in Street View off Kimball Avenue and
  around the perimeter). Two truck access points: the east truck corridor off
  Kimball Avenue (shared divided drive) and a SW perimeter-road drive into the
  west drop yard.
- **guardShack = false; remoteGs = true.** No staffed guard-booth structure is
  visible at any entrance. As a modern multi-tenant Inland Empire spec building,
  access is consistent with a sliding/cantilever gate plus kiosk/intercom remote
  check-in.
- **dockDoors = "50+".** Cross-dock layout: roughly 50-55 dock doors on the west
  face and 50-55 on the east face; estimated total ~105.
- **shipRcvSeparate = true.** Two distinct dock banks on opposite (west and east)
  building faces.
- **dropArea = "25-50".** Trailers parked without tractors in the west drop yard.

## Yard zones and counts

- **Perimeter:** ~456 m x 226 m, ~25.5 acres — building plus west drop yard plus
  the east truck corridor lane on Kenco's side.
- **Truck gate:** east corridor entrance off Kimball Avenue (primary), plus SW
  drive (secondary).
- **Drop yards:** west-side trailer-storage yard with parked trailers and
  staged materials.
- **Dock aprons:** west-face apron and east-face apron, both with trailers backed
  in.
- **yardMetrics:** ~105 dock doors, ~60 trailers visible, ~80 trailer-parking
  capacity, 2 truck gates, 1 building, ~25.5 acres, not rail-served.

## Web findings

- 6509 Kimball Ave, Chino CA 91708 — Kenco Logistics Services, phone
  (909) 597-1819 (Yellow Pages, BBB, Chamber of Commerce, Waze).
- Kenco warehousing map lists the Chino MCS at 410,260 SF, 32 ft clear; the
  410,260 SF figure is the Kenco-leased portion of the larger cross-dock
  building.
- C-TPAT-grade multi-client distribution operations consistent with the rest of
  Kenco's California MCS network.

## Final confidence

**High.** The building is positively identified by a legible roof address
number, the cross-dock layout and dock banks are clearly visible, and the fenced
truck yard with two access points is confirmed in both satellite and Street View.
Guard arrangement (no booth -> remote/kiosk gate) is the only inferred element
and is flagged in uncertainFields.
