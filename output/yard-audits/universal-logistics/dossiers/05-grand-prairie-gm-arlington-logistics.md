# Deep-Audit Dossier — idx 5

## Universal Logistics — GM Arlington Logistics Center, Grand Prairie TX

**Address:** 2305 W Marshall Dr, Grand Prairie, TX 75051
**Resolved center:** 32.719500, -97.037200
**Type:** Value-Added Logistics / Sub-Assembly Center
**Confidence:** High

---

### Location confirmation

The roster coordinate (283 m geocoder offset noted) landed on a large
warehouse in the Great Southwest Industrial District. Web research (TruckMap
and Waze list it as "Universal & GM"; Panjiva shipper records as "GM Arlington
(Universal Logistics)"; businessyab) confirms Universal Logistics operates a
value-added logistics / sub-assembly center here serving GM Arlington Assembly
(Tahoe / Suburban / Yukon / Escalade). 2022 Street View shows Universal-branded
trailers backed into the dock doors. Positively identified. The campus is two
buildings — a long N–S main warehouse plus a second blue-roofed building at the
north end (consistent with the ~1.2M sq ft two-building campus in the source).

### Key views

- **Wide satellite (z16-17):** The long N–S main warehouse with trailers backed
  in along both long faces, plus the second blue-roofed building to the north.
- **Dock faces (z18-19):** Continuous dock-door banks on BOTH the east and west
  long faces of the main building; open dock aprons with employee parking
  beyond.
- **Street View (W Marshall Dr / dock apron, 2022):** The dock apron opens
  directly to the campus drive with no perimeter fence, no gate, no booth — a
  truck (Universal-branded trailer) backed in at the docks, a worker on foot.

### Gate / guard-shack determination

- **truckGate = false.** An open speculative-build industrial-park campus.
  Street View shows the dock aprons on both faces opening directly to the
  campus drives with NO perimeter fence, NO barrier arm or gate, and NO
  checkpoint structure. Trucks drive straight from W Marshall Dr onto the dock
  apron. This matches the rubric's "#3 — No Gate / No GS" archetype.
- **guardShack = false / remoteGs = false.** No gate, therefore no shack and no
  remote check-in.
- **multiStep = false.**

### Yard zones and counts

- **Perimeter:** ~62 acres for the two-building campus parcel including dock
  aprons and parking.
- **Dock doors:** continuous banks on both long faces of the main building plus
  the second building → estimated ~120-140 → 50+ band. Two separate building
  faces → shipRcvSeparate = true.
- **Dock aprons:** the east-face apron and the west-face apron — both boxed.
- **Drop area:** some trailer-parking rows on the west side beyond the apron,
  but most parked trailers are dock-staged at doors → modest dedicated drop
  space, 10-25 band (flagged uncertain). No large standalone trailer-storage
  lot → dropYard = false.
- **multipleFacilities = true:** two-building campus (long main warehouse +
  north blue-roofed building).
- **drivewayShort = true:** open apron directly off the public drive — no deep
  gated approach.
- **Rail:** no spur enters the property → railServed = false.

### Web findings

TruckMap / Waze: "Universal & GM, 2305 W Marshall Dr." Panjiva: "GM Arlington
(Universal Logistics)" receiving automotive components (camshafts, cables,
etc.) — a GM import/export and sub-assembly logistics operation feeding GM
Arlington Assembly. The roster source cites a ~1.2M sq ft two-building campus
producing interior cabins.

### Final confidence

**High** — facility and operator positively confirmed by multiple sources, and
2022 Street View plus current satellite give a clear, unambiguous read of an
open (ungated) dock-dense logistics campus. The only field flagged uncertain is
the precise drop-area band.
