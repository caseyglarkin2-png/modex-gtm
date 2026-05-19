# Deep-Audit Dossier — K-C Mobile Mill (idx 03)

## Facility
- **Name:** K-C Mobile Mill — Mobile, AL
- **Type:** Tissue / paper manufacturing mill (Scott, Cottonelle, K-C Professional
  bath tissue & paper towels; ~680 employees; acquired from Scott Paper 1995)
- **Roster address:** 2200 Paper Mill Rd, Mobile, AL 36610
- **Resolved center:** 30.73530, -88.05080

## Step 0 — Location confirmation
Roster geocode (30.735156, -88.0534, ROOFTOP, moved 9 m) landed on the western
edge of a large riverside industrial complex. Probes at z15–z17 confirmed a
paper-mill complex on the Mobile River — process buildings, tanks, converting
warehouse, extensive trailer drop yards, and rail. Web research (Mobile Chamber,
PR Newswire, Made in Alabama) confirms K-C's Mobile tissue mill at 2200 Paper
Mill Rd, ~680 workers, with a $100M+ capacity-expansion project. Center adjusted
to the building-mass centroid.

## Key views
- **Wide z15/z16:** Riverside industrial complex straddling an elevated highway.
  Main process/paper-machine buildings and drop yards north; a converting
  warehouse and admin building south of the highway. Bordered by the Mobile
  River (east), residential neighborhoods (west), rail lines through the site.
- **Mill core (z19):** Large process buildings with tanks and equipment — a
  manufacturing mill, not a typical dock-heavy DC.
- **Drop yards (z18/z19):** Two large drop yards (north and south of the
  highway) with ~70 trailers in angled rows; rail spur running alongside.
- **Entrance (Street View 2023):** Chain-link perimeter fencing with sliding /
  rolling gates across the truck access road. Controlled perimeter; no staffed
  guard booth visible in any pano.
- **Converting warehouse (z20):** Building face with a row of ~14 dock doors,
  trailers backed in.

## Gate / guard-shack / dock determinations
- **truckGate = true:** Chain-link perimeter fence with sliding gates across the
  truck access road — a controlled checkpoint, confirmed in 2023 Street View.
- **guardShack = false / remoteGs = true:** No distinct staffed guard booth was
  visible in satellite or Street View at any entrance. Combined with a
  controlled gate, this implies remote / kiosk check-in. Both flagged uncertain.
- **Docks:** ~14 dock doors estimated on the converting-warehouse face — banded
  **10-25**. Ship/receive not clearly separated → shipRcvSeparate = false.
- **railServed = true:** Active rail spur runs through the property alongside the
  drop yards.

## Yard zones & counts
- **perimeter:** ~95 acres — the fenced industrial complex straddling the
  elevated highway, river to the east.
- **dropYards:** North yard (alongside the mill) and south yard (across the
  highway) — ~70 trailers visible; capacity ~120.
- **dockApron:** Converting-warehouse apron on the south building face.
- **staging:** Open paved yard inside the gate before the docks → postGateStaging.
- **buildingCount ≈ 6; truckGateCount ≈ 2** (north mill yard + south trailer
  yard) — flagged uncertain.

## Web findings
- Mobile Chamber / PR Newswire / Made in Alabama (2018): K-C approved $100M+
  capacity expansion — rebuilding a tissue machine, adding two converting lines,
  coreless tissue.
- Yellow Pages / Superpages: Kimberly-Clark, 2200 Paper Mill Rd, Mobile AL 36610.

## Confidence
**Medium.** Facility unambiguously identified and the gated, rail-served,
multi-building layout is clear. The guard-shack determination and exact
dock-door / gate counts could not be fully resolved from available imagery — all
flagged in uncertainFields.
