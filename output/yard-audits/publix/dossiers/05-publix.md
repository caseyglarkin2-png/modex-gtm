# Deep-Audit Dossier — Publix Grocery Distribution Center, Boynton Beach FL

- **Facility:** Publix Grocery Distribution Center
- **Type:** Grocery Distribution Center
- **Address:** 5500 Park Ridge Blvd, Boynton Beach, FL 33426
- **Confirmed center:** 26.54345, -80.07825
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Location confirmation

The supplied coordinates (26.543727, -80.078017) landed directly on a very large
distribution complex. A zoom-16/17 satellite pull showed an enormous two-mass
warehouse (tan-roof west building, white-roof east building) with long banks of
dock doors and trailer rows on the south face, bounded by a residential
community and lake to the north, a school athletic field/lake to the west, Park
Ridge Blvd to the south, and separate industrial buildings plus I-95 and a rail
line to the east. Web search confirmed the Publix Distribution Center at 5500
Park Ridge Blvd, Boynton Beach FL 33426 (phone 561-369-7900), a DC serving
Publix stores across the Southeast. Street View of the SW entrance shows a parked
**Publix** trailer just inside the gate, positively confirming the building. No
coordinate correction was needed; center locked at 26.54345, -80.07825.

## Steps 1-5 — What the views showed

**Wide / tight satellite.** Two connected building masses forming one DC
complex. Dock doors with trailers backed in run the full length of the south
faces of both buildings; additional docks appear on the west face of the west
building and the north face of the east building. Large paved trailer drop yards
sit north of the west building, at the west end, and along the south yard.
Employee parking fronts Park Ridge Blvd along the south, inside a landscaped
buffer. The complex is fenced on all sides. The buildings sit very nearly square
to the cardinal grid with only a slight counter-clockwise tilt.

**Truck entrance.** The main (and only) truck entrance is at the SW, off Park
Ridge Blvd: a divided boulevard-style driveway with stone-clad landscaped median
islands splitting inbound (west) and outbound (east) lanes.

**Street View — gate & guard shack.** Pano `Ie_RTboQCNAI3UHAjRDdYQ` (captured
2024-04) at 26.541457, -80.080525, looking north (heading ~4°) into the drive,
shows:
- a small tan, peaked-roof **guard booth** in the median beside the lanes
  (roughly a single-vehicle footprint, windows on multiple sides) — a classic
  staffed guard shack;
- a silver **sliding/swing gate and chain-link fence** running across the lanes
  and along the property frontage to the east;
- a parked **Publix** trailer just inside, and driveway light poles.

Zoom-20 satellite over the same spot (26.5419, -80.0804) corroborates: the booth
sits at ~26.5417, -80.0806, with gate controls and painted directional lane
arrows across the divided drive. This is a controlled, staffed, gated truck
entrance — **truckGate: true, guardShack: true, remoteGs: false.**

**Docks.** Two long dock banks on the south faces (~40-50 doors each), plus
west-face and north-face dock banks. Total comfortably exceeds 100 doors ->
**dockDoors: 50+.** Docks on multiple building faces indicate separated
shipping/receiving clusters (shipRcvSeparate: true, medium confidence).

**Drop yard / trailers.** Extensive trailer storage: rows north of the west
building, a west-end lot, and along the south yard. Dozens of trailers parked
without tractors -> **dropArea: 50+, dropYard: true.** ~90 trailers visible in
the captured imagery; estimated yard capacity ~160.

**Setting.** Dense Boynton Beach / Palm Beach metro fabric — residential
community, school, adjacent industrial parks, I-95 — so **urbanRural: Urban** and
**connectivityIssue: false** (strong cellular coverage expected).

**No rail spur** enters the property (the rail line east of the site is beyond
I-95). **railServed: false.** No truck scale observed (**scale: false**). No
second post-gate checkpoint observed (**multiStep: false**). Single building
cluster property -> **multipleFacilities: false** (counted as 2 structures in
buildingCount).

## Web findings

Publix DC at 5500 Park Ridge Blvd, Boynton Beach FL 33426; 561-369-7900; part of
Publix's distribution network supplying ~1,200 stores across the Southeast.
Trucker reviews reference standard guarded check-in / receiving operations,
consistent with the on-the-ground gate-and-booth observation.
(Sources: Yelp, Waze, CMac.ws, Manta, Chamber of Commerce listings.)

## Geofences & metrics

- **perimeter** — oriented ring tracing the fenced property (south buffer at
  Park Ridge Blvd up to the north drop-yard/treeline, west treeline by the
  school to the east perimeter road); ~68 acres.
- **truckGate** — quad over the SW divided entrance / guard-booth area.
- **dropYards** — three rings: north-of-west-building lot, west-end lot, and the
  long south yard strip.
- **dockAprons** — three rings hugging the south dock face, the west dock face,
  and the north (east-building) dock face.
- **staging** — inside-gate paved holding area before the dock faces
  (post-gate).
- **streetViewMeta** — truckGate: pano `Ie_RTboQCNAI3UHAjRDdYQ`, heading 4°,
  hasCoverage true (driver's arrival frame). perimeter: no ground-level pano at
  the building-interior centroid (ZERO_RESULTS) -> hasCoverage false.

**yardMetrics:** dockDoorCount ~140, trailersVisible ~90,
trailerParkingCapacity ~160, truckGateCount 1, buildingCount 2,
siteAreaAcres 68.3, railServed false.

## Final confidence: high

Building identity, gate, and guard shack are confirmed from both Street View and
high-zoom satellite. Lane counts and ship/receive separation are the only
medium-confidence calls (flagged in uncertainFields).

### 3-line summary
- Gate: TRUE — SW divided boulevard entrance with sliding gate + fence across the truck lanes (Street View confirmed).
- Guard shack: TRUE — small staffed peaked-roof booth in the entrance median (remoteGs false).
- Confidence: high.
