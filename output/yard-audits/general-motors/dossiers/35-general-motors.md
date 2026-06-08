# Deep-Audit Dossier — GM CCA Reno Parts Distribution Center (idx 35)

## Facility
- **Name:** GM CCA - Reno Parts Distribution Center, Reno NV
- **Type:** Parts Distribution Center (Customer Care & Aftersales / Service Parts Operations)
- **Address:** 6565 Echo Ave, Reno, NV 89506 (Stead)
- **Resolved coords:** 39.65720, -119.89850 (building centroid)

## Step 0 — Location confirmation
The supplied street geocode (39.654717, -119.89693) lands on the Echo Ave
intersection, not a building. OpenStreetMap geocodes 6565 Echo Ave to
39.6579, -119.8984, which falls squarely on a long N-S single-tenant warehouse
in the Stead industrial park immediately south of Reno-Stead Airport. The
building footprint measured from overhead imagery (~330 m x ~105 m) is
~36,000 m2 / ~390-404k sq ft, matching GM's published ~404,000 sq ft Reno PDC
(opened 2003, UAW Local 2162). A 2019 Street View frame of the NE-corner office
shows blue corporate signage consistent with GM. Identity confirmed; center
locked to the building centroid.

## Key views
- **z15/z16 context:** Stead logistics park - rows of large distribution boxes,
  high-desert open land, Reno-Stead airport to the NE. Edge-of-town setting.
- **z17 building:** Single long warehouse, slight rotation (north end shifts
  east). Dock bank along the entire EAST face; office at NE corner; employee/
  visitor parking and a landscaped retention pond at the SOUTH end.
- **z19 dock face:** Continuous dock doors with ~45 mixed-carrier trailers
  (blue, green, white) backed in along the east wall.
- **z19 north end:** NE office structure, more trailers parked on the apron.
- **z19 south end:** Striped car-parking lot, retention basin, curved visitor
  drive to the road - the office/visitor entrance, not the truck gate.

## Gate / guard-shack determination
No barrier arm, sliding/swing gate, or standalone guard booth is visible across
the truck approach in satellite imagery. The site reads as a single-tenant DC
with an open dock apron fed by the internal east-side drive. Public Street View
runs along the set-back perimeter road and is blocked by landscaping, so a gate
cannot be positively ruled in, but none is apparent. **truckGate: false**,
**guardShack: false**, **remoteGs: false** - flagged uncertain. There is a wide
paved interior apron between the dock doors and the drive, so **postGateStaging:
true** and the gate-to-dock approach is deep (**drivewayLong: true**). Open
apron geometry leaves room for a bypass lane (**fastLaneOpportunity: true**).

## Yard zones and counts
- **Perimeter:** ~23.2 acres - the warehouse, its full east truck apron out to
  the access drive, and the south parking/retention area. Traced as an oriented
  ring following the building's slight rotation.
- **Dock apron:** Long thin quad hugging the east dock wall.
- **Drop yard:** East apron holds parked trailers without tractors beyond the
  active dock positions - **dropYard: true**, **dropArea: 25-50**.
- **dockDoorCount ~55, trailersVisible ~45, capacity ~80** - honest overhead
  estimates; door count flagged uncertain.
- **railServed: false** - no spur enters the property.
- **scale: false** - no weigh pad in the truck path.

## Web / contextual findings
GM lists Reno among its U.S. facilities: a Customer Care & Aftersales parts
distribution center, ~404,000 sq ft, opened 2003, fulfilling GM dealer and
ACDelco orders, represented by UAW Local 2162. Address 6565 Echo Ave, phone
(775) 677-7400. Sometimes referenced internally as "SPO Reno."

## Confidence
**High** on facility identity (footprint size, address geocode, corporate
signage, GM facility listing all agree). Gate/guard-shack are the weakest calls
because Street View does not reach the truck yard; both left false and flagged.
Door/lane counts are honest overhead estimates and flagged uncertain.

### 3-line summary
- Gate verdict: NO TRUCK GATE apparent - open single-tenant dock apron (uncertain; SV cannot reach yard)
- Guard-shack verdict: NO GUARD SHACK - office integrated into NE building corner
- Confidence: high (identity); gate calls flagged uncertain
