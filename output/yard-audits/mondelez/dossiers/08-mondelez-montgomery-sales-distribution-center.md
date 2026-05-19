# Deep-Audit Dossier — Mondelez Montgomery Sales Distribution Center, Montgomery NY (idx 8)

## Facility
- **Name:** Mondelez Montgomery Sales Distribution Center - Montgomery NY
- **Type:** Distribution center / sales warehouse
- **Address:** 272 Neelytown Rd, Montgomery, NY 12549
- **Locked coordinates:** 41.49400, -74.22360

## Step 0 — Location confirmation
Roster lat/lng (41.493975, -74.223428, ROOFTOP, moved 65 m) landed directly on
a distribution warehouse with a trailer yard set in wooded terrain along
Neelytown Rd. Web research (ARCO Design/Build, Times Hudson Valley) confirms
ARCO completed a 100,300 sq ft food-grade Mondelez distribution facility here
with 37 truck spots, distributing Oreo, Triscuit and Wheat Thins. Street View
shows the warehouse with an office annex; identity and building confirmed.

## Key views
- **z17/z18 context:** Single distribution warehouse with a large open trailer
  yard, set in continuous woodland alongside a rural two-lane road; isolated
  edge-of-town location.
- **z19 overview:** Warehouse with docks; large trailer yard south and east of
  the building holding many parked trailers; two driveways off Neelytown Rd.
- **z20/z21 building:** Modest warehouse footprint; docks on the south/west
  faces facing the yard. z21 resolution limited - dock faces partly obscured.
- **Street View (2025-08):** Reddish-roofed warehouse with an attached office
  annex and a row of bay doors on the NW face (~8-12 visible). Two open paved
  driveways, no barrier arm, no guard booth, no road-frontage fence. Trailers
  (incl. one blue line-haul trailer) parked in the open yard.

## Gate / guard-shack / dock determinations
- **truckGate = false.** Two open curb cuts off Neelytown Rd lead directly
  into the yard. No barrier arm, sliding/swing gate, or checkpoint
  pinch-point; Street View shows no perimeter fence along the frontage. Open
  access.
- **guardShack = false.** No staffed booth at either driveway. The only
  secondary structure is a small office annex attached to the warehouse front.
- **remoteGs = false.** No gate, so no remote check-in inferred.
- **Docks:** ~8-12 bay doors visible on the NW face plus likely more on the
  south/yard face; estimated band **10-25** (count ~14). Flagged uncertain
  given z21 resolution limits.
- **Drop area:** Large open trailer yard wraps the south and east of the
  building with multiple rows of parked trailers; published spec 37 truck
  spots. ~32 trailers counted, band **25-50**. dropYard = true.

## Yard zones and counts
- **perimeter:** cleared developed area ~245 m N-S x ~192 m E-W, ≈ 11.6 acres,
  inside the woodland edge.
- **truckGate box:** the main driveway off Neelytown Rd at the NW corner.
- **dropYards:** the south trailer yard and the east trailer yard.
- **dockApron:** the apron in front of the south/yard-facing dock doors.
- **yardMetrics:** dockDoorCount ~14, trailersVisible ~32, capacity 37,
  truckGateCount 2, buildingCount 1, siteArea 11.6 ac, railServed false.

## Web findings
- ARCO Design/Build: completed 100,300 sq ft food-grade Mondelez distribution
  facility in Montgomery NY, parking for 37 trucks.
- Times Hudson Valley: Mondelez sales distribution center distributing Oreo,
  Triscuit and Wheat Thins across the state.

## Classification rationale
Modest single-building food-grade sales DC, open-access with two ungated
driveways and no guard structure, set in a rural wooded location. Large open
trailer yard (dropYard true) with deep staging room and ample width for a
fast lane. Archetype: No Gate / No GS (#3-type).

## Confidence: HIGH
Imagery clear and recent, facility unambiguous and web-confirmed. Only the
exact dock-door count and ship/receive separation are uncertain (dock faces
partly obscured at high zoom) - flagged in uncertainFields.
