# Tyson Fresh Meats — Columbus Junction Pork Plant, Columbus Junction IA

**Resolved center:** 41.29565, -91.35625
**Roster coordinate:** 41.278636, -91.359877 (APPROXIMATE) — **wrong by ~2.3 km**
**Maps:** https://www.google.com/maps/@41.29565,-91.35625,400m/data=!3m1!1e3
**Confidence:** high
**Method:** deep-audit (satellite z14–z19 + Street View, 2024-09 panoramas)

---

## Step 0 — the coordinate was wrong, and by how much

The roster pin landed on the **town center of Columbus Junction**, not the
plant. A z14 pull showed the town, the Iowa River, and one large industrial
complex sitting roughly 2.3 km to the **north**, on the west bank of the river.
Converting that complex's pixel position gave 41.29622, -91.357295; refining
against z16/z17 put the plant center at **41.29565, -91.35625**.

The complex reads unambiguously as a large meat plant:

- a 600+ stall employee parking lot,
- roughly 260 refrigerated trailers in a dense drop yard,
- a full wastewater treatment train on the south-east — clarifiers plus four
  lagoons (green, dark, and a distinctly pink one, which is a meat-plant
  signature),
- a continuous 190 m dock wall on the north-east face,
- a separate shop/warehouse parcel with its own pond across the highway.

Web search was unavailable this session, so the operator was not confirmed
against a document. Given the type, size and location this is Tyson's
Columbus Junction pork plant with high practical confidence, but that
identification is imagery-inferred, not sourced.

---

## Gate determination — FALSE (open site)

Two access drives leave the state highway. **Neither is controlled.**

| Drive | Location | What Street View (2024-09) shows |
|---|---|---|
| Mid / main | 41.29693, -91.35775 | Wide open paved driveway east into the employee lot and on to the trailer yard. Chain-link fence along the frontage, ending at the drive opening. No arm, no gate, no booth. |
| South | 41.29477, -91.35845 | Open drive east-north-east toward the plant's west side. A tractor-trailer is caught pulling out. Perimeter fence with a gap flanked by two yellow bollards. No arm, no gate, no booth. |

I then walked the **internal** drive at z19 from the highway to the trailer
yard (`tmp/t08-drive-z19.png`) looking for a set-back checkpoint the way
Waterloo has one. There is nothing: no gatehouse, no booth, no scale, no
second stage. A tractor-trailer is visible mid-drive with clear pavement on
both sides.

The only nearby building is an office block set **~90 m south of the drive**
with its own car park — a plant office, not a lane-side gatehouse.

**Guard shack: FALSE.** **Remote check-in: FALSE** by rule (no gate).
This is a textbook archetype **#3 — No Gate / No GS**.

### One operational tell worth using in the conversation

Trailers are parked **on the public highway shoulder** along the west side of
the road (`tmp/t08-west-z18.png`, around 41.2972, -91.3592). Yard overflow is
spilling into the right of way. That is not a gate problem — it is a yard
capacity and dwell problem.

---

## What each key view showed

| View | File | What it established |
|---|---|---|
| z14 wide | `tmp/t08-z14.png` | Roster pin was the town; plant is 2.3 km north |
| z16 plant | `tmp/t08-plant-z16.png` | Whole complex, lagoons, highway frontage |
| z17 north / south | `tmp/t08-{n,s}-z17.png` | Employee lot, drop yard, plant core, wastewater train |
| z18 yard | `tmp/t08-yard-z18.png` | ~100 trailers in one 282 m frame; yard density |
| z19 NE dock | `tmp/t08-dock-z19.png` | 11 backed trailers over ~90 m of the main dock wall |
| z19 south | `tmp/t08-southdock-z19.png` | Big turnaround loop, tanker loading, water tower, clarifier |
| z19 entrances | `tmp/t08-gate{S,M}-z19.png` | Both drives open at the road |
| z19 internal drive | `tmp/t08-drive-z19.png` | **No checkpoint anywhere inside** |
| z18 west parcel | `tmp/t08-west-z18.png` | Shop/warehouse across the highway; **no rail**; shoulder-parked trailers |
| Street View | `tmp/t08-sv-{s72,s75,mid88,mid95,njct,nfront}.png` | Gate/booth absence confirmed at both drives |

---

## Docks, yard and counts

| Metric | Value | Basis |
|---|---|---|
| `dockDoorCount` | **45** (band `25-50`) | Primary dock wall runs ~190 m on a ~133° bearing from 41.29655,-91.35670 to 41.29539,-91.35505. A z19 sample gave 11 backed trailers across ~90 m at ~5.5–6 m centres → ~32 positions on the main face, plus doors on the white building's east face and around the south loop. **Sits near the 25-50 / 50+ boundary; flagged uncertain.** |
| `trailersVisible` | **260** | ~100 counted in a single 282 m z18 frame, plus the north and south blocks and highway-shoulder overflow. |
| `trailerParkingCapacity` | **320** | The yard is already close to full in the imagery, so headroom is genuinely limited. Modest uplift on the observed count, not a large one. |
| `truckGateCount` | **2** | Two uncontrolled access drives off the highway, both carrying truck traffic. |
| `buildingCount` | **12** | Main plant, large white building, wastewater plant, west-of-highway shop parcel, outbuildings. |
| `siteAreaAcres` | **66.2** | Computed from the perimeter ring. Excludes the west-of-highway parcel. |
| `railServed` | **false** | No spur, siding or right of way anywhere on or adjacent to the property. Checked the west parcel, the north field access and the full perimeter. |

`dropArea` is `50+` — three large drop blocks plus a long nose-to-tail column
on the east edge of the yard.

`shipRcvSeparate` is **false, flagged uncertain**. One continuous dock bank
dominates the north-east face. The south side is a large paved turnaround
with tanker and utility loading rather than a second dock cluster; the white
building's east face shows a possible second door line that could not be
confirmed.

`scale` is **false** — no weigh deck was identified at either entrance or
anywhere on site.

---

## Geofence notes

**The plant is not square to north** — the main building and its dock wall sit
at roughly **33° off east-west**. The dock apron is therefore traced as a
rotated quad parallel to that wall, not an axis-aligned box. The three drop
yards are traced on the yard's own grid.

`staging` is left **null** deliberately. `postGateStaging` is recorded true
because a very large paved yard clearly holds trucks before the doors, but
with no gate there is no discrete pre or post zone to draw — the whole yard is
undifferentiated holding. Drawing a box would have implied a control point
that does not exist.

The perimeter follows the state highway on the west, the timber and river
bottom on the east, the north gravel overflow parking at ~41.2990, and the
south edge of the lagoons at ~41.2915. The blue-roof shop/warehouse parcel
across the highway is **excluded** from the ring and noted separately.

Street View coverage is good along the highway (both perimeter and entrance
views from the 2024-09 drive) and **absent inside the fence** — Google never
drove the plant roads.

---

## Web findings

None. The session's web-search budget was exhausted before this audit and no
specific URL was worth a targeted fetch. Everything above is read from
imagery; operator identification carries that caveat.

---

## Final call

**Gate: no.** **Guard shack: no.** **Confidence: high** on the gate and guard
shack absence (confirmed from the road at both entrances *and* along the
internal drive), on the location, on the drop yard, on the absence of rail,
and on the perimeter. Medium on dock-door count, trailer capacity, and ship
versus receive separation.

Archetype **#3 — No Gate / No GS**. A very large open plant with 260 trailers,
no check-in of any kind, and overflow already parked on the public shoulder.
Every arriving driver is guessing. There is nothing to bypass and nothing to
speed up at the gate, because there is no gate — the whole check-in layer is
missing, which makes this a greenfield for a digital arrival process rather
than a gate-automation retrofit.
