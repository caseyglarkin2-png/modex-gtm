# Deep-Audit Dossier — General Mills, Covington GA (idx 6)

## Resolved location
- **Facility:** General Mills Covington Plant, 15200 Industrial Park Blvd NE, Covington, GA 30014
- **Type:** Manufacturing plant (ready-to-eat cereal — Cinnamon Toast Crunch and other varieties; opened 1989; ~400 employees per Georgia.org / Covington News).
- **Locked center:** 33.62280, -83.82400
- **How confirmed:** Roster pin (33.6234, -83.8254) carried a ~2.5km city-level geocode offset. Satellite probes z16–z20 around the pin found a single large grey-roofed industrial campus immediately to the east; Street View along Industrial Park Blvd NE shows the perimeter fence with the plant building behind it; web search confirms the cereal plant at that address. No ambiguity.

## Key views
- **z16/z17 wide:** Self-contained industrial campus surrounded by forest. Two main building clusters plus several smaller structures, multiple trailer lots, employee parking, and wastewater treatment ponds on the south side.
- **Street View (Industrial Park Blvd NE, captured 2026-02):** Continuous black ornamental metal perimeter fence along the public road; plant building visible behind. Coverage does not extend onto the private entrance road, so the gate structure itself is not directly imaged.
- **z18 docks / z20 main dock:** Large SE-facing dock apron with ~30–40 trailers backed into two banks; additional dock doors on the east building.
- **Trailer lots:** Four distinct drop yards — NW lot, N lot near the water tower, and two SE lots adjacent to the main docks — collectively holding 90+ trailers.

## Gate / guard-shack / dock determinations
- **Truck gate:** TRUE. The property is fully perimeter-fenced and accessed by a single private road off Industrial Park Blvd NE near a road intersection at the SW corner. Treated as a controlled truck entrance (entry/exit together).
- **Guard shack:** FALSE (low confidence). No staffed booth visible at the property line. Street View does not cover the private entrance road, so a booth could exist undetected. An interior structure near 33.6225,-83.8246 reads as a covered break/smoking shelter, not a gate booth.
- **Remote GS:** TRUE by inference — gate present, no confirmed booth. Flagged uncertain.
- **Dock doors:** 50+ band. Main SE dock face shows two long banks of backed-in trailers; the east building adds more doors.
- **Ship/receive separate:** TRUE — dock activity is split across separate building faces (SE main dock bank and east-building dock bank).

## Yard zones and counts
- **Perimeter:** ~146 acres as boxed, but heavily forested — usable paved industrial core is roughly 45–55 acres.
- **Drop yards:** 4 lots, 50+ trailer band, ~140-trailer capacity.
- **Dock aprons:** 2 main aprons (SE and NE-of-center building faces).
- **Dock doors:** ~55 estimated.
- **Trailers visible:** ~95 across captured imagery.
- **Buildings:** ~5 distinct structures — multipleFacilities TRUE (campus).
- **Rail:** Not served. The diagonal cleared strips east of the plant are a power-line right-of-way, not rail.
- **Scale:** None identified (flagged uncertain).

## Web findings
- Georgia.org / Area Development / Covington News: Covington plant produces multiple cereal/snack varieties, called one of the most diverse in the GM network; 2020 expansion added Cinnamon Toast Crunch capacity and 40 jobs; opened 1989; ~400 employees.

## Final confidence
**HIGH** on location, layout, docks, drop yards, rail, urban/rural. **Lower confidence** on guard-shack/remote-GS and entry/exit lane counts because Street View does not reach the private entrance road. Archetype: large guarded/controlled manufacturing campus with extensive drop-yard operations (Gate, multi-building campus, large drop yard).

Sources:
- https://georgia.org/press-release/general-mills-expands-covington-operations-creates-40-new-jobs
- https://www.areadevelopment.com/newsitems/9-9-2020/general-mills-industrial-park-boulevard-northeast-covington-georgia.shtml
- https://www.covnews.com/news/business/general-mills-celebrates-30-years-covington/
