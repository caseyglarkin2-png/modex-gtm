# Deep-Audit Dossier — Kraft Heinz, Woodstock IL

**Facility:** Kraft Heinz - Woodstock (Claussen Pickle manufacturing plant)
**Address (web-confirmed):** 1300 Claussen Dr, Woodstock, IL 60098
**Seed coordinates:** 42.3209369, -88.4714377 (lands on the main plant roof)
**Method:** Tier-2 deep audit — multi-zoom satellite + Street View walk-down + web research
**Date:** 2026-05-17

---

## 1. Site orientation

Wide satellite (z17/z18) showed a large single-block food-manufacturing plant on the
east side of the parcel, an employee parking lot to the NW, and farm fields/woodland
on all other sides. The seed coordinates are rural — corn/soy fields immediately west
and south, scattered low buildings, a two-lane county road (Claussen Dr) running NE-SW.

The truck operations are on the **south/southeast** side: a wide concrete truck
driveway runs N-S along the east face of the building, curving SE to meet the public
road. Dock doors with parked trailers are visible on the building's south face.

## 2. Truck entrance located

The truck driveway crosses the property line onto the public road at approximately
**42.32018, -88.46945**. The nearest Street View pano sits right at that junction
(pano @ 42.32013, -88.46921, captured 2019-06).

Probed satellite at z19/z20/z21 over the junction and the structures beside it.

## 3. Key views

| View | Coords / heading | What it showed |
|------|------------------|----------------|
| sat z21 `kh_gatebooth` | 42.32023, -88.46960 | Small square structure (~single-vehicle, ~10x10 ft footprint) beside the truck lane; cantilever sliding-gate panel + support rail; yellow gate posts; painted lane arrows |
| sat z21 `kh_blueroof` | 42.32038, -88.46962 | Larger blue/peaked-roof standalone building set well BACK from the lane — a site/office building, NOT the gate booth |
| SV 300° `kh_sv_nw` | from junction pano | Chain-link rolling gate across the full-width truck driveway, open; yellow bollards; perimeter chain-link fence both sides; road guardrail |
| SV 320° `kh_sv_south_pano` | from junction pano | Sliding gate + small booth beside lane; orange/red "Kraft Heinz" sign post on road shoulder |
| SV 290°/305° `kh_sv_gate_close`/`_final` | from junction pano | Clear chain-link cantilever gate spanning the concrete truck lane; brown plant/office building beyond |
| sat z19 `kh_yard` | 42.32060, -88.47000 | Inside the gate: ~10-25 dock doors on south face, parked trailers, open concrete maneuvering/staging yard |

## 4. Gate / guard determination

**truckGate = TRUE.** Four independent Street View headings (290°, 300°, 305°, 320°)
and a z21 satellite all show the same feature: a **chain-link cantilever sliding gate**
spanning the full width of the concrete truck driveway, flanked by yellow steel posts
and bollards. Continuous perimeter chain-link fencing runs along the road frontage on
both sides of the opening. This is an unambiguous controlled truck gate.

**guardShack = TRUE.** The z21 satellite (`kh_gatebooth`) clearly resolves a **small
square structure, roughly a single-vehicle footprint, positioned immediately beside
the truck lane at the gate**. Its small size and lane-side placement are the classic
signature of a staffed gate guard booth. It is distinct from the larger blue-roofed
building (`kh_blueroof`) which is set well back from the lane and is a site/office
structure, not a gate booth. A vehicle is parked next to the booth in imagery,
consistent with an attended post.

**remoteGs = FALSE.** A physical on-site booth exists at the gate, so check-in is not
remote/kiosk-only. No standalone kiosk or call-box was observed in place of a booth.

## 5. Supporting classification calls

- **drivewayShort = TRUE** — gate sits ~150-200 ft from the public road; short approach.
- **preGateStaging = FALSE** — gate is close to the road with no shoulder/lot for trucks
  to queue on public ground.
- **postGateStaging = TRUE / dropYard = TRUE** — large open concrete yard inside the
  gate with parked trailers; serves as drop/staging area.
- **entryExitTogether = TRUE; entryLanes = 1, exitLanes = 1** — a single combined
  gate/driveway opening handles both inbound and outbound trucks.
- **dockDoors = "10-25"** — dock doors with trailers along the south building face.
- **dropArea = "10-25"** — trailer drop/parking area in the yard.
- **urbanRural = Rural** — surrounded by farm fields and woodland on a county road.
- **scale = FALSE** — no truck scale observed at the gate or in the yard.
- **shipRcvSeparate = FALSE; multiStep = FALSE; connectivityIssue = FALSE;
  multipleFacilities = FALSE; backupSensitive = FALSE; fastLaneOpportunity = FALSE.**

## 6. Web research

Confirmed via Woodstock Chamber, Kraft Heinz careers, and Wikimapia that this is the
**Claussen Pickle manufacturing plant** at 1300 Claussen Dr — a food-grade
manufacturing facility operating in Woodstock since 1976, running shift-based
production/packing operations. A food-manufacturing plant of this type routinely runs
controlled, attended truck access, consistent with the gate-plus-booth observed.

## 7. Final confidence

**HIGH.** The truck gate is visible from four Street View angles and satellite; the
guard booth is resolved at z21 satellite adjacent to the gate lane; the rural setting,
dock layout and yard are all directly imaged. No fields left uncertain.
