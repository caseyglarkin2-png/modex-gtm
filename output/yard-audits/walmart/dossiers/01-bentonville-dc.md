# Yard Audit Dossier — Walmart Regional DC 6094, Bentonville AR

**Facility:** Walmart Regional Distribution Center #6094 (General Merchandise DC, ~1.25M sf)
**Address:** 5801 SW Regional Airport Blvd, Bentonville, AR 72712
**Resolved center:** 36.32050, -94.25820
**Maps (satellite):** https://www.google.com/maps/@36.32050,-94.25820,400m/data=!3m1!1e3
**Method:** deep-audit (satellite z15-z20 + Street View) · **Confidence:** high

---

## 1. Location confirmation

The supplied coordinates (36.320045, -94.25814) landed directly on the building,
so only minor self-correction of the center was needed. Web search confirmed the
address and identity: a ~1.2-1.25M sf Walmart GM Distribution Center #6094 at
5801 SW Regional Airport Blvd, phone 479-254-3200, opened ~20 years ago. Wide
z15/z16 satellite showed an unmistakable large distribution building with an
enormous multi-row trailer drop yard - consistent with a Walmart RDC and not an
office or unrelated property. A Street View pano at the SW intersection
(36.31898, -94.26333, captured 2025-01) shows the facility's light-colored
buildings and a Walmart-blue directional sign down the entrance road, locking the
identification.

## 2. Site geometry / what the key views showed

The complex is one large stepped building mass oriented **diagonally** (long axis
running NW to SE), so every zone is traced as a rotated quad - a north-aligned box
would miss the walls.

- **Upper wing (NW):** a long narrow building running NW-SE. Dock doors line its
  NE face (z18 showed a continuous dark dock-door band with trailers backed in),
  feeding a large drop yard immediately to its NE/E.
- **Main building (S/SE):** the large white block. West face is employee parking
  (hundreds of cars) plus a retention pond and water tanks - **not** docks. Dock
  doors run along the **east** and **south** faces.
- **SW annex:** a separate gray angular-roofed building at the SW corner
  (transportation/maintenance office), counted as the 2nd building.
- **Drop yard:** the dominant feature - hundreds of trailers parked in long
  parallel rows filling the east and center of the property (z18 east view showed
  trailers wall-to-wall). A large unpaved dirt pad at the N is overflow/expansion.

## 3. Gate / guard-shack / dock determinations (with evidence)

- **truckGate = TRUE.** The truck entrance is at the SW corner off SW Regional
  Airport Blvd. z19/z20 imagery shows a controlled multi-lane entrance: striped
  median, directional lane arrows, and a clear checkpoint pinch-point where the
  drive meets the property.
- **guardShack = TRUE.** A manned guard booth sits in the lane median between the
  inbound and outbound lanes (dark-roofed ~1-vehicle-footprint structure at
  ~36.3186, -94.2606), exactly the classic guarded-gate signature. A separate
  inbound check-in canopy building stands just inside the gate with trucks queued
  under it - hence **multiStep = TRUE** (booth, then check-in canopy).
- **remoteGs = FALSE** (physical staffed booth present).
- **preGateStaging = TRUE** - wide paved apron between the public road and the
  booth for arriving trucks. **postGateStaging = TRUE** - a bobtail/trailer
  staging lot with marked stalls sits just inside the gate (SW).
- **Lanes:** roughly 2 in / 2 out with directional arrows; exact split is hard to
  read from overhead, so entryLanes/exitLanes are flagged uncertain.
  **fastLaneOpportunity = TRUE** - the gate apron is very wide with unused paved
  width to add an express/bypass lane.
- **Docks:** **dockDoors = 50+.** Hundreds of doors across the upper-wing NE face
  and the main-building east and south faces (south z18 view showed a long
  continuous bay rhythm with dock equipment). **shipRcvSeparate = TRUE** - the
  dock banks are on physically distinct building faces.
- **dropArea / dropYard = TRUE, 50+.** A dedicated multi-row trailer-storage yard
  separate from active dock staging.

Street View detail of the booth itself is not resolvable (nearest pano is ~250m
west at the road intersection), but overhead z19/z20 is unambiguous on the gate
and booth. The intersection pano is recorded for both perimeter and truckGate as
the driver's-eye arrival frame.

## 4. Yard zones and counts measured

- **Perimeter:** 9-vertex ring tracing the fenced property at its true diagonal
  orientation; ~**107 acres** (shoelace from the ring). Consistent with a
  large RDC site.
- **dropYards (3 rings):** upper NE yard, the long east drop yard, and the center
  drop yard between the wings.
- **dockAprons (3 thin strips):** upper-wing NE face (diagonal), main-building
  east face, main-building south face - each a long thin quad hugging its wall.
- **truckGate / staging:** rotated quads aligned to the entrance drive.
- **yardMetrics (overhead estimates):** dockDoorCount ~240; trailersVisible ~420;
  trailerParkingCapacity ~600; truckGateCount 1; buildingCount 2; rail FALSE
  (the line south of the building is a drainage swale, no spur enters the site).

## 5. Web findings

Walmart DC #6094 is an established GM regional DC. Driver-facing notes mention
designated truck parking, overnight parking for drivers awaiting appointments,
driver restrooms, and **load-status updates via text message while drivers wait** -
all consistent with a high-volume guarded yard running appointment/drop
operations, matching the large drop yard and guarded multi-lane gate observed.

Sources: Waze / Wheree / Talk Business & Politics / Manta / Chamber of Commerce
listings for "Walmart DC 6094, 5801 SW Regional Airport Blvd, Bentonville AR".

## 6. Final confidence

**High.** Facility identity and location are certain; the gate, guard booth,
multi-face docks, and large drop yard are all directly visible. Lane counts, the
presence of a truck scale, and the two-stage (multiStep) entry are flagged as
overhead-only estimates in `uncertainFields`.

**Gate: YES (controlled multi-lane truck gate). Guard shack: YES (manned booth in
the lane median). Confidence: high.**
