# PFG idx 8 — Performance Foodservice - Atlanta (Oakwood GA)

**Facility:** Performance Foodservice - Atlanta / PFG Milton's
**Address:** 3501 Old Oakwood Road, Oakwood, GA 30566
**Type:** Broadline Foodservice Distribution Center
**Locked coordinates:** 34.238400, -83.873000
**Confidence:** Medium

## Location confirmation

The roster supplied 34.238210, -83.872814 (GEOMETRIC_CENTER geocode, 157 m moved).
This required real resolution effort. A warehouserating.com listing places 3501 Old
Oakwood Rd at 34.238252, -83.875948 — but Street View there shows a small retail
strip ("Nutrition" sign), not a distribution center, so that geocode is wrong. The
roster's own GEOMETRIC_CENTER point, by contrast, lands on a genuine multi-building
DC complex. Street View at 34.2383, -83.8739 (Apr 2022) — taken from the interior
truck-yard pavement — shows a long dock canopy with multiple tractors and trailers
backed in: an active multi-temperature broadline food DC. That positively identifies
the **PFG Milton's** campus. Lock confidence: medium (the campus is a sprawl of
buildings and the precise center is judgment).

## What the imagery showed

- **z16 / z17 overview:** A multi-building industrial campus south of Mundy Mill Rd /
  Old Oakwood Rd, buffered from the public road by a treeline. The campus includes a
  main DC building, additional warehouse buildings, and a trailer drop yard on the
  NE side. (Note: a separate FedEx Freight terminal and a school athletic complex sit
  immediately north — excluded from the PFG geofence.)
- **Dock face (Street View Apr 2022, z18/z19):** Long dock canopy with multiple
  tractors and trailers backed in; clearly an active food DC. Trailers backed onto
  paved dock aprons.
- **Drop yard (z17/z18):** Dedicated trailer drop yard on the NE side with dense rows
  of drop trailers (55+ visible).
- **Entrance:** No barrier arm, gate, or guard booth visible. A chain-link fence
  separates an employee parking lot from the truck yard, but Google's Street View car
  drove onto the interior truck-yard pavement — indicating the entrance is
  open/uncontrolled.

## Gate / guard-shack / dock determinations

- **truckGate: false** — no controlled truck gate; the campus is buffered by trees
  but the access drives are open with no barrier arm or checkpoint.
- **guardShack: false** — no entrance booth on the campus.
- **remoteGs: false** — no gate at all.
- **dockDoors: 50+** — aggregate ~60 across the campus's multiple building faces
  (low-confidence count).
- **dropArea: 50+ / dropYard: true** — dedicated NE trailer-storage lot, 55+ drop
  trailers.
- **multipleFacilities: true** — multi-building campus: original broadline DC plus a
  174,000 sq ft expansion building (freezer, meat-cutting, fleet operations) on 43
  adjacent acres per web research.
- **shipRcvSeparate: true (medium-confidence)** — separate freezer/meat-cutting
  building implies physically distinct dock clusters.

## Yard zones & counts

- **Perimeter:** captures the multi-building PFG Milton's campus (excludes the
  adjacent FedEx Freight terminal and school athletic fields).
- **Drop yard:** the trailer field on the NE side.
- **Dock apron:** the dock strip at the main DC building.
- **yardMetrics:** ~60 dock doors, ~55 trailers visible, ~90 trailer capacity, ~2
  truck gates, 4 buildings, ~38 acres, not rail-served.

## Web findings

- 3501 Old Oakwood Rd = Performance Foodservice - Atlanta, a.k.a. PFG Milton's;
  500+ employees; distributes fresh meat, produce, dry/frozen/refrigerated goods
  across GA/AL/NC/SC.
- 2015 expansion: a 174,000 sq ft building on 43 acres adjacent to the existing
  operation, with a freezer, meat-cutting operation, and fleet operations —
  confirming the multi-building campus character.

## Final confidence: Medium

The facility was positively identified via Street View dock-face imagery, but the
campus sprawls across multiple buildings with imprecise published coordinates, and
dock-door count, trailer capacity, gate count, and ship/receive separation are
overhead estimates flagged in `uncertainFields`.
