# Pactiv Evergreen — Corsicana TX Plant (idx 07)

**Type:** Manufacturing Plant (Foodservice — cups, lids, to-go containers, breakfast trays)
**Resolved center:** 32.0987, -96.4206
**Address:** 4501 E. Business State Highway 31, Corsicana, TX 75109
**Confidence:** medium

## Location resolution

The roster geocode (32.075885, -96.397359) was **wrong**. It carried
`RANGE_INTERPOLATED` precision and landed ~5 km southeast of the city in open
woodland/farmland along the SH-31 *bypass*. Satellite probes at z14-z17 and a
Street View pull (captured 2024-02) of that point show nothing but rural
divided highway — no building of any kind.

The plant address is **4501 E. Business State Highway 31** — the Business
route through Corsicana, not the bypass. Working the SH-31 corridor on the
east side of town, the Pactiv plant was positively identified at
**32.0987, -96.4206**, on the north side of the E State Highway 31 service
road. Identification basis:

- A long L-shaped white metal **manufacturing building** with a row of
  **resin storage silos** along the highway frontage — silos are diagnostic of
  a plastics / thermoforming plant (Pactiv Corsicana makes plastic cups, lids,
  to-go containers and breakfast trays; ~500 employees; built ~1999 — Corsicana
  Daily Sun and Corsicana & Navarro County Chamber of Commerce).
- Confirmed in Street View 2024-02: the white plant building with silos along
  the frontage, a separate brick office building, employee parking, and a
  chain-link perimeter fence behind a tall highway hedge.
- An extensive trailer drop yard wrapping the west/southwest side.

> Note: the dense piping-and-tank complex immediately southwest of the Pactiv
> property is a **separate** legacy Corsicana oil/asphalt terminal — not part
> of this site. The Pactiv perimeter was drawn to exclude it.

## Key views

- **Satellite z16-z18 (north face):** L-shaped manufacturing building, resin
  silos along the SH-31 frontage, brick office at the NE, and a large paved
  yard to the south/southwest packed with parked trailers.
- **Satellite z18-z20 (trailer yard):** dozens of trailers in organized rows
  filling the west yard — a clear dedicated drop yard. Estimated 80-100 units.
- **Satellite z20 (entrance):** a single access driveway off the E SH-31
  service road at the NE corner; deep paved apron leading into the yard. No
  guard-booth structure resolvable.
- **Street View 2024-02 (SH-31 frontage):** the plant building and silos are
  visible over a continuous hedge; chain-link fencing runs the property line.
  The hedge obscures the entrance pinch-point itself.

## Gate / guard-shack determination

- **truckGate = true.** The property is fully enclosed by chain-link perimeter
  fence; a single driveway connects the yard to the public service road at a
  controlled pinch-point.
- **guardShack = false / remoteGs = true.** No staffed booth is visible at the
  entrance in any satellite view. The entrance is a fenced driveway opening
  consistent with kiosk / call-box / unmanned check-in. Because the highway
  hedge blocks the Street View of the entrance itself, a small booth cannot be
  100% excluded — `guardShack`, `remoteGs` are flagged uncertain. Best read is
  remote/unmanned gate.

## Yard zones and counts

- **Perimeter:** ~28 acres, fenced, excludes the neighboring oil terminal.
- **Drop yard:** large dedicated trailer-storage lot on the west/southwest side
  — `dropArea` banded **50+** (≈80-100 trailers/units in rows).
- **Dock apron:** dock doors run along the south/southwest face facing the
  yard; estimated ~20-25 doors (`dockDoors` 10-25, low-confidence count due to
  roof shadow and trailer occlusion).
- **Driveway:** long deep entrance apron — holds a 3+ truck queue
  (`drivewayLong`).
- **fastLaneOpportunity = true** — wide unfenced paved aprons at the entrance
  and inside the yard.
- **railServed = false** — no rail spur enters the Pactiv property (the rail
  line in the area serves the adjacent terminal).

## Web findings

Confirmed as an active Pactiv/Novolex manufacturing plant: address 4501 E.
Business State Highway 31; ~500 employees; cups/lids/to-go containers; a 2021-22
TDLR renovation record describes a below-grade pit for "product grinding
equipment" (consistent with plastics regrind). Now operating under Novolex
post the April 2025 combination.

## Final confidence: medium

Location is positively resolved and the site type is unambiguous (plastics
plant with resin silos). Medium rather than high because the entrance gate /
guard-booth determination relies on satellite only — the SH-31 hedge prevents
a clean Street View of the gate — and the dock-door count is an estimate.
