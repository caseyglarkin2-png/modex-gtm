# Deep-Audit Dossier — idx 66

**Facility:** Home Chef Manufacturing & Distribution Center, Baltimore MD
**Type:** Home Chef Facility
**Address:** 1701 E Patapsco Ave, Baltimore, MD 21226 (Curtis Bay)
**Resolved center:** 39.2303, -76.5776
**Confidence:** High
**Method:** deep-audit (satellite z16-z20 + Street View 2024-06 + web)

## Step 0 — Location confirmation
The supplied pin (39.230308, -76.577486) landed directly on the target. Web
research confirms 1701 E Patapsco Ave is the **Harbor Logistics Center**, a
~96-acre Curtis Bay industrial development with three matching warehouse
buildings; Home Chef leases ~150-170k sq ft (its largest plant by volume, first
East Coast site, opened 2023). Satellite imagery shows exactly three large
white-roof warehouses by the Patapsco River next to oil-storage tanks. The pin
sits on the **center/west building**, which carries the "1701" placard on its
north office face (confirmed in Street View) and has the full dock + trailer
layout consistent with a manufacturing/distribution plant. That building is the
one geofenced; the other two parcels are excluded.

## Key views
- **z16/z17 wide:** three-building park, river to W/SW, tank farm to E, rail
  yard far across the river to the W. Confirms the development.
- **z18/z19 building:** large rotated warehouse, long axis running NNE-SSW.
  Split roofline. Dock face on the SW (river) side; employee/visitor car lot on
  the NE side off the public road.
- **z20 dock face:** trailers backed into dock doors along the SW wall, with a
  long row of marked trailer-drop stalls on the river-side perimeter drive.
- **Street View (E Patapsco Ave, 2024-06):** the office frontage and parking
  lot open straight onto the public road — no fence, no gate arm, no booth.

## Gate / guard-shack / docks
- **truckGate = false.** Entrance is an open campus driveway off E Patapsco Ave.
  Street View shows no barrier arm, swing/sliding gate, or controlled
  pinch-point; the shared logistics-park drive and parking lot are uncontrolled
  and unfenced.
- **guardShack = false.** No staffed booth (≈1-3 stall footprint) at any
  entrance in Street View or satellite.
- **remoteGs = false** (no gate at all).
- **Docks:** ~35 dock doors along the SW building face (band 25-50), trailers
  backed in; ~14 trailers visible.

## Yard zones & counts
- **perimeter:** 6-vertex oriented ring tracing the Home Chef parcel inside the
  loop drives, true NNE-SSW orientation. ~9.7 acres.
- **truckGate:** rotated quad over the open north entry drive (kept for the
  driver's-eye SV centroid even though uncontrolled).
- **dropYards:** one long thin quad along the SW perimeter drive (~30 marked
  trailer stalls) — a dedicated drop area → `dropYard: true`, `dropArea` 25-50.
- **dockAprons:** one long thin quad hugging the SW dock wall at the building
  angle.
- **staging:** null (no distinct pre/post-gate holding area; open aprons).
- **Metrics:** dockDoorCount ~35, trailersVisible ~14, trailerParkingCapacity
  ~45, truckGateCount 1, buildingCount 1, siteAreaAcres 9.7, railServed false.
- **streetViewMeta:** confirmed pano on E Patapsco Ave (39.23159, -76.57690);
  headings ~201-203° point the camera south toward the gate/building.

## Setting
**Urban** — dense Curtis Bay industrial fabric (tank farms, port logistics,
rail) within metro Baltimore. Connectivity issue: false (urban, towers nearby).
**fastLaneOpportunity = true** — wide uncontrolled aprons and park drive leave
ample room to add a controlled/bypass lane if a gate were installed.

## Web findings
- Harbor Logistics Center, Curtis Bay: ~96 acres, up to 900k sq ft across three
  buildings at 1701 E Patapsco St.
- Home Chef leases ~150-170k sq ft; largest plant by volume (>30% of national
  meal solutions); first East Coast site; opened summer 2023; ~500+ jobs.

## Final confidence
**High.** Facility unambiguously identified; gate/guard/dock calls backed by
clear 2024-06 Street View and high-res satellite. Door/stall counts are honest
overhead estimates (flagged in uncertainFields).
