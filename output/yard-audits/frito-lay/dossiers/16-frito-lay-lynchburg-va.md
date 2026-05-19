# Deep-Audit Dossier — Frito-Lay Lynchburg VA (idx 16)

## Location resolution
- Roster supplied `4500 Murray Pl, Lynchburg, VA` at `37.371152, -79.170245`. **That address is wrong** — satellite probe there showed an unrelated industrial cluster, not a Frito-Lay plant.
- Web search (VEDP press release, Roanoke Times archive, Waze, Yelp, PotatoPro) places the Frito-Lay Lynchburg manufacturing/distribution plant at **230 Jefferson Ridge Pkwy, Lynchburg, VA 24501**.
- Probed `37.40036, -79.238328` and confirmed a large L-shaped manufacturing/distribution building with a major truck yard, long dock banks, and extensive trailer parking — consistent with the $150M, 800-job FLNA plant (produces Lay's, Ruffles, Doritos, Cheetos, Tostitos).
- **Locked center: 37.40036, -79.238328.**

## Key views
- z16/z17 overview: L-shaped main building on a wooded hilltop, fan-out drop-yard lot at the north end with a small satellite building, linear trailer rows down the east side, dock activity on south/southeast faces.
- z18/z19 yard: 40+ trailer drop rows on the east edge; large fan-out drop lot at north; trailers backed into long dock banks.
- z19/z20 entrance: the truck driveway meets Jefferson Ridge Pkwy as a wide open paved apron.

## Gate / guard-shack / dock determinations
- **truckGate: false.** At z19/z20 the truck driveway connects to the public parkway as a broad open apron — no barrier arm, no sliding/swing gate, no checkpoint pinch-point. Open ingress.
- **guardShack: false.** No booth at the entrance or inside the yard. A mid-yard cluster initially read as a possible structure resolved to parked tractors at z20. Flagged uncertain only because Street View on the private parkway is partial; satellite is clear.
- **remoteGs: false** — no gate at all.
- **dockDoors: 50+.** Long dock bank down the east building face plus a south/southeast bank; ~70 doors estimated.
- **dropArea: 50+ / dropYard: true.** Two dedicated drop-trailer fields — a north fan-out lot and east linear rows — well over 50 stalls.
- **shipRcvSeparate: true** — docks on physically distinct building faces.

## Yard zones & counts
- `perimeter`: full wooded hilltop property, ~45 acres effective.
- `truckGate` zone: open driveway apron at the parkway connection (no structure).
- `dropYards`: north fan-out lot + east linear rows.
- `dockAprons`: east dock apron and south/southeast dock apron.
- `staging`: none distinct (postGateStaging satisfied by the broad open yard between drive and docks).
- Metrics: ~70 dock doors, ~110 trailers visible, ~140 trailer capacity, 1 truck gate, 2 buildings, ~45 acres, not rail-served.

## Web findings
- Plant opened ~1998–99, $150M investment, up to 800 jobs; later $30M expansion. Fries/packages chips for national distribution. Jan 2024 machinery fire (extinguished). No public detail on gate security.

## Confidence
**High.** Facility positively re-identified; layout and open-entrance call are clear from z19/z20 satellite. `guardShack` and `multipleFacilities` listed uncertain due to partial Street View coverage and the ambiguous north satellite building (single campus).
