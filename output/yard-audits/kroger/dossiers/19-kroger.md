# Deep-Audit Dossier — Centennial Farms Dairy (idx 19)

- **Type:** Dairy Plant (milk / liquid-dairy manufacturing & distribution)
- **Address:** 2121 Faulkner Rd NE, Atlanta, GA 30324
- **Confirmed center:** 33.813853, -84.358477
- **Method:** deep-audit
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coords (33.8186, -84.3324) landed ~2.7 km NE of the
plant, in a wooded residential subdivision (verified by z17 satellite — no
industrial structure). Web search confirmed the business at **2121 Faulkner Rd
NE, Atlanta GA 30324** (Lindridge/Martin Manor industrial corridor, off
Cheshire Bridge Rd between Piedmont Rd and the CSX line). Google geocode of the
address returned **33.813853, -84.358477** with a parcel-sized bounds. Satellite
at that point shows a large white-roofed food-manufacturing building with **3+
tall stainless milk/processing silos** and an extensive trailer yard — exactly a
dairy plant, not an office. Street View from the adjacent internal road
(Faulkner Rd cul-de-sac) directly shows the brick plant building, the milk
silos, yellow pipe bollards, and a chain-link perimeter fence — positive ID.

## Key views
- **z18/z19 satellite (center):** Cross/T-shaped main building; processing silos
  on the building's SE corner; trailers backed to multiple building faces; a
  large trailer-storage yard filling the N/NW half of the parcel; employee/
  visitor car parking along the E edge.
- **z17 wide:** Parcel bounded by woods N & W, the apartment complex to the E,
  and the internal Faulkner Rd drive (with the truck gate) to the S. A separate
  large warehouse sits SE across the drive — different tenant, excluded.
- **Street View (gate, pano 92NjOjdybFQsSc50yMJRpw, 2023-01 / 2024-07):** the
  truck entrance where the drive crosses the fence — a **red/white barrier arm**
  over one lane and a **sliding chain-link gate** over the adjacent lane.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE** — A controlled truck entrance: a barrier arm plus a
  sliding chain-link rolling gate span the single truck drive at the fenced
  property line. Clear pinch-point. (Street View, multiple headings.)
- **guardShack: FALSE** — No staffed booth at the gate in any heading. No
  1-3-space-footprint structure beside the lane; the only nearby object is a
  small landscaped sign island. Workers were observed standing on foot in the
  drive, not in a booth.
- **remoteGs: TRUE** — Gate exists with no guard shack → kiosk / call-box /
  remote/app check-in implied.
- **Docks:** Trailers backed to the building's **W face (~12-15)** and **NE/E
  face (~15-20)**; total in the **25-50** band. Combined dock operation rather
  than clearly separated ship vs receive clusters (shipRcvSeparate = false, low
  confidence). Estimated **~38 dock doors**.

## Yard zones & counts
- **Perimeter:** ~8.7 acres, fenced, oriented ~30-40° off north (long axis
  NW-SE), traced as an 8-vertex ring along the treeline/fence and the internal
  drive.
- **Drop yard (N/NW):** dedicated trailer-storage lot, ~2.2 acres, holding
  40-50+ drop trailers (no tractors) → **dropArea 50+**, **dropYard true**.
- **Dock aprons:** two oriented quads hugging the W face and the NE/E face,
  parallel to the building walls.
- **Truck gate:** single gate, two lanes (slide + arm), entry/exit together.
- **Metrics:** dockDoorCount ~38, trailersVisible ~55, parking capacity ~70,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~8.7, railServed false (CSX
  runs ~150m south but no spur enters the parcel).
- **postGateStaging true / drivewayLong true:** wide internal yard inside the
  gate holds a 3+ truck queue before the docks. **backupSensitive false** — the
  gate opens onto a wide internal cul-de-sac, not a busy public road.
- **urbanRural Urban** — dense Atlanta metro (Buckhead/Midtown edge).

## Web findings
Centennial Farms Dairy (est. 2006, GA-incorporated; phone 404-315-7189) produces
milk and liquid dairy products (pasteurized milk, cultured/acidified products,
eggnog). Listed in the Dairy Foods "Dairy Plants USA" directory; ~100-249
employees per business listings; operates 24/7. Property is the
Lindridge/Martin Manor I-1 industrial parcel on Faulkner Rd (Piedmont Warehouses
district). All consistent with the observed processing-silo + multi-dock +
large-drop-yard layout.

## Final confidence: HIGH
Location positively confirmed (geocode + silos in satellite + Street View). Gate
and guard-shack calls are well-supported by direct ground-level imagery.
Uncertain fields flagged: shipRcvSeparate, exact dockDoors count, exit-lane
assignment.
