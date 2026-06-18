# Crowley St. Thomas Cargo Terminal (Crown Bay Cargo Port, USVI)

Deep-audit dossier. Method: satellite imagery (z16-z19) + Street View metadata + web research.

## Resolved location and how it was confirmed

- Facility: Crowley's containerized/commercial cargo operation at the **Crown Bay Sandfill Marine Cargo Facility**, Charlotte Amalie, St. Thomas, USVI.
- Operating entity: Crowley Caribbean Services, 8131 Crown Bay, St. Thomas VI 00802 (Crowley has run cargo in the USVI for 40+ years).
- Landlord: Virgin Islands Port Authority (VIPA). VIPA publishes the Crown Bay Cargo Port as roughly **20 acres** with a **2,720 ft bulkhead** and **30 ft max draft**. VIPA and Crowley signed agreements in 2024 to rehabilitate and expand the facility (construction expected to start 2025).
- Center locked at **18.33584, -64.94964**.
- Confirmation: city-level coordinates pointed at the Crown Bay area. Satellite at z16-z17 separated three distinct waterfront features: the Crown Bay **cruise pier** with red-roofed Crown Bay Center retail (SW), the Crown Bay **Marina** with floating recreational docks (center, dark water), and the **cargo terminal** (NE) - the only one showing container stacks and a worked cargo vessel. Zooming to z18-z19 over the NE feature confirmed a working container terminal.

## What each key view showed

- **z16/z17 (wide):** Crown Bay waterfront. Cruise pier + Crown Bay Center retail to the SW, the marina basin in the center, and the cargo/container area to the NE with a ship at berth. Established which feature is the cargo terminal.
- **z18 core:** Multiple blocks of container ground slots and stacks (orange/red/blue/white boxes), a container ship being worked at the quay (bottom), a barge/vessel at the lower quay, transit-shed warehouses (white/grey roofs, some with solar arrays) on the landward edge, terminal tractors and yard equipment.
- **z19 core:** Confirmed a mobile harbor crane / reach-stacker (red equipment) in the stacking area, container chassis/reefer lanes, and a loaded container vessel at the berth. Containers stacked roughly 1-3 high.
- **z18/z19 landward (north):** The Sub Base industrial district - warehouses with solar roofs, Crown Bay Road, and the northern container rows where the yard meets the road. Adjacent commercial lots intermix with the terminal edge, typical of a constrained island sandfill site.

## Gate / guard-shack / dock determinations

- **Truck gate: true (inferred, flagged uncertain).** The cargo facility is a VIPA-controlled, ISPS-secured port estate with a single landward access off Crown Bay Road. That is the standard secured configuration for a US-territory marine cargo terminal. The pricing label "smaller, ungated tier" refers to commercial size class, not a literally open yard; the secured port perimeter is still present. No in-terminal Street View and overhead imagery does not resolve the specific barrier-arm hardware.
- **Guard shack: true (inferred, flagged uncertain).** A manned booth is the expected configuration at a staffed island cargo gate; remoteGs left false for that reason. Specific booth not positively resolved.
- **Dock doors: 0-10 band, ~4 (low confidence).** Marine terminal, so OTR dock doors are near-zero by design. The count reflects the landward face of the attached transit-shed warehouses (break-bulk / LCL handling). Exact door count not resolvable from overhead.
- **Scale: true (inferred).** A weighbridge is standard at a containerized terminal for weight verification. Not positively resolved in the frames.
- **Backup-sensitive: true.** The terminal sits on a tight sandfill peninsula wedged between Crown Bay Road, the marina, and the cruise pier in the dense Sub Base district. Little gate-stacking room; a queue would spill onto the shared public industrial road. Approach is short (drivewayShort).

## Yard zones and counts measured

- **Perimeter:** 4-corner oriented polygon around the cargo estate (quay + container yard + adjoining transit sheds), area **~19.4 acres**, matching VIPA's published ~20-acre figure.
- **Drop yard:** one ring over the main container stacking blocks. dropYard=true, dropArea band 50+ (container/chassis ground slots).
- **Dock apron:** one long thin quad hugging the quay/bulkhead where the vessel works.
- **yardMetrics:** dockDoorCount 4 (low conf), trailersVisible ~25, trailerParkingCapacity ~600 container/chassis ground slots (this is a CONTAINER-SLOT figure, not OTR trailer stalls; small island terminal, ~1/3 the size of Santo Tomas or Puerto Cortes), truckGateCount 1, buildingCount 4, siteAreaAcres 19.4, railServed false (no rail on St. Thomas).
- **Street View:** No coverage inside the secured terminal (metadata ZERO_RESULTS at all in-yard points). Nearest pano `9NhmCaSc6-JnDE4tOyonfA` (captured 2016-10) at 18.33734,-64.95018 on Crown Bay Road ~165m north, in front of a lumber/hardware store. heading 161 deg points south toward the yard. Recorded as the best available approach view; it does not show the gate itself.

## Web findings

- VIPA + Crowley (St. Thomas Source / viport.com, Feb 2024): agreements to rehabilitate and expand the Crown Bay Sandfill Marine Cargo Facility; ~20 acres, 2,720 ft bulkhead, 30 ft draft; construction expected 2025.
- Crowley locations / St. Thomas office: containerized and commercial shipping, warehousing, administrative ops; 40+ years in USVI; Crowley Caribbean Services at 8131 Crown Bay.

## Final confidence

**Medium.** Site identity, location, size, and the container-terminal character are confirmed with high certainty from imagery and VIPA/Crowley sources. The gate/guard/scale calls are inferred from secured-port norms rather than directly resolved (no in-terminal Street View, and overhead imagery does not show the gate hardware), and the slot/door counts are honest overhead estimates - all flagged uncertain.
