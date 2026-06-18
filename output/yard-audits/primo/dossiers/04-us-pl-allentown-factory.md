# Deep-Audit Dossier - Site 04: US PL Allentown Factory

**Facility:** US PL Allentown Factory (Nestle Waters / Deer Park / BlueTriton - Primo Brands bottling plant)
**Type:** Bottling plant (PL)
**Address:** 405 Nestle Way, Breinigsville, PA 18031
**Resolved center:** 40.57450, -75.62930
**Method:** deep-audit
**Final confidence:** medium

---

## 1. Location resolution & how it was confirmed

The supplied coordinates (40.5333, -75.6333) were ~4.7 km too far south: a z16 satellite
probe there showed only single-family residential streets and farmland in Breinigsville
proper, no industrial structure. Web search confirmed the active facility as **Nestle
Waters North America (now BlueTriton Brands / Deer Park, a Primo Brands subsidiary) at
405 Nestle Way, Breinigsville PA 18031**, ~40.573, -75.6313. Nestle's own press material
confirms this as their Lehigh Valley bottling facility ($79M two-year expansion;
Nestle Pure Life and Deer Park spring water distributed across PA and the Mid-Atlantic).

A z15 probe at the corrected point landed squarely in the large Breinigsville industrial
park off Rt 222 / I-78. The **main bottling plant** is the central complex with process
tanks/silos on the NW and a connected production + red-roof warehouse building - locked
at **~40.5745, -75.6293**. This is distinct from (but campus-connected to) two very large
adjacent distribution warehouses (SW and SE) and an NE office building.

---

## 2. What each key view showed

- **z15 / z16 wide (p04-z15, p04-plant-z16, p04-perim-z16b):** The full campus. Central
  dark/grey-roof production building with a large red-roof warehouse section, process
  tanks/silos clustered on the NW corner, employee parking + office plaza on the NE.
  Two big white-roof DC warehouses flank it SW and SE, each with deep trailer-row drop
  lots. Confirms a **multi-building campus** (multipleFacilities = TRUE).
- **z17 NE / N tanks (p04-ne-z17, p04-n-tanks-z17):** Process equipment, water-treatment
  tanks (circular structures), and the production roof. Trailers ring the building in
  drop rows on all sides.
- **z18 east front (p04-e-front-z18):** Long east-facing dock bank with box trailers
  backed in; the rail spur clearly visible running NW-SE past the building; dense trailer
  drop rows east and SE.
- **z18 west yard (p04-w-yard-z18):** SW DC warehouse dock face + trailer rows; rail line
  visible on the right.
- **z18 front drive (p04-frontdrive-z18):** NE office/employee frontage - parking lots,
  a landscaped brick entrance plaza with a small structure (office canopy / possible
  security point), office building.
- **z19/z20 south & SW (p04-southdock-z20, p04-gatecheck-z20, p04-secorner-z19):** Rail
  spur + retention pond on the south edge; packed trailer drop rows along the west yard
  interior with the perimeter chain-link fence running the property edge.

---

## 3. Gate / guard-shack / dock determinations (with evidence)

**Truck gate - TRUE (medium, flagged).** Street View along Nestle Way (south frontage)
shows a **continuous perimeter fence on every frame**: ornamental black steel fence across
the office/employee frontage (p04-sv-gate-ne, p04-sv-gate-n, p04-sv-open1/2) and chain-link
around the trailer yards (p04-sv-entrance1). There is no open public-road access to the
docks - the campus is fully enclosed with a controlled landscaped front entrance plaza.
The actual truck-entry drives are **private and Street-View-inaccessible**, so a specific
barrier arm or sliding gate could not be imaged; but a fully fenced, single-controlled-entry
Fortune-brand beverage plant of this scale is gated by definition. The truckGate geofence
is placed at the estimated NE main-entry drive.

**Guard shack - TRUE (medium, flagged).** No discrete booth structure (1-3-vehicle
footprint, multi-side windows) was positively imaged at a truck lane, because the entrance
drives are not on Street View; a small canopy/structure is visible at the front plaza
(p04-frontdrive-z18). Given the full perimeter fence + controlled single front entrance
on a major beverage plant, staffed security is the overwhelming expectation. Visual
confirmation of a guard booth was NOT obtained - this is the principal reason the audit
is medium rather than high confidence. remoteGs is FALSE on the assumption of staffing.

**Docks - 50+.** Dock banks span multiple faces of the production complex: a long
east-facing bank with trailers backed in (p04-e-front-z18), the south red-roof warehouse
face, and west-facing docks, plus the two adjacent DC warehouses each with their own dock
banks. The main plant alone is comfortably in the 50+ band; dockDoorCount = 60 is a
conservative honest estimate for the main complex (flagged). Shipping/receiving appears
**split across distinct building faces** (shipRcvSeparate = TRUE, medium).

---

## 4. Yard zones & counts measured

- **Perimeter:** 8-vertex oriented ring around the secured main-plant parcel (production
  building + immediate fenced truck yard), ~32 acres. The full campus including the two
  DC warehouses is well over 100 acres.
- **Truck gate:** small quad at the estimated NE main-entry drive.
- **Drop yards:** two rings traced - the west trailer yard and the east/SE trailer yard;
  drop rows also wrap the south. dropArea = 50+ (hundreds of trailers campus-wide).
- **Dock aprons:** two strips - east dock face and south red-roof face.
- **yardMetrics:** dockDoorCount ~60, trailersVisible ~220, trailerParkingCapacity ~300,
  truckGateCount 1, buildingCount 4 (production complex + 2 DC warehouses + office),
  siteAreaAcres ~32 (main parcel), **railServed TRUE** (spur runs into/alongside the
  property, clearly visible south/southwest).
- **postGateStaging TRUE** (large internal paved yards + ring road); **drivewayLong TRUE**
  (deep internal approach); **backupSensitive FALSE** (wide setback, ample internal
  stacking); **scale FALSE** (none imaged; could be on a private drive); **multiStep FALSE**.

---

## 5. Web findings

- Nestle Waters North America, 405 Nestle Way, Breinigsville PA 18031, (610) 530-7301.
  Now operated under BlueTriton Brands (Deer Park) / Primo Brands.
- Nestle USA press release: $79M two-year expansion of the Lehigh Valley bottling facility;
  produces Nestle Pure Life and Deer Park spring water distributed across PA and the
  Mid-Atlantic. Confirms a high-volume, multi-line production + distribution operation -
  consistent with the heavy dock/trailer-yard footprint observed.

---

## 6. Final confidence

**Medium.** Facility identity and location are certain (high). Perimeter fencing, rail
service, multi-building campus, 50+ docks and a 50+ drop-yard are well-supported by clear
2026 satellite imagery. The gate / guard-shack / entry-lane calls are medium because the
truck-entry drives are private and Street View cannot reach them; truckGate and guardShack
are assessed TRUE from the definitive perimeter fence + controlled front entrance + facility
class, but lack a directly imaged barrier arm or booth - hence flagged in uncertainFields.
