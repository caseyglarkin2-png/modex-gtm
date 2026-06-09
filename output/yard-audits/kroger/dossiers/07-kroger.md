# Deep-Audit Dossier — Fred Meyer Grocery Distribution Center, Clackamas OR (idx 07, Kroger)

**Facility:** Fred Meyer Grocery Distribution Center (Kroger banner)
**Type:** Grocery Distribution Center
**Address:** 11500 SE Hwy 212, Clackamas, OR 97015
**Resolved center:** 45.40632, -122.5466
**Method:** deep-audit (satellite probe + Street View + web research)
**Confidence:** high

---

## Step 0 — Location confirmation

The supplied approximate coordinates (45.406321, -122.545991) landed directly
on a large white-roofed warehouse in the Clackamas industrial area. Wide
satellite (z15) showed an enormous contiguous DC complex straddling SE Highway
212. Web search corroborated the address: Yelp ("Fred Meyer Distribution
Center, 11500 SE Hwy 212, Clackamas"), Cortera, FFLs.com (Fred Meyer Stores
Inc, FFL 9-93-005-01-1K-03675), and Waze ("Fred Meyer Distribution Center,
11506 State Hwy 212"). Fred Meyer is a Kroger banner. Building footprint,
dock banks, and the packed drop-trailer yards are all consistent with a grocery
DC. The supplied coords sit on the east building of the campus; the true campus
center is ~45.40632, -122.5466.

Adjacent properties were excluded after inspection: the mobile-home park and
separate light-industrial buildings north of Hwy 212, the lumber/pallet yard to
the west, and the separately-parked buildings east of the east drop yard are
not part of the DC.

## Site layout

SE Highway 212 runs essentially E-W along the north edge. From the road
inward (south): public road -> employee parking strip -> perimeter fence ->
full-width drop-trailer yard -> dock aprons -> two large warehouse buildings
(west building; east building with rooftop solar) joined by a center
connecting/cooler building -> south building wall (internal road and separate
tenants beyond). A second, large angled-row drop yard sits on the east end
beyond the east building. The complex is close to north-aligned; building
walls and the highway run nearly true E-W / N-S, so the geofences are traced as
near-axis quads following the real wall and fence lines.

## Truck gate — TRUE

The main truck entrance leaves Hwy 212 at the center-east of the property
(~45.4070, -122.5453) and runs south into a deep, controlled checkpoint.

- **Satellite z20** shows a small blue-roofed booth seated in the middle of the
  truck lanes with a landscaped median, lane striping, directional arrows, and
  trucks queued in the flanking lanes.
- **Street View (pano aQW2NR0V4EEYMAkS0iz3Lg, captured 2019-10)** looking south
  into the entrance shows an overhead gantry signed **LANE 1 / LANE 2 / LANE 3**,
  a STOP sign at each lane, and a posted sign: **"USE ALL THREE LANES / LEAVE 30
  FOOT SAFETY GAP BEHIND TRUCKS."** This is an unambiguous, guarded, three-lane
  truck checkpoint.

Verdict: controlled truck gate, 3 inbound lanes, single entry/exit point
(entryExitTogether). Estimated 2 outbound lanes from apron width (flagged
uncertain). Deep approach apron stacks 3+ trucks (drivewayLong).

## Guard shack — TRUE

The blue-roofed booth in the middle of the gate lanes (~1-2 vehicle footprint,
windows visible, set beside/between the lanes) is a staffed guard shack,
visible in both z20 satellite and the entrance Street View frames. Because a
staffed shack is present, remoteGs = false.

## Staging

- **preGateStaging: true** — paved apron and lane stacking outside/before the
  booth, between Hwy 212 and the checkpoint.
- **postGateStaging: true** — large paved yard inside the gate before the dock
  doors (the drop-yard strip doubles as inside-gate holding).

## Docks & yard

- **dockDoors: 50+** — both warehouses carry long banks of dock doors along
  their north faces with trailers backed in; total comfortably 100+ across the
  campus (counted ~180 as an honest overhead estimate).
- **dropArea / dropYard: 50+ / true** — a full-width drop-trailer strip runs the
  length of the property between the buildings and the highway, plus a large
  angled-row drop yard east of the east building. Hundreds of parked trailers;
  ~320 visible, capacity ~420.
- **shipRcvSeparate:** not confirmed — docks concentrated on the north faces;
  flagged uncertain.
- **scale:** none seen in the truck path.
- **railServed:** false — no rail spur enters the property.
- **multipleFacilities: true** — west building, east (solar) building, and a
  center connector building on one secured campus.

## Fast-lane opportunity — TRUE

Already three inbound lanes plus a very wide gate apron with unused paved
width; clear physical room for an express/bypass lane.

## Setting

**Urban.** The site is embedded in the dense Clackamas/Portland-metro
industrial fabric with continuous surrounding development. connectivityIssue:
false.

## Yard metrics (overhead estimates)

| metric | value |
|---|---|
| dockDoorCount | ~180 |
| trailersVisible | ~320 |
| trailerParkingCapacity | ~420 |
| truckGateCount | 1 |
| buildingCount | 3 |
| siteAreaAcres | ~56.3 (computed from perimeter polygon) |
| railServed | false |

## Street View metadata

- **perimeter:** pano l3D5_wuFUzeq8ASQKvOTGA (Hwy 212 frontage, 2025-06),
  heading 180 (camera south into the property). hasCoverage: true.
- **truckGate:** pano aQW2NR0V4EEYMAkS0iz3Lg (gate entrance, 2019-10), heading
  178 (camera south into the checkpoint). hasCoverage: true. This is the frame a
  driver sees on arrival and the single most valuable image.

## Web findings

Fred Meyer (Kroger) Clackamas DC, grocery distribution, 11500/11506 SE Hwy 212.
Phone (503) 650-2007. Facebook page "Fred Meyer DC Clackamas." Confirmed as a
Kroger-owned grocery distribution operation, consistent with the high-volume
drop-yard and multi-lane gate observed.

## Final confidence: HIGH

Facility unambiguously identified and gate/guard-shack confirmed from both
overhead and ground-level imagery. Only exitLanes and shipRcvSeparate are
flagged uncertain.

### Sources
- Yelp: https://www.yelp.com/biz/fred-meyer-distribution-center-clackamas
- Cortera: https://start.cortera.com/company/research/k3r9ltk2k/fred-meyer-distribution-center/
- FFLs.com: https://www.ffls.com/ffl/993005011k03675/fred-meyer-stores-inc
- Waze: https://www.waze.com/live-map/directions/fred-meyer-distribution-center-state-hwy-212-11506-clackamas
