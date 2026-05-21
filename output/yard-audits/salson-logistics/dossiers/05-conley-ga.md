# SalSon Logistics — Conley GA (Atlanta) — Deep-Audit Dossier

**Facility:** SalSon Logistics - Conley GA (Atlanta)
**Type:** Warehouse / Dedicated-Fleet Terminal (Southeast regional hub, ~213,000 sq ft per dossier)
**Address:** 4382 Moreland Avenue, Conley, GA 30288
**Resolved coordinates:** 33.635450, -84.317050
**Confidence:** High

## Location confirmation
The roster coordinates (33.635335, -84.316831) landed on the south edge of the
facility. Street View along Moreland Avenue (US-23) positively confirmed the
site: a tall freestanding **"SalSon" branded pylon sign** stands at the road
frontage (visible in multiple 2025-02 panos). The facility occupies the east
side of Moreland Ave. Web research corroborates 4382 Moreland Ave as SalSon's
Conley/Atlanta location (BBB, Racklify, D&B, Yahoo Local, LoopNet all list it).
I shifted the locked center slightly north to the centroid of the two
operational buildings and the truck yard.

## What the imagery showed
- **Satellite (z18-z20):** Two industrial buildings on a fenced lot. The larger
  east building has dock doors on its south and east faces; a second building
  to the west also shows dock/truck activity. The paved truck yard wraps the
  buildings and extends north into a dedicated trailer-parking/drop area.
- **Street View (Moreland Ave, 2025-02):** The whole road frontage is lined with
  chain-link fence. Tractors, trailers and SalSon-marked vehicles ("DRIVERS
  WANTED 800-872-..." banner trucks) are parked inside. Truck traffic moves
  through gated gaps in the fence. A red one-way / "Do Not Enter" sign marks
  the southern driveway gap.

## Gate / guard-shack determination
- **truckGate: true** — The property is fully enclosed by perimeter chain-link
  fence along its public-road frontage; trucks enter and exit through controlled
  gated gaps in that fence. This is a controlled truck entrance.
- **guardShack: false / remoteGs: true** — No staffed guard booth is visible at
  any driveway gap in 2025-02 Street View or in satellite imagery. Entry is
  through a fence-gap gate with no checkpoint structure beside it, so check-in
  (if any) is remote / driver-managed.
- **entryExitSeparate: true** — The red one-way sign at the southern gap
  indicates that gap is one-directional; a separate gap functions as the other
  direction, giving distinct in/out points.
- **backupSensitive: true** — The gaps open straight onto Moreland Ave, a busy
  4-lane state arterial, with little stacking depth between fence and roadway.

## Yard zones & counts
- **Perimeter:** ~4.6 acres, the full fenced lot east of Moreland Ave.
- **Drop yard:** A dedicated trailer-parking area north of the buildings holds
  rows of parked trailers (dropArea 25-50, dropYard true).
- **Dock apron:** Dock activity along the east building's south/east faces;
  estimated ~22 dock doors total (low-confidence count — Maxar resolution).
- **yardMetrics:** ~40 trailers visible, capacity ~70; 2 buildings; 2 truck
  gates; not rail-served (a CSX line runs east of the property but no spur
  enters it).

## Web findings
SalSon's Conley site is its Atlanta-area Southeast dedicated-fleet hub
(~213,000 sq ft per the account dossier). Public listings (BBB, Racklify, D&B)
confirm it as an active SalSon trucking/warehouse operation; LoopNet shows
4382 Moreland Ave as industrial space. The facility supports SalSon's
dedicated-contract-carriage and store-delivery service in the Southeast.

## Final confidence
**High.** The branded pylon sign gives positive identification; satellite and
Street View clearly resolve the fenced perimeter, two buildings, dock banks and
drop yard. Exact dock-door count and lane counts are estimates and flagged.
