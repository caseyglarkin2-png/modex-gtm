# Deep-Audit Dossier — Niagara Bottling, Upper Macungie (Allentown) PA

**Roster idx:** 26
**Address:** 7561 Industrial Blvd, Allentown, PA 18106 (Upper Macungie Township)
**Resolved center:** 40.571100, -75.614900
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** Medium

## Location confirmation
Roster coordinates (40.570886, -75.614395, ROOFTOP) land on a large white-roofed
industrial building. Web search confirmed Niagara Bottling's Allentown plant at
7561 Industrial Blvd, Allentown/Upper Macungie PA 18106 (Waze, TruckMap,
Bandana, Yellowpages listings). Satellite imagery shows a single large
manufacturing/distribution building with two dock banks, a fenced trailer drop
yard, and a silo/tanker process area — fully consistent with a bottling plant.
Locked the center at the building centroid (~40.5711, -75.6149).

## Key views
- **z16 / z17 overview** — Building sits in the dense Lehigh Valley logistics
  corridor, surrounded by other large distribution buildings. A perimeter access
  road wraps the SW and W sides of the building, connecting to Industrial Blvd.
- **SW face (z19, Street View 2023-08)** — A long row of dock doors with
  trailer canopies faces Industrial Blvd, set behind a landscaped buffer.
- **SE face (z19 se-corner)** — A second long dock bank with trailers backed in
  and a row of marked trailer-parking stalls on the apron.
- **NW drop yard (z19, Street View 2023/2025)** — A large chain-link-fenced
  trailer lot holding 40+ tractor-trailers and trailers in rows.
- **NE corner (z19)** — Tanker trucks and silos: the water-intake / process
  area of the plant.

## Gate / guard-shack / dock determinations
- **Truck gate:** Classified **false** (open driveway). The property is fenced
  with chain-link around the dock and trailer yards (clearly visible in Street
  View, captured 2023-08), but walking the access road off Industrial Blvd in
  multiple Street View headings showed **no barrier arm and no guard booth**
  across the truck lane. The entrance road reads as an uncontrolled industrial
  driveway. Medium confidence — a sliding yard gate could exist nearer the
  building beyond Street View reach.
- **Guard shack:** **false.** No small staffed-booth structure (1–3-space
  footprint, multi-side windows) appears at the entrance in any satellite or
  Street View image.
- **Remote GS:** **false** (no gate ⇒ no remote check-in inferred).
- **Dock doors:** **50+** band. Two dock banks — a long row on the SW face and a
  long row on the SE face, both with trailers backed in. Combined estimate ~55
  doors from z18/z19 imagery.
- **Drop area / drop yard:** **50+** band; `dropYard: true`. A dedicated
  chain-link-fenced trailer-storage lot on the NW side holds 40+ trailers, plus
  a marked trailer-stall row on the SE dock apron.

## Yard zones and counts
- **Perimeter:** ~38 acres — spans the plant building, both dock aprons, the NW
  drop yard, and the NE silo/process area.
- **Truck gate:** approximated at the access-road / Industrial Blvd connection
  on the NW side.
- **Drop yards:** NW trailer lot (primary) + SE apron trailer-stall row.
- **Dock aprons:** SW face apron and SE face apron.
- **Metrics:** ~55 dock doors, ~60 trailers visible, ~90 trailer capacity,
  1 truck gate, 1 building, ~38 acres, not rail-served.

## Web findings
Niagara Bottling's Allentown ("ALN") plant. Listed across Waze, TruckMap,
Bandana, Yellowpages and the company's "Our Communities" page. An active
bottling/distribution facility.

## Final confidence
**Medium.** Facility identity and layout are unambiguous and well-imaged. The
gate call is the main uncertainty: fencing is present but no controlled
checkpoint or guard booth is visible from the public road — flagged in
`uncertainFields`. Dock and trailer counts are honest overhead estimates.
