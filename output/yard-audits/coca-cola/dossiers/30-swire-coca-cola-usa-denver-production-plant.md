# Deep-Audit Dossier — idx 30

## Swire Coca-Cola USA — Denver Production Plant, CO

**Roster address:** 14025 E 38th Ave, Denver, CO 80239 (incorrect)
**Resolved location:** 3825 N York St / 2145 E 40th Ave, Denver, CO 80205
**Locked center:** 39.77010, -104.96180
**Confidence:** high

### Step 0 — Location resolution

The roster supplied "14025 E 38th Ave" and coords 39.770555, -104.819041.
Those are wrong:

- A satellite + Street View probe of the roster coordinates found an unrelated
  far-east Denver industrial park (warehouses, a Staples distribution building)
  with no Coca-Cola presence.
- "14025 E 38th Ave" does not appear in Swire Coca-Cola's facility list. Per
  the Swire Colorado page, Swire's Denver facilities are: a **distribution
  center at 9900 E 40th Ave** (Central Park) and the **production plant at
  2145 E 40th Ave / mailing 3825 N York St, Denver CO 80205**.
- Probing the York St / E 40th Ave corridor located the production plant. It
  was **positively identified**: the building's east facade carries a large
  **Coca-Cola logo with the red dynamic-ribbon wave** (confirmed in 2024/2025
  Street View). Locked center ~39.7701, -104.9618.

This is the **oldest operating Coca-Cola bottling plant in the United States**
(~90 years old). Swire is building a $475M replacement plant in Colorado
Springs (opening spring 2028); the Denver plant is still operating as of
May 2026.

### Key views

- **Overview (z17):** Multi-building plant complex south of a rail/intermodal
  yard, bounded by residential streets. Main production building (Coca-Cola
  facade), a long sawtooth-roof warehouse, and additional warehouse buildings.
- **Plant facade (Street View):** Large Coca-Cola logo with the red ribbon
  wave on the east-facing building; US and Colorado flags out front.
- **Trailer yard (z18-z19):** Fenced yard with red Coca-Cola trailers and
  tractors plus blue/white trailers; red Coca-Cola product (cases) stacked
  outside; trailers backed into dock banks on the north and west building
  faces.

### Gate / guard-shack / dock determinations

- **truckGate = true.** The trailer yard is enclosed by chain-link fencing
  with chain-link sliding gates (visible in Street View, with bollards). At
  least two gate openings observed on the SW side off the yard road.
- **guardShack = false.** No staffed guard booth visible at the chain-link
  truck gates in any Street View or satellite imagery — basic sliding gates.
- **remoteGs = true.** Truck gate present but no guard shack — check-in is
  kiosk/remote style.
- **entryExitSeparate = true.** Multiple gate openings serve as distinct
  in/out points.
- **postGateStaging = true.** The large fenced trailer yard inside the gate
  serves as a post-gate holding/queue area before the docks.
- **drivewayLong = true.** The fenced yard is large and deep, easily holding a
  3+ truck queue between gate and docks.
- **dockDoors = 50+.** Long dock banks span the north and west building faces
  with dozens of trailers backed in (overhead estimate).
- **dropArea = 25-50.** Fenced trailer drop yard with Coca-Cola trailers and
  tractors.
- **multipleFacilities = true.** Campus of 3+ connected buildings.

### Yard zones and counts

- **Perimeter:** full plant complex, ~355 m N-S x ~430 m E-W, ~16 acres.
- **Truck gate:** chain-link gates on the SW yard road.
- **Drop yard:** fenced trailer yard, ~70 trailers visible, ~85 capacity.
- **Dock apron:** dock banks along the north/west warehouse faces.
- **Buildings:** 3 (production plant, sawtooth-roof warehouse, additional
  warehouse).
- **Rail:** a rail/intermodal yard runs immediately north of the property, but
  no spur appears to run into the plant — `railServed` left false.

### Web findings

- Swire Coca-Cola Colorado page: Denver production plant at 2145 E 40th Ave /
  3825 N York St; distribution center at 9900 E 40th Ave.
- News (9News, BusinessDen, REBusinessOnline): the Denver York St plant is the
  oldest Coca-Cola bottling plant in the country; a $475M replacement is being
  built in Colorado Springs, opening spring 2028.

### Final confidence: high

Facility positively identified by the Coca-Cola logo on the building facade
despite a wrong roster address/coordinates. Gate, drop yard, and dock layout
are well supported by satellite + Street View. Dock-door and trailer counts
are honest overhead estimates (flagged); ship/receive separation and exact
gate count could not be physically confirmed.
