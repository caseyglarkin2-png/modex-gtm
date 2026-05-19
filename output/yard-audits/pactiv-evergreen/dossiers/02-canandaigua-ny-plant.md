# Pactiv Evergreen — Canandaigua NY Plant (idx 2)

**Address:** 5250 North Street, Canandaigua, NY 14424
**Type:** Manufacturing Plant (Food Merchandising campus)
**Resolved center:** 42.905500, -77.299800
**Confidence:** High

## Resolved location & how confirmed
The roster coordinate (42.903839, -77.301317) lands on the south end of a very
large Pactiv industrial campus on North Street, NW of Canandaigua, NY. Web
search confirmed Pactiv LLC operates a plastics/foam food-packaging plant at
5250 North Street (the campus has been in continuous operation since 1966 and
is Ontario County's largest private employer, >700 employees). Satellite probes
from z15 down to z19 mapped the full campus: a cluster of dark-roof
manufacturing buildings on the east side (the plant — idx 2) plus several
tan-roof warehouse/distribution buildings to the west, all inside one
contiguous fenced and gated property. Note: the idx 3 CTC Distribution Center
(2480 Sommers Drive) carries the ZIP+4 14424-5250 — it is the warehouse/DC
half of this same campus.

## Key views
- **z15/z17 overview:** one contiguous gated campus ~0.8 km E-W; dark-roof plant
  east, tan-roof warehouses west, hundreds of trailers in marked drop-yard rows.
- **z19 plant docks:** the manufacturing complex is several connected large
  buildings; a dock apron with ~6-8 doors on the SW plant face, additional
  dock faces toward the warehouse buildings.
- **z18 rail view:** a rail spur enters from the NE and curves down the east
  property edge into the plant; rail cars parked on the spur are visible.

## Gate / guard-shack determination
**Truck gate: YES.** Street View (2016-09) at the campus south entrance
(~42.9028, -77.3030) shows a black-and-white striped **barrier arm** spanning
the truck lane, flanked by two **sliding chain-link gates** and STOP signs.
Perimeter chain-link fencing rings the whole property. This is the single
shared truck gate for the entire Pactiv Canandaigua campus (plant + DC).

**Guard shack: YES.** A small flat-roof **booth** sits immediately left of the
gate — windowed on multiple sides, ~1-2 vehicle footprint, set beside the gate
lane, with a US flag pole. It carries an "Adecco" staffing-agency sign (Adecco
runs on-site staffing/check-in here). It functions as the staffed check-in
booth. A "Pick Up Phone For Directions" call-box kiosk is also mounted at the
gate as a secondary aid, but the booth is the primary control — so
`remoteGs = false`.

## Yard zones & counts
- **Drop yards:** extensive marked trailer-parking rows across the west and
  central campus — well over 100 trailers visible; `dropArea` = 50+.
- **Dock aprons:** plant SW face apron (~6-8 doors) plus warehouse-adjacent
  dock faces; estimated ~40 doors campus-wide (low-confidence overhead count).
- **Post-gate staging:** broad paved apron / internal access road inside the
  gate before the dock banks.
- **Rail-served:** yes — spur into the plant from the NE.
- **Site area:** ~145 acres inside the perimeter (large property with wooded
  buffer).

## Web findings
- Pactiv Canandaigua: continuous operation since 1966, >700 employees, Ontario
  County's largest private employer (Strictly Business NY; Ontario County
  Chamber). Profiled in Pactiv Evergreen's "Inside the Supply Chain" series per
  the account GTM dossier.
- NYSDEC environmental notices list "Pactiv LLC, Town of Canandaigua" — a
  permitted industrial manufacturing site.

## Classification highlights
Gate + guard shack + campus (`multipleFacilities`) + dedicated drop yard +
rail-served + 50+ drop area. `fastLaneOpportunity = true` — the wide multi-bay
gate apron has room for a dedicated express lane. Rural edge-of-town setting.

**Final confidence: High** — location unambiguous, gate and guard booth
positively identified in Street View. Counts (dock doors, trailers) are honest
overhead estimates and flagged uncertain.
