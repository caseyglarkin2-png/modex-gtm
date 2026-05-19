# Deep-Audit Dossier — GXO Logistics Distribution Center, Statesville NC (idx 19)

## Resolved location
- **Facility:** GXO Logistics Distribution Center — 2203 Sherrill Dr, Statesville, NC 28625
- **Locked center:** 35.770854, -80.841310
- **Confirmation:** Roster ROOFTOP geocode landed directly on a large distribution building. Web research confirmed GXO Logistics Supply Chain, Inc. operates here (Dun & Bradstreet Statesville profile), Panjiva import records list "Gxo USA DC, 2203 Sherrill Drive, Statesville NC," and GXO's jobs site shows active Statesville hiring. The building is a large cross-dock DC in a wooded, edge-of-town Iredell County industrial area; an employee review notes the building is non-temperature-controlled.

## Key views
- **Wide satellite:** Large rectangular distribution building set in woods on the edge of Statesville, with other warehouses scattered through the wooded industrial area.
- **Tight satellite (z18-20):** Dock doors and wide truck courts run along both the north face and the south/SE face — a cross-dock layout. Marked trailer-parking stalls line the outer edge of both courts (mostly empty in imagery). Employee parking is along the west face. A single access driveway enters from the SW.
- **Street View (2019/2022):** South dock face shows trailers backed in. A sliding/swing chain-link gate spans the truck lane into the fenced dock/truck yard; the entire dock yard is chain-link-fenced. A small post / call-box fixture sits beside the gate. No guard booth.

## Gate / guard-shack / dock determinations
- **truckGate: true** — A chain-link gate spans the truck lane entering the fenced dock yard (visible in Street View along the south face). The dock yard is fully fenced.
- **guardShack: false** — No staffed booth (no 1-3 vehicle-footprint structure) at the gate; only a small call-box-style post.
- **remoteGs: true** — Truck gate present but no guard booth → kiosk / call-box / remote check-in.
- **dockDoors: 50+** — Dock doors on both the north and south faces; estimated ~60 total for this ~495,000 SF cross-dock building. Flagged uncertain (overhead estimate).
- **shipRcvSeparate: true** — Cross-dock layout, dock banks on two opposite building faces.

## Yard zones and counts
- **Perimeter:** ~28 acres for the fenced parcel (building, two truck courts, employee parking).
- **Truck gate:** Chain-link gate at the SW into the dock yard.
- **Drop yards:** Striped trailer-parking stalls in both the north and south truck courts.
- **Dock aprons:** North apron and south apron.
- **Staging:** The driveway approach and employee-parking apron outside the gate serve as pre-gate staging.
- **trailersVisible: 12** — Few trailers in captured imagery; capacity ~70.
- **railServed: false** — No rail spur into the property.

## Web findings
- GXO Logistics Supply Chain, Inc., 2203 Sherrill Dr, Statesville NC — Freight Transportation Arrangement (Dun & Bradstreet).
- Panjiva import records: "Gxo USA DC, 2203 Sherrill Drive Statesville NC" — handles apparel, textiles, confectionery.
- GXO jobs site shows active Statesville hiring. Employee reviews note a non-temperature-controlled building.

## Final confidence: medium
Location well-confirmed. Gate determination is confident — a chain-link gate into a fully fenced dock yard with no guard booth (remote check-in). Dock count, trailer count, drop-area band, and lane counts are overhead estimates and flagged uncertain.
