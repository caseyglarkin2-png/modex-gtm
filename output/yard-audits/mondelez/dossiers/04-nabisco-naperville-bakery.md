# Deep-Audit Dossier — Nabisco Naperville Bakery (Naperville IL)

**Account:** Mondelez · **Roster idx:** 4
**Type:** Manufacturing — cracker bakery (sole North America Triscuit plant)
**Address:** 1555 W Ogden Ave, Naperville, IL 60540
**Resolved center:** 41.77140, -88.18800
**Confidence:** High

## Location confirmation
Roster coordinate (41.771784, -88.187766) landed on the bakery property.
Satellite probes (z16-18) revealed a large multi-building industrial bakery
campus with a U-shaped trailer drop yard on the west and flour silos. Web
research (Yelp, Waze, Baking Business) confirms 1555 W Ogden Ave as the
Mondelez/Nabisco Naperville bakery — the sole North America Triscuit plant.
Street View confirms a fenced industrial facility with flour silos. Locked
center on the building-complex centroid.

## Key views
- **Wide (z16-17):** Multi-building bakery campus — main bakery, separate
  trailer-dock building to the N, ancillary/utility structures; large U-shaped
  trailer drop yard on the west bordered by a farm field; W Ogden Ave on the
  NE.
- **Truck yard / rail (z19, 41.7709,-88.1888):** A rail spur runs into the
  property with hopper/tank cars parked at the flour silos — rail ingredient
  receiving.
- **Drop yard (z19, 41.7718,-88.1908):** Trailer storage lot full of trailers
  parked in dense rows.
- **Truck gate (Street View 2018/2024):** Chain-link perimeter fence with
  barbed wire; the internal road off Quincy Ave passes a canopy-covered
  checkpoint structure.

## Gate / guard-shack determination
- **truckGate = true.** The plant is fully perimeter-fenced (chain-link with
  barbed wire, confirmed in Street View). The internal truck road from Quincy
  Ave (south) passes a gate/checkpoint structure with a canopy near the
  rail-car loading area — a controlled truck entrance.
- **guardShack = true (flagged uncertain).** A canopy-covered checkpoint
  structure stands at the truck-gate lane (visible in Street View backgrounds).
  Consistent with a staffed guard booth/checkpoint; called true at medium
  confidence.
- **remoteGs = false** (booth/checkpoint present).
- **drivewayLong = true.** The internal truck road runs a long distance from
  the Quincy Ave gate to the docks and drop yard.
- **fastLaneOpportunity = true.** Wide internal road and large open yard space
  give room for an express/bypass lane.

## Yard zones & counts
- **Perimeter:** S 41.77000 / W -88.19150 / N 41.77420 / E -88.18450 — approx
  58 acres of developed/fenced footprint.
- **Truck gate:** Quincy Ave checkpoint area on the south.
- **Drop yard:** large U-shaped west-side trailer lot, ~60 trailers visible,
  ~100 capacity.
- **Dock apron:** NW-face dock bank (and others) with trailers backed in.
- **Dock doors:** ~32 across multiple faces → band 25-50.
- **shipRcvSeparate = true:** rail receiving (silos) separate from truck docks.
- **Rail:** rail spur into the property → railServed = true.
- **Buildings:** main bakery + N trailer-dock building + ancillary →
  multipleFacilities = true.

## Web findings
Yelp / Waze / Baking Business: 1555 W Ogden Ave is the Mondelez/Nabisco
Naperville bakery, focused on Triscuit production — the sole North America
Triscuit plant and one of Mondelez's four strategic US biscuit bakeries. An
industrial-history source notes both the Chicago and Naperville Mondelez/Nabisco
plants "are still rail served," corroborating the rail spur observed.

## Final confidence: High
Facility unambiguously identified and confirmed by web research. Gate, fenced
perimeter, drop yard, rail service, and docks all visible. Guard-shack call
(canopy checkpoint structure) is medium-confidence and flagged; truck-scale
presence and exact outbound-lane count also low-confidence.
