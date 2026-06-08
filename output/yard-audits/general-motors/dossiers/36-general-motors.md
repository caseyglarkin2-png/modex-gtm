# GM CCA - Boston Parts Distribution Center, Mansfield MA (idx 36)

**Type:** Parts Distribution Center
**Resolved location:** ~15/45 Commerce Way, Norton Commerce Center, Norton MA 02766
**Center coords:** 41.9592, -71.1392
**Confidence:** medium
**Method:** deep-audit (satellite + Street View + web research)

## Step 0 - Facility identification

The roster lists this as "GM CCA - Boston Parts Distribution Center, Mansfield MA"
with only a city-level address. Web research resolved it precisely:

- GM Service & Parts Operations (now Customer Care & Aftersales) selected
  **Norton, MA** (immediately north of Mansfield) in 2004 for a new ~404,000
  sq ft Parts Distribution Center in the North/Norton Commerce Center, replacing
  the older Boston PDC and serving 400+ dealers across New England and parts of
  NY (UAW Local 422). The facility opened ~2005.
- GM closed the Norton PDC at the end of **2009** during its bankruptcy
  (operation folded toward Philadelphia). Condyne Capital rehabbed and expanded
  the building, and **Horizon Beverage purchased it in 2012**, adding office and
  warehouse space and a large rooftop solar array; it is now Horizon's HQ/DC.

So the physical building audited here is the **original GM PDC structure**; GM no
longer operates a parts DC at/near Mansfield-Boston. The audit reflects the
building as the GM PDC footprint (current imagery shows the Horizon-era solar
roof and trailer activity, which is representative of the same dock/yard layout).

Satellite confirmed a single very large white-roofed warehouse on the southwest
side of the Commerce Way park, long axis running NW-SE (~125 deg bearing), with a
dock apron on its southwest face and a trailer drop lane along the south loop
drive. This matches the documented ~40-acre, 404k sq ft GM PDC. Lat/lng locked to
that building.

## Key views

- **Wide (z16/z17):** large white warehouse SW of the park; smaller office/flex
  buildings to the NE/E; woods and wetland buffer to W/N.
- **Building (z17/z18):** roof heavily covered with solar (Horizon retrofit);
  SW face is the dock wall; SE neighbor is a separate property with its own
  trailer yard (excluded from this geofence).
- **Dock detail (z18/z19):** trailers backed into docks at the NW and south ends
  of the SW face; a continuous dock wall ~600 ft long; a round utility silo and a
  small shed sit in the apron (not a guard booth).
- **Drop yard (z18):** curving access drive at the south/SW end holds rows of
  parked trailers without tractors plus a striped trailer-parking lane (~20-30).
- **Street View (Commerce Way, Aug 2025):** open lawn frontage, **no perimeter
  fence** on the public-road side, no barrier arm and no gatehouse; the dock yard
  and drop lane are set back behind the building. Confirms an open suburban
  industrial-park access pattern.

## Gate / guard-shack / dock determinations

- **truckGate = false.** No barrier arm, sliding/swing gate, or checkpoint
  pinch-point at the property edge; open frontage in Street View.
- **guardShack = false.** No staffed booth; the only small structures in the
  apron are a utility silo and an electrical/utility shed.
- **remoteGs = false.** No gate at all, so no kiosk/call-box check-in implied.
- **dockDoors = 25-50** (~42 estimated along the SW face; could reach 50+ -
  flagged uncertain).
- **dropArea = 10-25** and **dropYard = true** - dedicated trailer-storage along
  the south loop drive, separate from the dock apron.
- **postGateStaging = true / drivewayLong = true** - deep paved apron and loop
  drive give ample interior holding and 3+ truck stacking before docks.

## Yard zones and counts measured

- **perimeter:** 6-vertex oriented ring around the warehouse + apron + parking;
  computed area ~41.5 acres (matches the documented ~40-acre GM site).
- **dockApron:** rotated quad hugging the SW dock wall at the building angle.
- **dropYard:** rotated quad over the south trailer-parking loop.
- **dockDoorCount ~42, trailersVisible ~30, trailerParkingCapacity ~45,
  truckGateCount 0, buildingCount 1, railServed false.**
- **streetViewMeta:** only public-road coverage on Commerce Way; nearest pano
  `ZF8vPrre5Gzyge1-otLhLw` (Aug 2025). Perimeter heading 309 deg, drop-yard
  heading 248 deg from that pano. No interior/gate pano (ZERO_RESULTS at yard
  centroids).

## Web findings

- aftermarketNews (2004): GM SPO to build the Norton MA PDC, 404,000 sq ft,
  serving 400+ dealers in seven states.
- WBUR / Providence Business News (2009): GM to close the new Norton plant in
  bankruptcy, fold into Philadelphia.
- Condyne Capital Partners: rehabbed/expanded the former GM warehouse; Horizon
  Beverage purchased it in 2012 (Norton Commerce Center, ~15/45 Commerce Way).

## Final confidence

**medium** - building positively identified (former GM Norton PDC) and layout is
clear, but it is no longer GM-operated (Horizon Beverage since 2012), and dock /
trailer counts are overhead estimates. Gate/guard determinations are high
confidence (open, ungated suburban DC). Counts flagged uncertain.

### 3-line summary
- Gate: NO truck gate - open suburban-park frontage, no barrier/fence at the edge.
- Guard shack: NO - only utility silo/shed in the apron, no staffed booth.
- Confidence: medium (correct building = ex-GM Norton PDC, now Horizon Beverage).
