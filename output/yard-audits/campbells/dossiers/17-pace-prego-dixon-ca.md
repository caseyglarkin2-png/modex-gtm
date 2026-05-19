# Deep-Audit Dossier — idx 17 — Pace / Prego - Dixon CA

## Facility
- **Name:** Pace / Prego - Dixon CA
- **Type:** Manufacturing - tomato processing for Prego/Pace sauces (Campbell Soup Supply Co.)
- **Roster address:** 1606 Pedrick Road, Dixon, CA 95620 — **incorrect**
- **Resolved address:** 8380 Pedrick Road, Dixon, CA 95620
- **Locked coordinates:** 38.4745, -121.8025

## Step 0 — Location resolution
The roster coordinates (38.47074, -121.803936, GEOMETRIC_CENTER for "1606
Pedrick Road") land in farmland just south of the plant. Web research
identified the Campbell Soup Supply Co. Dixon tomato-processing plant at
**8380 Pedrick Road** — it processes ~660,000 tons of tomatoes per year
(~65% of California's total) into the base for Prego spaghetti sauces and
Pace picante sauces. OpenStreetMap places 8380 Pedrick Rd at 38.4743,
-121.8038. Satellite probing confirmed a large multi-building agricultural
processing campus surrounded entirely by open farmland. Locked center
38.4745, -121.8025.

## Key views
- **z16 wide overview** — large processing campus surrounded by farmland;
  processing plant (N), warehouses and an extensive trailer drop yard (center/
  south), wastewater settling ponds (east).
- **z19 trailer yard** — drop yard with 30+ parked trailers in a single frame;
  warehouses with loading docks.
- **z19 processing area** — heavy tomato-processing equipment (conveyors,
  pipes, tanks); bulk intake rather than dock-door receiving.
- **Street View (2024-05)** — Pedrick Road frontage fully fenced (wrought-iron
  + chain-link); main entrance driveway has a sliding chain-link gate (parked
  open) and white jersey-barrier lane chicane.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE** — The main entrance off Pedrick Road is a fenced driveway
  with a sliding/rolling chain-link gate (visible parked in the open position
  in 2024 Street View) plus a white jersey-barrier lane chicane forming a
  checkpoint pinch-point. The whole Pedrick Road frontage is fenced.
- **guardShack: FALSE (medium confidence)** — No proper staffed guard booth at
  the gate; only a small portable structure (reads as a portable toilet).
- **remoteGs: TRUE** — Gate present, no guard booth → kiosk / call-box / app
  check-in implied.
- **Dock doors:** Loading docks are distributed across the warehouses in the
  trailer-yard area; tomato intake is largely bulk (gondola/tanker), not
  dock-door. Estimated 10-20 → **"10-25"** band, low confidence.
- **Drop area:** Extensive on-site drop yard — 50+ parked trailers across the
  central and southern yard → **"50+"**; dropYard true.

## Yard zones and counts
- **perimeter:** the developed campus (processing plant, warehouses, drop yard)
  — ~39 acres (sources cite a ~40-acre plant footprint; full campus with ponds
  is larger).
- **truckGate zone:** the gated Pedrick Road entrance driveway.
- **dropYards:** the large central/southern trailer storage yard.
- **dockAprons:** warehouse loading apron in the trailer-yard area.
- **postGateStaging:** large paved interior holding areas inside the gate.
- **dockDoorCount ~12, trailersVisible ~55, trailerParkingCapacity ~90,
  truckGateCount 2, buildingCount ~8, railServed false.**

## Web findings
- DailyRepublic / The Aggie: Campbell's Dixon plant processes ~660,000 tons of
  tomatoes annually (~65% of CA total); products derived feed Prego and Pace.
- Plant footprint cited at ~40 acres on Pedrick Road, with an 80,000 sq ft
  processing facility plus warehouses.
- Multiple shipping records reference "8380 Pedrick Road, Dixon, CA 95620" as
  the Campbell Soup Supply Co. ship-to address.

## Final confidence
**Medium.** Facility identity is solid (8380 Pedrick Rd confirmed via OSM and
multiple business records; satellite signature matches a tomato cannery). The
gate call (TRUE) is high-confidence from clear 2024 Street View showing a
sliding gate and jersey-barrier chicane. Guard-shack/remote-GS and exact dock
counts are medium-confidence overhead estimates; truck scales likely present
but not resolved.
