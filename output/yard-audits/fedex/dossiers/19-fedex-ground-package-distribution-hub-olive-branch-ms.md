# Deep-Audit Dossier — FedEx Ground Package Distribution Hub, Olive Branch MS (idx 19)

## Facility
- **Name:** FedEx Ground Package Distribution Hub - Olive Branch MS (Memphis metro)
- **Type:** Ground regional package distribution hub
- **Address:** 9181 Polk Ln, Olive Branch, MS 38654
- **Audited coords:** 34.99080, -89.77850 (long cross-dock building fronting
  Polk Lane at the roster point)
- **Maps:** https://www.google.com/maps/@34.99080,-89.77850,400m/data=!3m1!1e3

## Location confirmation (Step 0) — PARTIAL / FLAGGED
The roster geocode (34.990431, -89.777793, RANGE_INTERPOLATED, movedMeters 4)
is precise to the 9181 Polk Ln street address but lands on Polk Lane itself,
between two long parallel cross-dock buildings inside the **Crossroads
Distribution Center** — a large multi-tenant industrial park in Olive Branch
(SE of the Olive Branch Airport).

I probed the park extensively (z15-z21) and walked Street View along Polk
Lane in both directions. **FedEx-specific branding could not be visually
confirmed on any building at the roster point.** 2026 Street View shows
mixed-carrier trailers (orange / blue / red dry vans and containers — not
the uniform white FedEx Ground fleet) backed in along the dock faces. The
park contains dozens of generic distribution warehouses.

Web research: FedEx Ground's documented Olive Branch hub is a 330,000 sq ft,
$57M, 94-acre facility at **8505 Nail Rd** — not Polk Lane. "Fed Ex Services"
appears at 6495 Polk Ln. The roster's 9181 Polk Ln may be an address
mismatch, or a FedEx linehaul building I could not positively distinguish
from neighboring tenants. I audited the long cross-dock building that fronts
Polk Lane at the roster coordinate and flagged the identity for human review.

## Key views
- **z15 wide:** Crossroads Distribution Center — many large warehouses; Olive
  Branch Airport to the SW.
- **z17 target building:** Long N-S cross-dock with continuous dock doors on
  both long faces, full trailer banks, trailer lot to the W.
- **Street View 2026 (sv1, sv7, sv8):** Dock face directly along Polk Lane,
  mixed-carrier trailers backed in, NO perimeter fence and NO gate at this
  building. A sliding gate + call box exists at a DIFFERENT building on the
  E side of Polk Lane.

## Gate / guard-shack / dock determinations
- **truckGate = false (uncertain).** The audited building's dock apron runs
  open directly along the public road — no fence, no barrier arm, no gate.
- **guardShack = false.** No staffed booth observed; remoteGs = false.
- **dockDoors = 50+.** Long cross-dock, continuous doors both long faces;
  ~160 estimated.
- **dropArea = 25-50 / dropYard = true.** Trailers parked in marked rows
  along the aprons and a W trailer lot.
- **shipRcvSeparate = true (uncertain).** Dock banks on two opposite faces.

## Yard zones & counts
- **perimeter:** ~26 acres around the audited cross-dock building and its
  apron / drop areas.
- **truckGate:** null — no controlled gate identified.
- **dropYards:** two — W-face apron/lot and E-face apron.
- **dockAprons:** two — W and E building faces.
- **staging:** null.
- **yardMetrics:** dockDoorCount ~160, trailersVisible ~180,
  trailerParkingCapacity ~220, truckGateCount 1, buildingCount 1,
  siteAreaAcres ~26, railServed false — all approximate.

## Web findings
FedEx Ground announced Olive Branch as one of nine new package distribution
hubs (~450 jobs). Documented FedEx Ground hub: 8505 Nail Rd, 330K sq ft, 94
acres, $57M, near MS-305 / US-78. Flintco built a "FedEx Package Distribution
Hub" in Olive Branch.

## Confidence
**Medium.** The physical yard layout is clearly readable from imagery, but
the facility's FedEx identity at 9181 Polk Ln could not be visually
confirmed (multi-tenant park, mixed-carrier trailers, documented FedEx hub
at a different address). Identity and gate fields flagged uncertain for
human review.
