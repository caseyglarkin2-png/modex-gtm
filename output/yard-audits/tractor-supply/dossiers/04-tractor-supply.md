# Deep-Audit Dossier — Tractor Supply Distribution Center, Casa Grande AZ (idx 04)

**Facility:** Tractor Supply Company DC #111
**Address:** 1337 N Peters Rd, Casa Grande, AZ 85193
**Resolved center:** 32.8617, -111.7891
**Type:** Distribution Center
**Method:** deep-audit (satellite + Street View)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied coordinates (32.86227, -111.788668) landed directly on a large
white-roofed distribution building. Web search confirmed this is **Tractor
Supply Company DC #111**, 1337 N Peters Rd, Casa Grande AZ 85193 — a regional
distribution center known for 24/7 drop-and-hook operations (driver reviews,
Casa Grande Chamber of Commerce listing, USGBC project page). Street View
(captured Jan 2025) shows the "TSC" logo on the building's north wall, removing
any ambiguity. Resolved building center fixed at 32.8617, -111.7891.

Setting: edge-of-town Casa Grande industrial fringe — active farmland abuts the
west fence, open desert to the east and south, other large DCs nearby to the
NE. Judged **Rural**.

## Key views

- **z16 / z17 overview:** rectangular DC with an L-shaped south/SE wing, full
  chain-link perimeter, employee parking at the NE, trailer drop yards running
  the full length of both the west and east sides.
- **z18 north edge:** public road (Peters Rd) along the top; an internal
  perimeter access road runs the whole north edge inside the fence.
- **z20 NE entry:** the main truck gate — painted lane islands/medians with
  directional arrows where the drive meets the road (controlled checkpoint).
- **z21 NW gatehouse drive:** a small ~1-vehicle-footprint booth structure
  sitting in the paved entry island — the guard shack.
- **Street View (Jan 2025):** confirmed perimeter fencing across the frontage,
  the entry driveway with signage and a checkpoint, and the TSC building.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled multi-lane truck entrance at the NE corner
  off Peters Rd. Satellite z20 shows lane islands and directional-arrow lane
  markings at the property line; Street View confirms a fully fenced frontage
  with a single signed entry driveway.
- **guardShack = true.** A small booth (~1 vehicle footprint) sits in the paved
  entry island on the NW gatehouse drive (z21 @ 32.86343, -111.79052),
  positioned to control inbound truck circulation. Driver reviews describe a
  staffed shipping office / 24-7 check-in, consistent with a manned gate. Because
  a guard shack is present, **remoteGs = false.**
- **dockDoors = "50+".** Long banks of dock doors on both the west and east
  building faces with trailers backed in; estimated ~90 doors total.
- **dropArea = "50+" / dropYard = true.** Two large dedicated trailer-storage
  yards (west and east), each with two long rows of parked trailers without
  tractors. 50+ band.

## Yard zones and counts

- **perimeter** — ~64.7 acres, near-north-aligned fenced rectangle traced from
  the access road (N), dirt road / farmland (W), and desert fence lines (E/S).
- **truckGate** — NE multi-lane entry quad at the Peters Rd checkpoint.
- **staging** — postGate paved apron between the gate line and the building face
  (interior queue room before docks).
- **dropYards** — [west drop yard along the W fence; east drop yard along the E
  fence], each an oriented quad parallel to the trailer rows.
- **dockAprons** — [west dock apron; east dock apron], long thin quads hugging
  each dock wall.
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~140, capacity ~220,
  truckGateCount 1, buildingCount 2 (main DC + smaller south building),
  siteAreaAcres 64.7, railServed false.

## Classification highlights

- **postGateStaging = true, drivewayLong = true** — deep gate-to-dock apron
  holds 3+ trucks.
- **entryExitTogether = true** — single gate group at the NE.
- **entryLanes = 2, exitLanes = 1** (exit count partly obscured — uncertain).
- **fastLaneOpportunity = true** — wide multi-lane apron with spare paved width.
- **shipRcvSeparate = true** (medium confidence) — dock clusters on opposite
  building faces.
- **backupSensitive = false** — large stacking apron; queue would not spill to
  the public road.
- **scale / multiStep / multipleFacilities = false.**
- **urbanRural = Rural; connectivityIssue = false** (near other DCs; low conf).

## Web findings

- Tractor Supply DC #111, Casa Grande — regional distribution center.
- 24/7 drop-and-hook; drivers report ~1-hour unloads, friendly staff, clean
  driver restroom in the shipping office, no overnight parking on-site.
- 4.0-star rating across 171 reviews (truck-stop / DC review aggregators).

## Street View metadata

Coverage exists on Peters Rd at the NE frontage (pano @ 32.864742,
-111.788403, captured Jan 2025).
- truckGate: hasCoverage true, heading 153° (from frontage pano toward gate).
- perimeter: hasCoverage true, heading 186°.
Pano IDs left blank (probe.ts resolves the nearest pano at render time; no id
was invented).

## Final confidence: high

Facility identity unambiguous, building footprint and both entries clearly
read, gate and guard shack visually confirmed. Uncertain: exact exit-lane
count, ship/receive separation, and the inferred connectivity flag.
