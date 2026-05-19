# Deep-Audit Dossier — GXO Conair Distribution Center, Hagerstown MD (idx 1)

## Resolved location
- **Address:** 10440 Downsville Pike, Hagerstown, MD 21740
- **Locked center:** 39.604697, -77.760602 (geocode-supplied ROOFTOP point; confirmed correct)
- The geocoded coordinates land squarely on the building slab. Web research
  confirms this is the GXO/Conair DC — 2.1M sq ft, the largest single
  distribution center in Maryland and the largest in the U.S. for small
  appliances. GXO began operations March 2024.

## How the location was confirmed
- Satellite probes z15/z16/z17/z18/z19 all show one large rectangular
  industrial building footprint at the geocoded point, fronting I-70 to the
  north and Downsville Pike to the south — consistent with the press
  description ("10440 Downsville Pike").
- Web search (GXO, Maryland Gov, DC Velocity, TT News) corroborates the site,
  scale, and operational status.

## Imagery caveat
The Maxar imagery served (2026 capture date stamp) shows the site
**mid-construction**: a poured concrete slab with structural column footings,
graded earth around all sides, and only the north building wall partially
erected. The facility is confirmed operational since March 2024, so the
imagery content predates completion. Consequently gate/guard-booth/yard
hardware is not yet placed in the imagery — entry-control fields are inferred
from facility class rather than directly observed. Confidence is therefore
**medium**.

## Key views
- **z15/z16 wide:** Site sits between I-70 (north) and Downsville Pike
  (south), with a highway interchange to the east, woods to the west, and
  farmland south. Single very large building footprint.
- **z17/z18 overview:** Building slab ~1100ft x ~550ft; truck court / yard
  pavement wraps the building. A main driveway connects the site to
  Downsville Pike at the SE corner.
- **z19 north face:** Structural grid and a regular rhythm of dock-door
  openings visible along the north wall.
- **Street View:** 2024-07 pano on Downsville Pike shows the I-70 frontage
  road; the entrance pano did not capture a finished gate (construction era).

## Gate / guard-shack / dock determinations
- **truckGate: true (inferred)** — A 2.1M sq ft single-tenant DC of this class
  is invariably perimeter-fenced with a controlled truck gate. Not visible in
  construction-phase imagery; flagged uncertain.
- **guardShack: true (inferred)** — Facility class strongly implies a staffed
  booth at the truck entrance; not observable. remoteGs = false accordingly.
- **dockDoors: 50+** — Press materials confirm **378 dock positions**. High
  confidence on the band.
- **shipRcvSeparate: true** — Press materials cite cross-dock loading
  functionality and 185-ft truck courts, implying dock banks on opposite
  building faces.

## Yard zones and counts
- **Perimeter:** whole graded property between I-70 and Downsville Pike,
  ~668m N-S x ~875m E-W ≈ 144 acres.
- **Truck gate:** SE corner where the main driveway meets Downsville Pike.
- **Drop yard / dock aprons:** 185-ft truck courts on multiple building faces;
  large trailer drop capacity estimated at ~250.
- **dockDoorCount: 378** (from web research; high confidence).
- **trailersVisible: 0** — none present (construction-phase imagery).
- **railServed: false** — no rail spur into the property.

## Web findings
- 2.1M sq ft, largest DC in Maryland; 378 dock positions; 850,000+ sq ft
  racking; 180,000+ pallets; 40-ft clear height; 185-ft truck courts;
  multiple drive-in doors; cross-dock loading; cobot/AMR automation; ~700 jobs
  over 10 years. Operations began March 2024.

## Final confidence: medium
Building identity, scale, and dock count are well established. Gate,
guard-booth, lane, and trailer-count fields are inferred from facility class
because the served imagery predates facility completion.
