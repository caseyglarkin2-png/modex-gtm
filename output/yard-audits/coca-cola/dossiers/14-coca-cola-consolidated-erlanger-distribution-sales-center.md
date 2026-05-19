# Deep-Audit Dossier — idx 14

## Coca-Cola Consolidated — Erlanger Distribution & Sales Center, KY

### Resolved location
- **Roster input:** 600 Circleport Dr, Erlanger KY; lat/lng 39.051442, -84.632298 (GEOMETRIC_CENTER — geocoded to a street centerline).
- **Problem:** The Circleport Drive area is an office / flex business park near CVG airport — no 300,000 sq ft distribution center there. The roster address appears incorrect.
- **Correct facility:** Coca-Cola Consolidated Erlanger Distribution & Sales Center, **680 Erlanger Road, Erlanger, KY 41018** — confirmed by Coca-Cola Consolidated and City of Erlanger sources. It is a 300,000 sq ft sales/distribution facility on ~32 acres, built on the old Showcase Cinema site as a $30M / 430-job project (Hillwood + Al Neyer, opened ~2019-2020). The site runs an automated VPS/Vertique pick-and-load warehouse and employs 500+ teammates.
- **US Census geocoder** places 680 Erlanger Rd at 39.0325, -84.6127 — the edge of a 3-building Hillwood-developed commerce park beside **I-71/75**, just south of **I-275**.
- **Audited building:** the northernmost warehouse of that commerce park, centered ~**39.0368, -84.6098**. It is the only one of the three showing an active **red Coca-Cola Consolidated / Red Classic fleet** (trailers and bobtail delivery trucks) at its dock apron — the strongest match. Building-identity confidence is **medium**.

### Key views
- **z16-17 area:** A 3-building distribution park wedged between I-71/75 and wooded slopes. The two southern buildings are larger and appeared low-activity / partly vacant (empty striped trailer stalls). The northern building shows active trailer and delivery-truck staging.
- **z18 north building:** Cross-dock layout — dock doors with trailers backed in along the NW and SW faces; a north trailer drop yard; a dense cluster of red Coca-Cola fleet vehicles and bobtail delivery trucks parked at the SW yard.
- No Street View is available on the commerce-park internal roads (panos exist only on the wooded public Erlanger Road).

### Gate / guard-shack / dock determinations
- **truckGate = true:** A single internal access drive serves the building's gated/fenced yard. Gate hardware not directly visible (no Street View) — inferred from layout, low-medium confidence.
- **guardShack = false:** No distinct beside-the-lane guard booth visible.
- **remoteGs = true:** Truck gate present, no guard shack — kiosk / badge check-in implied.
- **dockDoors = "50+":** Cross-dock building with dock doors along two faces (NW and SW), trailers backed in along both — ~55 estimated, approximate.
- **shipRcvSeparate = true:** Two physically separate dock banks support separate ship/receive flows.
- **fastLaneOpportunity = true:** Wide paved yard and generous apron width leave room for an express bypass lane.

### Yard zones and counts
- **perimeter:** south 39.0345, west -84.6120, north 39.0384, east -84.6080 — ~412 m N-S × ~311 m E-W ≈ **31.6 acres**, matching the company-stated 32-acre site.
- **truckGate zone:** SW yard access drive.
- **dropYard:** north trailer drop yard, 25-50 trailers.
- **dockApron:** L-shaped strip along the NW and SW building faces.
- **yardMetrics:** ~55 dock doors; ~60 trailers visible; ~90 trailer capacity; 1 truck gate; 1 building; 31.6 acres; rail-served = false.

### Web findings
- Announced June 2018: Coca-Cola Bottling Co. Consolidated to build a 300,000 sq ft facility on ~32 acres at the old Showcase Cinema site, $30M investment, 430+ jobs, developed with Hillwood and Al Neyer. The Erlanger branch has 500+ teammates and runs an automated Vertique warehouse.

### Final confidence
**Medium.** The facility is positively identified by name, address (680 Erlanger Rd), acreage and developer; the audited building is the best-matching warehouse in the correct commerce park, corroborated by the visible red Coca-Cola fleet. Residual uncertainty: three near-identical warehouses share the park and there is no Street View or rooftop branding to definitively confirm which one is Coca-Cola, and gate hardware is inferred. `truckGate`, `guardShack`, `remoteGs`, `dockDoorCount`, `dropArea`, `fastLaneOpportunity` and `shipRcvSeparate` are flagged uncertain.

**Archetype indicators:** Gate, no guard shack (remote check-in), cross-dock with separate ship/receive, drop yard, fast-lane room.
