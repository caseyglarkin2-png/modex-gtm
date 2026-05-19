# Deep-Audit Dossier — Anheuser-Busch Brewery, Fairfield CA (idx 10)

## Resolved location
- **Facility:** Anheuser-Busch Fairfield Brewery, 3101 Busch Dr, Fairfield, CA 94534
- **Locked center:** 38.23550, -122.09050 (main brewhouse / warehouse mass)
- Roster coords (38.236267, -122.093114) were ~3.5 km off (`movedMeters` 3470) but still landed near the campus.
- Confirmed by **"THANK YOU TEAM TRAVIS"** painted on the warehouse roof (Travis AFB is nearby) and the unmistakable brewing complex layout — brewhouse, tank farm, rail yard, trailer parking rows.

## Operating status — IMPORTANT
This brewery **permanently closed on Feb 22, 2026** as part of an AB national production realignment (238 positions cut; production shifted to other US plants). The site is being sold. This audit reflects the **physical yard infrastructure** as captured in pre-closure satellite imagery; the facility is **no longer operating**. (Fox40, CBS Sacramento, The Manufacturer, Feb 2026.)

## Key views
- **z15 wide:** Large campus between I-80 (N) and farmland (W), with industrial/distribution development to the E and S.
- **z17 center:** Brewhouse with tank farm, large packaging warehouse, trailer parking rows, and a multi-track rail yard on the S edge.
- **z18-19 N face:** Canopied dock banks with trailers backed in along the building's N face.
- **z18 SW:** A large ground-mounted solar farm and rail spurs curving into the property.
- **z19-20 N access:** Private access road descends ~600 m from the I-80 frontage road through an open grass buffer to the campus; Street View has only interior tap-room panos — no perimeter ground coverage.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence).** A controlled private access road crosses an open grass buffer into a fenced industrial campus; gate-controlled approach. The exact gate structure could not be positively confirmed from imagery — flagged uncertain.
- **guardShack = true (medium confidence).** A guarded entry is standard for an AB brewery of this scale and a small structure sits near the entrance node, but it could not be positively confirmed at z20. Flagged uncertain.
- **remoteGs = false.**
- **dockDoors = 25-50** (~40 est.) — canopied dock banks on the N warehouse face plus a secondary cluster.
- **scale = true (medium confidence)** — a scale-house-sized structure on the truck route near the trailer yard.

## Yard zones and counts
- **Perimeter:** ~75 acres, S 38.23200 / W -122.09650 / N 38.23870 / E -122.08650.
- **Drop yards:** trailer parking rows N of the building, ~70 trailers visible, capacity ~130 — `dropYard = true`, `dropArea = 25-50`.
- **Dock aprons:** N warehouse face and a secondary dock bank.
- **Staging:** post-gate paved area inside the campus.
- **Buildings:** 6 — brewhouse/tank farm, packaging warehouse, ancillary structures, separate office building, plus the SW solar farm — `multipleFacilities = true`.
- **Rail:** multi-track rail yard with sidings into the property — `railServed = true`.

## Web findings
Brewery opened 1976; closed Feb 22, 2026. No longer operational; site for sale. Confirmed across multiple news sources.

## Final confidence: MEDIUM
Identity and overall layout clear, but the truck gate / guard shack could not be ground-confirmed (no perimeter Street View; private access through a grass buffer), and the facility is now closed. Gate, guard shack, scale, lane counts and dock-door count are all flagged uncertain.
