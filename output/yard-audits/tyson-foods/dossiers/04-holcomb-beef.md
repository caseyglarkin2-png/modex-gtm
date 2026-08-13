# Tyson Fresh Meats — Holcomb Beef Plant, Holcomb KS (idx 04)

**Resolved center:** 37.9986, -101.0256
**Address:** 3105 N IBP Rd, Holcomb, KS 67851
**Maps:** https://www.google.com/maps/@37.9986,-101.0256,400m/data=!3m1!1e3
**Method:** deep-audit (satellite + Street View). Confidence: **medium**.

---

## Step 0 — pinning the site

The roster coordinate (37.998443, -101.023048, precision ROOFTOP) was already accurate —
it lands inside the complex, on the east side near the employee lots. Google Geocoding
resolved "Tyson Fresh Meats Holcomb KS" to **3105 I B P Rd, Holcomb, KS 67851 @
37.9984432, -101.023048 (ROOFTOP)**, and Places API (New) returned a single establishment
"Tyson Fresh Meats" at the same point. The road name preserves the plant's IBP origin.

Hybrid maps at z14/z15/z16 fixed the setting: the plant sits in a block bounded by
**US-50 / US-400** to the north, the **Farmers Ditch** road on the north-west, **N IBP Rd**
on the south, and the Arkansas River rail corridor beyond that. Centre-pivot irrigated
fields on every side. Site center re-pinned to the middle of the operating footprint at
**37.9986, -101.0256**.

Verification note: the session WebSearch budget was exhausted, so the Step -1 web gate was
waived per run instruction. Evidence stack: ROOFTOP geocoder hit + Places establishment
record + IBP-derived road name + physical signature (radial cattle crowd-pen fan with
livestock pots queued to unload, single very large process complex, rail spur with cars
spotted, ~1,800 employee stalls, ~300-trailer drop yard) + a 2024-06 Street View run along
N IBP Rd showing the fenced yard full of trailers. Verdict: **confirmed**.

---

## What each view showed

**z16 overview + hybrid (`tmp/t04-z16.png`, `t04-hybrid-z16.png`, `t04-hybrid-z15.png`).**
Process complex in the north half, the radial cattle-pen fan on the west end, ~1,800 stalls
of employee parking on the east, a dense trailer drop yard across the south, and two
wastewater lagoons on a separate parcel south of N IBP Rd.

**The truck entrance (`t04-ent-w-z18.png`, `t04-gate-z20.png`).** The main truck drive
leaves N IBP Rd at **37.99645, -101.02339** as a wide unmarked concrete drive running due
north between the fenced trailer yard (west) and the employee lots (east). A second curb
cut 180 m east serves the parking lots. Nothing structural sits in either truck path.

**Street View (`t04-sv-ent-0.png`, `t04-sv-ent-330.png`, `t04-sv-w340.png`).** Pano
`Y3WycGULUrhpxL-XsPuF1w` @ 37.99645, -101.023388, captured **2024-06**, standing in the
entrance mouth. Looking north and north-west: chain-link perimeter fence, trailers standing
behind it, plant buildings 400 m ahead, and a completely open concrete drive. **No barrier
arm. No sliding gate. No guard booth. No lane markings. No pinch-point.** A third pano
0.5 km west shows open field between N IBP Rd and the plant — no other south-side entry.

**The internal corridor (`t04-drive-z19.png`).** North of the entrance the drive runs
~350 m between the drop yard and the employee lots. Tractors and trailers are visibly
staged along both shoulders at 37.9970–37.9978. That corridor is the de facto holding area.

**Drop yard (`t04-yard-z18.png`).** One very large yard, **10.5 acres**, four packed
east-west rows at a measured **5.0 m pitch** (calibrated on the z20 crop at the south
fence), roughly 250–280 trailers standing. Close to full in this capture.

**Dock faces (`t04-dockzone-z18.png`, `t04-dock2-z19.png`).** Four banks:
- Cold-storage / shipping warehouse **west wall**, 37.99835 → 37.99774: ~68 m, 9 trailers
  backed in → est. 17 doors.
- Second building **east face** near 37.99832, -101.02492: ~35 m, 5 trailers → est. 9 doors.
- **North building face**, 37.99924 → 37.99882: ~47 m, 5–6 trailers → est. 12 doors.
- A short fourth face near 37.99880, -101.02440 → est. 6 doors.

**Cattle receiving (`t04-west-z18.png`, `t04-cattle-z20.png`).** A radial crowd-pen fan on
the west end at roughly 37.9998, -101.0282, with **livestock pots queued nose-to-tail** on
the approach. Beside the pens: a rectangular pad about **11 m x 23 m** in the cattle-truck
path with a **14 m x 10 m** building next to it — the standard scale-plus-scale-house
signature. Cattle trucks reach this from a separate west approach off Farmers Ditch, not
from N IBP Rd.

**Rail (`t04-rail-z19.png`).** Multiple sidings run east-west through the west and
south-west of the plant at roughly 37.9979–37.9981, -101.0262 to -101.0272, with boxcars,
gondolas and tank cars spotted on them. **Rail served: yes.**

---

## Determinations

| Field | Call | Evidence |
|---|---|---|
| **truckGate** | **false** | Street View from two headings plus z18 and z20 satellite: an open, unbarriered concrete drive at the property line, and nothing structural in the truck path for the next 350 m. Fenced perimeter, uncontrolled entry. This is the best-evidenced call in the audit. |
| **guardShack** | **false** | No booth-scale structure at the entrance, along the drive, or at the second curb cut. The nearest building is a 19 m x 31 m office block set 200 m inside, on the employee side. |
| **remoteGs** | **false** | By rule — remoteGs requires a gate to exist. |
| **scale** | **true** (medium) | 11 m x 23 m pad in the cattle-truck path at 37.99978, -101.02830 with a small building beside it. Livestock side only; no freight-side scale found. |
| **dockDoors** | **25-50** | Four banks, ~44 doors estimated. Near the top of the band — could cross 50 if faces on the plant's north and west sides carry doors not resolvable here. Flagged. |
| **dropArea** | **50+** | ~250–280 trailers standing in a 10.5-acre yard. |
| **preGateStaging** | **false** | No gate to stage before. Physically the road shoulder and entrance flare are wide. |
| **postGateStaging** | **true** | The 350 m internal corridor, with trucks visibly staged on both shoulders. |
| **fastLaneOpportunity** | **true** | Large unused paved width at the mouth plus 350 m of empty private corridor — room to install a gate, a scale and a bypass lane without touching the public road or losing trailer stalls. |
| **shipRcvSeparate** | **true** | Cattle receiving on the west end (separate approach road), boxed-beef shipping 400 m east off the warehouse's west wall. |
| **urbanRural** | **Rural** | Centre-pivot fields on every side, Arkansas River bottom to the south, Holcomb 4 km west, Garden City 10 km east. |

**Yard metrics:** 44 dock doors (est.) · 300 trailers visible · 380 trailer capacity ·
2 truck gates (freight south, livestock west) · 10 buildings · **97.7 acres** · rail served.

---

## Why medium and not high

The access-control calls here are strong — Street View covers the whole south frontage at
2024-06 and shows the entrance unambiguously. What holds the confidence at medium:

1. **Dock-door count sits right on the 25-50 / 50+ band edge.** 44 is the honest point
   estimate from four measured banks, but the plant's north and west faces could not be
   resolved well enough to rule out doors there.
2. **Trailer counts are overhead estimates** at a measured 5.0 m row pitch; ±15 percent.
3. **The scale call is livestock-side only**, read from a pad-plus-building signature at
   z20, not confirmed.
4. Street View has **no coverage inside the property** — every zone centroid except the
   entrance returns ZERO_RESULTS.

---

## The sales read

Holcomb is the cleanest "no gate, no guard shack" profile in the Tyson set. A trailer yard
holding ~300 units and a plant running two separate truck populations are fed by a single
uncontrolled concrete drive off a rural road, with 350 m of empty private corridor behind
it where drivers park on the shoulder and wait. Nothing at the property line records who
arrived, when, or with what. And the physical room to fix it is already paved: the gate,
the scale and the bypass lane could all go in that corridor without buying an acre or
giving up a trailer stall.
