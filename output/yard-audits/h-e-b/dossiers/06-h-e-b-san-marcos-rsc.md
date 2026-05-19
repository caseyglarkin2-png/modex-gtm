# Deep-Audit Dossier — H-E-B San Marcos RSC

**Facility:** H-E-B San Marcos RSC (Retail Support Center / Distribution Center)
**Address:** 2301 Hunter Rd, San Marcos, TX 78666
**Resolved center:** 29.857237, -97.963000
**Confidence:** High

## Location confirmation
The roster point (GEOMETRIC_CENTER, moved 1397 m) landed on the large industrial
complex NE of the rail corridor. Satellite probes at z16-z18 show a single large
multi-section distribution building with extensive rooftop solar, dock banks with
trailers backed in, a large trailer drop yard, and an employee parking lot — fully
consistent with an H-E-B Retail Support Center. Web search corroborates: H-E-B
Distribution Center, 2301 Hunter Rd, San Marcos, operating 24/7; reviews confirm a
text-message dock-assignment check-in process and note the delivery entrance is off
the Wonder World Drive frontage / access road, not Hunter Rd proper. The building is
positively the correct facility.

## Key views
- **Wide (z16/z17):** L-shaped/stepped RSC complex on a large parcel bounded by a
  rail corridor (SE), undeveloped land, apartments (NE) and a retail strip (S).
- **Truck gate (z20/z21 @ ~29.8601, -97.9648):** Clear truck entrance off the north
  access road — a wide paved checkpoint apron with painted lane markings that split
  around a small red-roofed guard booth.
- **Dock faces (z19/z20):** Trailers backed into docks along the NE face, the SE
  face, and the interior courtyard faces; many dozens of doors.
- **Drop yards (z18/z20):** Marked trailer parking — a large drop yard on the SW
  full of parked trailers, plus a second trailer parking area on the NE.
- **Rail (z18 @ SE):** A Union Pacific mainline runs parallel to the SE property
  line; no spur enters the property.

## Gate / guard-shack determination
- **truckGate = true.** The main truck driveway meets the north access road at a
  wide paved checkpoint with painted lane markings — a clear controlled pinch-point.
- **guardShack = true.** A distinct small red-roofed booth (~1-2 vehicle footprint)
  sits between the truck lanes on the entrance apron, visible at z20/z21. A second
  small kiosk-like structure appears in an adjacent lane.
- **remoteGs = false** (a staffed guard shack is present).
- **fastLaneOpportunity = true.** The gate apron is very wide with multiple painted
  lanes and unused paved width — clear room for an express bypass lane.
- Street View coverage of the private truck access road is unavailable; gate
  determination is from high-zoom satellite imagery, which is unambiguous.

## Yard zones and counts (overhead estimates)
- **dockDoors:** 50+ band (estimate ~110 doors across multiple building faces).
- **dropArea:** 50+ band — extensive trailer drop yard SW plus NE trailer parking.
- **trailersVisible:** ~70 in captured imagery; **capacity ~160**.
- **truckGateCount:** 1. **buildingCount:** 1 (single connected multi-section
  building). **siteAreaAcres:** ~85 (fenced perimeter; the parcel also includes
  undeveloped land outside the active yard).
- **railServed:** false.
- **postGateStaging = true:** paved holding area inside the gate before the docks.
- **drivewayLong = true:** the gate-to-dock approach is deep, can hold 3+ trucks.
- **entryExitTogether = true:** single combined entrance/exit gate group.
- **shipRcvSeparate = true:** distinct dock banks on different building faces.
- **dropYard = true:** dedicated trailer-storage lot separate from active docks.

## Web findings
H-E-B San Marcos RSC, 2301 Hunter Rd, operates 24/7. Driver reviews describe a
text-message-driven dock check-in. Delivery access is via the Wonder World Drive
frontage / private access road, not Hunter Rd.

## Final confidence
High. Facility identity and gate/guard-shack/dock determinations are unambiguous
from satellite imagery. Exact entry/exit lane counts and the precise dock-door
count are flagged as uncertain estimates.
