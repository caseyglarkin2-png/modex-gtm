# Deep-Audit Dossier — idx 16

## Coca-Cola UNITED — Birmingham Production Plant, AL

### Resolved location
- **Roster input:** 4600 E Lake Blvd, Birmingham AL; lat/lng 33.561277, -86.768222 (ROOFTOP, but flagged "moved 5725 m" — a large geocode adjustment).
- **Confirmed accurate despite the large move.** The supplied coordinate lands directly on the Coca-Cola UNITED Birmingham campus. **Step-0 verification:** Street View on East Lake Blvd shows a large red **"Coca-Cola"** script logo mounted on the building facade — unambiguous.
- This is the **Coca-Cola Bottling Company UNITED corporate HQ + Birmingham Production Plant**, 4600 E Lake Blvd, Birmingham, AL 35217 — ~350,000 sq ft of office and industrial space on ~39 acres, in operation at this site since 1979, with 750+ employees. (Coca-Cola UNITED also announced a separate $330M new Birmingham facility in May 2024; this audit covers the existing active campus.)

### Key views
- **z16-17 overview:** A multi-building campus — a large sawtooth-roof production warehouse, a separate north warehouse, and an attached office complex. Trailer yards run along the west and center; employee parking lots on the north and east. The campus is bordered by woods/residential (west, north) and East Lake Blvd (south); I-59 is just to the SE.
- **z18-19 building views:** Dock doors with trailers backed in along the production warehouse's SW face and the north warehouse; red Coca-Cola / UNITED fleet trailers and delivery trucks throughout.
- **z19-20 entrances:** A SW service/truck drive descends from East Lake Blvd to the dock yard (with a small maintenance/utility building beside it); a separate SE drive curves up to the office and visitor parking.

### Gate / guard-shack / dock determinations
- **truckGate = true:** The property is fenced; trucks use a distinct service/truck drive off East Lake Blvd at the SW, separate from the office entrance. Gate hardware is not directly resolvable in overhead imagery — the controlled entrance is inferred from the continuous fence and the distinct truck approach.
- **guardShack = false:** No clear freestanding beside-the-lane guard booth. The small SW structure reads as a utility/maintenance building. Medium confidence — as a corporate HQ, staffed security is plausible but not visible.
- **remoteGs = true:** Truck gate present, no guard shack identified — kiosk / badge check-in implied.
- **dockDoors = "50+":** Extensive dock doors along the production warehouse SW face plus the north warehouse, trailers backed in at both — ~50 estimated, approximate.
- **shipRcvSeparate = true:** Dock banks on physically separate building faces.
- **multipleFacilities = true:** A genuine multi-building HQ + production campus.

### Yard zones and counts
- **perimeter:** south 33.5600, west -86.7705, north 33.5635, east -86.7655 — ~390 m N-S × ~464 m E-W ≈ **44.7 acres** (the company-stated 39 acres is the building parcel; the geofence includes wooded buffers and full yards).
- **truckGate zone:** SW service drive off East Lake Blvd.
- **dropYards:** (1) west/central trailer yard; (2) center-east trailer yard.
- **dockApron:** strip along the production warehouse SW face.
- **yardMetrics:** ~50 dock doors; ~90 trailers visible; ~140 trailer capacity; ~2 truck/access gates; 3 buildings; 44.7 acres; rail-served = false.

### Web findings
- Coca-Cola Bottling Company UNITED, founded in Birmingham in 1902, is the third-largest Coca-Cola bottler in the US, with 8 production facilities and 48 distribution sales centers across six southeastern states. The Birmingham campus at 4600 E Lake Blvd is its corporate HQ and a production plant (~350,000 sq ft, ~39 acres, since 1979). A separate $330M new Birmingham facility was announced May 2024.

### Final confidence
**High.** Facility positively identified with Coca-Cola branding visible in Street View; the multi-building campus, docks and trailer yards are clearly readable. Gate hardware, exact truck-gate count, dock count and the entry/exit split are inferred from overhead imagery (no Street View on the private drives) and are flagged uncertain.

**Archetype indicators:** Gate, no guard shack (remote check-in), multi-building campus, separate ship/receive, large drop yards, separate truck/office entrances.
