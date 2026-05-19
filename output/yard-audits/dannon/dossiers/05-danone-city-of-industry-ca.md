# Deep-Audit Dossier — Danone, City of Industry CA (idx 05)

## Facility
- **Name:** Danone - City of Industry CA
- **Type:** Plant-based & coffee beverage plant (refrigerated) — Silk Beverage,
  SToK Coffee, International Delight Creamer
- **Address:** 18275 Arenth Avenue, City of Industry, CA 91748
- **Resolved center:** 34.00460, -117.90590

## Step 0 — Location confirmation
The roster coordinate (34.004462, -117.905494, GEOMETRIC_CENTER, moved 135 m)
landed inside the plant. Satellite at z17-z18 shows a large refrigerated
processing building with very dense rooftop process equipment, vertical storage
tanks/silos, and an on-site wastewater treatment area, in the dense City of
Industry / San Gabriel Valley industrial fabric. Street View on Arenth Avenue
confirms the process plant (silos, tanks) behind a gated metal fence with
signage. Identity confirmed; center locked at 34.00460, -117.90590.

## Key views
- **z17/z18 overview:** Plant block bounded by Arenth Avenue and a flood-control
  channel on the SW, a road and rail line on the north, surrounded by other
  industrial buildings.
- **z19/z20 entry:** Fenced/walled perimeter with a sliding gate on Arenth
  Avenue; trailers parked along the SW edge inside the fence.
- **z20 south face:** A covered dock canopy with trailers backed in.
- **Street View:** Swing/sliding metal gate across the Arenth Avenue truck lane.

## Gate / guard-shack / dock determinations
- **Truck gate: TRUE.** The site is fully enclosed by a metal perimeter fence
  and masonry wall. Street View (pano 34.00407,-117.90599) clearly shows a
  swing/sliding metal gate across the truck entrance lane on Arenth Avenue.
- **Guard shack: FALSE.** No staffed booth at the gate — Street View shows only
  wall-mounted signs beside the gate; the small structures inside the fence are
  process/utility equipment, not a gatehouse.
- **Remote GS: TRUE.** A controlled gate with no guard booth implies badge /
  intercom / remote check-in.
- **Docks:** Tight 284,000 sq ft refrigerated plant; loading is on the south/SW
  face under a dock canopy with trailers backed in. Estimated ~14 doors → band
  **10-25** (low confidence — dense rooftop equipment and the canopy obscure the
  dock line). Shipping/receiving not clearly split → `shipRcvSeparate: false`.

## Yard zones and counts
- **Perimeter:** S 34.00355 / W -117.90730 / N 34.00580 / E -117.90480 — ≈ 250 m
  × 231 m, about 14 acres.
- **Drop yards:** none dedicated — only a handful of trailers along the SW edge
  inside the fence; `dropArea` banded 0-10, `dropYard: false`. One small box
  marks the SW trailer-parking strip.
- **Dock apron:** boxed the south covered-dock face.
- **Truck gate box:** the Arenth Avenue sliding gate.
- **Buildings:** integrated plant + SE admin/office building (+ on-site
  wastewater treatment) → buildingCount 2, `multipleFacilities: false`.
- **Rail:** through rail corridor along the north edge, no spur into the
  building → `railServed: false`.
- **Scale:** none confirmed (uncertain).

## Web findings
Roster source corroborates: 284,000 sq ft, 336 employees, founded 1986,
producing Silk Beverage, SToK Coffee, and International Delight Creamer — a
mature, space-constrained urban refrigerated beverage plant.

## Final assessment
- **Gate verdict:** Truck gate present — fully fenced/walled site with a sliding
  gate on Arenth Avenue.
- **Guard-shack verdict:** No guard shack — unstaffed gate, remote check-in
  implied.
- **Archetype:** Gate + Remote GS, tight urban refrigerated plant, backup-
  sensitive entry, minimal drop yard.
- **Confidence:** HIGH — geocode landed on the plant, clear satellite, and
  Street View confirmation of the fence and gate. Dock-door count is the only
  low-confidence field.
