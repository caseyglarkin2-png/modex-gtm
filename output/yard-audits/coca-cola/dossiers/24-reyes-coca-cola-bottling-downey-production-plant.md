# Deep-Audit Dossier — idx 24

## Reyes Coca-Cola Bottling — Downey Production Plant, CA

**Facility type:** Bottling / Manufacturing Plant
**Resolved location:** ~33.93400, -118.12880 — 11634 Patton Rd, Downey, CA 90241
**Confidence:** Medium

## Location resolution
The roster names this the "Downey Production Plant" but supplied the address
"12320 Smith Ave, Santa Fe Springs CA 90670" with coordinates
(33.948887, -118.072734). Probing that address showed a generic warehouse
street in Santa Fe Springs with no Coca-Cola signage — it does not match a
Coca-Cola production plant.

Business research resolved the correct site:
- Buzzfile and the OpenGovUS Los Angeles business registry list Reyes Coca-Cola
  Bottling's Downey manufacturing address as **11634 Patton Rd, Downey, CA
  90241** (a related registration also at 8729 Cleta St, same neighborhood).
- Reyes operates production plants in Downey, Los Angeles, and San Leandro.

Satellite probing of 11634 Patton Rd revealed a large bottling/distribution
complex, and Street View confirmed it conclusively: a **Coca-Cola red branding
stripe** runs along the building, and **Coca-Cola-branded red trailers** are
parked inside the fenced truck yard.

## Key views
- **Wide satellite (z16-17):** Large multi-building complex bounded by streets
  on all sides; a rail line runs along the north edge. Two trailer drop yards
  (north/rail side and south side); employee parking.
- **Tight satellite (z18-20):** Dock banks with trailers backed in on multiple
  building faces; red Coca-Cola trucks/trailers throughout the yard; ~80
  trailers visible across the two drop yards.
- **Street View (perimeter):** The site is fully secured — masonry walls and
  chain-link fencing topped with barbed wire. The truck yard is entered through
  a chain-link rolling/sliding gate (seen open). Coca-Cola red trailers visible
  inside.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE:** The plant perimeter is fully walled/fenced with barbed
  wire. The truck yard is entered through a chain-link rolling gate confirmed in
  Street View. A controlled, secured truck entrance.
- **Guard shack — FALSE (flagged uncertain):** No staffed guard booth observed
  at the rolling gate. A booth could exist at another entrance outside Street
  View coverage.
- **Remote GS — TRUE:** Gate present without a confirmed staffed booth implies
  kiosk/remote check-in (flagged uncertain).
- **Docks — 50+ band:** ~55 dock doors estimated across multiple building faces
  (flagged uncertain — several dock faces partly obscured).

## Yard zones & counts
- **Perimeter:** Large walled Reyes Coca-Cola complex — roughly 40 acres.
- **Drop yards:** Two large trailer-parking areas (north/rail side + south
  side) holding ~80 trailers total — dropYard true, dropArea 50+.
- **Dock aprons:** Building faces where trailers back in; dock banks on
  physically separate faces — shipRcvSeparate true.
- **Staging:** Large internal paved yards between gates and docks —
  postGateStaging true, drivewayLong true.
- **Truck gates:** At least two gated entrances at different perimeter points —
  entryExitSeparate true, truckGateCount 2.
- **Buildings:** Main production/warehouse + additional connected warehouses +
  office/support building — multipleFacilities true.
- **Rail:** A rail line runs along the north edge and a spur appears to serve
  the site — railServed true.

## Web findings
- Reyes Coca-Cola Bottling Downey manufacturing — 11634 Patton Rd, Downey CA
  90241 (Buzzfile; OpenGovUS LA business registry). Reyes operates production
  plants in Downey, Los Angeles, and San Leandro.

## Final confidence
**Medium.** Identity (Coca-Cola branding + branded trailers), the secured
walled perimeter, the rolling truck gate, the dual drop yards, and rail service
are confidently established. Guard-shack / remote-check-in and exact dock count
are flagged uncertain. Note the roster's supplied address was wrong; the audit
targets the verified Patton Rd plant.
