# Crowley Cincinnati Office - Cincinnati OH (idx 18)

**Address:** 312 Plum Street, Suite 1430, Cincinnati, OH 45202
**Coordinates:** 39.098385, -84.516840 (ROOFTOP geocode)
**Type:** Logistics office (downtown high-rise) - NOT a truck yard
**Confidence:** low

## How it was confirmed
The only Crowley presence in the Cincinnati metro published on crowley.com/locations is an **office** at 312 Plum Street, Suite 1430, Cincinnati OH 45202 (513-407-5050). "Suite 1430" indicates the 14th floor of a downtown office building. Geocoding lands ROOFTOP on a full-block downtown high-rise.

I searched for an actual Crowley warehouse/DC in the Cincinnati/Northern Kentucky region (Hebron, Erlanger, West Chester, etc.) and found none published. A "Crowley's" at 8957 Cincinnati-Columbus Rd, West Chester OH is an **unrelated commercial printer**, not a Crowley Maritime/Logistics warehouse. So there is no Crowley truck yard in the Cincinnati metro to audit in place of the office.

## What the imagery showed
- **z18 overview:** Dense downtown core - office towers, the I-71 / Fort Washington Way freeway trench to the south, on-street parking. No industrial buildings.
- **z20 building crop:** A multi-story downtown office tower occupying most of a block, with a central interior light well and rooftop mechanical units. No docks, no truck apron, no trailer/container parking anywhere on or beside the building.
- **Street View (Plum St, pano 15XaEu0NGs5tnNHK5h0gfw, 2025-05):** Standard downtown office tower facade.

## Gate / guard / dock determinations
There is nothing yard-related to determine. truckGate false, guardShack false, dockDoors NONE, dropArea NONE, no drop yard. This is a white-collar sales/logistics office.

## Yard zones and counts
- **perimeter:** ~0.7 ac - the office block footprint only, reported for completeness (it is a building footprint, not a yard).
- **truckGate / dropYards / dockAprons / staging:** none.
- **yardMetrics:** all zero (dockDoorCount 0, trailerParkingCapacity 0, truckGateCount 0, buildingCount 1, siteAreaAcres ~0.7, railServed false).
- **"yard spots" meaning:** N/A - no trailer parking or container slots exist at this address.

## Web findings
Crowley Cincinnati = liner & logistics office (sales/operations), not an operational facility. No published Crowley warehouse/DC in the Cincinnati metro.

## Recommendation
Exclude from per-site yard pricing and yard-management TAM. Carry as an office node only. If Crowley operates a Cincinnati-area DC through a 3PL/partner under a different address, it is not published on crowley.com and was not findable.

## Final confidence
**low** - by nature: the address is correct (high confidence it is an office) but there is no yard to model. Flagged accordingly.

**3-line summary**
- Gate: false (downtown office tower, no truck access)
- Guard shack: false (office building)
- Confidence: low (office, not a yard - exclude from yard TAM)
