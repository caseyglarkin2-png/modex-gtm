# Deep-Audit Dossier — K-C New Milford Mill (idx 05)

## Facility
- **Name:** K-C New Milford Mill — New Milford, CT
- **Type:** Diaper & tissue manufacturing plant (Kleenex facial tissue; ~350
  employees; operating since the late 1970s)
- **Roster address:** Pickett District Rd, New Milford, CT 06776
  (street number 58 Pickett District Rd per web research)
- **Resolved center:** 41.55833, -73.41361

## Step 0 — Location confirmation
The roster geocode (41.552736, -73.410492; geometric-center, moved 2 m) landed
in the New Milford industrial park but ~600 m southeast of the actual mill. Web
research resolved the precise location: gridinfo.com lists the Kimberly-Clark
power-plant units (the mill's on-site boilers) at **41.55833, -73.41361**, and
Yelp / paper-world.com confirm the K-C New Milford Mill at 58 Pickett District
Rd. A z17 probe at the gridinfo coordinates showed a large active manufacturing
complex (steam plumes, multi-building mill, drop yards) — the correct site.
Center moved to the mill building mass.

## Key views
- **Wide z16/z17:** Large manufacturing complex along the Housatonic River — main
  mill, an attached utility/boiler plant, office buildings on the Pickett
  District Rd frontage, and a wastewater treatment area to the NE. Dense
  industrial/commercial fabric around it.
- **Mill core (z17/z18):** Connected manufacturing buildings with visible steam —
  active operation; trailers parked in rows in the drop yard.
- **Drop yard (z19):** Rows of angled-parked trailers — ~60 trailers across the
  yards north of the mill and a secondary yard to the SE.
- **Rail (z19):** A rail line runs along the river on the property's east edge
  with boxcars/hoppers parked on it — consistent with a rail siding serving the
  mill (spur connection partly tree-obscured).
- **Frontage (Street View 2019/2022):** Pickett District Rd frontage shows K-C
  office buildings and parking; no truck gate on this frontage. Internal-road
  Street View coverage is unavailable.

## Gate / guard-shack / dock determinations
- **truckGate = false (flagged uncertain):** No barrier arm or staffed checkpoint
  was visible in satellite imagery, and Street View only covers the office
  frontage (no gate there). A controlled gate on the internal truck-yard road
  cannot be confirmed or ruled out from available imagery — flagged.
- **guardShack = false:** No guard booth visible at any imaged entrance.
- **remoteGs = false:** No controlled gate identified.
- **Docks:** ~25 doors estimated — banded **25-50**; much of the building face is
  obscured by process equipment. Multiple dock faces / drop yards on different
  building faces → shipRcvSeparate = true.
- **railServed = true (medium confidence):** Rail line with parked rail cars on
  the property's river edge — flagged uncertain because the spur tie-in is
  partly obscured.

## Yard zones & counts
- **perimeter:** ~75 acres — the mill campus between Pickett District Rd and the
  Housatonic River.
- **dropYards:** North yard near the main mill + a secondary SE yard; ~60
  trailers visible, capacity ~110.
- **dockApron:** Apron along the mill's north building face.
- **staging:** Paved yard inside before the docks → postGateStaging.
- **buildingCount ≈ 5; scale** not visible — flagged uncertain.

## Web findings
- Yelp / paper-world.com / D&B: Kimberly-Clark New Milford Mill, consumer
  products, 58 Pickett District Rd, New Milford CT 06776.
- gridinfo.com: on-site Kimberly-Clark natural-gas power units (the mill's
  boilers) — pinned the precise coordinates.
- Patch / Hartford Business: ongoing PFAS-contamination litigation tied to a
  K-C New Milford landfill — corroborates a long-running manufacturing presence.

## Confidence
**Medium.** Facility unambiguously identified after correcting the roster
geocode; the campus layout, drop yards, and dock faces are clear. The gate /
guard-shack determination and the rail-spur tie-in are the soft points — limited
Street View coverage and tree cover leave residual uncertainty; all flagged.
