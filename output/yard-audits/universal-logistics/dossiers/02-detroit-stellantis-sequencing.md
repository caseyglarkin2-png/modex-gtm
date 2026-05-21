# Deep-Audit Dossier — idx 2

## Logistics Insight Corp — Stellantis Sequencing Plant, Detroit MI (Georgia St)

**Address:** 6836 Georgia St, Detroit, MI 48211
**Resolved center:** 42.391100, -83.031200
**Type:** Parts Sequencing / Sub-Assembly Plant
**Confidence:** Medium

---

### Location confirmation

The roster coordinate (with a 226 m geocoder offset noted) sits on a very large
warehouse/industrial campus on Detroit's east side. Web research (Crain's
Detroit Business, MoparInsiders, DBusiness) confirms the identity: a
~1,000,000 sq ft Universal Logistics / Logistics Insight Corp parts-sequencing
and sub-assembly plant at 6836 Georgia St that sequences/sub-assembles ~114
components for Jeep Grand Cherokees built at the Stellantis Mack Avenue
assembly plant. The building was nearly doubled in size by Crown Enterprises
(Moroun-family). 2023 Street View along Georgia St shows the fenced perimeter
with Universal/ULC-, MidStates Express-, Landstar- and XTRA-branded trailers
parked behind it — consistent with a Universal-operated automotive logistics
campus. Positively identified.

**Important status note:** the facility was WARN-noticed for closure beginning
February 2025 (~677 layoffs), with reporting that Stellantis was moving the
sequencing work to a lower-cost non-union operator. Operational status as of
2026 is uncertain — the physical-layout audit below stands regardless.

### Key views

- **Wide satellite (z16):** A multi-parcel campus — one dominant ~1M sq ft
  building plus an older secondary building cluster to the west and several
  satellite trailer-storage yards.
- **South face (z19-20):** A dense, continuous loading-dock bank with trailers
  backed in along the full length, fronting an apron and a fenced trailer line
  along Georgia St.
- **North face (z18-20):** A second dense dock bank with trailers backed in —
  the building is a true cross-dock with docks on both long faces.
- **NW/west (z18):** Multiple gravel/paved trailer drop yards full of parked
  trailers; the older secondary building cluster.
- **Street View (Georgia St, 2023):** Continuous chain-link perimeter fence the
  full length of the south frontage, with rows of parked trailers behind it.

### Gate / guard-shack determination

- **truckGate = true.** The whole campus is fully fenced (confirmed by 2023
  Street View along Georgia St and at the SE/SW corners). Truck access through
  the fence is controlled. No barrier arm resolves cleanly in imagery, but a
  fenced JIT auto-sequencing plant has a controlled gate by definition.
- **truckGateCount = 2 (estimated).** Two probable gate openings — a SW-corner
  access near the rail crossing and a north internal-road junction.
- **guardShack = false / remoteGs = true.** No staffed-booth structure
  resolvable at any gate. For a JIT sequencing plant, access is most plausibly
  badge / kiosk controlled. Flagged low-confidence.
- **entryExitSeparate = true.** Distinct access points on different sides of
  the campus.
- **multiStep = false.** No second checkpoint stage visible.

### Yard zones and counts

- **Perimeter:** ~58 acres for the main fenced operation including the
  immediate trailer yards.
- **Dock doors:** dense banks on both north and south long faces of the main
  building → estimated ~150+ → 50+ band. Inbound parts vs. outbound sequenced
  modules run from physically separate dock banks → shipRcvSeparate = true.
- **Drop yards:** several large trailer-storage yards across the campus (NW
  gravel lots and an SE drop lot), holding well over 100 trailers → dropArea
  50+, dropYard = true.
- **Staging / driveway:** large internal yard area between the gates and the
  dock faces holds long truck queues → postGateStaging = true, drivewayLong =
  true.
- **backupSensitive = true:** the campus is hemmed by public streets and an
  adjacent residential neighborhood on the south; a gate queue would spill onto
  public streets with little stacking room.
- **multipleFacilities = true:** multi-parcel campus — main ~1M sq ft building
  + older secondary building + distinct satellite trailer yards.
- **Rail:** a rail line runs along the west edge with old/abandoned spurs but
  no live spur into the building → railServed = false.

### Web findings

Crain's Detroit / MoparInsiders / DBusiness: ~1M sq ft building, ~114
components sequenced for Jeep Grand Cherokee at the Stellantis Mack Ave plant;
Crown Enterprises nearly doubled it; Universal Logistics hired 400+ to staff it
(Teamsters Local 299). WARN closure notice filed for Feb 2025.

### Final confidence

**Medium** — building and operator positively confirmed, layout clear from
strong imagery and Street View. Confidence held at medium because exact gate
positions/lane counts and the guard-shack determination cannot be pinned from
imagery, and because the facility's operational status is uncertain following
the 2025 WARN closure notice (flagged in uncertainFields and fieldNotes).
