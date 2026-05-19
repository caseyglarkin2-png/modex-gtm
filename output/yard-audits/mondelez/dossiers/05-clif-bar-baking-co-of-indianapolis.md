# Deep-Audit Dossier — Clif Bar Baking Co. of Indianapolis (Indianapolis IN)

**Account:** Mondelez · **Roster idx:** 5
**Type:** Manufacturing — energy/nutrition bar bakery
**Address:** 7575 Georgetown Rd, Indianapolis, IN 46268
**Resolved center:** 39.88865, -86.24100
**Confidence:** High

## Location confirmation
Roster coordinate (39.888649, -86.241363) landed directly on the bakery
building complex. Satellite probes (z16-20) confirmed a single large industrial
bakery building with an associated trailer drop yard and employee parking, in a
NW-Indianapolis industrial park. Web research (IBJ, Pepper Construction, Baking
Business) confirms 7575 Georgetown Rd as the Clif Bar Baking Co. of
Indianapolis — a 185,000 sq ft plant (plus a 24,000 sq ft expansion), ~430
employees, opened 2012, fully owned by Clif Bar since 2016. Locked center on the
building centroid.

## Key views
- **Wide (z16-17):** Single bakery building in an industrial park; employee
  parking to the SW, trailer drop yard SW, truck docks on the E/SE. Neighboring
  buildings (a Concentra clinic, an adjacent warehouse) are separate parcels.
- **Truck dock face (z19-20):** Dock bank on the E/SE building face with
  several trailers backed in.
- **Drop yard (z20, 39.8880,-86.2421):** Trailer drop/staging yard with ~12-16
  trailers parked in angled rows.
- **East edge (z19, 39.8894,-86.2393):** A through rail line runs along the
  property's east edge behind a tree buffer — no spur into the building.
- **Frontage (Street View 2024-07):** Building set back behind an open grass
  lawn; open driveway entrances; no perimeter fence at the road; no gate.

## Gate / guard-shack determination
- **truckGate = false.** This is an open industrial-park facility. Street View
  shows the building set back behind an open lawn with no perimeter fence at
  the road and open driveway entrances — no barrier arm, sliding gate, or
  checkpoint pinch-point. Per the rubric, an open driveway with no control =
  false. truckGateCount set to 0.
- **guardShack = false.** No truck gate and no booth structure at any
  entrance.
- **remoteGs = false** (no truck gate present).
- **drivewayShort = true.** Industrial-park entrance driveways are short,
  feeding directly into internal parking/yard.

## Yard zones & counts
- **Perimeter:** S 39.88680 / W -86.24320 / N 39.89000 / E -86.23950 — approx
  28 acres for the Clif Bar parcel.
- **Truck gate:** none (null).
- **Drop yard:** SW trailer drop/staging lot, ~16 trailers visible, ~25
  capacity.
- **Dock apron:** E/SE building-face dock bank.
- **Dock doors:** ~14, banded 10-25 (flagged uncertain).
- **Rail:** through rail line on the east edge does NOT serve the building →
  railServed = false.
- **Buildings:** one main bakery building → multipleFacilities = false.

## Web findings
IBJ / Pepper Construction / Baking Business: 7575 Georgetown Rd is the Clif Bar
Baking Co. of Indianapolis, a 185,000 sq ft commercial bakery (plus a 24,000
sq ft / $10M renovation-and-expansion), ~430 employees. Opened 2012; Clif Bar
took full ownership in 2016. One of two Clif Bar self-manufacturing plants.

## Final confidence: High
Facility unambiguously identified (roster coordinate rooftop-accurate, confirmed
by web research). Open industrial-park layout with no truck gate or guard shack.
Dock-door count and outbound-lane count left low-confidence; no truck scale
identified.
