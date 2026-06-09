# Deep-Audit Dossier — Amazon LGB3 Fulfillment Center, Eastvale CA

- **Facility (roster idx 12):** Amazon LGB3 Fulfillment Center
- **Type:** Fulfillment Center (robotics / AR sortable)
- **Address:** 4950 Goodman Way, Eastvale, CA 91752
- **Resolved center:** 33.9972, -117.5528
- **Maps (satellite):** https://www.google.com/maps/@33.9972,-117.5528,400m/data=!3m1!1e3
- **Confidence:** high
- **Method:** deep-audit (satellite probe.ts z16–z20 + Street View + web)

## Step 0 — Location confirmation
The supplied coordinates (33.996348, -117.554022) landed inside the Goodman
Logistics Center cluster in Eastvale, at the SW corner of a very large
solar-roofed industrial building. Web research (Amazon Tours, Waze, Yelp,
businessyab) confirms LGB3 is at 4950 Goodman Way. Street View on Goodman Way
shows the building's office face carrying the **"amazon"** logo and a monument
sign reading **"4950 Goodman Way,"** and an elevated **pedestrian bridge** over
Goodman Way linking the FC to a west office annex — positively identifying the
solar-roofed building as LGB3. The large gray-roof building immediately south is
a **separate tenant** (no solar, distinct trailer yard) and is excluded.

The FC building runs roughly N–S, rotated ~10° clockwise from north, so all
geofences are traced as rotated quads, not north-aligned boxes.

## Key views and what they showed
- **z16–z17 overview:** FC building center; employee parking + Goodman Way on
  the west; a dense trailer drop yard along the entire east side between the
  building and Interstate 15; dock-door banks on the east and south faces.
- **z18–z19 east face (NE crop):** continuous loading-dock rhythm along the east
  wall with trailers backed in, and a long drop yard of trailers parked
  nose-out in rows, bounded by the I-15 freeway frontage.
- **z19 south face:** dock doors with trailers backed in along the south wall;
  wide internal truck court between the FC and the southern (separate) building.
- **z20 east drop yard:** dozens of trailers in angled rows with yard hostlers
  and trucks staging at the south end — an active, high-throughput drop yard.
- **Street View (Goodman Way, 2025):** signalized **main entrance** at the
  intersection with The Station, Amazon monument sign, gated driveway into the
  west lot; office/amenity wing with break patio and the pedestrian-bridge
  stair. The truck (east) side faces I-15 and has no Street View coverage.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Amazon's own visitor guidance (events.amazontours.com /
  help.amazontours.com, LGB3) instructs arrivals to **"enter at the main guard
  post, which is at the intersection of Goodman Way and The Station."** The
  signalized main driveway at the NW corner is the single controlled checkpoint
  into a fully fenced campus. Evidence is operator-stated plus the fenced,
  secured drop yard.
- **guardShack = true (flagged uncertain).** Amazon explicitly references a
  **staffed "main guard post."** The booth itself is not individually resolvable
  in overhead imagery (entrance canopy + heavy landscaping) and the truck side
  has no Street View, so the field is listed in `uncertainFields`; the
  staffed-guard operation is corroborated by the operator. `remoteGs = false`.
- **dockDoors = 50+.** Continuous dock banks on the full east wall and the full
  south wall, trailers backed in throughout (est. ~120 doors total).
- **shipRcvSeparate = true.** Two distinct dock clusters on different building
  faces (east + south).
- **dropArea = 50+ / dropYard = true.** Dedicated trailer-storage yard the full
  length of the east side, separate from active dock staging.
- **fastLaneOpportunity = true.** Wide entrance apron and a large internal truck
  court leave clear paved width to add an express/bypass lane.
- **postGateStaging = true, drivewayLong = true.** Deep internal approach and a
  broad truck court hold a 3+ truck queue inside the gate before the docks.
- **scale = false, railServed = false, multiStep = false, multipleFacilities =
  false.** No weigh pad, no rail spur (I-15 bounds the east), single FC building.
- **urbanRural = Urban.** Dense Inland Empire logistics fabric on I-15
  (adjacent Costco and multiple big-box DCs).

## Yard zones and counts measured
- **perimeter:** rotated quad enclosing west parking + building + east drop yard,
  ~47 acres.
- **truckGate:** quad at the NW signalized main entrance off Goodman Way.
- **dropYards:** one ring along the full east side (building wall → I-15 frontage).
- **dockAprons:** two rings — east-wall apron and south-wall apron.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~160, capacity ~220,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~47, railServed false.
  (Honest overhead estimates; ranges confident, exact integers approximate.)

## Street View metadata
- **truckGate:** pano `GF_R5YPSsNzYH9gDa4gNHw` (2025-02), heading 89° — the
  driver's-eye view of the main Goodman Way entrance.
- **perimeter:** pano `GrITUw3fPxk727PT30Hi3g` (2018-02), heading 359° on
  Goodman Way. Both `hasCoverage: true`.

## Web findings
- Robotics **sortable** fulfillment center (items smaller than a microwave),
  associates working alongside robots (Amazon Tours, FLEX Fulfillment).
- Public tours offered (Wed sessions) — visitors **enter at the main guard
  post** at Goodman Way & The Station; overflow parking south on Goodman Way
  behind Costco.
- Address corroborated across Amazon Tours, Waze, Yelp, Manta, businessyab.

## Final confidence
**high.** Building positively identified (Amazon signage, ped bridge, monument
address). Gate, docks, drop yard, and layout are clear from imagery and
corroborated by the operator. The only soft calls — exact entry/exit lane count
and the physical guard-booth structure (truck side not covered by Street View) —
are flagged in `uncertainFields`.
