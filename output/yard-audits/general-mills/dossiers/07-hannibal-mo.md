# Deep-Audit Dossier — General Mills, Hannibal MO (idx 7)

## Resolved location
- **Facility:** General Mills Hannibal Plant, 1 Red Devil Rd, Hannibal, MO 63401
- **Type:** Manufacturing plant — produces Nature Valley, Betty Crocker, Old El Paso, Progresso (Muddy River News, 2024 expansion adding an Old El Paso taco-shell line).
- **Locked center:** 39.68180, -91.41440
- **How confirmed:** Roster geocode was GEOMETRIC_CENTER precision (5.6km nominal move) but landed inside the Hannibal industrial park. Satellite z16 immediately showed a large central industrial plant with extensive trailer yards consistent with the GM facility; web search confirms the GM food plant at 1 Red Devil Rd. Locked center on the main building.

## Key views
- **z16/z17 wide:** Large process/manufacturing plant in an industrial park, surrounded on the W and NW by multiple large trailer drop yards (dirt/gravel lots full of parked trailers). Employee parking to the south.
- **Street View (Red Devil Rd access, captured 2024-08):** The private access road runs from the public road past an electrical substation (fenced equipment yard, not a guard booth) and over a creek bridge into the plant yard. Trailers are parked along the access road (sign reading "VENTURE"). No barrier arm or gate seen at the property line; Street View coverage on the private road is partial.
- **z18-z20 docks:** Main dock bank on the N/NW building face with ~25-35 trailers backed in. East/south of the building is process equipment on the roof.
- **z19-z21 transition area:** Wide open paved yard between the access bridge and the docks; a small-structure cluster near 39.6803,-91.4137 is a maintenance/materials storage area, not a staffed gate booth.

## Gate / guard-shack / dock determinations
- **Truck gate:** FALSE (flagged uncertain). No barrier arm, sliding gate, or checkpoint pinch-point identified where the access road meets the public road or enters the yard. The access corridor opens directly into the truck yard.
- **Guard shack:** FALSE. No staffed booth found anywhere along the access road or at the yard entrance.
- **Remote GS:** FALSE — no gate, so no remote check-in inference.
- **Dock doors:** 25-50 band. N/NW dock bank shows ~25-35 backed-in trailers.
- **Ship/receive separate:** FALSE, flagged uncertain — could not distinguish separate dock clusters.

## Yard zones and counts
- **Perimeter:** ~106 acres covering the plant, drop yards, and employee parking.
- **Drop yards:** 4 boxed lots (NW main lot, W lot, NW-corner lot, S lot) — 50+ band, very large operation, ~150 trailers visible, ~220 capacity.
- **Dock apron:** 1 main apron on the N/NW building face.
- **Staging:** Open paved transition yard inside the access bridge counts as post-gate staging.
- **Buildings:** ~4 distinct structures — multipleFacilities TRUE.
- **Rail:** Not served — a rail line runs along the north edge of the industrial park but no spur enters the GM property.
- **Scale:** None identified (flagged uncertain).
- **Fast-lane opportunity:** TRUE — wide open paved width in the transition yard.

## Web findings
- Muddy River News / hannibal.net: GM Hannibal facility produces Nature Valley, Betty Crocker, Old El Paso, Progresso; a 2024 expansion adds an Old El Paso hard-shell taco production line, increased square footage, and ~35 jobs.

## Final confidence
**HIGH** on location, layout, drop yards (a notably large drop-yard operation), dock band, and rural setting. **Lower confidence** on truck-gate/guard-shack (no checkpoint seen, but Street View coverage of the private access road is incomplete) and ship/receive separation. Archetype: open-access (no gate / no guard shack) large manufacturing plant with a very large multi-lot drop yard.

Sources:
- https://muddyrivernews.com/business/expansion-at-general-mills-facility-in-hannibal-will-add-old-el-paso-taco-shell-production-line-creating-35-jobs/20241122120908/
- https://www.hannibal.net/news/city-council-approves-benefits-package-for-general-mills-expansion/article_8efd4998-546a-11ef-8d01-672c188f50c1.html
