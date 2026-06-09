# Deep-Audit Dossier — Stop & Shop Grocery Distribution Center, Manchester CT

- **idx:** 3
- **Facility:** Stop & Shop Grocery Distribution Center Manchester CT (ADUSA Supply Chain / Ahold Delhaize)
- **Type:** Grocery Distribution Center (nonperishable grocery)
- **Address:** 1339 Tolland Turnpike, Manchester, CT 06042
- **Resolved center:** 41.79950, -72.56450
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation

The supplied coordinates (41.800132, -72.566458) landed on the northwest edge of a
very large white-roofed industrial building. Wide satellite (z15-z17) showed a single
massive distribution structure set on a wooded 160-acre tract at the I-84 / I-291
crossroads, with extensive truck/trailer parking, dock aprons on multiple faces, and
employee parking to the north — unmistakably a DC, not an office.

Web research confirmed the building: ADUSA Supply Chain (Ahold Delhaize) opened a
~1M sq ft nonperishable grocery DC here that handles **88M cases/yr for 450+ Stop &
Shop stores**. The structure itself is a **1.97M sq ft multi-tenant building leased to
ADUSA, Amazon and J.C. Penney** (Winstanley Enterprises portfolio listing; Hartford
Business Journal; ADUSA news release). The Stop & Shop / ADUSA grocery operation
occupies roughly half of it. This is the correct site. Locked center at 41.79950,
-72.56450 (building centroid).

## Building & orientation

One very large blocky building, rotated a few degrees clockwise from north (long top
edge runs WSW–ENE). Because it sits at an angle, all traced zones are rotated quads
parallel to the building faces, not north-aligned boxes. buildingCount = 1 (single
structure, multi-tenant — not a campus, so `multipleFacilities` = false).

## Key views

- **Wide / context (z15-z17):** full footprint, I-84 + a rail line along the south/east
  corridor, retail center to the north, dense residential to the NW. Suburban Hartford
  metro fabric → **Urban**.
- **South face (z19):** long continuous bank of dock doors with trailers backed in, a
  deep dock apron, and rows of parked drop trailers beyond — a major dock + drop yard.
- **North / NE face (z18):** second dock bank, employee parking, and the internal ring
  road; a fenced tractor/trailer yard on the east side.
- **Entrance (z18-z20 + Street View):** the private entrance drive runs ~250 m off
  Tolland Turnpike to a signalized intersection, then curves into the property's
  internal ring road.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** Street View pano `2apIDFN15pFRgnMZk3JXLg` (2023-11), taken on
  the internal ring road at 41.80302, -72.56212, looking ESE, clearly shows a **rolling
  chain-link sliding gate across a fenced tractor/trailer yard**, with tractors and
  trailers inside and continuous perimeter fence. The west-facing frame from the same
  pano shows the fence line continuing along the building's east face. The public-road
  mouth at Tolland Turnpike is open (Google's car drove the private road in 2023), so
  vehicle control is at the fenced yard gates rather than a road-edge arm.
- **guardShack = FALSE.** No staffed booth at the property entrance or at any fenced
  yard gate in either Street View or satellite imagery. The gates are plain rolling
  chain-link with no adjacent ≈1–3-space booth structure.
- **remoteGs = TRUE.** Gate present, no guard shack → badge / kiosk / app check-in
  implied. Flagged medium-confidence in `uncertainFields`.
- **dockDoors = 50+.** Counted the regular dock-door rhythm and backed trailers along
  both the long south face and the north face — well over 50 total. Overhead estimate
  ~170 doors.
- **dropArea / dropYard = 50+ / TRUE.** Multiple dedicated lots of trailers parked
  without tractors: a large south drop yard plus fenced north/east tractor-trailer
  lots, distinct from active dock staging.

## Yard zones & counts

- **perimeter:** 8-vertex oriented ring tracing the developed operating envelope
  (building + all parking + drop yards + fenced buffer). Computes to ~93 acres; the
  full undeveloped parcel is ~162 acres per the Winstanley listing.
- **truckGate:** quad over the east fenced-gate area on the internal ring road.
- **dropYards:** two rings — the south drop yard and the north/east fenced trailer lots.
- **dockAprons:** two long thin quads hugging the south and north dock faces at the
  building's angle.
- **staging:** null (no distinct pre-/post-gate stall block traced; queue room is the
  internal aprons).
- **yardMetrics:** dockDoorCount ~170, trailersVisible ~180, trailerParkingCapacity
  ~320, truckGateCount 1, buildingCount 1, siteAreaAcres ~93, railServed **false**
  (rail runs along the I-84 corridor on the edge but does not spur into the property).

## Street View metadata

- **perimeter:** pano `Sa8fi6hCRwwRNpUm5P74OQ` (2023-11) at 41.79662, -72.56200 on the
  south ring road, heading 327° toward the building. hasCoverage true.
- **truckGate:** pano `2apIDFN15pFRgnMZk3JXLg` (2023-11) at 41.80302, -72.56212,
  heading 113° toward the fenced sliding gate. hasCoverage true. This is the most
  valuable single frame — it shows the actual gate a driver passes.

## Web findings

- ADUSA Supply Chain (Ahold Delhaize) — 1M sq ft nonperishable grocery DC, 88M cases/yr
  for 450+ Stop & Shop stores; ~500–700 jobs. (ADUSA / Ahold Delhaize newsroom;
  Progressive Grocer; Hartford Business Journal.)
- Building is 1.97M sq ft, built early 1980s on a ~162-acre tract, multi-tenant
  (ADUSA, Amazon, J.C. Penney). Strategically at the I-84 / I-91 / I-291 crossroads.
  (Winstanley Enterprises portfolio listing.)

## Final confidence: HIGH

Building identity and gate/dock/yard determinations are well supported by clear 2023
Street View on the internal road plus high-zoom satellite. Medium-confidence items
(remoteGs, lane counts, exact door count, ship/receive separation) are listed in
`uncertainFields`.
