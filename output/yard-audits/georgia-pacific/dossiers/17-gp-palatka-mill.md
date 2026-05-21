# GP Palatka Mill — Palatka, FL (idx 17)

## Resolved location
- **Coordinates:** 29.6860, -81.6575 (mill core)
- **Address:** 215 County Road 216 / US-17 corridor, ~4 mi NE of downtown Palatka, FL 32177
- **Type:** Integrated kraft pulp/paper mill (also produces tissue and paper; GP Packaging & Cellulose Kraft division)
- The roster coordinate (29.650032, -81.647668) landed in **residential downtown Palatka** — ~4 km off. Web research placed the mill 4 mi NE of downtown on the St. Johns River. Satellite at 29.685, -81.658 revealed the large industrial complex on the **west bank of the St. Johns River**.
- Web corroboration: CLUI lists "Palatka Paper Mill"; Forest Products Locator lists "Georgia-Pacific Palatka Mill"; GP announced an $83M expansion (Apr 2025) and a $400M tissue machine project at this site.

## Key views
- **Wide (z14/z15):** Large linear industrial complex hugging the west bank of the St. Johns River, north of downtown Palatka, served by rail and US-17.
- **North (z16/z17):** Woodyard — rows of log/lumber storage, large red-roofed wood storage sheds, chip piles, and a multi-track rail yard.
- **Mill core (z17):** Kraft mill processing buildings, recovery/process structures, and warehouse/converting buildings along the west (rail) side.
- **South distribution warehouse (z18/z19):** A large modern distribution warehouse with a long dock apron along its east face and trailers parked at the north end.
- **Yard (z18):** Trailers (including blue trailers) parked in rows; internal road network and parking clusters.

## Gate / guard-shack / dock determination
- **Truck gate:** The mill is a fully fenced ~316-acre kraft mill complex. The access road branches off US-17 (turn lane and railroad crossing visible at the SW intersection) and runs NW into the property. A controlled, guarded truck entrance is standard for a paper mill of this scale (700+ employees, major active investments). The gate structure sits behind a tree buffer and is **not directly resolvable in Street View** — called `true` at medium confidence.
- **Guard shack:** Inferred present from scale and security profile; not positively imaged. Flagged uncertain.
- **Docks:** Loading docks at the distribution warehouse east face and converting/warehouse buildings — ~30 doors estimated → band **25-50** (low confidence).
- **Ship/Rcv separate:** Inbound wood fiber received by rail/truck at the north woodyard; finished product ships from the south distribution warehouse — physically separate clusters → `shipRcvSeparate: true`.
- **Scale:** A truck scale is standard at a fiber-receiving mill; not positively imaged — flagged uncertain.

## Yard zones and counts
- **Perimeter:** ~316 acres captured (long riverbank parcel).
- **Drop yard:** Trailers parked in rows in the mill yard — band **25-50**, ~45 visible, ~90 capacity.
- **Dock apron:** East face of the distribution warehouse.
- **Staging:** Paved yard area between the mill core and warehouses.
- **Rail served:** Yes — extensive multi-track rail yard runs through the complex.
- **Buildings:** ~18 distinct structures → `multipleFacilities: true` (campus).

## Web findings
- GP Palatka kraft mill; one of GP's largest pulp/paper operations; Energy Star plant profile published by EPA. April 2025: $83M expansion announced. Selected for a $400M tissue machine project. Strong economic anchor of Putnam County / Jacksonville region.

## Final confidence
**Medium.** Facility identity (relocated from a wrong roster coordinate), location, layout, rail service, distribution warehouse, and drop yard are high-confidence. The truck gate and guard shack are inferred from scale/security norms because Street View cannot resolve the tree-buffered entrance; dock count and scale are overhead estimates.
