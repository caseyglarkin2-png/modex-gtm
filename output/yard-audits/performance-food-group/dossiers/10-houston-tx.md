# Deep-Audit Dossier — Performance Foodservice, Houston TX (idx 10)

**Facility:** Performance Foodservice - Houston TX
**Type:** Broadline Foodservice Distribution Center (refrigerated/freezer class)
**Address:** 1616 Farrell Rd, Houston, TX 77073
**Resolved center:** 29.97850, -95.38680
**Confidence:** Medium

## Location resolution
The roster coordinate (29.978631, -95.386916) landed directly on a large
distribution building under construction on Farrell Rd. The roster geocode note
flagged a 3776 m move, so the location was independently verified: web search
confirmed 1616 Farrell Rd sits at the Farrell Rd / Aldine Westfield Rd area in
77073, immediately adjacent to Lochinvar Golf Club (2000 Farrell Rd) — and that
golf course is plainly visible on the east side of the wide satellite frame.
The building is therefore positively confirmed as the PFG Houston DC.

Important caveat: all available imagery shows the facility **mid-construction**.
Satellite (2026 vintage tiles) shows the building shell substantially complete
but the surrounding site still bare graded dirt with no completed paving, dock
aprons, or striped trailer parking. Street View (Dec 2024) shows the building up
and the entrances installed. Counts below are honest projections for the
finished facility, flagged in `uncertainFields`.

## Key views
- **Wide satellite (z17/z18):** large rectangular DC building, oriented N–S,
  with refrigeration units on the roof. Entire perimeter is graded dirt being
  developed into yard and parking. Golf course to the east, woods, and rural
  homes to the west across Farrell Rd.
- **Tight satellite (z19/z20):** confirms a refrigerated-DC roofline (banks of
  rooftop condenser/refrigeration units). Dock face runs along the long east
  side. Yard south of the building is graded but unpaved.
- **Street View — car entrance (~29.98001,-95.38849):** wide concrete apron
  meeting Farrell Rd, a "NO TRUCKS" sign, a directional sign in the median, and
  a **yellow barrier arm** across the drive. This is the visitor/employee entry.
- **Street View — truck entrance (~29.97900,-95.38947):** a separate entrance
  ~120 m south with a **chain-link sliding gate** across the truck lane, facility
  signage on the fence ("NORTH HOUS..."), and a **modular building / booth just
  inside the gate**. This is the dedicated, controlled truck gate.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Dedicated truck entrance has a chain-link sliding gate
  across the truck lane — a real controlled checkpoint, separate from the
  car entrance (which itself has a barrier arm).
- **guardShack = true (medium confidence).** A modular booth structure sits
  just inside the truck gate. In construction-era imagery it likely doubles as
  a construction office, but it is positioned as a gatehouse beside the truck
  lane. Flagged uncertain.
- **remoteGs = false.** A booth is present, so not remote check-in.
- **dockDoors = "50+".** Projected from the building footprint and refrigerated-
  DC class; doors line the long east face. Construction obscures an exact count.
- **dropArea / dropYard = true, "50+".** Large graded yard south and west of the
  building is being built out as trailer storage.
- **drivewayLong = true.** Both entrances have long, deep approach aprons with
  ample stacking room before reaching the building.
- **fastLaneOpportunity = true.** Entrance aprons are very wide with large
  undeveloped paved expanses — clear physical room for an express bypass lane.
- **scale = false (uncertain).** No truck scale visible in construction imagery.

## Yard zones & counts (projected)
- Perimeter geofence captures the full property: ~41 acres, bounded by Farrell
  Rd on the west and the wood/golf-course line on the east.
- Drop yard: graded area south/west of the building, projected ~120-trailer
  capacity.
- Dock apron: strip along the east building face.
- Post-gate staging: paved/graded area inside the gates before the docks.

## Web findings
Performance Foodservice operates a Houston DC at 1616 Farrell Rd, 77073 (PFG /
Performance Foodservice location pages, Waze, Indeed job postings for the
Houston site). It is the South Texas market broadline DC, distinct from the PFG
Vistar Houston site. The refrigerated-DC roof signature is consistent with PFG's
multi-temp broadline operations. No specific construction-announcement detail
surfaced, but imagery dating confirms the facility is a recent new build.

## Final confidence: Medium
Location is positively confirmed. The medium rating reflects that all imagery is
construction-era — gate and building are confirmed, but dock counts, trailer
capacity, and final yard layout are projections rather than finished-state
observations.
