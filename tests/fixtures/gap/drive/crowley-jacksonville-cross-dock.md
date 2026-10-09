# Deep-Audit Dossier — Crowley Jacksonville Cross Dock Facility

**Roster idx:** 13
**Account:** Crowley
**Type:** Cross-dock / distribution warehouse
**Address:** 2061 Seaboard Coast Line (SCL) Drive, Jacksonville, FL 32209
**Resolved center:** 30.34640, -81.69680
**Method:** deep-audit
**Confidence:** medium

## Step 0 — Facility identification (roster geocode was wrong)

The roster supplied 30.324541, -81.663312 (geocoding-api, GEOMETRIC_CENTER,
moved 3 m). Satellite probes there showed downtown Jacksonville's St. Johns
River waterfront — an office tower, a swimming pool, riverwalk — **not** a
cross-dock facility. The geocode was badly wrong.

Re-resolution by research:
- 2061 SCL Drive is in ZIP 32209 (the same NW-Jacksonville industrial
  district as Crowley's 2113 W 30th St DC).
- "SCL Drive" is named for the Seaboard Coast Line railroad.
- Web research (Crowley/LogiCore listings) places the cross-dock near I-95 and
  MLK Jr Parkway, adjacent to the West Jacksonville rail yard.

Probing the rail-yard edge of NW Jacksonville located a large LTL/cross-dock
terminal complex pressed hard against the CSX/Seaboard rail yard at
~30.3464, -81.6968. This is the only facility of this kind on SCL Drive by
the rail yard, and its physical profile matches Crowley's published spec
exactly — adopted as the resolved site.

## Key views

- **z17 / z18 site** — A long, narrow cross-dock building with dock doors and
  trailers backed in along BOTH long faces; several support buildings
  (one in the SW corner consistent with the ~10,000 sq ft trailer maintenance
  facility); a very large paved trailer drop yard holding 100+ trailers and
  tractors; rail yard on the west, residential to the east.
- **z19 / z20 tight** — Confirms the through-dock layout and the dense trailer
  yard; a small gatehouse footprint at the east entrance.
- **Street View (2022-12 / 2025-03)** — From the east access road: a
  chain-link sliding gate across the truck drive, with a small peaked-roof
  gatehouse just inside the gate; Hapag-Lloyd and China Shipping ocean
  containers parked in the yard.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE.** Street View shows a chain-link sliding gate across
  the truck driveway off the east access road.
- **Guard shack — TRUE (medium confidence).** A small peaked-roof gatehouse
  structure sits beside the entrance lane just inside the gate; satellite
  z20 confirms the small building footprint. Flagged uncertain because it
  could not be 100% confirmed as a manned booth vs a small unstaffed office.
- **Remote GS — FALSE** (guard shack present).
- **Dock doors — 50+ band.** Web research states 58 dock doors; satellite
  confirms a long cross-dock building with docks on both long faces.
- **Ship/Rcv separate — TRUE.** The cross-dock building runs trailers on both
  opposing long faces — classic cross-dock through-flow.
- **Drop area — 50+.** A very large paved trailer yard holds 100+ units;
  Crowley spec lists 150+ yard capacity.
- **Multiple facilities — TRUE.** Long cross-dock building plus several
  support buildings including a separate trailer maintenance facility.
- **Fast-lane opportunity — TRUE.** Wide paved gate apron and ample unused
  paved width for an express/bypass lane.

## Yard zones & counts

- **Perimeter:** S 30.34470 / W -81.69820 / N 30.34810 / E -81.69540 — approx
  12.1 acres (matches Crowley's published acreage).
- **Truck gate zone:** chain-link sliding gate + gatehouse on the east drive.
- **Dock apron:** the long cross-dock building's dock faces.
- **Drop yards:** two large paved trailer-storage areas (west and east).
- **Staging:** open paved area inside the gate before the dock building.
- **yardMetrics:** dockDoorCount 58 (web-corroborated); trailersVisible ~120;
  capacity ~160; truckGateCount 1; buildingCount ~4; siteAreaAcres 12.1;
  railServed false (abuts the rail yard but no clear spur into the property).

## Web findings

- 2061 SCL Drive — Crowley Jacksonville Cross Dock; 12.1 acres, ~45,580 sq ft
  of buildings, 31,500 sq ft cross-dock space, 58 dock doors, 150+ trailer
  yard capacity, separate 10,000 sq ft trailer maintenance facility.
- Services: LTL handling, cargo segregation, P.O. management, consolidation/
  deconsolidation, scanning, cargo tracking, transfers, freight forwarding,
  cargo insurance, HazMat handling; bonded area; 24/7 security monitoring.
- Opened for LCL/cross-dock business circa October 2015.

## Final confidence — MEDIUM

The cross-dock site is resolved with high spatial confidence (the only
matching LTL/cross-dock complex on SCL Drive beside the rail yard), and the
layout matches Crowley's published spec point-for-point. Confidence is held
at medium because no on-site Crowley signage was visible in available Street
View and the roster geocode pointed at the wrong part of the city, so the
operator identity rests on strong circumstantial — not nameplate — evidence.
