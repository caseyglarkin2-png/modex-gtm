# Deep-Audit Dossier — Caterpillar Mossville IL Engine & Research Campus (idx 7)

## Resolved location
- Roster geocode `40.84293, -89.563151` (GEOMETRIC_CENTER, moved only 5 m) lands on the western edge of the **Caterpillar Mossville Engine & Research Campus** (the Caterpillar Technical Center).
- Locked campus center at **`40.8445, -89.5565`**.
- Confirmation: satellite shows a large multi-building campus with a paved test/proving area and a perimeter test track, a cogeneration plant (AES Medina Valley), trailer/material laydown yards, and 7+ large R&D/manufacturing buildings. Web (Peoria Magazine, power-eng.com, D&B) confirms the Tech Center at 1900 E Old Galena Rd — ~900,000 sq ft, ~2,000 scientists/engineers, R&D hub running 24/7.

## Key views
- **Wide (z14-15):** Sprawling campus among farmland near Mossville and the Illinois River (Rural setting).
- **Campus overview (z15-17):** 7+ very large buildings, a large hexagonal paved test/proving area with a perimeter test track, a cogeneration plant with tanks/cooling towers, and laydown yards.
- **North buildings (z17-19):** Large R&D/manufacturing buildings, employee parking, trailers parked in laydown areas.
- **South building / cogen (z19):** Large manufacturing building plus the AES Medina Valley cogeneration plant utility area.
- **Perimeter Street View (2023-08):** Street View covers only the perimeter roads; an internal entrance road carries a checkpoint structure and a pipe/conveyor bridge crosses the road near the entrance. The campus interior is access-controlled — Street View does not penetrate it.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The campus is access-controlled — Street View covers only the perimeter and does not enter the interior. An internal entrance road off the perimeter road carries a checkpoint structure; a pipe/conveyor bridge crosses near the entrance. Controlled campus entry.
- **guardShack = false / remoteGs = true.** No standalone road-edge guard booth resolvable — the checkpoint sits on the internal entrance road inside the campus. Classified as a controlled campus with an internal checkpoint and no road-visible booth. Low confidence.
- **Driveway:** `drivewayLong = true` — internal entrance roads run long distances across the campus.
- **fastLaneOpportunity = true** — wide internal roads and paved aprons with abundant unused width.
- **Docks:** ~16 dock doors estimated (band 10-25) across building faces. This is an R&D-heavy campus, so freight/dock operations are modest; building roof overhangs obscure many faces — low confidence.

## Yard zones and counts
- **Perimeter:** ~320 acres, the campus including test track, cogen plant, buildings and laydown.
- **Drop yards:** Trailer laydown near the north building and south of the manufacturing building, plus material laydown; `dropYard = true`, `dropArea = 25-50`.
- **shipRcvSeparate = true** — dock/trailer activity is split between the north R&D/logistics buildings and the south manufacturing building.
- **Rail:** No rail spur into the property — `railServed = false`.
- **Metrics:** dockDoors ~16, trailersVisible ~18, trailer capacity ~40, truck gates 2, buildings 8, rail-served false.

## Web findings
- Peoria Magazine "Behind the Scenes at the Caterpillar Technical Center": ~2,000 scientists/engineers/technologists in 7 buildings across 900,000 sq ft, campus runs 24/7; Building F houses engine research and an Immersive Visualization Center.
- power-eng.com: AES Medina Valley cogeneration plant powers the Mossville manufacturing and research campus.

## Final confidence
**Medium.** Location positively confirmed (geocode moved only 5 m; web corroborates the Tech Center). The campus layout, test track, cogen plant, laydown yards and access control are clear. The guard-shack / remote-gate call, exact dock count and ship/receive split are uncertain because Street View does not penetrate the access-controlled campus interior and the campus is R&D-focused rather than a high-throughput freight facility.
