# Deep-Audit Dossier — Amazon MEM1 Fulfillment Center, Memphis TN

- **Facility:** Amazon MEM1 Fulfillment Center
- **Type:** Fulfillment Center
- **Address:** 3292 E Holmes Rd, Memphis, TN 38118
- **Resolved center:** 35.00820, -89.95000
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coordinates (35.006546, -89.951836) sat on E Holmes Rd
itself, just south of the facility. A z16/z17 satellite sweep showed a single
very large white-roofed industrial building to the NE, with dock-door lines and
hundreds of trailers — consistent with a fulfillment center. Web search
confirmed the address: Amazon MEM1, 3292 E Holmes Rd, Memphis TN 38118 (24/7
operation; multiple Amazon FC address directories and Waze list this exact
building). Street View along the frontage shows an Amazon monument sign at the
SE driveway, positively identifying the parcel. Locked center: 35.00820,
-89.95000. The building's long axis runs NW->SE, rotated ~35deg off north, so
every geofence below is traced as a rotated quad rather than a north-aligned box.

## Key views
- **z16/z17 overview:** one enormous rectangular building, long axis NW->SE.
  Dock lines along BOTH long faces (NE/north and SW/south). Employee parking lot
  off the SW corner; retention pond in front of the south dock face; massive
  trailer drop yard off the NE; SE overflow trailer lot fronting E Holmes.
- **z18 dock faces:** regular rhythm of dock doors running nearly the full length
  of both long faces with trailers backed in — far into the 50+ band.
- **NE drop yard (z18):** hundreds of Amazon orange/blue trailers in angled rows
  served by an internal truck road that curves around the building's east end.
- **SE overflow lot (z18/z20):** additional fenced trailer-storage lot fronting
  E Holmes, full of parked trailers.
- **SW associate-parking entrance (SV, 2026-02):** a small guard/check-in booth
  sits in the parking-lot entrance drive with black-metal perimeter fencing — but
  this controls CAR parking, not the truck yard.
- **SE truck entrance (SV, 2026-02):** Amazon monument sign at the driveway;
  Street View pano coverage stops at the public road (the gated private drive
  blocks the camera car) — a reliable tell of a controlled private entrance.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A single dedicated truck entrance off E Holmes Rd at the
  SE corner (~35.0063,-89.9456), marked by an Amazon sign and fronting the
  internal truck road that feeds the NE drop yard and dock faces. The whole
  property is fenced (black metal perimeter fence visible in several SV frames).
- **guardShack = false / remoteGs = true.** No standalone manned booth is
  resolvable at the truck-gate throat in z20 imagery. A booth exists at the
  separate associate-parking entrance, but that is not the truck gate. The truck
  gate is therefore treated as kiosk / app / call-box check-in (remote), which is
  typical of modern Amazon FC truck gates. Flagged medium-confidence.
- **dockDoors = 50+.** Doors run nearly the full length of both long faces;
  rough estimate ~180 doors total.
- **shipRcvSeparate = true.** Two distinct dock banks on different building faces
  (NE/north line fed by the NE drop yard = inbound; SW/south line = outbound) —
  classic Amazon FC inbound/outbound split.
- **dropArea = 50+ / dropYard = true.** Dedicated trailer-storage yard on the NE
  (several hundred trailers in marked angled rows) plus the SE overflow lot.

## Yard zones & counts measured
- **perimeter** — 7-vertex ring tracing the fenced parcel: E Holmes Rd on the
  south, residential tree line on the NW, power-line easement on the E,
  open field/parking on the W. ~78 acres.
- **truckGate** — rotated quad over the SE entrance throat / Amazon-sign drive.
- **dropYards** — two rings: the large NE drop yard and the SE overflow lot.
- **dockAprons** — two long thin quads hugging the NE and SW dock faces at the
  building's ~35deg angle.
- **staging** — left null (pre/post-gate staging captured via classification
  flags; no single clean polygon worth isolating).
- **yardMetrics:** dockDoorCount ~180, trailersVisible ~360, capacity ~450,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~78, railServed false.
  All counts are honest overhead estimates, not exact figures.

## Street View metadata
- **truckGate:** pano `7J51MIzepx4-aitQa9OAuQ` (captured 2026-02), heading 14deg
  from the E Holmes pano toward the SE entrance.
- **perimeter:** pano `hv6WqdT1mz9s1O6kVIRobQ` (captured 2026-02), heading 2deg
  toward the fenced south frontage / associate entrance.

## Web findings
Amazon MEM1, 3292 E Holmes Rd, Memphis TN 38118. 24/7 fulfillment operation;
listed across Amazon FC address directories, Waze, and importer records
(Panjiva/ImportYeti) as an active Amazon import/distribution FC. ~2.6-star public
rating from 700+ reviewers (driver/associate sentiment, not operationally
material).

## Final confidence: HIGH
Location and major layout (docks both faces, NE drop yard, SE overflow lot,
fenced single truck gate) are unambiguous. The only medium-confidence calls are
the absence of a manned booth at the truck throat (remoteGs vs guardShack) and
the exact entry/exit lane count, both limited by Street View stopping at the
gate. These are flagged in uncertainFields.
