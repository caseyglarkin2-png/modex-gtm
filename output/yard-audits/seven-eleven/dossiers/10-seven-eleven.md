# Deep Audit — 7-Eleven Distribution Warehouse Mishawaka IN (E.A. Sween) [idx 10]

**Resolved location:** 41.65683, -86.21010 (2402 W 6th St, Mishawaka, IN 46544)
**Type:** Grocery DC (small in-town distribution depot)
**Confidence:** high
**Method:** deep-audit (satellite + Street View, 2025-06 imagery)

## Location confirmation (Step 0)
Google geocode of "2402 W 6th St, Mishawaka, IN 46544" returns ROOFTOP at
41.6568931, -86.2098282 — essentially the supplied city-level coordinate, which
in this case landed on the actual rooftop. Satellite at zoom 18-20 confirms a
freight building on the south side of a NS rail line, fronting West 6th Street,
boxed in by residential blocks.

**Operator discrepancy (important):** The roster labels this site
"7-Eleven / E.A. Sween." The building at this address is operated by **Prairie
Farms Dairy** (branch line 574-255-9641), confirmed two ways: (1) the parked
reefer trailers carry Prairie Farms "Choose 100% REAL Dairy" wraps, readable in
Street View; (2) business directories list Prairie Farms Dairy at 2402 W 6th St.
No E.A. Sween / Deli Express signage or branding is present. The physical audit
below is of the building at the supplied coordinates regardless of nameplate.

## What the key views showed
- **Satellite z19/z20:** A single main metal warehouse (rust + blue metal roof,
  long axis N-S) on the east half of the lot, a smaller shop/garage building on
  the west half, and a large unpaved (dirt/gravel) yard between and around them
  full of parked trailers. NS rail line borders the north edge; no spur enters.
- **Street View, south face (W 6th St):** One large ground-level drive-in
  overhead door with a brick office section to its left, open concrete apron
  straight to the public street. No gate, booth, or barrier on this frontage.
- **Street View, west frontage (Studebaker St):** Chain-link perimeter fence the
  full length, with a chain-link rolling/swing **gate** at the yard opening
  (pano 35d9ZyiyzQ7jvcjN4sttFQ, captured 2025-06). Prairie Farms reefer trailers
  lined up behind the fence. Residential homes directly across the street.

## Gate / guard-shack / dock determinations
- **truckGate = true.** A chain-link gate sits across the west yard opening on
  Studebaker St — a real controlled entrance, though a plain manual/keyed gate,
  not a barrier arm.
- **guardShack = false.** No booth or staffed structure anywhere on the
  perimeter. Nothing beside the gate.
- **remoteGs = true.** Gate present but unmanned (no booth) → access is
  manual/keyed rather than a manned checkpoint, satisfying the rubric's
  gate-without-guard-shack condition.
- **dockDoors = "0-10".** One drive-in door on the south face plus ~4-6 dock/door
  positions along the west face of the main warehouse. Small operation; exact
  count flagged low-confidence (uncertainFields).
- **dropYard = true / dropArea = "10-25".** ~12 trailers and reefers parked
  across the unpaved yard (west and north rows) — a dedicated drop lot, not just
  active-dock staging.

## Yard zones and counts
- **Perimeter:** ~1.88 acres, traced to the chain-link fence line (W 6th St
  south, Studebaker St west, rail embankment north, residential lot line east).
- **truckGate zone:** the west-fence gate opening + apron.
- **dropYard:** the central/north gravel lot holding the parked trailers.
- **dockApron:** thin strip along the west face of the main warehouse.
- **yardMetrics:** dockDoorCount 6 (est.), trailersVisible 12, capacity ~18,
  truckGateCount 1, buildingCount 2, siteAreaAcres 1.88, railServed false.
- **Street View coverage:** full coverage on both bordering streets; perimeter
  pano iUrULbeIl91NbBVJe7Zc6g (heading 241), gate pano 35d9ZyiyzQ7jvcjN4sttFQ
  (heading 27).

## Other classification notes
- **backupSensitive = true:** gate opens straight onto a residential street with
  no stacking room; a truck queue would immediately block Studebaker / W 6th St.
- **drivewayShort = true:** approach holds only 1-2 trucks.
- **urbanRural = "Urban":** inside Mishawaka's residential fabric (South Bend
  metro), houses across both bordering streets.
- **scale = false, multiStep = false, shipRcvSeparate = false,
  multipleFacilities = false** (two buildings but one operational cluster).
- **railServed = false:** NS line borders the north edge but is a through line;
  no spur.

## Web findings
- Prairie Farms Dairy Inc, 2402 W 6th St, Mishawaka IN 46544, (574) 255-9641 —
  confirmed via yellowpages/iBegin/chamberofcommerce listings.
- E.A. Sween Company (Deli Express) operates regional distribution but no
  evidence ties E.A. Sween to this specific address; trailer branding and
  directories point to Prairie Farms.

## Final confidence
**High** on location, gate, guard-shack, yard layout, and drop-yard call. Exact
dock-door count is the one soft figure (banded 0-10, flagged). Operator name in
the roster does not match the on-the-ground tenant (Prairie Farms, not E.A.
Sween) — noted for data cleanup.
