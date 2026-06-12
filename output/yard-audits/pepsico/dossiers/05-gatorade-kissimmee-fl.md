# 05 — Gatorade (SVC Manufacturing) — Kissimmee, FL

**Resolved location:** 1650 S Poinciana Blvd, Kissimmee FL 34758 — plant centered at **28.2578, -81.4888**. Roster rooftop geocode landed on the building; identity is beyond doubt.
**Maps:** https://www.google.com/maps/@28.2578,-81.4888,400m/data=!3m1!1e3

## Identity confirmation (Step 0)
- Street View from S Poinciana Blvd (2025-05) shows the **GATORADE sign on the facade and Gatorade-bottle sculptures** at the landscaped front entrance behind an ornamental steel fence. Done.

## Key views
- **z17 overview (tmp/p05-z17.png):** ~380 m long plant wedged between the CSX rail corridor + frontage road (north), S Poinciana Blvd (east) and US 17-92 (south/west); retention pond on the south edge.
- **z18 south docks (tmp/p05-dockS-z18.png):** recessed dock clusters on the south face (~15 doors) with staged pallets and a handful of trailers; big open concrete yard at the west end.
- **z18 west end (tmp/p05-west-z18.png):** ~10 west-facing dock bays; employee parking on the north side.
- **z19/z20 entrances (tmp/p05-entS-z19.png, p05-gate-z20.png):** the main blvd entrance is a divided landscaped drive splitting to visitor lot / employee lot / south dock route — **no barrier, no booth**. A second service access leaves the north frontage road at the NW corner.
- **SV north frontage road (tmp/p05-sv-3.png, 2024-11):** **rail siding running along the plant's north wall** (track in the grass between road and building, freight doors at grade) — the plant is rail-served.

## Determinations
- **Gate:** `truckGate: false` (flagged) — no control structure visible at either access at z19/z20 and SV; fencing is ornamental/perimeter only.
- **Guard shack:** `false`. `remoteGs: false`.
- **Docks:** band **25-50** (~28: south ~15, west ~10, tanker/rail positions east).
- **Drop yard:** `false`, dropArea **0-10** — only ~10 trailers on site; the west concrete yard is empty unmarked pavement (logged as post-gate staging space).
- **Rail:** `railServed: true` — siding along the north wall off the adjacent CSX line (SV-confirmed).
- **Layout:** entry/exit together at the signalized blvd entrance (1 lane each), long internal route to the south docks, not backup-sensitive. Urban corridor. Single building, no scale, no second checkpoint.

## Measurements
- Perimeter polygon (6 vertices following the rail corridor, blvd, and US 17-92 ROW) ≈ **24.3 acres**.

## Web corroboration
Roster sources (Osceola County $30M expansion release, SVC Manufacturing Inc.) consistent; signage makes identity certain.

**Final confidence: medium** — identity and rail call high; the no-gate call is flagged because a small swing-gate at the service entries would be below satellite resolution.
