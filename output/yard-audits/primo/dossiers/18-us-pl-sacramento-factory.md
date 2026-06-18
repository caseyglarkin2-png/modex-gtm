# US PL Sacramento Factory — Deep Audit Dossier

**Facility:** US PL Sacramento Factory (Bottling plant, PL)
**Operator:** BlueTriton / Nestle Waters North America — now Primo Brands
**Address:** 8670 Younger Creek Dr, Sacramento, CA 95828 (APN 062-0140-013, Lots 21-22 Florin Depot Industrial Park)
**Resolved center:** 38.51615, -121.38055
**Maps:** https://www.google.com/maps/@38.51615,-121.38055,400m/data=!3m1!1e3
**Confidence:** high

## Location resolution
The supplied city-level coords (38.5158, -121.3809) were essentially correct — they geocode directly to 8670 Younger Creek Dr. Multiple business records (Yelp, OpenGovUS Sacramento County FBN, Dun & Bradstreet, FCC license) register Nestle Waters North America at this exact address, and a 2009 Sacramento Press report documents Nestle's $14M retrofit of the ~214,000 sqft building into a two-line water-bottling plant (Pure Life + Arrowhead), ~40 jobs. Per the brief, the San Bernardino spring-extraction fight was ignored; this is the Sacramento production/bottling plant. I locked the center on the building roof at 38.51615, -121.38055.

Satellite confirmed a single very large rectangular industrial building (long axis ~N40°W, rotated ~30° from north) with a wrapping truck yard, a fenced perimeter, a dock bank with trailers backed in, and a controlled gate — consistent with a high-throughput bottling plant, not an office.

## What the key views showed
- **Wide z16/z17 (p18-orient-z16b, p18-center-z17b):** one dominant building filling the lot; paved truck yard wraps the NW, SW and SE faces; employee parking and a secondary dock cluster on the NE; rail corridors run *alongside* the district (NW and E) but no spur enters the property.
- **SW dock face z20 (p18-docks-sw-z20, p18-sw-corner-z20):** a continuous dock bank with ~12-15 trailers backed perpendicular into the wall in a single imaged segment, dock levelers/blue dock equipment, plus more trailers staged in the open yard.
- **Gate z21 (p18-gate-z21):** a cantilever **sliding gate** spanning the entrance drive on the NE/E side (~38.51665, -121.37945), gate-motor box on the north post, set behind a curved apron off the access road. An "OUT" pavement marking sits in the entrance throat.
- **Gate Street View 2025-03 (pano jvqRTVLuhkw3sOT7GfJGpw, heading 270):** continuous chain-link perimeter fencing, the sliding gate across the controlled entrance, dock doors and trailers visible behind the fence. **No guard booth.**
- **Perimeter Street View 2025-03 (pano qn9AUmi2157-fqRKne6Mlw, heading 290):** trailers parked/staged in the yard, dock doors with blue dock equipment, employee cars, fence line along Younger Creek Dr.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Cantilever sliding gate across the truck/vehicle entrance, behind chain-link fencing — confirmed in both z21 satellite and 2025 Street View. A genuine controlled checkpoint, not an open driveway.
- **guardShack = FALSE.** No staffed booth (1-3 vehicle footprint, multi-side windows) at or beside the gate in any view.
- **remoteGs = TRUE.** Controlled gate + no shack → unmanned sliding gate implies kiosk / call-box / badge / app check-in.
- **dockDoors = 25-50.** Long continuous SW dock bank (trailers backed in across the imaged segments, banks continuing in z17) plus a smaller NE dock/load cluster. Honest total ~30; banded 25-50, flagged uncertain (exact count not resolvable from overhead).
- **shipRcvSeparate = TRUE (medium).** Two distinct dock banks on different building faces (SW primary, NE secondary) suggest split shipping/receiving; function not confirmable from imagery.

## Yard zones and counts
- **perimeter:** ~17.1 acres of fenced/paved operational footprint (the platted parcel is ~29 acres incl. peripheral land; the active fenced yard is ~17).
- **truckGate zone:** the NE-side sliding-gate throat off Younger Creek Dr.
- **dropYards:** the wrapping NE/N yard holding dropped trailers separate from active dock staging.
- **dockAprons:** the long thin strip along the SW building face where trucks back into the dock doors.
- **staging:** none distinct outside the gate (postGateStaging is the internal yard).
- **yardMetrics:** dockDoorCount ~30, trailersVisible ~22, trailerParkingCapacity ~40, truckGateCount 1, buildingCount 1, siteAreaAcres 17.1, railServed false.

## Other classification calls
- **Urban** — dense Florin / Power Inn industrial fabric inside the Sacramento metro.
- **drivewayLong / postGateStaging = TRUE** — deep wrapping internal yard stacks 3+ trucks; large internal staging.
- **entryExitTogether = TRUE**, entry/exit 1/1 lane (low confidence on the split).
- **dropYard = TRUE**, dropArea 10-25.
- **backupSensitive, fastLaneOpportunity, scale, multiStep, multipleFacilities, connectivityIssue, preGateStaging = FALSE.**
- **railServed = FALSE** — adjacent rail corridors, no on-site spur.

## Web findings
- 2009 Sacramento Press / Indybay: Nestle Waters opened a ~214,000 sqft Sacramento bottling plant (Pure Life + Arrowhead), two lines, ~40 jobs, $14M retrofit.
- Yelp / OpenGovUS / D&B: Nestle Waters USA registered at 8670 Younger Creek Dr, Sacramento CA 95828.
- LoopNet parcel: APN 062-0140-013, Lots 21-22 Florin Depot Industrial Park, ~29 acres, Florin-Fruitridge Industrial Park neighborhood.
- Ownership chain: Nestle Waters North America → BlueTriton Brands (2021) → acquired by Primo (2024).

## Final confidence
**High.** Facility identity, gate, guard-shack, urban/rail, building count and layout are confidently read from clear multi-vintage Maxar satellite plus two 2025 Street View panos at the gate and perimeter. The dock-door count, exact trailer count, exit-lane split, and ship/receive function are the soft fields (banded / flagged uncertain).
