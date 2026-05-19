# Deep-Audit Dossier — idx 13: GP Brewton Mill, Brewton AL

## Resolved location
- **Roster point:** 31.105178, -87.072192 ("200 Hwy 41 N") — geocoded APPROXIMATE (19 m flagged, but the point actually sat near the Brewton town center, ~1 km west of the mill).
- **Resolution:** Wide satellite (z15) immediately showed the large industrial mill complex east of the town center. Web research (GP Bleached Board, Project Phoenix, Smurfit-Stone acquisition coverage) confirmed the Brewton containerboard/bleached-board mill.
- **Locked center:** ~**31.1068, -87.0658** (mill processing/warehouse core). The mill complex runs roughly 31.102–31.112 N along a rail corridor, bounded by residential/town to the west, forest to the north and east, and a pond/river to the south.
- Street View (captured 2023-05 and 2025-10) along the western mill roads positively confirmed the facility: paper-roll outdoor storage stacks, large shipping warehouses with rail cars backed in, woodyard, and the guarded mill entrance.

## Key views
- **z15/z16 wide:** Full integrated paper mill east of Brewton — processing core, woodyard with chip/log piles, multiple large warehouses, paper-roll storage yards, treatment pond.
- **z17/z18 core:** Long shipping warehouses with banks of dock doors, rail spurs running into the buildings, paper-roll storage stacks, woodyard.
- **z19 dock areas:** Trailers backed into dock faces along the long warehouses.
- **Street View — entrance:** A small staffed **guard booth** with a stop sign, beside the truck entrance lane; road continues into the warehouse area.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE (high confidence).** Street View clearly shows a controlled mill entrance: a stop sign on the entrance lane and a checkpoint at ~31.1043, -87.0681. The road leads from the public road into the fenced mill area.
- **Guard shack — TRUE (high confidence).** Street View distinctly shows a small staffed guard booth — single-vehicle footprint, windows on multiple sides, a door, and posted signs — set right beside the entrance lane. This is a classic guarded gate. `remoteGs` therefore false.
- **Docks — 10-25 band.** Long shipping warehouses present banks of dock doors with multiple trailers backed in (~12 trailers visible). shipRcvSeparate TRUE — woodyard/chip receiving is physically separate from the finished-paperboard shipping warehouses.
- **Scale — TRUE (low confidence).** A truck scale for chip/log-van weigh-in is operationally expected at an integrated paper mill; not pinpointed in imagery.
- **preGateStaging — TRUE.** Paved/gravel apron and open yard outside the gate booth give trucks room to wait.

## Yard zones and counts
- **Perimeter:** ~95 acres of developed mill footprint (processing core + woodyard + warehouses + roll-storage yards + treatment pond).
- **truckGate zone:** guarded entrance at ~31.1043, -87.0681.
- **dropYard:** paved yard near the warehouses holding parked trailers (10-25 band).
- **dockApron:** strips in front of the long warehouse dock banks.
- **staging:** apron outside the gate booth.
- **Building count:** ~16 distinct structures (processing, warehouses, support).
- **Rail-served:** TRUE — multiple spurs run directly into the warehouses; rail cars present.
- **Driveway:** long internal approach (3+ truck queue capacity).

## Web findings
- GP Brewton Mill — integrated white-top linerboard (~300,000 tons/yr) and solid-bleached-sulfate paperboard (~190,000 tons/yr); produces large paperboard rolls for corrugated boxes and paper plates.
- Former Smurfit-Stone Container mill; Georgia-Pacific purchased it for ~$355M, completing the acquisition in 2007.
- Underwent the $400M "Project Phoenix" modernization; ~400+ employees; first U.S. integrated paper mill to earn EPA ENERGY STAR certification (2021).

## Final confidence
**High.** Facility positively identified; the truck gate and guard booth were directly and clearly confirmed in Street View. The few uncertain fields (truck scale, exact dock-door count, lane counts) are honest banded/inferred estimates and do not affect the core gate/guard-shack determinations.
