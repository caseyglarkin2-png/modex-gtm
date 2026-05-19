# Deep-Audit Dossier — Kraft Heinz, Aurora IL

**Facility:** Kraft Heinz - Aurora (1700 N Edgelawn Dr, Aurora, IL 60506)
**Seed coordinates:** 41.7831644, -88.3732467
**Method:** Tier-2 deep audit — satellite + Street View imagery + web research
**Final confidence:** HIGH

---

## 1. Site layout (satellite)

- Probed satellite at z16/z17/z18 (centered ~41.782, -88.3725) and z19-z21 across all four corners.
- Large single-building distribution/cold-storage warehouse. Building runs roughly E-W; dock doors line the **south face** of the building; an extensive trailer yard with many rows of parked/drop trailers fills the south and southeast apron.
- West side: tree-lined landscaped buffer against a north-south arterial — no truck crossing.
- East side: bounded by a retention lake.
- The truck yard is served by a single **access driveway** that runs from a signalized intersection on the public arterial (~41.7808, -88.3718) **north** ~150 m to a gated throat where it enters the trailer yard (~41.7817, -88.3719).

## 2. The gate — coordinates probed

Guard booth / gate throat located at approx **41.78175, -88.3720**.

Street View panos used (all from the access driveway / gate apron, 2018-2024 captures):

| Pano @ | Heading | What it showed |
|---|---|---|
| 41.78171, -88.37183 | 270° W | **Guard booth** — single-story structure, red roof + red awning, multi-side windows; guard's car parked beside it; a semi-trailer pulled up alongside being processed; chain-link perimeter fence to the left. |
| 41.78171, -88.37183 | 315° NW | Close-up of the booth — tractor-trailer stopped at the booth, guard vehicle present, chain-link fence with trailers parked behind it. |
| 41.78171, -88.37183 | 300° WNW | Best gate view — booth with red roof/awning, truck checking in, fenced trailer yard behind. |
| 41.78171, -88.37183 | 0° N / 180° S | North = office building + employee parking; South = access driveway running straight to the signalized public-road intersection, chain-link fence on the right. |
| 41.78130, -88.37178 | 0° N | Looking up the driveway — booth visible in distance at the yard throat; chain-link fence along driveway. |
| 41.78160, -88.37178 | 200° S | **Reefer truck queued ON the access driveway south of the gate** — pre-gate staging in action; signalized intersection visible beyond. |
| 41.78076, -88.37177 | 0° N | The public-road intersection — long driveway runs north to the facility, guard booth visible at the far end. (2024 imagery, conditions unchanged.) |

## 3. Gate determination

**truckGate = TRUE.** A controlled truck checkpoint exists at the throat where the access driveway enters the trailer yard. Evidence: a staffed booth that every truck must pass, chain-link perimeter fencing defining the yard, and a tractor-trailer captured stopped at the booth being processed. Web research independently confirms a named **"EXEL / KRAFT TRUCK GATE"** at this site (Exel = DHL Supply Chain, the 3PL that runs the gate/yard).

**guardShack = TRUE.** Unambiguous. Street View from four headings shows a small single-story booth with a red roof and red awning, windows on multiple sides, and a guard's vehicle parked at it — a textbook one-vehicle-footprint guard shack. It is occupied/operational (truck actively being checked in alongside it).

**remoteGs = FALSE.** The booth is physically staffed (guard vehicle present, truck being processed at the window). No kiosk, call box, or unmanned check-in terminal — this is a manned gate, not remote check-in.

Note: no boom/barrier arm was visible in Street View; control is enforced by the manned booth and the fenced single-throat entry. Booth captures are 2018; 2024 imagery shows the layout unchanged.

## 4. Other classification notes

- **Long driveway + pre-gate staging:** ~150 m driveway from the public arterial to the gate; Street View shows a reefer truck queued on it south of the gate. drivewayLong = TRUE, preGateStaging = TRUE.
- **Entry/exit together:** Single gate throat handles both directions — one entry lane, one exit lane. entryExitTogether = TRUE.
- **Dock doors:** Web research (ClayCorp project page) states the Aurora facility has ~88 dock doors; satellite confirms an extensive dock line on the south face. dockDoors = "50+".
- **Drop yard / drop area:** Satellite shows dozens of rows of parked drop trailers across the south and SE apron — a true drop yard. dropYard = TRUE, dropArea = "50+".
- **Urban:** Site sits in a developed office/industrial park with adjacent retail, offices, and residential. urbanRural = "Urban".
- **Single facility, no scale, no multi-step:** One building, one gate; no truck scale visible; no separate ship/receive gates.

## 5. Web research findings

- Kraft Foods/Kraft Heinz operates an ~864,873 sq ft single-level distribution facility at 1700 N Edgelawn Dr, Aurora — dry storage plus air-conditioned/cold space, ~88 dock doors, distributes Kraft/Nabisco dry and packaged goods. (ClayCorp project page; D&B.)
- An explicitly named **"EXEL / KRAFT TRUCK GATE"** is listed at 1669 Bowman Dr, Aurora IL 60506 — confirming a dedicated, staffed truck gate operated by Exel (DHL Supply Chain). (Loc8NearMe; Chamber of Commerce directory.)
- TruckMap lists the site for driver routing under 1700 N Edgelawn Dr — consistent with active inbound/outbound trucking and gate check-in.

## 6. Final verdict

- **Truck gate:** YES — staffed checkpoint at the fenced yard throat; independently confirmed as a named "Exel/Kraft Truck Gate."
- **Guard shack:** YES — red-roofed manned booth, multi-side windows, guard vehicle, truck processed alongside.
- **Confidence:** HIGH — corroborated by satellite, multi-angle Street View, and web research.
