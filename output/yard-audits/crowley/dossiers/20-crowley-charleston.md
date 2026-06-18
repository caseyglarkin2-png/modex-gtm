# Crowley North Charleston Terminal - North Charleston SC (idx 20)

**Address:** 2075 Thompson Ave, North Charleston, SC 29405
**Coordinates:** 32.847446, -79.935503 (ROOFTOP geocode)
**Type:** Marine terminal / RoRo-breakbulk cargo yard
**Confidence:** medium

## How it was confirmed
crowley.com/locations lists Crowley's Charleston-area logistics presence, and business listings (Yelp, Yellowpages, business directories) confirm **Crowley Liner & Logistics at 2075 Thompson Ave, North Charleston SC 29405** - RoRo / LoLo, breakbulk, project cargo, plus warehousing/distribution. Geocoding lands ROOFTOP on the Cooper River waterfront inside the former Charleston Naval Base, adjacent to the SC Ports / Veterans Terminal breakbulk complex.

Note: 146 Fairchild St (Daniel Island, 29492) is Crowley's Charleston **office** suite; the operational terminal the task asks for is this North Charleston waterfront site, so that is what was audited.

## What the imagery showed
- **z16/z17 wide context:** Former Navy base waterfront. Finger piers extend into the Cooper River to the NE hosting laid-up Ready Reserve Force vessels. The Crowley terminal sits at a pier head with an office/terminal building, parking, and adjacent paved cargo lay-down pads. Long warehouse buildings (red and gray roofs) line the SW.
- **z19/z20 building crop:** The Crowley pier-head building (gray roof), large parking lots, and a big concrete lay-down pad to the SE. ~15 trailers/cargo units visible on the aprons. No warehouse-style multi-door dock bank - cargo moves RoRo (ramps) and LoLo (lift) at the pier.
- **Street View (Thompson Ave, pano ya_2rL1jthob0aiLt3saxA, 2024-11):** Continuous chain-link perimeter fence with red-roofed warehouses behind it and a brick terminal/dormitory building - a fenced, controlled port compound.

## Gate / guard / dock determinations
- **truckGate: true (uncertain).** The terminal is inside a fenced, access-controlled former-Navy-base port compound; Street View shows the perimeter fence line on Thompson Ave. Set true. Flagged uncertain because the specific Crowley gate vs the shared base access point is not individually resolved and the booth is not directly imaged.
- **guardShack: true (uncertain).** Controlled port entry implies a manned gate; specific booth not directly resolved. remoteGs false.
- **postGateStaging: true.** Large paved aprons inside the fence serve as queue/staging before the pier.
- **dockDoors: 0-10 (~2).** Essentially no warehouse dock bank; 1-2 positions on the small transit building. Marine terminal.
- **dropArea: 50+ / dropYard: true.** Extensive paved cargo lay-down + chassis/trailer ground area.

## Yard zones and counts
- **perimeter:** ~9.2 acres - the Crowley terminal sub-area (pier-head building + parking + lay-down), rotated to the waterfront grain. Does NOT enclose the entire Navy base.
- **dropYard:** the paved cargo lay-down pad adjacent to the building.
- **dockAprons:** [] (no warehouse dock bank).
- **yardMetrics:** dockDoorCount 2, trailersVisible 15, trailerParkingCapacity 120, truckGateCount 1, buildingCount 3, siteAreaAcres 9.2, railServed true.
- **"yard spots" meaning:** CONTAINER / RoRo cargo lay-down + chassis/trailer GROUND SLOTS (not warehouse dock stalls). ~120+ capacity is a marine-terminal estimate on shared, unstriped port apron - low confidence.

## Web findings
Crowley Liner & Logistics North Charleston terminal: RoRo/LoLo, breakbulk, project cargo, freight consolidation, warehousing/distribution. Co-located in the former Navy base / Veterans Terminal area (a breakbulk/project-cargo/RoRo terminal on the Cooper River with long-term storage and warehouse space). The base/terminal complex is rail-served.

## Final confidence
**medium.** Operator and waterfront site positively identified; marine-terminal character (RoRo/breakbulk, cargo lay-down, fenced port access) is clear. Exact gate structure, lane counts, and lay-down capacity are estimates - flagged. dockDoorCount is intentionally near-zero (it is a port, not a warehouse).

**3-line summary**
- Gate: true (fenced controlled port compound on Thompson Ave - uncertain on the specific booth)
- Guard shack: true (manned port gate implied - uncertain, booth not directly imaged)
- Confidence: medium
