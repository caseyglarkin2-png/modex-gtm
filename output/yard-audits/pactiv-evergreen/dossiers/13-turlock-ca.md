# Pactiv Evergreen — Turlock, CA (idx 13)

**Address:** 1500 West Main Street, Turlock, CA 95380
**Type:** Manufacturing Plant (Beverage Merchandising; carton converting)
**Resolved coordinates:** 37.491536, -120.866032
**Confidence:** High

## Location confirmation

The roster coordinates landed squarely on the large grey-roofed industrial
building fronting West Main Street. Web research confirms 1500 W. Main St as
the Pactiv Evergreen (legacy Evergreen Packaging) Turlock beverage-carton
plant — open since **1957**, cutting ~30,000 tons of cardboard a year for
fiber-based liquid packaging (milk and juice cartons) serving 14 western
states, western Canada, Hawaii, and parts of Latin America. Now part of
Novolex. The red-roofed brick structure to the NE is an older
attached/adjacent section of the same complex.

## Site layout

- One very large multi-section manufacturing building, long axis running
  north-south, fronting West Main Street on the north.
- Employee parking on the west side, fenced, between the building's west face
  and the side street.
- The truck/dock yard runs along the building's **south face** — a row of dock
  doors opening onto a deep paved apron.
- A large partly-vacant lot sits south of the plant (legacy settling-pond
  ground in older imagery, now mostly unused open land).

## Gate / guard-shack determination

- **Truck gate: TRUE.** 2026-03 Street View (sv-gate2) shows a **chain-link
  sliding gate across the dock-apron drive** on the south side. The whole
  property is enclosed in chain-link fencing.
- **Guard shack: FALSE.** No booth structure of any kind sits beside the gate
  in any heading probed.
- **Remote GS: TRUE.** Gate present, no guard booth — check-in is remote /
  manual.

## Docks & yard

- A full row of dock doors along the building's south face — ~10-12 visible in
  Street View; banded **10-25** allowing for doors on the west/north faces not
  fully resolved. Flagged as an estimate.
- The dock apron is deep and open — comfortably holds a 3+ truck queue →
  `drivewayLong: true`. The paved area inside the gate before the docks serves
  as post-gate staging → `postGateStaging: true`.
- The dock apron plus the open vacant land to the south leave ample unused
  paved width → `fastLaneOpportunity: true`.
- ~8 trailers visible; capacity estimated ~25. No dedicated marked drop yard —
  `dropArea` "0-10", `dropYard` false.
- Single combined entry/exit gate; 1 inbound + 1 outbound lane.
- No truck scale, no second checkpoint, no separate ship/receive dock banks.

## Rail

**Rail-served: FALSE.** No rail spur visible entering the property.

## Setting

Urban — inside Turlock's developed city fabric, mixed industrial and
residential, fronting a main arterial. `urbanRural: Urban`,
`connectivityIssue: false`.

## Final confidence: HIGH

Facility positively identified by location and corroborating web research
(long-established Evergreen Packaging carton plant). Gate confirmed in recent
Street View. Dock-door count and trailer capacity are estimates from partial
imagery coverage.
