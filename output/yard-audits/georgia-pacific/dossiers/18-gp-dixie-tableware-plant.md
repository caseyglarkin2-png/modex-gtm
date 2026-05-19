# GP Dixie Tableware Plant — Jackson, TN (idx 18)

## Resolved location
- **Coordinates:** 35.6276, -88.9168 (building center)
- **Address:** 65 Cardinal Drive, Jackson, TN 38301 (west Jackson, near I-40 and TN-223 / Christmasville Road)
- **Type:** Dixie tableware manufacturing/converting plant (premium paper plates, bowls, platters, deep dishes)
- The roster coordinate (35.551418, -89.184861) landed ~13 km SE of the plant in farmland — wrong. Web research (GP press releases, dixiejackson.com) gave the address **65 Cardinal Drive**, "on 241 acres in west Jackson near I-40 and state Highway 223." Satellite probing of west Jackson found the very large new building; Feb-2026 Street View confirmed it carries the **Georgia-Pacific logo** on its wall.
- Web corroboration: $425M greenfield investment, GP's first new Dixie greenfield plant since Bowling Green KY (1991); 900,000 sq ft; site clearing Nov 2022, production June 2024, ribbon-cut Oct 2024; ~220 jobs.

## Key views
- **Wide (z14/z15):** West Jackson industrial fringe — the plant is a single very large building on former farmland near I-40.
- **Building (z17/z18):** Huge single manufacturing building (~900,000 sq ft), employee parking on the west, office entrance at the NW corner. (Maxar satellite is construction-era ~2023 — roof visible, dock yard not yet built.)
- **Street View (Feb 2026):** Confirms the operational plant — large single building, **continuous chain-link perimeter fence** around the site, dock apron with trailers on the east side, employee parking and office on the west. GP logo visible on the building wall.

## Gate / guard-shack / dock determination
- **Truck gate:** The site is fully fenced — a continuous chain-link perimeter is clearly visible all around the property in multiple Street View frames. The truck driveway enters off Cardinal Drive; a controlled gate is standard for a modern greenfield manufacturing plant. Called `true`.
- **Guard shack:** No staffed guard booth could be imaged. A modern, cost-efficient greenfield plant with ~220 employees typically uses kiosk / app / call-box check-in rather than a manned 24/7 booth — so `guardShack: false`, `remoteGs: true`. Both flagged uncertain (Street View distance limits resolution of the gate structure).
- **Docks:** Single building with a long dock apron on the east face; trailers visible backed in (Street View). ~40 doors estimated → band **25-50** (low confidence).
- **Drop area:** Trailers park at the dock apron; no dedicated separate drop lot — `dropArea: 0-10`, `dropYard: false`.
- **Rail:** No rail spur — truck-served, near I-40.

## Yard zones and counts
- **Perimeter:** ~247 acres captured (matches the reported 241-acre site).
- **Dock apron:** East face of the building.
- **Staging:** Paved yard between the building and the perimeter.
- **Buildings:** 1 (single large manufacturing building) → `multipleFacilities: false`.

## Web findings
- $425M Dixie tableware greenfield plant; GP's largest new Dixie investment in decades; near I-40 for distribution; ~220 jobs; production began June 2024.

## Final confidence
**Medium.** Facility identity, location, perimeter fence, and single-building layout are high-confidence (relocated from a wrong roster coordinate; GP logo confirmed in Street View). Dock count, guard-shack vs. remote check-in, and drop-yard counts are estimates because the Maxar satellite predates the dock-yard buildout and Street View cannot resolve the gate structure at distance.
