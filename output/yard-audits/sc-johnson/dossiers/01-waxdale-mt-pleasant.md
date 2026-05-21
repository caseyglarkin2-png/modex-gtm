# Waxdale Plant — Mt. Pleasant, WI (sc-johnson idx 1)

**Facility type:** Manufacturing Plant (Aerosol / Liquid / Gel)
**Address:** 8311 16th St, Mt. Pleasant, WI 53406 / 53177
**Resolved center:** 42.70750, -87.88500
**Confidence:** High

## Location resolution
The roster's supplied coordinate (42.712313, -87.885932) lands in open green
space at the *north* edge of the property — it is the geocode of the street
address, not the plant. Probing satellite outward (z14-z21) and corroborating
with the SC Johnson Waxdale Fact Sheet (the world's largest/fastest aerosol
plant, 2.2M sq ft, opened 1955) confirmed the facility: the very large
multi-building industrial campus immediately south of the supplied point,
bounded by a private entry boulevard on the north, 16th St on the south, a
wooded/wetland buffer on the west, and open land on the east. SC Johnson
signage ("SC Johnson — A Family Center") and SC Johnson's known on-site wind
turbines are both visible in Street View, confirming ownership. Locked center
at 42.70750, -87.88500 (centroid of the developed footprint).

## Key views
- **Wide satellite (z14-16):** one contiguous very large building cluster with
  multiple satellite buildings, extensive trailer lots, and a rail spur.
- **North entry boulevard (z18-21):** a divided boulevard runs from the public
  road south into the plant; at its head sits a controlled-entry checkpoint.
- **Gate close-up (z20-21):** a substantial central guardhouse (hipped roof,
  ~3-4 vehicle footprint) sits in the boulevard median; white directional lane
  arrows route inbound traffic down the right side and outbound up the left.
  Multiple lanes, deep apron, engineered geometry.
- **Drop yards (z19):** rows of nose-out parked trailers (white/blue/orange
  fleet colors) in the north and mid-west of the campus — large trailer
  storage. Additional trailers backed into dock banks.
- **Docks (z18-20):** dock banks on at least two distinct building faces (a
  north-west bank and a south/south-east bank), trailers backed in, covered
  pipe/conveyor bridges spanning between buildings.
- **Rail (z18):** a rail spur curves into the property from the south-west
  with multiple sidings holding boxcars and covered hoppers — actively used.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A clearly engineered controlled entry: the head of the
  private boulevard at ~42.7121, -87.8860 has lane-split markings, a guard
  building, and routed inbound/outbound lanes. Not an open driveway.
- **guardShack = true.** A manned guardhouse building occupies the median of
  the entry, with traffic lanes routed around both sides — the classic
  gate-with-guard pattern, just at large-campus scale. `remoteGs` therefore
  false.
- **dockDoors = "50+".** A 2.2M sq ft plant with 15 production lines and
  multiple visible dock banks across separate building faces. Exact count is an
  overhead estimate (≈90), banded 50+ with high confidence in the band.
- **dropArea = "50+" / dropYard = true.** Multiple large lots of parked
  trailers without tractors, separate from active dock staging.
- **shipRcvSeparate = true.** Dock banks on physically distinct building faces.
- **fastLaneOpportunity = true.** Wide multi-lane gate apron and a long
  boulevard approach leave clear paved room for an express/bypass lane.
- **multipleFacilities = true.** ~9 distinct large buildings on the campus.
- **railServed = true.** Active rail siding into the property.
- **scale:** none positively identified in the gate path; left false but
  flagged uncertain (the plant interior is not fully street-viewable).

## Yard zones & counts
- **Perimeter:** ~1.22 km N-S x 0.78 km E-W fenced developed footprint,
  ≈218 acres of active site (SC Johnson's total Waxdale land holding is
  larger; the geofence captures the operational/fenced area).
- **Truck gate zone:** north-boulevard checkpoint.
- **Drop yards:** three boxed zones — north lot, mid-west lot, south-central
  lot — collectively well over 50 trailer stalls; ≈320 trailer capacity.
- **Dock aprons:** two boxed — north-west bank and south/south-east bank.
- **Staging:** the boulevard between the gate and the building frontage acts
  as both pre- and post-gate staging given its length.
- **yardMetrics:** ≈90 dock doors, ≈180 trailers visible, ≈320 trailer
  capacity, 1 truck gate, 9 buildings, ≈218 acres, rail-served true.

## Web findings
SC Johnson Waxdale Fact Sheet and Journal Times reporting confirm Waxdale as
SC Johnson's largest plant — 2.2M sq ft, opened 1955, ~700-850 team members,
15 finished-goods lines plus a components plant, ~430M aerosol cans/yr,
~60M cases/yr; brands Glade, OFF!, Windex, Raid, Scrubbing Bubbles, Pledge,
Shout, Drano, method. On-site wind turbines confirmed (Reliable Plant). This
is the operating heart of SC Johnson and its highest-leverage YardFlow target.

## Final confidence: High
Facility unambiguous, gate/guard/dock/rail all directly observed. Door counts
and trailer-capacity figures are honest overhead estimates flagged uncertain;
a possible interior truck scale could not be confirmed or ruled out.
