# Deep-Audit Dossier — Hormel Fort Smith Plant, Fort Smith AR (idx 15)

**Account:** Hormel Foods
**Facility type:** Production Facility (Planters peanuts / snack nuts / cheez balls)
**Resolved coordinates:** 35.30350, -94.38130
**Confidence:** Medium

## Location confirmation
The roster gave "4307 Planters Rd" — that address is wrong. Web research
(Hormel "Our Locations", Fort Smith Chamber, ADEQ permit records, Waze) confirms
the Hormel-Planters Fort Smith plant is at **4020 Planters Rd, Fort Smith AR
72908**; a "Mr Peanut Sign" is a registered landmark at 4020. Neighboring
addresses on the same street are separate companies — International Paper at
4215 and Grainger at 3807.

The plant was resolved to the large multi-building, rail-served processing
complex at ~35.3035, -94.3813. The roster's geocoded pin (35.3056, -94.3815)
lands at the NW employee parking lot of this very complex, which confirms the
complex itself. The street ("Planters Rd") is named for the plant, and the
campus footprint, dock banks, drop yards and rail spur all match a 230+
-employee peanut/snack processing facility.

## Key views
- **Satellite z17-z19:** Campus of several connected processing and warehouse
  buildings; a long dock warehouse on the SW with trailers backed in along its
  west face; additional dock areas on north faces; rail spur with rail cars on
  the east; large employee parking on the NW.
- **Street View (2025-2026):** The Google car drove freely along internal plant
  roads, dock areas and parking with no gate stopping it; open public-road
  frontage and open employee-parking entrances.

## Gate / guard-shack determination
- **truckGate: false** (flagged uncertain). No controlled perimeter gate,
  barrier arm, or checkpoint pinch-point identified. Street View drove
  unobstructed through the complex; road frontage is open. Uncertain only
  because the sprawling campus has multiple access points.
- **guardShack: false.** No staffed guard booth straddling a truck lane found.
- **remoteGs: false** (no confirmed gate).

## Yard zones and counts
- **Perimeter:** ~58 acres — multi-building campus, boxed.
- **Dock aprons:** a west-facing dock bank on the long warehouse and a
  north-facing dock area, both boxed.
- **Drop yard:** interior trailer parking yard boxed — `dropYard: true`.
- **dockDoorCount ~45 (25-50), trailersVisible ~35 (25-50 drop area),
  capacity ~55** — honest overhead estimates across the multi-building campus.
- **railServed: true** — rail spur with cars on the east side.
- **multipleFacilities: true** — campus of connected buildings.
- **shipRcvSeparate: true** — dock activity on physically separate building
  faces.
- **drivewayLong / postGateStaging:** deep internal roads and yard space stack
  3+ trucks. **fastLaneOpportunity: true** — ample paved yard width.

## Web findings
Hormel-Planters Fort Smith Plant — 4020 Planters Rd, Fort Smith AR 72908.
230+ employees producing Planters peanuts, snackable nut mixes, seeds, cheez
balls and cheez curls. Hormel acquired the Planters nut business from Kraft
Heinz for $3.35B (2021); the Fort Smith and Suffolk VA plants are the two main
Planters facilities. Phone (479) 648-0100.

## Final assessment
Large, rail-served, multi-building peanut/snack processing campus with open
(ungated) access, dock banks on multiple building faces, interior trailer drop
yards and a long warehouse dock face. No truck gate or guard shack identified
(flagged uncertain on the gate). Confidence: **Medium** — the plant complex was
confirmed by address research, the roster geocode pin and matching campus
features, but the roster's supplied street number was wrong and the complex's
multiple access points leave the gate determination not fully certain.
