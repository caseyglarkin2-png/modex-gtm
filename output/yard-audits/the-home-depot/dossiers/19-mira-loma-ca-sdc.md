# Deep-Audit Dossier — Home Depot SDC, Mira Loma CA (idx 19)

**Facility:** Home Depot Stocking Distribution Center (DCs #5556, 5557, 5558, 5559, 5645)
**Address:** 11650 Venture Drive, Mira Loma (Jurupa Valley), CA 91752
**Resolved center:** 34.02900, -117.53575
**Confidence:** Medium

## Location resolution
The roster coordinate (34.028294, -117.536009; geocode moved 3,606 m) landed on
the correct building — a single enormous distribution building running E-W in
the Mira Loma / Jurupa Valley warehouse district. Web research confirms 11650
Venture Drive is Home Depot's SDC, housing five HD DC numbers (#5556-5559 and
#5645) under one roof. The locked center is the building centroid.

## Key views
- **z16/z17 wide:** A vast single distribution building (~700 m long) set in the
  densest warehouse cluster in the US — the Inland Empire. Dock doors and parked
  trailers line both the N and S long faces.
- **z19 east end:** SE corner of the building with dock aprons, dozens of
  trailers backed in, and additional trailers parked diagonally.
- **z20 SE corner:** Striped checkpoint pinch-point lane markings where the
  access road meets the truck yard — a controlled entrance.
- **z19 north face:** Dock-door rhythm with trailers; a low office wall and hedge
  front the N public road.
- **z19/z20 SW corner & west end:** Truck-yard access drives, employee parking,
  trailers and tractors.
- **Street View (2025-01 N road; 2018-08 SW):** The N frontage is a finished
  office wall behind a hedge. The 2018 SW panos show a separate trucking yard
  south of the HD parcel, not the HD SDC itself.

## Determinations
- **truckGate = true.** The SDC truck yards on both long faces are inside a
  property fence; striped checkpoint pinch-point markings at the SE corner mark
  a controlled truck entrance.
- **guardShack = UNCERTAIN (recorded false / remoteGs true).** No standalone
  guard booth was positively resolved on satellite imagery at z20-z21 — the dock
  yards are open paved aprons. HD's practice at large DCs likely includes a
  staffed gate, but imagery could not confirm a booth, so the booth call and
  `remoteGs` are flagged as uncertain. A human reviewer with current ground-level
  imagery should confirm.
- **multiStep = false.** No second checkpoint stage observed.
- **scale = false.** No truck scale pad seen.
- **shipRcvSeparate = true.** Cross-dock SDC — dock doors on both N and S long
  faces.
- **entryExitSeparate = true.** Distinct truck yards / access points on the two
  long faces.
- **fastLaneOpportunity = true.** Very wide paved truck yards leave ample room
  for express/bypass lanes.
- **urbanRural = Urban.** Core of the Inland Empire warehouse fabric.

## Yard zones and counts
- **Perimeter:** ~158 acres capturing the SDC building and both dock yards.
- **Dock doors:** 50+ band; ~360 doors estimated across both faces of the
  ~700 m building (approximate).
- **Drop yard:** 50+ band; ~320 trailers visible in the imagery, capacity ~420.
- **Buildings:** 1 physical building (it houses 5 HD DC operations).
- **Rail:** No spur enters the property — not rail-served.

## Web findings
BusinessYab / Panjiva / SupplierWiki confirm: 11650 Venture Drive is Home
Depot's SDC, identified as SDC #5645 plus #5556-5559 — a multi-DC stocking
distribution operation under one address in Riverside County, CA.

## Final confidence: Medium
Facility identity and the truck-gate / dock layout are clear. The guard-booth
determination could not be positively resolved from overhead imagery, so the
`guardShack` / `remoteGs` calls and the lane / gate counts are flagged uncertain.
