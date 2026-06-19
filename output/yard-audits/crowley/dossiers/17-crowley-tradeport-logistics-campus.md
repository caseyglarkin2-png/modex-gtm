# Crowley Tradeport Logistics Campus — Jacksonville, FL

**Site 17 · Deep audit · Confidence: medium**

## Resolved location
- **Address:** 1350 Tradeport Dr, Jacksonville, FL 32218 (TDC IV, built 1989, ~102,409 sq ft).
- **Coords:** 30.478125, -81.65303.
- **Setting:** Jacksonville northside, inside the International Tradeport / Imeson industrial park, adjacent to Jacksonville International Airport with road access to JAXPORT's Talleyrand, Blount Island, and Dames Point marine terminals.

### How it was confirmed
Web research fixed the address (Crowley + FreightWaves announcements name the Tradeport DC at 1350 Tradeport Dr) and gave precise coordinates (CommercialCafe/LoopNet "TDC IV" record: 30.478125, -81.653030). A city-level first probe near Tradeport Dr landed in residential/forest; the geocoded TDC IV point landed cleanly on a single large NW-SE-oriented white-roof warehouse inside the warehouse cluster. Satellite (zoom 17-20) and Street View (2022-2023 panos) confirmed the building: auto/employee parking on the NW front, office entrance on the N corner, a loading-dock apron on the SE long wall, and a drainage canal forming the SE boundary.

## What the key views showed
- **z17-18 overview:** one rectangular warehouse, long axis NW-SE. North/NW side = curved-island auto-parking lots and the office front. South/SE side = a wide concrete/asphalt loading apron.
- **Front Street View (pano EEzgJGv6ZLYoozPHb3VM7w, 2023-01):** the office/front face with employee parking and landscaped frontage. A tenant sign on the wall (not clearly Crowley in the 2023 capture — the park is multi-tenant and Crowley has announced a Jacksonville warehouse location change).
- **z19-20 dock side:** the SE long wall fronts a continuous wide apron; a small dock canopy mid-wall with two blue trailers/containers backed in; a regular but partly shadow-obscured dock-door rhythm along the wall. The apron is bounded by a canal — no perimeter fence/gate.
- **NW-end z20:** confirms the N/NW side is auto parking, not truck activity (this is the front, not the dock side).

## Gate / guard-shack / dock determinations
- **Truck gate — FALSE.** Open multi-tenant industrial park. No barrier arm, sliding/swing gate, or checkpoint pinch-point at the property line; the dock apron is reached from a shared park access drive. No gate in satellite or Street View.
- **Guard shack — FALSE.** No staffed booth at any entrance. The only apron structure is a dock canopy, not a guard booth. With no gate, **remoteGs = FALSE** as well.
- **Dock doors — band 25-50 (~26), LOW confidence.** The SE wall runs the full ~200 m length of the building and fronts a continuous loading apron; a dock-door rhythm is visible but tree/building shadow obscures much of it. Noted discrepancy: Crowley's own material cites "12 dock-high doors" for the Tradeport DC, but the 1350 Tradeport building face is long enough for materially more positions. Counted conservatively from imagery and flagged.
- **Drop area — 0-10.** Only ~2 trailers staged; an active apron, not a dedicated drop-trailer lot.

## Yard zones & counts
- **Perimeter:** ~13.5 acres traced around the parcel (parking lots NW, dock apron + canal edge SE), oriented to the building's NW-SE long axis.
- **truckGate zone:** drawn at the front/office access on the N corner (no physical gate; marks the de-facto single access point).
- **dockApron:** one long thin quad hugging the SE dock wall at the building's angle.
- **yardMetrics:** dockDoorCount 26 (est.), trailersVisible 2, trailerParkingCapacity ~12, truckGateCount 1, buildingCount 1, siteAreaAcres 13.5, railServed false.
- Street View coverage: yes at both the perimeter (pano SgmZR7sGB-OQtUSlSkkZRw, heading 151°) and the front/gate (pano EEzgJGv6ZLYoozPHb3VM7w, heading 41°).

## Web findings
- Crowley's Jacksonville Tradeport Distribution Center provides LCL/FCL warehousing — receiving/segregation, labeling, pack/crate, pick-and-pack/kitting, storage, inventory management, retail-schedule deliveries, HazMat handling. Hours M-F 8am-5pm.
- 1350 Tradeport Dr = TDC IV, ~102,409 sq ft, built 1989, in the 425-acre master-planned International Tradeport at the I-95/I-295 nexus by JAX airport.
- Crowley has publicly announced a Jacksonville warehouse location change; tenancy/branding at this exact building in the 2023 imagery is ambiguous, but the address audited is the Crowley Tradeport facility.

## Final confidence
**Medium.** Location positively resolved and the correct single warehouse confirmed by satellite + Street View. Held below high because Street View does not reach the private dock face, the dock-door count is partly shadow-obscured and conflicts with Crowley's stated 12-door figure, and the "campus" framing (vs. the single audited building inside a multi-tenant park) is ambiguous.
