# Deep-Audit Dossier — Caterpillar Sanford NC Plant (idx 5)

## Resolved location
- Roster geocode `35.544311, -79.171341` (ROOFTOP) lands **directly on the Caterpillar Sanford manufacturing campus** in Central Carolina Enterprise Park, Lee County NC.
- The roster's `movedMeters: 6036` is misleading — the ROOFTOP point itself is accurate; it sits on a large multi-building manufacturing complex.
- Locked center at **`35.5455, -79.1722`**.
- Confirmation: satellite shows a large multi-building manufacturing complex — long dock-door bank, trailer parking, material laydown yards, employee parking, slatted perimeter fence. Web (Sanford Area Growth Alliance, WRAL, CBS17) confirms the Caterpillar BCP plant (skid-steer / multi-terrain / compact track loaders) at 5000 Womack Rd, ~25 years in Sanford, grown to 5 buildings, 600 jobs being added.

## Key views
- **Wide (z14-16):** Cluster of large light-roofed buildings within the wooded/farmland Central Carolina Enterprise Park north of Sanford (Rural setting).
- **Core (z17-19):** Multi-building campus; long west-face dock bank with trailers backed in; material laydown yards on the NE.
- **West dock zoom (z19):** A long regular row of ~32 dock doors with trailers backed in along a wide paved truck apron.
- **SW Street View (2024-02):** Slatted privacy/chain-link perimeter fence around the campus.
- **NE (z18):** Trailer staging, material laydown, and an additional/expansion building.
- **Conveyor-bridge crossing:** A rail line runs through/alongside the campus.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The campus is enclosed by a slatted privacy/chain-link perimeter fence (confirmed in Street View). Truck access is via internal entrance roads off the enterprise-park roads; controlled gates set inside the property.
- **guardShack = false / remoteGs = true.** No standalone guard booth resolvable from public roads — gates sit inside the fenced campus. Classified as a controlled gate with an internal checkpoint and no road-visible booth. Low confidence.
- **Driveway:** `drivewayLong = true` — internal entrance roads run a long distance to the dock/yard areas.
- **fastLaneOpportunity = true** — wide paved truck aprons along the west dock face with unused width.
- **Docks:** ~32 dock doors counted along the long west building face (band 25-50). `shipRcvSeparate = true` — dock activity is split between the west-face bank and a separate NE building/laydown area.

## Yard zones and counts
- **Perimeter:** ~220 acres, the fenced multi-building campus.
- **Drop yards:** West dock apron trailer parking + NE trailer/material staging; `dropYard = true`, `dropArea = 25-50`.
- **Rail:** A rail line runs through/alongside the campus; likely a serving spur — rail-served, medium confidence.
- **Metrics:** dockDoors ~32, trailersVisible ~30, trailer capacity ~55, truck gates 2, buildings 6, rail-served true.

## Web findings
- Sanford Area Growth Alliance / Research Triangle Regional Partnership: Caterpillar BCP plant, 5000 Womack Rd, Central Carolina Enterprise Park; grown to 5 buildings in Lee County.
- WRAL / CBS17 (2026): Caterpillar adding 600 jobs at the Sanford plant for compact track loader production.

## Final confidence
**Medium.** Location positively confirmed (ROOFTOP geocode lands on the campus; web corroborates the BCP plant). Dock bank, drop yards, fencing and the rail line are clear. The guard-shack / remote-gate call, exact lane counts and the rail-spur connection are uncertain because the gate is internal.
