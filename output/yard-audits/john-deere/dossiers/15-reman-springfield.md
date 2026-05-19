# Deep-Audit Dossier — John Deere Reman Springfield (idx 15)

**Facility:** John Deere Reman — Springfield, MO
**Type:** Remanufacturing Plant (reman engines, fuel/electronics components, transmissions, axles)
**Address:** 4500 E Mustard Way, Springfield, MO 65803 (Partnership Industrial Center)
**Resolved center:** 37.243981, -93.200702
**Confidence:** High

## Location confirmation (Step 0)
The roster geocode (ROOFTOP, moved 2955 m) landed on a large single industrial
building in the Partnership Industrial Center on the northeast side of Springfield.
Street View (2026-03) confirms this is the John Deere Reman building — the building
front has an entrance canopy on Mustard Way and the "4500 E Mustard Way" address sign
is posted at the property. Web research confirms John Deere Reman-Springfield at 4500
Mustard Way, a Deere subsidiary remanufacturing engines and fuel/electronics
components, ~500 employees. Coordinates locked at the supplied point.

## Key views
- **Context (z16/z17):** Industrial park with many buildings; the Reman facility is
  the large single-building site near the center, with employee parking to the north
  and a material yard to the south.
- **Building (z18):** One large rectangular remanufacturing building; employee parking
  lots front Mustard Way along the north.
- **South yard (z19/z20):** Dock-door bank with visible dock-leveler bays along the
  SW/south building face; the south yard holds material laydown (crates, tanks,
  equipment) and a few trailers — no dedicated drop yard.
- **South / SW (z19):** A rail mainline corridor runs parallel along the south edge of
  the property; no spur enters the site.
- **Street View (2026-03):** The building fronts Mustard Way with an open driveway and
  employee parking; no perimeter fence, no gate, no guard booth at the frontage.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Open campus. Employee parking fronts Mustard Way with an open
  driveway; a single internal driveway loops around the building's SW corner to the
  south dock yard. No barrier arm, sliding gate, checkpoint, or perimeter fence in
  satellite or Street View.
- **guardShack = false.** No guard booth anywhere on site. remoteGs = false (no gate).
- **dockDoors = "10-25".** Dock-door bank with dock-leveler bays along the SW/south
  building face; estimated 10-25 (low confidence — flagged).
- **dropArea = "0-10".** No dedicated trailer-storage lot; the south yard is mostly
  material laydown with only a few trailers.
- **railServed = false.** A rail mainline runs along the south edge but no spur enters
  the property.

## Yard zones and counts
- **Perimeter:** ~22 acres developed property (grassy buffer to the east extends the
  parcel).
- **Truck gate:** none.
- **Drop yards:** none.
- **Dock apron:** SW/south face of the building.
- **Staging:** south material/staging yard in front of the docks.
- **Metrics:** ~14 dock doors (est.), ~3 trailers visible, ~10 trailer capacity, 0
  truck gates, 1 building, ~22 acres, no rail spur.

## Web findings
Deere, the Springfield Area Chamber, BBB, and Missouri DED confirm John Deere Reman-
Springfield at 4500 Mustard Way in the Partnership Industrial Center — a Deere
subsidiary founded 1998 as a JV with Springfield ReManufacturing Corp., wholly owned
by Deere since 2009, ~500 employees, 2,000+ remanufactured product types, exporting
one-third of output. A separate, larger Strafford-area plant has also been announced.

## Final confidence
**High.** Facility unambiguously identified and confirmed by Street View signage; the
open-campus layout with no truck gate or guard shack and the single dock bank are
clearly readable. Only the dock-door count is flagged as low-confidence.
