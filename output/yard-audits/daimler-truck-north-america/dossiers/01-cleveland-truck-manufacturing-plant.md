# Deep-Audit Dossier — Cleveland Truck Manufacturing Plant (Cleveland, NC)

**Account:** Daimler Truck North America · **Roster idx:** 1
**Type:** Truck assembly plant (Freightliner Cascadia / Western Star)
**Method:** deep-audit · **Confidence:** high

## Location resolved
- Roster coords (35.730924, -80.694178, ROOFTOP) landed on the SW corner of the
  campus. Satellite at z16 immediately confirmed the facility: the main white
  assembly roof carries a large painted **"DAIMLER"** wordmark.
- Address 11550 Statesville Boulevard, Cleveland NC 27013 confirmed via DTNA
  career locations page and Waze listing. This is DTNA's flagship NA assembly
  plant (Freightliner Cascadia and Western Star; 850,000th truck built July 2025).
- Locked working center: **35.732000, -80.691000** (center of the assembly
  building complex).

## Key views
- **z15 / z16 wide** — Large E-W assembly campus on the north side of Statesville
  Blvd. Finished-truck staging lots ring the south and east; a long trailer-
  storage strip with a rail spur sits along the NW edge.
- **z17 / z18 building** — Multiple connected large buildings (assembly, body,
  paint) plus a separate trailer-yard outbuilding to the NW = a campus.
- **z18 dock area** — Interior court between buildings packed with trailers
  backed to dock faces; many additional trailers staged in the yard.
- **z18 north trailer yard** — Hundreds of dropped trailers in long parallel
  rows; a clear dedicated drop yard. Rail spur runs into the strip.
- **Street View (Statesville Blvd, 2025-10 / 2026-01)** — Continuous chain-link
  perimeter fence along the entire road frontage at every probed location.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Main controlled entrance on Statesville Blvd at a
  signalized intersection. Street View shows a "DAIMLER TRUCK" canopy gateway
  structure spanning a divided entry drive; satellite z20 confirms a divided,
  channelized entry. The whole campus is fenced, so this is a true controlled
  entry point.
- **guardShack = false / remoteGs = true.** No discrete 1-3-vehicle guard booth
  is visible at the canopy entrance in satellite or Street View. The entrance is
  a canopy/sign gateway; a staffed booth could be obscured beneath it, so the
  call is flagged uncertain. Defaulted to remote/kiosk check-in.
- **dockDoors = 50+.** Dozens of trailers are backed against multiple building
  faces and the interior court; total door count across the campus is comfortably
  50+.
- **dropArea = 50+ / dropYard = true.** The NW trailer-storage strip holds
  hundreds of dropped (tractor-less) trailers in rows.

## Yard zones and counts
- **perimeter** — Full fenced campus, roughly 35.7289-35.7354 N by
  -80.6988 to -80.6845 W, about 200 acres.
- **truckGate** — Canopy entrance area on the SW Statesville Blvd frontage.
- **dropYards** — One large box covering the NW trailer-storage strip.
- **dockAprons** — One box covering the interior dock court / N building face.
- **staging** — null (no clearly distinct pre-gate truck staging apron).
- yardMetrics: ~60 dock doors, ~320 trailers visible, ~450 trailer capacity,
  1 truck gate, ~6 buildings, ~200 acres, rail-served = true.

## Web findings
- DTNA / Freightliner career-location pages confirm this as the largest
  Freightliner manufacturing plant in the U.S., building Class 8 Cascadia and
  Western Star models. EPA FRS and EDC listings corroborate the Statesville Blvd
  address. No public detail on the gate/guard-booth configuration was found.

## Final confidence
**high** — facility unambiguously identified, perimeter and major zones clear.
Uncertain: guard-shack vs. remote check-in at the canopy entrance; presence of a
truck scale and any second checkpoint could not be confirmed from imagery.
