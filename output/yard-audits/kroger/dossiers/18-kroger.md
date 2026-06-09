# Deep-Audit Dossier — Kroger Customer Fulfillment Center, Dallas TX (idx 18)

- **Facility:** Kroger Customer Fulfillment Center Dallas TX (Ocado-automated CFC, "The Hive")
- **Address:** 4200 Cleveland Rd / 4241 Telephone Rd, Dallas, TX 75241 (I-20 inland-port corridor)
- **Resolved center:** 32.63794, -96.75375
- **Confidence:** high
- **Method:** deep-audit (satellite probe + Street View + web research)

## Step 0 — Location confirmation

The roster's approximate point (32.641617, -96.75385) is the rooftop geocode of
"4200 Cleveland Rd," which lands on open/wooded land and the public road just
*north* of the actual building. Web research (PRNewswire/Kroger IR press release,
Reuters Events, Supermarket News) places the CFC on a 55-acre tract **south of
I-20** at the corner of 4200 Cleveland Rd and 4241 Telephone Rd: a 350,000 sq ft
highly-automated Ocado "shed" (1,000+ bots over a 3D grid), opened summer 2022,
serving Dallas-Fort Worth e-grocery delivery.

Geocoding "Kroger Fulfillment Center Dallas TX" with the project key returned
4221 Telephone Rd, 32.6379, -96.7537 — directly on the large white building seen
~350 m southwest of the roster point. Satellite probes (z15 → z21) confirmed a
single large rectangular building with a distinctive tall bright-white central
volume (the Ocado Hive grid) and lower wrap-around roof, ringed by a concrete
apron, employee car parking to the east/southeast, a van staging lot to the
south, and a truck court with utility/MEP buildings to the southwest. This is the
CFC. Locked center: 32.63794, -96.75375.

## Key views

- **Wide satellite (z15-18):** dense south-Dallas / I-20 DC corridor; the CFC is
  one building on its own fenced parcel, wooded undeveloped land to the west,
  Telephone Rd on the east, the access road (Cleveland Rd) on the south.
- **z18-21 overhead:** building rotated ~35° off north (long axis NW-SE). Tall
  white Hive volume center; lower roof on the east. Concrete apron all sides.
- **Street View south road (pano JN2dM160Jh-ODXOFYRZS_A, 2026-04, heading 0):**
  the main entrance — a wide open driveway gap in the perimeter fence, a "Kroger"
  monument sign on the right, rows of blue Kroger Delivery vans lined up inside.
  **No barrier arm, no guard booth, no checkpoint pinch-point.**
- **Street View Telephone Rd (2026-02, heading ~250):** continuous black
  ornamental/chain-link perimeter fence along the east frontage; employee parking
  and the long building wall behind it. Confirms the site is fenced but the
  vehicle entrance is uncontrolled.

## Gate / guard-shack / dock determinations

- **truckGate = false.** The property is perimeter-fenced, but the single main
  entrance off the south access road is an open, uncontrolled driveway opening —
  no arm, no sliding gate, no staffed pinch-point. Verified ground-level.
- **guardShack = false.** No booth at the entrance in any heading. The only small
  structures on site are utility/MEP buildings (generator / refrigeration plant,
  inside their own small fenced compound) deep in the SW truck court — not a
  gatehouse.
- **remoteGs = false.** No controlled truck gate exists, so this is false (not a
  kiosk/call-box situation either).
- **Docks (10-25):** a modest dock bank runs along the building's west/southwest
  wall; a couple of trailers/box trucks seen backed in at z20-21. Consistent with
  an automated CFC — bulk inbound by trailer, outbound by delivery van, so far
  fewer doors than a conventional 350k sq ft DC.

## Yard zones and counts measured

- **perimeter** — 7-vertex polygon tracing the fenced/paved operational footprint
  (north apron, east/SE car parking, south van lot, SW/west truck court). Area
  ≈ 33.8 acres. (Press cites a 55-acre tract; the balance is undeveloped wooded
  land west of the fence, excluded from the operating geofence.)
- **truckGate** — quad over the south entrance opening + immediate apron.
- **dropYards** — one ring over the south van staging lot (marked van stalls for
  the blue Kroger Delivery fleet; ~20-30 stalls, banded 10-25 as `dropArea`).
- **dockAprons** — one ring: long thin quad hugging the west dock wall at the
  building's ~35° angle.
- **staging** — north apron (open paved holding/turn area north of the building).
- **streetViewMeta** — truckGate: pano JN2dM160Jh-ODXOFYRZS_A heading 0 (the
  driver's arrival frame). perimeter: pano 5qHwwndjarKOefd_cm6WYg heading 317
  (oblique of the building + east parking).
- **yardMetrics** — dockDoorCount ≈ 20, trailersVisible ≈ 6, trailerParking
  capacity ≈ 30, truckGateCount 1, buildingCount 1, siteAreaAcres 33.8,
  railServed false. Overhead estimates; flagged in uncertainFields.

## Web findings

- Kroger + Ocado fifth US CFC; 350,000 sq ft; 1,000+ bots ("The Hive");
  18,000 orders/day; ~400 jobs; works with spoke sites in Austin, San Antonio,
  Oklahoma City; opened summer 2022. Tax-abatement-backed development on a
  55-acre south-Dallas (District 8 / inland-port) tract.
- Sources: PRNewswire 300917395; Kroger IR 2019 release; Reuters Events Supply
  Chain; Supermarket News; Dallas City News Hub; Progressive Grocer; The Shelby
  Report (2022 opening); Virtual Builders Exchange.

## Final confidence

**High.** Building positively identified and corroborated by press + geocoding;
gate/guard-shack determinations confirmed at ground level in recent (2026)
Street View. Lower-confidence items (exact dock/van counts, entry/exit lane
counts) are flagged in `uncertainFields`/`fieldNotes` — they do not change the
core classification.
