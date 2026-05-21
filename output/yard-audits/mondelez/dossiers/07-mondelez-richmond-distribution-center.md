# Deep-Audit Dossier — Mondelez Richmond Distribution Center, Sandston VA (idx 7)

## Facility
- **Name:** Mondelez Richmond Distribution Center - Sandston VA
- **Type:** Distribution center (3PL-operated, Kenco)
- **Roster address:** Airport Drive at SR-895 Interchange, Henrico County (Sandston), VA
- **Resolved address:** 953 S. Airport Drive, Sauer Industrial Center, Sandston VA
- **Locked coordinates:** 37.47980, -77.33820

## Step 0 — Location confirmation
The roster lat/lng (37.465612, -77.372007) was a GEOMETRIC_CENTER geocode and
landed on open farmland next to a highway, ~1.5 km from any building — clearly
wrong. Web research resolved the facility: the 447,000 sq ft Mondelez regional
supply-chain DC, operated by Kenco, opened Dec 2022 as a Becknell build-to-suit
in the Sauer Industrial Center, an industrial park just south of Richmond
International Airport on S. Airport Drive at the SR-895 (Pocahontas Parkway)
interchange. Address pinned to 953 S. Airport Drive.

Satellite probing of the airport-south area found the Sauer Industrial Center
with TWO large cross-dock warehouses. The southern building (37.4798, -77.3382)
shows a heavy, active trailer/dock operation consistent with a Mondelez snack
DC and a cross-dock configuration; it was locked as the audit target. (Street
View along SR-895 dates to 2019, predating construction, so signage could not
be confirmed by SV; identification rests on satellite + the published
park/address.)

## Key views
- **z14/z15 area:** Sauer Industrial Center, two large warehouses at the SR-895
  trumpet interchange amid woods/farmland south of the airport.
- **z17/z18 building:** Large rectangular cross-dock warehouse, dock doors with
  trailers backed in on the west, south and east faces.
- **z19 SE drop yard:** Extensive multi-row trailer drop yard near a
  stormwater pond — orange/blue/white/silver trailers in marked stalls, 50+
  visible.
- **z20 west face:** Dock doors with covered canopies along the west face,
  access road running parallel.
- **z20/z21 NW corner:** Covered employee-entrance canopy and car parking; the
  private access road feeds an open driveway/apron into the truck yard. No
  barrier arm or guard booth identified.

## Gate / guard-shack / dock determinations
- **truckGate = false (uncertain).** No barrier arm, sliding gate, or staffed
  checkpoint pinch-point is visible in satellite imagery. The SR-895-interchange
  access road feeds an open driveway/apron at the building's NW corner. Modern
  build-to-suit DCs frequently do have a gate that may not resolve in this
  imagery — flagged in uncertainFields.
- **guardShack = false (uncertain).** No gate-side booth seen. The only small
  structure at the NW corner is a building-attached employee-entrance canopy.
- **remoteGs = false (uncertain).** No gate confirmed, so no remote check-in
  inferred.
- **Docks:** Cross-dock warehouse with dock doors on the west, south and east
  faces; aggregate clearly **50+** (estimate ~90 doors). Many trailers backed
  in across all faces.
- **Drop area:** Dedicated trailer drop yard on the SE side — multiple stall
  rows full of untethered trailers, band **50+** (estimate ~90 capacity).
  dropYard = true.

## Yard zones and counts
- **perimeter:** developed footprint ~520 m N-S x ~354 m E-W, ≈ 45 acres (the
  full Mondelez parcel is ~83 acres including buffer woods and the pond).
- **truckGate box:** the open driveway/apron at the NW corner where the access
  road meets the property.
- **dropYards:** the SE multi-row trailer storage lot.
- **dockAprons:** the east/south dock apron and the west dock apron.
- **yardMetrics:** dockDoorCount ~90, trailersVisible ~70, capacity ~90,
  truckGateCount 1, buildingCount 1, siteArea ~45 ac, railServed false.

## Web findings
- Kenco Group / GlobeNewswire / The Shelby Report / Commercial Baking: 450,000
  (≈447,000) sq ft regional supply-chain DC, opened Dec 6 2022, operated by
  Kenco Logistics, part of a $122.5M Henrico County investment, ~80 jobs.
- Intercontinental Real Estate: Richmond Mondelez Distribution Center,
  single-story concrete tilt-wall, cross-dock configuration, bulk warehouse /
  order fulfillment / regional distribution.
- Richmond BizSense: located in Sauer Industrial Center, a 450-acre Sauer
  Properties park; the DC sits on an 83-acre site forming the bulk of phase 1.

## Classification rationale
Large modern cross-dock DC with dock doors on three faces (ship/receive likely
separated), a big dedicated trailer drop yard, deep yard staging room, and a
wide access road with fast-lane potential. Open entrance with no confirmed
gate/guard structure. Rural/edge-of-metro setting. Archetype likely No Gate /
No GS (#3-type) on the evidence, though gate status is genuinely uncertain.

## Confidence: MEDIUM
Building identification and yard layout are clear from recent satellite
imagery, but the facility is in a multi-building park (which-building inference
rests on activity level + published address rather than confirmed signage),
and gate/guard-shack status cannot be definitively resolved. truckGate,
guardShack, remoteGs, entry/exit lane counts and shipRcvSeparate flagged in
uncertainFields.
