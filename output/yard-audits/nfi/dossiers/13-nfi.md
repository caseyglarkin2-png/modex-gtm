# Deep-Audit Dossier — NFI Distribution Center, Lancaster TX (site 13)

- **Facility:** NFI Distribution Center (NFI / Rent-A-Center dedicated DC)
- **Type:** Distribution Center (cross-dock)
- **Audited location:** **32.6366, -96.7955** — 1901 Danieldale Rd, Lancaster, TX 75134, in ProLogis **Park 20/35**
- **Method:** deep-audit (satellite z16-z21 + Street View + web research)
- **Confidence:** **high**

## Location resolution — IMPORTANT correction
The supplied record gave **510 E Pleasant Run Rd, 75146** at coords **32.603652, -96.750848**. Satellite probes at those coords (z17/z19) show a **small industrial/contractor yard** — two modest metal buildings, passenger-car parking, mixed equipment storage and grain silos/tanks. That is **not** a distribution center and does not match the facility type or the researchHint.

The `researchHint` explicitly references the **NFI/Rent-A-Center DFW DC news release**. Web research (Texas Real Estate Research Center, JOC, Transport Topics, McShane Construction, NFI Industries) places the operational NFI/Rent-A-Center DC at **1901 Danieldale Rd, Lancaster TX 75134**, ~650,000 SF, completed 2014 by ProLogis in Park 20/35 (≈4.07M SF, eight buildings, between I-20 and I-35, FTZ/Triple Freeport). TruckMap, Waze, and business directories all list NFI at 1901 Danieldale Rd. Per the Step-0 instruction ("if the supplied coordinates are wrong, find the right ones — do not audit the wrong site"), I audited the Danieldale building. The 510 E Pleasant Run address appears to be a stale/secondary Yellow-Pages listing for NFI in Lancaster.

I positively identified the NFI building as the central cross-dock at ~32.6366,-96.7955: a long rectangle rotated ~35° off north (long axis NW-SE), with dock doors and backed-in trailers along **both** long faces — consistent with a ~650k SF Rent-A-Center cross-dock.

## What the key views showed
- **z16 / z17 overview:** Long cross-dock building set in a multi-building ProLogis park; retention pond to the NW; dense residential subdivisions abutting to the E and S; adjacent (separate-tenant) warehouses to the SW and SE.
- **z18 both ends:** Dock banks with trailers on the SW face (some orange-marked doors) and the NE face (behind a screening fence along the residential street). Deep, wide truck drive aisles and trailer staging at the SE end.
- **SW corner z19-z21:** Auto/office entrance with flagpole and fenced employee parking; landscaped entrance loop on the internal park drive; a fence-line/sliding-gate pinch where the truck drive enters the trailer-and-dock yard; marked trailer drop stalls.
- **Street View (Danieldale Rd):**
  - Pano `j0sagb07-UCR3pXu55zgPw` (2021-02): the building's blank end wall behind continuous chain-link fence with a sliding gate at the auto entrance.
  - Pano `FEPx5udOzj6zfDwjKnXT8Q` (2018-08): driver's-eye on the **wide internal park drive** with a **Walmart tractor-trailer** rolling past the warehouses — confirms heavy truck traffic and a wide, multi-lane truck approach. Used for the truckGate Street View frame (heading 338°).
  - Residential-side pano (2025-12): houses across the street; the fence here borders the neighborhood.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Continuous chain-link perimeter fence around the parcel; a sliding gate at the auto/office entrance and a gated pinch where the SW internal drive enters the yard. Access is controlled.
- **guardShack = FALSE.** No small staffed booth (1-3 vehicle footprint, multi-side windows) is identifiable at the truck lane in satellite (z19-z21) or any Street View frame. *(medium confidence — flagged)*
- **remoteGs = TRUE.** Gate present but no guard shack ⇒ kiosk / call-box / app check-in implied, typical of a modern ProLogis cross-dock. *(medium confidence — flagged)*
- **dockDoors = 50+.** Regular dock-door rhythm with backed-in trailers along both ~430m faces; well over 50 doors total.
- **shipRcvSeparate = TRUE.** True cross-dock — dock clusters on two physically separate (opposite) building faces.
- **dropYard = TRUE / dropArea = 25-50.** Dedicated marked trailer-storage stalls in the SE drop yard and along the aprons holding trailers without tractors.
- **fastLaneOpportunity = TRUE.** Very wide multi-lane internal drives and a deep gate apron give ample paved width for an express/bypass lane.
- **drivewayLong = TRUE, postGateStaging = TRUE.** Long gate-to-dock approach (3+ truck queue) and large interior aprons/aisles for staging.
- **urbanRural = Urban.** Lancaster sits in the DFW metro; dense subdivisions abut the park.
- **backupSensitive = FALSE.** Gate sits on private internal park drives, not a public road — a queue would not spill into traffic.
- **scale / multiStep / multipleFacilities = FALSE.** No truck scale, no second checkpoint, single NFI building (adjacent warehouses are separate tenants).
- **railServed = FALSE.** No rail spur enters the parcel.

## Yard zones & counts (geofences)
- **perimeter:** 7-vertex oriented ring tracing the NFI parcel inside the fence; ≈ **24.5 acres** (shoelace area). Building alone ≈650k SF (≈14.9 ac) per public reporting; remainder is aprons, drives, drop yard, and auto parking.
- **truckGate:** rotated quad over the SW entrance drive / yard-gate pinch.
- **dockAprons (2):** thin quads hugging the SW face and the NE face at the building's ~35° angle.
- **dropYards (1):** trailer drop/storage lot at the SE end.
- **staging:** null (interior staging captured by drive aprons rather than a distinct pre-gate lot).
- **yardMetrics (estimates from overhead imagery):** dockDoorCount ≈110, trailersVisible ≈70, trailerParkingCapacity ≈120, truckGateCount 1, buildingCount 1, siteAreaAcres 24.5, railServed false.

## Web findings
- NFI rented ~650,000 SF at 1901 Danieldale Rd, Park 20/35, built 2014 by ProLogis; first dedicated DC in NFI's Rent-A-Center supply-chain partnership (announced 2015), with integrated transportation/dedicated fleet. Sources: Texas Real Estate Research Center, Journal of Commerce, Transport Topics, Inside Logistics, NFI Industries, McShane Construction, TruckMap/Waze.
- NFI phone for the Danieldale facility: 214-560-2950.

## Final confidence
**High** on location, building identity, layout, dock/drop/ship-rcv, and fast-lane room. The only medium-confidence calls (flagged in `uncertainFields`) are guardShack/remoteGs (no booth visible but inferred remote check-in) and exact lane counts / trailer capacity.
