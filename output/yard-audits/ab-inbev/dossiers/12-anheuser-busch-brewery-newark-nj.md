# Deep-Audit Dossier — Anheuser-Busch Brewery, Newark NJ (idx 12)

## Resolved location
- **Facility:** Anheuser-Busch Newark Brewery, 200 US-1 (Route 1), Newark, NJ 07114
- **Locked center:** 40.69400, -74.19250 (main brewhouse / warehouse mass)
- Roster coords (40.694002, -74.191885) were ~2.4 km off (`movedMeters` 2445) but landed near the campus.
- Confirmed by the brewing complex (brick brewhouse, grain-silo tank farm), extensive trailer yards, and the 86-acre footprint on Route 1 between rail lines and Newark Liberty Airport — matching the property in the Goodman Group sale.

## Operating status — IMPORTANT
The Newark brewery (opened 1951 — AB's 2nd-oldest) **closed in early 2026** and the 86-acre site was **sold to Goodman Group for ~$360M** (deed filed March 2026). Goodman plans an industrial/logistics redevelopment. As of the audit date (May 2026), the facility is no longer operating as a brewery. This audit reflects the **physical yard infrastructure** from pre-closure imagery. (NJBIZ, CoStar, ROI-NJ, Fox Business, 2026.)

## Key views
- **z15 wide:** Large campus in dense Newark industrial fabric, adjacent to Newark Liberty Airport (SE), rail lines (W), and Route 1 / highway interchanges (E).
- **z17 center:** Brick brewhouse, grain-silo tank farm, packaging warehouses, trailers backed in along docks.
- **z18-19 N/NE:** Multiple very large trailer yards full of trailers (orange, blue, green, white) in marked rows.
- **Street View E access road (2025):** Brick brewery building face with chain-link perimeter fence and parking lots; "VISITOR PARKING" markings at the NE lot.
- **z18 W:** Grain silos and rail lines along the W edge with sidings into the property.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence).** Large fenced industrial campus — chain-link perimeter confirmed in Street View along the E building face; multiple controlled access points serve the truck yards. Exact gate structures could not be positively imaged.
- **guardShack = true (medium confidence).** Standard for an AB brewery of this scale/age; small structures sit near the trailer-yard entrances, but a truck-gate guard booth could not be positively confirmed.
- **remoteGs = false.**
- **entryExitSeparate = true** — distinct truck-yard entrances at different points (N trailer yard vs E access road).
- **dockDoors = 25-50** (~45 est.) — dock doors with backed-in trailers on multiple building faces.
- **scale = false** — no truck scale identified (flagged uncertain).

## Yard zones and counts
- **Perimeter:** ~86 acres (matches the recorded sale), S 40.69000 / W -74.19650 / N 40.69850 / E -74.18850.
- **Drop yards:** multiple very large trailer yards on the N and NE sides, ~150 trailers visible, capacity ~250 — `dropYard = true`, `dropArea = 50+`.
- **Dock aprons:** multiple banks on separate building faces — `shipRcvSeparate = true`.
- **Staging:** post-gate paved area inside the campus.
- **Buildings:** 7 — brewhouse/grain-silo tank farm, multiple packaging warehouses, ancillary structures — `multipleFacilities = true`.
- **Rail:** multiple rail lines along the W edge with sidings into the property — `railServed = true`.

## Web findings
Brewery opened 1951; closed early 2026; 86-acre site sold to Goodman Group for ~$360M for industrial/logistics redevelopment. Confirmed across multiple NJ business and real-estate news sources.

## Final confidence: MEDIUM
Identity, layout, rail, and yard scale clearly resolved; chain-link perimeter confirmed by Street View. The exact truck gates / guard shacks could not be ground-confirmed, and the facility is closed/sold. Gate, guard shack, scale, lane counts, gate count and dock-door count are flagged uncertain.
