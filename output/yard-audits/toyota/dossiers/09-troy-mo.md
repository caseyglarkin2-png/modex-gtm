# Toyota Motor Manufacturing Missouri (Bodine Aluminum) — Troy, MO

**Roster idx:** 9
**Facility type:** Powertrain plant — aluminum castings (cylinder heads, intake manifolds)
**Address:** 100 Cherry Blossom Way, Troy, MO 63379
**Resolved center:** 38.96360, -90.96904
**Confidence:** High

## Location confirmation

The roster coordinates (38.963601, -90.969039, ROOFTOP, ~1.9 km move) landed
directly on a large white-roofed industrial building northeast of Troy, MO.
Satellite at zoom 16-19 confirms a single dominant ~550,000 sq ft manufacturing
building with a casting-plant signature (roof exhaust stacks, multiple support
buildings, electrical substation, water-treatment structures). Street View at
the north entrance shows a **Toyota monument sign reading "TOYOTA — MOTOR
MANUFACTURING MISSOURI, PROCESSING"**, positively identifying the site as
TMMMO / the former Bodine Aluminum Troy plant. Web research corroborates:
Bodine Aluminum Troy is a 550,000 sq ft plant on ~75 acres, ~1,000+ employees,
producing 4/6/8-cylinder aluminum castings for Toyota's North American assembly
operations (recently $57.1M expansion for hybrid cylinder-head line, 2025).

## Key views

- **Wide satellite (z16):** Single large plant building, employee parking lots
  to the NW, a large gravel trailer drop yard wrapping the NE corner.
- **NE entrance (z18):** Access road from the public road on the north;
  employee parking to the west; trailer drop yard to the east.
- **Drop yard (z19/z20):** Large gravel lot holding ~40-55 trailers parked at
  an angle in rows — a substantial dedicated trailer-storage yard.
- **South face (z19):** Dock apron with loading doors and trailers backed in
  along the south side of the plant.
- **Street View (2024-09):** The entrance driveway has the Toyota sign and a
  small grey gatehouse booth in the drive median with lanes splitting around
  it.

## Gate / guard-shack determination

- **truckGate = true.** Single controlled entrance on the north side where the
  paved plant drive meets the public road. Toyota monument sign and a clear
  pinch-point checkpoint.
- **guardShack = true.** Street View positively shows a staffed gatehouse — a
  small grey structure (≈1-2 vehicle footprint, windows) set in the median of
  the entrance drive with inbound/outbound lanes routed around it.
- **remoteGs = false** (a physical guard booth is present).
- One combined entry/exit point (entryExitTogether). Roughly one inbound +
  one outbound lane at the booth; wide entrance apron leaves room for a
  fast/express lane (fastLaneOpportunity = true).

## Yard zones and counts

- **Perimeter:** ~73 acres (consistent with the ~75-acre figure in press
  coverage).
- **Drop yard:** Large gravel trailer yard on the NE — dropArea band 50+,
  ~55 trailers visible, estimated capacity ~80.
- **Dock apron:** Single bank of dock doors on the south face — ~14 doors
  estimated (band 10-25). Shipping and receiving are not on physically
  separate building faces.
- **Buildings:** One primary plant plus ~5 ancillary structures (water
  treatment, substation, support buildings) — single operational facility,
  not a multi-building campus.
- **Rail:** No rail spur into the property — railServed = false.
- **Setting:** Edge-of-town industrial site outside Troy, MO (small town);
  classified Rural per the rubric. Not isolated — connectivityIssue = false.

## Web findings

- Bodine Aluminum / TMMMO: 550,000 sq ft, ~75 acres, ~1,000+ employees,
  >2 million cylinder heads/year. Low-pressure casting capability. 2025
  expansion: $57.1M, 57 jobs, new hybrid cylinder-head line (production 2027).
- Sources: Toyota USA Newsroom (TMMMO facility page), Modern Casting,
  Wikipedia (Toyota Motor Manufacturing Missouri), Foundry Management & Tech.

## Final confidence: High

Imagery is clear, the facility is unambiguously identified, and the gate +
guard-shack call is confirmed by 2024 Street View. Dock-door count and trailer
capacity are honest overhead estimates and flagged in `uncertainFields`.
