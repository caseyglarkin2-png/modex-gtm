# Crowley Manzanillo Container Terminal (MIT) - Panama

**Resolved location:** 9.3635 N, -79.8835 W (Manzanillo Bay peninsula, Coco Solo Sur, Colon Province, Panama)
**Type:** Marine container terminal plus attached/adjacent warehouse row
**Operations:** 24/7
**Confidence:** High

## What facility this is and how it was confirmed

The container terminal Crowley uses in the Manzanillo / Coco Solo area of Colon is **Manzanillo International Terminal (MIT)**, operated by SSA Marine. Crowley does not own its own berth here; it runs twice-weekly liner service to and from Colon out of MIT and maintains its Panama liner-terminal office at Puerto de Manzanillo, Edificio C (Edificio de Navieras), Colon, plus shared bonded and non-bonded warehouse space at its Colon hub (consolidation, deconsolidation, cross-dock, re-label, pick and pack).

Confirmation sources:
- Crowley Panama pages (Colon liner terminal at Puerto de Manzanillo; twice-weekly Colon service; warehouse/cross-dock services).
- MIT / SSA Marine pages and the GA Tech Panama logistics portal / Logistics Cluster (LCA) Panama port assessment.
- latitude.to cited 9.357 N, -79.899 W for MIT; that point lands in dense urban Colon, so the center was corrected by satellite to the actual terminal peninsula at 9.3635 N, -79.8835 W.

MIT facts that anchor the audit: 37 hectares (about 91 acres) of paved container yard, 8 berths (6 container, 2 RoRo), 2,000+ m of quay, 19 post-Panamax STS cranes, ASCs/RTGs/top-picks, 3.5M TEU annual capacity, ISPS compliant, one of the largest transshipment hubs in Latin America.

## What each key view showed

- **z15-z16 wide (9.362, -79.882):** the full terminal complex on the bay peninsula. Quay with gantry cranes and berthed ships on the west, dense container stacking yard filling the peninsula, large warehouse buildings (purple/gray/blue roofs) on the landward east side, surrounded by the Colon Free Zone industrial fabric.
- **z18 tight container slots (9.3655, -79.883):** blue STS cranes at the quay, RTG/ASC straddle rows over long parallel runs of container ground slots (each colored block a container), a large RoRo vehicle staging area and a red-roofed terminal/workshop building on the east. Yard tractors visible.
- **z17 east landside (9.365, -79.879):** the main internal truck artery and an intersection; container stacks and reefer area west, equipment/chassis and warehouse yards east.
- **z17 warehouse cluster (9.369, -79.876):** a row of large parallel warehouse buildings with trailer parking and dock aprons between them; rail tracks on the far east edge.
- **z17 NE boundary (9.3705, -79.8745):** live rail tracks carrying container flat cars (Panama Canal Railway intermodal yard), confirming rail service. Forest beyond.

## Gate / guard / dock determinations

- **Truck gate: YES (high confidence).** Published terminal specs (GA Tech Panama portal / LCA assessment) state MIT has a main truck gate with **3 entrance lanes and 3 exit lanes**, plus a separate rail intermodal ramp with 2 in / 2 out lanes. MIT is ISPS compliant with perimeter fencing, gates and CCTV. Street View (pano h6g9FF..., 2023-03) on the landside approach road looks west into the secured terminal past channelizing jersey barriers toward the gantry cranes. entryLanes 3, exitLanes 3, entry/exit separate.
- **Guard shack: YES (inferred, high confidence).** An ISPS-compliant 3.5M TEU terminal with a 3+3-lane gate operates staffed security/guard booths. Not individually resolved in imagery because Google car coverage stops at the public road outside the secured estate, but corroborated by the ISPS / CCTV / controlled-access references. remoteGs false.
- **Multi-step: YES.** A modern automated container gate is itself multi-stage (gate-in, OCR, TOS check, then yard), and the separate rail intermodal ramp with its own 2+2 lanes adds a second controlled checkpoint.
- **Dock doors:** marine container terminal, so classic OTR dock doors are near-zero. The attached east-side warehouses carry the loading doors. z17 satellite plus a 2022-10 Street View (pano IL3eQ...) show large roll-up loading shutters on a warehouse face. dockDoorCount about 8 (0-10 band), low confidence at this resolution.
- **Scale: YES (inferred).** Weighbridges are standard for VGM/weight enforcement at a terminal this size; not individually pinpointed, flagged uncertain.

## Yard zones and counts

- **perimeter:** traced as an oriented ring around the secured estate (waterfront on the west, landside boundary road and rail on the east), about 140 acres including the 37 ha paved container yard plus warehouses, RoRo yard and rail ramp.
- **dropYards:** two rings over the densest container stacking blocks (peninsula center and north).
- **dockAprons:** one ring over the east warehouse loading face.
- **yardMetrics:** dockDoorCount 8 (warehouse only), trailersVisible ~80, trailerParkingCapacity ~9,000 (container/chassis ground-slot estimate for a 37 ha high-density yard, flagged uncertain), truckGateCount 1, buildingCount ~9, siteAreaAcres ~140, railServed true.

## Web findings

- Crowley runs twice-weekly Colon liner service and operates bonded/non-bonded warehouse plus cross-dock services out of its Colon hub at Puerto de Manzanillo; FreightWaves reported Crowley tripling its Panama warehouse space.
- MIT: 37 ha paved yard, 8 berths, 3.5M TEU, 19 STS cranes, ASCs/RTGs, 2,400+ reefer plugs, ABB crane OCR, ISPS compliant, 24/7 stevedoring.
- Gate: 3 entrance + 3 exit lanes; rail intermodal ramp 2 in / 2 out; perimeter fencing, gates, CCTV.
- Rail: Panama Canal Railway intermodal access, confirmed in satellite at the NE boundary.

## Final confidence

**High.** Facility positively identified, gate/lane configuration and rail confirmed from published terminal specs and satellite. Lower-confidence items (flagged uncertain): exact warehouse dock-door count, container ground-slot capacity, trailers visible, site acreage, and the scale, none of which are individually resolvable from the available imagery given the secured estate has no interior Street View.
