# Ford - Rawsonville Components Plant, Ypsilanti MI — Deep Audit

## Resolved location
- **Roster coords (42.20279, -83.581749) were wrong** — they landed in a residential
  neighborhood on Textile Rd ~2 km west of the plant. Roster address (9000 Textile Rd)
  is also off; the correct address is **10300 Textile Rd, Ypsilanti Twp, MI 48197**.
- Probed east along Textile Rd and found the large industrial complex on the south
  side of Textile Rd between the road and Ford Lake.
- **Locked center: 42.19920, -83.55700** — the ~1.7M sq ft Rawsonville plant building.
- Confirmed via web research: Ford Rawsonville Components Plant, ~650 employees,
  produces transmission oil pumps, hybrid/PHEV battery packs, air induction systems,
  ignition coils, fuel pumps. Operating since 1956.

## Key views
- **Wide satellite (z16):** One enormous sprawling building footprint (with a smaller
  attached/adjacent structure on the NE), large employee parking lots on the east,
  truck/dock operations on the SW and SE, Ford Lake along the west edge, farmland south.
- **North side (z18):** Main office/visitor entrance off Textile Rd — flagpoles,
  landscaped lawn. Not a truck entrance.
- **SW dock area (z18-19):** Rows of parked trailers (white and blue-roof), trailer
  parking stalls, and dock doors along the SW building face.
- **SE area (z19):** A second truck/staging cluster with parked trailers — distinct
  from the SW docks.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A continuous chain-link perimeter fence rings the property
  (confirmed full east side and SW in Street View). The SW truck-yard entrance has a
  closed double-swing chain-link gate (2025 SV); the NE has a rolling chain-link gate
  (2024 SV). Controlled entries.
- **guardShack = false.** No staffed booth at any gate — gates are plain chain-link
  with no 1-3-vehicle booth structure beside the lane in any Street View.
- **remoteGs = true.** Gates present but unmanned — kiosk / badge / app check-in implied.
- **dockDoors = "25-50".** Dock doors on the SW face plus a second bank on the SE face;
  ~35 estimated across the site.
- **shipRcvSeparate = true.** Two physically separate dock clusters (SW and SE faces).
- **dropYard = true.** Dedicated trailer-storage rows on the SW yard, ~30 trailers
  visible, capacity ~70.

## Yard zones / counts
- Perimeter: ~145 acres inside the fence line.
- Two drop-yard boxes (SW dock yard, SE staging), two dock-apron strips, one post-gate
  staging area.
- Buildings: 2 (main plant + smaller NE attached structure).
- Rail: no spur visible — not rail-served.

## Web findings
- 1.7M sq ft, ~650 employees; one of Ford's oldest plants (since 1956); $160M EV-era
  reinvestment for battery-pack work. No rail infrastructure noted.

## Confidence: HIGH
Facility positively identified and imagery clear. Dock-door and trailer-capacity
counts are honest overhead estimates (flagged in uncertainFields).
