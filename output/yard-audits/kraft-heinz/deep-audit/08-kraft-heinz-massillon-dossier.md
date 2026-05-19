# Deep-Audit Dossier — Kraft Heinz, Massillon OH

**Facility:** Kraft Heinz - Massillon (frozen-food manufacturing plant)
**Address:** 1301 Oberlin Ave SW, Massillon, OH 44647
**Probe seed coordinates:** 40.7789509, -81.5408231
**Method:** Tier-2 deep audit — satellite (z16–z21) + Street View (multiple panos/headings) + web research
**Date:** 2026-05-17

---

## 1. Site orientation

The seed coordinate lands on the rooftop of a large, single-mass frozen-food
manufacturing plant. The property layout, established from z16–z18 satellite:

- **Plant building:** large gray/dark warehouse-plus-process complex, center of site.
- **Public road:** Oberlin Ave SW runs NW–SE along the northwest side of the
  property, fronted by a deep wooded buffer (no entrance through that frontage).
- **Trailer drop yard:** large paved lot on the SW side, full of parked
  trailers in marked, numbered stalls (stall markings "13A", "17A" visible).
- **Dock wall:** dock doors face into the yard on the east face of the white
  warehouse; trailers observed backed in.
- **Entrance:** a single truck driveway off Oberlin Ave SW at the SW corner of
  the property, at a signalized intersection.

Neighboring industrial buildings to the south and southeast (separate private
road, "national conifers" tenant, an industrial park) were ruled out as
belonging to a different owner — not Kraft Heinz.

## 2. Locating the truck entrance

- z19–z21 satellite of the NW (Oberlin Ave) frontage (`kh-nwdrive`,
  `kh-driveconnect`, `kh-nwgap`): solid tree buffer, **no break** — entrance
  is NOT on the NW frontage.
- Street View revealed two pano clusters: one **inside the trailer yard**
  (~40.77863, -81.54412) and one at the **public signalized intersection**
  (~40.77912, -81.54504). The Google car drove from the public road through
  the entrance into the yard — confirming the entrance throat between them.
- Entrance throat located at approximately **40.7789, -81.5447**, off
  Oberlin Ave SW.

## 3. Key views and what they showed

| View | Coords / heading | What it showed |
|------|------------------|----------------|
| `kh-sv-throat-s` | 40.77865, -81.54470 @ 160° | **Wide chain-link rolling/cantilever gate** across the truck lane, rolled open. Small yellow bollard + sign panel beside it. **No guard booth.** |
| `kh-sv-gatepost2` | 40.77864, -81.54458 @ 200° | Clearest gate view: chain-link slide gate on perimeter chain-link fence, open. Yellow bollard + small sign at the gate. No structure. |
| `kh-sv-throat-ne` | 40.77865, -81.54470 @ 60° | Chain-link perimeter fence with multiple "private property / no trespassing" signs running the property line. |
| `kh-sv-swint-s` | 40.77863, -81.54412 @ 180° | Brown privacy-slat chain-link fence along the south perimeter of the drop yard. |
| `kh-sv-swint-n` | 40.77863, -81.54412 @ 0° | Drop yard: rows of trailers in numbered stalls (Walmart 53', Thermo King reefers). |
| `kh-sv-yard-dock` / `-dock2` | 40.77863, -81.54400 @ 70°/110° | Yard interior: drop trailers, employee car parking along south fence, plant building with dock doors / trailers backed in on the east face. |
| `kh-sv-gate-s` | 40.77931, -81.54477 @ 200° | Facility road frontage: chain-link fence, lawn with **three flagpoles** (US/Ohio flags), landscaped rock bed, a red property sign at the driveway. |

## 4. Gate / guard determination

### truckGate = TRUE
A wide **chain-link rolling/cantilever gate** sits across the single truck lane
at the property entrance, mounted on a continuous chain-link perimeter fence
(brown privacy slats on the south run). Multiple "private property" signs on
the fence. The gate was rolled open in all captures (2024-05 and 2024-07), but
the gate hardware is unambiguous. This is a physically gated, fenced facility.

### guardShack = FALSE
No guard booth, kiosk-cabin, or any small occupiable structure exists at or
near the entrance. Examined from 4+ headings across two capture dates — the
entrance throat shows only the chain-link gate, a yellow bollard, and a sign
panel. There is no 1–3-vehicle-footprint building with windows, no booth set
beside the lane. The plant's offices are inside the main building, well back
from the gate.

### remoteGs = TRUE
The facility is gated and fenced but has **no manned guard structure at the
gate**. A small post/bollard with a sign panel sits immediately inside the
gate — consistent with a self-service / call-box / posted-instruction
check-in point rather than a staffed booth. A TruckMap driver review notes
"security was excellent in explaining every step," indicating a security
check-in process exists, but it is conducted away from the gate (at the
shipping/receiving office inside) — not at a gatehouse. This is the classic
**gate-without-guard (remote guard shack)** configuration: a controlled gate
with no booth, driver self-checks at the gate and proceeds to the building.

## 5. Other classification notes

- **Driveway:** SHORT — the gate sits close to Oberlin Ave SW; trucks turn
  directly off the road, through the gate, into the yard. Minimal pre-gate
  apron, so `preGateStaging` = false; the large yard provides `postGateStaging`.
- **Entry/exit:** a single shared gate opening — `entryExitTogether` = true,
  1 entry lane / 1 exit lane. Not enough lane separation for a fast lane.
- **Drop yard:** YES — large paved lot with numbered trailer stalls and many
  parked drop trailers (`dropArea` 50+ trailer capacity).
- **Dock doors:** dock wall on the east face of the warehouse with multiple
  trailers backed in; large frozen-food plant (~370 employees, $28M expansion).
  Estimated 25-50 doors — flagged as the one uncertain field (satellite is
  rooftop-obscured; doors face into the yard).
- **Ship/receive:** appears combined through the same yard and dock wall — no
  evidence of physically separated ship vs. receive gates/yards.
- **Setting:** Urban — within the city of Massillon, residential housing
  directly across Oberlin Ave SW, signalized intersection at the entrance.
- **Backup-sensitive:** No — the yard is a large open paved maneuvering area;
  not a tight backing situation despite one TruckMap mention of a "tight
  entrance" (refers to the turn off the road, not in-yard backing).
- **Connectivity:** Urban location, no terrain/remote issues — false.
- **Multiple facilities / multi-step / scale:** none observed.

## 6. Web research

- 1301 Oberlin Ave SW, Massillon OH 44647 — Kraft Heinz frozen-food plant
  (Smart Ones, Smart Made, Devour, TGI Fridays, Crave). ~370 employees,
  UFCW Local 17A. Operates 24 hours. $28M expansion announced 2013.
- USDA/FDA/ODA inspected; two on-site federal USDA inspectors.
- Listed on TruckMap as a shipper with dock loading; driver reviews mention
  detention/check-in steps and "security ... explaining every step,"
  confirming an active but office-based (not gatehouse) check-in process.

## 7. Final confidence

**HIGH.** The gate and guard determination rests on direct, repeated Street
View imagery of the entrance throat from multiple headings and two capture
dates. The only field carrying residual uncertainty is the exact dock-door
count (rooftop parapets obscure a precise satellite count); the 25-50 bucket
is a well-supported estimate for a plant of this size.

---

### truckGate / guardShack / remoteGs verdict
- **truckGate: TRUE** — wide chain-link rolling gate across the truck lane on a fenced perimeter.
- **guardShack: FALSE** — no guard booth or occupiable structure at the entrance, confirmed from 4+ headings / 2 dates.
- **remoteGs: TRUE** — gated and fenced but unmanned at the gate; sign/bollard self-check-in, security handled at the office inside.
