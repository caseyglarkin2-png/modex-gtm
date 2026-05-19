# Deep-Audit Dossier — idx 12

## Kenco MCS Dallas III — Lancaster, TX

**Facility type:** Multi-Client Distribution Center (temperature-controlled, food grade, 589,362 SF)
**Resolved location:** Danieldale Road logistics corridor, Lancaster, TX 75134
**Locked center coordinate:** 32.63750, -96.80130 (large cross-dock building at the roster coord)
**Gate verdict:** NO truck gate (open speculative-park access)
**Guard-shack verdict:** NO guard shack
**Confidence:** Medium

---

### Step 0 — Locating the facility

The roster supplies identical `APPROXIMATE` coordinates (32.635612, -96.802949) for THREE
distinct Kenco Lancaster facilities — MCS Dallas III (589,362 SF), Dallas IV (560,000 SF)
and Dallas II (200,000 SF). They all sit in the dense **Danieldale Road multi-tenant
logistics corridor** in Lancaster, TX 75134.

Research confirmed the Kenco anchor address as **2821 Danieldale Rd, Lancaster, TX 75134**
(Indeed job postings for Kenco Lancaster roles and the Bandana company directory both list
this address; the parcel is a ~660,000 SF warehouse on a ~36-acre lot). A separate
1901 Danieldale Rd building in the same corridor belongs to NFI, not Kenco.

Public sources do **not** disambiguate which exact buildings Kenco leases as Dallas III
vs IV vs II. Accordingly, idx 12 — the largest of the three (589,362 SF = Dallas III) —
was assigned to the large cross-dock building whose **west dock face the roster
coordinate falls directly on** (building center ~32.6375, -96.8013). This is a defensible,
documented choice; the building-level identity uncertainty is recorded in
`uncertainFields` and `confidence` is set to **medium**.

### Steps 1–3 — Key views

- **Site overview (z16/z17):** A corridor of large, modern Class A logistics buildings.
  The target building is a big rectangular N-S structure (~330 m long) with dock banks on
  **both** long faces (east and west) — a cross-dock configuration.
- **Dock faces (z18):** Continuous rows of dock doors with many trailers backed in on
  both the west and east faces. Long dock aprons run the length of both faces.
- **Drop yards:** A large dedicated trailer drop yard sits south of the building and
  along the aprons, with 100+ trailers parked in dense diagonal rows.
- **Street View (capture 2021-02):** Wide, fully open paved access drives — **no barrier
  arm, no gate, no guard booth, no kiosk**, only fire-lane striping. Typical of a modern
  speculative multi-tenant logistics park.

### Step 4 — Web findings

- Kenco's warehousing map lists MCS Dallas III (589,362 SF, food grade,
  temperature-controlled, ambient) at Lancaster, TX.
- 2821 Danieldale Rd confirmed as a Kenco Lancaster operating address.
- The corridor is a developer-built (ProLogis and others) multi-tenant logistics park;
  Kenco occupies three of the buildings.

### Step 5 — Classification rationale

- **truckGate / guardShack / remoteGs = false / false / false** — open speculative-park
  drives, no checkpoint structure of any kind. With no gate, remoteGs is false.
- **shipRcvSeparate = true** — dock banks on both opposite long faces (cross-dock);
  shipping and receiving run from physically separate clusters.
- **dockDoors = "50+", dropArea = "50+", dropYard = true** — long dock banks on two faces
  plus a large dedicated trailer drop yard.
- **drivewayLong = true, postGateStaging = true** — deep internal aprons and yard space
  hold long truck queues.
- **multipleFacilities = true** — large multi-building campus; Kenco itself occupies
  three buildings in the corridor.
- **entryExitSeparate = true (uncertain)** — multiple separate drive connections serve
  the property.
- **fastLaneOpportunity = true** — wide aprons and drives leave room for an express lane.
- **urbanRural = "Urban"** — Lancaster is a southern Dallas-Fort Worth metro suburb in a
  dense industrial setting.
- **railServed = false; scale = false; multiStep = false; backupSensitive = false.**

### Yard zones & counts

- **Perimeter:** the large building's developed parcel (building + aprons + drop yard) —
  ~78 acres.
- **truckGate zone:** the open south-side access drive off the corridor street.
- **dropYards:** south-side trailer yard + west-side apron storage.
- **dockAprons:** west dock apron + east dock apron.
- **yardMetrics:** ~110 dock doors (est., two faces), ~120 trailers visible, ~220 trailer
  parking capacity, 2 truck-access points, 1 building, ~78 acres, not rail-served.

### Final confidence

**Medium.** The Danieldale Road corridor and Kenco's presence (2821 Danieldale Rd) are
confirmed, and the audited building is a real large cross-dock DC at the roster
coordinate. However, the three Kenco Lancaster facilities share one approximate
coordinate and cannot be individually pinned from public data — building-level identity
is the main uncertainty, flagged in `uncertainFields`.
