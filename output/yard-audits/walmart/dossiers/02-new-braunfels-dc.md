# Yard Audit — Walmart General Merchandise DC 6016, New Braunfels TX

**Facility:** Walmart General Merchandise DC 6016
**Type:** General Merchandise Distribution Center
**Address:** 3900 N Interstate 35 (frontage road), New Braunfels, TX 78130 (Comal County)
**Resolved center:** 29.7356, -98.0640
**Method:** deep-audit (satellite + Street View + web)
**Confidence:** high

---

## Location confirmation

The supplied coordinates (29.735123, -98.063993) landed on the building but
slightly off-center. Wide z16 satellite showed a single very large white-roof
distribution building hard against the I-35 frontage road, rotated ~30-35°
(long axis NW-SE), wrapped by enormous parallel trailer drop-rows on its SW
side. Web search confirmed Walmart Distribution Center #6016 at 3900 N I-35,
New Braunfels (phone 830-620-3300; ~1,000-4,999 staff; a $21M
renovation ran 2023-2024). Street View at the truck entrance shows the building
face lettered **"WAL-MART DISTRIBUTION CENTER — OUR PEOPLE MAKE THE
DIFFERENCE"** plus a **Sam's** roundel, positively identifying the site. Center
re-pinned to the building roof centroid at 29.7356, -98.0640.

## Key views

- **z16/z17 wide:** one dominant ~1.4M+ sqft GM DC building, rotated NW-SE.
  Employee auto parking on the NE roof-shadow side; long SW dock wall faces a
  massive drop yard. Two additional large warehouse buildings sit to the
  south/southeast (campus).
- **NW entrance (z19) + Street View:** curved truck driveway off the I-35
  frontage road pinches to a checkpoint. A small **canopied guard booth** sits
  beside the entry lane against the building's NW corner; regulatory placard
  signs flank the drive. Wide paved staging apron between road and building.
- **SW dock wall (z18):** dock doors with trailers backed in run the full
  length of the long SW wall; the apron opens onto dozens of long parallel
  trailer drop-rows (50+ trailers).
- **E/SE (z17-18):** more trailer rows east of the building, plus two separate
  warehouse buildings with their own small dock faces and trailer parking.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Controlled NW entrance: curved truck drive narrows to a
  checkpoint with a guard booth and regulatory signage. Street View pano
  `RGOuNXZiISH58cGvHIZ03w` (captured 2018-12) confirms the pinch-point and
  signed entry. Not an open driveway.
- **guardShack = true.** Small canopied booth (~1-2 space footprint, windows on
  multiple sides) beside the entry lane, clearly visible in Street View headings
  110 and 250.
- **remoteGs = false.** A staffed booth is present — manned gate, not a
  kiosk/app remote check-in.
- **dockDoors = "50+".** Continuous dock-door rhythm with trailers backed in
  along the long SW wall plus the short NW wall.
- **shipRcvSeparate = true (medium).** Active docks on two distinct building
  faces (SW long wall and NW short wall) imply separated ship/receive flows;
  inferred from overhead only.

## Yard zones and counts

- **perimeter:** 7-vertex oriented ring tracing the developed/fenced property
  (main DC + SW drop yard + E trailer rows + southern annex buildings).
  Shoelace area **92.1 acres**.
- **truckGate:** rotated quad over the NW checkpoint, aligned to the entry drive.
- **dockAprons:** two thin rotated strips — (1) long SW dock apron hugging the
  SW wall at the building's angle, (2) NW short-wall apron. No axis-aligned
  boxes; both follow the building rotation.
- **dropYards:** (1) large SW trailer field between the SW apron and the SW
  fence; (2) E/SE trailer rows.
- **staging:** paved pre/post-gate apron just inside the NW entrance.
- **streetViewMeta:** real pano `RGOuNXZiISH58cGvHIZ03w` at the entrance covers
  both perimeter (heading 153, toward building) and truckGate (heading 143).

### yardMetrics (overhead estimates)
- dockDoorCount ~120, trailersVisible ~320, trailerParkingCapacity ~450
- truckGateCount 1, buildingCount 3, siteAreaAcres 92.1, railServed false

## Web findings

Walmart DC #6016 — General Merchandise distribution branch serving the region;
large workforce; recent multi-million-dollar interior renovation (2023-2024).
No rail service; road/truck access only via the I-35 frontage road.

## Final confidence

**High.** Facility positively identified by on-building Wal-Mart DC signage in
Street View; gate, guard booth, docks, and drop yards all directly observed.
Lower-confidence items flagged: exact entry/exit lane counts, ship/receive
separation, and the campus (multipleFacilities) attribution of the southern
buildings.

---

**3-line summary**
- Gate: TRUE — controlled NW truck entrance off I-35 frontage road, checkpoint pinch-point with signage.
- Guard shack: TRUE — small canopied staffed booth beside the entry lane (remoteGs false).
- Confidence: HIGH.
