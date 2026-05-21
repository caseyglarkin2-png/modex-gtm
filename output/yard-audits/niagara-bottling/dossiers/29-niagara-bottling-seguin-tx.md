# Deep-Audit Dossier — Niagara Bottling, Seguin TX

**Roster idx:** 29
**Address:** 1730 N 8th St, Seguin, TX 78155
**Resolved center:** 29.588439, -97.979524
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** Medium

## Location confirmation
Roster coordinates (29.588439, -97.979524, ROOFTOP) land on a large building
with a fully solar-panelled roof. Web search confirmed Niagara Bottling's
Seguin plant — a 557,533 sq ft facility built 2016 on ~30 acres at the
intersection of Rio Nogales Dr and 8th St, running multiple production lines
with a $21M fourth-line expansion (Seguin EDC, Waze, GridInfo solar-farm
listing, The Keith Corp). The distinctive rooftop solar array matches the
GridInfo "Niagara Bottling - Seguin" solar-farm record — positive
identification. Locked center at the building centroid.

## Key views
- **z16 / z17 overview** — A single large solar-roofed building in an isolated
  edge-of-Seguin industrial area, surrounded by open farm fields, near a
  highway interchange. Other large buildings to the NE/E belong to separate
  companies.
- **z18 south face** — A long dock bank runs the south wall with trailers
  backed in, plus a row of marked trailer-parking stalls on the apron.
- **East side (z19)** — Employee parking lot and the building's process end;
  the access road wraps the building and connects to the E-side public road.
- **Street View (2026-03/04, from surrounding roads)** — The plant is visible
  across open fields; the site is clearly rural and isolated with no perimeter
  security fence. Street View has no panos on the immediate plant driveway
  (ZERO_RESULTS at several nearby points).

## Gate / guard-shack / dock determinations
- **Truck gate:** **false** (open driveway). The site sits in open farmland
  with no perimeter security fence; the access road off the E-side public road
  shows no barrier arm and no guard booth in satellite imagery. Medium
  confidence — Street View coverage of the driveway itself is sparse, so the
  call leans on satellite.
- **Guard shack:** **false.** No staffed-booth structure visible at the
  entrance.
- **Remote GS:** **false** (no gate ⇒ no remote check-in inferred).
- **Dock doors:** **50+** band. One continuous dock bank runs the south face of
  the 557,533 sq ft building with trailers backed in; estimate ~65 doors.
- **Drop area / drop yard:** **50+** band; `dropYard: true`. A long row of
  marked trailer-parking stalls on the south apron holds many trailers without
  tractors.

## Yard zones and counts
- **Perimeter:** ~32 acres — covers the building footprint, south dock apron
  and trailer-stall rows; consistent with the ~30-acre EDC figure.
- **Truck gate:** approximated at the E-side access-road connection.
- **Drop yards:** the trailer-stall strip on the south apron.
- **Dock aprons:** the continuous south-face dock apron.
- **Metrics:** ~65 dock doors, ~55 trailers visible, ~100 trailer capacity,
  1 truck gate, 1 building, ~32 acres, not rail-served.

## Web findings
Niagara Bottling Seguin — 557,533 sq ft, built 2016, ~30 acres, multiple
production lines, ~115+ employees, $21M fourth-line expansion. Produces private
-label water for Costco/Walmart. Rooftop solar array confirmed via GridInfo.

## Final confidence
**Medium.** Facility identity and layout are unambiguous and well-imaged via
satellite, and the rooftop solar uniquely confirms it. The gate call is the
principal uncertainty because Street View has no coverage of the immediate
plant driveway — flagged in `uncertainFields` along with the overhead-derived
dock/trailer counts and the inferred connectivity field.
