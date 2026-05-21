# Deep-Audit Dossier — idx 06

## FedEx Express Regional Hub — Greensboro NC

**Type:** Express regional hub (Piedmont Triad / Mid-Atlantic air-cargo sort)
**Resolved coordinates:** 36.10580, -79.93820
**Confidence:** medium

## Location resolution
The roster geocode (36.104268, -79.983761, address "1100 Pleasant Ridge Rd")
landed ~4 km west of the actual hub on a cluster of unrelated office/warehouse
buildings. Web research confirmed the FedEx Express Mid-Atlantic hub opened in
June 2009 on the airside of Piedmont Triad International Airport (GSO): ~1
million sq ft, capacity ~24,000 packages/hour, one of FedEx Express's seven
regional hubs. Satellite probing of the airport (z15–z19) positively identified
the hub: a large sort building with extensive employee parking on the landside
and an aircraft apron with multiple FedEx jets and cargo wings on the airside.
Locked center at the sort building, 36.1058, -79.9382.

## Key views
- **z15/z16 overview** — Whole campus: central sort building, perimeter loop
  road encircling the property, large employee parking lots to the north, a
  separate office building to the northwest, and a wide airside apron east of
  the building.
- **z18 main building** — Flat-roofed sort building with rooftop mechanical
  equipment; airside ramp to the southeast.
- **z19 airside** — Cargo finger/wing structures extending onto the apron with
  several aircraft parked, ground service equipment, containers (ULDs) and
  dollies — classic express air-sort layout.
- **z18/z19 landside building edge** — A bank of canopied cargo dock positions
  along the southwest face of the sort building with feeder trailers.

## Gate / guard-shack / dock determinations
- **Truck gate:** Marked `true` but qualified. The hub sits inside the airport
  Air Operations Area (AOA); vehicle access is governed by airport-wide SIDA
  security checkpoints, not a single FedEx booth at a property line. No discrete
  FedEx truck gate is visible in satellite or Street View.
- **Guard shack:** No discrete FedEx guard booth identified. AOA access is
  badge/credential controlled, so `remoteGs = true` (controlled access, no
  staffed FedEx booth at a yard gate).
- **Multi-step:** Airport perimeter security followed by FedEx ramp control
  implies staged entry; marked `true` but flagged uncertain (no second booth
  directly imaged).
- **Dock doors:** ~25-50 landside cargo dock positions along the SW building
  face; airside wings handle container-to-aircraft transfer. Band `25-50`.
- **Drop area:** ~10-25 feeder trailers parked along the apron/dock edge.

## Yard zones and counts
- **Perimeter:** ~890 m N-S x ~765 m E-W → ~168 acres for the FedEx-controlled
  hub footprint (sort building, parking, immediate apron).
- **Dock apron:** one box along the SW landside building face.
- **Drop yards / staging:** not separately boxed — feeder trailers stage on the
  apron/dock edge rather than in a discrete drop lot.
- **Metrics:** dockDoorCount ~30, trailersVisible ~14, trailerParkingCapacity
  ~40, truckGateCount 1, buildingCount 3, siteAreaAcres ~168, railServed false.

## Web findings
- FedEx Express Mid-Atlantic hub at PTI, opened June 2, 2009, ~1M sq ft,
  ~24,000 pkg/hr sort capacity (airportimprovement.com, flyfrompti.com).
- Airport added a $150M parallel runway (5L-23R, opened Jan 2010) to support
  FedEx operations.
- FedEx announced ~400 additional jobs at the hub (2018, multiple local outlets).

## Final confidence
**Medium.** Facility and footprint positively identified, but it is an
air-cargo hub on secured airport land — gate/guard-shack semantics differ from
a standard truck yard and could not be confirmed at street level. Counts are
honest overhead estimates.
