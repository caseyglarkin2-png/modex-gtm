# Ford - Sterling Axle Plant, Sterling Heights MI — Deep Audit Dossier

**Roster idx:** 18
**Type:** Axle / Components Plant
**Resolved center:** 42.58358, -83.04497
**Confidence:** Medium

## Location resolution — CORRECTED

The roster address (29900 Mound Rd) and geocode (42.514132, -83.046583,
RANGE_INTERPOLATED) are **wrong** — they land on an office/tech campus roughly
3.5 km south of the actual plant. Web research (Ford Authority, Waze,
CommercialCafe) established the correct address as **39000 Mound Rd, Sterling
Heights, MI 48310**. The exact coordinates 42.583580, -83.044966 were obtained
from the US EPA Superfund site profile for the Ford Motor Company Sterling
Axle Plant, and verified by satellite as the large multi-roof Ford plant
building bounded by Mound Rd on the west.

The Sterling Axle Plant has operated under Ford since 1956, employs ~2,295,
and produces rear axles for the F-150, Super Duty, Expedition, Navigator,
Mustang and Transit.

## Key views

- **z15/z16 context** — a large interconnected multi-roof plant in industrial
  Sterling Heights, Mound Rd on the west, rail lines/rail yard on the east,
  employee parking on the south.
- **z17/z18 plant views** — freight operations on the north/northeast:
  material laydown yards (stacked steel, racks) and a trailer drop yard, with a
  rail spur running into the property from the east rail yard.
- **NW drop yard (z19)** — many trailers parked in rows (~15-20) amid material
  laydown; dock doors along the adjacent building face.
- **Street View on Mound Rd (2025)** — chain-link perimeter fencing the full
  frontage; at the NW corner, a wide gated truck entrance with a tractor
  pulling an intermodal container seen exiting through a sliding-gate opening,
  trailers parked inside, dock doors on the building.

## Gate / guard-shack / dock determinations

- **Truck gate: true (confirmed).** Street View at the NW corner directly shows
  a controlled chain-link sliding-gate truck entrance with a tractor exiting
  through it; trailers and dock doors visible inside. Chain-link perimeter
  fencing runs the full Mound Rd frontage. truckGateCount 1.
- **Guard shack: true (medium confidence).** A fenced ~2,295-employee active
  Ford plant of this scale conventionally runs a staffed gatehouse. A small
  structure is visible beside the NW truck gate but a clear guard booth could
  not be positively confirmed — the gate may be badge/remote-controlled.
  Flagged uncertain along with remoteGs.
- **Pre-gate staging: false (uncertain).** The NW truck gate opens more or less
  directly into the drop yard / dock area; no clear dedicated pre-gate staging
  apron identified — flagged uncertain.
- **Dock doors: 10-25.** Estimated along the NE/E building faces serving the
  drop yard; exact count obscured by roof angle.
- **Ship/Rcv separate: false (medium confidence).** Freight concentrated on the
  N/NE side; no clearly separate second dock bank confirmed — flagged
  uncertain.

## Yard zones and counts

- **Perimeter:** the fenced plant property, ~162 acres.
- **Drop yard:** NW/N trailer lot, ~15-20 trailers amid material laydown;
  banded 10-25. dropYard true.
- **Dock apron:** strip along the NE/E building faces.
- **Staging:** internal yard between the NW gate and the dock doors.
- **Buildings:** 1 (single large interconnected multi-roof plant).
- **Rail:** a rail spur runs into the property from the east rail yard serving
  the N/NE material area — railServed true.

## Web findings

- Ford Sterling Axle Plant, 39000 Mound Rd, Sterling Heights MI 48310.
- Operating under Ford since 1956; ~2,295 employees.
- Produces rear axles for F-150, Super Duty, Expedition, Navigator, Mustang,
  Transit. Sterling Heights Assembly (Stellantis) is ~1 mile SE.

## Final confidence

**Medium.** The facility was mislocated in the roster but is now positively
identified via the EPA Superfund record and verified by satellite; the truck
gate is directly confirmed by Street View showing a truck exiting through it.
Guard-shack presence, lane counts, dock-door count, pre-gate staging, and
ship/receive separation are inferred or estimated and flagged uncertain.
