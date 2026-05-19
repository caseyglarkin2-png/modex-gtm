# Deep-Audit Dossier — GP Wauna Mill, Clatskanie OR (idx 1)

## Location resolution
- **Roster coords were wrong.** Supplied `46.10414, -123.203936` landed in downtown Clatskanie, ~17 km southeast of the mill.
- Web research (Oregon Forest Industry Directory, gridinfo, topozone) places the GP Wauna Mill on ~1,200 acres adjacent to the Columbia River near **Westport, OR** (~92326 Taylorville Rd / 92929 Wauna Mill Rd, Clatskanie 97016).
- Satellite probing confirmed a very large integrated pulp/paper/tissue mill complex. Locked mill core center: **46.1552, -123.4078**.
- Facility profile: fully integrated pulp, papermaking and tissue/towel conversion; ~1,100 employees; ~1,200 tons/day finished product. Consumer Products division; recent $150M paper-machine rebuild.

## Key views
- **Wide (z14-15):** Mill sits isolated between the Columbia River (north) and forested hills; US-30 runs east-west to the south. A single dedicated access road (~1 km) connects US-30 to the mill grounds through forest.
- **Mill core (z16-18):** Dense multi-building integrated campus — pulping, recovery boilers, paper machines, converting, tank farms, water-treatment clarifiers, river barge dock.
- **Chip yard (z19-20):** Large tan wood-chip pile with stacker/reclaimer conveyor on the south/east side; inbound chip trucks observed.
- **Drop yard (z19, 46.1576,-123.409):** Clear diagonal row of ~13-14 parked trailers plus a ~6-7 trailer cluster in an open lot NE of the warehouse building.
- **Access-road junction (z17-19):** Wide graded gravel staging lot where the access road meets the mill grounds; a row of trailers parked along its west edge.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** A single controlled access road is the only land route in. An integrated 1,200-acre / 1,100-employee GP mill is universally gated. The actual security checkpoint sits deep on the internal access road; Street View panos only cover US-30 and could not reach it (no gate visible from the public road).
- **Guard shack — TRUE (medium confidence).** Inferred from facility scale; a manned booth at a mill this size is standard practice, but the booth was not positively resolved in overhead imagery. Flagged uncertain.
- **Remote GS — false** (a manned shack is expected, not a kiosk).
- **Docks — 10-25 band.** Finished-goods dock positions are spread across multiple integrated buildings (~16 estimated). Process equipment and conveyors obscure building faces; low confidence.
- **Ship/Rcv separate — TRUE.** Inbound wood chips go to the chip yard (south/east); finished tissue/towel ships from warehouse docks on the north — physically separate operations.

## Yard zones & counts
- **Perimeter:** developed mill core, ~165 acres (the full 1,200-acre ownership includes forest/buffer land excluded from the geofence).
- **Drop yards:** NE warehouse trailer lot; access-road-junction staging lot.
- **Dock apron:** warehouse face on the north.
- **Staging:** pre/post-gate graded lot at the access-road junction (deep — holds 3+ trucks).
- **Metrics:** ~16 dock doors, ~23 trailers visible, ~50-trailer parking capacity, 1 truck gate, ~12 buildings, ~165 acres, no rail spur into the property (barge dock on the river instead).

## Web findings
- GP Wauna is a flagship Consumer Products tissue/towel mill; recent ~$150M paper-machine rebuild (2026 startup). One of the larger employers in Clatsop County.

## Final confidence: MEDIUM
Location positively re-identified and overhead layout is clear. Gate is certain (single controlled access road); guard-shack, truck scale and exact dock count are inferred from scale/standard practice rather than directly resolved — flagged in `uncertainFields`.
