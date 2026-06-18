# Deep-Audit Dossier — Site 2: CA PL Guelph Factory

- **Facility:** CA PL Guelph Factory (Primo Brands / BlueTriton / former Nestle Waters Canada — Pure Life bottling plant + head office)
- **Type:** Bottling plant (PL)
- **Resolved address:** 101 Brock Road South, Puslinch (Aberfoyle), Ontario N0B 2J0, Canada
- **Resolved coordinates:** 43.46345, -80.14885
- **Method:** deep-audit (satellite + Street View + web + geocoding)
- **Final confidence:** medium

---

## 1. Locating the facility

The supplied coordinates (43.5448, -80.2482) were city-level and landed ~10 km
NW inside Guelph proper. Web research established the plant identity and address:

- Yelp ("NESTLE WATERS, 101 Brock Road S, Puslinch, Ontario") and the Wellington
  County business directory list **101 Brock Road South** for Blue Triton /
  Nestle Waters Canada.
- CBC's plant tour ("A rare look inside Nestle's Aberfoyle water bottling plant")
  confirms a combined **"Nestle Waters Canada Bottling Plant and Head Office"** on
  Brock Road bottling ~56 million cases/yr.
- **Closure caveat:** BlueTriton announced it would wind down its Ontario
  operations and close the Aberfoyle plant by **end of January 2025** (CBC,
  Wellington Advertiser, The Narwhal). The site was listed for sale; the wells
  were sold to White Wolf Property Management. The plant is therefore **idle** in
  current imagery — buildings intact, yard empty of trailers.

Google Geocoding API placed 101 Brock Rd S at **43.46248, -80.14992**. A
satellite probe there revealed an isolated industrial plant set in forest,
immediately west of the large Dufferin Aggregates Aberfoyle quarry, with rooftop
bottling-line process units, water storage silos, an attached office, employee
parking, and a large paved truck yard. Locked center at **43.46345, -80.14885**.

**False-candidate corrected:** early probing centered on a very large white
~282,000 sqft warehouse ~1.5 km ESE (43.4625, -80.1305, McLean Rd / Brock Rd
near the GO bus station). Web search identified that as the **Maple Leaf Foods
distribution centre (DB Schenker 3PL)**, not the BlueTriton plant. The geocoder
plus the distinctive isolated-in-forest layout (spring pond + quarry adjacency)
disambiguated the real plant to the **west** at -80.1499.

---

## 2. What each key view showed

- **z16 geocode probe (43.4625,-80.1499):** isolated industrial building in
  forest, abutting the tan aggregate quarry; a long access drive curving SW.
  Positive identification.
- **z17/z18 plant views:** main grey plant building (center-right) with rooftop
  process-unit arrays (bottling lines) and round water silos; attached office +
  employee parking lot at the NE; a **large paved truck/trailer yard** wrapping
  the S/SW, currently empty; a spring-fed pond immediately N of the building.
- **z18 access-road view:** the single private driveway enters from the plant's
  **NE corner (~43.46415,-80.14760)** and runs ~500 m NE through forest to the
  **Brock Road roundabout (~43.4655,-80.1432)**.
- **z19/z20 dock + yard:** the loading face is along the **SE/E side** of the
  building where the yard meets the wall; parking/staging striping visible in the
  yard; no trailers present (closed).
- **Street View:** roundabout panos only (43.4665,-80.1422, captured 2025-08).
  **Zero Street View coverage on the property or the private drive** — the gate
  and docks cannot be confirmed at ground level. Metadata queries at the
  perimeter, drive entry, and drive mouth all returned ZERO_RESULTS.

---

## 3. Gate / guard-shack / dock determinations

- **Truck gate — FALSE (low confidence).** No barrier arm, sliding gate, or
  checkpoint structure could be positively resolved on overhead imagery. The site
  is reached by a single ~500 m private forest driveway; a controlled gate almost
  certainly exists somewhere on that drive (standard for a secured Nestle/
  BlueTriton water plant), but it is not visible in the captured frames and there
  is no Street View to confirm. Flagged uncertain.
- **Guard shack — FALSE.** No booth-sized structure (1-3 vehicle footprint,
  multi-side windows) at the drive entrance or yard. The small white object at the
  SW back corner of the yard is stored pallets/material + a treeline shed, not a
  gatehouse.
- **Remote check-in (remoteGs) — FALSE** (no confirmed gate).
- **Dock doors — band 10-25 (medium-low confidence).** Loading runs along the
  SE/E building face; with the plant closed there are no backed-in trailers to
  count by. Estimate ~16 doors from building scale (56M-case/yr plant) and apron
  width.
- **Drop area — NONE (currently).** The yard is empty of trailers (idled Jan
  2025). Physical capacity would be large (~25-50 band) if active; per rubric
  this counts trailers actually present, which is zero.

---

## 4. Yard zones and counts

- **Perimeter:** ~11.9 acres of developed/paved footprint (building + yard +
  parking) inside the forest treeline (10-vertex oriented polygon). The deeded
  spring-land property is far larger but is forest/well-field, not yard.
- **Truck gate zone:** small quad at the NE drive entry (43.46410,-80.14770),
  best estimate of the controlled access point.
- **Dock apron:** one thin quad along the SE/E building face.
- **Staging:** the large internal paved yard S/SW of the building (post-gate
  holding/queue space).
- **Drop yards:** none active (empty).
- **yardMetrics:** dockDoorCount ~16, trailersVisible 0, trailerParkingCapacity
  ~60, truckGateCount 1, buildingCount 1, siteAreaAcres 11.9, railServed false.

---

## 5. Web findings

- Combined bottling plant + head office on Brock Road, ~56M cases/yr (CBC tour).
- BlueTriton (spun off from Nestle Waters NA in 2021) closed the Aberfoyle plant
  end of Jan 2025; site listed for sale, wells sold to White Wolf Property
  Management (Wellington Advertiser, Guelph Today, The Narwhal, CBC).
- Address corroborated by Yelp and Wellington County business directory.

---

## 6. Final confidence: MEDIUM

Identity, address, and location are **high confidence** (geocoded + corroborated
+ visually consistent). The classification is **medium** overall: the gate/guard
calls are low-confidence because the controlled access point sits on a private
forest drive with no Street View, and dock/drop counts are degraded by the
closed/empty state of the yard (no trailers as visual anchors). Key uncertain
fields: truckGate, guardShack, remoteGs, dockDoors, entryLanes, exitLanes,
dropArea, connectivityIssue.
