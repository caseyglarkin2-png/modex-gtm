# Deep-Audit Dossier — Coca-Cola Consolidated, Columbus Distribution Center, OH

**Roster idx:** 10
**Facility type:** Distribution Center
**Confidence:** High

## Location resolution
Roster lat/lng (39.845821, -82.956124, GEOMETRIC_CENTER on Rohr Rd) landed
~700m east of the actual campus on undeveloped land — the roster source noted
"street number not disclosed." Web research confirms: Coca-Cola Consolidated's
$90M, 60-acre Columbus campus in the Rickenbacker Industrial Center on Rohr
Road, groundbreaking Oct 2023, unveiled May 2025. Comprises a 400,000 sq ft
distribution & warehouse building plus two 15,000 sq ft buildings (equipment
repair + fleet maintenance); ~350 employees; 16M+ cases/year.

Located the campus on satellite west of the roster point and locked center at
**39.84250, -82.96250**. Positively confirmed by a large fleet of **red
Coca-Cola Consolidated / Red Classic tractors** parked in herringbone rows on
the site, and by the distinctive two-small-building fleet-shop layout.

## Key views
- **Campus overview (z17):** A large white-roofed main DC at the south, two
  smaller buildings to the north (the fleet/equipment shops), extensive
  herringbone trailer parking, and employee lots. A neighboring spec warehouse
  sits to the east, separated by a retention pond/swale.
- **East/SE face (z19):** Long dock-door row with white trailers backed in and
  a large fleet of red Coke tractors — the primary truck face.
- **West face (z19):** A secondary dock-door row with some trailers.
- **Rohr Rd entrance (Street View 2024-08):** Open campus driveway leading to
  the glass-fronted office and parking; no barrier or booth.

## Gate / guard-shack / dock determinations
- **truckGate: false.** No barrier arm, sliding/swing gate, or checkpoint at
  the Rohr Rd campus entrance. Street View shows an open driveway.
- **guardShack: false.** No staffed booth visible at the property line. Listed
  uncertain (campus interior not fully street-viewable).
- **remoteGs: false** — no truck gate, so false by rule.
- **Docks:** ~40-door row on the main building's east face plus ~20 on the
  west face → ~60 total (band 50+). Cross-dock layout (docks on two opposite
  faces) supports shipRcvSeparate: true.
- **multipleFacilities: true** — distinct multi-building campus (one 400K DC +
  two separate 15K fleet/equipment buildings).

## Yard zones and counts
- **Perimeter:** ~60-acre campus (S 39.84000 / W -82.96500 / N 39.84580 / E
  -82.96050).
- **Drop yards:** main east-apron herringbone trailer yard plus a trailer area
  near the fleet buildings.
- **Dock aprons:** east-face apron and west-face apron.
- **yardMetrics:** ~60 dock doors, ~120 trailers visible, ~170-trailer
  capacity, 1 truck gate, 3 buildings, ~60 acres, no rail spur.

## Web findings
$90M investment; 60-acre Rickenbacker campus on Rohr Rd; 400K sq ft DC + two
15K sq ft buildings; LED lighting, EV-charging infrastructure, compactors,
re-designed fleet-shop HVAC; sales center, wellness clinic, learning center;
~350 employees; 16M+ cases/year serving OH, KY, IN.

## Final confidence
**High** for facility identity (confirmed by red Coke tractor fleet and fleet-
shop layout), location, gate verdict, and campus structure. Uncertain: exact
dock-door count, entry/exit lane counts, and guard-shack call (no booth seen at
the road; campus interior not fully street-viewable).
