# Deep-Audit Dossier — Coca-Cola Consolidated, Whitestown Distribution & Warehouse, IN

**Roster idx:** 9
**Facility type:** Distribution Center / Automated Warehouse
**Confidence:** LOW — exact building NOT positively confirmed (flagged for human review)

## Location resolution — UNRESOLVED
The roster lat/lng (39.966379, -86.381749) are **wrong**. Satellite probing
of those coordinates (z16-z18) shows a very large surface parking lot holding
multiple thousands of cars beside a campus-style building — consistent with an
auto auction or large employer, **not** a beverage distribution center.

Web research positively establishes the facility's identity and address:
- **Coca-Cola Consolidated Whitestown** distribution & automated warehouse,
  **3690 S 500 E, Whitestown IN 46075**.
- Opened April 19, 2021; ~$60M investment; **400,188 sq ft** main building +
  26,000 sq ft office + a separate **15,000 sq ft Red Classic fleet shop**;
  160,000 sq ft of automated material-handling; ~450 employees; distributes
  20M+ cases/year.
- Located in **Fishback Creek Business Park** — north side of Albert S. White
  Blvd, between CR 450E and CR 575E, east of I-65 exit 133.

**However, the exact building could not be confirmed.** Fishback Creek
Business Park contains many near-identical large spec warehouses built
2020-2024. Google Street View coverage inside the park is from 2019
(pre-construction) and shows farmland — so road-level Coca-Cola/Red Classic
signage could not be used to disambiguate. No aerial or exterior photo with
branding was findable in web research. TruckMap, LoopNet, CommercialCafe,
Apple Maps and the Boone EDC pages either returned 403 or carried no
coordinates. OpenStreetMap had no record of the address.

## Best-estimate candidate
A large warehouse at approximately **39.95200, -86.37200** in Fishback Creek
Business Park was selected as the best candidate: it shows active trailer
staging and a west-face dock row, consistent with a distribution center. This
is an UNCONFIRMED guess among several similar buildings.

## What the imagery showed (candidate building)
- Large rectangular warehouse, ~340m long N-S, single-loaded with a dock row
  and trailers along the WEST face; the east face appears to be a solid wall.
- A black canopy structure at the north end (covered dock/entry).
- Open internal driveways; no barrier gate or guard booth visible at the road
  approach.
- Trailer parking along the west apron.

## Gate / guard-shack / dock determinations
All LOW confidence and contingent on the building identity being wrong:
- **truckGate: false** — no barrier or booth seen at the candidate's driveway.
- **guardShack: false** — no booth seen.
- **dockDoors: 25-50** — west-face dock row, estimated.
- **dropYard: true** — trailer parking along the west apron.

## Final confidence
**LOW.** The facility exists and its identity/address are confirmed by web
research, but the exact building was not visually confirmed. The roster
coordinates are demonstrably wrong. Every classification field is listed in
`uncertainFields`. **Recommend human review:** confirm the building via Boone
County GIS parcel lookup for 3690 S 500 E, or via current (2024+) Street
View / aerial imagery showing Coca-Cola or Red Classic branding.
