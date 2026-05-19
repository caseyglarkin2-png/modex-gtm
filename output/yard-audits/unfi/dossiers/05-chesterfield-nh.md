# UNFI — Chesterfield NH DC (idx 5)

**Address:** 71 Stow Dr, West Chesterfield, NH 03466
**Resolved coordinates:** 42.89139, -72.490558
**Facility type:** Distribution Center (natural/organic grocery wholesale)
**Confidence:** High

## Location confirmation
The supplied roster coordinates landed directly on the correct building — a large
single-story distribution warehouse off Stow Drive in West Chesterfield. Web search
confirmed the address (71 Stow Dr, West Chesterfield NH 03466) and that this is an
operating UNFI warehouse/distribution center; listings cite "entrance security" and
~4-hour average load/unload. The dossier names this DC explicitly as the facility
Mark Bushway ran as GM from 2003-2006, and warehouse directories list it as a
~319,000 sq ft New England regional hub. Street View (captured 2023-06 and 2023-08)
along the access road shows UNFI/Albert's Organics branded equipment (an "Alberts"
box truck and 53-ft UNFI dry vans), positively confirming the operator.

## Site layout
The DC sits well back from NH Route 9 in a heavily wooded setting. It is reached by
a long (~250m) open paved access drive (Stow Dr) that loops past a stormwater pond
and into the truck court on the NE/E side of the building. The main warehouse is a
large rectangular building; an office wing is attached/adjacent on the NW corner
(building count = 2). Employee parking sits to the north. The west building face
carries the loading docks.

## Gate / guard-shack determination
**Truck gate: FALSE.** Multiple satellite probes (z16-z20) and Street View frames
along the access road show no barrier arm, no sliding/swing gate, no perimeter
fence line, and no checkpoint pinch-point where the property is entered. Street
View shows the Google street-mapping car drove the entire access drive and into the
truck court completely unobstructed. This is an open site — typical of an older
legacy-UNFI New England natural-foods DC.

**Guard shack: FALSE.** No booth structure of any kind was found along the access
drive or at the truck-court entrance. The only structures on site are the warehouse,
the office wing, and a small stormwater/utility shed by the pond.

**Remote check-in: FALSE.** Because there is no truck gate at all, remoteGs is false
by definition (no gate ⇒ no kiosk/call-box check-in to imply).

## Docks and yard
- **Dock doors:** A single continuous dock bank runs the full west face of the
  building. z18/z19 imagery shows roughly 30-36 trailers backed in nose-out along
  that bank. Classified **25-50**.
- **Drop / trailer parking:** No striped, dedicated drop-yard lot. Trailers without
  tractors are parked loosely in the open truck court (NE/E of the building) and a
  few along the access road. Estimated 10-25; flagged uncertain.
- **Truck court / staging:** A wide open paved court on the NE/E side functions as
  interior post-gate staging — there is generous room to hold and stage trucks
  before they reach the dock face (drivewayLong = true).
- **Ship/receive:** Single dock bank — shipping and receiving are not on physically
  separate building faces (shipRcvSeparate = false).
- **Scale / rail:** No truck scale visible; no rail spur into the property.

## Yard metrics
- dockDoorCount ≈ 36
- trailersVisible ≈ 30
- trailerParkingCapacity ≈ 40
- truckGateCount = 1 (one open access point)
- buildingCount = 2 (warehouse + office wing)
- siteAreaAcres ≈ 22.7 (from perimeter geofence)
- railServed = false

## Setting
Rural — West Chesterfield is a small wooded New Hampshire town near the Vermont
border; the DC is surrounded by forest, with only a small industrial cluster
nearby off Route 9. Classified **Rural**. Cellular coverage is likely adequate
given the adjacent state highway, so connectivityIssue is set false but flagged
uncertain.

## Web findings
- 71 Stow Dr, West Chesterfield NH 03466; phone (603) 256-3000.
- Operating UNFI natural/organic foods DC; ~319,000 sq ft New England regional hub.
- Directory listings note "entrance security" and ~4-hour average dwell — consistent
  with a check-in process handled at the building (receiving office) rather than a
  perimeter gate.
- This is the DC where Mark Bushway (current UNFI President/CSCO) served as GM
  2003-2006 — a personalization hook for the account.

## Final confidence: HIGH
Building positively identified and corroborated by branded equipment in Street View.
Gate/guard-shack calls are clear-cut (open site). Only minor uncertainty is the
exact drop-area count and the inferred connectivity field.
