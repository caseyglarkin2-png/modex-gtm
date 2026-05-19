# Deep-Audit Dossier — Niagara Bottling, Elko New Market MN

**Roster idx:** 30
**Address:** Park I-35 Industrial Park, County Rd 2 at I-35, Elko New Market, MN 55020
**Resolved center:** 44.567600, -93.290000
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** Low (facility located, but under construction)

## Location confirmation
The roster coordinates (46.732498, -92.201007, GEOMETRIC_CENTER) were **badly
wrong** — they land on a forested highway interchange near Duluth, roughly
250 km north of Elko New Market. Elko New Market is in Scott County, ~35 miles
south of Minneapolis (~44.57 N, -93.29 W).

Corrected via web research: Niagara Bottling is building a 425,000 sq ft,
$125M beverage-manufacturing facility in the **southeast quadrant of the
Interstate 35 / Scott County Road 2 interchange**, in the City of Elko New
Market's Park I-35 Industrial Park (City of Elko New Market FAQ, Minnesota
Reformer, Star Tribune, KARE 11, niagarawater.com). Probing satellite imagery
along I-35 located the matching interchange and a large new building shell in
the SE quadrant — positively identified as the Niagara plant. Locked center at
the building centroid (~44.5676, -93.2900).

## Construction state — key limitation
The facility is **under construction** in all available imagery. Phase 1 was
targeted to be operational in 2025. Current satellite imagery shows:
- The building shell and roof essentially complete.
- An employee-parking lot started on the east side (cars visible).
- The surrounding truck yard — dock face, dock aprons, trailer parking,
  perimeter road, and any gate or guard booth — **still graded dirt, not yet
  built or not yet captured**.
- Street View (most recent 2025-08) covers only the surrounding public roads
  (CR 2 / interchange ramps); it does not reach the plant, which sits on
  private construction roads.

As a result, the operational truck-yard classification cannot be observed.

## Key views
- **z13–z16 wide** — Located the I-35 / CR 2 interchange and confirmed a large
  new building shell in its SE quadrant.
- **z16–z18 building** — Building roof complete; perimeter and yard areas are
  graded dirt with construction staging, dirt haul roads, and a stormwater
  pond. No completed dock face, apron or trailer yard visible.
- **Street View 2025-08** — Open farmland along CR 2; the construction site is
  faintly visible in the distance but not reachable.

## Gate / guard-shack / dock determinations
- **Truck gate / guard shack / remote GS:** **Cannot be determined.** No
  entrance infrastructure is built or imaged. JSON values are placeholder
  defaults (all false), not observations — all are listed in
  `uncertainFields`.
- **Dock doors / drop area:** **Cannot be determined.** No dock face or trailer
  yard is constructed/visible. Set to `NONE` as placeholders only.

## Yard zones and counts
- **Perimeter:** ~36 acres estimated from the graded property boundary —
  approximate; the final fenced perimeter may differ.
- **Sub-zones (truckGate, dropYards, dockAprons, staging):** left null / empty
  — none are observable at this construction stage.
- **yardMetrics:** dock/trailer counts set to 0 (not yet built); 1 building,
  ~36 acres, rail-served false (no spur visible).

## Web findings
Niagara Bottling Elko New Market — 425,000 sq ft, $125M investment, in the
Park I-35 Industrial Park, SE quadrant of the I-35 / CR 2 interchange. The
project drew local opposition over groundwater use and required a Minnesota
DNR water-appropriation permit; Phase 1 targeted operational in 2025.

## Final confidence
**Low.** The facility was positively located despite badly wrong roster
coordinates, but it is under construction and its truck-yard infrastructure is
not yet built or imaged. Every operational classification field is listed in
`uncertainFields`. **Recommend re-audit once post-completion imagery
(expected 2026+) is available.**
