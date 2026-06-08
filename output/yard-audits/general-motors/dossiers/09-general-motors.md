# GM - Arlington Assembly, Arlington TX — Deep Audit Dossier

**Address:** 2525 E Abram St, Arlington, TX 76010
**Resolved center:** 32.7388, -97.0712
**Type:** Vehicle Assembly Plant (full-size SUV)
**Confidence:** High

## Location confirmation
The supplied address sits near the NW corner of E Abram St and TX-360. Initial
satellite probes around the address (and the city-level point) landed on
residential blocks. Wikipedia's infobox coordinates (32.7383, -97.0736) put the
pin squarely on a single very large light-roofed manufacturing building, which
matches the documented GM Arlington Assembly: ~250 acres, ~3.75M sq ft, building
Chevrolet Tahoe/Suburban, GMC Yukon, and Cadillac Escalade. The plant is bounded
by E Abram St on the south, TX-360 on the east, an active rail corridor on the
north (under the I-30/TX-360 interchange), and a wooded buffer behind a
single-family neighborhood on the west. Identity is unambiguous.

## What the key views showed
- **Wide (z14/z15):** One dominant industrial superstructure just south of the
  I-30/360 interchange, with the Arlington entertainment district (AT&T Stadium /
  Globe Life) to the NW. Clearly the metro's largest industrial footprint.
- **Building (z17):** Massive contiguous assembly roof; a long internal perimeter
  road on the west with trailers/docks along the west wall.
- **North/NE (z17):** Multiple rail spurs penetrate the north side; covered rail
  loading / auto-rack structures and strings of rail cars feed the plant. A large
  blue-roofed marshalling/dock building and trailer staging sit here. **Rail-served
  is unambiguous.**
- **East (z18):** A vast finished-vehicle marshalling lot (thousands of SUV
  stalls) runs the full east side fronting TX-360 — the outbound vehicle yard.
- **South (z16/z18):** Employee parking abuts the south wall; a landscaped lawn
  buffer separates the building from E Abram. The central N-S street is a public
  road continuing into the neighborhood, not a plant gate.

## Gate / guard-shack / dock determinations
- **Truck gate (true):** The property is fully fenced and access-controlled. In
  Street View along E Abram, the south boundary is a masonry wall topped with
  steel fencing; internal-road tie-ins to the public grid are gated. Waze tags a
  "Gate 11 - Assembly Plant" on Abram. Public Street View does not pass any gate,
  consistent with a guarded campus. Material receiving and finished-vehicle
  haulaway run through these controlled GM gates.
- **Guard shack (true):** A GM assembly plant of this scale runs staffed security
  gatehouses at its truck/material gates (same baseline confirmed at Ford
  Dearborn). Booth-scale structures sit beside the controlled internal-road
  entrances. High-confidence inference from the fence line plus GM standard
  practice; `remoteGs` therefore false.
- **Dock doors (25-50 band):** Loading doors distributed across multiple building
  faces — west-wall truck docks plus north rail/parts-receiving banks. Estimated
  ~45.
- **Drop area / drop yard (50+, true):** Large finished-vehicle marshalling lots
  on the east and trailer/auto-hauler staging near the north rail docks, separate
  from active dock aprons.

## Yard zones and counts measured
- **perimeter:** 7-vertex ring tracing the fenced property (Abram S, TX-360 E,
  rail corridor N, wooded buffer W). Area ≈ 251 acres, matching the documented
  250-acre site.
- **truckGate:** quad over the E Abram controlled entrance area.
- **dropYards (2):** north rail/trailer staging strip; east finished-vehicle
  marshalling lot.
- **dockApron (1):** long thin strip along the west building wall truck docks.
- **yardMetrics:** dockDoorCount ~45, trailersVisible ~40, trailerParkingCapacity
  ~120, truckGateCount 3, buildingCount 5, siteAreaAcres 251.2, railServed true.

## Street View metadata
- **perimeter:** pano `NhbYTIDkD40KDE2CGzoStA` (E Abram frontage, 2024-01),
  heading 357° toward the south building wall.
- **truckGate:** pano `52aRze8lZkT8uHxYHwBtag` (E Abram near entrance, 2025-08),
  heading 7° into the entrance.

## Web findings
GM Arlington Assembly: opened 1954, ~250 acres / 3.75M sq ft, ~1,300 vehicles/day,
sole-source for GM's full-size SUVs (Tahoe, Suburban, Yukon, Escalade). 70th
anniversary and 13-millionth vehicle celebrated in 2024. Just-in-time sequencing
and a heavy mix of rail + truck inbound/outbound make it a high-throughput,
gate-controlled freight yard.

## Final confidence
**High.** Facility identity, fencing/gate control, rail service, and the
finished-vehicle drop yards are all directly evidenced from imagery and
corroborated by public records. Exact dock-door count, lane counts, the truck
scale, and the multi-step checkpoint are inferred and flagged uncertain.
