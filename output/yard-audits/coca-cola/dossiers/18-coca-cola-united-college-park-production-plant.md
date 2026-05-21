# Deep-Audit Dossier — idx 18

## Coca-Cola UNITED — College Park Production Plant, GA

### Resolved location
- **Roster input:** 3151 Sullivan Rd, Atlanta GA 30337; lat/lng 33.623174, -84.482599 (RANGE_INTERPOLATED, "moved 1 m").
- **Problem:** The roster coordinate landed on a vacant paved lot ~1.5 km west of the real site; the roster house number (3151) is wrong. The correct address is **2355 Sullivan Road, College Park, GA 30337**, but the Census and Nominatim geocoders for that address also interpolated onto an unrelated rural stretch of Sullivan Road.
- **Correct facility:** Coca-Cola UNITED College Park Production Plant, located at ~**33.6268, -84.4680**, off Sullivan Road in the Cooks Crossing industrial area near the I-85/I-285 interchange (close to Hartsfield-Jackson airport). Pinned via an OpenStreetMap "Coca-Cola" POI and confirmed in **Step 0** by Street View: the building carries a red "Coca-Cola" logo, and the yard entrance has red "TRUCK ENTRANCE" signs.
- It is a production + distribution facility, 325+ associates, acquired by Coca-Cola UNITED from The Coca-Cola Company in April 2017.

### Key views
- **z16-17 overview:** A large production/distribution building (gray roof) with an attached office building (darker roof, south); dock doors along the building's west face; a rail line running through the property; a large trailer drop yard on the west; employee parking on the south.
- **z18-19 building/docks:** ~45 dock doors along the building's long west face with trailers backed in; dense rows of staged trailers fill the west drop yard.
- **z19 rail:** A rail line runs through the property between the production building and the west trailer yard, directly alongside the building — the site is rail-served.
- **Street View:** Red "Coca-Cola" logo on the building; red "TRUCK ENTRANCE" signs at a Sullivan Road driveway; chain-link perimeter fence.

### Gate / guard-shack / dock determinations
- **truckGate = true:** Street View shows red "TRUCK ENTRANCE" signs at a controlled driveway off Sullivan Road and a chain-link perimeter fence enclosing the property. (Gate barrier hardware is not clearly resolved in the available views.)
- **guardShack = false:** No distinct freestanding beside-the-lane guard booth identified at the truck entrance in Street View or satellite. Medium confidence.
- **remoteGs = true:** Truck gate present, no guard shack identified — kiosk / badge check-in implied.
- **dockDoors = "25-50":** ~45 doors along the building's west face, trailers backed in — approximate.
- **shipRcvSeparate = false:** Docks read as one continuous bank on a single building face.
- **railServed = true:** A rail line runs through the property alongside the building.

### Yard zones and counts
- **perimeter:** south 33.6244, west -84.4698, north 33.6288, east -84.4662 — ~490 m N-S × ~334 m E-W ≈ **40.4 acres**.
- **truckGate zone:** Sullivan Road truck entrance, south side.
- **dropYard:** large west trailer-storage drop yard.
- **dockApron:** strip along the building's west face.
- **staging:** paved holding area inside the gate before the docks/drop yard.
- **yardMetrics:** ~45 dock doors; ~120 trailers visible; ~180 trailer capacity; 1 truck gate; 2 buildings; 40.4 acres; rail-served = true.

### Web findings
- The College Park Production Center (2355 Sullivan Rd) is a Coca-Cola UNITED production and distribution facility with 325+ associates across production and distribution departments; it joined the UNITED family in April 2017 (previously operated by The Coca-Cola Company).

### Final confidence
**High.** Facility positively identified by the OSM POI, the red "Coca-Cola" building logo and the "TRUCK ENTRANCE" signage visible in Street View; the building, docks, large drop yard and rail line are clearly readable in satellite. Gate-hardware specifics (`guardShack`/`remoteGs`) and the exact `dockDoorCount` are inferred/approximate and flagged uncertain.

**Archetype indicators:** Gate, no guard shack (remote check-in), very large trailer drop yard, rail-served production/distribution plant.
