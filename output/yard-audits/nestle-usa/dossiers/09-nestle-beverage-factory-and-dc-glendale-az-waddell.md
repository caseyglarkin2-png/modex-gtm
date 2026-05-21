# Deep-Audit Dossier — Nestlé Beverage Factory & DC, Glendale AZ / Waddell (idx 9)

## Facility
- **Name:** Nestlé Beverage Factory & DC - Glendale AZ (Waddell)
- **Type:** Beverage manufacturing plant + distribution center
  (Coffee mate, natural bliss, Starbucks creamers)
- **Address:** 8531 N 150th Ave, Waddell, AZ 85355
- **Locked center:** 33.55520, -112.38120

## Step 0 — Location confirmation
The roster coordinate (33.558619, -112.384378, RANGE_INTERPOLATED, moved 47m)
was accurate to within ~150m. Web research confirmed the address and the
facility — Nestlé's $675M greenfield beverage factory + distribution center,
630,000 sq ft, ~300-350 jobs, producing Coffee mate / natural bliss /
Starbucks creamers, which celebrated its opening on 28 January 2025. The large
multi-section building under construction in Maxar imagery, on a graded desert
parcel SW of Glendale with an adjacent golf course, positively matches.
Locked center 33.55520, -112.38120.

## IMAGERY LIMITATION (key caveat)
This is a **newly-opened facility** and the only satellite imagery available
shows the site **mid-construction**: the building roof is still being installed
(steel framing and blue under-construction roof panels visible) and the
surrounding yard is raw graded dirt with construction laydown, trailers and
equipment. Street View panos are from 2019-2021 — pre-construction empty
desert. As a result the operational truck-yard configuration cannot be reliably
read. The building footprint and parcel are confirmed; the gate, guard booth,
dock count, drop-yard layout, lane counts and staging are NOT determinable from
construction-phase imagery.

## Key views
- **z15-z16 overview:** Large white-roofed plant building under construction on
  a big graded parcel; major arterial on the north, road on the south, golf
  course to the SW; the south portion of the parcel is the future truck yard
  (raw dirt when imaged).
- **z17-z19 building:** Roof being installed; steel framing visible; process /
  utility area with tanks under construction on the south-central part.
- **Street View (2019/2021):** Empty desert lot — pre-construction.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (inferred, low confidence).** A brand-new (2024-25)
  modern food-grade Nestlé beverage factory + distribution center will have a
  controlled, guarded truck entrance. Not visible in construction imagery.
- **Guard shack — FALSE / uncertain.** Not determinable; conservatively false
  with remoteGs true.
- **Docks — 25-50 band (inferred).** Dock-door positioning is partly visible on
  the south building face but not countable; inferred from the 630,000 sq ft
  combined factory + DC scale.
- **Drop yard — 25-50 band, dropYard true (inferred).** South parcel allocated
  to truck/trailer yard, raw dirt when imaged.
- **Rail-served — FALSE.** No rail spur in the site grading.

## Yard zones & counts
- **Perimeter:** ~960 m N-S x ~640 m E-W graded parcel, ~110 acres
  (operational footprint smaller).
- **Truck gate / drop yards / staging:** not resolvable — left null/empty.
- **Dock aprons:** one inferred apron strip on the south building face.
- **dockDoorCount ~45 (inferred), trailersVisible 0 (imagery predates ops),
  capacity ~120 (inferred), buildings 1.**

## Web findings
- Nestlé invested $675M in this greenfield beverage factory + distribution
  center — its 20th US food & beverage factory — opened January 2025;
  630,000 sq ft; ~300-350 jobs; produces creamers (Coffee mate, natural bliss,
  Starbucks); water-recycling to 75%. (Nestlé USA, Food Dive, yourvalley.net,
  Food Processing, Dairy Foods.)

## Final confidence: LOW
The facility is positively located and identified, but every operational
truck-yard field is inferred from facility type/scale because the only imagery
available is from the construction phase. Recommend a re-audit once post-2025
operational satellite / Street View imagery becomes available.
