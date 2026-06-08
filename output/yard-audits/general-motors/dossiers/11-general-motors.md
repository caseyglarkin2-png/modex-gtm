# GM - Lansing Delta Township Assembly, Lansing MI (idx 11)

**Address:** 8175 Millett Hwy, Lansing, MI 48917
**Confirmed center:** 42.6921, -84.6798
**Type:** Vehicle Assembly Plant (GM, opened 2006, LEED Gold; Buick Enclave / Chevrolet Traverse / GMC Acadia)
**Confidence:** high

## Step 0 - Locating the facility
The roster coordinate (42.7361, -84.5838) and the original task coordinate area
both landed wrong - one in older urban Lansing, one in open woods/water. Web
research (Wikipedia, GM Authority, GM.com) confirms LDT is in Delta Township,
southwest of the I-69 / I-96 interchange, set ~600m back from Canal Rd. Probing
the area at z14 surfaced two large white-roofed building masses; the northern
mass is the assembly plant, the southern is Lansing Regional Stamping (idx 18,
audited separately) sharing the campus. Re-pinned the assembly complex centroid
to 42.6921, -84.6798. The plant is ~3.4-3.6M sq ft on a ~320-acre campus.

## What the key views showed
- **Wide (z14-15):** Full campus between Millett Hwy (W) and the I-69/I-96
  interchange (E); large employee parking lots on the E, finished-vehicle
  marshalling lots on the N/NE, a solar array NW, a separate finished-vehicle
  distribution lot to the S, open farmland W and N.
- **Assembly building (z16-17):** Sprawling rectilinear building footprint with
  the south building (stamping) attached via the shared truck court.
- **Truck court (z18, ~42.6925,-84.681):** The primary freight zone - a wide
  paved court between the assembly and stamping buildings with two distinct dock
  banks. Rows of trailers backed into the assembly south face (~10-12) and a
  second bank along the cross-court face, plus staged drop trailers.
- **Dock zoom (z19):** Clear dock-door rhythm with trailers backed in on dock
  levelers; estimated ~45 doors across the multiple building faces.
- **Gate (z19, ~42.6848,-84.6812):** A green-roofed gatehouse canopy spans the
  entry lanes with a channelizing island and lane striping - the single
  controlled truck/personnel entrance.

## Gate / guard-shack / dock determinations
- **truckGate: true** - Canopy gatehouse with lane striping and channelizing
  island at the SW entrance; continuous chain-link perimeter fence confirmed in
  Street View. Plant set ~600m back from the public-road intersection.
- **guardShack: true (uncertain)** - The canopy gatehouse straddling the lanes is
  consistent with a staffed booth; GM assembly plants run staffed gatehouses.
  Overhead view cannot crisply confirm an occupied window line, so flagged.
- **remoteGs: false** - There is a staffed gatehouse, so not a remote/kiosk gate.
- **dockDoors: 25-50** - ~45 doors estimated across assembly south face,
  cross-court face, and the south building's west face.
- **dropArea / dropYard: true, 25-50** - Trailer staging rows in the inter-building
  truck court, separate from active dock backing.

## Street View evidence
Access-road pano `CAoSF0NJSE0wb2dLRUlDQWdJRGFxWTNnX2dF` (captured 2021-03) at
42.68292, -84.68178, looking N/NW toward the gate (heading ~347). Views from
several headings show continuous chain-link perimeter fence, the long approach
drive, and the plant set well back behind the fence line.

## Yard zones and counts (from overhead imagery)
- **perimeter:** ~320-acre fenced campus (oriented ring tracing the building
  mass + yards, NW-SE orientation).
- **truckGate:** the SW gatehouse / lane area.
- **dropYards:** two rings in the inter-building truck court.
- **dockAprons:** one ring along the assembly south-face dock bank.
- **dockDoorCount ~45, trailersVisible ~35, trailerParkingCapacity ~80,
  truckGateCount 1, buildingCount 3, railServed false.**

## Web findings
Wikipedia / GM Authority / GM.com: LDT opened 2006, GM's newest North American
assembly plant, ~3.4-3.6M sq ft, LEED Gold, builds Buick Enclave / Chevrolet
Traverse / GMC Acadia; houses the Lansing Regional Stamping plant on the campus.
Third shift was eliminated in 2017 and later reinstated (~1,100 added).

## Final confidence
**High** on location, gate presence, fencing, dock/drop layout, and rural-edge
setting. Uncertain (flagged): exact guard-booth staffing, precise lane counts,
exact dock-door count, and absence of a truck scale.

**Gate verdict:** Controlled gate (true) - canopy gatehouse + channelizing island.
**Guard-shack verdict:** Likely staffed (true, flagged uncertain).
**Confidence:** high.
