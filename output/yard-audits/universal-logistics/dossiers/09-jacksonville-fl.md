# Universal Intermodal Services — Jacksonville Terminal (idx 9)

**Account:** Universal Logistics Holdings
**Facility:** Universal Intermodal Services - Jacksonville Terminal
**Address:** 2050 Kings Rd, Bldg 3, Jacksonville, FL 32209
**Type:** Intermodal / Drayage Terminal (owned)
**Resolved center:** 30.34550, -81.69650
**Confidence:** Medium

## Location resolution
Roster supplied 2050 Kings Rd, Jacksonville FL with ROOFTOP geocode at
30.347409, -81.699267. Satellite probing around that point revealed a large
multi-tenant industrial complex sitting immediately **east of the CSX Moncrief
rail yard** — exactly the setting expected of a port/rail-corridor drayage
terminal. Web search confirmed Universal Intermodal Services lists 2050 Kings
Road, Jacksonville FL 32209 as its terminal and operates "40 terminals and
eight container yards" as a C-TPAT-certified bonded carrier.

The complex is shared: the long dock-door building on the south side carries an
**Amazon** banner (Street View), indicating an Amazon delivery/sortation
co-tenant. Universal Intermodal occupies the **trailer/container drayage yard**
portion — the "Bldg 3" in the address reflects the multi-building campus. The
audited center was moved to the working yard core at 30.3455, -81.6965.

## Key views
- **Satellite z16-z17 (wide):** Whole property sits between Kings Rd (north),
  the CSX Moncrief rail yard (west, dense rows of railcars/containers), woods
  to the south, and a residential street grid to the east.
- **Satellite z18-z19 (tight):** Central white building (M&R / shop) with
  tractors and bobtails parked around it; rows of parked trailers across the
  central yard; a stacked-container yard with colorful intermodal boxes in the
  NE; a large dedicated trailer-storage lot in the south, partly unpaved.
- **Street View (Kings Rd / residential approach):** Access drives run south
  off the residential streets into the yard; chain-link perimeter fencing with
  swing gates at several openings; the long dock building shows an Amazon banner
  and a continuous bank of dock doors. No staffed guard booth seen on any pass.

## Gate / guard-shack determination
- **truckGate = true (medium confidence).** The property is perimeter
  chain-link fenced; truck access is through fenced yard openings that act as
  controlled pinch points. No barrier arm was visible in Street View, but the
  fenced gate openings function as the truck gate. C-TPAT secure-terminal
  status corroborates access control.
- **guardShack = false / remoteGs = true.** No manned guard booth was observed
  at any entrance drive. Access control appears fence/gate-based with
  kiosk/office check-in rather than a staffed shack.
- **multiStep = false.** No second checkpoint stage observed.

## Docks & yard
- **dockDoors = 25-50** (~28 estimated). The long dock building's doors are
  largely Amazon-tenanted; Universal's own operation is yard- and M&R-centric
  with minimal docks of its own.
- **dropArea = 50+ / dropYard = true.** Extensive trailer and chassis storage —
  a large south trailer-storage lot, multiple in-complex trailer rows, and a
  stacked-container yard. Classic drayage drop-yard.
- **postGateStaging = true, drivewayLong = true.** Generous internal paved
  area between the fence line and the buildings; long internal spine road gives
  3+ truck queue depth.
- **fastLaneOpportunity = true.** Wide internal aprons and unused paved width
  leave ample room to add a bypass/express lane.
- **multipleFacilities = true.** Campus: dock/warehouse building, central M&R
  building, container yard, outbuildings.

## Geofence & metrics
- **Perimeter:** S 30.34300 / W -81.69900 / N 30.34780 / E -81.69520 — the
  Universal-operated trailer/container yard portion of the complex, ~48 acres.
- **Drop yards:** south trailer-storage lot; west trailer rows; central yard.
- **Dock apron:** along the long south dock building.
- **truckGateCount = 2** (north access drives); **buildingCount ≈ 5**;
  **railServed = false** — CSX rail yard is adjacent but no spur enters the
  Universal property; drayage moves are truck-only.

## Web findings
Universal Intermodal Services operates port/rail-ramp drayage from 40 terminals
and 8 container yards; C-TPAT-certified bonded carrier with secure terminal
facilities. Jacksonville is a 10-K-named owned terminal property serving the
Jacksonville port/rail corridor (CSX Moncrief yard adjacent).

## Final confidence: Medium
Location positively confirmed via address + adjacency to CSX rail yard + web
corroboration. Medium (not high) because the complex is multi-tenant — the
exact Universal-only sub-parcel boundary versus the Amazon co-tenant is not
crisply drawn, and no barrier arm / guard booth was directly visible to confirm
gate type (classed remoteGs from fence-gate evidence + C-TPAT status).
