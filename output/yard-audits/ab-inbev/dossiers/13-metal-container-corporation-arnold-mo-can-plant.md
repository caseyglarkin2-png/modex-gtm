# Deep-Audit Dossier — Metal Container Corporation, Arnold MO Can Plant (idx 13)

## Resolved location
- **Facility:** Metal Container Corporation (MCC) can plant, 42 Tenbrook Industrial Park, Arnold, MO 63010
- **Locked center:** 38.43380, -90.35350 (MCC manufacturing complex)
- Roster coords (38.433434, -90.355816) were ~1.9 km off (`movedMeters` 1926) but landed in the industrial park.
- AB-owned MCC operation — the nation's largest can manufacturer; $150M expansion announced. Identity confirmed via web research (Yelp, TruckMap, EPA TRI facility 63010MTLCN42TEN) and the large manufacturing complex with extensive trailer yards in Tenbrook Industrial Park.

## Key views
- **z15 wide:** Tenbrook Industrial Park between residential Arnold (W) and the Meramec River (E), with a rail line running N-S along the E.
- **z17-18 center:** Large MCC manufacturing complex with extensive trailer parking; a water reservoir/tank in the center of the yard.
- **z19 trailer yard:** Large open dirt/gravel yard NE of the plant with ~90 trailers in rows; open (unfenced) on the powerline-easement side.
- **z19 docks:** Trailers backed in along the SE and S building faces.
- **z20 W entrance:** Open paved driveway access with cars parked; no guard booth on the MCC side.
- **Street View W (2019):** A brick building near the W driveway is the neighboring **St. Louis County Health Department / Animal Control** — not MCC. A slatted chain-link fence runs along part of the W edge.

## Gate / guard-shack / dock determinations
- **truckGate = false (medium confidence).** No controlled truck gate positively identified. The plant sits inside a multi-tenant industrial park with open paved driveways; the NE trailer yard is open dirt/gravel with no perimeter fence on the easement side. A partial slatted chain-link fence exists on the W edge but the driveways appear ungated. Flagged uncertain.
- **guardShack = false.** No guard booth at any MCC entrance. The brick structure near the W driveway belongs to the neighboring Health Department building, confirmed by Street View signage — not a guard shack.
- **remoteGs = false** — no gate, so false.
- **dockDoors = 25-50** (~35 est.) — trailers backed in along the SE and S building faces.
- **scale = false** — none identified (flagged uncertain).

## Yard zones and counts
- **Perimeter:** ~35 acres, S 38.43220 / W -90.35500 / N 38.43650 / E -90.35000.
- **Drop yards:** large open dirt/gravel trailer yard on the NE side, ~90 trailers visible, capacity ~160 — `dropYard = true`, `dropArea = 50+`.
- **Dock aprons:** SE and S building faces — `shipRcvSeparate = true`.
- **Staging:** none distinct (open yard).
- **Buildings:** 5 — main can manufacturing hall plus ancillary/warehouse structures — `multipleFacilities = true`.
- **Rail:** rail line runs N-S along the E side of the industrial park; a siding directly into the MCC building could not be positively confirmed — `railServed` left true but flagged uncertain.

## Web findings
AB-owned MCC can plant, founded 1973; the nation's largest can manufacturing operation; $150M expansion announced. Active facility.

## Final confidence: MEDIUM
Identity and overall layout resolved; the plant is clearly a high-volume can manufacturer with a large trailer drop yard. The site reads as open-access within a multi-tenant industrial park (no positively-confirmed gate or guard shack). Truck gate, guard shack, scale, rail siding, lane counts and dock-door count are flagged uncertain.
