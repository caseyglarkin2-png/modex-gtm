# Deep-Audit Dossier — Home Depot RDC, Dallas TX (idx 3)

**Facility:** Home Depot Rapid Deployment Center (DC #5023 / XD06)
**Roster address:** 2300 Beckleymeade Ave, Dallas, TX 75237 (actual zip 75232)
**Roster coords:** 32.639055, -96.852104 (geocoding-api, ROOFTOP, movedMeters 5664)
**Resolved coords:** 32.63905, -96.85100
**Final confidence:** HIGH

---

## Step 0 — Location resolution

Despite a large `movedMeters` (5664), the roster's final lat/lng land **directly
on the RDC rooftop** — the geocoder corrected a street-range guess to the
rooftop. The building is a long warehouse at 2300 Beckleymeade Ave in the
**Dallas Logistics Hub** in south Dallas (zip 75232). SupplierWiki and an FCC
industrial-radio license record both tie this address to **HD DC #5023**, an
RDC also carrying the XD06 (rapid-deployment) designation. Confirmed.

## Key views

- **z16-z18 satellite:** a long cross-dock building with dock doors and
  backed-in trailers along **both** long faces, surrounded by dense trailer
  parking; the office/employee parking sits at the NW corner. Neighboring large
  warehouses belong to other Dallas Logistics Hub tenants.
- **z19 satellite of the truck-side:** long rows of parked trailers (drop yard)
  on the west/south side; an internal road and small structure at the NW corner.
- **Street View on Beckleymeade Ave (2025):** the decisive view — a
  **swing/sliding gate spans the truck entrance driveway**, set well back from
  the road behind a deep paved apron. Full perimeter security fencing (black
  ornamental fence transitioning to chain-link) wraps the property; trailers are
  parked inside the fence line. A small structure beside the gate is the guard
  booth.

## Gate / guard-shack determination

- **truckGate: true** — CONFIRMED. Street View clearly shows a gate across the
  truck driveway with full perimeter fencing.
- **guardShack: true** — a small 1-3-vehicle-footprint structure sits just
  inside the gate (visible in satellite and Street View). `remoteGs` false.
- **preGateStaging / postGateStaging: true** — deep apron outside the gate plus
  an internal yard for holding before the docks.
- **drivewayLong: true** — the gate-to-dock approach easily holds a 3+ truck
  queue; the gate is set far back from the public road so a queue would not
  spill out (`backupSensitive: false`).
- **entryExitTogether: true** — single gated entrance point.

## Yard zones and counts

- **Perimeter:** ~55 acres around the RDC building, dock aprons and drop yard.
- **shipRcvSeparate: true** — classic RDC cross-dock: receiving docks on one
  long face, shipping docks on the opposite face.
- **dockDoorCount ~130** across both long elevations of a ~550K sq ft RDC
  (estimate — backed-in trailers obscure an exact count; listed uncertain).
- **trailersVisible ~200; trailerParkingCapacity ~300** — very heavy trailer
  density, typical of an RDC's high-turn replenishment flow.
- **dropArea: 50+; dropYard: true** — dedicated trailer drop rows on the west/
  south side.
- **buildingCount 1; railServed false; scale false.**

## Web findings

- HD RDCs (Deaton's foundational 2007 architecture) are ~550K sq ft high-turn
  store-replenishment cross-docks; the Dallas RDC #5023 carries an IFC-related
  XD06 code, meaning inbound supplier consolidation is co-located.
- Driver forums reference gate check-in and drop-and-hook operation at HD Dallas
  DCs — consistent with the confirmed gated, guarded entrance.

## Final confidence: HIGH

Building positively identified; gate and guard booth confirmed from Street View;
cross-dock layout and drop yard clearly visible. Only exact lane and dock-door
counts are estimates.
