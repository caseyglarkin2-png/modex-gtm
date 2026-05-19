# Deep-Audit Dossier — Whitestown Redistribution Center (RDC), Whitestown IN

**Account:** Daimler Truck North America · **Roster idx:** 11
**Type:** Parts redistribution center
**Method:** deep-audit · **Confidence:** high

## Resolved location

- **Address:** 4337 AllPoints Drive, Whitestown, IN 46075
- **Locked center:** 39.977550, -86.363000
- **Maps:** https://www.google.com/maps/@39.977550,-86.363000,400m/data=!3m1!1e3

The roster geocode (39.978443, -86.364644) moved 1,950 m and landed inside the
AllPoints at Anson industrial park. Web research confirmed the facility is
"AllPoints at Anson Building 10," a 605,000 sq ft (570' x 1,026') LEED Silver
build-to-suit Redistribution Center opened in 2023 for DTNA — its largest
centralized parts-consolidation node, replenishing the 10 PDCs across the US
and Canada. The building was located in satellite imagery by matching the
single largest fresh-construction warehouse with a 140'-deep south truck court
and adjacent stormwater pond, consistent with the developer spec sheet
(Browning / Prologis). Center locked on that building.

## Key views

- **Wide (z15-z16):** The AllPoints at Anson park — a grid of large
  distribution buildings on the SW edge of Whitestown, farmland to the east,
  residential subdivisions further east.
- **Building (z17-z18):** Single large rectangular warehouse, white TPO roof,
  perimeter truck/loop drive on all four sides. Car parking lot at the north
  end. Dock doors and a deep truck court along the south long face. A utility
  substation sits just southwest of the building.
- **South dock face (z18-z19):** Continuous dock-door rhythm along the south
  wall; 140'-deep paved truck court with striped angled trailer-parking stalls
  along its outer (south) edge. Truck court empty in the captured imagery.
- **Street View:** Nearest pano is 2019-07 — pre-dates the 2023 build and shows
  only farmland. Street View not usable; classification rests on 2026 Maxar
  satellite imagery.

## Gate / guard-shack / dock determinations

- **Truck gate: FALSE.** No perimeter fence, no barrier arm, no sliding/swing
  gate, and no checkpoint pinch-point anywhere on the property. Two open
  driveway connections to AllPoints Drive (north end, southwest corner). This
  is a standard open spec-park layout.
- **Guard shack: FALSE.** No booth structure beside any driveway.
- **Remote GS: FALSE.** No gate exists, so no remote check-in applies.
- **Dock doors: 25-50 band.** Developer spec sheet states 40 9'x10' dock doors
  plus two 12'x16' drive-in doors, all on the south face; satellite confirms
  the door rhythm.
- **Drop area: 50+ band, dropYard TRUE.** Spec sheet states 71 trailer parking
  spaces (expandable to 124); satellite shows the marked stalls in the south
  truck court.

## Yard zones and counts

- **Perimeter:** whole property inside the loop drive, ~14.5 acres.
- **Truck gate zone:** the open north-end driveway connection (best-effort box).
- **Drop yard:** striped trailer stalls along the south truck court.
- **Dock apron:** the 140'-deep south truck court fronting the 40 dock doors.
- **Staging:** none distinctly identified (null).
- **Metrics:** 40 dock doors; 0 trailers visible (post-construction empty
  imagery); ~90 trailer-parking capacity; 2 truck gate connections; 1 building;
  ~14.5 acres; not rail-served.

## Web findings

- DTNA press release (Aug 2023) and Town of Whitestown confirm a 605,000 sq ft
  RDC, DTNA's largest centralized consolidation space, ~25 employees.
- Developer (Browning) spec sheet: 570' x 1,026' footprint, 36' clear height,
  40 dock doors, two drive-in doors, 140' truck court, 71 trailer stalls
  (expandable 124), 171 car stalls.
- IBJ: this is DTNA's second facility in AllPoints at Anson (the first being
  the 2017 Indianapolis PDC nearby).

## Final confidence

**High.** Facility positively identified and corroborated by multiple sources;
layout and dock/trailer counts confirmed by spec sheet and satellite. The only
soft fields are live trailer counts (imagery is post-construction and empty),
flagged in uncertainFields.
