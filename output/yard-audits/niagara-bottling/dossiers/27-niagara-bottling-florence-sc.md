# Deep-Audit Dossier — Niagara Bottling, Florence SC

**Roster idx:** 27
**Address:** 2222 Florence Harllee Blvd, Florence, SC 29506
**Resolved center:** 34.265200, -79.694000
**Facility type:** Bottling / Manufacturing Plant
**Confidence:** Medium

## Location confirmation
Roster coordinates (34.265035, -79.695251, ROOFTOP) land on a large
white-roofed manufacturing/distribution building. Web search confirmed Niagara
Bottling's Florence plant — a 502,320 sq ft, $70M facility in the Pee Dee
Touchstone Energy Commerce Park at 2222 Florence Harllee Blvd, operational
since Q1 2021 (SC Dept of Commerce, Florence Chamber, TruckMap). Street View
(2024-02) shows the Niagara logo on the building's west end and Niagara-branded
trailers backed into the docks — positive identification. Locked center at the
building centroid (~34.2652, -79.6940).

## Key views
- **z16 / z17 overview** — A single very large building in a commerce park on
  the edge of Florence, surrounded by woods, fields and retention ponds. A long
  dock face runs the full south side.
- **z18 south face** — Dock doors run the entire ~500ft south wall with trailers
  backed in, plus a long row of marked trailer-parking stalls on the apron south
  of the docks.
- **West side (z18)** — Employee parking lot and the access driveway entering
  from Florence Harllee Blvd at the SW.
- **Street View 2024-02 (multiple headings along the road)** — Confirms the long
  dock face, Niagara branding, and a low post-and-cable boundary marker along
  the property edge — no security fence, no gate, no booth.

## Gate / guard-shack / dock determinations
- **Truck gate:** **false** (open driveway). The property is bounded only by a
  low post-and-cable marker along the road; there is no perimeter security
  fence, no barrier arm and no guard booth across the truck driveway. The access
  road off Florence Harllee Blvd reads as an uncontrolled industrial driveway.
  Medium confidence.
- **Guard shack:** **false.** No small staffed-booth structure appears at the
  entrance in any satellite or Street View image.
- **Remote GS:** **false** (no gate ⇒ no remote check-in inferred).
- **Dock doors:** **50+** band. One continuous dock bank runs the full south
  face of the building with trailers backed in along its entire length;
  estimate ~70 doors from z18 imagery.
- **Drop area / drop yard:** **50+** band; `dropYard: true`. A long row of
  marked trailer-parking stalls south of the dock apron holds many trailers
  without tractors.

## Yard zones and counts
- **Perimeter:** ~42 acres — covers the full building footprint, the south dock
  apron, and the trailer-stall rows.
- **Truck gate:** approximated at the SW access-road / Florence Harllee Blvd
  connection.
- **Drop yards:** the long trailer-stall strip south of the docks.
- **Dock aprons:** the continuous south-face dock apron.
- **Metrics:** ~70 dock doors, ~65 trailers visible, ~110 trailer capacity,
  1 truck gate, 1 building, ~42 acres, not rail-served.

## Web findings
Niagara Bottling Florence — 502,320 sq ft, $70M investment, ~70 jobs, online
Q1 2021. Located in the Pee Dee Touchstone Energy Commerce Park. Confirmed
across SC Dept of Commerce, Florence Chamber, NESA and TruckMap listings.

## Final confidence
**Medium.** Facility identity and layout are unambiguous and well-imaged
(recent Street View). The gate call is the principal uncertainty — the site is
clearly open with no controlled checkpoint, but that is itself a confident
"open site" read; flagged in `uncertainFields` along with the overhead-derived
dock/trailer counts.
