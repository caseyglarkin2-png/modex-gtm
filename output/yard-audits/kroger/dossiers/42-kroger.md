# Deep-Audit Dossier — idx 42 · La Habra Bakery (Kroger)

**Type:** Bakery Plant
**Address:** 850 S Cypress St, La Habra, CA 90631
**Resolved center:** 33.92210, -117.93905
**Maps:** https://www.google.com/maps/@33.92210,-117.93905,400m/data=!3m1!1e3
**Confidence:** medium · **Method:** deep-audit

## Step 0 — Location confirmation
Given coords (33.922073, -117.939159) landed directly on the correct building. Web search confirms 850 S Cypress St is **The Kroger Co. La Habra Bakery** (wholesale bread/cake production; also surfaces as "Ralphs Grocery" bakery, an FCC industrial radio license "KROGER LA HABRA BAKERY", and a Kroger supplier listing). Satellite shows a single very large industrial building, ~750 ft E-W, with a fully solar-paneled roof and dense rooftop oven/HVAC exhaust equipment plus flour silos at the SE corner — unambiguously a large bakery plant, not an office. Coordinates accurate; no relocation needed.

## What the key views showed
- **z18 overview / z17 trace:** One dominant building filling the parcel. Bounded W by an undeveloped dirt lot + an internal N-S road lined with drop trailers; S by a wide paved truck apron with backed-in/parked trailers and an employee-parking strip beyond; E by a curved perimeter drive then a single N-S rail line; N by a perimeter drive separating it from a distinct northern warehouse complex.
- **East end (z19):** Curved NE building corner, perimeter drive wrapping E, flour **silos** at SE, trailers staged along the drive. The rail track runs alongside the east edge — **no spur** into the plant.
- **West yard (z19):** Large vacant dirt/grass lot; a **row of drop trailers** along the far-west internal road (dedicated trailer storage).
- **South face (z19):** Wide paved truck yard/apron; trailers parked/backed at the east end; employee car parking forms the southern boundary.

## Gate / guard-shack / dock determinations
- **truckGate = true (uncertain):** Street View on the north drive (pano D7pCecOJteOxzhLRIkeloQ, 2023-12) shows **chain-link perimeter fencing** around the secured plant. It is a fenced superblock with a continuous internal perimeter drive and **no open public-road driveway** — access is a private gated connection. A controlled gate is operationally near-certain for a Kroger production bakery, but **no gate arm was directly resolved** (Street View cannot reach the interior truck entrance, and satellite resolution doesn't pin the arm).
- **guardShack = false (uncertain):** No 1-3-stall booth resolvable in satellite or in any reachable pano.
- **remoteGs = true (uncertain):** Gate inferred without a confirmed booth → kiosk/app check-in implied. Low-confidence pairing.
- **Docks (25-50):** ~30 dock doors estimated across the south apron and east-end trailer banks; `postGateStaging` true (deep paved interior yard), `drivewayLong` true.

## Yard zones & counts
- **perimeter:** ~19.8 acres, near north-aligned rectangle (NW 33.92340/-117.94055 → NE -117.93745 → SE 33.92080/-117.93760 → SW -117.94050).
- **dropYards:** west-road trailer row (dedicated storage).
- **dockAprons:** long thin quad hugging the south building face.
- **yardMetrics:** dockDoors ~30 · trailersVisible ~28 · capacity ~50 · gates 1 · buildings 1 · railServed false.

## Web findings
Kroger La Habra Bakery — wholesale commercial bakery (bread/cake) serving Ralphs/Kroger distribution; (714) 446-1800. Confirmed via Yelp (Ralphs Grocery, S Cypress St), poi.place, FCC ULS, bakingbusiness.com, TruckMap.

## Final confidence: medium
Building identity, footprint, perimeter, drop yard, dock band, and Urban setting are solid from imagery + web. Gate/guard-shack flags are **inferred** (secured fenced plant) without direct visual confirmation of an arm or booth — flagged in uncertainFields.
