# Deep-Audit Dossier — idx 13

## Kenco MCS Dallas IV — Lancaster, TX

**Facility type:** Multi-Client Distribution Center (temperature-controlled, food grade, 560,000 SF)
**Resolved location:** Danieldale Road logistics corridor, Lancaster, TX 75134
**Locked center coordinate:** 32.63900, -96.79900 (large solar-roof cross-dock building)
**Gate verdict:** NO confirmed truck gate (open building access; dock yards fenced)
**Guard-shack verdict:** NO guard shack
**Confidence:** Medium

---

### Step 0 — Locating the facility

As with idx 12, the roster supplies identical `APPROXIMATE` coordinates
(32.635612, -96.802949) for three Kenco Lancaster facilities — Dallas III (589,362 SF),
**Dallas IV (560,000 SF, this entry)** and Dallas II (200,000 SF). They sit in the
**Danieldale Road multi-tenant logistics corridor**, Lancaster, TX 75134, anchored by the
confirmed Kenco address 2821 Danieldale Rd.

Public data does not disambiguate Kenco's three buildings. idx 13 (Dallas IV, 560,000 SF,
the second-largest of the three) was assigned to the large cross-dock building carrying a
**full rooftop solar array** immediately northeast of the idx 12 building — center
~32.6390, -96.7990. Building-level identity uncertainty is recorded in `uncertainFields`
and `confidence` is **medium**.

### Steps 1–3 — Key views

- **Site overview (z16/z17):** A corridor of large modern Class A logistics buildings,
  bounded on the north by a freeway. The target building is a big N-S structure with a
  near-complete rooftop photovoltaic array.
- **Dock faces (z18/z19):** Dock banks with trailers backed in along **both** long faces
  (east and west) — cross-dock configuration. Long dock aprons run the building length.
- **Drop yards:** Dedicated fenced trailer yards along both dock faces, 80+ trailers
  parked.
- **Street View (capture 2025-12):** The corridor street and building/office access
  drives are wide and open with no barrier or guard booth. The trailer dock yards along
  the faces appear to carry perimeter security fencing (typical of DFW logistics parks),
  but no manned or gated truck checkpoint was confirmed. The office front is a glass
  curtain-wall facade.

### Step 4 — Web findings

- Kenco's warehousing map lists MCS Dallas IV (560,000 SF, food grade,
  temperature-controlled, ambient) at Lancaster, TX.
- The Danieldale Road corridor is a developer-built multi-tenant logistics park; Kenco
  occupies three buildings here (anchor: 2821 Danieldale Rd).

### Step 5 — Classification rationale

- **truckGate = false (uncertain)** — building/office access is open; dock yards appear
  fenced but no manned/gated truck checkpoint confirmed. Flagged uncertain.
- **guardShack / remoteGs = false / false** — no guard booth; with no confirmed gate,
  remoteGs is false.
- **shipRcvSeparate = true** — cross-dock building, dock banks on both opposite long
  faces.
- **dockDoors = "50+", dropArea = "50+", dropYard = true** — long two-face dock banks
  plus dedicated fenced trailer drop yards.
- **drivewayLong = true, postGateStaging = true** — deep aprons and yards hold long
  truck queues.
- **multipleFacilities = true** — large multi-building campus; Kenco occupies three
  buildings in the corridor.
- **entryExitSeparate = true (uncertain)** — multiple separate drive connections.
- **fastLaneOpportunity = true** — wide aprons and drives.
- **urbanRural = "Urban"** — Lancaster is a Dallas-Fort Worth metro suburb in dense
  industrial fabric.
- **railServed = false; scale = false; multiStep = false; backupSensitive = false.**

### Yard zones & counts

- **Perimeter:** the solar-roof building's developed parcel — ~62 acres.
- **truckGate zone:** the open south-side access drive off the corridor street.
- **dropYards:** east-face + west-face fenced trailer yards.
- **dockAprons:** west dock apron + east dock apron.
- **yardMetrics:** ~95 dock doors (est., two faces), ~90 trailers visible, ~170 trailer
  parking capacity, 2 truck-access points, 1 building, ~62 acres, not rail-served.

### Final confidence

**Medium.** The corridor and Kenco's presence are confirmed and the audited building is a
real large cross-dock DC, but the three same-coord Kenco Lancaster facilities cannot be
individually pinned from public data — building-level identity is the main uncertainty.
