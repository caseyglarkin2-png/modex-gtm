# GP Dixie Cup Plant — Lexington, KY (idx 19)

## Resolved location
- **Coordinates:** 38.0807, -84.5258 (plant complex center)
- **Address:** 451 Harbison Road, Lexington, KY 40511 (NW Lexington industrial district)
- **Type:** Dixie cup manufacturing / converting plant
- The roster coordinate (38.104086, -84.506349) landed ~3 km NE in a **residential subdivision** — wrong. The roster address "1900 Spurr Road" appears imprecise; Spurr Road is a nearby NW-Lexington industrial street but the Dixie Cup plant proper is at **451 Harbison Road**. Relocated via the iconic **Dixie Cup water tower** (38.080038, -84.526746) and confirmed by Georgia-Pacific signage visible in Street View at the plant entrance.
- Web corroboration: Dixie Cup Corporation moved to Lexington in 1958; now Georgia-Pacific. After GP closed the Easton PA plant in 2021, this became the consolidated sole Dixie cup production site; ~50 jobs added in the expansion.

## Key views
- **Wide (z16/z17):** Large, long converting-plant complex in a dense industrial park; the **Dixie Cup water tower** is visible on the property, plus employee parking, trailer storage, and a rail line along the north.
- **Trailer yard (z18):** A large trailer drop yard on the NE side — dozens of trailers parked in regular rows; trailers also backed into the NE dock face.
- **Street View (Dec 2024):** Confirms the operational plant — brick office building with the Georgia-Pacific orange/blue sign, the white Dixie Cup water tower behind, black ornamental metal perimeter fence along the office frontage, chain-link fence around the dock yard, trailers (DART) parked in the yard, storage tanks, and process equipment.

## Gate / guard-shack / dock determination
- **Truck gate:** The property is fully fenced — black ornamental metal fence along the office/parking frontage and chain-link around the dock yard, with a sliding gate visible at one fence opening. The truck driveway enters off Harbison Road into the fenced dock yard. Controlled access → `truckGate: true`.
- **Guard shack:** No staffed guard booth could be positively imaged at the truck entrance — the truck driveway reads as a fenced but largely open entry (stop sign, no visible booth). An older urban converting plant of this type typically uses badge / kiosk / intercom access rather than a 24/7 manned booth → `guardShack: false`, `remoteGs: true`. Both flagged uncertain (Street View does not clearly resolve the entry checkpoint).
- **Docks:** Loading docks along the NE/E face; trailers visible backed in. ~22 doors estimated → band **10-25** (low confidence).
- **Drop yard:** Large dedicated trailer drop yard on the NE side — ~50 trailers in rows → `dropYard: true`, band **25-50**.
- **Rail:** A rail line runs along the north property edge with a spur to the plant → `railServed: true`.

## Yard zones and counts
- **Perimeter:** ~72 acres captured.
- **Truck gate:** Driveway entry off Harbison Road into the dock yard.
- **Drop yard:** NE-side trailer storage lot.
- **Dock apron:** NE/E face of the plant.
- **Staging:** Paved yard between the entry and the docks.
- **Buildings:** ~5 (main long manufacturing complex, office, ancillary structures) — treated as a single facility.

## Web findings
- Sole Dixie cup production site post-2021 Easton PA consolidation; produces premium hot cups, recycled-fiber cups, and bath cups; the water tower is preserved as an airport navigation reference.

## Final confidence
**Medium.** Facility identity (relocated from a wrong roster coordinate, GP signage and the Dixie Cup water tower both confirmed), location, perimeter fence, drop yard, and rail service are high-confidence. Guard-shack vs. remote check-in and the dock-door count are estimates because Street View does not clearly resolve the truck-entry checkpoint.
