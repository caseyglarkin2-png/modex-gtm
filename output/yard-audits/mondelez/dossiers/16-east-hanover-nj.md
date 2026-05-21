# Deep-Audit Dossier — idx 16

## Mondelez North America Headquarters / East Hanover Bakery Campus — East Hanover, NJ

### Resolved location
- **Roster supplied:** 40.8126, -74.3676 — a city-level centroid that landed
  in cemetery / open green space roughly 600 m east of the real campus.
- **Resolved:** ~40.8120, -74.3738 (100 DeForest Avenue, East Hanover, NJ
  07936). Confirmed via web research (Mondelez US site, East Hanover
  Partnership directory, Morris Chamber) plus satellite — the only
  large-scale industrial complex matching the address corridor.
- **Confidence in location:** high.

### Facility type — office vs freight
This is **both**. The East Hanover address is officially Mondelez's North
America headquarters, but the campus is a large multi-building **industrial
complex** — it houses the Nabisco East Hanover bakery and a major
distribution operation. This is a genuine, high-relevance freight facility,
not a pure corporate office. An office-profile building sits at the NW end of
the campus; the rest is long warehouse/manufacturing rows.

### What the imagery showed
- **z15 overview:** sprawling complex of long buildings running NE–SW,
  bounded by DeForest Ave / office-retail parks on the SW and a large
  cemetery on the NE. Roughly 8+ distinct large buildings.
- **z17–z18 core:** very heavy truck activity — dock aprons on multiple
  building faces with trailers backed in, plus two large trailer drop areas
  holding 100+ trailers between the building rows.
- **NW corner:** an office-style building with landscaped grounds; solar
  arrays on adjacent lots.
- **Street View (NW frontage, 2023-10):** brick Mondelez building exterior
  with a **rail spur running along its base** — confirms rail service into
  the property.
- **Street View near DeForest Ave:** public panos only reach the adjacent
  retail shopping plaza; the campus truck entrance is on internal private
  roads and is not Street-View accessible.

### Gate / guard-shack determination
The campus is a private, fenced industrial complex set well back from public
roads, accessed by internal drives. The truck gate itself could not be
directly imaged from public Street View. For a corporate-HQ-grade industrial
campus of this scale, a guarded controlled entrance is the strong norm —
classified `truckGate: true`, `guardShack: true`, `remoteGs: false`, but both
flagged in `uncertainFields` because the booth was not directly observed.
No truck scale identified — `scale: false`.

### Yard zones and counts
- **Perimeter:** ~78 acres enclosing the full campus.
- **Drop yards:** two large trailer storage/staging areas between building rows.
- **Dock aprons:** dock banks on multiple faces — `shipRcvSeparate: true`.
- **dockDoorCount ~90** (overhead estimate, band 50+).
- **trailersVisible ~110**, **capacity ~150**.
- **railServed: true** (confirmed via Street View).
- **multipleFacilities: true** — true campus, 8+ buildings.

### Final confidence: medium
Location is certain and the freight character is unambiguous. Gate/guard-shack
specifics and exact door counts are overhead-imagery estimates flagged for
human review.
