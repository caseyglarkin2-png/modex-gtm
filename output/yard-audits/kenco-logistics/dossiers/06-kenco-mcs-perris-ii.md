# Deep-Audit Dossier — Kenco MCS Perris II (Perris, CA)

**Roster idx:** 6
**Facility:** Kenco MCS Perris II — Multi-Client Distribution Center / E-Commerce Fulfillment
**Resolved coords:** 33.83915, -117.23035
**Confidence:** medium

## Location resolution

The roster places Perris II near the Indian Avenue / Ramona Expressway area with
a GEOMETRIC_CENTER geocode that fell on a vacant intersection lot. Web research
(Commercial Property Executive, Inland Empire Business Journal, LogiCore, Connect
CRE) ties the Kenco Perris campus to the **Perris Logistics Center, 3900 Indian
Avenue**, a 579,708 SF building on ~28 acres at the SE corner of Ramona Expressway
and Indian Avenue, built 2014, C-TPAT certified.

Public sources describe one 579,708 SF building, but the campus on the ground
holds **two** large cross-dock warehouses. The Perris I roster entry (idx 5)
geocodes to the north building. Perris II (idx 6) was therefore audited as the
**south building** — the larger of the two cross-dock warehouses — centered at
~33.8392, -117.2303. Note: idx 5 and idx 6 are two buildings of the same Kenco
campus and share a trailer drop yard.

## Key views

- **Wide satellite (z15-z17):** dense Perris logistics district; campus identified
  between the perimeter road (west) and Indian Avenue (east), south of Ramona
  Expressway.
- **South building (z17-z18):** large rectangular cross-dock warehouse,
  ~480 m x 175 m footprint. Loading docks on both the north and south faces with
  trailers backed in.
- **Drop yard (z19):** wide trailer-parking yard between the two campus buildings,
  densely packed with parked trailers (multi-colored, no tractors).
- **East / Indian Avenue (Street View, 2025-12):** truck yard enclosed behind a
  continuous black metal fence; office and dome lobby on the east face.
- **West perimeter road (Street View):** continuous black metal perimeter fence
  along the west truck yard; auto parking separated from the truck yard.
- **South road (Street View):** south dock face screened by a wall; trailers
  behind; continuous fence.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The truck yard is fully enclosed by black metal perimeter
  fencing, confirmed across five+ Street View headings (Indian Avenue, west
  perimeter road, south road). The facility is C-TPAT certified (LogiCore
  listing), which mandates a controlled, secured yard. The main truck entrance is
  the wide drive at the NW corner connecting from the perimeter road into the
  yard.
- **guardShack = false; remoteGs = true.** No staffed guard booth structure is
  visible at any perimeter entrance in Street View. As a modern Class-A Inland
  Empire spec building, access is consistent with a sliding gate plus
  kiosk/intercom remote check-in.
- **dockDoors = "50+".** Cross-dock layout: roughly 55 dock doors on the south
  face and 55 on the north face; estimated total ~110.
- **shipRcvSeparate = true.** Two distinct dock banks on opposite (north and
  south) building faces.

## Yard zones and counts

- **Perimeter:** ~267 m x 453 m, ~29.9 acres — matches the reported 28-30 acre
  Perris Logistics Center parcel.
- **Truck gate:** NW-corner drive off the west perimeter road.
- **Drop yard:** large shared trailer-storage yard north of the building, between
  Perris I and Perris II — 50+ trailers parked.
- **Dock aprons:** north-face apron and south-face apron, both with trailers
  backed in.
- **yardMetrics:** ~110 dock doors, ~95 trailers visible, ~130 trailer-parking
  capacity, 1 truck gate, 1 building (campus has 2), ~29.9 acres, not rail-served.

## Web findings

- Perris Logistics Center, 3900 Indian Avenue — 579,708 SF, 28 acres, built 2014,
  SE corner of Ramona Expressway / Indian Avenue (Commercial Property Executive,
  Inland Empire Business Journal, Commercial Observer).
- Kenco Perris facility is C-TPAT certified; services include e-commerce
  fulfillment, kitting, cross-docking, reverse logistics (LogiCore).
- Foreign-trade-zone benefits cited; transload to truck or rail in the region.

## Final confidence

**Medium.** The campus and building are positively identified and the cross-dock
layout, fenced perimeter, and dock banks are clear. Confidence is held at medium
because (a) Perris I vs Perris II is a building-split inference from a shared
campus with one published address, and (b) the exact gate hardware and guard
arrangement could not be crisply resolved from available Street View.
