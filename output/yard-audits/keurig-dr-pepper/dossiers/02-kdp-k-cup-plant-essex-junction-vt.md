# Deep-Audit Dossier — KDP K-Cup Plant, Essex Junction VT

**Roster idx:** 2
**Facility type:** Manufacturing - Coffee/K-Cup
**Roster address (incorrect):** 63 South Park Dr, Essex Junction, VT 05452
**Resolved address:** 30 Gauthier Dr / 5 New England Dr, Essex Junction, VT 05452
**Resolved coordinates:** 44.513632, -73.136469
**Confidence:** High

## Location confirmation
The roster pin (44.503824, -73.180386, RANGE_INTERPOLATED) was ~3.6 km off,
landing in Essex Junction's commercial sprawl among small office/apartment
buildings — no industrial plant present. Web research corrected this:
- Vermont Business Magazine and Food Processing confirm KDP's Vermont K-Cup
  manufacturing is at the Essex Junction plant (Williston operations
  consolidated here in 2024).
- The GMCR 2011 expansion press release describes a 350,000 sq ft addition at
  5 New England Drive connecting to the existing operation at 30 Gauthier Drive.
- warehouserating.com lists 30 Gauthier Dr at 44.513632, -73.136469.

Satellite at that coordinate shows a large connected multi-building industrial
complex with dock banks and trailer drop yards — consistent with a coffee
roasting / K-Cup manufacturing plant. Location locked here.

## Key views
- **z16-z18 satellite:** Large connected building cluster set in an industrial
  park; employee car parking on the E/N, truck/dock activity on the W and N.
- **z19 W dock probe:** Long line of ~10-12 trailers backed into the W building
  face, paved truck court in front.
- **z19 N drop-yard probe:** Dedicated trailer lot with rows of parked trailers
  in a clearing NE of the building.
- **z19 S-side probe:** A second dedicated trailer drop yard on the S side with
  many trailers parked in rows.
- **Street View (2011, dated):** Curved entrance drive from the public
  industrial-park road; building visible; open driveways into the truck court.

## Gate / guard-shack / dock determinations
- **Truck gate: FALSE.** Truck access from the internal park road into the W
  truck court and N dock area is via open driveways. No barrier arm, sliding
  gate or checkpoint pinch-point in recent z19-z20 satellite or 2011 Street
  View. No perimeter fence on publicly visible sides.
- **Guard shack: FALSE.** No booth-footprint structure at any truck entrance.
- **Remote GS: FALSE.** No gate present.
- **Dock doors: 25-50 band (medium confidence).** Dock banks on the W face
  (~10-12 trailers backed in) and the N face. `shipRcvSeparate` true — dock
  activity split across two distinct building faces.
- **Drop yard: TRUE, dropArea 25-50.** Two dedicated trailer drop yards (N/NE
  ~25-30 trailers; S ~15-20 trailers).

## Yard zones and counts
- **Perimeter:** Whole campus including the building cluster, W truck court, and
  the N/NE and S trailer drop yards. ~55 acres.
- **Truck gate zone:** W truck-court driveway (open).
- **Drop yards:** N/NE trailer lot and S trailer lot — both boxed.
- **Dock aprons:** W building-face apron and N building-face apron — both boxed.
- **Building count:** ~4 (connected/adjacent multi-building campus — estimate).
- **Rail:** none — no spur into the property.
- `multipleFacilities` true (campus); `drivewayLong` true; `fastLaneOpportunity`
  true (wide truck court); `postGateStaging` true (open court before docks).

## Web findings
- KDP closed the Williston VT plant and consolidated production into Essex
  Junction by end of Q3 2024 (Vermont Business Magazine, WCAX, Food Processing).
- GMCR's 2012-completed 350,000 sq ft expansion connected 5 New England Dr and
  30 Gauthier Dr into one operation — explains the connected campus footprint.

## Final confidence
**High** on location (corrected from a 3.6 km roster error and verified against
multiple sources) and on the no-gate / no-guard-shack determination. Medium
confidence on exact dock-door and trailer-capacity counts and on the distinct
building count, given the connected multi-building footprint and 2011-vintage
Street View.
