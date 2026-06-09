# Deep-Audit Dossier — Kroger Grocery Distribution Center, Indianapolis IN (idx 02)

**Facility:** Kroger Grocery Distribution Center
**Address:** 7025 English Ave, Indianapolis, IN 46219 (Irvington / east side)
**Resolved center:** 39.75935, -86.04555
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied approximate coordinates (39.759594, -86.045345) landed directly on
a large industrial distribution building, so they were essentially correct (only
slightly east of true building center). Web search confirmed 7025 English Ave as
the Kroger distribution center operated by Zenith Logistics (24+ years), facility
phone 317-352-5100, in the Irvington neighborhood. Satellite at z16-z18 shows a
single large warehouse with an extensive trailer drop yard, multiple dock faces,
and a mainline rail running just outside the SE boundary — fully consistent with
a grocery DC. Locked center at 39.75935, -86.04555.

## Key views

- **z16/z17 overview:** Irregular ~38-acre property bounded by English Ave on the
  north and a rail line / wooded buffer on the SE. Building is rotated ~30° off
  north (long axis runs NW-SE). Huge drop yard north and west of the warehouse.
- **z18-z19 building:** Long banks of dock doors with trailers backed in on the
  SE face (~30+ doors) and additional docks on the NE face plus a SE annex /
  cross-dock building. West/south side is employee car parking, not docks.
- **Gate (z20-z21):** The decisive frame. The signalized English Ave entrance
  leads ~70m into the property to an interior checkpoint: a gate island carrying
  a small ~1-vehicle-footprint **guard booth**, with a clearly visible **lift /
  boom barrier arm** extending across the lane and an inbound/outbound lane split
  around the island. Booth at ~39.76095, -86.04505.
- **Street View (entrance, pano XMqiwNJBNi3awE0lGHBnsQ, captured 2024-06):** From
  English Ave looking south, a wide signal-controlled truck entrance opens into
  the yard; trailers (Knight and others) staged inside; American flag at the
  building. Confirms a deep, signalized arrival with stacking room off the public
  road. (No Street View coverage inside the yard — interior centroid returns
  ZERO_RESULTS, as expected for a private gated lot.)

## Determinations with evidence

- **truckGate = true.** Interior checkpoint with booth island and a visible boom
  arm across the lane (z21). The road entrance itself is signalized and wide.
- **guardShack = true.** Single small staffed booth on the median island between
  inbound and outbound lanes at the interior gate.
- **remoteGs = false.** A physical staffed booth is present, so this is not a
  remote/kiosk gate.
- **postGateStaging = true / preGateStaging = false.** The deep paved apron
  between the road entrance, the interior gate, and the drop yard / docks holds
  many trucks inside the property; no dedicated outside-the-gate waiting stalls.
- **drivewayLong = true.** Approach from English Ave to the interior gate is well
  over 3 truck lengths; the signal keeps queues off the public road.
- **entryExitTogether = true.** One entrance point on English Ave for both
  directions; the booth island splits in/out internally at that single location.
- **fastLaneOpportunity = true.** Wide gate apron with an in/out split and ample
  unused paved width to add an express/bypass lane.
- **dockDoors = 50+.** Long door banks with trailers backed in on the SE face
  (~30+), the NE face, and the SE annex; total clearly exceeds 50.
- **dropArea = 50+ / dropYard = true.** Very large dedicated drop yard north and
  west of the warehouse, dozens of rows of parked bobtailed trailers.
- **shipRcvSeparate = true.** Distinct dock banks on separate building faces (SE
  and NE) plus the annex, consistent with split ship/receive.
- **multipleFacilities = true.** Main warehouse + SE annex/cross-dock + a west
  office/support building — a campus.
- **urbanRural = Urban.** Inside the Indianapolis metro, ringed by an interstate
  interchange and industrial development.
- **backupSensitive = false.** Signalized entrance with deep internal stacking;
  queues stay off the public road.
- **scale = false (uncertain).** No clear truck scale/weigh pad identified in the
  gate path.
- **railServed = false.** Mainline rail runs parallel just outside the SE
  property line, but no spur enters the property; trucks-only.
- **connectivityIssue = false / multiStep = false.** Dense metro (good cell);
  only one checkpoint stage observed.

## Yard zones and counts

- **perimeter:** 8-vertex oriented ring tracing the fenced property at its true
  ~30°-off-north orientation; ~37.7 acres (shoelace from the ring).
- **truckGate:** quad over the interior booth island and approach lanes.
- **dropYards:** two rings — the large N drop yard and the NW drop yard, each
  aligned to the trailer rows.
- **dockAprons:** two thin quads hugging the SE and NE dock walls at the
  building's angle.
- **staging:** post-gate apron quad between the gate and the docks/drop yard.
- **yardMetrics:** dockDoorCount ~95, trailersVisible ~180, trailerParkingCapacity
  ~220, truckGateCount 1, buildingCount 3, siteAreaAcres 37.7, railServed false.
  Counts are honest overhead estimates; door/trailer totals flagged approximate.

## Web findings

- Kroger DC at 7025 English Ave, operated by Zenith Logistics for Kroger (per
  Zenith's site, 24+ years; Louisville KY + Indianapolis IN). Facility phone
  317-352-5100. Listed across Yelp/Foursquare/CMac as the Kroger Distribution
  Center, Irvington.

## Final confidence: HIGH

Building positively identified; gate, guard booth, and barrier arm clearly
visible in satellite; entrance confirmed in Street View; docks and drop yard
unambiguous. Lane counts and the absence of a scale are the only low-confidence
calls (listed in uncertainFields).
