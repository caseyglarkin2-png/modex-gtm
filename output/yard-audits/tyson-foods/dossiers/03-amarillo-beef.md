# Tyson Fresh Meats — Amarillo Beef Plant, Amarillo TX (idx 03)

**Resolved center:** 35.2593, -101.6488
**Address:** 5000 FM 1912, Amarillo, TX 79108
**Maps:** https://www.google.com/maps/@35.2593,-101.6488,400m/data=!3m1!1e3
**Method:** deep-audit (satellite + Street View). Confidence: **medium**.

---

## Step 0 — pinning the site

The roster coordinate (35.206982, -101.832007, precision APPROXIMATE) was city-level
Amarillo, roughly 17 km WSW of the plant. Google Places API (New) `searchText` for
"Tyson Fresh Meats beef plant Amarillo Texas" returned three establishments:

- **Tyson Foods** — 5000 FM1912, Amarillo TX 79108 @ 35.2583166, -101.6496981
- **Tyson Forward Whse** — same address @ 35.2580593, -101.649715
- **Amarillo Tyson OTR (Truck Entrance)** — 16325 E St Francis Ave @ 35.2651671, -101.6475004

A hybrid static map at z14 confirmed the setting: the plant sits north of I-40 / US-60
(historic Route 66) and east of N Farm to Market Rd 1912, with E St Francis Ave running
along the north side. Satellite at z15 and z16 showed the complete industrial complex —
process plant, curved livestock pens, two large trailer yards, ~1,400 stalls of employee
parking and a wastewater lagoon. Site center re-pinned to **35.2593, -101.6488**.

Verification note: the session WebSearch budget was exhausted, so the Step -1 web gate
was waived per run instruction. The evidence stack is a Tyson establishment record, a
second Tyson establishment record, a Tyson-named OTR truck-entrance POI on the adjoining
public road, and a February 2026 Street View frame showing a live over-the-road tractor
leaving the property. Verdict: **confirmed**.

---

## What each view showed

**z15 / z16 overview (`tmp/t03-z15.png`, `t03-z16.png`).** The complex occupies a section
block bounded by FM 1912 (west), E St Francis Ave (north) and the I-40 / BNSF corridor
(south-east). Process plant in the centre-south, drop yards north and east, employee
parking west, curved cattle crowd pens on the south end, lagoon to the east.

**Entrance from the public road (`t03-gate-z17.png`, `t03-gate-z19.png`).** Two drives
leave E St Francis Ave 50 m apart: a narrow west drive at -101.64804 serving the employee
lots, and a wide concrete truck drive at -101.64748. Neither has a gate, arm or booth at
the road.

**Street View at the entrance (`t03-sv-ent-180.png`, `t03-sv-ent-200.png`).** Pano
`rBGNuy8PhrCB7mXmNuz-zg` @ 35.265401, -101.647484, captured **2026-02** — 15 m inside the
truck drive. Looking south: wide concrete, a northbound tractor-trailer leaving, a small
sign board on the west shoulder, and the plant with its trailer rows visible 500 m ahead.
**No barrier, no booth, no fence line at the road.** This is the only pano anywhere on the
property; every zone centroid returns ZERO_RESULTS.

**The checkpoint (`t03-north-z18.png`, `t03-guard-z20.png`, `t03-guard-z21.png`).** 330 m
south of the road, at **35.26256, -101.64757**, the drive reaches a plaza. A building
measuring roughly **21.5 m x 10 m** (with a 9 m northward shadow, so a real single-storey
structure) sits in the middle of the pavement with a truck lane on each side. A
tractor-trailer stands at the east lane. Alongside that lane runs a pale deck about
**1.7 m x 21.6 m** — the classic overhead signature of a truck scale.

**Dock faces (`t03-yard-z18.png`, `t03-edock-z19.png`, `t03-edock-z20.png`,
`t03-sdock-z19.png`).** Four banks:
- Plant **east wall**, 35.26130 → 35.25985: ~160 m of continuous dock, 17–18 trailers
  backed in at capture.
- **North face** near 35.26130, -101.6492: ~80 m, 11 trailers backed in.
- **South warehouse south face**, -101.6474 → -101.6452: ~200 m of door rhythm, trailers
  and rail cars alongside.
- **West building north face**: a further ~90 m of docked trailers.

**Drop yards (`t03-yardA-z18.png`, `t03-yardB-z18.png`).** North paved yard 3.6 acres,
four rows, ~55 trailers. East yard 14.8 acres of graded surface, angled rows, ~145
trailers and only about a third occupied.

**Rail (`t03-rail-z18.png`, `t03-south-z17.png`).** A spur curves in from the BNSF / US-60
corridor at the south-east, runs along the south warehouse wall, and carries a long
standing string of rail cars from 35.2556 to 35.2564. Additional cars are spotted on a
siding at 35.2564, -101.6466. **Rail served: yes, substantially.**

**Livestock side (`t03-s-z17.png`).** A radial crowd-pen fan at roughly 35.2565, -101.6489
on the south end — live-cattle receiving, physically separate from boxed-beef shipping.

---

## Determinations

| Field | Call | Evidence |
|---|---|---|
| **truckGate** | **true** | Not at the road — at the checkpoint plaza 330 m in (35.26256, -101.64757): a building astride the pavement with a lane each side, a truck standing at the scaled east lane. A clear pinch-point with control structure. |
| **guardShack** | **true** (medium) | The checkpoint building is 21.5 m x 10 m — larger than a classic 1–3-stall booth, but it is not the main plant (500 m south) and not an office block; it sits in the truck path with vehicles queued at its end. Flagged. |
| **remoteGs** | **false** | By rule — a staffed checkpoint building is present. |
| **scale** | **true** (medium) | 1.7 m x 21.6 m pale deck in the inbound lane beside the checkpoint, tractor-trailer standing on it. Not independently confirmed at this resolution. |
| **dockDoors** | **50+** | >500 m of dock frontage across four banks; ~45–55 trailers docked simultaneously in one capture. Point estimate 95 doors. |
| **dropArea** | **50+** | ~200 trailers standing across 18.4 acres of drop yard. |
| **preGateStaging** | **true** | 330 m of full-width private concrete plus a wide apron at the public road, before any control point. |
| **fastLaneOpportunity** | **true** | Three-plus lanes of concrete at the road, unused paved width both sides of the checkpoint, 330 m of private corridor. Room to build a bypass without acquiring land. |
| **backupSensitive** | **false** | Rural section-line road, a third of a kilometre of stacking inside the property line. |
| **urbanRural** | **Rural** | Section-line roads and farm fields on all four sides; Amarillo's dense fabric is 12 km west. |

**Yard metrics:** 95 dock doors (est.) · 300 trailers visible · 450 trailer capacity ·
1 truck gate · 12 buildings · **152.2 acres** · rail served.

---

## Why medium and not high

Satellite is native and clean to about z19 and the site geometry is unambiguous. Two
things hold the confidence down:

1. **Only one Street View pano exists on the property**, and it is 330 m short of the
   checkpoint. The gate, guard-shack and scale calls therefore rest on z20/z21 satellite,
   where z21 is visibly upsampled. The checkpoint building's *function* (staffed gate/scale
   house vs. a maintenance or dispatch office) is inferred from its position astride the
   truck lane, not read from signage.
2. **Trailer counts and dock-door totals are overhead estimates**, calibrated on a measured
   4.4–5.0 m row pitch. Treat them as ±15 percent.

The no-gate-at-the-road finding, the 330 m private approach and the checkpoint's location
are all high confidence.

---

## The sales read

This is the opposite of a constrained yard. Amarillo has a third of a kilometre of private
concrete before its only control point, two drop yards with real headroom, and a scale
already in the inbound lane. The friction here is not queueing onto a public road — it is
that a single checkpoint 330 m from the road controls a 152-acre campus with four dock
banks, two truck populations (live cattle south, boxed beef east and south), rail on the
property, and roughly 300 trailers standing at any moment. That is a yard where nobody at
the gate knows where a trailer actually is.
