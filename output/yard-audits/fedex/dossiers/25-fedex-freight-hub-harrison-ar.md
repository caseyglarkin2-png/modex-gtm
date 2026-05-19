# Deep-Audit Dossier — idx 25

## FedEx Freight Hub - Harrison AR (HRO)

**Type:** Freight LTL hub / former American Freightways HQ campus
**Resolved coordinates:** 36.2575, -93.1320
**Confidence:** medium

## Location resolution

Roster supplied "2200 Forward Dr, Harrison, AR 72601" and coordinates
(36.256793, -93.132174, GEOMETRIC_CENTER). Step-0 satellite probes confirmed
the coordinates land on the correct campus. Web research (FedEx Freight HRO
service-center pages, Waze, D&B) confirms 2200 Forward Dr is both the FedEx
Freight HRO service center AND FedEx Freight Corporate Offices — the heritage
American Freightways HQ campus. Locked center: 36.2575, -93.1320.

## Key views

- **Wide satellite (z16-17):** A large campus on the edge of Harrison AR. East
  side: a connected corporate-office building complex with a very large
  employee parking lot, landscaped lawns, and ponds. West side: two long narrow
  LTL cross-dock terminal buildings with trailers backed in along both faces
  and paved trailer parking around them. Internal roads connect the two zones.
- **Dock buildings (z19):** Two distinct cross-dock buildings, each with a
  regular rhythm of dock doors on both long faces; trailers backed in and
  parked in adjacent lots.
- **Street View (2024-08 / 2024-12):** Campus is perimeter-fenced — chain-link
  along the operations/parking sides, decorative metal fence on the corporate
  frontage. A FedEx-branded trailer is clearly visible in the operations yard,
  positively identifying the site. Main corporate driveway off Forward Dr is
  open-access employee parking.

## Gate / guard-shack / dock determinations

- **truckGate = true.** The entire campus is perimeter-fenced and the operating
  LTL terminal yard is access-controlled (FedEx Freight network standard). The
  corporate-office driveway is open-access employee parking; the truck entrance
  to the dock yard is a separate controlled point. Exact gate position not
  directly Street-View confirmed — medium confidence.
- **guardShack = false / remoteGs = true.** No staffed guard booth identified at
  the truck entrance in satellite or Street View. Classified as remote / kiosk
  check-in. Low-medium confidence.
- **dockDoors = "50+".** Two long LTL cross-dock buildings, each with doors on
  both long faces; combined estimate ~90 doors.
- **dropArea = "25-50" / dropYard = true.** Paved trailer parking around both
  dock buildings holds dozens of trailers/pups without tractors.
- **multipleFacilities = true.** Distinct corporate-office cluster + two
  separate cross-dock terminal buildings — a campus.

## Yard zones and counts

- **perimeter:** S 36.2545, W -93.1355, N 36.2605, E -93.1285 (~104 acres,
  includes offices/parking/ponds/lawns).
- **truckGate:** small box near the SE access off Forward Dr.
- **dropYards:** one box covering the west-side trailer parking.
- **dockAprons:** two boxes, one along each cross-dock building.
- **staging:** null (no clearly defined pre-gate staging).
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~70, capacity ~160,
  1 truck gate, 5 buildings, ~104 acres, not rail-served.

## Web findings

FedEx Freight HRO service-center pages and Waze both list 2200 Forward Dr as
both the HRO service center and FedEx Freight Corporate Offices. The campus is
the former American Freightways East operations / corporate HQ, retained by
FedEx Freight after the 2001 acquisition.

## Final confidence

Medium. Facility identity, multi-building campus layout, dock buildings, and
drop yard are clear. The truck-gate and guard-shack determinations are inferred
from perimeter fencing and FedEx Freight network norms rather than a direct
Street-View sighting of the gate or booth; door count is an overhead estimate.
