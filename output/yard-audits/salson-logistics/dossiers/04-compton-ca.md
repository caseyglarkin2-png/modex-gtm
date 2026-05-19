# SalSon Logistics — Compton CA (18735 S Ferris Place)

**idx:** 4 · **Account:** SalSon Logistics · **Type:** Intermodal / Transload Warehouse + Secured Yard
**Resolved coordinates:** 33.860150, -118.229800
**Confidence:** Medium

## Location confirmation and an address discrepancy
The roster coordinates (33.859694, -118.229421) point to 18735 S Ferris Pl,
Compton CA 90220. Property records (PropertyShark, LoopNet) identify this as
a ~118,740 sq ft warehouse/distribution building, built 1998 — and the
business directories list it as the **headquarters of Total Transportation
Services (TTSI)**. TTSI **acquired SalSon Logistics in September 2022**, so
SalSon Logistics Services LLC (USDOT 3968944, the FMCSA record the roster
geocoded) is registered to the TTSI corporate campus at this address.

The account dossier separately describes the Compton facility as a
"brand-new West Compton site, still being built — 260,000 sq ft, 66 dock
doors, 20-acre secured yard." That description does **not** match the 1998
building at 18735 Ferris: it is a different, future facility with no public
street address surfaced. **This audit covers the building at the roster
address — the existing operational TTSI/SalSon Compton warehouse — and flags
that it is not the unbuilt West Compton site the dossier expected.**

## What the key views showed
- **Wide (z16/z18):** A dense multi-tenant logistics park in Rancho
  Dominguez / Compton; the 18735 building has a distinctive
  textured/solar-panel roof and sits among similar warehouses sharing
  paved truck courts.
- **Tight (z19/z20):** Loading docks run the NW face of the building facing
  a shared drive-court; trailers backed in at the docks (including
  SalSon-yellow trailers) and trailer/container staging in the court.
- **Street View (S Ferris Place, 2025 panos):** The building's SE face is a
  modern 2-story office front (white panels, glass curtain wall, "18735"
  signage, US flag) with open, ungated street frontage. The truck-court
  driveway off Ferris Place is open paved access with no barrier arm,
  sliding gate, or guard booth.

## Gate / guard-shack / dock determinations
- **truckGate = false.** No controlled entrance at the property line — the
  Ferris Place driveway into the dock court is open. Flagged uncertain
  because interior court gates within the logistics park were not fully
  resolvable in imagery.
- **guardShack = false.** No guard booth visible at the driveway or building
  front. `remoteGs` false (no gate).
- **dockDoors = "25-50".** Docks on the NW building face within a shared
  drive-court; ~30 doors estimated. Flagged uncertain due to the shared-court
  configuration.

## Yard zones and counts
- **perimeter:** ~8.5-acre parcel — the warehouse plus its dock court and
  trailer staging on the NW/SW sides.
- **dropYards:** trailer/container staging in the truck court SW of the
  building (10-25 band).
- **dockApron:** strip along the NW building face.
- **railServed = false:** no rail spur into the parcel.
- **multipleFacilities = false:** single building (office + attached
  warehouse) at this parcel.

## Web findings
- TTSI acquired SalSon Logistics in Sept 2022 (GlobeNewswire, MergerLinks,
  William Blair); SalSon is part of the TTSI family of companies.
- PropertyShark / LoopNet: 18735 S Ferris Pl is a ~118,740 sq ft warehouse
  built 1998, listed as the TTSI HQ.
- Transport Topics: SalSon's "West Compton" build (260K sq ft, 66 dock
  doors, 20-acre secured yard) is a separate, still-under-construction
  facility — no street address published.

## Final confidence
**Medium.** The building at the roster address is positively located, but it
is the TTSI/SalSon corporate-campus warehouse, not the dossier's planned
260K sq ft West Compton facility — the roster address and the dossier
description refer to two different sites. The ungated open-court layout and
dock/drop counts are honest estimates from a shared multi-tenant logistics
park. Recommend a roster note that the true "West Compton" greenfield site
needs a separate address before it can be audited.
