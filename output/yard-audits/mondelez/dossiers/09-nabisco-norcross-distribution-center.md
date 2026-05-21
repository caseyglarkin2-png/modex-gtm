# Deep-Audit Dossier — Nabisco Norcross Distribution Center, Norcross GA (idx 9)

## Facility
- **Name:** Nabisco Norcross Distribution Center - Norcross GA
- **Type:** Distribution center
- **Roster address:** Norcross, GA (city-level only)
- **Resolved address:** 6300 Brook Hollow Pkwy, Norcross, GA 30071
- **Locked coordinates:** 33.92175, -84.21810

## Step 0 — Location confirmation
The roster gave only APPROXIMATE city-level coordinates (33.941108,
-84.213744). Web research (Businessyab, Chamber of Commerce, Buzzfile, the
Becknell Industrial property index) identified the Mondelez/Nabisco Norcross
facility at 6300 Brook Hollow Pkwy, Norcross GA 30071 (Gwinnett County parcel
6-223-064). The address was geocoded with the Google Geocoding API to a
ROOFTOP point at 33.9214824, -84.2181224. Satellite + Street View confirmed a
distribution warehouse there with an office front, dock doors, and a truck
court. Locked to that building.

## Key views
- **z17/z18 context:** Moderate square warehouse on Brook Hollow Parkway,
  flanked by much larger warehouses; dense Norcross industrial corridor.
- **z19/z20 building:** Office front on the SW (parkway) side; warehouse with
  dock doors on the NE face; front car-parking lot; NE truck court.
- **z20 dock face:** NE dock apron with ~10-14 dock-door positions; a few
  trailers backed in / parked in the truck court.
- **Street View (2025-10/12):** Warehouse with a glazed office front and a
  green sign board at the driveway. Open driveway off Brook Hollow Parkway, no
  barrier arm and no guard booth. A trailer parked at the dock side.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Open paved driveway from Brook Hollow Parkway into the
  front lot and on to the NE truck court. No barrier arm, sliding/swing gate,
  or checkpoint pinch-point in satellite or Street View.
- **guardShack = false.** No gate-side booth. The building has an office front
  on the SW corner, but that is part of the main building, not a guard shack.
- **remoteGs = false.** No gate, so no remote check-in inferred.
- **Docks:** NE face dock apron with roughly 10-14 door positions; band
  **10-25** (count ~13), flagged uncertain - the court is partly shadowed.
- **Drop area:** The NE truck court holds only a handful of untethered
  trailers; band **0-10**, flagged uncertain. No dedicated standalone trailer
  yard, so dropYard = false.

## Yard zones and counts
- **perimeter:** ~167 m N-S x ~157 m E-W, ≈ 6.5 acres - building, front
  parking, and NE truck court inside the tree-lined parcel edge.
- **truckGate box:** the driveway off Brook Hollow Parkway at the NW corner.
- **dropYards:** the NE truck court (modest trailer parking, doubles as
  staging).
- **dockApron:** the NE dock apron in front of the loading doors.
- **yardMetrics:** dockDoorCount ~13, trailersVisible ~5, capacity ~14,
  truckGateCount 1, buildingCount 1, siteArea 6.5 ac, railServed false.

## Web findings
- Businessyab / Chamber of Commerce / Buzzfile: Mondelez International /
  Nabisco Foods storage-distribution facility at 6300 Brook Hollow Pkwy,
  Norcross GA 30071.
- The roster source ties the facility to 2021 BCTGM Nabisco strike coverage
  (Nabisco workers in Norcross GA on strike), consistent with a Mondelez/
  Nabisco distribution operation.

## Classification rationale
Moderate single-building distribution warehouse, open-access with one ungated
driveway and no guard structure, in the dense Atlanta-metro Norcross industrial
corridor (Urban). Modest NE dock face and small truck court; short gate-to-dock
approach. No dedicated drop yard, no scale, no rail, single building.
Archetype: No Gate / No GS (#3-type).

## Confidence: MEDIUM
Location was resolved from city-level data to a ROOFTOP-geocoded address and
the building was confirmed in imagery, so the site identity is solid. Confidence
is MEDIUM rather than HIGH because the exact dock-door count, trailer count, and
ship/receive separation cannot be pinned precisely (truck court partly shadowed
in available imagery) - flagged in uncertainFields.
