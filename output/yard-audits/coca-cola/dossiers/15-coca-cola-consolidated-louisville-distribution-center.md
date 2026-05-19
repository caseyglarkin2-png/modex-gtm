# Deep-Audit Dossier — idx 15

## Coca-Cola Consolidated — Louisville Distribution Center, KY

### Resolved location
- **Roster input:** 7100 Global Dr, Louisville KY; lat/lng 38.138117, -85.890606 (ROOFTOP, "moved 626 m").
- **Confirmed accurate.** The roster coordinate landed directly on the correct building. This is the Coca-Cola Consolidated Louisville Distribution Center, **7100 Global Drive, Louisville, KY 40258** — a 305,000 sq ft sales/distribution center in a renovated former Circuit City warehouse on a ~25-acre site (~$12M renovation, ~210 employees).
- **Step-0 verification:** Street View on Global Drive shows the red **"Coca-Cola"** script logo on the building's north facade behind a chain-link perimeter fence. The neighboring building to the east is branded "ATLAS" (a different tenant); the building to the west is a separate warehouse. The Coca-Cola building is the brown-roofed structure with a white-roofed extension at its south end.

### Key views
- **z16-17 overview:** A brown-roofed warehouse with a white-roofed southern extension; a large fenced trailer yard runs south of the building down to a rail line. Employee car parking sits along Global Drive to the north.
- **z18-19 west face:** Dock doors run the length of the building's west face with trailers backed in; red Coca-Cola fleet trucks parked along the drive.
- **z20 south yard:** Dense rows of parked trailers, red Coca-Cola / Red Classic delivery trucks and bobtail trucks, plus stacked pallet storage — an active distribution yard.
- **z20 NW corner:** A small white structure at the building's NW corner is an attached office/canopy entry, not a freestanding guard booth.

### Gate / guard-shack / dock determinations
- **truckGate = true:** The property is fully enclosed by a chain-link perimeter fence (confirmed in Street View). A single truck entrance off Global Drive at the NW feeds a drive running south down the building's west side into the yard. Gate hardware is not directly resolvable in imagery; the controlled entrance is inferred from the continuous fence plus single access drive.
- **guardShack = false:** No freestanding beside-the-lane guard booth. The NW white structure is an attached building entry.
- **remoteGs = true:** Truck gate present, no guard shack — kiosk / badge check-in implied.
- **dockDoors = "25-50":** ~40 doors along the building's west face, trailers backed in — approximate.
- **shipRcvSeparate = false:** A single dock bank along one building face — shipping and receiving share it.

### Yard zones and counts
- **perimeter:** south 38.1343, west -85.8918, north 38.1392, east -85.8895 — ~545 m N-S × ~201 m E-W ≈ **27 acres**, consistent with the company-stated ~25-acre site.
- **truckGate zone:** NW access drive off Global Drive.
- **dropYard:** large fenced trailer-storage yard, south half of the property.
- **dockApron:** strip along the building's west face.
- **yardMetrics:** ~40 dock doors; ~80 trailers visible; ~130 trailer capacity; 1 truck gate; 1 building; 27 acres; rail-served = false.

### Web findings
- Coca-Cola Consolidated opened the 305,000 sq ft Louisville sales and distribution center on Global Drive in southwest Louisville, investing ~$12M to renovate a vacant former Circuit City warehouse on a 25-acre site; ~210 employees at the branch.

### Final confidence
**High.** Facility positively identified with rooftop-accurate coordinates and Coca-Cola branding visible in Street View; layout, docks and large trailer drop yard are clearly readable. Gate hardware (`guardShack`/`remoteGs`) is inferred from the perimeter fence and access geometry; `dockDoorCount` is an approximate count — these are flagged uncertain.

**Archetype indicators:** Gate, no guard shack (remote check-in), large dedicated drop yard, single dock bank.
