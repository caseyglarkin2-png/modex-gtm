# Deep-Audit Dossier — idx 55

## Facility
Kroger Mid-Atlantic Distribution Center — 3800 Garman Rd, Salem, VA 24153
Type: Distribution Center (grocery; reefer + dry)
Resolved center: **37.27620, -80.12000** | mapsUrl in JSON

## Step 0 — Location confirmation
Supplied coords (37.275555, -80.120874) landed directly on the target. A z16/z17
satellite sweep showed an enormous single white-roofed distribution building
running NW-SE (rotated ~35-40° off north), with a multi-track rail line hard
against its north edge, extensive trailer parking and dock doors along the south
and SE faces, rooftop/lot solar arrays, and a separate fleet/trailer-maintenance
building cluster to the SW. FCC ULS license registers the site as "Kroger
Mid-Atlantic Distribution Center"; it supplies 100+ Kroger stores across VA/WV/
KY/TN/OH. Positively the right building — a large grocery DC, not an office.

## Key views
- **z16/z17 wide:** full footprint, rail on N, highway (Rt 460/W Main St) on NW,
  creek + ball fields on S/SE, solar + trailer lot on the E end.
- **z18-20 north edge:** multiple parallel rail tracks abutting the building =
  rail-served; rail loading area with material/trailers.
- **z19 south/SE dock:** long row of dock doors with trailers backed in on the
  south wall, a second dock bank at the SE end, plus a free-standing
  refrigeration/canopy structure in the yard. 50+ doors across faces.
- **z19 NW:** employee parking fronting the Rt 460 signalized intersection;
  truck/trailer staging lot beside it.
- **Street View (2019-06, pano elgP-CVBZiz-L8rpZBU9_Q @ 37.27801,-80.12366):**
  the outer truck-staging/overnight lot — open paved area with tractors and
  reefer trailers queued, Blue Ridge mountains behind. No gate at the public
  frontage; the controlled gate sits further in on the private drive (no SV).

## Gate / guard-shack / dock determinations
- **truckGate = true.** Access is via a private drive off the Rt 460 signalized
  intersection, not open road frontage. Driver reviews: "Check in at main gate.
  Wait for text."
- **guardShack = true.** Reviews explicitly describe a manned **main gate** and a
  **second guard shack** for check-in/check-out. remoteGs = false.
- **multiStep = true.** Confirmed two-stage entry: main gate → wait-for-text dock
  assignment → second guard shack before docks.
- **preGateStaging = true / postGateStaging = true.** Outer staging+overnight lot
  near the highway (reviews: ~20-25 angled overnight spots) ahead of the gate;
  paved internal queue space before docks.
- **dockDoors = 50+.** Long south dock wall + SE dock bank, many trailers backed
  in; reviews reference door 100+. shipRcvSeparate = true (multiple dock faces).
- **dropYard = true / dropArea = 50+.** Large trailer drop lots on the SW staging
  side and the E solar-adjacent lot.
- **scale:** none clearly visible and no review mentions one — flagged uncertain.

## Yard zones & counts (overhead estimates)
- Perimeter traced as a 10-vertex ring at true ~37° orientation following rail
  (N), highway/staging (NW), creek/treeline (S), solar-lot edge (E). ~78 acres.
- truckGate quad on the inner private drive; staging quad on the outer lot; two
  dropYard quads (SW staging + E lot); two dockApron strips along the south and
  SE dock walls, edges parallel to the building.
- dockDoorCount ~110, trailersVisible ~180, capacity ~260, buildingCount 3,
  railServed true, truckGateCount 1.

## Web findings
- ~2.6-star driver rating (mixed); SMS dock-notification workflow; meat/reefer to
  door 100; limited angled overnight parking; variable detention; open ~24h,
  closed Wed/Fri. Norfolk Southern rail access (I-81 corridor) consistent with
  the visible spur. Kroger Mid-Atlantic grocery DC.

## Confidence: HIGH
Gate + guard shack + multi-step entry corroborated by both imagery and driver
reviews. Uncertain: presence of a truck scale, exact lane counts, exact door
count (banded 50+).
