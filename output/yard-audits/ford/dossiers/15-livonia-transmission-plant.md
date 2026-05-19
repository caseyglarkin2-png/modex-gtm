# Ford - Livonia Transmission Plant, Livonia MI — Deep Audit Dossier

**Roster idx:** 15
**Type:** Transmission Plant
**Resolved center:** 42.37150, -83.39800
**Confidence:** Medium

## Location resolution

The roster geocode (42.372187, -83.398969) is flagged GEOMETRIC_CENTER, moved
1204 m — but it lands inside the correct plant complex. Satellite confirmed
this is the Ford Livonia Transmission Plant at 36200 Plymouth Rd, Livonia
(Wayne County) MI. Web research (Wikipedia, Ford Authority) confirms it is the
largest transmission plant in North America: ~3.3M sq ft of enclosed floor
space on ~182 acres, established 1952, producing the 6R/10R transmission
families used in the F-150, Mustang, Expedition, Navigator and Transit. I
refined the center slightly to ~42.3715,-83.3980 on the main plant building
cluster.

## Key views

- **z15/z16 context** — a large sprawling integrated multi-building plant in
  dense industrial Livonia, with a distinctive vehicle test-track oval on the
  east of the property and rail lines along the north edge.
- **z17/z18 plant views** — employee parking lots ring the building on the
  south (Plymouth Rd) and west (Levan Rd); freight operations and a material
  laydown yard are concentrated on the north side.
- **North dock area (z19)** — a clear dock bank with several trailers backed
  in, plus a large laydown yard of stacked steel racks / returnable containers;
  rail spurs run alongside.
- **East building face** — extensive racked material storage between the
  building and the test-track road.
- **Street View (2024-2026)** — chain-link perimeter fencing along the west
  (Levan Rd) and other edges; a gated truck/material entrance on the west side
  with truck signage and trailers visible inside; open campus driveways off
  Plymouth Rd serving employee parking.

## Gate / guard-shack / dock determinations

- **Truck gate: true.** Chain-link perimeter fencing confirmed along the west
  and other property edges; a gated truck/material entrance with truck signage
  and trailers parked inside is confirmed on the west side near the north dock
  yard. Some Plymouth Rd driveways are open employee access. truckGateCount
  estimated 2 — flagged uncertain.
- **Guard shack: true (medium confidence).** A fenced ~3.3M sq ft Ford
  powertrain plant of this scale conventionally runs staffed gatehouses at
  controlled entries. A booth structure could not be positively resolved —
  flagged uncertain. remoteGs false as a consequence.
- **Dock doors: 10-25.** A dock bank with trailers is clear on the north side,
  plus dock activity along the east face. Exact count obscured by roof angle.
- **Ship/Rcv separate: true (medium confidence).** Dock activity on physically
  separate building faces (north dock yard, east building face) — flagged
  uncertain.

## Yard zones and counts

- **Perimeter:** the fenced plant property including the test track, ~190 acres
  (consistent with the published ~182-acre figure).
- **Drop yard:** north-side truck yard, ~10-20 trailers amid a large material
  laydown area; banded 10-25. dropYard true.
- **Dock aprons:** north dock bank and east building face.
- **Buildings:** 3 (main interconnected plant plus detached office/support
  buildings) — multipleFacilities true.
- **Rail:** rail lines along the north property edge with spurs into the north
  yard — railServed true.

## Web findings

- Largest transmission plant in North America; ~3.3M sq ft, ~182 acres,
  established 1952.
- Produces the 6R/10R transmission families (F-150, Mustang, Expedition,
  Navigator, Transit).

## Final confidence

**Medium.** The facility is positively identified, the perimeter and freight
zones are well established from imagery, and a gated truck entrance is
confirmed. Guard-shack presence, exact gate count, lane counts, dock-door
count, and ship/receive separation are inferred or estimated and flagged
uncertain.
