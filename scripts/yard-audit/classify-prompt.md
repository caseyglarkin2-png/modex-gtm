# Yard Classification Prompt — Phase 0.3

The literal instruction used to classify one facility's yard from overhead
satellite imagery. Feed it the imagery + facility metadata; it returns the
`Classification` object consumed by `lib.ts` / `generate-csv.ts`.

The model classifies **flags only** — it does NOT pick an archetype. `#1`–`#10`
is derived afterward by `assignArchetype()` in `lib.ts`.

---

## PROMPT

You are auditing a freight / distribution yard from overhead **satellite**
imagery for a yard-management (YardFlow) sales engagement. Your job is to read
the physical layout of the truck yard and report a structured classification.

### Inputs you receive

- **Facility metadata:** name, city, state, facility type.
- **1–4 satellite images** of this one facility:
  1. **Overview** — the facility fills ~60% of the frame.
  2. *(if provided)* **Gate / entry** close-up.
  3. *(if provided)* **Dock area** close-up.
  4. *(if provided)* **Trailer / drop-yard** close-up.

Reason only from what is visible. If imagery is unclear, say so via
`confidence` and `uncertainFields` rather than guessing confidently.

### What to look for — field rubric

Truck-side only. Ignore employee parking, retail/customer entrances, rail.

- **truckGate** (bool) — A controlled truck entrance: barrier arm, sliding/swing
  gate across the truck drive, or a clear checkpoint pinch-point with lane
  markings where the property meets the public road. An open driveway with no
  control = false.
- **guardShack** (bool) — A small staffed booth at the truck entrance (≈1–3
  parking-spaces footprint, windows on multiple sides, set beside the gate).
  Not the main building.
- **remoteGs** (bool) — true only when there **is** a truck gate but **no**
  guard shack (implying kiosk / call-box / app check-in). If `guardShack` is
  true, this is false. If there is no gate, this is false.
- **preGateStaging** (bool) — A paved area **outside / before** the gate where
  trucks can wait (truck-sized stalls or an apron between public road and gate).
- **postGateStaging** (bool) — A paved holding/queue area **inside** the gate
  but **before** the dock doors.
- **drivewayLong** (bool) — The gate→dock approach can hold a queue of **3+**
  trucks (long / deep).
- **drivewayShort** (bool) — The approach holds only **1–2** trucks. Usually
  mutually exclusive with `drivewayLong`; pick the better fit.
- **backupSensitive** (bool) — Tight entry geometry: a truck queue at the gate
  would spill onto a public road, block an intersection, or choke an internal
  artery. Gate close to a busy road with little stacking room.
- **entryExitTogether** (bool) — Trucks enter and exit through the same gate /
  lane group at one point of the property line.
- **entryExitSeparate** (bool) — Distinct in-gate and out-gate at different
  points. Mutually exclusive with `entryExitTogether`.
- **entryLanes** (int | null) — Count of inbound lanes at the truck gate.
  `null` if not determinable.
- **exitLanes** (int | null) — Count of outbound lanes. `null` if unknown.
- **fastLaneOpportunity** (bool) — Physical room to add a bypass / express lane:
  unused paved width, a wide gate apron, or already 3+ lanes.
- **dockDoors** ("0-10" | "10-25" | "25-50" | "50+" | "NONE") — Count loading
  dock doors across all building faces (regular rhythm of bays, dock levelers,
  trailers backed in). Report the band.
- **dropArea** ("0-10" | "10-25" | "25-50" | "50+" | "NONE") — Count marked
  trailer-parking stalls holding trailers **without** a tractor. Band, or
  "NONE".
- **shipRcvSeparate** (bool) — Shipping and receiving run from physically
  separate dock clusters (two distinct dock banks on different building faces).
- **urbanRural** ("Urban" | "Rural") — Is the facility inside a major metro
  area's dense fabric (**Urban**), or in a small town, edge-of-town, farmland,
  or open country (**Rural**)? Some adjacent development is normal at any
  industrial site — judge the broader setting, not the nearest building. When
  torn between "small-town industrial" and Urban, choose **Rural**.
- **connectivityIssue** (bool) — *Inferred.* true if the site is rural **and**
  isolated (far from any town, no nearby development) so cellular coverage is
  likely weak. Medium-confidence at best — list it in `uncertainFields`.
- **multipleFacilities** (bool) — More than one large building cluster on the
  same property — a campus.
- **scale** (bool) — A truck scale / weigh platform: a distinct rectangular pad
  in the truck path, often with a small scale house beside it.
- **dropYard** (bool) — A dedicated trailer-storage lot (adjacent or on-site,
  full of parked trailers), separate from active dock staging.
- **multiStep** (bool) — true **only** if imagery clearly shows a *second*
  checkpoint stage after the gate (e.g. gate, then a separate scale house or
  second booth before the docks). Default false; leave false if unsure.

### Output — return exactly this JSON, nothing else

```json
{
  "classification": {
    "truckGate": true, "guardShack": true, "remoteGs": false,
    "preGateStaging": false, "postGateStaging": true,
    "drivewayLong": true, "drivewayShort": false,
    "backupSensitive": false,
    "entryExitTogether": true, "entryExitSeparate": false,
    "entryLanes": 1, "exitLanes": 1,
    "fastLaneOpportunity": false,
    "dockDoors": "10-25", "dropArea": "0-10",
    "shipRcvSeparate": false,
    "urbanRural": "Rural", "connectivityIssue": false,
    "multipleFacilities": false, "scale": false, "dropYard": false,
    "multiStep": false
  },
  "confidence": "high",
  "uncertainFields": [],
  "fieldNotes": { "guardShack": "small booth just inside the gate arm" }
}
```

- `confidence`: **high** = imagery clear, facility unambiguous, most fields
  confident. **medium** = imagery adequate but some fields inferred, or moderate
  resolution / cloud issues. **low** = poor imagery, facility hard to identify,
  or many fields uncertain — flags the site for human review.
- `uncertainFields`: list every field you were not confident about.
- `fieldNotes`: short evidence note for any non-obvious or borderline call.

---

## Reference examples (Jake's Kraft baseline)

Three contrasting archetypes — pull them up to calibrate your eye.

### `#3` — No Gate / No GS — Kraft Heinz, Holland MI · `42.7835562, -86.128213`
Open site. `truckGate: false`, `guardShack: false`. The driveway runs straight
from the public road to the dock doors with no checkpoint structure.

### `#1` — Gate + GS — Kraft Heinz, Aurora IL · `41.7831644, -88.3732467`
Standard guarded entry. `truckGate: true`, `guardShack: true`, and **no** other
distinguishing flag (no campus, scale, separate ship/rcv, or fast-lane room).

### `#7` — Gate + GS + Fast Lane — Kraft Heinz, Garland TX · `32.9079075, -96.6636842`
Guarded entry with `fastLaneOpportunity: true` — a wide gate apron and 3 inbound
lanes (`entryLanes: 3`), with unused paved width for an express bypass.
