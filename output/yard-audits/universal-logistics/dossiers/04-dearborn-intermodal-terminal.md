# Deep-Audit Dossier — idx 4

## Universal Intermodal Services — Dearborn Terminal, Dearborn MI

**Address:** 4440 Wyoming Ave, Dearborn, MI 48126
**Resolved center:** 42.321600, -83.154800
**Type:** Intermodal / Drayage Terminal (owned)
**Confidence:** Medium

---

### Location confirmation

The roster coordinate (with a 64 m geocoder offset noted) landed on a small
red-roofed office building on the west side of Wyoming Ave. Web research
(loadmatch.com directory; Universal Intermodal service-locations page; D&B)
confirms Universal Intermodal Services operates a drayage/intermodal terminal
at 4440 Wyoming Ave (St), Dearborn — a 10-K named owned terminal property.
2025 Street View shows a "Universal"-branded sign at the entrance to the large
fenced container/chassis yard on the EAST side of Wyoming Ave — that fenced
yard is the operational terminal. Universal Intermodal describes these as
"secure container yards coupled with maintenance and repair facilities."
Positively identified.

### Key views

- **Wide satellite (z16-17):** A dense intermodal/drayage district along
  Wyoming Ave; the Universal terminal is the fenced container yard east of
  Wyoming with a long maintenance/repair building.
- **Container yard (z18):** Rows of stacked ocean/domestic containers in a
  gravel lot, plus extensive chassis and trailer parking.
- **Maintenance building (z18):** A long NW–SE building with chassis/trailers
  around it — the container M&R facility.
- **Street View (Wyoming Ave, 2025):** A "Universal" sign at the entrance; the
  yard behind a chain-link fence with wide controlled driveway/sliding-gate
  openings; trucks and containers staged inside.

### Gate / guard-shack determination

- **truckGate = true.** The yard is fully fenced (chain-link along the Wyoming
  Ave frontage, confirmed in Street View) with wide controlled driveway
  openings / sliding gates and a Universal-branded sign at the entrance. Truck
  access is gated. ~2 gate openings estimated along the frontage.
- **guardShack = false / remoteGs = true.** No standalone guard booth resolves
  at the gate openings in imagery or Street View. Drayage/container yards of
  this type typically run a gate-clerk kiosk / OCR portal rather than a manned
  shack. Flagged low-confidence.
- **dockDoors = NONE.** This is an intermodal CONTAINER YARD — it stores and
  stages containers/chassis and has an M&R building, not a dock-door warehouse.
- **multiStep = false.** No clearly separate second checkpoint resolved.

### Yard zones and counts

- **Perimeter:** ~41 acres for the fenced Universal terminal parcel (the
  surrounding corridor holds other operators' yards and is excluded).
- **Drop yards:** the whole site is effectively a drop yard — hundreds of
  containers, chassis and trailers parked across multiple gravel/paved
  sub-yards → dropArea 50+, dropYard = true.
- **Buildings:** ~3 — a long maintenance/repair building, an office, and
  ancillary structures → multipleFacilities = true.
- **Staging / driveway:** large open apron inside the gate for queuing →
  postGateStaging = true, drivewayLong = true.
- **fastLaneOpportunity = true:** very large open yard apron and wide gate
  openings leave ample room for an express/bypass lane.
- **scale:** none clearly resolved — left false, flagged uncertain.
- **Rail:** an active rail line runs through the district to the south, but no
  spur is visible entering this drayage yard (drayage terminals truck
  containers to/from separate rail ramps) → railServed = false, flagged
  uncertain.

### Web findings

loadmatch.com / Universal Intermodal: Universal Intermodal Services runs a
national network of intermodal drayage terminals; the Dearborn terminal at
4440 Wyoming is a customs-bonded, C-TPAT certified operation with secure
container yards plus maintenance and repair / container storage. ULH 2025 10-K
lists Dearborn as an owned terminal property.

### Final confidence

**Medium** — facility and operator positively confirmed (Universal sign at the
gate, loadmatch directory, 10-K). Confidence held at medium because, as a
multi-operator intermodal corridor, the exact Universal-parcel boundary, the
presence/absence of a scale and rail spur, the gate-control structure and lane
counts cannot be pinned precisely from imagery — all flagged in uncertainFields.
