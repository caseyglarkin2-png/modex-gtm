# Deep-Audit Dossier — Hostess Bakery, Columbus GA (idx 17)

## Facility
- **Account:** JM Smucker
- **Name:** Hostess Bakery - Columbus GA
- **Type:** Manufacturing - Sweet baked snacks (Hostess), $120M expansion underway
- **Address:** 1969 Victory Dr, Columbus, GA 31901
- **Resolved coords:** 32.4442, -84.9676 (center of main production building)

## Step 0 — Location confirmation
Roster coordinate (32.443058, -84.96798, geocode moved only 8 m) landed
accurately on the correct industrial building. Web research confirms a Hostess
Brands bakery at 1969 Victory Dr, Columbus GA (the legacy Twinkie bakery
reopened by Hostess in 2013) with a J.M. Smucker $120 M expansion currently
underway, slated to complete early 2027. Satellite imagery shows active
construction / equipment on the building roof, consistent with the in-progress
expansion. Locked center on the main production building.

## Key views
- **Wide satellite (z17):** Large production-building cluster bounded SW by
  Victory Drive (a 4-lane median arterial) and E by an industrial perimeter
  road. Chattahoochee River to the W. A large trailer drop yard on the NE/E,
  dock doors along the SE face, employee parking on the S/SW.
- **z18/z19/z20 detail:** SE building face lined with dock doors, trailers
  backed in. NE/E drop yard packed with 50+ trailers in rows plus a yard
  hostler. Rooftop construction activity (the $120M expansion).
- **Street View (2024-12):** Multiple passes along the E perimeter road show a
  continuous chain-link perimeter fence enclosing the truck yard. Tractors
  (Swift, Denson Freight) are parked along the public-road curb. No guard booth
  visible at any entrance; the small blue-roof structure in the NE yard is an
  ancillary building.

## Gate / guard-shack / dock determinations
- **truckGate = true (medium confidence).** The property has a confirmed
  chain-link perimeter fence; the truck driveway must pass through a fence
  opening, forming a controlled pinch-point where the yard meets the public
  road. No barrier arm could be positively resolved in the imagery, hence
  medium confidence and the field is flagged uncertain.
- **guardShack = false.** No staffed booth at the truck driveway or anywhere
  on the perimeter in 2024-12 Street View.
- **remoteGs = true (uncertain).** A fenced yard with a controlled truck drive
  but no guard booth implies a kiosk / call-box / app-based check-in.
- **dockDoors = "25-50".** ~35 doors estimated along the SE building face.
- **dropYard / dropArea "50+".** Large NE/E trailer-storage lot, 50+ trailers.
- **preGateStaging = true / backupSensitive = true.** Tractors stage on the
  public-road curb - de-facto on-street pre-gate staging with limited stacking.
- **drivewayLong / postGateStaging = true.** Deep internal aprons for queuing.
- **scale = false / railServed = false / multipleFacilities = false.** One main
  building plus a small ancillary structure; no weigh pad; no rail spur.

## Yard zones & counts
- **Perimeter:** ~423 m (N-S) x ~329 m (E-W) ≈ 34.4 acres.
- **Drop yard:** large NE/E trailer lot.
- **Dock apron:** SE building face.
- **Staging:** public-road curb on the E side serves as overflow staging.
- **Truck gate:** 1 controlled fence opening on the E-side truck drive.
- **Trailers visible:** ~55; estimated capacity ~80.

## Web findings
Hostess bakery, 1969 Victory Dr, Columbus GA - the historic Twinkie bakery,
reopened by Hostess Brands in 2013 (300+ jobs). Now a J.M. Smucker facility;
Smucker is investing ~$120 M to expand the plant, with construction underway
and completion expected early 2027.

## Confidence
**Medium.** Facility positively identified and accurately geocoded; the
$120M expansion and dock/yard layout are clear. The truck-gate call is the
limiting factor: a perimeter fence is confirmed, but no barrier arm or guard
booth could be positively resolved, so truckGate / guardShack / remoteGs are
flagged uncertain. Dock-door count (~35) is an overhead estimate complicated by
active construction.

## 3-line summary
- Gate verdict: LIKELY a truck gate - confirmed perimeter fence with a
  controlled truck-drive opening; no barrier arm resolved (uncertain).
- Guard-shack verdict: NO guard shack - no staffed booth at any entrance.
- Confidence: medium.
