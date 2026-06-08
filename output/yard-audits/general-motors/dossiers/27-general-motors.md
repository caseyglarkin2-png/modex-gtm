# Deep Audit — Ultium Cells, Spring Hill TN (idx 27)

**Facility:** Ultium Cells - Spring Hill TN
**Type:** Battery Cell Plant (GM / LG Energy Solution JV)
**Address:** 100 Saturn Pkwy, Spring Hill, TN 37174
**Resolved center:** 35.7490, -86.9525
**Confidence:** medium

## Location & confirmation

The 100 Saturn Pkwy address is shared with the GM Spring Hill Manufacturing
(Cadillac assembly) campus (roster idx 5). The Ultium battery plant is a
distinct 2.8M sq ft facility built on land leased from GM at the NE corner of
that campus, ~1.2 km NE of the main assembly cluster.

The address geocode pin (the red marker rendered in probe imagery) lands at the
SW corner of a bright white-roof industrial building. Stepping through satellite
at z14→z19 I identified the Ultium complex as **two connected buildings**:

- A **bright white-roof main battery plant** to the east (~35.749, -86.951) —
  brand-new, clean construction, the signature 2.8M sq ft cell plant.
- An adjoining **gray-roof logistics / warehouse building** to the west
  (~35.749, -86.956).

Confirmed operational by 2026-02 / 2026-03 Street View (the white plant building,
employee lots full of cars, perimeter chain-link fencing) and by the DOE
Environmental Assessment for the Spring Hill battery plant, which lists
"shipping and receiving areas ... a guard house, hazardous materials storage"
among the plant's attendant structures. Production began in late 2023/2024.

## What the key views showed

- **Wide campus (z14):** the Ultium complex is the clean white/gray pair at the
  campus's NE corner, separate from the gray older assembly-plant roofs.
- **North edge (z18-19):** a dedicated paved **trailer drop yard** north of the
  building gap, ~15-22 trailers parked in angled and straight rows. An **active
  rail line** runs diagonally (NW-SE) just past the drop yard — the campus is
  rail-served.
- **Inter-building gap (z19):** a **dock apron** with red/white trailers backed
  in along the inner/north faces of both buildings.
- **South / SE (z18):** large employee parking lots full of cars; the truck
  access road and a laydown/staging apron lead in from a campus road network
  (roundabout, STOP sign, bollard delineators, blue checkpoint signage).
- **Street View (2026-03, pano `lJqlAsn9x1G-4w_9ESbyVg` @ 35.74515,-86.95251):**
  chain-link perimeter fence along the approach road, plant buildings behind it,
  directional/checkpoint signage on the campus road.

## Gate / guard / dock determinations

- **truckGate: true.** Fenced perimeter + controlled campus road approach into
  the plant. Standard for a high-IP/hazmat battery JV inside a secured GM campus.
- **guardShack: true (medium).** DOE EA explicitly lists a guard house; a small
  booth-footprint structure sits beside the entrance checkpoint (~35.7480,
  -86.9508). Not crisply resolved overhead → medium, flagged uncertain.
  `remoteGs` false as a result.
- **dockDoors: 25-50 (~28).** Dock apron with backed-in trailers along the inner
  faces + a north-facing dock bank serving the trailer yard. Exact count obscured
  by the building gap and roof angle → flagged uncertain.
- **shipRcvSeparate: true (medium).** Separate truck faces on the white plant
  (finished-cell shipping) vs the gray logistics building (receiving) imply
  physically distinct ship/receive clusters.

## Yard zones & counts

- **Perimeter:** oriented 6-vertex ring tracing the fenced Ultium core (both
  buildings + north drop yard + dock aprons + south employee lots), ~110 acres.
- **truckGate:** quad aligned to the SE entrance drive.
- **dropYards[1]:** the north trailer drop yard, ~15-22 trailers visible,
  capacity ~60 with apron staging.
- **dockAprons[2]:** the inter-building dock strip and the gray building's west
  dock face.
- **railServed: true** — active spur/line along the NW edge.
- **multipleFacilities: true** — two connected buildings + utilities, within the
  larger GM campus.

## Web findings

- 2.8M sq ft GM/LG Energy Solution JV battery-cell plant; ~$2.3B initial + $275M
  expansion to 50 GWh; 1,300+ jobs; built on GM-leased land at Spring Hill.
- DOE EA: attendant structures include shipping/receiving areas, a guard house,
  hazmat storage, substation, water tanks — corroborates the gated, dock-served
  truck-yard profile.

## Final confidence: medium

Facility positively identified and operational; gate, fencing, drop yard, dock
apron and rail are all visually confirmed. Exact dock-door count, lane counts,
guard-booth structure and ship/receive split are honest overhead estimates and
are flagged in `uncertainFields`.

**Gate:** controlled truck gate — true.
**Guard shack:** true (medium) — DOE EA lists a guard house; booth not crisply
resolved overhead.
**Confidence:** medium.
