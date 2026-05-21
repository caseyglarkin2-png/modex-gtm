# Pactiv Evergreen — Frankfort, IL (idx 18)

**Address:** 437 Center Road, Frankfort, IL 60423
**Type:** Manufacturing Plant (Foodservice; co-located warehouse)
**Resolved coordinates:** 41.490600, -87.846800
**Confidence:** High (gate flags medium — see notes)

## Location confirmation
Roster supplied GEOMETRIC_CENTER-precision coordinates (less precise than
ROOFTOP). Satellite probes at z16–z19 confirmed a large industrial / logistics
campus on the SE edge of Frankfort: a Foodservice manufacturing plant on the
west, a large co-located warehouse to the south, and additional warehouse/dock
buildings to the east, all bordered by farm fields to the south and east and
a rail line along the NW edge. The campus is consistent with the roster's
"Foodservice; co-located warehouse" description. I nudged the working center
slightly NE of the supplied point to the centroid of the building cluster.

## What the imagery showed
- **z16/z17 overview:** A multi-building campus. The west building is the
  Foodservice plant; a very large warehouse sits to its south; further dock/
  warehouse buildings extend east. A rail spur runs along the NW property edge.
- **Docks:** Extensive dock banks on multiple building faces, with rooftop
  dock monitors visible — total well above 50 doors (estimate ~70).
- **Drop yards:** Multiple large trailer drop yards across the campus. The
  captured imagery shows roughly 80 trailers parked (light + orange Pactiv-
  style trailers), with capacity well into the 100+ range.
- **Truck entrance:** Open paved driveways connect the campus to Center Rd and
  the south road. No barrier arm, sliding gate, or checkpoint pinch-point is
  visible in satellite imagery. NOTE: the only Street View panos on Center Rd
  are indoor office shots (a captured-pano artifact), so a road-level gate
  verification was not possible — the gate/guard-shack calls rest on satellite
  evidence and are flagged uncertain.

## Gate / guard-shack determination
- **truckGate: false** (medium confidence) — No physical control structure
  visible at the property-line entrances in satellite imagery. Flagged
  uncertain because entrance Street View was unavailable.
- **guardShack: false** (medium confidence) — No 1-3-vehicle booth structure
  beside any entrance lane in satellite imagery; flagged uncertain.
- **remoteGs: false** — No controlled truck gate identified.

## Yard zones & counts
- **Perimeter:** ~55 acres covering the full multi-building campus.
- **dockDoorCount:** ~70 — band 50+.
- **dropYard:** Yes — multiple large drop yards, ~80 trailers visible,
  band 50+.
- **buildingCount:** 4. **railServed:** true. **truckGateCount:** 2 open drives.
- **multipleFacilities:** true — plant + co-located warehouse + east buildings.
- **shipRcvSeparate:** true — dock clusters on separate buildings/faces.
- **fastLaneOpportunity:** true — wide internal drives and large open yards.
- **urbanRural:** Rural — edge-of-town industrial campus among farm fields.

## Web findings
- Listed on the Pactiv Evergreen Locations page as a Foodservice manufacturing
  plant with a co-located warehouse. Limited additional public operational
  detail.

## Final confidence: High overall
Location and yard layout are unambiguous and well-imaged. The truckGate /
guardShack calls are medium-confidence because entrance-level Street View was
unavailable (office-interior panos only) — flagged in uncertainFields.
