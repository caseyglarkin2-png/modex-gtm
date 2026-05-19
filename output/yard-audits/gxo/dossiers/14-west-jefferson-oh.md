# Deep-Audit Dossier — GXO Logistics Distribution Center, West Jefferson OH (idx 14)

## Facility
- **Name:** GXO Logistics Distribution Center - West Jefferson OH
- **Type:** Distribution Center
- **Address:** 202 Park West Dr, West Jefferson, OH 43162
- **Resolved coordinates:** 39.94550, -83.33280
- **Maps:** https://www.google.com/maps/@39.94550,-83.33280,400m/data=!3m1!1e3

## Location confirmation
The roster lat/lng (39.946035, -83.33351) landed on a large white-roof
warehouse in Columbus Logistics Park West, a 232-acre Class A park off I-70 in
West Jefferson OH. Web research confirms the identity: the U.S. Foreign Trade
Zone registry (FTZ Zone 138 Site 042) lists **GXO Logistics Supply Chain, Inc.
at "202 Park West Drive, Building I"** (8.84 acres activated, active since Oct
2023). Ambrose Property Group's listing documents **Building I as a 712,000 SF
Class A warehouse** with GXO as tenant. The roster building is the centrally
located ~712k SF box matching that footprint (the larger ~1.06M SF box to the
NE is Building II). Locked center at the building centroid 39.94550, -83.33280.

## Key views
- **z15 park context:** A large multi-building logistics park off I-70;
  Building I sits centrally, with the bigger Building II to the NE.
- **z17 building view:** Single rectangular cross-dock building; dock-door
  banks with trailers on both the SW and NE long faces.
- **z19 SW dock face:** Long dock-door bank running the building length, with
  a wide truck court and an adjacent retention pond; some trailers parked.
- **z19 NE dock face:** Second dock-door bank with trailers backed in.
- **z19/z20 NW corner:** Office and a large (254-stall) employee parking lot;
  ground to the NW is still partly graded/undeveloped.
- **Street View (2024) Park West Dr:** Open access road past Building I — no
  gate, no booth.

## Gate / guard-shack / dock determinations
- **truckGate: false.** Building I fronts Park West Drive with an open
  perimeter loop road. No barrier arm, sliding gate, or checkpoint
  pinch-point appears at any property-line connection in z18/z19 satellite or
  2024 Street View, and there is no perimeter fence around the yard.
- **guardShack: false.** No 1-3-vehicle staffed booth at any entrance in
  z19/z20 satellite or Street View. A small box at the NW edge of the parking
  lot is a utility cabinet, not a guard booth.
- **remoteGs: false.** No gate, so no remote check-in inference.
- **Docks: "50+".** Cross-dock building with banks on both the SW and NE
  faces; developer documents 38 docks for the south 343,500 SF portion alone,
  so the full 712k SF building exceeds 50. ~78 doors estimated total.
- **shipRcvSeparate: true.** Two physically separate dock banks on opposite
  building faces, so shipping and receiving run separately.
- **Drop yard: yes / dropArea "10-25".** Documented 85 trailer stalls; ~36
  trailers parked in dock courts/drop rows at imagery time (building still
  ramping up after a 2023 FTZ activation).
- **railServed: false.** No rail spur enters the property.

## Yard zones and counts
- **perimeter:** building + dock courts + trailer parking.
  ~523 m N-S x ~427 m E-W ≈ **55.2 acres**.
- **truckGate zone:** open SW connection to Park West Drive (no structure).
- **dropYards:** two boxes — SW-face truck court and NE-face truck court.
- **dockAprons:** two boxes — SW dock apron and NE dock apron.
- **staging:** no distinct pre-gate staging; null.
- **yardMetrics:** ~78 dock doors, ~36 trailers visible, capacity ~85, 1 truck
  gate, 1 building, 55.2 acres, no rail.

## Web findings
- FTZ Zone 138 Site 042: GXO Logistics Supply Chain, Inc., 202 Park West Drive
  Building I, West Jefferson OH; 8.84 acres activated, active since Oct 2023.
- Ambrose Property Group: Columbus Logistics Park West Building I = 712,000 SF
  Class A warehouse, GXO tenant; 38 docks documented for the south 343,500 SF
  portion, 2 drive-in doors, 254 auto stalls, 85 trailer stalls.

## Confidence
**High.** Facility positively identified via the FTZ registry (exact address +
GXO named). Imagery clear at z17-z20. Flagged uncertain fields are the full-
building dock-door count (estimate ~78, but unambiguously 50+) and dropArea
(building still ramping up post-2023, so visible trailers are below documented
capacity).

**3-line summary:**
- Gate: NO truck gate — open Park West Dr frontage, no barrier or fence.
- Guard shack: NO — no booth at any truck lane.
- Confidence: HIGH.
