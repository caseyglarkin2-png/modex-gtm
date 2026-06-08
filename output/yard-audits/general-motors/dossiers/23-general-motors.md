# GM - Bedford Casting Operations, Bedford IN — Deep Audit Dossier

**Roster idx:** 23
**Type:** Aluminum Casting Plant
**Resolved center:** 38.87880, -86.48450
**Confidence:** Medium

## Location resolution

The roster address (105 GM Dr, Bedford, IN 47421) geocodes via Google to
38.8795, -86.4851 with a facility-sized bounding box. Initial blind satellite
probing around the city-level coordinate (38.879, -86.503) hit forest and a
limestone/quarry building on the northwest side and was ~1.5 km off. The
authoritative geocode re-pinned the site about 1.5 km east, directly on a large
interconnected multi-roof industrial complex.

Positively confirmed as GM Bedford Casting Operations:
- Street View (captured 2026-04) on the east perimeter road shows the **GM
  logo** on the administration building facade and a **"Bedford Casting
  Operations" GM monument sign** with US and Indiana flags.
- Foundry **smokestacks** and two **water towers** are visible from the north
  approach and the east perimeter.
- Web research: ~1 million sq ft aluminum die-casting foundry on ~152.5 acres
  straddling GM Drive and extending north along Bailey Scales Road; ~680-900
  hourly/salaried workers; opened 1942 (former WWII aluminum aircraft-engine
  foundry on an early-1900s limestone-mill site). Casts cylinder blocks,
  transmission cases, structural components, and EV drive-unit housings for
  Chevrolet/Buick/GMC/Cadillac.

No coordinate correction beyond the geocode was needed.

## Key views

- **z16/z17 overview** — interconnected multi-roof casting complex in the
  center, employee parking lots to the north/northeast, a cooling/retention
  pond to the northeast, the detached administration building on the east, and
  a large detached metal-clad warehouse (building "1107") to the south with an
  adjacent solar array.
- **z18/z19 east/SE** — densely packed continuous manufacturing roofs (no
  warehouse-style dock rhythm), process tanks, a circular treatment/tank
  structure, and a long covered conveyor/pipe bridge crossing the SE yard.
- **z18 west/SW** — outdoor material laydown with stacked containers and a row
  of trailers between the main plant and the south warehouse; residential
  neighborhood immediately west.
- **Street View north approach (2026-04)** — rural road, open fields, plant
  with smokestacks and water tower confirmed.
- **Street View east perimeter (2026-04)** — full chain-link perimeter fence; a
  controlled fenced opening with a small canopy structure on the southeast
  (~38.8778, -86.4823); the GM admin building and monument sign further north.

## Gate / guard-shack / dock determinations

- **Truck gate: true.** The property is fully chain-link fenced; a controlled
  fenced truck/material gate with a canopy structure sits on the southeast
  perimeter road. Trucks enter the fenced yard at a controlled pinch point.
- **Guard shack: false / remoteGs: true (medium confidence).** No clearly
  staffed multi-window guard booth could be positively resolved at the truck
  gate — the control reads as a gated/kiosk checkpoint. A foundry of this scale
  may run a staffed gatehouse, so this is flagged uncertain.
- **Driveway short / postGateStaging true.** The gate-to-building approach is
  short (1-2 trucks), but inside the fence there is open paved/gravel laydown
  yard where inbound trucks can hold before backing to material bays.
- **Dock doors: 0-10.** This is a foundry, not a DC — a continuous-roof
  manufacturing complex with few discrete dock positions, mostly material
  handling on the SE/SW building faces. Flagged uncertain.
- **Drop area: 10-25 / dropYard true.** A modest trailer-and-container storage
  area on the west/southwest yard between the main plant and the south
  warehouse holds an estimated ~10 trailers; capacity ~25.

## Yard zones and counts

- **Perimeter:** the fenced foundry property, ~152 acres (matches the published
  152.5-acre figure), traced as an 8-vertex ring around the complex, admin
  building, north parking, and south warehouse.
- **Truck gate:** SE perimeter controlled opening near 38.8778, -86.4823.
- **Drop yard:** west/SW container-and-trailer laydown area.
- **Buildings:** 3 — main casting complex (one interconnected structure),
  detached east administration building, detached south "1107" warehouse.
  Not flagged multipleFacilities (the casting complex dominates).
- **Rail:** marked not rail-served — an old limestone-era corridor and a covered
  conveyor/pipe bridge cross the SE area but read as process/utility, not a
  freight spur; inbound aluminum appears to arrive by truck. Medium confidence.

## Web findings

GM Bedford Casting Operations: ~1M sq ft aluminum die-casting foundry, ~152.5
acres straddling GM Drive, ~680-900 workers, opened 1942. Recent investments
include $51M (Dec 2021) and $45M (Nov 2022) to expand EV drive-unit casting
capacity (Chevrolet Silverado EV / GMC Sierra EV / HUMMER EV). Sources:
gm.com facilities page, GM investor press releases, EPA corrective-action
listing, Bedford Area Chamber of Commerce.

## Final confidence

**Medium.** The facility is positively and unambiguously identified (GM logo and
"Bedford Casting Operations" monument sign in recent Street View). The truck
gate and fenced perimeter are confirmed. Guard-shack staffing, exact dock-door
count, lane counts, drop-yard capacity, and rail-served status are inferred or
estimated from overhead and ground imagery of a foundry layout and are flagged
uncertain.
