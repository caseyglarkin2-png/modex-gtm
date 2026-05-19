# Deep-Audit Dossier — Glovis America Port Vehicle Processing, Newark/Elizabeth NJ

**Roster idx:** 14
**Account:** Hyundai Motor America
**Facility type:** Port / Vehicle Import Processing Center (RoRo auto terminal)
**Roster address:** E Bay Ave, Elizabeth, NJ 07201
**Resolved facility:** Port Newark Auto Terminal, 325 Distribution St, Newark, NJ 07114
**Locked center:** 40.694000, -74.134000
**Method:** deep-audit · **Confidence:** medium

## Step 0 — Location confirmation
The roster geocode was flagged GEOMETRIC_CENTER (lower precision). A z15 probe at
the roster point (40.672346, -74.149854 / "E Bay Ave, Elizabeth") landed inside
the APM/Maher CONTAINER terminal on the Elizabeth side — a container terminal,
not an auto-processing facility, so the roster point is wrong for this facility.
Web research resolved the correct site: Glovis America's listed Newark
vehicle-processing operation corresponds to the Port Newark Auto Terminal. Moran
Shipping and Ports America sources confirm Port Newark's RoRo/auto terminal
serves Hyundai Glovis and that FAPS Inc. processes Hyundai/Kia vehicles there.
Decisive evidence: Street View at the terminal entrance shows a "PORTS AMERICA —
Port Newark Auto Terminal, 325 Distribution St, Newark, New Jersey 07114" sign.
The locked center was relocated to the Port Newark Auto Terminal core at
40.6940, -74.1340.

## Key views
- **z13 context** — the facility sits in the dense Port Newark/Elizabeth marine
  terminal complex in the Newark metro core.
- **z15/z17 terminal probes** — a peninsula-tip auto terminal: multiple large
  PDI/processing buildings (white/blue roofs) surrounded by vast vehicle-storage
  lots packed with finished vehicles in marked rows; a wharf on the west side
  (Newark Bay channel); the Newark Bay (I-78) bridge crosses to the east.
- **z16 north probe** — multiple parallel rail tracks run along the terminal's
  north edge; the auto storage continues north toward the gate.
- **Street View (2019-07) at the gate** — a sliding chain-link gate with
  reflective markers spans the truck entrance; a low windowed guard / terminal-
  office building sits immediately beside the gate under the Ports America sign;
  rail tracks cross the access road ("DO NOT STOP ON TRACKS" sign).

## Gate / guard-shack / dock determinations
- **Truck gate:** TRUE — clearly confirmed in Street View: a sliding chain-link
  gate across the truck entrance off Distribution St.
- **Guard shack:** TRUE — a low windowed guard/terminal-office building sits
  directly beside the gate at 325 Distribution St.
- **Backup-sensitive:** TRUE — the gate is at a rail-crossed intersection in a
  dense urban port with limited stacking room; a truck queue would foul the rail
  crossing or the port road.
- **Multi-step:** TRUE (best estimate, flagged uncertain) — secured port auto
  terminals typically run a gate check plus internal yard/processor checkpoints.
- **Dock doors:** NONE — a RoRo auto terminal has no loading docks; vehicles roll
  on/off ships at the wharf and move by drive-away and rail.

## Yard zones and counts
- **Perimeter:** ~270 acres covering the secured Port Newark Auto Terminal
  (SW 40.6885,-74.1405 → NE 40.7010,-74.1270; irregular peninsula footprint).
- **Drop yards:** two large vehicle-marshaling blocks — the southern peninsula
  storage and the north gate-adjacent storage — holding tens of thousands of
  finished vehicles in dense marked rows.
- **Truck gate:** boxed at the Distribution St entrance.
- **Staging:** apron area inside the gate before the storage/processing zones.
- **Buildings:** ~7 PDI/processing structures plus terminal-office and wharf
  infrastructure — multiple-facilities campus.
- **Rail-served:** TRUE — auto-rack rail tracks at the gate crossing and along
  the north edge.
- **dropArea band:** 50+.

## Web findings
- glovisusa.com lists Newark (E Bay Ave, Elizabeth NJ) among Glovis America
  locations.
- Moran Shipping: Port Newark RoRo terminal provides terminal receiving, storage
  and stevedoring to NYK, Sallaum Lines and Hyundai Glovis for vehicle shipments.
- Ports America operates the Port Newark Auto Terminal (325 Distribution St) —
  confirmed by the on-site sign in Street View.
- FAPS Inc. (371 Craneway St, Port Newark) processes Hyundai (Korea) and Kia
  (Korea) accounts.
- Note: Glovis later opened the Southport Auto Terminal & VPC in Philadelphia,
  shifting some Northeast volume, but maintains a Newark/Elizabeth presence.

## Final confidence
**Medium.** The correct facility was positively re-identified (the roster geocode
was wrong), and the truck gate, guard shack, RoRo type, rail service, urban port
setting, and vast vehicle marshaling are all clearly established — the gate and
guard booth are directly visible in Street View. Exact entry/exit lane counts,
the presence of a truck scale, and the precise internal multi-stage checkpoint
sequence could not be fully confirmed and are flagged as uncertain.
