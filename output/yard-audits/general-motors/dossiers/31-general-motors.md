# GM CCA - Ypsilanti Processing Center, Ypsilanti MI

**Address:** 1995 E Michigan Ave, Ypsilanti, MI 48198
**Resolved center:** 42.24995, -83.57075
**Type:** Customer Care & Aftersales (CCA) parts processing / distribution center
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

## Location confirmation
The supplied repo coordinates landed in a Ypsilanti residential neighborhood, so
they were wrong. Geocoding "1995 E Michigan Ave, Ypsilanti, MI 48198" returned a
RANGE_INTERPOLATED point at 42.2490, -83.5692. Probing north/west of that point
surfaced a large white-roofed industrial warehouse set back behind an open lawn
on the north side of E Michigan Ave, centered near 42.2500, -83.5710. Street View
on E Michigan Ave (pano A0Cq0Kh7KfVrLkSBq-XfYg, captured 2025-08) shows the GM
green-and-white facade and a GM monument sign on the front lawn, confirming this
is the GM Ypsilanti #87 Processing Center. Web research corroborates GM operates
a CCA service-parts processing center in Ypsilanti (recent multi-million-dollar
GM investments announced for the Ypsilanti and Davison Road processing centers).

## What the key views showed
- **Wide (z15-17):** Single large rectangular warehouse, roughly square to N/S
  with a slight rotation. Employee parking to the south, a large NW trailer
  staging yard, and a shared campus to the north anchored by a separate
  dark-roofed, domed GM training/engagement building. E Michigan Ave runs along
  the south/SE; an active rail line lies beyond the road to the SE.
- **NW (z18-19):** West dock face with ~15-18 trailers backed in, plus rows of
  drop trailers parked in the NW staging yard. West boundary is open grass
  (athletic field), no fence.
- **NE (z18):** North dock face with a long row of dock doors and ~12-15 trailers
  backed in; east end of building and a small standalone office/support building.
- **Front Street View (2025-08):** Building sits well back behind a wide open
  lawn; open curb-cut driveways enter from E Michigan Ave with no gate, no booth,
  and no perimeter fence at the frontage. Employee parking visible in front.

## Gate / guard-shack / dock determinations
- **truckGate: FALSE.** Open campus. No barrier arm, sliding/swing gate, or
  pinch-point checkpoint at any driveway; no perimeter fence along the frontage.
  Trucks reach the docks via open drives and the shared campus loop road.
- **guardShack: FALSE.** No staffed booth beside any lane. The only standalone
  structure is an office/support building at the NE corner, set back from the road.
- **remoteGs: FALSE.** No gate, so no remote check-in.
- **dockDoors: 25-50.** Two banks of dock doors with trailers backed in - the full
  north wall (~12-15) and the west wall (~15-18), ~36 total estimated.
- **shipRcvSeparate: TRUE (medium).** Two distinct dock banks on different faces
  (north and west) imply split shipping/receiving.

## Yard zones and counts
- **perimeter:** 7-vertex ring around the building + NW trailer yard + south
  employee parking, ~19 acres.
- **truckGate:** small quad over the main south driveway apron (uncontrolled).
- **dropYards:** one ring over the NW trailer-staging lot.
- **dockAprons:** two rings - the north dock apron and the west dock apron.
- **yardMetrics:** dockDoorCount ~36, trailersVisible ~45, trailerParkingCapacity
  ~80, truckGateCount 1, buildingCount 1, siteAreaAcres ~19, railServed false.

## Street View coverage
Only the E Michigan Ave frontage pano (A0Cq0Kh7KfVrLkSBq-XfYg, 2025-08) has
coverage; the interior yard and dock faces have none. Both perimeter and
truckGate zones reference that frontage pano (headings 359 / 6) - the driver's
arrival view up the main drive toward the building.

## Web findings
- GM operates the Ypsilanti #87 Processing Center as part of its CCA service-parts
  network (packages automotive service parts for GM vehicles).
- GM has announced recent capital investments (robot-operated conveyors,
  palletizing) at the Ypsilanti and Davison Road processing centers, indicating
  an active, modernizing parts-distribution operation.

## Final confidence: high
Identity, layout, open-access gate verdict, and dock/drop-yard reads are all
clear from imagery and Street View. Exact dock-door count and trailer capacity
are honest overhead estimates; ship/receive separation and single-vs-campus
building count are medium confidence (flagged in uncertainFields).
