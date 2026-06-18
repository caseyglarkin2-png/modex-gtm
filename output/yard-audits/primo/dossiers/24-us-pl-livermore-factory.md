# US PL Livermore Factory - Deep Audit Dossier

- **Site:** idx 24, slug `us-pl-livermore-factory`
- **List name / type:** US PL Livermore Factory / Bottling plant (PL)
- **Resolved location:** 7480 Las Positas Rd, Livermore, CA 94551
- **Resolved coords:** 37.71185, -121.70330
- **Operational verdict:** OPERATIONAL (water distribution / branch depot with light water-processing; active fenced truck yard)
- **Confidence:** medium

## Operational status (the #1 question)

This was a blank-flag entry, so closure was the first thing to rule out. Findings:

- **Identity.** The only BlueTriton / Primo / Nestle Waters footprint in Livermore is the
  site at **7480 Las Positas Rd** (Buzzfile, LoopNet, Yelp, Google Places all agree).
  This is the entry that shows up as "Livermore Factory" on the BlueTriton/Primo list.
- **Active as of Dec 2024.** Street View on the internal business-park road
  (pano `ic9zwDVsNfyga_MQ03dsXw`, captured 2024-12) shows the truck-yard side as an
  actively used, chain-link-fenced paved yard holding box trucks, delivery vans and
  trailers - clearly in service.
- **Active as of Mar 2026.** The live Yelp page for ReadyRefresh at 7480 Las Positas was
  updated March 2026 with 71 reviews - an ongoing water-delivery operation.
- **No closure signal.** No WARN notice and no news of a Livermore shutdown. The only
  BlueTriton/Primo plant-closure news found was the Aberfoyle, Ontario plant (Jan 2025) -
  a different facility.
- **Stale-listing caveat.** Google Places carries a *duplicate* ReadyRefresh listing at
  this address flagged `CLOSED_PERMANENTLY`, while a parallel "Arrowhead Bottled Water
  Delivery Livermore" listing at the *identical* address shows `OPERATIONAL`. That split is
  a Google duplicate-listing artifact, not a real closure - the ground evidence (Dec-2024
  yard, Mar-2026 Yelp activity) governs.

**Type caveat:** physically this reads as a distribution/depot + light water-processing
branch - a single ~120k sqft 1991-era big-box with three exterior process/storage tanks on
its east face - not a large dedicated high-speed bottling line like the Cabazon or
Sacramento factories. The list labels it "Bottling plant (PL)" and that label was kept per
instruction, but the on-the-ground footprint is depot-scale. Flagged in fieldNotes.

## How the location was confirmed

Coords were unknown. Web search pinned BlueTriton/Primo's only Livermore site to
7480 Las Positas Rd 94551; geocoding returned 37.71179, -121.70326. Satellite at z18-z20
confirmed the building: a long NW-SE big-box with **three large white water tanks** on its
east side, a dock band with trailers on the SW/south, a fenced trailer drop yard to the
north, and trailers staged along the west apron. Center locked at 37.71185, -121.70330.

## What the key views showed

- **z16/z17 overview:** dense east-Livermore industrial/business park (Las Positas corridor,
  just NE of Livermore Municipal Airport, off I-580). Multi-tenant warehouses; Urban setting.
- **z19/z20 tight:** the BlueTriton building with three exterior process tanks (east) + two
  smaller tanks (NE roof), dock positions and backed-in trailers on the SW/south, pallet
  stacks staged on the SW apron, and a row of trailers along the west side.
- **z18 wide:** a fenced trailer **drop yard to the north** holding ~16-20 box trailers in
  neat rows - the dedicated trailer-storage lot, distinct from the active dock apron.
- **Street View, Las Positas Rd frontage (2019-06):** open landscaped office/parking
  frontage with a monument sign and an **ungated** entry - the public/office face.
- **Street View, internal yard road (2024-12, pano `ic9zwDVsNfyga_MQ03dsXw`):** the truck
  side - a chain-link perimeter fence with a **sliding vehicle gate**, box trucks and a
  white delivery truck inside the fenced lot. No guard booth.

## Gate / guard-shack / dock determinations

- **truckGate = TRUE.** Chain-link perimeter fence around the truck yard with a sliding
  vehicle gate, confirmed at ground level (Dec-2024 SV). Distinct from the open office
  frontage on Las Positas Rd.
- **guardShack = FALSE.** No booth-sized structure at the fenced gate in either Street View
  or satellite. Gate is unstaffed.
- **remoteGs = TRUE.** Gate present, no guard shack -> badge / kiosk / remote check-in.
- **dockDoors = "0-10".** SW/south face shows ~6 backed-in trailers/box-trucks plus dock-
  leveler shadows; honest estimate ~8 doors. Low confidence (could touch 10).
- **dropYard = TRUE / dropArea = "10-25".** Fenced trailer drop lot to the north,
  ~16-20 trailers in rows, separate from the dock apron.

## Yard zones & counts measured

- **perimeter:** rotated polygon around the BlueTriton-controlled footprint (building + west
  apron + north fenced drop yard); ~5.5 acres inside the shared park.
- **truckGate:** the sliding-gate opening on the NW fence line.
- **dropYards:** north fenced trailer lot + the west apron trailer line.
- **dockApron:** thin quad along the SW/south dock face.
- **yardMetrics:** dockDoors ~8, trailersVisible ~28, parking capacity ~40, 1 truck gate,
  1 building, ~5.5 ac, no rail.

## Web findings (sources)

- Buzzfile / LoopNet / Yelp / Google Places - identity + address (7480 Las Positas Rd 94551),
  59,664 sqft 1991 Class A industrial building, ReadyRefresh delivery operation.
- Yelp ReadyRefresh Livermore - updated Mar 2026, 71 reviews (active).
- 2017 Alliance for Water Stewardship report (a4ws.org) - Livermore site = water bottling +
  logistics center in a Livermore industrial park (Arrowhead / Calistoga / Nestle Pure Life).
- Nestle/PRNewswire/Livermore Chamber (2017) - Livermore factory water-stewardship
  certification (historic operational confirmation).
- BlueTriton Aberfoyle ON closure (CBC/Just-Drinks, Jan 2025) - the only Primo/BlueTriton
  plant closure found; NOT Livermore.

## Final confidence

**Medium.** Location and operational status are well established (satellite + 2024-12 Street
View + 2026 Yelp). The gate/guard-shack/remote-GS calls are solid (confirmed at ground
level). Dock-door count and exact trailer counts are honest overhead estimates, and the
"Bottling plant" type label is retained per instruction despite the depot-scale physical
footprint - those are the medium-confidence items listed in `uncertainFields`.
