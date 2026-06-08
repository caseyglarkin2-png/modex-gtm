# GM CCA - Chicago Parts Distribution Center, Bolingbrook IL

**Idx 32 - deep-audit dossier**

## Location & confirmation
- **Address:** 1355 Remington Blvd, Bolingbrook, IL 60490
- **Resolved center:** 41.6596, -88.1278
- **How confirmed:** Google rooftop geocode of the street address returned
  41.6598, -88.1280, landing squarely on a large white-roofed warehouse in the
  Remington Blvd logistics park. GM's own facilities page confirms a Chicago
  Parts Distribution Center at this address: **404,000 sq ft, opened 2001**,
  UAW Local 2114, serving GM dealers and ACDelco customers. Satellite at z17-z20
  confirms a single big-box DC with a continuous south dock face and a fenced
  truck yard - consistent with a parts DC, not an office. **confirmed = true.**

## What the key views showed
- **Wide (z16/z17):** Building sits in a multi-tenant logistics park between
  Remington Blvd (east) and a wrap-around loop/service drive (north and west).
  Building is oriented WSW-ENE, slightly rotated off north. Employee parking on
  the north and west sides; all truck operations on the south face.
- **South face (z18-z20):** One long continuous dock-door bank runs the full
  length of the south wall with trailers backed in; yellow dock-door markings
  are visible on the wall at z20. South of the dock apron, the paved yard holds
  two to three long rows of parked drop trailers.
- **East edge (z19/z20):** Chain-link perimeter fence visible along the east
  property line; the truck drive curves around the SE corner to the cul-de-sac
  service road.
- **North (z19):** Roof with rooftop HVAC units and the loop service road - no
  docks on the north side.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The south truck yard is enclosed by a chain-link fence;
  the truck drive enters/exits the fenced yard at the SE corner. Controlled
  entrance, single point.
- **guardShack = false (uncertain).** No staffed booth could be positively
  identified. The only Street View coverage (2018) of the back access road is
  heavily screened by a grassy/tree buffer and the yard entrance is set far back
  from any pano. Flagged in uncertainFields.
- **remoteGs = true (low confidence).** Gated/fenced yard with no confirmable
  manned booth implies kiosk/app check-in.
- **dockDoors = 50+.** Continuous bank across the entire ~400 ft+ south wall,
  many trailers backed in; ~55 doors estimated.
- **shipRcvSeparate = false.** Single dock bank on the south wall only.

## Yard zones & counts
- **perimeter:** rotated quad tracing the fenced building + south yard parcel,
  ~20 acres.
- **dockApron:** long thin quad hugging the south dock wall at the building angle.
- **dropYard:** one ring over the paved trailer-storage rows south of the apron.
- **truckGate:** small quad at the SE fenced-yard entrance.
- **dockDoorCount ~55**, **trailersVisible ~60**, **trailerParkingCapacity ~110**,
  **truckGateCount 1**, **buildingCount 1**, **railServed false**.
- **dropArea = 50+** (multiple full rows of drop trailers).

## Street View
- **perimeter:** pano on Remington Blvd NE of the building (2018-06), heading 249
  toward the building.
- **truckGate:** nearest pano is on the south access road (2018-06), heading 283
  toward the fenced yard entrance (no pano sits at the gate itself).

## Web findings
- GM facilities page: Chicago Parts Distribution, Bolingbrook IL, 404,000 sq ft,
  opened 2001, represented by UAW Local 2114; fulfills GM dealer and ACDelco
  parts orders. Listed on the 2019 UAW GM strike picket-line roster, confirming
  active GM-operated CCA (Customer Care & Aftersales) parts logistics use.

## Final confidence
**high** on identity, location, layout, dock band, drop yard, and rail.
Gate-control specifics (manned booth vs. remote, lane counts) are low-confidence
due to dated and tree-screened Street View; listed in uncertainFields.

**3-line summary**
- Gate: TRUE - fenced south truck yard, single controlled SE entrance.
- Guard shack: NOT confirmed (Street View tree-screened) - remoteGs set true, low confidence.
- Confidence: HIGH overall.
