# Deep-Audit Dossier — Stop & Shop Fresh DC Schodack Landing NY (ADUSA DC02)

- **Account:** Stop & Shop (ADUSA Supply Chain / Ahold Delhaize USA)
- **Facility idx:** 4
- **Type:** Fresh DC
- **Address:** 970 Route 9 (US Highway 9), Schodack Landing, NY 12156
- **Resolved center:** 42.49530, -73.66950
- **Method:** deep-audit (satellite zoom 16-20 + Street View 2025-08 + web research)
- **Confidence:** high

## Step 0 — Location confirmation
Supplied coordinates (42.494917, -73.669953) landed directly on a large
multi-building industrial distribution complex set back in the woods east of
NY Route 9 — consistent with a Fresh DC, not an office. Web research confirms
970 US-9, Schodack Landing NY 12156 is **ADUSA Distribution DC02**, the
Ahold Delhaize self-distribution facility serving Stop & Shop and Hannaford
(fresh/frozen/grocery mix), phone (518) 766-2912. The ADUSA monument sign is
visible at the entrance in Street View, confirming operator identity. Center
locked at the building complex centroid 42.49530, -73.66950.

## Key views and what they showed
- **Wide satellite (z16-z17):** L-shaped / stepped main DC oriented NW-SE
  (clearly rotated off north), continuous dock-and-trailer face along the
  east/southeast wall, a separate satellite dock building to the south,
  office + maintenance buildings on the west, large employee parking to the
  NW, and extensive multi-row trailer drop yards. East of the wood line is
  cleared scrub land that is NOT part of the active paved yard.
- **Entrance (z18-z20 + Street View):** the access road leaves Route 9 in the
  NW, passes employee parking, and forks around a grass median toward the
  yard. Street View (2025-08) at the road mouth (pano OKN39rLh2ODGor9noaGf6Q,
  42.49715,-73.67242) shows the ADUSA sign, a guardrail, and chain-link
  perimeter fencing — but an **open driveway** with no barrier arm, gate, or
  staffed checkpoint. Street View ends at the entrance approach; the private
  yard is not driven.
- **Dock face (z19-z20):** dense, regular dock-door rhythm with trailers
  backed in running the full length of the east/SE building face (300m+), plus
  a parallel row of drop trailers across the apron drive.
- **Drop yards (z19-z20):** a dedicated 3-row trailer-storage lot to the
  southeast (dozens of trailers), additional trailer rows east of the building
  and along the west edge.

## Gate / guard-shack / dock determinations
- **truckGate = false (uncertain):** entrance off Route 9 is an open driveway.
  No barrier arm, sliding/swing gate, or checkpoint pinch-point across the
  truck lane at the public road in Street View; no gate/booth at the
  office-to-yard transition or on the perimeter service drive in z19/z20
  satellite. Chain-link fencing is present but the lane itself is uncontrolled.
  Flagged uncertain because a movable interior gate beyond Street View reach
  can't be 100% excluded from overhead.
- **guardShack = false:** no small staffed-booth footprint (1-3 spaces, multi-
  side windows) at the entrance, the yard transition, or the perimeter loop in
  any zoom-19/20 frame or in Street View. A structure first suspected near the
  road fork resolved to tree shadow on closer zoom.
- **remoteGs = false:** requires a gate-without-shack; no gate present.
- **dockDoors = 50+:** continuous door bank with backed-in trailers along the
  entire east/SE face; estimated ~90 doors.
- **dropArea = 50+ / dropYard = true:** multiple dedicated trailer-storage
  rows; ~130 trailers visible, est. capacity ~180.

## Yard zones and counts measured
- **perimeter:** 7-vertex oriented ring tracing the active fenced/paved campus
  (NW entrance corner around the building complex and SE drop yards to the wood
  line). **~46.4 acres.**
- **truckGate zone:** small oriented quad at the Route 9 entrance fork apron.
- **dropYards:** two rings — the SE 3-row storage lot and the trailer rows east
  of the building.
- **dockApron:** long thin quad hugging the east dock wall at the building's
  NW-SE angle.
- **staging:** null (no distinct dedicated pre/post-gate staging pad isolated;
  ample internal holding room exists, captured by postGateStaging flag).
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~130, capacity ~180,
  truckGateCount 1, buildingCount 4, siteAreaAcres 46.4, railServed false.
- **streetViewMeta:** truckGate pano OKN39rLh2ODGor9noaGf6Q (heading 108°,
  coverage true); perimeter pano XgRDyOPCKP-gb1CSsQz2EA (heading 159°, coverage
  true). Drop-yard centroid returned ZERO_RESULTS (no interior coverage).

## Web findings
- ADUSA Distribution DC02, Schodack Landing NY — Ahold Delhaize USA self-
  distribution arm; receives/stores/ships fresh, frozen, grocery and HBC for
  the network's local brands (Stop & Shop, Hannaford, Food Lion, Giant, etc.).
- Roster source notes corroborate DC02 designation and the 970 Route 9 address
  (ADUSA jobs pages, Yahoo Local, TruckMap, Yellow Pages).

## Final confidence
**high.** Facility identity and footprint are unambiguous, imagery is clear at
the docks, drop yards, and entrance. Open-gate / no-guard-shack calls are
well-supported by both Street View and satellite but carry residual
uncertainty because Street View does not enter the private yard — hence
truckGate and guardShack are listed in uncertainFields.
