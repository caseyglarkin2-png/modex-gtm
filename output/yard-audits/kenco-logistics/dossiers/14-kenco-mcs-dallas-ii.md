# Deep-Audit Dossier — idx 14

## Kenco MCS Dallas II — Lancaster, TX

**Facility type:** Multi-Client Distribution Center (food grade, 200,000 SF)
**Resolved location:** Danieldale Road logistics corridor, Lancaster, TX 75134
**Locked center coordinate:** 32.63250, -96.80380 (smaller rear-load building)
**Gate verdict:** NO truck gate (open speculative-park access)
**Guard-shack verdict:** NO guard shack
**Confidence:** Medium

---

### Step 0 — Locating the facility

As with idx 12 and 13, the roster supplies identical `APPROXIMATE` coordinates
(32.635612, -96.802949) for three Kenco Lancaster facilities — Dallas III (589,362 SF),
Dallas IV (560,000 SF) and **Dallas II (200,000 SF, this entry)**. They sit in the
**Danieldale Road multi-tenant logistics corridor**, Lancaster, TX 75134, anchored by the
confirmed Kenco address 2821 Danieldale Rd. Kenco's own location page for "MCS – Dallas
II" is slugged `dallas-walker-edison` (Walker Edison being a former tenant).

Public data does not disambiguate Kenco's three buildings. idx 14 (Dallas II, 200,000 SF
— the smallest of the three) was assigned to the notably smaller **rear-load building**
in the corridor (center ~32.6325, -96.8038), which is clearly smaller than the large
cross-dock giants and matches a ~200k SF footprint. Building-level identity uncertainty
is recorded in `uncertainFields`; `confidence` is **medium**.

### Steps 1–3 — Key views

- **Site overview (z16/z17):** The corridor's large cross-dock buildings dominate; this
  target building is distinctly smaller — a single-load (rear-load) structure.
- **Dock face (z18/z19):** A single dock bank with trailers backed in along the **east**
  face only. A trailer apron/drop area runs the east side.
- **Street View (capture 2016-12 / 2025-12):** Open, wide paved access drives off the
  corridor street — **no barrier arm, no gate, no guard booth, no kiosk** — only fire-lane
  striping. Glass curtain-wall office front. Typical open speculative-park access.

### Step 4 — Web findings

- Kenco's warehousing map lists MCS Dallas II (200,000 SF, food grade, ambient) at
  Lancaster, TX; the Kenco location page slug is `dallas-walker-edison`.
- The Danieldale Road corridor is a developer-built multi-tenant logistics park; Kenco
  occupies three buildings here (anchor: 2821 Danieldale Rd).

### Step 5 — Classification rationale

- **truckGate / guardShack / remoteGs = false / false / false** — open speculative-park
  access drives, no checkpoint structure. With no gate, remoteGs is false.
- **shipRcvSeparate = false** — rear-load building with a single east-face dock bank;
  shipping and receiving share one dock cluster.
- **dockDoors = "25-50", dropArea = "10-25", dropYard = true** — one east-face dock bank
  (~38 doors est.) plus a modest trailer apron/drop area.
- **drivewayLong = true, postGateStaging = true** — deep aprons hold a truck queue.
- **entryExitTogether = true** — a single shared access point off the corridor street.
- **multipleFacilities = true** — large multi-building campus; Kenco occupies three
  buildings in the corridor.
- **fastLaneOpportunity = true** — wide aprons and drives leave room for an express lane.
- **urbanRural = "Urban"** — Lancaster is a Dallas-Fort Worth metro suburb in dense
  industrial fabric.
- **railServed = false; scale = false; multiStep = false; backupSensitive = false.**

### Yard zones & counts

- **Perimeter:** the rear-load building's developed parcel — ~26 acres.
- **truckGate zone:** the open access drive off the corridor street.
- **dropYards:** east-side trailer apron/drop area.
- **dockAprons:** east dock apron.
- **yardMetrics:** ~38 dock doors (est., one face), ~25 trailers visible, ~55 trailer
  parking capacity, 1 truck gate, 1 building, ~26 acres, not rail-served.

### Final confidence

**Medium.** The corridor and Kenco's presence are confirmed and the audited building is a
real ~200k-SF rear-load DC, but the three same-coord Kenco Lancaster facilities cannot be
individually pinned from public data — building-level identity is the main uncertainty,
flagged in `uncertainFields`.
