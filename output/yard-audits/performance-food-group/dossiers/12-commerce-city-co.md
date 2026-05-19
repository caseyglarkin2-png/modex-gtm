# Deep-Audit Dossier — Performance Foodservice, Denver / Commerce City CO (idx 12)

**Facility:** Performance Foodservice - Denver (Commerce City CO)
**Type:** Broadline Foodservice Distribution Center
**Address:** 9940 Havana Street, Commerce City, CO 80640
**Resolved center:** 39.877035, -104.864645
**Confidence:** Medium

## Location resolution
The roster coordinate (ROOFTOP geocode, 108 m move) landed on a large, recently
built distribution building on Havana St in Commerce City, NE of Denver. Web
search confirmed this as Performance Foodservice's new Denver DC: a 265,000 sq ft
facility, groundbreaking Sept 28, 2022, completed late 2023, more than double
the size of the prior Denver location, designed with state-of-the-art automation
and serving 1,100+ customers (BusinessWire / PFG investor relations / C-Store
Dive / Vending Market Watch). Location positively confirmed.

Caveat: all available imagery is construction-era. Street View is dated
**Sept 2023** (during build-out) and shows the building shell complete with the
perimeter fence installed but the rest of the site bare graded dirt and orange
traffic barrels along Havana St. Satellite tiles likewise show a finished
building surrounded by graded dirt. Counts below are projections for the
finished facility, flagged in `uncertainFields`.

## Key views
- **Wide satellite (z16/z17):** large rectangular DC building between Havana St
  (and a parallel drainage canal) on the west and a rail/highway corridor on the
  east. Open agricultural land to the NE. A large independent truck-parking lot
  sits across the canal to the west — a separate operation, not part of this DC.
- **Tight satellite (z18/z19/z20):** building shell complete, dock face along the
  SE side, surrounding yard graded but unpaved. The SW building corner has a
  projecting bay (resolved on max-zoom as part of the building, not a booth).
- **Street View — Havana St frontage (Sept 2023):** a continuous **black metal
  security/perimeter fence** runs the full length of the property frontage with
  the new building behind it. Construction barrels line the street; the road and
  site are mid-build.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The property is enclosed by an installed black metal
  perimeter fence along Havana St with a controlled entry — a real gated truck
  entrance for this new-build DC.
- **guardShack = false / remoteGs = true (both uncertain).** No freestanding
  guard booth is visible in the construction-era imagery, and the SW-corner
  structure resolves as a building bay rather than a booth. A fenced, gated
  entrance with no visible booth is classified as remote check-in (kiosk / app).
  Construction-era imagery cannot confirm the finished check-in arrangement —
  both flags are listed uncertain.
- **dockDoors = "25-50".** Projected from the ~265,000 sq ft footprint; dock face
  along the SE side. Not directly countable in construction imagery.
- **dropArea / dropYard = true, "50+".** Large graded area south/southeast of the
  building being developed as trailer parking.
- **drivewayLong = true / fastLaneOpportunity = true.** Wide entry apron and
  large undeveloped paved expanse — deep stacking room and clear room for an
  express bypass lane.
- **scale = false (uncertain).** No truck scale visible in construction imagery.
- **railServed = false.** A rail line runs the broader east corridor but no spur
  visibly enters the property.

## Yard zones & counts (projected)
- Perimeter geofence captures the full fenced property, ~26 acres.
- Drop yard: graded area S/SE of the building, projected ~90-trailer capacity.
- Dock apron: strip along the SE building face.
- Post-gate staging: paved/graded area inside the gate before the docks.

## Web findings
PFG's Denver operation relocated/expanded into this purpose-built 265,000 sq ft
Commerce City DC (9940 Havana St, 80640; phone 303-373-9123). The project added
~145 jobs over ten years and included automation investment — consistent with
PFG's pattern of new flagship broadline DCs (cf. Florence SC). As a 2023-completed
build it is now fully operational, though no post-completion imagery is available.

## Final confidence: Medium
Location positively confirmed and the facility identity is unambiguous. Medium
rating reflects that all imagery predates completion — the perimeter fence and
gated entry are confirmed, but the guard-shack/remote-check-in determination,
dock count, and final yard layout are projections rather than finished-state
observations.
