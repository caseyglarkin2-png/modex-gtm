# Deep-Audit Dossier — Anheuser-Busch Brewery, Van Nuys / Los Angeles CA (idx 9)

## Resolved location
- **Facility:** Anheuser-Busch Los Angeles Brewery, 15800 Roscoe Blvd, Van Nuys, CA 91406
- **Locked center:** 34.21850, -118.47900 (main brewhouse / warehouse mass)
- Roster coords (34.220959, -118.476782) were rooftop-accurate (`movedMeters` 55) and fell on the NE part of the campus.
- Confirmed via satellite (large brewing complex with tank farm and solar-paneled warehouses) and Street View — the E street shows brewery storage tanks behind a hedge, and the Roscoe Blvd frontage carries a "Bud..." building sign.
- Industry sources: 95-acre site, 1.7M sq ft, ~12M barrels/yr, public tours offered. Active brewery.

## Key views
- **z16 wide:** Large industrial block bounded N by Roscoe Blvd, S by a multi-track rail corridor; dense San Fernando Valley industrial fabric all around.
- **z17 center:** Brewhouse with tank farm in the core, solar-paneled packaging warehouses, ancillary buildings.
- **z18-20 NE entrance:** Sliding security gate off Roscoe Blvd with a distinct rounded guard-booth structure on a paved island; vehicle parked beside it.
- **z18-20 dock zones:** Trailers backed into docks along internal building faces; trailer drop areas between buildings.
- **z18 NW across Roscoe:** A large detached trailer yard full of trailers — part of the brewery operation.
- **z20 rail side:** Multi-track rail line along the S/SE edge with rail siding into the property; trailers staged alongside.

## Gate / guard-shack / dock determinations
- **truckGate = true.** NE entrance off Roscoe Blvd has a sliding security gate with a wide multi-lane apron (Street View, 2025-10). A second gated truck entrance serves the SW/rail side — `truckGateCount = 2`.
- **guardShack = true.** Z20 satellite clearly shows a rounded guard-booth structure on a paved island at the NE gate with a parked vehicle; Street View confirms a small booth just inside the gate.
- **remoteGs = false.** Booth present.
- **backupSensitive = true.** Gate opens directly onto Roscoe Blvd, a busy multi-lane urban arterial, with minimal pre-gate stacking room.
- **entryExitTogether = true** — entry/exit share the NE gate apron.
- **dockDoors = 25-50** (~45 est.) — count partly obscured by rooftop solar.
- **scale = false** — no weigh pad identified (flagged uncertain).

## Yard zones and counts
- **Perimeter:** ~60 acres core campus, S 34.21500 / W -118.48280 / N 34.22100 / E -118.47600 (excludes the detached NW trailer yard).
- **Drop yards:** large trailer yards in the SW campus corner plus the detached lot across Roscoe Blvd — `dropYard = true`, `dropArea = 50+`, ~120 trailers visible.
- **Dock aprons:** multiple internal dock banks on different building faces — `shipRcvSeparate = true`.
- **Staging:** post-gate paved area inside the NE entrance.
- **Buildings:** 8+ — brewhouse/tank farm, packaging warehouses, ancillary structures, detached trailer yard — `multipleFacilities = true`.
- **Rail:** multi-track rail corridor with siding into the property — `railServed = true`.

## Web findings
Active major AB brewery in the San Fernando Valley; long-running tour site (Yelp, anheuser-busch.com, openbrewerydb, PCAD). No closure signals.

## Final confidence: HIGH
Identity, gate, guard shack, rail, and yard layout all clearly resolved. Dock-door count and lane counts are overhead estimates (rooftop solar obscures dock faces); `scale` not confirmed — all flagged.
