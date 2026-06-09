# Deep-Audit Dossier — Target Regional Distribution Center Fontana (T0553)

- **Facility:** Target Regional Distribution Center Fontana (T0553), type RDC
- **Address:** 14750 Miller Ave, Fontana, CA 92336
- **Resolved center:** 34.111500, -117.480700
- **Geocoded input:** 34.113343, -117.482445 (landed on the NW office courtyard — correct parcel, but the parcel center sits SE of it)
- **Confidence:** HIGH
- **Method:** deep-audit (satellite z15-z21 + Street View + web)

## Location confirmation
The geocoded point landed on the landscaped office courtyard at the NW corner of
a very large warehouse. A Street View probe at the office driveway
(pano `JTybK9rQjFr8tuiUcXS9mA`, 2025-03) shows a posted monument sign reading
**"TARGET — 14750 MILLER AVE — REGIONAL OFFICES — DISTRIBUTION CENTER — NO TRUCKS —
TRUCKS USE ENTRANCE ON MEYER CANYON RD."** Satellite at z18 shows the Target
bullseye logo painted in the circular courtyard. The building footprint (~720 m
NW–SE × ~230 m, rooftop solar) is consistent with a 1M+ sqft Target RDC. Web
search confirms T553 Target Distribution Center, 14750 Miller Ave, open 24/7,
phone 909-355-6000. Positively the correct facility.

## Site layout
A single very large RDC building oriented ~35° clockwise of north (long axis runs
NW→SE). Office + employee parking + bullseye courtyard at the NW. The secured
truck yard wraps the **west (SW) dock face** and the **long south dock face**,
with an enormous trailer drop yard filling the area south/east of the building and
a second drop yard to the west. Site area from the traced perimeter ≈ **46.1 acres**.

## Key views
- **overview / wide (z15-z17):** identified the building among a dense Fontana
  industrial park; trailer rows wrap the SW + south faces.
- **NW entrance (z18) + Street View:** Target bullseye courtyard, office, palm-lined
  car-only driveway, the "NO TRUCKS / use Meyer Canyon Rd" sign.
- **dock/trailer (z18-z19):** dock doors with trailers backed in along both the
  west and south building walls; rows of parked drop trailers; yard hostlers moving
  trailers.
- **gate / booth (z19-z21):** at ~34.1105,-117.4827 a small booth/canopy structure
  sits at the controlled pinch-point between the employee parking and the secured
  truck yard, with median islands channeling traffic; yard jockeys staged nearby.
- **perimeter Street View:** chain-link fence on the west road and a decorative
  block wall on the SW office frontage — the property is fully enclosed.

## Gate / guard-shack / dock determinations
- **truckGate = TRUE.** Posted truck-routing sign + full perimeter fence/wall +
  a controlled SW entry pinch-point with median islands. Trucks are explicitly
  routed to a dedicated Meyer Canyon Rd entrance, separate from the car entrance.
- **guardShack = TRUE.** Satellite (z19/z20) shows a small green-roofed
  booth/canopy at the truck-yard entry checkpoint. Driver reviews describe
  checking in with gate passes at the gate/shipping office and strict
  appointment control — consistent with a staffed booth.
- **remoteGs = FALSE.** A physical staffed booth is present, so this is not a
  kiosk/app-only remote gate.
- **Docks (50+).** Dock doors line the full west face and the long south face,
  with trailers backed in across both — well over 50 (≈140 total est.).
- **dropArea / dropYard (50+, TRUE).** Hundreds of drop trailers across the
  south/east drop yard plus a separate west drop yard.
- **shipRcvSeparate (TRUE, med-conf).** Two distinct dock banks on different
  building faces.
- **postGateStaging (TRUE, inferred).** Large paved yard between gate and docks.
- **fastLaneOpportunity (TRUE).** Wide gate apron + broad yard pavement allow a
  bypass/express lane.

## Yard zones & counts (estimates from overhead imagery)
- dockDoorCount ≈ 140 (west + south faces)
- trailersVisible ≈ 360; trailerParkingCapacity ≈ 450
- truckGateCount = 1 (dedicated truck entrance on Meyer Canyon Rd)
- buildingCount = 1
- siteAreaAcres = 46.1 (from perimeter polygon)
- railServed = false (NE diagonal corridor is a separate ROW, no spur into the lot)

## Geofences
- **perimeter:** 7-vertex oriented ring tracing the fenced parcel (office NW →
  building NE wall → SE yard end → south yard edge → SW yard → W courtyard).
- **truckGate:** small rotated quad over the SW entry booth/checkpoint.
- **dockAprons:** two long thin quads hugging (a) the south dock wall and
  (b) the west dock wall, at the building's true angle.
- **dropYards:** (a) the large south/east trailer field, (b) the west drop yard.
- **streetViewMeta:** perimeter → office-entrance arrival pano
  `JTybK9rQjFr8tuiUcXS9mA` (heading 133°); truckGate → Meyer Canyon Rd pano
  `7I-BwY47jJ_o__3Pocxrmw` (heading 82°). The gate itself is behind the fence
  with no interior public Street View — these are the nearest public arrival frames.

## Web findings
- T553 Target Distribution Center, 14750 Miller Ave, Fontana CA 92336; 24/7;
  909-355-6000 (multiple directory listings, Target careers T0553 postings).
- Driver reviews: strict appointments, no early arrivals; drivers drop trailers,
  go to the shipping office, check in with gate passes — corroborates a staffed
  guarded gate + drop-yard operation.
- Adjacent 14650 Meyer Canyon Rd = Medline DC, confirming Meyer Canyon Rd runs
  along the west of this block (the truck-entrance road named on the sign).

## Final confidence: HIGH
Facility identity is certain (signage + bullseye + address + footprint). Gate and
guard-shack calls are well supported by signage, perimeter fencing, the booth
structure, and driver reviews. Lower-confidence items (exitLanes, shipRcvSeparate,
postGateStaging) are flagged in `uncertainFields`.
