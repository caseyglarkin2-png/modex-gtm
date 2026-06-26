# Deep-Audit Dossier — idx 31 · Kroger Layton Dairy (Dairy Plant)

**Address:** 500 N Sugar Street, Layton, UT 84041
**Resolved center:** 41.06410, -111.98350
**Maps:** https://www.google.com/maps/@41.06410,-111.98350,400m/data=!3m1!1e3
**Confidence:** high

## Step 0 — Building confirmation
The 500 N Sugar Street site is a single fenced **multi-building Kroger campus** holding three
distinct operations:
- **Smith's Layton Distribution Center** — the huge solar-roofed building to the north (~41.066);
- **Kroger Layton Dairy** — the central/west processing block (this audit); and
- **Layton Bakery / cold-storage** — the grey-roofed warehouse to the SW (~41.0628).

The **dairy** was positively identified, not the DC or bakery, by:
- A **bulk milk/cream silo cluster and process-tank farm** (round vertical white tanks + pressure
  vessels) visible at z20 on the dairy block roof and junction (~41.0642, -111.9831);
- Heavy **process piping** running across the roofs between buildings (CIP / refrigerated process
  lines), and dense rooftop refrigeration/HVAC;
- The **"Smith's" red-logo office front** on N Sugar Street (Street View pano `M7U59CyNhNNICpz2su66pA`,
  captured 2022-11), with a red box-truck and reefer (Shaffer) staging on the frontage;
- The Dairy Foods plant directory listing **"Kroger Layton Dairy"** at this address.

## Key views
- **z16/z17 overview** — mapped the campus: DC (N), dairy (center/W), bakery (SW), and vast trailer
  drop yards filling the center and east.
- **z18 dairy block** — the dairy office/west wing + green courtyard fronting Sugar St, the main
  process block east of it, and the tanker/dock courtyard.
- **z20 tank farm (`31-NW-z20`)** — confirmed the silo/tank cluster = dairy.
- **z20 internal checkpoint (`31-booth-z20`, `31-mid-z19`)** — a small staffed booth mid-yard with
  yellow channelized lane striping and a tractor stopped at it.
- **Street View (Sugar St, 2022-11)** — continuous **chain-link perimeter fence** along the west
  frontage; the "Smith's" branded office entrance; reefer trailers (Shaffer) curbside.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Fenced campus accessed from N Sugar Street (west) feeding an **internal manned
  checkpoint** at ~41.0651, -111.9853, with channelizing lane markings funneling tractors single-file
  between the office/parking apron and the inner dock/tanker yard.
- **guardShack = true.** The mid-yard booth is a ~1-vehicle-footprint structure beside the controlled
  lane with a tractor queued at it (z20). `remoteGs = false`.
- **Docks ≈ 22 (band 10-25).** Dock and **tanker loadout bays** on the south/east faces of the dairy
  process block plus a covered tanker courtyard. Low-confidence exact count — much loadout is
  canopy-covered tanker bays, not standard dry-van doors (flagged uncertain).
- **dropYard = true / dropArea 10-25.** The dairy stages reefers/empties in its south-east yard rows;
  the broader campus holds hundreds of trailers.

## Yard zones & counts
- **perimeter** — 5-vertex ring tracing the dairy building + west office frontage (Sugar St) and its
  south/east operating yard; ≈ **21 acres** (the full shared parcel is larger).
- **truckGate** — quad over the office/west Sugar St access apron (driver's-eye = pano
  `M7U59CyNhNNICpz2su66pA`, heading 90°).
- **dockApron** — one quad along the south/east dairy loadout face.
- **streetViewMeta** — perimeter + truckGate use the Sugar St office pano (only ground coverage; the
  internal checkpoint has no Street View). Metrics: ~22 doors, ~30 trailers visible, ~60 capacity,
  1 gate, 1 building (dairy block), 21 acres, no rail.

## Web findings
- Dairy Foods directory: **Kroger Layton Dairy**, 500 N Sugar St — dairy-based product production.
- Smith's Layton Distribution Center and Layton Bakery (Bread/Cake/Frozen Dough) share the same
  address — confirming the multi-facility campus.

## Final
**Gate verdict:** truckGate TRUE — fenced campus + manned internal checkpoint with channelized lanes.
**Guard-shack verdict:** guardShack TRUE — mid-yard booth with tractor queued at it.
**Confidence:** high (dock-door exact count, scale, exit-lane count, multiStep flagged uncertain).
