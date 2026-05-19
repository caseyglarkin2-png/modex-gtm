# Deep-Audit Dossier — Niagara Bottling, Rialto CA (idx 2)

## Resolved location
- **Address:** 1401 N Alder Ave, Rialto, CA 92376
- **Locked center:** 34.12940, -117.41630
- **Confirmation:** Roster coordinates landed at the Alder Ave intersection
  north of the building. Probing the surrounding warehouses, the Niagara plant
  was positively identified by its **distinctive rooftop solar array** — Niagara
  Bottling Rialto runs a documented on-site solar farm (Global Energy Monitor /
  gridinfo records). The 598,750 sq ft building sits with its west face on
  N Alder Ave. Street View of the SW corner shows the "1401" office address and
  the company's blue-glass office entrance.

## Setting
Rialto, CA — Inland Empire industrial district inside the Los Angeles metro
fabric. Surrounded by large distribution buildings → **Urban**. Cellular coverage
strong; no connectivity concern.

## Key views
- **Wide satellite:** Large building, rooftop solar grid on the eastern two-thirds
  of the roof. West face = office + employee/visitor parking on Alder Ave.
- **North face (z18-20):** A long continuous run of dock doors with trailers
  backed in; a wide paved trailer yard with marked drop rows extends north.
- **Perimeter (Street View, multiple headings):** A continuous solid masonry
  wall encloses the property along Alder Ave and the cross streets — a fully
  secured site.
- **NE corner:** Two-story office/admin block.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence):** The whole property is ringed by a
  solid masonry wall — definitively a controlled, secured site. The truck
  entrance is a gated opening in the north wall feeding the dock yard. No Street
  View pano covers the interior roads, so the exact gate hardware (barrier arm
  vs. sliding gate) could not be directly imaged — inferred.
- **guardShack = true (medium confidence):** Not directly visualized. A walled
  600k-sq-ft Niagara plant of this scale virtually always staffs a guard booth
  at the truck gate. Classified true at medium confidence and flagged for human
  verification.
- **remoteGs = false:** Follows from guardShack = true.
- **Docks:** Long continuous dock run on the north face, ~40 doors → band **25-50**.
- **Drop yard:** Large paved trailer yard north of the dock face with dozens of
  dropped trailers in marked rows → `dropYard = true`, `dropArea = 50+`.

## Yard zones and counts
- **Perimeter:** ~30 acres — building + north dock yard + west/north parking.
- **Dock apron:** strip along the north building face.
- **Drop yard:** large paved trailer-storage yard north of the dock apron.
- **Staging:** paved holding area between the gate, the trailer rows and the docks.
- **Dock doors:** ~40. **Trailers visible:** ~35. **Capacity:** ~80.
  **Truck gates:** 1. **Buildings:** 1. **Rail-served:** no. **Scale:** none.

## Web findings
Niagara Bottling Rialto — 598,750 sq ft, produces private-label bottled water
(Costco, Walmart, etc.); largest US private-label bottled-water supplier.
On-site solar provides up to ~20% of plant energy (ranked #350 of 847 CA solar
farms). Confirms the building identity via the solar array.

## Final confidence
**Medium.** Building identity is certain (solar array is a unique signature).
The gate and guard-shack calls are inferred from the fully walled secured layout
and Niagara's standard plant configuration — interior Street View coverage was
absent, so the exact gate hardware is unverified and flagged in `uncertainFields`.
