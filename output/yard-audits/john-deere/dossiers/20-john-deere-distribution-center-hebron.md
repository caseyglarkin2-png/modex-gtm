# Deep-Audit Dossier — idx 20

## John Deere Distribution Center — Hebron, IN

**Type:** Parts Distribution Center
**Address:** 2105 W 181st Ave, Hebron, IN 46341
**Resolved coords:** 41.2820, -87.3020 (parcel estimate — SW quadrant of the I-65 / SR-2 interchange)
**Gate verdict:** Cannot determine — facility not yet built
**Confidence:** LOW (cannot locate a building — greenfield site under construction)

---

## Step 0 — Locating the facility

The roster flags this entry as a greenfield project ("new $125M, 1.2M sq ft, 234-acre DC; groundbreaking early 2026, opens ~2026"). Web research confirms and dates the project precisely:

- John Deere purchased a **234-acre site in July 2024 for $7M**.
- The company will invest **$125M** in a **1.2 million-sq-ft** warehouse / parts distribution center.
- Site address: **2105 W 181st Ave**, "just southwest of the interchange of I-65 and State Road 2," near the Lowell / Hebron area of Lake County, IN.
- **Groundbreaking occurred in late January 2026** (announcement dated Jan 27, 2026).
- Roughly 150 jobs; facility expected to open within about a year of groundbreaking.

I located the I-65 / SR-2 (181st Ave) interchange — Exit 240 — in satellite imagery. I-65 runs NW-SE diagonally; SR-2 / 181st Ave runs E-W. The Flying J truck stop at 3231 E 181st Ave sits NE of the interchange. The John Deere parcel, addressed "2105 W 181st Ave," is in the **southwest quadrant** of the interchange.

## Imagery findings

| View | Zoom | What it showed |
|------|------|----------------|
| Roster point 41.288631,-87.358717 | 13-17 | Open farmland ~5 km west of the interchange; a small unrelated blue-roofed building cluster (storage/agricultural) to the NE. Not the DC. |
| I-65 / SR-2 interchange | 14 | Confirmed the diamond interchange. Commercial development (truck stop, light industrial) NE; a sand/gravel pit to the SE; farmland SW and NW. |
| SW quadrant of interchange | 15-16 | **Entirely undeveloped agricultural land** with a small pond / borrow area. No graded pad, no foundation, no roads, no truck infrastructure. |

The available satellite imagery (©2026 Airbus / CNES / Maxar) has not captured any construction progress — the SW quadrant remains farmland. Groundbreaking was only ~4 months before the audit date (2026-05-18), and current imagery predates visible vertical or earthwork progress.

## Classification

Per the deep-audit instructions for an unfindable / not-yet-built facility, all 22 physical-layout flags are defaulted (`truckGate` etc. = false, `dockDoors`/`dropArea` = NONE, lane counts = null) and every flag is listed in `uncertainFields`. `urbanRural` = **Rural** (open agricultural land at the edge of the small towns of Hebron and Lowell). `yardMetrics` are zeroed except `siteAreaAcres` = 234 (the reported parcel size, not a measured perimeter). The `perimeter` geofence is left `null` because no fence line exists in imagery.

## Web findings

- Indiana EDC / Gov. Braun announcement (Jan 2026): 150 new Lake County jobs, $125M investment.
- Fox59, Hoosier Ag Today, Building Indiana, NWI Business Magazine: confirm groundbreaking, 234-acre parcel, 1.2M sq ft, location SW of I-65/SR-2.
- John Deere corporate (deere.com "two-new-us-facilities" story): facility will serve as a parts hub for ag, turf, construction, forestry, and mining customers nationwide; positioned for I-65 highway access.

## Recommendation

Re-audit once post-construction satellite imagery becomes available — the facility is expected to be operational within roughly 12 months of the January 2026 groundbreaking. At that point the truck gate, dock banks, and drop yard can be classified properly.

**Final confidence: LOW** — greenfield site, no building in imagery to audit.
