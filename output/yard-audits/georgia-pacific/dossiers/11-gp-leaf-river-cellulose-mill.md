# Deep-Audit Dossier — idx 11: GP Leaf River Cellulose Mill, New Augusta MS

## Resolved location
- **Roster point:** 31.218882, -89.052055 ("358 Leaf River Rd") — geocoded GEOMETRIC_CENTER.
- **Problem:** The roster coordinate landed on a small rural residential property (single house, gravel drive) ~2.7 km **south** of the mill. The "358 Leaf River Rd" address is the mailing/entrance-road address, not the building footprint.
- **Resolution:** Web search (Georgia-Pacific news, EPA ENERGY STAR, Forest Products Locator) confirmed the Leaf River Cellulose mill sits **north of New Augusta**. Satellite probing from z14 down located the sprawling mill complex.
- **Locked center:** ~**31.2432, -89.0455** (pulp-processing core). The developed mill runs roughly 31.236–31.250 N/S along a north–south access road off Leaf River Rd.
- Street View (captured 2025-03) along the west boundary road positively confirmed the facility: green-clad pulp mill buildings, recovery boiler stacks with steam plumes, digesters, chemical tank farm, cooling towers, and a finished-goods warehouse — fully consistent with a wood-cellulose/dissolving-pulp mill (~300 employees per GP).

## Key views
- **z14/z15 wide:** Full campus visible — pulp processing core (center), woodchip storage yard with stacker/reclaimers (NE), chemical tank farm (W), finished-goods warehouse (S of core), wastewater treatment ponds and clarifiers (S). Surrounded by managed pine forest.
- **z17–z20 core:** Large white-roof finished-goods warehouse; multiple rail spurs running alongside it and the woodyard; processing buildings, tanks, cooling towers.
- **z20 warehouse south face:** ~6–9 trailers (white + reddish/pink) backed into dock doors on a wide paved apron — finished-cellulose shipping.
- **z18 woodyard:** Long elongated woodchip piles with A-frame stacker/reclaimer machines — chip/log receiving area.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** The mill is fully enclosed by chain-link perimeter fencing (clearly visible the length of the west boundary road in Street View). The main access road enters the fenced property from an intersection by the green admin/control building at ~31.2438, -89.0473; fencing and gate structures flank the entry road. Controlled entry confirmed.
- **Guard shack — FALSE / remoteGs TRUE.** No distinct standalone guard booth (1–3-vehicle footprint) was observed at the truck lane. The green admin/control building sits at the entry and performs the access-control function. Classified as a controlled gate with no dedicated shack → `remoteGs: true`. Flagged uncertain.
- **Docks — 10-25 band.** Finished-goods warehouse south face has a bank of dock doors with ~6–9 trailers present plus additional empty doors. shipRcvSeparate TRUE — woodchip/log receiving and chemical tank receiving are physically separate from the finished-cellulose shipping warehouse.
- **Scale — TRUE (low confidence).** A truck scale for chip-van/log-truck weigh-in is operationally required at a mill of this type; not pinpointed in imagery, flagged uncertain.

## Yard zones and counts
- **Perimeter:** ~285 acres of developed mill footprint inside the fence line (processing core + woodyard + tank farm + warehouse + treatment ponds).
- **truckGate zone:** entry/admin area at ~31.2438, -89.0473.
- **dropYard:** paved area south of the warehouse used for trailer parking/staging — small (0-10 band of dedicated drop trailers visible).
- **dockApron:** wide paved strip along the warehouse south face.
- **postGateStaging:** generous paved internal yard between gate and docks.
- **Building count:** ~12 distinct structures/clusters.
- **Rail-served:** TRUE — multiple spurs through the site, rail cars present.
- **Driveway:** long internal approach (3+ truck queue capacity); wide entry apron offers fast-lane room.

## Web findings
- Georgia-Pacific Leaf River Cellulose plant, New Augusta MS — produces wood cellulose (dissolving pulp) used in chemicals, paints, filters, consumer products. One of four GP cellulose plants.
- ~300 employees; first U.S. pulp mill to earn EPA ENERGY STAR certification (2020), recertified 2021/2022.

## Final confidence
**Medium.** Facility positively identified and layout well-characterized from clear satellite + Street View. Confidence held to medium because the roster coordinate was badly off (required relocation), the guard-shack/remote-gate distinction and truck-scale could not be fully resolved from imagery, and dock-door count is a banded estimate.
