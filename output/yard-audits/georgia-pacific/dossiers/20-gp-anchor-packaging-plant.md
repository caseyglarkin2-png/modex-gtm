# GP Anchor Packaging Plant — Jonesboro, AR (idx 20)

## Resolved location
- **Coordinates:** 35.8122, -90.6390 (building center)
- **Address:** 4708 Krueger Drive, Jonesboro, AR 72401 (Jonesboro Industrial Park, near the municipal airport)
- **Type:** Thermoformed packaging manufacturing / converting plant
- The roster coordinate (35.891617, -90.658333) landed ~9 km NW of the plant in farmland — wrong. Web research gave the address **4708 Krueger Drive** and a GPS reference of 35.8135 / -90.6392. Satellite probing of the Krueger Drive industrial corridor found the plant; **Jan-2026 Street View confirmed it** — an "Anchor Packaging - NOW HIRING" sign with the Anchor logo on the Krueger Drive frontage, plus the blue Anchor plant sign at the east entrance.
- Web corroboration: Anchor Packaging (formerly St. Louis-based) operates this Jonesboro plant; acquired by Georgia-Pacific in October 2025 — a net-new facility for GP yard operations.

## Key views
- **Wide (z15/z17):** A large single industrial building in the Jonesboro Industrial Park; Krueger Drive runs E-W with industrial buildings on both sides.
- **Building (z18):** Large single manufacturing building (~400,000+ sq ft) with employee parking on the east and a paved apron/yard on the west.
- **Street View (Jan 2026 + Dec 2020):** Confirms the operational plant — Anchor Packaging signage, office with an American flag at the east end, a trailer (XPRESS) backed into a dock on the building's north/west face, a cooling tower, and an open driveway entrance directly off Krueger Drive.

## Gate / guard-shack / dock determination
- **Truck gate:** **None.** The truck driveway enters directly off Krueger Drive as an open driveway — no barrier arm, no sliding/swing gate, no perimeter gate, and no guard booth visible in any Street View frame. The plant frontage (office, employee parking) is openly accessible from the public road. This is a standard light-industrial converting plant in an industrial park. → `truckGate: false`, `guardShack: false`, `remoteGs: false`.
- **Driveway:** Short open approach from Krueger Drive to the dock apron — holds only 1-2 trucks → `drivewayShort: true`.
- **Docks:** Loading docks along the W/NW face; a trailer seen backed in at a dock (Street View). ~18 doors estimated → band **10-25** (low confidence).
- **Drop area:** Paved apron/yard on the west side with a small number of trailers — no dedicated separate drop lot → `dropArea: 0-10`, `dropYard: false`.
- **Rail:** A rail line runs along the SW edge of the industrial area but no spur reaches the Anchor plant → `railServed: false`.

## Yard zones and counts
- **Perimeter:** ~43 acres captured.
- **Truck gate zone:** The open driveway entry off Krueger Drive (no physical gate).
- **Dock apron:** W/NW face of the building.
- **Staging:** Paved apron between the entry and the docks.
- **Buildings:** 1 (single large manufacturing building) → `multipleFacilities: false`.

## Web findings
- Anchor Packaging Jonesboro plant; one of Anchor's manufacturing sites; the company and its plants were acquired by Georgia-Pacific in October 2025. The site is described in local listings as a logistics/packaging operation with active loading services.

## Final confidence
**Medium.** Facility identity, location, single-building layout, and the no-gate / no-guard-shack determination are high-confidence (relocated from a wrong roster coordinate; Anchor signage confirmed in recent Street View; the open driveway entrance is clearly visible). Dock-door count and trailer counts are overhead estimates flagged as uncertain.
