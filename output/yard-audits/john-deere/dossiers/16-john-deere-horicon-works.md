# Deep-Audit Dossier — idx 16

## John Deere Horicon Works — Horicon, WI

**Type:** Assembly Plant (lawn/garden equipment, Gator utility vehicles)
**Roster address:** 300 N Vine St, Horicon, WI 53032
**Resolved center:** 43.4540, -88.6336
**Confidence:** medium

## Step 0 — Location confirmation
The roster coordinate (43.453709, -88.633569, geocoded ROOFTOP, 431 m correction)
landed squarely on the John Deere Horicon Works complex. Satellite probes at
z15-z18 show a large blue/dark-roofed multi-building industrial campus occupying
a peninsula on the Rock River, surrounded by the small town of Horicon. A
2025-08 Street View on W Lake St shows a **John Deere-branded enclosed bridge
spanning the public street**, joining the north and south building clusters —
positive, unambiguous identification of John Deere Horicon Works. Web research
confirms the facility: 214 acres, up to ~1,700 employees, lawn/garden and Gator
production, with major expansions adding ~1.2M sq ft of outside storage and
trailer area.

## Site layout
The campus is a classic old-line urban factory: dense, tightly-packed buildings
that the town's public street grid runs *through* — W Lake St, N Vine St, and
E Walnut St all pass between campus buildings. The Rock River bounds the
complex on the west (buildings butt directly to the riverbank). Residential
streets and employee parking lots border the east side. The main complex is
north of W Lake St; a secondary cluster sits south of Lake St (joined by the
branded bridge).

- **North end:** the truck/freight operations — a large open trailer yard and
  staged-product / outside-storage area. Trailers parked in rows; canopies and
  staged finished goods/material across a wide paved apron.
- **Center:** assembly buildings, including sawtooth-roof factory bays and a
  large building with a rooftop solar array.
- **East:** office buildings and employee parking lots facing N Vine St.
- **South cluster:** additional buildings on a river bend, across Lake St.

## Key views
- z16/z15 overview: confirmed the full peninsula campus extent.
- z18 north: large trailer yard with rows of trailers + extensive staged
  material/product storage.
- z19/z20 yard: staged products, canopies, mixed trailers; dock/apron strips
  along the north dock building.
- Street View N Vine St (2024): office-building frontage, pedestrian entrances,
  employee parking — **no truck gate, no barrier arm, no guard booth**.
- Street View E Walnut St (2024): a public street running between campus
  buildings; one small structure on the internal road (possible watchman post)
  but it does not control a property-line truck gate.
- Street View W Lake St (2025): branded JD conveyor/pedestrian bridge over the
  street — facility ID confirmed.

## Gate / guard-shack / dock determinations
- **truckGate: false.** No barrier arm, sliding gate, or controlled checkpoint
  was observed where the campus meets any public road. The campus is integrated
  into the town street grid; truck access into the north trailer yard runs over
  an internal private campus drive with no street-level control point. Street
  View does not extend onto the private campus interior.
- **guardShack: false.** No guard booth at any street entrance. One small
  internal structure exists but does not gate a property-line truck entrance.
- **remoteGs: false.** Precondition (a controlled truck gate) is not met.
- **dockDoors: 25-50.** Multiple loading faces across the sprawling complex —
  sawtooth factory bays, a north dock building, staged-product apron. Counted
  ~35; resolution limited by old factory roofs (flagged uncertain).
- **dropArea / dropYard: true, 25-50.** Dedicated north trailer yard with rows
  of parked trailers and ~1.2M sq ft of cited outside storage / trailer area.
- **shipRcvSeparate: true.** Shipping and receiving run from physically
  separate dock clusters (north dock/trailer yard vs. assembly/south buildings).
- **multipleFacilities: true.** Campus with multiple large building clusters
  north and south of W Lake St.
- **drivewayLong: true.** The internal drive from N Vine St to the north yard
  can stack 3+ trucks.
- **urbanRural: Rural.** Horicon is a small town (~3,500 pop); per the rubric's
  small-town-industrial tie-breaker, classified Rural.

## Yard metrics
- dockDoorCount ~35 (band 25-50, low confidence — old factory roofs)
- trailersVisible ~22 in captured imagery
- trailerParkingCapacity ~80 (north yard plus staged-storage apron)
- truckGateCount 1 (single primary truck access into the north yard)
- buildingCount ~12 distinct buildings across the campus
- siteAreaAcres ~105 (perimeter box of built campus; total site cited 214 ac)
- railServed false (no rail spur into the property)

## Web findings
WMC Wisconsin Chamber, Wisconsin Farmer, Farm Equipment: Horicon Works is a
214-acre facility, up to ~1,700 employees, produces lawn/garden equipment and
Gator utility vehicles. Multiple expansions ($24M, $42.9M / 400,000 sq ft) added
significant assembly capacity and ~1.2M sq ft of outside storage and trailer
area.

## Final confidence: medium
Facility identity is certain. Gate/guard determinations are confident at the
public-road interface (no control point exists there) but Street View cannot
see the private campus interior, so any interior checkpoint would be missed.
Dock-door count is an estimate over an old, irregular factory complex.
