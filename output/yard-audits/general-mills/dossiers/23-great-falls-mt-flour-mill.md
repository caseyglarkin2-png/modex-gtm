# Deep-Audit Dossier — General Mills, Great Falls MT Flour Mill (idx 23)

## Location resolution
- Roster address: 2500 9th Ave N, Great Falls, MT 59401 (Flour Mill).
- Roster geocode moved 49 m (ROOFTOP) and resolved correctly onto the mill.
  Locked center ~47.5152, -111.2616.
- Web search confirms an active General Mills flour mill / grain elevator at
  this address (Montana Chamber grain-elevator membership, CMac grain-elevator
  directory). A "General Mills" sign is visible on the building in Street
  View. This remains a current General Mills facility.

## Key views
- Wide satellite (z17/z18): a long E-W industrial complex along a rail
  corridor — tall grain-elevator silos on the W, processing/mill buildings in
  the center, a long warehouse on the E. 9th Ave N runs along the N; a dense
  residential grid lies to the S.
- Rail (Street View, 2021-10): covered hopper railcars sit on sidings right
  against the mill and warehouse — the dominant freight mode.
- Mill / warehouse faces (z19/z20): a flour-truck loadout near the silos and a
  modest dock canopy on the warehouse S face; only 1-2 trailers in the yard.
- Street View along 9th Ave N: chain-link perimeter fencing across the
  property frontage; the "General Mills" building visible behind it.

## Gate / guard-shack / dock determinations
- **truckGate = true** (uncertain). Chain-link perimeter fencing runs across
  the frontage; truck access is via gates in that fence off the gravel
  rail-side service road / 9th Ave N. No barrier arm crisply visible — call
  rests on fenced-perimeter-with-gated-access; flagged uncertain.
- **guardShack = false.** No staffed guard booth visible at the gates.
- **remoteGs = true.** Gate present, no guard shack.
- **dockDoors = 0-10.** Truck operations are secondary — a flour-truck loadout
  and a small dock canopy on the warehouse S face. Most loading is into
  railcars.
- **dropArea = NONE / dropYard = false.** No dedicated trailer drop yard.
- **scale = true** (low confidence). Grain mills routinely weigh inbound/
  outbound trucks; a scale is highly likely near the loadout but could not be
  isolated in overhead imagery — flagged uncertain.

## Yard zones and counts
- `perimeter`: the mill complex, ~12 acres (~134 m N-S x ~338 m E-W) wedged
  between 9th Ave N and the rail corridor.
- `truckGate`: gated entrance area off the service road / 9th Ave N.
- `dropYards`: [] — none.
- `dockAprons`: one box — warehouse S-face dock canopy.
- `staging`: null.
- Metrics: ~6 truck dock doors, ~2 trailers visible, ~8 trailer capacity, 1
  truck gate, 3 buildings (one campus), ~12 acres, rail-served.

## Web findings
- Montana Chamber / CMac grain-elevator directories list a General Mills
  grain-elevator / flour-mill operation at 2500 9th Ave N; phone
  (406) 727-5500; ~50-99 employees.

## Setting
Urban — within the city of Great Falls, residential blocks to the S,
commercial/industrial to the N. connectivityIssue = false.

## Final confidence: MEDIUM
Mill positively identified and confirmed as an active General Mills facility.
Confidence held to medium because this is a rail-dominant flour mill with
minimal truck-yard infrastructure — the truck-dock count, the gate/barrier
detail, and the truck scale are all estimates from imagery rather than crisp
observations.
