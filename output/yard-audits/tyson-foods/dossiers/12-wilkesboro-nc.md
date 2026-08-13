# Tyson Foods Wilkesboro Poultry Complex - Wilkesboro, NC

**idx 12 · Poultry Processing Plant · deep-audit 2026-07-30**

Resolved center: **36.14299, -81.16320** (campus centroid; addresses on the block run
100 N Brook St and 700-704 S Factory St, Wilkesboro, NC 28697)
Maps: https://www.google.com/maps/@36.14299,-81.1632,400m/data=!3m1!1e3

---

## How the site was pinned

The roster coordinate (36.145965, -81.160640) was flagged APPROXIMATE and landed on the
Wilkesboro town centroid, roughly 400 m northeast of the plant. Step 0 took three passes:

1. A z15 and z14 sweep of Wilkesboro showed one industrial mass large enough to be a Tyson
   complex, immediately southwest of the town center.
2. Geocoding candidate addresses returned a ROOFTOP hit on 704 S Factory St, which sits
   inside that mass. Reverse-geocoding the resolved buildings returns 100 N Brook St and
   700-704 S Factory St.
3. z17 and z18 crops confirmed a poultry campus: dense refrigerated process blocks, four
   trailer fields, a shop and wash canopy, and an employee lot holding roughly 1,000 cars.

**Operator confirmed directly.** Street View pano `lxgqT2KVvIQ2EzNqqbIuMQ` (2024-04) shows a
trailer inside the fence with TYSON on the door; pano `GjpUr_P9jDd_LPY4mwumJQ` (2024-08)
shows the red Tyson sign on the south frontage. Verdict `confirmed`, high confidence on
identity even though the WebSearch budget for this run was exhausted.

**Multi-parcel layout, as expected.** The complex is not one fenced block. It straddles
the US-421 Business corridor, public streets run through it, and a satellite trailer lot
sits on the north side of the highway at 36.1440, -81.1661. The perimeter traced here
covers the contiguous operating campus southeast of the highway; the satellite lot is
carried as a fourth drop yard outside that ring.

## Key views

| View | What it showed |
|---|---|
| z14 / z15 Wilkesboro sweep | Ruled out the town-centroid coordinate and located the industrial mass. |
| z17 core | The whole campus: process block, four trailer fields, the ~1,000-space employee lot, the shop row. |
| z18 northeast | Trailer yard fronting the highway behind privacy-slatted chain link; a service driveway break at 36.14489, -81.16116. |
| z18 mid / z19 north | The dock bank at 36.14478, -81.16166 with ~10 trailers backed in; more backed in on adjoining faces. |
| z18 south / z19 | Shop row, wash canopy, and the largest trailer field. |
| z18 west | The satellite trailer lot north of the highway, and the culverted creek (not rail) west of the plant. |
| SV `071J6kMt_DIEdPkY8ae89A` (2021-10) | **The gate.** Two barrier arms down, guard booth between them, stop sign, fence, barrels. |
| SV `Myol48zBuMyjp6SIV9QwWw` (2021-10) | Same gate from the employee-lot side: booth, arm, red swing gate, yield and stop signs, hostlers working behind. |
| SV `lxgqT2KVvIQ2EzNqqbIuMQ` / `OX_eZ3jRrLSUrF1n9CBAUg` (2024) | Continuous fenced frontage, Tyson and Prime trailers inside, a yard spotter working the fence line. |
| SV `GjpUr_P9jDd_LPY4mwumJQ` (2024-08) | The south fence, the Tyson sign, and a line of roughly 12 reefers backed into a dock across the yard. |

## Gate determination — TRUE

The clearest gate evidence in this pair of audits. At heading 326 from pano
`071J6kMt_DIEdPkY8ae89A` you see two red-and-white barrier arms in the lowered position
across two lanes, with a guard booth standing between them, chain-link fence running left
and right, and a stop sign facing the outbound lane. The same gate from the opposite side
(pano `Myol48zBuMyjp6SIV9QwWw`, heading 279) shows the booth, the arm, a red swing gate and
a yield sign, with dumpsters, hostlers and the plant behind. Located at 36.14258, -81.16186.

## Guard shack — TRUE

Small white booth with a flat canopy roof, windows on multiple faces, sited between the
inbound and outbound arms. Footprint measures roughly 5 m by 9 m at z20. Classic staffed
booth, so `remoteGs` is false.

## Docks — 50+ band, LOW-to-MEDIUM confidence on the count

Positively identified occupied dock positions:

- North face at 36.14478, -81.16166: about 10 trailers backed in, evenly spaced.
- Adjoining face south of it: about 5.
- Top of the same block: about 4.
- A line of roughly 12 reefers backed into a dock, seen from ground level in Street View
  looking north from the south fence.

That is about 31 confirmed positions with several faces hidden under canopies or behind
other buildings. On a 53-acre multi-building poultry campus with roughly 180 trailers on
the ground, the total door count is judged to exceed 50. `dockDoorCount: 55` is an
inference from campus scale, and it is flagged in `uncertainFields`. The defensible floor
is 31.

## Yard zones and counts

- **Perimeter** — 15-vertex ring around the contiguous campus southeast of the highway.
  **53.0 acres.** Flagged uncertain: the ring necessarily encloses public street
  rights-of-way, so Tyson-owned acreage is somewhat less.
- **Truck gate** — 22 m by 29 m quad over both lanes and the booth.
- **Staging (pre-gate)** — 45 m by 54 m paved plaza outside the arms. Street View shows it
  wide open, which is why `backupSensitive` is false at this gate.
- **Drop yards (4)** — northeast yard along the highway (~35 trailers, 2.0 ac), central
  yard (~35, 2.3 ac), south yard and shop area (~60, 4.0 ac), and the satellite lot north
  of the highway (~22, 2.8 ac, outside the perimeter ring).
- **Dock apron (1)** — 41 m by 23 m strip in front of the north dock bank.
- **Totals** — trailersVisible ~180, capacity ~250, buildings ~22, two truck gates (one
  guarded, one unguarded service driveway), no rail.

Notable: the yard carries mixed carriers. Tyson-branded trailers sit beside Prime and
produce reefers, so this is a live drop yard with third-party equipment dwelling on site,
not a captive fleet lot.

## Operating read for the sales conversation

Wilkesboro is the harder yard of this pair and the better story. It is a downtown campus:
public streets cut through it, the fence line sits on the sidewalk in places, and the
operation spills across the highway into a satellite trailer lot. Roughly 180 trailers are
parked in four separate fields that a guard at one booth cannot see. The gate itself is
already a two-arm manned checkpoint with a large paved plaza in front, which means the
physical infrastructure for gate automation and a fast lane is already poured. What is
missing is the layer that tells the guard which of the four fields a given trailer is in,
and which of the fields is across a public street.

## Confidence

**Medium overall.** Gate, guard shack and operator identity are high confidence, all
directly visible in recent Street View. Dock door count, scale presence, gate count,
trailer counts, acreage and backup-sensitivity are flagged in `uncertainFields`. The
multi-parcel layout is the main source of measurement error: any boundary drawn from
overhead imagery on a campus interleaved with public streets is an approximation.
