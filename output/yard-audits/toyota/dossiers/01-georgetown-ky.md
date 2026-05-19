# TMMK — Toyota Motor Manufacturing Kentucky, Georgetown KY

**Idx 1 · Vehicle Assembly Plant · 1001 Cherry Blossom Way, Georgetown, KY 40324**
**Resolved center:** 38.262, -84.535 · [Maps](https://www.google.com/maps/@38.262,-84.535,400m/data=!3m1!1e3)

## Location resolution

The roster coordinate (38.257524, -84.547591) geocoded ~5.4 km off — it landed on
I-75 / open land on the SW edge of the property, confirmed by a satellite probe
showing only highway and trees. Recentering east on the white-roofed industrial
mass produced the real plant. Web research confirms TMMK at 1001 Cherry Blossom
Way, Georgetown KY — Toyota's largest plant globally (~7.5M sq ft under roof on a
~1,300-acre campus, producing Camry/Camry Hybrid/RAV4 Hybrid/Lexus ES). Locked
campus center at 38.262, -84.535.

## What the imagery showed

- **Wide (z14/z15):** A vast multi-building manufacturing campus bounded by I-75
  on the west, a private test track on the SW, and public roads on the south and
  east. Central assembly plant is a single contiguous white-roof footprint
  roughly 1 km long.
- **Inbound logistics (z17/z19, SE corner):** Two large logistics/cross-dock
  buildings with dock doors on all faces, fronted by enormous trailer parking
  lots. The z19 crop shows hundreds of trailers in dense parallel rows — one of
  the largest drop yards seen in this run.
- **Central plant docks (z18):** The assembly building has multiple internal
  dock courtyards and continuous dock banks along its faces.
- **Street View — perimeter:** Public-road panos along the south side show a
  continuous line of parked trailers behind a grassy berm inside the fence. A
  pano at a perimeter access drive shows chain-link perimeter fencing with a
  cantilever/swing gate across the drive. Internal-road panos (Google drove the
  campus near the visitor route) show plant buildings and gatehouse structures.

## Gate / guard determination

- **truckGate = true.** TMMK is a fully fenced, security-controlled campus.
  Toyota numbers its gates (the public visitor route is directed to "Gate 2").
  Perimeter fencing with a cantilever gate is visible in Street View. Truck
  entrances are controlled checkpoints.
- **guardShack = true.** Manned guard houses are standard at Toyota
  assembly-plant primary gates; small booth structures are visible near the
  entrance roundabouts. High confidence given facility type, fenced perimeter,
  and the numbered-gate system. `remoteGs = false`.
- **entryExitSeparate = true** — multiple distinct gates around the perimeter
  serve inbound vs. campus traffic.
- **multiStep = false** — no clear second post-gate checkpoint resolved from
  imagery; left false.

## Yard zones & counts

- **Perimeter:** core fenced developed campus, ~38.2475–38.2705 N / -84.5475 to
  -84.5265 E → ~1,050 acres of developed/fenced area (TMMK-owned land extends
  further with test track and retention zones).
- **Drop yards:** the SE inbound-logistics lots (largest), plus trailer rows
  flanking the central assembly plant. `dropArea = 50+`, `dropYard = true`.
- **Dock aprons:** logistics-building aprons + assembly-plant dock courtyards.
- **Dock doors:** 200+ across the campus — conservative estimate 220, `50+` band
  certain.
- **Trailers visible:** ~850 across the captured imagery; capacity ~1,100.
- **Buildings:** ~14 distinct large structures (assembly, 2 logistics/cross-dock,
  engine/powertrain shops, paint, utilities) → `multipleFacilities = true`.
- **Rail:** rail-served; rolling stock visible on campus.

## Web findings

Toyota newsroom and tour pages confirm TMMK as Toyota's largest plant worldwide,
~550,000 vehicles + 600,000 engines/yr, operating since 1988. Visitor directions
("I-75 exit 129, east on Cherry Blossom Way, enter Gate 2") confirm a numbered,
controlled-gate security system. This is the flagship TPS site in North America
and Chris Nielsen's career origin (he started here as a buyer).

## Confidence

**High.** Facility unambiguously identified; layout, gates, fencing, drop yards
and dock banks all corroborated by multi-zoom satellite and Street View. Exact
dock-door and lane counts are honest estimates from overhead imagery (flagged in
`uncertainFields`); the classification flags are well-supported.
