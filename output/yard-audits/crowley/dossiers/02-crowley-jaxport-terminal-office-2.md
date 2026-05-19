# Deep-Audit Dossier — Crowley JAXPORT Terminal Office #2 (idx 2)

**Facility:** Crowley JAXPORT Terminal Office #2 — Jacksonville, FL
**Type:** Marine terminal / container yard
**Roster address:** 1163 Talleyrand Avenue, Jacksonville, FL 32206
**Audited center:** 30.337571, -81.628575

## Step 0 — Site identification

1163 Talleyrand Avenue is **Crowley Port Office #2**, at the southern end of
the Talleyrand terminal complex. The roster geocode reported `movedMeters:
null` (low precision), so I verified by imagery and web research. Satellite
(z16-z21) and Street View (Feb 2025) show a fenced container/trailer yard with
a long warehouse (matching the ~10,000 sqft warehouse Crowley lists for this
office) and a "CROWLEY" sign on Talleyrand Avenue. Web research confirms Office
#2 handles Puerto Rico, Port Transfers, Breakbulk/NIT, Car Haulers, individual
vehicle shippers, and Cross Dock; vehicle receiving M-F 0800-1600.

## Key views

- **z15 / z16 wide:** Southern Talleyrand industrial port area — trailer/
  container parking, warehouses, tank farm, riverside barge berth, heavy rail
  yards along the west edge.
- **z19 over pin:** Long blue/white-roofed warehouse with adjacent small office
  and cargo (palletized) storage.
- **Street View 2025 along Talleyrand Ave:** "CROWLEY" sign and Crowley trailer
  fronting the warehouse; chain-link fencing along the road.
- **Street View at gate (30.3383, -81.6300):** A swing/slide gate in the fence
  line, a truck passing through, a "NO STANDING" sign on the road, and a small
  canopied booth/kiosk structure beside the gate.

## Gate / guard / dock determinations

- **Truck gate — TRUE.** A controlled swing/slide gate in the chain-link
  perimeter on Talleyrand Avenue; truck observed transiting it.
- **Guard shack — TRUE (low confidence).** A small canopied booth/kiosk
  structure sits beside the gate. Given port TWIC access control a staffed
  booth is expected, but the structure is modest — flagged uncertain; it could
  be an unmanned check-in kiosk, in which case remoteGs would be true.
- **remoteGs — FALSE** (booth present) — flagged uncertain alongside guardShack.
- **backupSensitive — TRUE.** The gate opens straight onto Talleyrand Avenue, a
  two-lane through road with a posted "NO STANDING" sign — minimal queue room.
- **Docks:** The long warehouse has loading doors on the yard-facing side
  (~8 estimated, banded "0-10", low confidence — port warehouse, not a standard
  dock bank).

## Yard zones & counts

- **Perimeter:** ~32 acres covering the Office #2 container yard + warehouse
  block.
- **Drop yard — TRUE.** Container/trailer storage yard north of the warehouse;
  ~70 trailers visible, capacity ~150, banded "25-50".
- **Rail-served — TRUE.** Heavy rail yards run immediately west/southwest;
  spurs serve the Talleyrand terminal complex.
- **Buildings:** ~4 (warehouse, office, ancillary structures).

## Web findings

crowley.com / chamberofcommerce listing: Office #2 at 1163 Talleyrand Ave,
(904) 727-2646, M-F 0730-1600; services include Puerto Rico, Breakbulk, Car
Haulers, Cross Dock; $85 escort fee; the broader Talleyrand terminal advertises
4 pass-through lanes, 3 scales, rail access, and a 10,000 sqft warehouse.

## Confidence

**Medium.** Facility identified and the gate confirmed, but the guard-booth vs.
unmanned-kiosk distinction, dock-door count, lane counts, and presence of a
scale at this specific gate could not be resolved with full certainty — all
flagged in uncertainFields.
