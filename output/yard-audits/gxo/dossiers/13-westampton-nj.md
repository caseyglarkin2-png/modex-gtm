# Deep-Audit Dossier — GXO IKEA Distribution Center, Westampton NJ (idx 13)

## Facility
- **Name:** GXO IKEA Distribution Center - Westampton NJ
- **Type:** Distribution Center
- **Address:** 100 Ikea Dr, Westampton, NJ 08060
- **Resolved coordinates:** 40.01400, -74.85340
- **Maps:** https://www.google.com/maps/@40.01400,-74.85340,400m/data=!3m1!1e3

## Location confirmation
The roster lat/lng (40.013963, -74.853272) landed directly on a large, N-S
oriented warehouse with a distinctive rooftop solar array, in the Westampton NJ
industrial park. Web research (D&B, Yelp, TruckMap) confirms 100 Ikea Dr is the
**IKEA Distribution Center**, a **~1,093,787 SF** facility established 1989;
GXO operates IKEA's North American distribution network. The building is
unmistakable — encircled by hundreds of IKEA's signature red/white/orange
trailers. Locked center at the building centroid 40.01400, -74.85340.

## Key views
- **z15 context:** The IKEA DC is one of many big-box warehouses in the
  Westampton industrial park, near Route 541 / I-295. A residential subdivision
  abuts the north side.
- **z16/z17 building view:** Single large N-S building, solar roof; dock-door
  banks with trailers run the full length of both the east and west faces.
- **z19 east face:** Dock doors fully occupied by trailers, with a second
  parked row forming a drop yard.
- **z19 west face / NW corner:** Dock doors with trailers, "FIRE LANE"
  markings, employee parking, and a small separate office building off the NW
  corner.
- **z19 SE corner:** South end of the building wrapped in dozens of trailers in
  dock aprons and drop rows.

## Gate / guard-shack / dock determinations
- **truckGate: false.** The building is ringed by an open perimeter loop road
  fed from the surrounding industrial-park streets. z18/z19 satellite and
  Street View show no barrier arm, sliding gate, or checkpoint at any
  property-line connection, and no perimeter fence.
- **guardShack: false.** No 1-3-vehicle booth at any entrance along the
  perimeter road in z19 satellite or Street View.
- **remoteGs: false.** No gate, so no remote check-in inference.
- **Docks: "50+".** Continuous dock-door banks on both long faces; ~130 doors
  total (approximate). The roof solar array does not obscure the dock faces.
- **shipRcvSeparate: true.** Dock banks are on two physically separate, opposite
  building faces (east and west), so shipping and receiving run separately.
- **Drop yard: yes / dropArea "50+".** Hundreds of IKEA trailers parked along
  both faces, including dedicated drop rows distinct from active dock aprons.
- **railServed: false.** No rail spur enters the property.

## Yard zones and counts
- **perimeter:** building + dock courts + perimeter trailer yards.
  ~668 m N-S x ~409 m E-W ≈ **67.5 acres**.
- **truckGate zone:** open NW connection to the industrial-park road (no
  structure).
- **dropYards:** two boxes — the west-side trailer yard and the east-side
  trailer yard.
- **dockAprons:** two boxes — the west dock apron and the east dock apron.
- **staging:** no distinct pre-gate staging; null.
- **yardMetrics:** ~130 dock doors, ~280 trailers visible, capacity ~320, 1
  main truck gate, 1 building, 67.5 acres, no rail.

## Web findings
- 100 Ikea Dr = IKEA Distribution Center, ~1.09M SF, established 1989,
  Westampton NJ; operated within GXO's IKEA North American distribution
  network.

## Confidence
**High.** Facility positively identified; imagery clear at z16-z19. Flagged
uncertain fields are the dock-door count, trailers-visible and parking-capacity
— honest overhead estimates on a 1M+ SF building, but each is firmly in the
50+ band.

**3-line summary:**
- Gate: NO truck gate — open perimeter loop road, no barrier or fence.
- Guard shack: NO — no booth anywhere on the perimeter road.
- Confidence: HIGH.
