# Deep-Audit Dossier — Memphis Parts Distribution Center, Memphis TN

**Account:** Daimler Truck North America · **Roster idx:** 13
**Type:** Parts distribution center
**Method:** deep-audit · **Confidence:** medium

## Resolved location

- **Address:** 5745 Challenge Drive, Memphis, TN 38115
- **Locked center:** 35.037650, -89.874050
- **Maps:** https://www.google.com/maps/@35.037650,-89.874050,400m/data=!3m1!1e3

The roster geocode (35.037713, -89.873982) moved 3,427 m before landing in the
MDC (Memphis Distribution Center) industrial park in the Hickory Hill area of
Memphis. Web research (Daimler careers location page, LoopNet parcel APN
09-3400-0-0603, multiple business listings) confirms DTNA's Memphis PDC is at
5745 Challenge Drive in this park. The Memphis PDC serves regional Freightliner
/ Western Star / Thomas Built Buses dealers and is DTNA's national distribution
center for chassis parts.

**Caveat:** MDC is a large multi-tenant industrial park (5625 = Building K /
592,766 sq ft; 5750 = Building J / 420,000 sq ft; Cummins at 5800). DTNA leases
the 5745 suite. The audited building is the warehouse the corrected pin sits
on, but the exact DTNA tenant footprint and its dock allocation cannot be
isolated from satellite imagery — hence medium confidence and several flagged
fields.

## Key views

- **Wide (z15-z16):** A dense grid of long distribution warehouses in the
  Hickory Hill industrial district; residential subdivisions to the north and
  south, Raines Road forming the south boundary.
- **Pin building (z17-z18):** A long N-S warehouse, white roof, with dock faces
  on the east long side and the north end. Truck courts on both of those faces
  are packed with trailers. Car parking and landscaped grass with a retention
  pond at the south end facing Raines Road.
- **East dock corridor (z19):** Continuous dock-door rhythm the full length of
  the east face; trailers backed into docks plus a dense second row of parked
  trailers in the shared truck court between this building and the next.
- **Street View (2025):** Raines Road frontage (south) is set-back grass and
  trees — the office/car-park side. The north road shows neighboring buildings'
  dock faces with mixed-tenant trailers (FedEx etc.). The south-end car parking
  lot has a chain-link fence with an open vehicle gate (car-park security only).

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE.** No barrier arm, sliding/swing gate, or guarded
  checkpoint on the truck side. The dock corridors are open internal MDC park
  roads. The only fence found rings the south-end CAR parking lot — car-park
  perimeter security, not a truck gate.
- **Guard shack: FALSE.** No booth structure at any truck driveway or dock
  corridor. A green box near the SW corner is a utility transformer.
- **Remote GS: FALSE.** No gate exists.
- **Dock doors: 50+ band.** Continuous door rhythm along the entire east long
  face plus the north end of a long warehouse — well over 50 doors (estimate
  ~60). Count flagged uncertain due to the multi-tenant building.
- **Drop area: 50+ band, dropYard TRUE.** East and north truck courts densely
  packed with parked trailers (50+) in addition to trailers in the docks.

## Yard zones and counts

- **Perimeter:** the audited warehouse and its truck courts, ~24 acres
  (approximate; multi-tenant boundaries flagged uncertain).
- **Truck gate zone:** best-effort box on the north-end dock-corridor access.
- **Drop yard:** the parked-trailer rows in the east truck court.
- **Dock aprons:** two — the east long face and the north end.
- **Staging:** none distinctly identified (null).
- **Metrics:** ~60 dock doors; ~70 trailers visible; ~90 trailer capacity;
  1 truck gate access; 1 building (in a multi-building park); ~24 acres; not
  rail-served.

## Web findings

- Daimler careers / DTNA locations: Memphis PDC at 5745 Challenge Drive,
  national distribution center for chassis parts, serving Freightliner /
  Western Star / Thomas Built Buses dealers.
- LoopNet / CBRE / CommercialCafe: MDC park context — Building K (5625,
  592,766 sf, built 1998), Building J (5750, 420,000 sf, 1997/2009), Cummins at
  5800; the park has easy access to Hwy-385/85, ~3 mi from the BNSF depot.

## Final confidence

**Medium.** The facility and address are confirmed and the audited building is
correctly identified within the MDC park, but because the park is multi-tenant
the precise DTNA suite footprint, exact dock count, trailer counts, building
count and site area are honest overhead estimates rather than firm figures —
all flagged in uncertainFields. The gate / guard-shack call (open, no gate) is
clear and high-confidence.
