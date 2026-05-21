# Deep-Audit Dossier — PFG idx 21

## Performance Foodservice - Cincinnati OH
**Address:** 535 Shepherd Avenue, Cincinnati, OH 45215 (Lockland)
**Type:** Broadline Foodservice Distribution Center
**Resolved coords:** 39.23030, -84.44910
**Confidence:** High

---

## Location resolution
The roster pin (39.231271, -84.449082, ROOFTOP, ~97 m offset) landed on the
correct facility. Web research confirmed 535 Shepherd Avenue as Performance
Foodservice - Cincinnati, a broadline DC serving OH/KY/IN and operating 24/7.
The site is in the Lockland industrial corridor north of Cincinnati, wedged
between Interstate 75 on the west and an active rail line on the east. Locked
center: 39.23030, -84.44910.

## What the imagery showed
- **z17 / z18 satellite:** A white-roof distribution building running NW-SE
  along Shepherd Ave, with a long dock bank on its east face (many trailers
  backed in). South of the building, a large drop yard holds angled rows of
  trailers; a separate long narrow building sits at the south end of the
  property. An open paved area lies north of the main building. The whole
  truck-side runs along Shepherd Ave.
- **z19 / z20 satellite:** The Shepherd Ave frontage is lined with parked
  tractors and trailers behind a fence; dock doors and backed-in trailers on
  the building's east face; angled trailer storage in the south yard.
- **Street View (June 2025), Shepherd Ave:** An ornamental black metal
  perimeter fence runs the length of the yard frontage. **PFG-branded
  ("PERFORMANCE") tractors and trailers** are lined up behind it — positive
  confirmation of the operator. A flagpole with a US flag stands in the yard.
  The fence has wide open driveway gaps but **no barrier arm, no sliding gate,
  and no guard booth** at any opening.

## Gate / guard-shack determination
- **truckGate: false** — the yard IS perimeter-fenced along Shepherd Ave, but
  the fence has open driveway gaps with no barrier arm, sliding/swing gate, or
  staffed checkpoint pinch-point. A fenced lot with open driveway entrances
  does not meet the rubric's controlled-truck-gate bar.
- **guardShack: false** — no guard booth at any driveway opening; none seen in
  Street View or satellite.
- **remoteGs: false** — no gate, so no remote/kiosk check-in implied.

## Yard zones & counts
- **Perimeter:** ~42.7 acres, the long PFG site between I-75 and Shepherd Ave.
- **Truck gates:** 2 — separate driveway openings in the perimeter fence (one
  serving the south drop yard, one the north dock-yard area). entryExitSeparate
  = true.
- **Dock doors:** 25-50 band — a long dock bank on the east building face;
  ~35 estimated (flagged).
- **Drop area / drop yard:** 50+ band — extensive trailer storage: angled
  trailer rows in the south yard plus a long tractor/trailer line along the
  Shepherd Ave fence.
- **Post-gate staging:** large paved holding area north of the main building.
- **Buildings:** 2 (main DC + separate long narrow building at the south end).
- **Rail:** an active rail line runs immediately east of the property, but no
  spur enters the PFG site.

## Web findings
- Performance Foodservice - Cincinnati; serves OH/KY/IN; operates 24/7.
- Part of PFG's broadline Performance Foodservice network.

## Setting
Urban — dense Lockland / Reading industrial corridor, north Cincinnati metro,
between I-75 and an active rail line, with residential immediately to the east.

## Final confidence: HIGH
Facility positively identified (PFG-branded equipment visible in June-2025
Street View) and gate/guard status clearly established from the fence frontage
imagery. Dock-door and trailer counts are overhead estimates — flagged in
uncertainFields.
