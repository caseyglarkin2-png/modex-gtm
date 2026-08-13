# Tyson Foods Shelbyville Poultry Plant - Shelbyville, TN

**idx 11 · Poultry Processing Plant · deep-audit 2026-07-30**

Resolved center: **35.47812, -86.47430** (901 Jackson St, Shelbyville, TN 37160)
Maps: https://www.google.com/maps/@35.47812,-86.4743,400m/data=!3m1!1e3

---

## How the site was pinned

The roster coordinate (35.478006, -86.475062) was already ROOFTOP and landed inside the
complex, so Step 0 was a confirmation rather than a search. A z16 crop showed a river-bend
industrial site with two distinct clusters: a long legacy manufacturing building to the
north and a dense process block to the south. The southern cluster is unmistakably an
integrated poultry complex (two anaerobic digesters, a clarifier, a polishing lagoon,
ridge-vented live-receiving sheds, and two fields of live-haul coop trailers). Reverse
geocoding both the plant centroid and the entrance drive returns 901 Jackson St,
Shelbyville TN. The northern building has an empty, weeded yard and no truck activity; it
was excluded from the perimeter and noted as an adjacent legacy parcel.

**Verification caveat:** the WebSearch budget for this run was exhausted, so operator
identity rests on the rooftop geocode plus site typology, not a 2026 company source.
Verdict recorded as `probable`, confidence medium-high. Re-verify before naming the plant
in outbound copy.

## Key views

| View | What it showed |
|---|---|
| z16 / z15 wide | Site sits in a Duck River bend on the west edge of town. Single road access from the north. Farmland west, residential 400 m northwest. |
| z17 plant overview | Process block in the center, employee parking north, wastewater plant east, live-haul trailer yards south and east, polishing lagoon southeast. |
| z18 north edge | The car parking lots, the live-haul coop trailer rows, the digesters and the sheds; a treed berm separating the Tyson yard from the legacy parcel north. |
| z19 / z20 gate | The approach drive narrowing around a landscaped island with a booth in the median; one lane each side. |
| Street View pano `YLPSYy0zO7GobdUpc6CRtg` (2023-05) | Headings 135 / 175 / 183 / 189 / 200 / 208 — the booth, the flags, the bollards, the fence line and the outboard concrete staging pad. |
| z20 west / east faces | Trailers backed into the building faces; ribbed canopies over other faces obscuring the door line. |

## Gate determination — TRUE

Google's Street View car drove into the plant approach and stopped 80 m short of the
entrance. From that pano, looking south, the drive pinches from a wide apron down to two
narrow lanes split by a raised landscaped island. Yellow bollards flank both shoulders and
chain-link fence runs east from the island across the property line. At z20 the split is
plainly visible in plan. That is a controlled checkpoint, not an open driveway.

## Guard shack — TRUE

At fov 12, heading 183, the booth resolves clearly: a small brick structure on the island,
windows on multiple faces, posted signage, bollard protection, three flagpoles (US,
Tennessee, corporate). Footprint including the island measures roughly 8 m by 9 m at z20 —
a classic 1-3 vehicle-footprint booth, not a building. `remoteGs` is therefore false.

## Docks — 10-25 band, LOW CONFIDENCE on the exact count

This is an older integrated complex, so the doors are spread across several small banks
instead of one wall:

- West face at 35.47745, -86.47576: 3-4 trailers backed in, dock line visible.
- East face at 35.47749, -86.47413: 2-3 trailers plus a tractor working the face.
- North and south-east faces: long ribbed canopies over the dock line, so the doors cannot
  be counted from overhead at all.

`dockDoorCount: 20` is an honest mid-band estimate, not a count. Flagged uncertain.

## Yard zones and counts

- **Perimeter** — 11-vertex ring tracing the fence and treeline from the north parking lots
  around the trailer yards and the lagoon. **37.9 acres.** The site is roughly 415 m by
  418 m; it reads bigger than it is because the yard is almost entirely open gravel.
- **Truck gate** — 25 m by 42 m quad over the booth island and both lanes. The drive runs
  true north-south here, so the quad is genuinely axis-aligned.
- **Staging (pre-gate)** — 45 m by 25 m concrete pad plus gravel apron east of the drive,
  outside the booth. Street View at heading 208 shows it empty, with bolt patterns from a
  removed structure and a utility cabinet.
- **Drop yards (3)** — the east trailer field wrapped around the digesters (~55 trailers),
  the south live-haul yard (~33 trailers, parked in two angled rows), and a west fence-line
  row (~8). Trailer length in the imagery measures ~19 m tip to tail, consistent with 53-ft
  equipment parked side by side at roughly 4 m centers.
- **Dock apron (1)** — the west-face maneuvering strip, 11 m by 24 m.
- **Totals** — trailersVisible ~108, capacity ~190, buildings ~12, one truck gate, no rail
  spur into the property (a line runs northwest of the approach corridor but does not turn in).

## Operating read for the sales conversation

Every vehicle on this site — cars, dry vans and live-haul coop trailers — funnels through
one manned booth on one drive. There is no bypass, no second gate, no scale, and no
evidence of an automated check-in. The approach carries a large unused concrete apron
directly beside the booth, which is exactly where a fast lane or a remote check-in kiosk
would go without pouring new pavement. Behind the gate the yard is 350 m of open gravel
holding roughly 108 trailers in three unmarked fields, which is a yard where "where is
trailer X" is answered by driving around and looking.

## Confidence

**Medium overall.** The gate and guard-shack calls are high confidence (Street View is
direct and recent enough). Dock count, scale presence, the exact trailer counts, the
ship/receive split and railServed are inferred and flagged in `uncertainFields`. Operator
identity is `probable`, not web-confirmed, because the search budget was spent.
