# GM - Wentzville Assembly, Wentzville MO — Deep Audit

**Facility:** General Motors Wentzville Assembly
**Address:** 1500 E Route A, Wentzville, MO 63385 (St. Charles County, ~40 mi W of St. Louis, off I-70)
**Type:** Vehicle Assembly Plant (with contiguous stamping)
**Resolved center:** 38.8181, -90.8211
**Confidence:** High

## Location confirmation
Web search placed the plant at ~38.8187, -90.8211. My first probe near the
street-address geocode (38.82, -90.84) landed ~1.5 km west on an unrelated
business park, so I corrected eastward. Satellite at the resolved coordinates
shows the unmistakable signature of a large OEM assembly plant: one enormous
contiguous building (~3.7M sq ft under roof), vast finished-vehicle marshalling
lots to the north/northeast, a solar array to the NW, and a major multi-track
rail yard with autorack cars on the SW. This matches GM Wentzville Assembly
(opened 1983, ~440-569 acres, builds Chevrolet Colorado / GMC Canyon midsize
pickups and Chevrolet Express / GMC Savana full-size vans). Identity
unambiguous.

## What the key views showed
- **Wide (z15/z16):** Single dominant contiguous assembly + stamping building;
  finished-vehicle lots N/NE full of newly built trucks/vans; solar array NW;
  rail classification yard SW.
- **NW / Route A frontage (z16/z17):** Route A runs NW-SE along the north; a
  signalized intersection feeds the main plant access road. Large vehicle
  marshalling lots flank Route A. Undeveloped farmland buffer inside the GM
  property line.
- **Main intersection (z18, Street View pano mIjMjF5N2Oi8ADmhAOvjqA):** The
  plant access drive meets Route A at a signal. Public Street View ends at the
  intersection; the manned guard gate is inboard on plant property.
- **Dock faces (z18/z19):** Material-receiving dock aprons hug the NW building
  face (broad dark/green-tinted paved apron strips). Docks are largely tucked
  under roof canopies and recessed faces, so individual doors are not cleanly
  countable from overhead.
- **East (z18):** Large detached building (body/stamping or warehouse) with
  steel-coil/material storage and its own perimeter road.
- **SW rail (z16):** Major multi-track classification yard with long rows of
  autorack rail cars; spurs run into the property — definitive rail service.
- **Perimeter Street View (panos x5uxcaAo3qQ2nxw3TRJZZQ + SW approach):**
  Continuous chain-link fence along the west road; a long white screening wall
  and manicured gated entry drive on the SW public approach. Site is fully
  enclosed.

## Gate / guard / dock determinations
- **truckGate = true.** Full perimeter fencing/walls + a single controlled
  material-receiving entrance off the Route A access road. Standard for a
  secured OEM assembly plant.
- **guardShack = true (high confidence by type + security evidence).** The
  guard post sits inside the fence line, off public roads, so the booth itself
  was not individually resolved in Street View; but a fully walled/fenced auto
  plant of this scale with a controlled gate is universally manned. Noted as an
  inference in fieldNotes.
- **remoteGs = false** (manned gate, not kiosk-only).
- **dockDoors = "50+".** A 3.7M sq ft integrated plant with material docks on
  multiple faces plus a detached east building. Estimated ~70 doors; obscured by
  canopies, so flagged uncertain.
- **shipRcvSeparate = true.** Inbound parts/material (truck + rail material
  docks, W/NW/E) is physically separate from outbound finished-vehicle shipping
  (SW rail autorack loading + haulaway from the marshalling lots).
- **multiStep = true** (controlled perimeter gate plus internal yard
  checkpoints typical of a secured OEM plant; medium-confidence inference).

## Yard zones and counts (overhead estimates)
- **perimeter:** 6-vertex ring tracing the fenced industrial footprint
  (Route A on the NW, west perimeter road, rail corridor S, treeline/farmland
  E) — **470 acres**, consistent with the cited ~440-569 acre site.
- **truckGate:** rotated quad over the NW material-entrance gate group.
- **dropYards:** one ring over the NW trailer drop/staging area (distinct from
  the finished-vehicle storage lots, which hold cars not trailers).
- **dockAprons:** one ring over the NW receiving dock apron.
- **yardMetrics:** dockDoorCount ~70, trailersVisible ~35,
  trailerParkingCapacity ~90, truckGateCount 2, buildingCount 4,
  siteAreaAcres 470, railServed true.

## Web findings
GM Wentzville Assembly: opened 1983; ~3.7M sq ft under roof; ~440-569 acres;
contiguous stamping facility produces most body parts on-site; current products
Chevrolet Colorado, GMC Canyon, Chevrolet Express, GMC Savana. High-volume,
rail-served, fully secured plant.

## Final
- **Gate verdict:** truckGate = true — fully fenced/walled site, controlled
  material entrance off Route A.
- **Guard-shack verdict:** guardShack = true (high confidence by facility type
  + perimeter security; booth not individually resolved, guard post inboard of
  public Street View).
- **Confidence:** High overall; dock-door count, lane counts, dropArea, and
  scale flagged uncertain.
