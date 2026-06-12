# 03 — Gatorade / PepsiCo Indianapolis Hotfill Plant — Indianapolis, IN

**Resolved location:** 5858 Decatur Blvd (AmeriPlex, near IND airport) — complex centered at **39.6817, -86.2990**. Roster geocode (GEOMETRIC_CENTER) landed on the building; confirmed.
**Maps:** https://www.google.com/maps/@39.6817,-86.2990,400m/data=!3m1!1e3

## Identity confirmation (Step 0)
- z16/z17 satellite shows a very large connected complex rotated ~30 degrees off north: a production section (light roof, dense rooftop process units, tank/utility area + water tower on the west side) and an attached dark-roof distribution warehouse, with an office + visitor lot at the SE front on Decatur Blvd. Matches the DOE Better Plants / EnergyStar "PepsiCo Indianapolis Hotfill" Gatorade/Propel plant. The tan-roof building SE across the pond and the warehouse SW across the west drive are separate AmeriPlex tenants — excluded.

## Key views
- **z16 overview (tmp/p03-z16.png):** full campus; huge paved trailer yard north of the plant; dock line on the warehouse's NE face; Decatur Blvd along the SW frontage.
- **z18 north yard (tmp/p03-yardN-z18.png):** the drop yard at the NW corner — rows of trailers (150-200 est. across the yard), bermed/fenced edge with utility poles.
- **z18/z19 NE corner (tmp/p03-entNE-z18.png, p03-gate-z19.png):** trailers parked along the NE property edge; treeline beyond — **no entrance on the east side**.
- **z18/z20 SW entrance (tmp/p03-entS-z18.png, p03-gateSW-z20.png):** truck entrance off Decatur Blvd: divided parallel approach lanes with a grass median, a small blue-roofed booth-sized structure at the junction, plus a rounded dead-end stub lane (possible queue/scale lane). Water tower/utility cluster behind.
- **Street View:** the only nearby pano (2024-10) is on an interior service drive showing a laydown yard — Google drove inside the property; the public-road checkpoint view is not available. Gate/booth calls are satellite-only.

## Determinations
- **Gate:** `truckGate: true` (medium) — dedicated divided truck entrance with a checkpoint-scale structure; flagged uncertain (no ground truth).
- **Guard shack:** `true` (medium) — booth-sized blue-roof structure beside the lanes; flagged uncertain.
- **Docks:** band **50+** (~40 on the warehouse NE face + ~15 on the plant north face).
- **Drop yard:** `true`, band **50+** — one of the larger trailer yards in this batch (~250 trailers visible site-wide, capacity ~350).
- **Layout:** long driveway (Decatur Blvd to docks ~500 m), single truck entrance (entry/exit together), ample interior holding (postGateStaging true), wide aprons = fast-lane room. Ship/receive on separate faces. Urban (Indianapolis metro industrial park). No rail spur into the site.

## Measurements
- Perimeter polygon (11 vertices, oriented to the rotated campus) ≈ **60.3 acres**.

## Web corroboration
Roster sources (DOE Better Plants 2020 award, EnergyStar hotfill listing, AmeriPlex) consistent with the observed hotfill production + warehouse + mega drop yard.

**Final confidence: medium** — identity and yard layout high; gate/guard verified only from overhead (no usable Street View of the entrance).
