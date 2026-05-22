# Kraft Heinz — Ft Myers, FL

**Address:** 5521 Division Dr, Fort Myers, FL 33905
**Coords:** 26.66568, -81.80265
**Maps:** https://www.google.com/maps/@26.66568,-81.80265,400m/data=!3m1!1e3
**Type:** Manufacturer (Bagel Bites production plant)
**Archetype:** #9 — Gate + No Guard Shack + Remote Check-in
**Confidence:** High

---

## Location confirmation

The supplied approximate point (26.665613, -81.8031436) was within ~30 m of the
true facility center — already on the property. Web search confirmed the
address (`5521 Division Dr, Fort Myers, FL 33905`, Bagel Bites production
plant; ~58 employees per Buzzfile/Chamber of Commerce listings). The
distinctive blue-roof octagonal Kraft visitor-reception building visible in
Street View matches the satellite footprint exactly.

The site sits inside the Treeline Industrial Park east of Fort Myers, with
I-75 ~600 m to the east. Division Drive is the N-S access road forming the
**west** property line; it ends in a cul-de-sac ~150 m south of the truck
gate. A **canal / wetland** forms the **east** line and a **stormwater lake**
forms the **south** line — neither offers a vehicle approach, so the only
possible truck access is from Division Drive on the west.

## Imagery captured

- `khftm-z18.png` — overview at z18, located the candidate building.
- `khftm-z17-context.png` — wider context confirming surrounding industrial park and I-75 to the east.
- `khftm-z19a.png`, `khftm-z19-north.png`, `khftm-z19-south.png`, `khftm-z19-west.png` — z19 quad showing the whole footprint, north-side trailer staging strip, south lake boundary, west Division Drive frontage.
- `khftm-z20-truckgate.png`, `khftm-z20-fullnorth.png`, `khftm-z20-docks.png`, `khftm-z20-east.png`, `khftm-z20-sw.png`, `khftm-z20-w-entry.png`, `khftm-z20-ne.png`, `khftm-z20-north.png` — tight (z20) imagery of every property edge and the interior yard.
- `khftm-sv-w90.png`, `khftm-sv-nw60.png`, `khftm-sv-nw90.png`, `khftm-sv-n90.png`, `khftm-sv-n110.png`, `khftm-sv-gate-se.png`, `khftm-sv-mid90.png` — Dec-2024 Street-View walk down Division Drive past the office frontage and up to the truck gate.

## Gate / guard-shack / remote-GS determination

This is the load-bearing call for the archetype assignment. The Street-View
walk along Division Drive (heading 90° / E, captured Dec-2024) at three pano
locations gave a clear, repeated read:

- **`truckGate: true`.** At pano `26.66637, -81.80321` heading 90-110° the
  truck access driveway is closed by a **double-leaf chain-link swing gate**
  spanning the full driveway, with steel gate posts on both sides and chain-
  link fence continuing as the entire west perimeter. The earlier Buzzfile-
  reported deep audit (in this repo) was uncertain about the gate because
  trees screen the view from the office-frontage pano; walking ~30 m north on
  Division Drive resolves the screen and shows the closed gate plainly.
- **`guardShack: false`.** No staffed booth structure anywhere at the gate.
  The first building inboard of the gate is the octagonal Kraft visitor /
  admin reception (~30 m off the gate, with American flag), which is a
  multi-room office, not a 1-3-space lane-side booth. The interior beyond
  the gate is open paved parking and the trailer staging strip — no shack on
  the gate apron or driveway shoulder.
- **`remoteGs: true`.** Because the gate is closed and access-controlled but
  there is no staffed booth, the site must clear inbound trucks remotely.
  A small pole-mounted device on the right (south) side of the gate visible
  in `khftm-sv-n90.png` is consistent with a call-box / kiosk used for driver
  check-in.

This is the Jake "Archetype #9" pattern — closed gate, no shack, remote-or-
kiosk check-in — exactly the hint provided.

## Yard zones and counts

**Geofence (`perimeter`):** S 26.66470 / W -81.80330 / N 26.66665 / E -81.80200.
That's roughly **217 m N-S × 129 m E-W ≈ 28,070 m² ≈ 6.9 acres** — small
relative to the Aurora or Garland mother-plants, consistent with a single
product line (Bagel Bites).

**Truck gate (`geofences.truckGate`):** A short box on the west fence at
26.66631-26.66645 lat / -81.80330 to -81.80306 lng, covering the gate and
the very short driveway apron between Division Dr and the gate.

**Drop yard (`geofences.dropYards[0]`):** Paved trailer staging strip
between the silos / north production building and the south process
building, 26.66585-26.66620 lat / -81.80285 to -81.80220 lng. Holds the
parked-trailer rows visible in z19 and z20 imagery — about **6 trailers
visible** at imagery time, room for ~12. Marked `dropYard: true` because it
is a paved off-dock parking strip dedicated to trailers, not a dock apron.

**Dock apron (`geofences.dockAprons[0]`):** Strip immediately north of the
north dock face, 26.66572-26.66600 lat / -81.80285 to -81.80210 lng. The
three trailers seen backed in at the NE corner in `khftm-z20-east.png` and
`khftm-z20-docks.png` are at this dock face.

**`staging: null`** — no separate pre- or post-gate truck holding area large
enough to box independently from the drop yard. The very short gate apron
(see below) cannot stack trucks outside.

**`yardMetrics`:**

- `dockDoorCount: 8` — counted ~6-8 dock positions across the north face
  plus 2-3 on the NE-facing wing where trailers are backed in. Flagged in
  `uncertainFields` — comfortably in the 0-10 band.
- `trailersVisible: 6` — counted in z20-docks + z20-truckgate.
- `trailerParkingCapacity: 12` — the drop strip could hold ~12 if fully
  packed in two rows.
- `truckGateCount: 1` — only one vehicle entrance to the site.
- `buildingCount: 2` — north production building + south process building,
  joined by a narrow corridor.
- `siteAreaAcres: 6.9` — derived from the perimeter bbox.
- `railServed: false` — no rail spur on the property; nearest rail is well
  east of I-75.

## Classification highlights

- **`drivewayShort: true`, `drivewayLong: false`.** Gate sits only ~3-5 m
  off the Division Dr fence line. Once inside, the driveway opens into open
  paved yard within another ~20 m — there is no 3-truck-deep queueing lane
  between the gate and the dock apron.
- **`backupSensitive: true`.** A queue of inbound trucks at the gate spills
  immediately onto Division Drive. Division is a cul-de-sac (terminates
  ~150 m south of the gate), so any pile-up blocks both Kraft Heinz's own
  outbound traffic and the cul-de-sac itself.
- **`entryExitTogether: true`.** Single gate; trucks in and out share it.
  No alternative vehicle access on any other side (lake, canal, no road).
- **`postGateStaging: true`.** Once inside the gate the trailer drop strip
  doubles as a holding area before docks.
- **`fastLaneOpportunity: false`.** Single-lane gate with no room on the
  apron to add a bypass lane — the gate is bracketed by perimeter fence
  with no spare paved width.
- **`urbanRural: "Urban"`.** Inside a continuous industrial park with I-75
  immediately east — Urban industrial fabric.
- **`shipRcvSeparate: false`.** All resolved dock activity is on the north
  face / NE corner; no second dock bank on a different building face.
  Flagged in `uncertainFields` because the SE process-building face is
  obscured by rooftop equipment.
- **`scale: false`, `multipleFacilities: false`, `multiStep: false`,
  `connectivityIssue: false`.** No truck scale visible. Single property.
  Single checkpoint stage. Urban / metro cellular coverage.

## Web findings

- 5521 Division Dr — confirmed by Buzzfile, Chamber of Commerce, Macrae's
  Blue Book, IndustryNet, D&B listings.
- Phone: 239-693-4412.
- Headcount reported as ~58 (Buzzfile) — consistent with a small
  single-line production plant.
- Product: Bagel Bites for national distribution (per IndustryNet / Yelp
  listings tagged "Bagel Bites — 5521 Division Dr").

## Confidence

**High.** The facility is positively identified by Street-View signage
(Kraft Heinz octagonal reception with American flag) and address match.
Gate / no-shack / remote-check-in is read directly from a Dec-2024 Street
View pano showing the gate closed. Dock door count flagged as `uncertain`
in JSON only because exact bay count is hard to read through rooftop
equipment, but the band ("0-10") is unambiguous.

## Three-line summary

- **Gate:** YES — closed double-leaf chain-link swing gate on Division Dr.
- **Guard shack:** NO — no staffed booth; remote check-in via kiosk / call-box.
- **Confidence:** High.
