# Deep-Audit Dossier — Danone, Minster OH (idx 02)

## Facility
- **Name:** Danone - Minster OH
- **Type:** Fresh yogurt plant — Activia, Oikos, Dannon Fruit on the Bottom, Danimals, Light + Fit, Triple Zero
- **Address:** 216 Southgate Drive, Minster, OH 45865
- **Resolved center:** 40.38440, -84.37300

## Step 0 — Location confirmation
The roster coordinate (40.38427, -84.376014, ROOFTOP, moved 860 m) landed on the
west office front of the plant. Satellite probes at z16-z18 show a large
industrial plant on the south edge of Minster, OH: an older dark-roofed process
plant on the west, a large white DC-style building on the east (the 2025
expansion), process silos, employee parking, and an extensive fenced trailer
yard between the two. Setting is small-town edge — residential subdivision to
the north, open farmland to the south/east/west. Identity confirmed; center
locked at the plant centroid 40.38440, -84.37300.

## Key views
- **z16/z17 overview:** Plant block bounded by Southgate Drive / residential to
  the north and farmland on the other three sides.
- **z18 east DC view:** Long dock face on the west side of the east DC building
  with many trailers backed in; ~25-30 doors.
- **z19/z20 yard:** Trailer yard packed with trailers in rows; chain-link fence
  along the south edge.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** The truck/trailer yard is fully enclosed by chain-link
  fencing. Street View from the south road (pano 40.38332,-84.37285) clearly
  shows a rolling/sliding gate set in the fence across the truck entrance lane,
  with trailers and tractors maneuvering inside the fenced yard.
- **Guard shack: FALSE.** No staffed booth at the gate — Street View shows only
  posted signage ("NO PARKING") at the fence opening, with no 1-3-vehicle-
  footprint structure beside the lane.
- **Remote GS: TRUE.** A controlled gate with no guard booth implies badge /
  kiosk / app-based remote check-in.
- **Docks:** The east DC building carries a long dock bank on its west face
  (~25-30 doors) with trailers backed in; the older plant adds dock positions.
  Total estimated ~38 → band **25-50**. Shipping/receiving not clearly split
  into separate clusters → `shipRcvSeparate: false`.

## Yard zones and counts
- **Perimeter:** S 40.38255 / W -84.37610 / N 40.38660 / E -84.36970 — ≈ 445 m
  × 534 m, about 58 acres.
- **Drop yard:** one boxed area — the fenced trailer yard between the plant and
  the east DC; rows of parked trailers, ~80 capacity, ~60 visible.
- **Dock apron:** boxed the west dock face of the east DC building.
- **Truck gate box:** the south fence opening with the rolling gate.
- **Buildings:** integrated plant + east DC expansion + a SW fuel/maintenance
  support area → buildingCount 3, `multipleFacilities: false` (one operation).
- **Rail:** none.
- **Scale:** none confirmed (listed uncertain).

## Web findings
Roster source corroborates: 371,000 sq ft, ~440 employees, ~2.2M lbs/day, with
an August 2025 expansion adding ~48,000 sq ft — consistent with the large white
east building seen in current imagery and the heavy trailer activity.

## Final assessment
- **Gate verdict:** Truck gate present — chain-link fence with a rolling gate
  across the truck lane.
- **Guard-shack verdict:** No guard shack — unstaffed gate, remote check-in
  implied.
- **Archetype:** Gate + Remote GS, fenced yard with a drop yard.
- **Confidence:** HIGH — rooftop geocode, clear satellite, multiple Street View
  confirmations of the fenced gate.
