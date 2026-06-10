# Deep-Audit Dossier — NFI Import Warehouse, Pooler GA (Site 11)

**Facility:** NFI Import Warehouse Pooler GA — Import / transload warehouse
**Address:** 1030 S H Morgan Parkway, Pooler, GA 31322
**Resolved center:** `32.10858, -81.27360`
**Confidence:** High
**Method:** deep-audit (satellite + 2025-12 Street View + web research)

---

## Location confirmation

The supplied coordinates `32.10851, -81.27399` geocode as a ROOFTOP match for
"1030 S H Morgan Pkwy, Pooler, GA 31322" and land squarely on a large Class A
distribution building — **Building I of the "95 Logistics @ Pooler Pkwy" park**.

Web research (Savannah Business Journal, REBusinessOnline, CBRE) confirms a
PCCP/NFI joint venture acquired two fully-leased industrial buildings totaling
565,000 SF at 1030–1240 S H Morgan Parkway, built 2019, within 12 mi of the
Garden City and Ocean terminals of the Port of Savannah and adjacent to
Savannah/Hilton Head Int'l Airport. **Building I (1030) is fully leased to the
NFI warehouse operating affiliate and has 54 dock doors, 95 trailer-parking
spaces and 108 car spaces.** The second building (1240) houses Store Supply
Warehouse / GCE International. This is the NFI import/transload warehouse named
in the roster.

The building under the pin is unambiguously the NFI one: its address "1030" is
painted on the south end wall, visible in 2025-12 Street View. Center refined
to `32.10858, -81.27360`. The building's long axis runs NW→SE (tilted ~20–25°
east of north); docks face WEST into a truck court shared with Building II; the
east and north faces back onto a tree line.

## Key views

- **Satellite z16–z18 (overview):** Two large rectangular DCs plus a long
  building NW. Building I sits center, docks on its west face, shared court to
  the west, retention ponds on the SW, employee parking at the NW corner, tree
  buffer on the east/north.
- **Satellite z19–z20 (west dock face & court):** Continuous dock line with
  levelers along the building's west wall; colored trailers backed in at the
  north end; many marked trailer stalls and a wide paved court between the two
  buildings.
- **Street View 2025-12 @ SW court intersection (`32.10764,-81.27560`,
  pano `N_DgCNrIRk6T3U-h6l4IYw`):** Looking NE into the shared court — the
  park road opens directly into the dock court with NO barrier arm, NO sliding
  gate, NO guard booth and NO checkpoint pinch-point. Only a monument sign,
  palm-tree islands, light poles and a stop sign. Dock doors of Building I run
  across the frame on the right.
- **Street View 2025-12 @ south facade (`32.10648,-81.27374`):** Shows the
  "1030" address marking and the glass office entry on the south end, with a
  decorative chain-link fence around the building landscaping (not a controlled
  truck gate).

## Gate / guard-shack / dock determinations

- **truckGate = FALSE.** The truck court is entered openly from the park road;
  no barrier, gate, or staffed checkpoint across the truck drive. The landscape
  fence does not gate the truck approach. (Evidence: 2025-12 SV, two headings.)
- **guardShack = FALSE.** No booth of any kind at the court entrance.
- **remoteGs = FALSE.** No gate exists, so this is not a gate-without-guard
  (kiosk/app) configuration.
- **dockDoors = 50+.** 54 doors per the CBRE/SBJ spec; corroborated by the
  continuous overhead dock line with levelers and backed-in trailers.
- **dropArea / dropYard = 50+ / true.** 95 marked trailer stalls per spec; the
  shared court is full of marked trailer parking distinct from active dock
  staging.
- **fastLaneOpportunity = TRUE.** Wide, open court apron with substantial unused
  paved width — room to add an express/bypass lane if access control is added.

## Yard zones & counts (measured)

- **perimeter** — 6-vertex oriented ring tracing the 1030 parcel: NW employee
  parking, NE/SE building corners along the tree line, S edge at the access
  road/pond, SW court entrance, W court boundary toward Building II.
  ≈ **13.5 acres**.
- **truckGate** — quad over the SW open court intersection (driver-arrival
  point). SV heading 43° from pano `N_DgCNrIRk6T3U-h6l4IYw`.
- **dockAprons** — one long thin quad hugging the west dock wall at the
  building's NW–SE angle.
- **dropYards** — one ring over the shared trailer-parking court west of the
  building.
- **staging** — none traced (no distinct pre-gate apron; holding is the in-court
  postGateStaging).
- **yardMetrics:** dockDoorCount 54, trailersVisible ~14 (approx), trailer
  capacity 95, truckGateCount 1, buildingCount 1, siteAreaAcres 13.5,
  railServed false.

## Street View coverage

Recent (2025-12) public-road coverage runs the full south/southwest park road
past the facility. No coverage inside the private court (`ZERO_RESULTS` at court
centroids), so both perimeter and truckGate streetViewMeta use the SW
court-intersection pano `N_DgCNrIRk6T3U-h6l4IYw` — the frame a real driver sees
on arrival.

## Web findings

- Savannah Business Journal (Apr 2023): PCCP/NFI JV acquires two facilities,
  565,000 SF total, 32' clear, built 2019, within 12 mi of Garden City & Ocean
  terminals.
- CBRE / commercialsearch / LoopNet listings: "95 Logistics @ Pooler Pkwy",
  1030 (Bldg I) = 54 dock doors, 95 trailer stalls, 108 car spaces, fully
  leased to NFI's warehouse affiliate; 1240 (Bldg II) = Store Supply / GCE.
- NFI manages 3.5M+ SF of 3PL business in the Savannah market.

## Final confidence: HIGH

Location, tenant, dock count and trailer capacity are corroborated by both
imagery and multiple commercial-real-estate sources. The open-court / no-gate /
no-guard determination is supported by clear, recent (2025-12) two-heading
Street View. Low-confidence items (trailersVisible, exact lane counts) are
flagged in `uncertainFields`.
