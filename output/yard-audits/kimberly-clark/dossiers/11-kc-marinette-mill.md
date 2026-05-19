# Deep-Audit Dossier — K-C Marinette Mill, Marinette WI (idx 11)

## Resolved location
- **Roster coordinates were wrong.** The supplied lat/lng (45.099985, -87.630662, geocode precision APPROXIMATE, moved 3554 m) landed in **downtown Marinette** near the Menominee River bridge — a town-center commercial block, not a paper mill.
- Web research (Wisconsin DNR Green Tier participant page, Waze, Yelp) gave the real address: **3120 Riverside Ave, Marinette, WI 54143**.
- Satellite probe at the address coordinates confirmed a large industrial **tissue / wipers manufacturing mill** on the south bank of the Menominee River — multiple connected manufacturing buildings, a large warehouse, water-treatment ponds, and a trailer drop yard. Consistent with the K-C Marinette Mill (Scott Shop Towels, Wypall, Viva; ~230 employees).
- **Locked center: 45.10375, -87.65205.**

## Key views
- **Wide z16/z17 overview:** Mill complex bounded by the Menominee River (N), wooded embankment / landfill land (W), Riverside Ave and a residential neighborhood (E), and woods (S). Manufacturing buildings cluster along the river; a large warehouse fills the center-south; water-treatment ponds sit on the NW.
- **Drop yard z19/z16:** A dedicated **gravel trailer-storage lot** south of the warehouse holds two long rows of parked trailers (~52 counted). Separate from active dock staging.
- **East frontage Street View (2025-08):** Open driveways connect directly to Riverside Ave with no barrier at the public road. The brick K-C office building and the "Wypall" admin building front the road.
- **SE entrance Street View:** A small **tan peaked-roof guard booth** stands alone in the open paved yard near the drop yard, with a chain-link **sliding gate** section beside it and a large yellow truck-routing signboard ("ALL TRUCKS"). This interior booth is the access control point for the operational trailer/dock yard.
- **Dock Street View:** Trailers backed into dock doors along the SW warehouse face and on the SE manufacturing building; a tractor-trailer parked in the open yard; "STOP" painted on the pavement.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Access to the operational drop yard / dock area is controlled by a guard booth plus a chain-link sliding gate, with dedicated truck-routing signage. The road apron itself is open, but the interior checkpoint functions as the truck gate.
- **guardShack = true.** Distinct small 1-2-vehicle-footprint booth with peaked roof, set beside the gate in the yard — confirmed in Street View. Not the main building. Therefore `remoteGs = false`.
- **dockDoors = 25-50.** Estimated ~28 doors — a long dock face on the south/SW of the main warehouse plus a dock bank on the SE building. Roof shadow makes the exact count uncertain.
- **dropArea = 50+ / dropYard = true.** Dedicated gravel lot with two trailer rows, ~52 trailers visible, capacity ~70.
- **preGateStaging / postGateStaging = true.** Wide open apron outside the booth and open yard inside it both give ample truck queueing room.
- **drivewayLong = true; fastLaneOpportunity = true.** Deep open yard holds 3+ trucks; the very wide unmarked entrance apron has plenty of room for an express bypass lane.
- **entryExitTogether = true**, single combined entrance, 1 in / 1 out lane (open apron, lanes inferred).
- **multiStep = false.** No clear second checkpoint after the gate.
- **scale = false; railServed = false.** No truck scale or rail spur visible.

## Yard zones & counts
- **Perimeter:** ~31 acres covering the manufacturing complex, central warehouse, drop yard, and treatment ponds inside the fenced industrial property.
- **Truck gate zone:** the interior guard-booth / sliding-gate checkpoint in the SE yard.
- **Drop yard:** one gravel lot south of the warehouse, ~52 trailers, capacity ~70.
- **Dock aprons:** SW warehouse face and SE manufacturing-building dock bank.
- **Staging:** open apron between Riverside Ave and the guard booth.
- **Buildings:** 4 distinct structures (river-side manufacturing, central warehouse, SE manufacturing/dock building, front office) — several interconnected.

## Web findings
- Wisconsin DNR Green Tier confirms the active Kimberly-Clark Marinette Mill, a Tier 2 applicant / Tier 1 participant since 2021. ~230 workers produce Scott Shop Towels, Scott Rags-in-a-Box, Wypall wiping products, and Viva paper towels. Address corroborated by Waze and Yelp at 3120 Riverside Ave.

## Final confidence: **high**
Facility positively identified and re-located; gate and guard-shack determinations backed by clear Street View. Dock-door count and ship/receive separation are the only soft calls (flagged in `uncertainFields`).
