# Deep Audit — NFI Distribution Center Florence NJ (idx 4)

**Account:** NFI Industries
**Facility type:** Distribution Center
**Given address:** 1 Crossings Blvd, Florence, NJ 08518
**Given (approximate) coords:** 40.11814, -74.80977 — geocode flagged `APPROXIMATE`/weak
**Resolved center (audited building):** 40.10685, -74.81385
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied coordinates (40.11814, -74.80977) were wrong. A z16 satellite probe
there showed a residential neighborhood with municipal ball fields in central
Florence Township — no industrial building. The real facility is **NFI Park at
Florence Crossings**, an NFI-developed multi-tenant logistics campus at
**2020 US-130 North**, "less than half a mile from NJ Turnpike Exit 6A," about
1.5 km SSW of the bad pin (NFI Industries and Florence Township sources).

Working SW from the bad point, a z15 probe at 40.105, -74.825 surfaced the campus:
a cluster of large distribution buildings between the Delaware River and US-130 /
the NJ Turnpike. The campus comprises ~1.65M SF across four tenant buildings
(Subaru parts DC, QPSI, and others). The audited building is the **Subaru of
America parts distribution + training center** that NFI built-to-suit here:
526,050 SF, tilt-up concrete, 32' clear, **83 loading doors**, rooftop solar /
LEED. It is unmistakable from above by its full rooftop solar array. Center
locked at **40.10685, -74.81385**.

Orientation: the whole park is rotated ~30° clockwise of north (buildings' long
axes run NNW-SSE, parallel to US-130). All geofences below are traced as rotated
quads following that orientation, not north-aligned boxes.

---

## Key views

- **z15 / z16 wide (40.105,-74.825 / 40.1090,-74.812):** confirmed the campus, US-130
  along the north edge, internal access road (Crossings Blvd) feeding the park, the
  audited solar-roof building in the center, big white-roof DC to its west, more
  tenant buildings east and south.
- **z17 building-centered (40.10685,-74.81385):** read the audited building footprint —
  one large structure under a continuous roofline (solar arrays + a roof seam), long
  axis NNW-SSE. Docks on the WEST face fronting the shared central truck court.
- **z18 west dock face (40.1062,-74.8138) + north court (40.1078,-74.8155):** long bank
  of dock doors with trailers backed in, plus a deep/wide shared truck court between this
  building and the white DC to the west; trailers staged along a central landscaped median.
- **z18 north court mouth (40.10845,-74.81655):** large trailer **drop yard** at the NW,
  packed with parked trailers (no tractors).
- **z18 south approach (40.1045,-74.8128):** office/car parking at the building's south
  end, open internal loop road (Crossings Blvd) — no gate, no booth.
- **Street View (pano `iA_Q0KZKtWn73NgJAiliHw`, 2022-10, @40.10414,-74.81299):** the only
  Street View coverage on the parcel, on the southern loop road. Heading 320/346 shows the
  building's south end across an open landscaped lawn and stormwater basin — **no perimeter
  fence, no gate, no guard booth**. Headings along the road (50°/230°) show an open,
  two-lane, business-park street with monument signage and no checkpoint.

---

## Gate / Guard-shack / Dock determinations

- **truckGate = false.** NFI Park at Florence Crossings is an open business-park campus.
  No barrier arm, sliding/swing gate, or pinch-point checkpoint exists at the US-130
  entrance, along the internal Crossings Blvd loop, or at the building's truck court.
  Confirmed in Street View (open frontage) and at every satellite access point. An open
  driveway runs from the public road through to the docks.
- **guardShack = false.** No staffed booth (no 1-3-space structure beside any drive).
  Street View south frontage and satellite of all entrances show none.
- **remoteGs = false.** There is no gate, so this is moot/false (not a gated-but-unstaffed site).
- **dockDoors = "50+".** Subaru/NFI build-to-suit spec = 83 doors; satellite confirms a long
  west-face dock bank with trailers backed in plus additional doors at the north end.
- **dropYard = true / dropArea = "50+".** Dedicated trailer storage lot at the NW of the
  parcel plus heavy court staging — well over 50 trailers parked without tractors.
- **postGateStaging = true; drivewayLong = true.** Wide, deep shared truck court holds 3+
  trucks; trailers stage on the internal median inside the property.
- **entryExitTogether = true.** Trucks enter and exit via the same open internal road/court.
  `entryLanes`/`exitLanes` = null (no gate to count controlled lanes at).
- **multipleFacilities = true.** The building is one tenant within the 4-building NFI campus.
- **urbanRural = "Rural".** Planned logistics park on the edge of small-town Florence
  Township beside US-130 / Turnpike Exit 6A, with farmland/open land and residential
  adjacent. Per the rubric's small-town-industrial tiebreak. (Listed uncertain.)
- **scale, shipRcvSeparate, backupSensitive, fastLaneOpportunity, connectivityIssue,
  multiStep, railServed = false.** No truck scale, no rail spur, no second checkpoint;
  site is well-served by cellular (highway-adjacent, not isolated).

---

## Yard zones & counts (geofences)

- **perimeter** — rotated 6-vertex ring around the audited Subaru/NFI building, its west
  truck court, the NW drop yard, and the south office parking. Polygon area ≈ **43.6 acres**.
- **truckGate** — set to the north court mouth area (no physical gate; geofence marks the
  primary truck ingress point for the parcel).
- **dropYards** — one ring over the NW trailer storage lot.
- **dockAprons** — one long thin rotated quad hugging the WEST dock face / central court.
- **staging** — rotated quad over the central court median where trailers stage.
- **streetViewMeta.perimeter** — pano `iA_Q0KZKtWn73NgJAiliHw`, heading 346° (toward the
  building), `hasCoverage: true`. **truckGate** — no pano within 300m, `hasCoverage: false`.

**yardMetrics:** dockDoorCount 83 (from spec, corroborated by imagery), trailersVisible ≈180,
trailerParkingCapacity ≈260, truckGateCount 0, buildingCount 1, siteAreaAcres 43.6,
railServed false.

---

## Web findings

- NFI Industries press release: Subaru of America selected NFI Park at Florence Crossings;
  526,050 SF, tilt-up, 32' clear, **83 loading doors**, 17,000 SF office/training, rooftop
  solar (NFI Solar), LEED, operational June 2013.
- Florence Township and REBusinessOnline corroborate the address (2020 US-130 N) and specs.
- NFI Park full build-out ≈ 1.65M SF across four tenants (Subaru, QPSI HQ, and others),
  confirming the **campus / multipleFacilities** call.

## Final confidence

**High.** Building positively identified (unique rooftop solar + documented 83-door spec),
gate/guard determinations confirmed from both Street View and satellite. Uncertain fields:
`entryLanes`/`exitLanes` (no gate to count) and `urbanRural` (heavy surrounding logistics
development vs. small-town setting).
