# US PL High Springs Factory — Deep Audit Dossier

**Type:** Bottling plant (PL) · BlueTriton / Primo Brands (formerly Nestle Waters)
**Address:** 7100 NE County Rd 340, High Springs, FL 32643
**Resolved center:** 29.81830, -82.68970
**Maps (satellite):** https://www.google.com/maps/@29.81830,-82.68970,400m/data=!3m1!1e3
**Confidence:** high
**Method:** deep-audit

---

## Location resolution

The supplied coordinates (29.8283, -82.5967) landed in **downtown High Springs** — a
small-town grid of houses and minor commercial buildings, no industrial plant.
Wrong point.

A Google **ROOFTOP** geocode of the street address (`7100 NE County Rd 340, High
Springs FL 32643`) returned **29.81821, -82.68969**, ~9 km SW of the town center
near the Santa Fe River / Ginnie Springs. Satellite there shows a large industrial
bottling/distribution building with extensive truck docks and trailer yards in open
rural country — the right facility type. Web sources confirm this is the **BlueTriton
Brands (Primo Brands) High Springs water plant**, formerly **Nestle Waters**
("Nestle Waters High Springs, 7100 NE County Road 340" on TruckMap/YellowPages);
it bottles spring water pumped under the Seven Springs / Ginnie Springs permit.
Locked building centroid **29.81830, -82.68970**.

## What the key views showed

- **Wide satellite (z17):** One large **L-shaped** distribution/bottling building,
  slightly rotated off north, with an attached process/utility annex on its east end.
  Dock banks with backed-in trailers on the **north** and **south** faces; dense
  trailer-parking rows along the N and S perimeter; a large paved **truck loop /
  turnaround ("racetrack")** on the NE/E side; a single entry drive from CR 340 at
  the south splitting to employee parking (SE) and the truck yard. Surrounded by
  fields, forest, and a sand/mining pit to the south — clearly rural and isolated.
- **Entry drive (z19/z20):** The main drive leaves CR 340, widens to ~2 painted lanes,
  and runs north to the building; an employee parking lot sits to its west.
- **North yard (z19):** Long row of dock doors with trailers backed in, plus a
  perimeter truck road and a deep field buffer to the north fence line.
- **South / SW (z19):** A long south-face dock bank with trailers backed in and a
  drop-trailer row along the south edge; west fence is a tree line.
- **East (z19):** Building's E inset face with the broad paved loop used for truck
  circulation/staging.

## Gate / guard-shack / dock determinations

- **Truck gate — TRUE (high confidence).** Street View up the entry drive
  (pano `mMYa1zJeJf_erlM6PvF9_g`, captured **2026-04**, heading ~344-350°) clearly
  shows a **white cantilever/sliding gate spanning the full width of the truck drive**
  at the property line, with **chain-link perimeter fencing** running both directions
  and **directory/check-in sign posts** flanking the drive (a blue sign on the left, a
  post on the right). The z20 satellite shows the gated drive widening to ~2 inbound
  lanes.
- **Guard shack — FALSE (high confidence).** No booth-sized structure (1-3-vehicle
  footprint, multi-side windows) at or beside the gate in either Street View or
  satellite. The gate stands alone with signage only.
- **Remote guard station — TRUE (medium confidence).** Gate present + no booth implies
  kiosk / call-box / app check-in. The flanking sign posts are likely a directory and a
  callbox/keypad, but the exact mechanism can't be read from imagery, so it's flagged.
- **Dock doors — 50+ band.** Regular dock rhythm with trailers backed in on the north
  face (~20+), the south face (~20+), plus doors on the E/NE inset face. Honest total
  ~55-65 → **dockDoorCount ≈ 60** (±15).
- **Drop area — 50+ band; dropYard TRUE.** Dense rows of tractor-less trailers along
  the N field edge, the S edge, and the SW corner; ~50-70 slots visible. Dedicated
  trailer storage separate from active dock staging.

## Yard zones measured

- **perimeter** — 9-vertex oriented ring around the fenced footprint
  (building + aprons + loop + drop rows + parking). **Shoelace area ≈ 30.9 acres**
  (recorded 30.0).
- **truckGate** — small quad over the gated entry-drive pinch point at the property line.
- **dropYards** — two rings: the north trailer-parking row and the SW/south trailer row.
- **dockAprons** — three rings: north-face apron, NE-inset-face apron, south-face apron,
  each a long thin quad parallel to its dock wall.
- **staging** — the NE/E paved truck loop ("racetrack"), the inside-gate queue/turnaround.
- **streetViewMeta** — entrance public-road pano `mMYa1zJeJf_erlM6PvF9_g` (2026-04) is
  the driver's-eye arrival frame; used for both truckGate (heading 344°) and perimeter
  (heading 317°). The gate centroid and building centroid returned ZERO_RESULTS (no
  on-property panos, as expected for a private plant); the road pano nonetheless shows
  the gate and the front perimeter, so it is recorded for both zones.

### yardMetrics
| metric | value |
|---|---|
| dockDoorCount | ~60 |
| trailersVisible | ~70 |
| trailerParkingCapacity | ~90 |
| truckGateCount | 1 |
| buildingCount | 1 |
| siteAreaAcres | ~30 |
| railServed | false |

## Web findings

- Facility = BlueTriton Brands High Springs plant, formerly Nestle Waters
  (Macrae's Blue Book, Dun & Bradstreet, TruckMap, YellowPages all list the
  7100 NE County Road 340 address).
- Bottles spring water pumped from the Ginnie Springs / Seven Springs area under a
  permit allowing ~984,000 gal/day; the subject of ongoing Santa Fe River withdrawal
  litigation (WUFT, Florida Springs Council, Our Santa Fe River). Confirms an active,
  high-throughput water-bottling operation consistent with the large dock/trailer
  footprint observed.

## Final confidence

**High.** Facility positively identified and re-located from a wrong supplied coord;
gate and no-guard-shack determinations are backed by clear 2026-04 Street View; docks,
drop yards, building count, rural setting, and no-rail are clear in 2026 Maxar/Airbus
satellite. Medium-confidence flags (listed in `uncertainFields`): exact remote-check-in
mechanism, precise dock count, exit-lane count, ship/receive separation, fast-lane
opportunity, and the inferred connectivity issue.
