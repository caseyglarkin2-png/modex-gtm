# Deep-Audit Dossier — Fontanini Foods, McCook IL (idx 11)

**Account:** Hormel Foods
**Facility type:** Meat Processing Plant (Italian meats / sausage / pizza toppings)
**Resolved coordinates:** 41.79935, -87.83780
**Confidence:** High

## Location confirmation
The roster pin (41.80571, -87.833375) landed on the I-55 / 1st Ave interchange,
not a building. Web research established the plant's true address as 8751 W 50th
St, McCook IL 60525 (the roster's "8499 W 47th St" is incorrect) and listed
coordinates near 41.7993, -87.8376. A z18 satellite probe there showed a large
white-roofed industrial building with a rooftop solar array, dock doors and
trailers — consistent with Fontanini's modern ~188,000+ sq ft plant (built 2008,
expanded several times; Hormel-owned since 2017; Food Processing's 2023 Green
Plant of the Year). Locked center at 41.79935, -87.83780.

## Key views
- **Wide (z17/z18):** Single large plant building set inside the McCook
  industrial park, ringed by other large distribution buildings. Employee
  parking on the east side; truck yard wraps the west and south sides.
- **West dock face (z20):** Continuous line of dock doors with ~6-7 trailers
  backed in; large open paved apron in front.
- **South/SW (z20):** A second dock cluster on the south building face; a long
  utility pipe rack crosses the SW apron. Large open yard.
- **North edge:** Row of trailers parked along the entry road near the building.

## Gate / guard-shack determination
- **truckGate: false.** Street View from 2019, 2025-09 and 2025-10 covering the
  north and west industrial-park roads shows no barrier arm, sliding/swing gate,
  or checkpoint pinch-point at any property access. A tractor-trailer was seen
  maneuvering freely between the public road and the yard. The truck yard opens
  directly onto the industrial-park streets.
- **guardShack: false.** No staffed booth structure beside any entrance.
- **remoteGs: false** (no gate exists).

## Yard zones and counts
- **Perimeter:** ~21 acres — single building plus wrap-around west/north/south
  paved yard. Captured in the `perimeter` box.
- **Dock aprons:** west face apron and a SW/south-face apron, both boxed.
- **Drop yard:** open paved apron on the west and north sides holds parked
  trailers separate from active docking — `dropYard: true`.
- **dockDoorCount ~22** (10-25 band), **trailersVisible ~16**, **capacity ~35** —
  honest overhead estimates; pipe rack obscures part of the SW count.
- **truckGateCount 0**, **buildingCount 1**, **railServed false**.

## Web findings
Fontanini Foods, LLC — 8751 W 50th St, McCook IL. Italian meats and sausages,
pizza toppings, meatballs for foodservice. New 188,000 sq ft McCook plant built
2008, three subsequent expansions. Acquired by Hormel Foods (from Capitol
Wholesale Meats) for $425M in 2017. Named Food Processing's 2023 Green Plant of
the Year (rooftop solar visible in imagery corroborates this).

## Final assessment
Open, ungated meat-processing plant in a dense Chicago-metro industrial park.
No truck gate, no guard shack. Generous open yard apron — strong physical room
for a fast / express lane if a gate were ever installed. Confidence: High.
