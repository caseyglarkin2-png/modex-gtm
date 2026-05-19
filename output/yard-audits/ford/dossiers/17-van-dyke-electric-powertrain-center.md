# Ford - Van Dyke Electric Powertrain Center, Sterling Heights MI — Deep Audit Dossier

**Roster idx:** 17
**Type:** Powertrain / Transmission Plant
**Resolved center:** 42.59780, -83.03550
**Confidence:** Medium

## Location resolution — CORRECTED

The roster address (8000 Van Dyke Ave) and geocode (42.389201, -83.022218,
RANGE_INTERPOLATED) are **wrong** — they land in a residential Detroit
neighborhood roughly 23 km south of the actual plant. The wide z14 view at the
roster point showed only houses, with a large industrial building visible far
to the NW.

Web research (Detroit News, Ford Authority, AmericanAutoWorker, Yelp) confirmed
the correct address: **41111 Van Dyke Ave, Sterling Heights, MI 48314**, just
north of 18 Mile Road. I corrected the center to ~42.5978, -83.0355 and
verified by satellite that it is the large multi-roof Ford plant building. The
Van Dyke Electric Powertrain Center is a ~2M sq ft plant operating since 1968;
it was renamed in 2021 from the Van Dyke Transmission Plant as it shifted to
producing electric motors and transaxles for hybrid/EV vehicles (including the
F-150 Lightning).

## Key views

- **z16/z17 plant views** — a single large rectangular multi-roof plant
  building, employee parking lots ringing the north and east, a detached office
  building on the SE, bordered by Van Dyke Ave (M-53) on the east and 18 Mile
  Rd on the south.
- **West side (z18/z19)** — a material/dock laydown yard with stacked steel
  racks and returnable containers, dock doors along the west building face,
  rail lines running along the west property edge.
- **South side** — utility/process equipment (tanks, substation).
- **Street View (2025-03)** — chain-link perimeter fencing along 18 Mile Rd and
  the north road; the SW building face shows dock doors with trailers backed
  in; a closed chain-link sliding gate with a gate-number sign sits across a
  wide driveway on the north road serving the west dock yard.

## Gate / guard-shack / dock determinations

- **Truck gate: true (confirmed).** Street View shows a chain-link sliding
  truck/vehicle gate (closed, gate-number sign) across a wide driveway on the
  north road, leading down an internal access drive to the west dock yard. The
  property is fully fenced. truckGateCount estimated 2 (north employee/vehicle
  entrance plus the gated truck drive) — flagged uncertain.
- **Guard shack: true (medium confidence).** A fenced ~2M sq ft active Ford
  powertrain plant of this scale conventionally runs a staffed gatehouse. No
  booth was positively resolved at the NW truck gate, which appears
  badge/remote-style — flagged uncertain along with remoteGs.
- **Pre-gate staging: true.** The NW truck gate opens onto a long, wide internal
  access drive with ample paved staging room.
- **Driveway long: true.** The gate-to-dock access drive is long and deep —
  room for 3+ trucks.
- **Dock doors: 10-25.** Estimated along the west building face; a dock bank
  with trailers is visible. Exact count obscured by roof angle.
- **Ship/Rcv separate: false (medium confidence).** Freight concentrated in one
  west-side dock + drop-yard cluster — flagged uncertain.

## Yard zones and counts

- **Perimeter:** the fenced plant property, ~166 acres.
- **Drop yard:** west-side material/dock yard, ~10-20 trailers amid a stacked
  laydown area; banded 10-25. dropYard true.
- **Dock apron:** strip along the west building face.
- **Staging:** the internal access drive between the NW gate and the dock yard.
- **Buildings:** 2 (single large interconnected plant plus detached SE office).
- **Rail:** rail lines along the west property edge with spurs into the west
  yard — railServed true.

## Web findings

- ~2M sq ft, operating since 1968, in Sterling Heights MI.
- Renamed 2021 (Van Dyke Transmission Plant → Van Dyke Electric Powertrain
  Center) to reflect the shift to EV motors/transaxles.
- Produces electric motors and transaxles for hybrid/EV vehicles, including the
  F-150 Lightning.

## Final confidence

**Medium.** The facility was mislocated in the roster but is now positively
identified and verified by satellite; the truck gate is directly confirmed by
Street View. Guard-shack presence, gate count, lane counts, dock-door count,
and ship/receive separation are inferred or estimated and flagged uncertain.
