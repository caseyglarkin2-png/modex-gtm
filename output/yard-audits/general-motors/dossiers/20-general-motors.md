# Deep-Audit Dossier — idx 20
## GM - Parma Metal Center, Parma OH

**Type:** Stamping/Metal Center
**Resolved center:** 41.41555, -81.77355
**Confidence:** high

### Location resolution
Roster supplied a point ~2.5 km north of the plant, landing in a Parma
residential subdivision (confirmed by a z16 satellite probe showing only houses
and tree-lined streets). Web research (GM.com, GM Authority, Wikipedia) places
the Parma Metal Center at 5400 Chevrolet Blvd, 44130, in the Cleveland metro
just south of I-480 between W 130th St and Tiedeman Rd, east of Cleveland
Hopkins airport: a 2.3M sq ft stamping/metal-assembly plant operating since
1948, ~475 tons of steel/day, serving the majority of GM North America vehicles.

A geocode of ~41.4162,-81.7720 led to the correct industrial corridor; satellite
probing (z15-z19) positively identified the plant as the large light-roofed
monolithic stamping complex centered at 41.41555,-81.77355. Identifying features:
the stamping-plant roof, a multi-track rail yard with railcars and spurs running
into the west edge of the building, a covered conveyor bridge crossing the south
truck apron, and a 2-story brick administration block fronting Chevrolet Blvd on
the east. Center locked there.

### Key views
- **z15 full:** Whole site south of I-480 - main plant center-frame, rail
  corridor + I-480 to the NW, office frontage and employee parking to the E/SE,
  unrelated industrial/self-storage buildings to the south (excluded).
- **z17-z18 west:** Multi-track rail yard with railcars (boxcars/coil cars) along
  the full west edge, spurs into the building, trucks staged beside the rail -
  the inbound steel face.
- **z19 south face:** Covered dock canopy and a long conveyor bridge across the
  south truck apron; rows of material containers/coils and staged trailers - the
  outbound dock + drop band.
- **z18 east / office:** Brick administration building with a landscaped circular
  drive on Chevrolet Blvd; employee parking lots fill the SE.
- **Street View (Chevrolet Blvd, 2024-08):** Chain-link security fence runs the
  full north frontage with the metal-clad plant wall set back behind it - the
  site is fully fenced/secured. The east frontage panos show the office block and
  a blue-awning employee/visitor entrance, not a truck gate.

### Gate / guard-shack / dock determinations
- **truckGate: true.** Entire property is enclosed by chain-link security fence
  (confirmed in 2024 Street View along Chevrolet Blvd). As a GM/UAW stamping
  plant, access is controlled; truck/rail material entrances pinch through the
  fence on the NW (rail side) and a second on the south/SE. Two truck gates.
- **guardShack: true (medium confidence).** Standard for a GM plant of this
  vintage/size to staff a manned booth at the controlled gate. Street View has no
  pano at the interior truck entrances to image the booth directly, so this is
  inferred from the fenced single-controlled-entry layout; remoteGs false.
  Flagged uncertain.
- **dockDoors: 10-25.** Covered dock apron along the south building face plus
  truck doors on the west face by the rail yard; counted ~22, flagged uncertain
  because some doors sit under canopy and much material moves by rail.
- **shipRcvSeparate: true.** Inbound steel by rail + truck on the WEST/NW face;
  outbound stampings ship from the SOUTH dock face - two distinct material faces.
- **dropArea: 10-25 / dropYard: true.** A band of staged trailers and material
  containers runs along the south apron, separate from dock-active trailers.

### Yard zones and counts
- **perimeter:** oriented 6-vertex ring tracing the fenced GM property (~110
  acres): NW rail-yard corner, NE along Chevrolet Blvd past the office, south down
  the east employee-lot edge, SW across the south yard, north up the west rail
  edge.
- **truckGate:** NW rail-side controlled entrance where the material drive crosses
  the fence line.
- **dropYards:** one ring along the south drop/staging band.
- **dockAprons:** two - a long thin strip on the south face (outbound) and a strip
  on the west face beside the rail yard (inbound).
- **streetViewMeta:** perimeter pano gt5d9WvQr0j3gw5uCZRBzw (office frontage,
  heading 230 toward site interior); truckGate pano VXaQPa3o7pxHVdXqy0-k_g (NW
  Chevrolet Blvd frontage at the rail-side entrance, heading 180).
- dockDoorCount ~22, trailersVisible ~18, trailerParkingCapacity ~45,
  truckGateCount 2, buildingCount 1, siteAreaAcres ~110, railServed true. Counts
  are honest overhead estimates; flagged where noted.

### Web findings
- GM Parma Metal Center, 5400 Chevrolet Blvd, Parma/Cleveland OH 44130. 2.3M sq
  ft, opened 1948, 100M+ parts/yr, 475+ tons steel/day. Small/medium/large
  transfer press lines, high-speed progressive presses, a cut-to-length shear,
  and GM North America's largest stand-alone multi-cell resistance/laser welding
  metal-assembly operation. Recent $250M GM investment announced.
- Serves ~20-40 customers including the majority of GM NA-built vehicles.

### Final confidence
**high** - facility positively identified; the fenced perimeter, rail-served
west face, south dock apron, drop staging, and separate ship/receive faces are
all clear in imagery. Lower-confidence items (exact dock count, lane counts, and
guard-booth presence at the interior gates, which Street View cannot reach) are
flagged uncertain. Gate verdict: gated/controlled. Guard-shack verdict:
manned-gate likely (medium).
