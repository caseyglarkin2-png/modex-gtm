# Deep-Audit Dossier — idx 13

## Coca-Cola Consolidated — Sandston Sales & Distribution Center, VA

### Resolved location
- **Roster input:** 5301 Eubank Rd, Sandston VA; lat/lng 37.510825, -77.344601 (RANGE_INTERPOLATED, "moved 90 m").
- **Problem:** The roster coordinate landed in a residential neighborhood ~1.5 km southwest of the actual site, and a satellite/Street-View check there showed only single-family homes. The roster address (Eubank Rd) is also incorrect for this facility.
- **Correct facility:** Coca-Cola Consolidated, **500 Eastpark Court, Sandston / Highland Springs, VA 23231**, centered at **37.5325, -77.3372**. Confirmed via Nominatim geocode of 500 Eastpark Ct (37.5323, -77.3369) and corroborated by Coca-Cola Consolidated press releases describing the 63-acre Sandston campus with a 300,000 sq ft manufacturing plant / distribution center and a newly completed 210,000 sq ft warehouse ($50M expansion, March 2024).
- The campus is wedged between **I-64** (south) and an active **rail line** (north), inside the Richmond International Airport / Woodlands industrial district.

### Key views
- **Wide z16-17 overview:** A multi-building industrial complex — a west white warehouse, a dark sawtooth dock-canopy structure, a central white warehouse, and a rail-served manufacturing building. A large drop yard of trailers sits on the NW; a smaller trailer/truck lot on the E. A separate building cluster on the far east (different rooflines, own parking) is a neighboring Eastpark Court tenant, excluded from the geofence.
- **z19 dock view:** The north face of the west warehouse runs a long sawtooth dock canopy with trailers backed into doors; rows of red Coca-Cola Consolidated / Red Classic bobtail delivery trucks and trailers fill the yard.
- **z20 north edge:** Rail hopper/gondola cars are parked on a spur that runs into the property's north edge at the manufacturing building — the site is rail-served.
- **z20 entrance area:** A single private access drive enters the campus from Eastpark Court at the NE corner. No Street View is available on the private drive (panos exist only on the public residential streets and the I-64 service road).

### Gate / guard-shack / dock determinations
- **truckGate = true:** One controlled private access drive serves the whole campus from Eastpark Court; the property is tree-buffered and fenced with a single truck entrance. Gate hardware not directly visible (no Street View), so this is a medium-confidence call from layout.
- **guardShack = false:** No small beside-the-lane booth structure is visible at the entrance. The small metal building near the access drive is an operations/utility structure, not a guard booth.
- **remoteGs = true:** Truck gate present, no guard shack — kiosk / badge / app check-in implied.
- **dockDoors = "25-50":** ~45 doors estimated — ~30+ under the west warehouse's sawtooth canopy plus ~10-15 on the east warehouse's east face. Approximate, flagged.
- **shipRcvSeparate = true:** Dock banks on physically separate building faces.

### Yard zones and counts
- **perimeter:** south 37.5306, west -77.3408, north 37.5347, east -77.3345 — ~456 m N-S × ~556 m E-W ≈ **62.6 acres**, matching the company-stated 63-acre campus.
- **truckGate zone:** NE access drive off Eastpark Court.
- **dropYards:** (1) large NW trailer drop yard; (2) smaller E trailer/truck lot.
- **dockApron:** strip along the west warehouse's north sawtooth canopy.
- **yardMetrics:** ~45 dock doors; ~70 trailers visible; ~110 trailer capacity; 1 truck gate; 4 buildings; 62.6 acres; rail-served = true.

### Web findings
- Coca-Cola Consolidated celebrated a $50M investment in the Sandston campus (March/April 2024), adding a 210,000 sq ft warehouse to a 63-acre campus that houses manufacturing, warehouse, distribution, equipment services, the Red Classic truck fleet and transportation — nearly 450 employees. A prior $23M expansion of the 300,000 sq ft plant completed 2021.

### Final confidence
**High** overall — facility positively identified and the campus layout, docks, drop yards, rail spur and acreage are all clearly readable. Gate hardware and exact dock count are inferred from overhead imagery (no Street View on the private drive); `truckGate`, `guardShack`, `remoteGs` and `dockDoorCount` are flagged as uncertain.

**Archetype indicators:** Gate, no guard shack (remote check-in), large drop yard, multi-building campus, rail-served.
