# Deep-Audit Dossier — Niagara Bottling, Hazle Township PA (idx 24)

## Facility
- **Name:** Niagara Bottling - Hazle Township PA
- **Type:** Bottling / Manufacturing Plant
- **Address:** 100 Timberline Dr, Hazle Township, PA 18202
- **Resolved coords:** 40.93250, -76.06350 (building/yard center)
- **Archetype:** #10 — Ship/Rcv Separate (Gate + GS) — see caveat below
- **Confidence:** medium

## Location confirmation
The roster lat/lng (40.931251, -76.066517) sits at the SW corner of the
correct building. Web search confirmed the Niagara Bottling Hazle Township
plant at 100 Timberline Dr in the Humboldt Industrial Park — ~1.19M sq ft, a
$440M investment, opened March 2022, one of Niagara's largest plants
(purified water plus aseptic beverages). Satellite imagery matched: a single
massive rectangular building with dock yards on multiple faces. Locked center
at 40.93250, -76.06350.

## Key views
- **Wide (z16):** A single very large rectangular building oriented NW-SE,
  set well back from the public road behind a wooded buffer.
- **NE dock face (z19):** A huge dock yard — trailers backed into a long
  continuous dock face plus a full second row of dropped trailers.
- **SW dock face (z17):** A second long dock face with trailers backed in and
  drop rows along the SW apron.
- **SW driveway (z18/z20, Street View 2025-08):** Timberline Dr enters from
  the public road and curves up to the SW corner; the car/employee parking
  and main office entrance are at the SW corner.

## Gate / guard-shack / dock determinations
- **truckGate = true (uncertain).** No barrier/gate structure could be
  positively confirmed — the truck driveway is private (no Street View
  coverage) and satellite resolution at the SW approach is insufficient to
  resolve a barrier. Called true as a strong inference: a 1.19M sq ft /
  $440M secured manufacturing campus with a long private set-back approach
  is invariably gated. Flagged uncertain.
- **guardShack = true (uncertain).** No guard booth positively identified.
  Called true as standard for a Niagara plant of this scale; the SW-corner
  office structure plausibly houses security. Flagged uncertain — this is an
  inference, not a confirmed visual.
- **remoteGs = false (uncertain).**
- **dockDoors = "50+".** Two very long dock faces (NW and SW/SE), each with
  continuous dock-door rhythm; estimate ~120 doors total.
- **dropArea = "50+".** Heavy trailer drop yards on both faces with multiple
  rows of parked trailers.
- **shipRcvSeparate = true (uncertain).** Two physically separate dock
  clusters on different building faces — consistent with separate
  shipping/receiving; the operational split cannot be confirmed from imagery.
- **fastLaneOpportunity = true (uncertain).** Wide aprons and a long private
  approach leave ample room for a bypass lane.

## Yard zones and counts
- **perimeter:** ~665 m N-S x ~760 m E-W ≈ 110 acres (large campus parcel
  including yards and wooded buffer).
- **dropYards / dockAprons:** two each — NW face and SW/SE face.
- **staging:** not clearly identifiable; left null.
- dockDoorCount ~120, trailersVisible ~110, trailerParkingCapacity ~160,
  truckGateCount 1, buildingCount 1, railServed false.

## Web findings
Niagara Bottling Hazle Township opened March 2022; ~1.19M sq ft of advanced
manufacturing for purified water and aseptic beverages (protein shakes,
ready-to-drink coffee). ~290 employees, growing toward 350+. $440M+ capital
investment. Single-building plant. No rail spur observed.

## Setting
Rural: Humboldt Industrial Park in Hazle Township, PA — an industrial park
amid woodland and reclaimed land, set well back from the public road behind a
wooded buffer. Judged Rural.

## Final confidence
**Medium.** Building positively confirmed via web search and imagery, and
the dock/yard scale is clear. However, the truck gate and guard shack could
NOT be positively confirmed from satellite or Street View (private driveway,
no SV coverage, insufficient resolution at the approach). Both, plus
ship/rcv-separate and the lane counts, are flagged in uncertainFields. The
archetype (#10) depends on the inferred gate+GS — treat as provisional and
a candidate for human review.
