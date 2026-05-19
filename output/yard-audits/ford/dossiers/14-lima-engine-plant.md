# Ford - Lima Engine Plant, Lima OH — Deep Audit Dossier

**Roster idx:** 14
**Type:** Engine Plant
**Resolved center:** 40.77750, -84.08600
**Confidence:** Medium

## Location resolution

The roster geocode (40.777522, -84.086641) lands directly on a large
multi-roof industrial plant building. Satellite confirmed this is the Ford
Lima Engine Plant at 1155 Bible Rd, Lima (Allen County) OH — an active Ford
powertrain plant producing V6/V8 engines with ~1,500+ employees. The plant
sits on the semi-rural northeast edge of Lima, surrounded by farmland and
woods, with rail lines along the west and east sides and Bible Rd along the
south. No coordinate correction needed.

## Key views

- **z15/z16 context** — confirmed the single large interconnected plant
  building on the edge of town, rail corridors on both flanks, employee
  parking to the south.
- **z17/z18 overview** — the main freight operation (docks and trailer drop
  yard) is on the north side; employee parking lots ring the south and
  southeast; process/wastewater-treatment infrastructure on the north-center.
- **North drop yard (z18/z19)** — many trailers parked in rows, estimated
  25-40 trailers; dock doors along the building's north face.
- **Street View along Bible Rd (2024-08)** — chain-link perimeter fencing the
  full frontage; a wide paved entry apron with a marked **"TRUCK ENTRANCE"**
  sign on the fence (~40.7743, -84.0820); separate employee-lot gates.

## Gate / guard-shack / dock determinations

- **Truck gate: true (confirmed).** Street View shows an explicit "TRUCK
  ENTRANCE" sign on the chain-link perimeter fence at a wide paved entry apron
  off Bible Rd. The property is fully fenced; trucks enter through this
  controlled point and proceed up a deep approach to the north dock yard.
- **Guard shack: true (medium confidence).** A fenced ~1,500-employee active
  Ford engine plant of this scale conventionally runs a staffed gatehouse, and
  the truck entrance is a controlled fenced checkpoint. A booth structure could
  not be positively resolved at Street-View distance — flagged uncertain.
  remoteGs false as a consequence.
- **Pre-gate staging: true.** The truck entrance opens onto a large, deep paved
  apron well outside the building — clear truck staging room.
- **Driveway long: true.** The approach from the Bible Rd truck entrance to the
  north dock yard is long and deep — room for 3+ trucks to queue.
- **Dock doors: 10-25.** Estimated along the north building face; exact count
  partly obscured by roof angle — flagged uncertain.
- **Ship/Rcv separate: false (medium confidence).** Freight is concentrated in
  one north-side dock+drop-yard cluster; no clearly separate second dock bank
  confirmed — flagged uncertain.

## Yard zones and counts

- **Perimeter:** the fenced plant property, ~219 acres.
- **Drop yard:** north-side trailer lot, banded 25-50 (~30 trailers visible,
  capacity ~50). dropYard true.
- **Dock apron:** strip in front of the north dock bank.
- **Staging:** the pre-gate paved apron off Bible Rd at the truck entrance.
- **Buildings:** 1 (single large interconnected multi-roof plant).
- **Rail:** rail lines run along both the west and east property edges with
  spurs toward the plant — railServed true.

## Web findings

The Lima Engine Plant is one of Ford's North American powertrain plants
(Wikipedia List of Ford factories; dossier). It produces V-engine families and
employs roughly 1,500+. No conflicting location data found.

## Final confidence

**Medium.** The facility is positively identified and the truck gate is
directly confirmed by an explicit Street-View "TRUCK ENTRANCE" sign. Guard
shack, exact dock-door count, lane counts, and ship/receive separation are
inferred or estimated from imagery and flagged uncertain.
