# Deep-Audit Dossier — Caterpillar Mapleton IL Foundry (idx 3)

## Resolved location
- Roster geocode `40.559538, -89.748172` (ROOFTOP) lands directly on the **Caterpillar Mapleton Foundry**.
- Locked center at **`40.5597, -89.7475`**.
- Confirmation: satellite shows a large heavy-industrial foundry complex — rust-colored foundry building roofs, sand/material-handling structures to the SW, employee parking lots, and an on-site wastewater treatment plant to the SE. Consistent with the gray-iron engine-casting foundry on US-24 (8826 W US-24). Web (Macrae's, D&B, Heavy Equipment Directory) confirms a high-production gray-iron casting foundry, ~800 employees, operating since 1978.

## Key views
- **Wide (z15-16):** Foundry complex sits between US-24 (north), the Illinois River (south), and farmland/woods — a rural industrial setting.
- **Core (z17-19):** Multiple connected rust-roofed foundry buildings; material laydown and trailers along the east building face; sand-handling buildings on the SW.
- **South Street View (2023-06):** Continuous chain-link perimeter fence along the south road with the foundry behind it.
- **US-24 Street View:** Public highway; the entrance drive is set back and the gate is not reachable from the road.
- **SW (z17):** Sand/material-handling buildings and a rail line/spur with rail cars — the foundry is rail-served.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The complex is enclosed by chain-link perimeter fencing (confirmed in Street View). Truck access is via the internal access road off US-24; the controlled checkpoint sits inside the property along the entrance drive.
- **guardShack = false / remoteGs = true.** No standalone guard booth resolvable — US-24 Street View does not reach the gate. For a fenced, security-conscious foundry this is classified as a controlled gate with an internal checkpoint and no road-visible booth. Low confidence.
- **Driveway:** `drivewayLong = true` — the entrance access road off US-24 runs a long distance before reaching the building/dock area.
- **Docks:** ~14 dock doors estimated (band 10-25) along the east building face; many obscured by trailers — low confidence.
- **scale = true** — a foundry consuming ~500 tons of sand/day inbound almost certainly weighs trucks; a scale-like pad is suggested near the SW sand-handling area. Medium confidence.

## Yard zones and counts
- **Perimeter:** ~200 acres, the fenced foundry complex including material yards.
- **Drop yard:** Trailers + material laydown along the east building face; `dropYard = true`, `dropArea = 10-25`.
- **Rail:** A rail line/spur runs along the SW edge with rail cars — rail-served.
- **Metrics:** dockDoors ~14, trailersVisible ~14, trailer capacity ~30, truck gates 1, buildings 6, rail-served true.

## Web findings
- Macrae's Blue Book / D&B / Heavy Equipment Directory: Caterpillar Mapleton Foundry, 8826 US-24, high-production gray-iron casting shop (engine blocks/heads), ~800 employees, operating since 1978 — one of the largest of its kind in the US.

## Final confidence
**Medium.** Location positively confirmed (ROOFTOP geocode); the foundry layout, perimeter fence, rail service and dock area are clear. The guard-shack / remote-gate call, scale, and exact dock-door count are uncertain because the gate is internal and the building faces are partly obscured.
