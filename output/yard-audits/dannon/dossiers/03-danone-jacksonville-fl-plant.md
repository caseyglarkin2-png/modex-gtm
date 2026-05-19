# Deep-Audit Dossier — Danone, Jacksonville FL plant (idx 03)

## Facility
- **Name:** Danone - Jacksonville FL (plant)
- **Type:** Coffee & creamer plant (refrigerated) — International Delight, SToK Cold Brew
- **Address:** 2198 West Beaver Street, Jacksonville, FL 32209
- **Resolved center:** 30.33240, -81.69790

## Step 0 — Location confirmation
The roster coordinate (30.33245, -81.698021, ROOFTOP, moved 115 m) landed
directly on the plant. Satellite at z17-z18 shows a white refrigerated
processing building with dense rooftop process equipment, vertical storage
tanks/silos, and trailer activity, on the south side of West Beaver Street in
an urban Jacksonville industrial corridor. Street View confirms a "DANONE /
JOBS.DANONE.COM" sign on the building. Identity confirmed; center locked at
30.33240, -81.69790.

## Key views
- **z17/z18 overview:** Compact plant fronting West Beaver Street, CSX rail
  tracks running along the south property edge, trailer parking east of the
  building.
- **z19 east lot:** Angled trailer-stall drop lot across the cross street.
- **z20/z21 entry:** Controlled vehicle entrance with yellow bollard lanes.
- **Street View:** Whole site enclosed by black chain-link fence with barbed
  wire; a guard booth sits in the entrance drive.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** The site is fully fenced (black chain-link with barbed
  wire) along West Beaver Street and the cross street. A controlled vehicle
  entrance with yellow bollard-channelized lanes leads into the yard.
- **Guard shack: TRUE.** Street View (pano 30.33214,-81.69696, heading 250)
  clearly shows a small standalone guard booth positioned in the middle of the
  entrance drive, with yellow bollards routing traffic around it — a staffed
  checkpoint.
- **Remote GS: FALSE** — a guard shack is present.
- **Docks:** Modest 115,025 sq ft processing plant. Dock doors on the south/SW
  building faces with a few trailers backed in; estimated ~16 → band **10-25**
  (low confidence — dense rooftop process equipment partly obscures the dock
  line). Shipping/receiving not clearly split → `shipRcvSeparate: false`.

## Yard zones and counts
- **Perimeter:** S 30.33115 / W -81.69925 / N 30.33345 / E -81.69625 — ≈ 245 m
  × 279 m, about 17 acres.
- **Drop yards:** two boxed areas — the east angled-stall trailer lot and the
  SW yard/staging strip; combined ~28 capacity, ~18 visible.
- **Dock apron:** boxed the south building face.
- **Truck gate box:** the bollarded controlled entrance with the guard booth.
- **Buildings:** the plant plus an adjacent expansion/construction area →
  buildingCount 2, treated as one facility.
- **Rail:** CSX through-corridor along the south edge, no spur into the
  building → `railServed: false`.
- **Scale:** none confirmed (uncertain).

## Web findings
Roster source corroborates: 115,025 sq ft, on this site since 1948; a $65M new
production line opened June 17, 2025. The office-trailer cluster seen on the
cross street in 2025 imagery is consistent with that expansion.

## Final assessment
- **Gate verdict:** Truck gate present — fully fenced site with a bollarded
  controlled entrance.
- **Guard-shack verdict:** Guard shack present — standalone booth in the
  entrance drive.
- **Archetype:** Gate + GS, urban refrigerated plant with a small drop yard.
- **Confidence:** HIGH — rooftop geocode, clear satellite and Street View
  confirmation of the fence, gate, and booth. Dock-door count is the only
  low-confidence field.
