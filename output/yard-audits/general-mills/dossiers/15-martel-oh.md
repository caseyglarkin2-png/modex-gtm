# Deep-Audit Dossier — General Mills, Martel OH (idx 15)

## Location resolution
- Roster address: 4136 Main Street, Martel, OH 43335 (Manufacturing Plant).
- Roster geocode moved 22,774 m. That large move was correct: the city-level
  coordinate was far off and the geocoder snapped to the real industrial plant.
  Confirmed center ~40.6716, -82.9086.
- Web search corroborates: the Martel bakery-mix plant sits at 4136 Martel Rd,
  Caledonia/Martel OH. **Ownership note:** General Mills owned this plant
  2001-2016, then sold it to The Mennel Milling Company in 2016. Current gate
  signage reads "Mennel." The roster's "Hyster GM plant list" source is stale.
  The physical building audited here is the correct site the roster intended.

## Key views
- Wide satellite (z17/z18): one very large industrial building running NE-SW,
  employee parking on the W side along Main St, a multi-track rail corridor on
  the SE side with rail cars against the building, open paved yard on the NE.
- Street View, Main St facing E (2023-09): a chain-link gate where the truck
  driveway meets Main St, with a yellow bollard. Perimeter chain-link fencing
  runs along the frontage and around the parking lots. A "Mennel" sign sits at
  the entrance.
- NE satellite (z19): a marked trailer drop area with ~8-10 parked trailers.
- NW dock face (z20): ~6-8 trailers backed into dock doors along the NW wall.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled chain-link swing/sliding gate at the truck
  driveway / Main St junction; perimeter fence around the site.
- **guardShack = false.** No staffed booth visible at or beside the gate in any
  Street View heading. The gate is an unstaffed fenced opening.
- **remoteGs = true.** Gate present, no guard shack → kiosk / call-box / app
  check-in implied.
- **dockDoors = 10-25.** NW face shows 6-8 occupied doors; more on the SW/rail
  side. Exact count uncertain from overhead imagery.
- **dropArea = 10-25 / dropYard = true.** Dedicated trailer drop area in the NE
  corner holding ~8-10 trailers.

## Yard zones and counts
- `perimeter`: whole fenced property, ~30 acres (irregular diagonal footprint;
  ~478 m N-S x ~295 m E-W gross).
- `truckGate`: gate area where the driveway meets Main St.
- `dropYards`: one box — NE-corner trailer drop area.
- `dockAprons`: one box — NW dock face apron.
- `staging`: null (no distinct pre/post-gate stall area; internal yard is
  generous open pavement, captured as postGateStaging).
- Metrics: ~16 dock doors, ~18 trailers visible, ~30 trailer capacity, 1 truck
  gate, 3 buildings, ~30 acres, rail-served.

## Web findings
- Mennel Milling, "Highlights History of Martel Bakery Mix Facility": plant
  opened 1962, acquired by General Mills 2001, sold to Mennel 2016.
- Operates as a bakery-mix / milling facility; rail corridor supports inbound
  grain/flour movement.

## Setting
Rural — Martel is a tiny unincorporated community surrounded by farmland;
classified Rural. Utility lines and an active rail corridor pass the site, so
cellular coverage is likely adequate (connectivityIssue = false, low confidence).

## Final confidence: HIGH
Building positively identified; gate and fence clearly visible in Street View.
Uncertain: exact dock-door count, connectivityIssue inference.
