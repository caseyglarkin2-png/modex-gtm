# Deep-Audit Dossier — Target RDC Madison (T0580)

- **Facility:** Target Regional Distribution Center Madison (T0580 / RDC T-580)
- **Address:** 6175 Greenbrier Pkwy NW, Madison, AL 35756 (also listed 6305 Greenbrier Rd)
- **Resolved center:** 34.6455, -86.8485
- **Geocoded input:** 34.64515, -86.850299 — landed correctly ON the Target building.
- **Method:** deep-audit (satellite zoom 16-20 + Street View + web)
- **Confidence:** HIGH

## Location confirmation
The geocoded point sat on the roof of a single very large white-roof distribution
building. Web search confirmed this is **Target RDC T-580** (Huntsville/Madison
County Chamber listing, Manta, Waze, Apple Maps all resolve to 6175 Greenbrier
Pkwy NW / 6305 Greenbrier Rd, Madison AL 35756). Ground-truth: the 2026-04 Street
View pano at the entrance loop road shows the **red Target bullseye logo and a
Target monument sign** at the drive (`tmp/site-8/sv-int-n.png`) — unambiguous.
Footprint and trailer fleet (green Target trailers) are consistent with a ~1.5M sq
ft Target RDC.

## What the key views showed
- **Overview / wide (z16-17):** One dominant DC building, slightly rotated off
  north; massive trailer drop yard on the NW; employee parking to the south; a
  pump house with two circular tanks at the SW corner; access via a loop road off
  Greenbrier Pkwy at the SE; active farm fields and a retention pond to the west.
- **Drop yard (z18-20, `dropyard-z18.png`, `yardgate-z20.png`):** 100+ trailers
  parked in marked rows, many green Target-branded, no tractors attached — a true
  dedicated drop yard (50+ band).
- **Dock faces:** Continuous dock-door banks on the building's **north** face
  (opening onto the drop yard) and **east** face (`eastbldg-z20.png` shows trailers
  backed in along the east wall) — two physically separate dock clusters → 50+
  doors total, ship/receive plausibly separated.
- **SE yard-ops area (`truckgate-east-z19.png`, `eastoffice-z20.png`):** A
  standalone yard-operations / transportation office building with its own parking,
  and an adjacent long gridded concrete pad reading as a **truck scale / weigh
  platform**, sit at the throat where the truck route enters the secured yard.
- **Perimeter (`sv-entrance-nw.png`, `sv-truckdrive-w.png`):** A continuous **black
  ornamental metal perimeter fence** runs along the property line in both the 2016
  and 2026 Street View panos — the site is fully fenced.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** The whole property is fenced, with a single controlled
  truck entrance off the Greenbrier Pkwy loop road at the SE. The Target monument
  sign marks the drive. The private drive is set back beyond public-road Street
  View coverage, so the gate arm itself is not directly imaged, but the
  single-throat fenced layout is unambiguous for an RDC of this class.
- **guardShack = TRUE (inferred, flagged uncertain).** I could not positively image
  a small dedicated booth at the road pinch (SV does not reach the private drive).
  However a yard-ops building + scale pad sits at the SE throat, and Target RDCs of
  this generation are built with an exterior guard house (corroborated by Walsh
  Group's published Target DC build spec describing an "exterior guard house").
  Listed in `uncertainFields`.
- **remoteGs = FALSE** (gate present and guard presence inferred, so not a
  remote/kiosk-only check-in).
- **dockDoors = 50+**, **dropArea = 50+**, **scale = TRUE** (medium conf),
  **shipRcvSeparate = TRUE** (two distinct dock banks on different faces),
  **postGateStaging = TRUE** (deep interior aprons), **drivewayLong = TRUE**,
  **fastLaneOpportunity = TRUE** (wide entrance apron).

## Yard zones & counts
- **perimeter:** 5-vertex oriented ring tracing the maintained/fenced operational
  footprint ≈ **88.4 acres** (the full deeded parcel incl. the western buffer and
  retention pond is larger; the ring covers the secured operational core).
- **dropYards:** one ring over the NW trailer yard ≈ 26 acres.
- **dockAprons:** two rings — north apron (along the north dock wall into the drop
  yard) and east apron (along the east dock wall).
- **truckGate:** quad over the SE entrance throat off the loop road.
- **yardMetrics:** dockDoorCount ≈120, trailersVisible ≈180, capacity ≈250,
  truckGateCount 1, buildingCount 3 (DC, SE yard-ops office, SW pump house),
  railServed false. Counts are honest overhead estimates.

## Web findings
- Huntsville/Madison County Chamber lists "Target RDC T-580" as
  Distribution/Shipping/Logistics at this address.
- Manta / Waze / Apple Maps / Yelp corroborate 6175 Greenbrier Pkwy NW (6305
  Greenbrier Rd), Madison AL 35756.
- Walsh Group Target-DC build spec (comparable RDC) documents an "exterior guard
  house" + pump house — consistent with the structures observed here.

## Final confidence: HIGH
Facility identity, fencing, single controlled truck gate, drop yard, and dock
banding are all clearly supported. guardShack, the truck scale, and exact
entry/exit lane counts are inferred (SV cannot reach the private drive) and are
flagged in `uncertainFields`.
