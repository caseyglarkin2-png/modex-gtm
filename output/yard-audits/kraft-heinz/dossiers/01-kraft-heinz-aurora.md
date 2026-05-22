# Kraft Heinz - Aurora, IL (Cold Storage)

**Site:** 1203 Bilter Rd, Aurora, IL 60502
**Center:** 41.78305, -88.37315
**Maps:** https://www.google.com/maps/@41.78305,-88.37315,400m/data=!3m1!1e3
**Archetype:** #1 - Gate + Guard Shack (matches Jake's Kraft baseline calibration)
**Confidence:** HIGH

---

## Location lock

The supplied coordinates (41.7831644, -88.3732467) sit on a large white
industrial building immediately north of Bilter Rd in Aurora, IL. Web research
(HSA Commercial case study, Manta business listing, Yellow Pages, Edan,
Krusinski Construction project page) confirms this is the Kraft Foods /
Heinz cold-storage portion of the larger Aurora Distribution Center campus
on the north side of Bilter Rd between Church Rd and IL-59. The wider
campus also includes a separate, larger industrial building further north
(across a man-made retention pond) which appears to be a different
tenant/parcel of the multi-tenant DC. The Kraft yard audited here is the
**south building only**.

A second, separate Kraft cold-storage facility exists in Aurora at 1700 N
Edgelawn Dr - that is **not** this site. The Bilter Rd address is the one
referenced by the supplied coordinates and the calibration baseline at
`scripts/yard-audit/classify-prompt.md`.

## Imagery captured

| Image | Purpose |
| --- | --- |
| `tmp/probe-aurora-z16.png` | Wide context - shows both buildings and surrounding pond / road network |
| `tmp/probe-aurora-z17.png` | Frames the whole Kraft south building + drop yard |
| `tmp/probe-aurora-z18.png` | Overhead of south building; dock face + drop yard rows |
| `tmp/probe-aurora-z19.png` | Tighter check on building outline |
| `tmp/probe-aurora-sw-z19.png` | West dock cluster + drop yard rows |
| `tmp/probe-aurora-south-z20.png` | Trailer stalls in the drop yard - dense parking |
| `tmp/probe-aurora-se-entrance-z19.png` | THE money shot - truck gate apron with guard booth structure visible |
| `tmp/probe-aurora-gate-z21.png` | Max zoom: dark rectangular guard-booth footprint on the entry pad |
| `tmp/probe-aurora-guard-z21.png` | Confirms isolated ~3-4m booth-sized structure on the pavement |
| `tmp/probe-aurora-eastside-z19.png` | East face = office front, visitor parking, separate visitor entry |
| `tmp/probe-aurora-north-z18.png`, `tmp/probe-aurora-twoblds-z17.png`, `tmp/probe-aurora-far-north-z18.png` | Confirms the larger northern building is a separate parcel across the pond |
| `tmp/probe-aurora-sv-n.png`, `tmp/probe-aurora-sv-ne.png` | Street View pano (2018) sits ON the truck pad facing the office face |
| `tmp/probe-aurora-sv-road-n.png` | Public-ROW Street View (2024) on Bilter Rd - dock face screened behind landscaped berm |
| `tmp/probe-aurora-sv-bilter-mid-n.png`, `tmp/probe-aurora-sv-bilter-w-e.png` | Bilter Rd context - 4-lane divided road with wide grass median |

## Layout

- **Building** (single, south parcel): ~280m E-W by ~90m N-S, footprint
  ~25-28k m² (~270-300k sf). Dock face runs along the entire south wall.
- **Truck approach**: paved driveway opens onto Bilter Rd at the SE corner.
  Approach is ~150m straight from gate to dock apron.
- **Drop yard**: large drop-trailer yard occupies the south side of the
  parcel between the dock apron and the south property line, parallel rows
  of stalls (~70+ trailers visible at imagery capture, ~90 capacity).
- **Office**: east face is the office / visitor entry with a small visitor
  parking lot - separate from the truck operation.

## Gate / guard-shack determination

- **truckGate = true**: SE-corner driveway is a single controlled pinch
  point with a guard structure in the middle of the apron; satellite z21
  clearly shows the entry geometry funnels through a single lane group.
- **guardShack = true**: z21 satellite captures a small dark rectangular
  structure (~3-4m on a side, distinct from the main building) sitting on
  the pavement at the entry. Footprint and placement are characteristic of
  a staffed booth; the on-site 2018 Street View pano confirms the truck pad
  is the gate apron.
- **remoteGs = false** by definition (guardShack is true).
- Matches Jake's calibration baseline: Aurora is the named **#1 Gate+GS**
  reference site - this audit validates rather than overrides that call.

## Yard metrics

| Metric | Value |
| --- | --- |
| dockDoorCount | 30 |
| trailersVisible | 70 |
| trailerParkingCapacity | 90 |
| truckGateCount | 1 |
| buildingCount | 1 (Kraft south parcel; campus neighbor across the pond is a different tenant) |
| siteAreaAcres | 9.4 (from perimeter bbox; ~206m N-S x ~184m E-W) |
| railServed | false (rail line passes north of the campus but no spur enters the Kraft parcel) |

## Classification highlights

- `dockDoors: "25-50"` (30 counted)
- `dropArea: "50+"` (dense rows of ~70 trailers, capacity ~90)
- `drivewayLong: true` (150m gate-to-dock approach)
- `entryExitTogether: true` (single SE gate handles both directions)
- `preGateStaging: true` + `postGateStaging: true` (wide apron before the
  booth, plus large paved holding area inside)
- `fastLaneOpportunity: false` (gate already configured as a single-lane
  pinch with the booth in the centre - bypass would require relocating it)
- `urbanRural: "Urban"` (inside Aurora/Naperville metro fabric on the
  I-88 / Bilter Rd corridor)
- `multipleFacilities: false` (Kraft parcel is one building; neighbouring
  larger building is a separate tenant)
- `shipRcvSeparate: false`, `scale: false`, `multiStep: false`,
  `connectivityIssue: false`, `backupSensitive: false`

## Web research notes

- **HSA Commercial** lists the Aurora Distribution Center (1203/1207 Bilter
  Rd) as a 25.2-acre multi-tenant campus with Phase I (294,673 sf) and
  Phase II (124,897 sf) buildings - the south Kraft building lines up with
  one of these phases.
- **Krusinski Construction** documents a Kraft Heinz ASRS (automated
  storage / retrieval) cold-storage build for Kraft in the area; the Bilter
  building is consistent with a cold-storage temperature-controlled DC.
- **Supply Chain Dive / Food Dive** report Kraft Heinz is also building a
  separate $400M automated DC in DeKalb, IL - **not** this site.
- **Manta** and Yellow Pages both list Kraft Heinz Foods Company at the
  Bilter Rd coordinates, confirming Kraft tenancy.

## Sources

- [Aurora Distribution Center 1203/1207 Bilter Rd - HSA Commercial](https://www.hsacommercial.com/case_study/aurora-distribution-center-1203-1207-bilter-road/)
- [Kraft Foods Cold Storage - Claycorp project page](https://claycorp.com/project/kraft-foods-cold-storage)
- [Kraft Heinz ASRS Distribution Center - Krusinski Construction](https://www.krusinski.com/our-work/kraft-heinz-asrs-distribution-center/)
- [Kraft Heinz Foods Company Aurora IL - Manta](https://www.manta.com/c/mhknhfj/heinz-kraft-foods-company)
- [Kraft Heinz to build $400M automated DC in Illinois - Supply Chain Dive](https://www.supplychaindive.com/news/kraft-heinz-facility-400-million-automation-robotics-facility/688252/)

## Final verdict

| Check | Verdict |
| --- | --- |
| Truck gate | **YES** - single controlled SE entry |
| Guard shack | **YES** - small booth on the entry apron (z21) |
| Confidence | **HIGH** |

Archetype: **#1 Gate + GS** (matches Jake's baseline). Two fields kept in
`uncertainFields` for lane counts (`entryLanes`, `exitLanes`) because lane
striping inside the gate apron is not crisp at z21.
