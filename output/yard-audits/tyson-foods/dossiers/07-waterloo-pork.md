# Tyson Fresh Meats — Waterloo Pork Plant, Waterloo IA

**Resolved center:** 42.5093, -92.2610
**Roster coordinate:** 42.508843, -92.260476 (ROOFTOP) — landed inside the plant, no correction needed
**Maps:** https://www.google.com/maps/@42.5093,-92.261,400m/data=!3m1!1e3
**Confidence:** high
**Method:** deep-audit (satellite z14–z21 + Street View, 2026-04 panorama)

---

## How the site was confirmed

The roster geocode was already rooftop-precision and a z15 pull put it inside a
very large protein-processing complex on the south-east edge of Waterloo. Wider
z16 and quadrant z17 pulls confirmed the signature of a major pork plant: a
multi-wing process building, a 1,000+ stall employee lot, several hundred
refrigerated trailers in herringbone drop yards, live rail service, and
wastewater lagoons immediately south of the property.

One trap was checked and cleared. The lot directly north-west of the plant
(42.5119, -92.2625) holds hundreds of small green units in tight rows. At z19
those resolve as **John Deere agricultural equipment on a dealer lot**, not
Tyson trailers. It is excluded from the perimeter.

Web search was unavailable this session, so the operator was not confirmed
against a document. Everything below is read from imagery. Given the size,
type and location this is Tyson's Waterloo pork plant with high practical
confidence, but that identification is imagery-inferred, not sourced.

---

## What each key view showed

| View | File | What it established |
|---|---|---|
| z15 wide | `tmp/t07-z15.png` | Plant sits at a rural crossroads, fields on three sides |
| z16 perimeter | `tmp/t07-perim-z16.png` | Full property in one frame; rail on the NW diagonal, county roads E and S |
| z17 quadrants | `tmp/t07-{nw,ne,sw,se}-z17.png` | Employee lot, drop yards, rail arc, and the dealer lot to exclude |
| z18 docks | `tmp/t07-docks-z18.png` | North-facing dock bank with trailers backed in |
| z19 dock detail | `tmp/t07-dockE-z19.png` | Bay rhythm along the north wall, ~5–6 m spacing |
| z18 south-west core | `tmp/t07-swcore-z18.png` | **Rail cars parked on an in-property spur**; ~111 trailers in one frame |
| z19/z20/z21 gate | `tmp/t07-drive-z19.png`, `t07-shack-z20.png`, `t07-shack-z21.png` | Gatehouse footprint ~8 m × 11 m north of the drive |
| Street View 2026-04 | `tmp/t07-sv-gate272.png`, `t07-sv-drivezoom.png` | **The decisive frame** — checkpoint, booth, gatehouse, fence, barriers |

---

## Gate determination — TRUE

The truck drive leaves the north-south county road at **42.51042, -92.25883**
and runs roughly 90 m west before reaching a checkpoint. The April 2026
Street View panorama (`YQMIK99AN6cbsOUlyXHwhQ`) at heading 272° shows, in
order down the lane:

- jersey barriers channelling the left (south) side of the approach,
- a **booth/kiosk with a canopy standing in the lane**, with a person and a
  parked car beside it,
- chain-link perimeter fence running along the south side of the drive with
  trailers behind it,
- the plant's inner yard and dock lanes beyond.

This is a controlled entry, not an open industrial driveway. There is **no
barrier at the property line** — the control point sits ~90 m inside, which is
what creates the pre-gate apron below.

## Guard shack determination — TRUE

A **concrete-block gatehouse** sits on the north side of the drive at roughly
**42.51052, -92.25979**. Satellite at z20/z21 gives it an ~8 m × 11 m
footprint. Street View at heading 278° shows a railed roof deck, a windsock,
a rooftop HVAC unit, a personnel door, and a wall-mounted bank of red and
green regulatory sign boards facing arriving drivers. A person is visible
standing at the lane-side booth. Staffed, therefore `remoteGs` is **false**.

## Staging and queue behaviour

- **Pre-gate:** ~90 m of Tyson-owned paved apron between the public road and
  the checkpoint. Holds roughly 4–5 tractor-trailers nose to tail and is wide
  enough to stack two abreast. `preGateStaging: true`.
- **Post-gate:** very large paved yard between the checkpoint and the dock
  aprons. `postGateStaging: true`, `drivewayLong: true`.
- **Backup sensitivity:** set **false**. The apron plus the wide entrance
  flare absorb a normal queue and the road it meets is a low-volume rural
  two-lane. This is a judgement call — a queue past ~5 trucks would still
  reach the county road.
- **Fast lane:** `true`. There is substantial unused paved width on both sides
  of the checkpoint; an express/bypass lane could be striped without new
  pavement.

---

## Docks, yard and counts

| Metric | Value | Basis |
|---|---|---|
| `dockDoorCount` | **60** (band `50+`) | ~250 m of continuous north-facing dock wall at ~5–6 m bay spacing (measured on a 92 m z19 sample showing ~16 bay positions), plus west-building and distribution-building faces. **Estimate, medium confidence.** |
| `trailersVisible` | **250** | ~111 counted in the south-west z18 frame alone; extrapolated across all captured tiles. |
| `trailerParkingCapacity` | **400** | ~16 acres of traced drop-yard pavement at ~25–30 trailers/acre including aisles. Approximate. |
| `truckGateCount` | **1** | Single controlled truck entrance on the east road. A separate access off the south road serves the employee lot. |
| `buildingCount` | **14** | Main process complex, large white distribution building south-west, long support buildings west, outbuildings. |
| `siteAreaAcres` | **84.4** | Computed from the perimeter ring; fenced operational yard only. |
| `railServed` | **true** | Rail cars visible parked on a spur running east-west through the property south of the plant (42.5083, -92.2646, z18). Mainline runs the north-west boundary; a second spur arcs around the east. |

`dropArea` is `50+` — three distinct drop yards: herringbone rows along the
rail on the north-west, a fan-shaped yard west of the employee lot, and a row
north of the plant.

`shipRcvSeparate` is **true** but flagged uncertain: the finished-product dock
bank runs the plant's north face while raw/live receiving plus rendering and
utilities occupy the west and south-west with their own drives. Two physically
distinct dock clusters are clear; which is which is inferred, not read.

`scale` is reported **false**. No weigh deck could be positively identified.
A small rectangular pad next to the gatehouse at z21 is more consistent with
the building footprint than a scale platform. A plant of this size very likely
has one, but it is not visible, so it is not claimed.

---

## Geofence notes

The plant is square to the section grid, so the dock apron and truck-gate
quads are correctly axis-aligned — that is the real orientation of the
structures, not a north-box default. The two north-west drop yards **are**
rotated: they follow the rail corridor on a roughly 20° bearing, and their
rings are traced on that angle. The perimeter follows the rail on the
north-west, the county road on the east, the county road on the south, and
the field edge on the west, with a notch cut out of the south-west where the
property does not extend past the employee lot.

Street View coverage exists on both the east county road (perimeter view) and
at the entrance junction (truck gate and staging), all from the same 2026-04
capture at the gate.

---

## Web findings

None. The session's web-search budget was exhausted before this audit, and no
specific URL was worth a targeted fetch. All findings above are from imagery.
Operator identification carries that caveat.

---

## Final call

**Gate: yes.** **Guard shack: yes, staffed.** **Confidence: high** on the
gate, guard shack, rail, drop yards and perimeter; medium on dock-door count,
trailer capacity, lane counts, ship/receive separation, and the absence of a
scale.

This is a classic archetype-#1-plus site: a guarded gate set 90 m back from a
rural county road, one lane in and one out, an enormous drop yard, and enough
paved width at the checkpoint to add a bypass lane. The yard, not the gate, is
where the time is going.
