# Deep-Audit Dossier — Pet Food Plant, Topeka KS (idx 14)

## Resolved location
- **Roster input:** address only "Topeka, KS 66619", APPROXIMATE geocode 38.948122, -95.693136 (moved 2,646 m) — landed in south-central Topeka, the WRONG area.
- **Resolution:** Web search resolved the real plant to **2200 NW Brickyard Rd, Topeka KS 66618** — the Big Heart Pet Brands / J.M. Smucker pet food plant and distribution center (formerly Del Monte Foods, in Topeka 55+ years; produces Meow Mix, Milk-Bone and other dry pet food/snacks; ~1.2M sq ft; ~350 employees; a $20.5M expansion announced). Confirmed coordinates **39.087119, -95.722563** (a directory listing for 2200 NW Brickyard Rd).
- **Disambiguation:** Topeka also has a very large Goodyear tire plant at 2000 NW US-24, ~2 km ENE — an even bigger multi-section plant. Care was taken NOT to audit the Goodyear building. The audited site is the Big Heart/Smucker pet-food campus on NW Brickyard Rd.
- **Confirmed building:** Satellite shows a large multi-section manufacturing plant joined to a large distribution center, extensive trailer drop yards, a corporate office building, and bulk-ingredient silos along the rail line. Consistent with a major pet-food plant + DC.

## Key views
- **z15/z16 context:** Large industrial campus on Topeka's rural NW fringe, hard against a US-24/US-75 highway interchange to the north and a rail corridor to the south; farmland and scattered rural residences around it.
- **z17/z18 plant:** Multi-section manufacturing plant (lighter roofs, west) connected to a large white-roofed distribution center (east). Extensive employee parking on the west. Dock faces with trailers backed in.
- **z19-z20 detail:** Long bulk-ingredient silo row served directly off the rail line on the south edge (rail-served). Distribution-center dock face with dozens of doors. East-side and central drop yards packed with rows of 100+ parked drop trailers. A scale-type pad/structure near the SW entrance area.
- **Street View (NW Brickyard Rd & rural roads, 2024):** Reaches the modern Big Heart/Smucker corporate office building (brick + metal, covered entry, employee parking) and the rural roads/grass buffers around the campus — but does NOT reach the actual truck gate (plant is set well back behind buffers and the rail line). Chain-link fencing visible behind the office building.

## Gate / guard-shack / dock determinations
- **truckGate: true** — Fenced industrial campus; truck access via internal roads from the SW off NW Brickyard Rd. Gate type (barrier arm vs sliding gate) could not be directly imaged — Street View never reached it — so this is inferred from a fenced campus of this scale. Flagged uncertain. truckGateCount estimated 2.
- **guardShack: false** — No guard booth positively identified. A campus this size commonly has a gatehouse, but none was confirmed in imagery. Flagged uncertain.
- **remoteGs: true** — Set on the basis of a controlled gate with no confirmed booth; low confidence.
- **dockDoors: 50+** — The distribution center alone has a long dock face with dozens of doors; combined with plant docks the site is firmly in the 50+ band. Estimated ~60, flagged uncertain (DC roof glare).
- **dropArea: 50+** — Drop yards hold well over 100 parked drop trailers.
- **railServed: true** — Rail line along the south edge with bulk-ingredient silos served directly. Unambiguous.
- **scale: true** — Highly likely at a rail-served bulk-ingredient plant + DC; a scale-consistent pad appears near the SW entrance. Flagged uncertain.
- **multipleFacilities: true** — A campus: manufacturing plant + large distribution center + corporate office + ancillary warehouse/equipment buildings. Web sources explicitly describe a "pet food plant AND distribution center".

## Yard zones and counts
- **Perimeter:** developed campus footprint, ~690 m N-S × ~821 m E-W ≈ **140 acres** (wide grass highway buffers excluded).
- **truckGate zone:** SW internal entrance off NW Brickyard Rd.
- **dropYards:** two boxed — the large east-side drop yard and a central drop yard; additional trailer rows exist throughout.
- **dockAprons:** one boxed along the distribution-center dock face (plant has additional docks).
- **staging:** deep internal yards serve as post-gate staging.
- **Metrics:** dockDoorCount ~60, trailersVisible ~130, trailerParkingCapacity ~180, truckGateCount ~2, buildingCount ~4, railServed true. Counts are honest order-of-magnitude estimates given the campus scale.

## Web findings
- Multiple sources (Waze, loc8nearme, tkmagazine, Food Processing, petfoodindustry) confirm Big Heart Pet Brands / J.M. Smucker at 2200 NW Brickyard Rd, Topeka KS 66618 — a ~1.2M sq ft pet food plant + distribution center (Meow Mix, Milk-Bone, etc.), ~350 employees, formerly Del Monte, with a $20.5M expansion. Goodyear (2000 NW US-24) confirmed as a separate nearby plant.

## Final confidence
**High** — the facility was positively identified, web-corroborated, and the plant + DC + drop-yard + rail layout is unambiguous from satellite. However, the gate/guard-shack determination, the scale, exact dock count, and per-gate lane counts are flagged uncertain: the plant sits well back from public roads behind buffers and the rail corridor, and Street View never reached the truck gate. The site-level archetype (large multi-facility, rail-served, drop-yard, 50+ docks) is solid; the gate micro-details are the soft spot.

- Gate verdict: YES — controlled truck gate inferred (fenced campus; gate not directly imaged)
- Guard-shack verdict: NO guard shack confirmed (uncertain — gatehouse plausible but not visible)
- Confidence: high (overall site); gate/guard-shack micro-details medium
