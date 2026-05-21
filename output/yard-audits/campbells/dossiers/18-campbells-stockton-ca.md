# Deep-Audit Dossier — idx 18 — Campbell's - Stockton CA

## Facility
- **Name:** Campbell's - Stockton CA
- **Type:** Manufacturing - tomato processing (Campbell Soup Supply Co., LLC)
- **Roster address:** 1330 W Fremont Street, Stockton, CA 95203 — **incorrect**
- **Resolved address:** 750 / 760 Industrial Drive, Stockton, CA 95206
- **Locked coordinates:** 37.9087, -121.2654

## Step 0 — Location resolution
The roster coordinates (37.954263, -121.309958, ROOFTOP for "1330 W Fremont
Street") land in a mixed urban area near the Stockton Deep Water Channel — no
Campbell plant there. Web research identified the Campbell Soup facility as the
Campbell Soup Supply Co. tomato-processing plant at **750/760 Industrial Drive,
Stockton, CA 95206** (Ortega area, south Stockton). OpenStreetMap places 750
Industrial Drive at 37.9090, -121.2657. 2023 Street View confirms the facility:
a process tank bears the red **Campbell's logo**. Locked center 37.9087,
-121.2654.

## Key views
- **z17/z18 site overview** — a processing facility with a moderate building,
  heavy process equipment (cooling towers, evaporators, tanks), long rows of
  stacked bin/tote storage on the east side, paved yards, fenced perimeter.
- **z19 process area** — dense process equipment; modest dock-door loading.
- **Street View (2023-01)** — chain-link perimeter fence with privacy slats
  along Industrial Drive; a process tank with the Campbell's red logo; the main
  entrance driveway has a chain-link sliding gate (panels parked open).

## Gate / guard-shack / dock determinations
- **truckGate: TRUE** — The main entrance off Industrial Drive is a fenced
  driveway with a chain-link sliding gate (gate panels visible parked open in
  2023 Street View). The entire frontage is fenced.
- **guardShack: FALSE (medium confidence)** — No staffed guard booth visible at
  the gate.
- **remoteGs: TRUE** — Gate present, no guard booth → kiosk / call-box / app
  check-in implied.
- **Dock doors:** A tomato-processing/paste plant dominated by process
  equipment; modest dock-door loading. Estimated 4-8 → **"0-10"** band, low
  confidence.
- **Drop area:** A handful of trailers in the working yard (~8 visible). The
  long east-side rows are stacked bin/tote storage, not parked trailers →
  **"0-10"**; no dedicated trailer-storage lot (dropYard false).

## Yard zones and counts
- **perimeter:** the developed Campbell parcel — ~11 acres.
- **truckGate zone:** the gated Industrial Drive entrance driveway.
- **dropYards:** none (no dedicated trailer lot).
- **dockAprons:** modest loading apron on the building's S/SW face.
- **postGateStaging:** paved yard inside the gate.
- **dockDoorCount ~6, trailersVisible ~8, trailerParkingCapacity ~12,
  truckGateCount 1, buildingCount 2, railServed false.**

## Web findings
- Buzzfile / Manta / D&B: Campbell Soup Supply Company at 750 Industrial Drive,
  Stockton, CA 95206; ~40,000 sq ft, ~9 employees — a tomato-processing
  facility owned by Campbell Soup Company. Waze also lists "Campbell Soup Co,
  760 Industrial Dr" (same/adjacent address).

## Final confidence
**Medium.** Facility identity is solid (address confirmed via OSM + business
records; Street View shows a Campbell's-branded process tank). The gate call
(TRUE) is high-confidence from clear 2023 Street View showing a sliding gate;
guard-shack/remote-GS and dock counts are medium-confidence overhead estimates
for a process-equipment-dominated plant.
