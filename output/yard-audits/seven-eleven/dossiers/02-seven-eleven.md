# Deep-Audit Dossier — 7-Eleven Distribution Co Cold Storage DC

- **Facility:** 7-Eleven Distribution Co Cold Storage DC (Grocery DC)
- **Address:** 12330 Lakeland Road, Santa Fe Springs, CA 90670
- **Resolved center:** 33.93065, -118.0685
- **Confidence:** high
- **Method:** deep-audit (probe.ts satellite + Street View, web research)

## Step 0 — Locating the building

The supplied city-level coords (33.930856, -118.068625) landed inside a dense
Santa Fe Springs industrial cluster, right at the south dock court of a large
distribution warehouse on the south side of Lakeland Rd. Web research confirmed
the address: 7-Eleven signed a 7-year lease on **146,326 SF** of warehouse /
distribution space at **12330 Lakeland Rd**, including ~35,000 SF of new cooler
and a 10,000 SF freezer (RGA architect, NWS / Norm Wilson & Sons GC). A neighbor,
Crate & Barrel, is at 12434 Lakeland Rd, confirming building numbering along the
street.

Street View on Lakeland Rd (Jan 2025) and stepped satellite probes (z16–z21)
positively identified the building: the large rectangular DC on the **south side
of Lakeland Rd**, office/lobby front + employee lot + lawn facing the road
(north), and a long dock bank + deep trailer court on the **south** (interior)
face. Roof carries a faint building code "9422". This is the audited building.

## Key views

- **Wide (z16/z17):** Lakeland Rd runs roughly E-W (block grid only a few degrees
  off true north). Our DC sits south of Lakeland; a separate DC sits further SW;
  a vacant graded lot is immediately west; an apartment complex and landscaped
  scrub buffer lie to the SE/south.
- **Building (z18):** office front + parking + tree-lined lawn on the north
  (Lakeland) side; continuous dock bank along the south face with trailers backed
  in; deep paved truck court behind, filled with rows of drop trailers.
- **Docks (z19):** one long continuous south dock bank, **50+ doors** with
  trailers backed in across the full building width; additional E-series dock
  doors (labels E06, E09 seen in Street View) on the **west** wall opening to the
  drive.
- **Truck court (z18/z20):** large interior court with multiple rows of parked
  (drop) trailers plus a teardrop turnaround loop at the SW where the west drive
  meets the court.

## Gate / guard-shack / dock determinations

- **Truck gate — FALSE.** The only public-road truck access is the **west
  driveway off Lakeland Rd**, which runs south down the building's west side into
  the court. The z21 satellite and Jan-2025 Street View at the property line show
  **open pavement with only a painted "STOP" bar** — no barrier arm, no
  sliding/swing gate, no checkpoint pinch-point. Trucks were seen freely entering
  and staged along the open drive.
- **Guard shack — FALSE.** No booth structure at the entrance or along the drive
  in any satellite or Street View frame. The building lobby fronts Lakeland Rd but
  there is no truck-gate guard booth.
- **Remote GS — FALSE.** No controlled gate at all, so not a kiosk/call-box gate.
- **Perimeter:** the property is fenced on portions of its boundary — a wall +
  chain-link with privacy screen along the south edge, a fence line against the
  east-neighbor properties, and a fence on the west drive edge against the vacant
  lot — but the truck **entrance** from the public road is uncontrolled / open.
  Net classification is an open, ungated yard (Kraft "No Gate / No GS" archetype).
- **Dock doors — 50+.** Continuous south bank plus west-face E-series doors.
- **Drop area / drop yard — TRUE, 50+.** Dedicated trailer-storage rows fill the
  interior court, distinct from the active dock apron.
- **Post-gate / driveway depth:** deep court holds queued/staged trailers
  (post-gate staging true); the Lakeland→court approach easily holds 3+ trucks
  (drivewayLong true).

## Yard zones & counts measured

- **perimeter** — oriented ring around the fenced property (building + court +
  parking), ≈ **14 acres**.
- **truckGate** — quad over the west drive mouth at Lakeland Rd (the open
  entrance). SV pano `TitYWlr0p01pOtxRd9dP1A`, heading 174° (south into the drive).
- **dropYards** — one ring over the interior trailer-storage court.
  SV pano `TnuhyeO0YDAJMdepupEjXg`, heading 80° (ENE into the court).
- **dockAprons** — two rings: the long south dock apron and the west-wall apron.
- **perimeter SV** — pano `Ic32PK_vo0QwbZNqyR5FbQ` on Lakeland Rd, heading 179°
  (south at the building front).
- **yardMetrics:** dockDoorCount ≈ 60, trailersVisible ≈ 75, capacity ≈ 90,
  truckGateCount 1, buildingCount 1, siteAreaAcres 14.0, railServed false.

## Web findings

- 7-Eleven Distribution Company, 12330 Lakeland Rd, Santa Fe Springs CA 90670,
  (562) 906-0257 — cold-storage warehouse / frozen prepackaged foods.
- 146,326 SF lease incl. 35,000 SF cooler + 10,000 SF freezer (REBusinessOnline);
  TI by NWS / Norm Wilson & Sons, architect RGA.
- Setting: Los Angeles County, LA–Long Beach–Anaheim metro — dense urban
  industrial fabric.

## Uncertainty

- **dropArea** count and **shipRcvSeparate** are overhead estimates; could not
  confirm two physically separate ship/receive dock clusters (one continuous
  south bank observed), so shipRcvSeparate marked false at lower confidence.
- All gate/guard/dock calls are high confidence from clear Jan-2025 Street View
  plus z19–z21 satellite.

## Final confidence: HIGH
