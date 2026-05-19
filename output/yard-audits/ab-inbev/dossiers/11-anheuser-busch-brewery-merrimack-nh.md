# Deep-Audit Dossier — Anheuser-Busch Brewery, Merrimack NH (idx 11)

## Resolved location
- **Facility:** Anheuser-Busch Merrimack Brewery, 221 Daniel Webster Hwy, Merrimack, NH 03054
- **Locked center:** 42.82530, -71.48650 (main brewhouse / warehouse mass)
- Roster coords (42.823222, -71.484849) were ~3.2 km off (`movedMeters` 3205) but landed near the campus.
- Confirmed by the brewing complex layout (brewhouse, tank farm, 400,000+ sq ft processing facility) between the Everett Turnpike (W) and the Merrimack River (E), plus the on-site Budweiser Brewery Experience visitor center and Clydesdale Hamlet.

## Operating status — IMPORTANT
AB announced in **Dec 2025** that the Merrimack brewery will **close in early 2026** (same restructuring that closed Fairfield CA and Newark NJ; 125 jobs affected). The plant opened in 1970 — 55+ years of operation. As of the audit date (May 2026), the facility has very likely ceased brewing operations. This audit reflects the **physical yard infrastructure** from pre-closure imagery. (Union Leader, NHBR, Concord Monitor, CBS Boston, Dec 2025.)

## Key views
- **z15 wide:** Large campus on a wooded river-corridor site between the Everett Turnpike and the Merrimack River.
- **z17 center:** Brewhouse with tank farm, large packaging warehouse, trailer parking rows, rail siding.
- **z18 NW:** Large trailer parking yard on the N side full of trailers.
- **Street View W dock face (2018):** Dock doors with trailers backed in, chain-link perimeter fence — clearly a fenced truck yard.
- **z19-20 SW:** Visitor / employee parking entrances off Daniel Webster Hwy; a parking-booth-sized structure but no truck gate there.
- **z19 NE junction:** Internal truck-circulation node with a small median structure.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence).** Large fenced industrial facility — chain-link perimeter confirmed in Street View along the W dock face and Daniel Webster Hwy; controlled access road into a fenced truck yard. The exact gate structure could not be positively imaged.
- **guardShack = true (medium confidence).** Standard for an AB brewery of this scale; small structures sit at an internal truck-circulation node and near the W parking entrance, but the truck-gate guard booth could not be positively confirmed.
- **remoteGs = false.**
- **dockDoors = 25-50** (~35 est.) — W building face dock doors with backed-in trailers (clearly visible in Street View) plus a secondary cluster.
- **scale = false** — no truck scale identified (flagged uncertain).

## Yard zones and counts
- **Perimeter:** ~65 acres, S 42.82050 / W -71.48950 / N 42.82900 / E -71.48150.
- **Drop yards:** large trailer parking yard on the N side, ~90 trailers visible, capacity ~160 — `dropYard = true`, `dropArea = 50+`.
- **Dock aprons:** W building face and N/interior dock banks — `shipRcvSeparate = true`.
- **Staging:** post-gate paved area inside the campus.
- **Buildings:** 6 — brewhouse/tank farm, packaging warehouses, ancillary structures, visitor center, Clydesdale Hamlet — `multipleFacilities = true`.
- **Rail:** rail line runs to the brewery from the N — `railServed = true`.

## Web findings
Brewery opened 1970; closing early 2026. Confirmed across multiple New Hampshire news sources.

## Final confidence: MEDIUM
Identity and overall layout clear; chain-link perimeter and dock face confirmed by Street View. The exact truck gate / guard shack could not be ground-confirmed, and the facility is closing/closed. Gate, guard shack, scale, lane counts and dock-door count are flagged uncertain.
