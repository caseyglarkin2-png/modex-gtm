# Deep-Audit Dossier — Caterpillar Tejon Ranch (Lebec) CA Parts Distribution Center (idx 21)

## Resolved location — LOW CONFIDENCE on exact building
- Roster had **no street address** ("Tejon Ranch Commerce Center, Lebec, CA 93243",
  geocode precision APPROXIMATE). The supplied lat/lng (34.841644,-118.864819) sat
  in hilly terrain near I-5 ~16 km SOUTH of the actual facility — wrong location.
- Web research (Tejon Ranch Co., Clayco/LJC design-build) confirms the facility IS
  at the **Tejon Ranch Commerce Center (TRCC)**, at the junction of Interstate 5 and
  Highway 99 near Lebec / the foot of the Grapevine south of Bakersfield. It is a
  **409,000 sq ft one-level tilt-up parts distribution center** plus a **200,000 sq
  ft outdoor oversized-parts storage area**, on a **46-acre site**, a $50M facility
  dedicated January 2013, serving Cat dealers across the western US.
- **Best-match building locked at ~35.0012, -118.9405** — see below. This could not
  be positively confirmed via signage as Caterpillar versus an adjacent TRCC tenant.

## Key views
- z14-z15 probes: located TRCC — a cluster of large distribution warehouses along
  I-5 and E of Wheeler Ridge Rd, with a retail/outlet area to the S, surrounded by
  farmland and open hills.
- z17-z19 of the candidate building: a large (~400k+ sq ft) one-level distribution
  building with clear **two-phase construction** (an original white-roof section
  plus a grey-roof expansion section) — consistent with the documented "room next
  door for an additional 350,000 sq ft"; a large outdoor yard on the E side
  consistent with the 200,000 sq ft oversized-parts outdoor storage; dock doors on
  the S face; employee car parking on the W.
- Street View (2025-01): coverage only along Wheeler Ridge Rd ~600 m W; the building
  itself had no usable SV for signage. Active construction/expansion visible in the
  2025 imagery.

## Gate / guard-shack / dock determinations
- **truckGate = true (flagged).** Modern distribution warehouse; the truck dock yard
  on the S/E side is typically gated/fenced. Not positively imaged at booth/barrier
  level.
- **guardShack = false / remoteGs = true (flagged).** No guard booth imaged;
  remote-check-in assumed. All gate fields are low-confidence given the building
  itself could not be positively confirmed.
- **dockDoors = "25-50".** Dock doors run along the S building face; estimated ~24 —
  flagged (overhead estimate, limited imagery resolution).
- **dropArea = "25-50", dropYard = true.** A large outdoor yard E of the building
  used for oversized-parts storage and trailer staging.

## Yard zones and counts
- **Perimeter:** ~46 acres per the Tejon Ranch Co. land-acquisition press release
  (box 34.9995-35.0031 N, -118.9425 to -118.9372 W).
- **Drop yard:** large outdoor oversized-parts storage / trailer staging yard E of
  the building.
- **Dock apron:** S building face, ~24 doors.
- **buildingCount = 1** (one building with an original section + expansion).
- **railServed = false** — TRCC warehouses are truck-served; the rail line follows
  the I-5 corridor but does not enter the site.
- **urbanRural = Rural** — TRCC is at the foot of the Grapevine surrounded by
  farmland and open hills.

## Web findings
- Caterpillar Logistics Inc. acquired 46 acres at TRCC; 409,000 sq ft one-level
  tilt-up parts distribution center + 200,000 sq ft outdoor oversized-parts storage;
  $50M, dedicated Jan 2013; serves Cat dealers/customers across California and the
  western US; ~150 employees. (Clayco/LJC design-build.)

## Final confidence: low
The facility is firmly established as being at TRCC, and a strong-match building was
identified, but the exact building could not be positively confirmed via signage and
the roster supplied no usable address or coordinates. coords, gate fields, and all
counts are flagged. Recommended for human review to confirm the exact building.
