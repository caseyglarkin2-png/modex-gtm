# Deep-Audit Dossier — idx 65 — Home Chef Production Center, Douglasville GA

## Location & confirmation
- **Resolved:** 2120 Skyview Dr, Lithia Springs / Douglasville, GA 30122. Center ~33.7828, -84.61625.
- The supplied coords (33.785256, -84.644728) landed ~2.5 km west in a **residential** subdivision (confirmed wrong via z17 satellite). Web search (PRNewswire, Progressive Grocer) confirmed the address as **2120 Skyview Dr**, a 181,000 sq ft single-tenant meal-kit production center (Home Chef, a Kroger subsidiary; ~700 jobs; full-service kitchen for cooking/batch ingredients).
- Geocoded 2120 Skyview Dr → 33.7828, -84.6163. Satellite there shows a large light-roof industrial building. Street View shows the painted **"2120"** address on the front facade — positive ID.

## Building & layout
- Single large rectangular building, long axis **NNW-SSE, rotated ~12° clockwise** from north. Front office/employee entrance on the **west** face; loading docks run the **entire east** face. (The much larger DC to the west is a separate property, not Home Chef.)
- Bordered by woods on the west/south and a **retention pond + treeline** on the east. Skyview Dr runs along the north.

## Gate / guard determinations (rigorous)
- **truckGate: FALSE.** Trucks enter off Skyview Dr through the open front driveway, then follow an **open paved curve around the NE corner** into the east dock apron. No barrier arm, sliding/swing gate, or checkpoint pinch-point at the road or at the yard transition. Verified in 2025-03 Street View (multiple headings at the entrance) and z20 satellite of the NE corner (a truck is mid-drive, no gate line).
- **guardShack: FALSE.** No windowed booth at the entrance. The dark rectangular pad near the NE corner is a utility/transformer pad in landscaping, not a guard booth.
- **remoteGs: FALSE** (no gate at all).

## Docks, yard & counts (from z19-20 imagery)
- **Dock doors:** continuous bank along the full ~600 ft east wall; ~25-30 reefer trailers backed in (nose units visible). Total doors est. **~40 → band 25-50**.
- **Dock apron:** single long drive lane along the east face (oriented to the building angle) — holds a 3+ truck queue → `drivewayLong`. A row of employee cars parks along the pond edge opposite the docks.
- **Drop area:** all trailers are backed into doors (active loading); no separately marked bobtail/drop-trailer stalls → `dropArea: NONE`, `dropYard: false`.
- **Trailers visible ~27; parking capacity ~35** (apron + backed-in positions).
- **Buildings:** 1. **Rail:** none. **Scale:** none. **Multi-step:** none.

## Classification rationale
- entry/exit together through one open driveway; 1 inbound / 1 outbound lane; no fast-lane apron (`fastLaneOpportunity: false`).
- `urbanRural: Rural` — edge-of-town industrial corridor off I-20, woods/pond buffer; rubric tie-break favors Rural. `connectivityIssue: false` (adjacent large DC + corridor = developed, coverage fine).
- Site area from perimeter polygon ≈ **8.0 acres** (developed pad incl. front parking, building footprint ~4.2 ac, east apron, back yard).

## Web findings
- Home Chef (Kroger) opened this as its first single-tenant facility; 181,000 sq ft; 6,000 sq ft full-service kitchen for cooking vegetables/starches/grains + in-house sauce; ~700 jobs. Confirms a high-volume perishable meal-kit production + outbound shipping operation (reefer-heavy dock activity matches imagery).

## Confidence: HIGH
Building positively identified (address on facade). Gate/guard verdicts well-supported by 2025-03 Street View + tight satellite. Dock-door total and trailer-parking capacity are honest overhead estimates (flagged uncertain).
