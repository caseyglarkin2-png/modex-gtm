# Deep-Audit Dossier — idx 27

## Kenco / The Shippers Group — Jonesboro GA

**Type:** Distribution Center / 3PL Warehouse
**Resolved coordinates:** 33.50560, -84.34810
**Archetype:** #3 — No Gate / No GS
**Confidence:** medium

## Location resolution

The roster coordinates (33.521501, -84.353813, geocode precision APPROXIMATE, moved
834 m) pointed to a downtown Jonesboro retail strip — wrong. Web research identified
the facility as **9250 S Main Street, Jonesboro GA 30236**, a ~499,960 SF ambient
warehouse (food-grade, "Jonesboro Commerce Center" per CRE listing). Corroborated via
The Shippers Group locations page, Waze/TruckMap/Yelp listings, and — decisively — a
Street View pano (Aug 2025) showing the blue **"TSG" (The Shippers Group) logo** on
the building's upper wall. The audit is locked on the building footprint at
33.50560, -84.34810.

## Key views

- **z16/z17 wide:** Large warehouse running NW-SE, with a separate large warehouse to
  its SW. An auto-salvage yard occupies the land NE across a rail line. The site sits
  between S Main Street (GA-54, multi-lane) on the SW and the rail line on the NE.
- **z18/z19 tight:** Dock-door banks with many trailers backed in along the building's
  SW and SE faces; a continuous paved truck court; a turnaround loop at the NE corner.
  Car parking concentrated at the NW office end.
- **Street View (Aug/Sep 2025):** Building set well back behind a wooded buffer from
  S Main Street; the "TSG" logo is clearly legible. A chain-link perimeter fence is
  visible along the property line. No barrier arm, no guard booth seen at the driveway
  connections.

## Gate / guard-shack / dock determinations

- **truckGate = false (uncertain).** A chain-link perimeter fence rings the property,
  but no barrier arm or sliding/swing gate structure was visible at the driveway to
  S Main Street. The road frontage is a thick wooded buffer that obscures the precise
  entrance in Street View, so this is flagged uncertain.
- **guardShack = false (uncertain).** No staffed booth visible. Flagged uncertain due
  to the obscured entrance.
- **remoteGs = false.** No confirmed gate.
- **dockDoors = "25-50".** ~32 dock doors counted across the SW/SE truck-court faces;
  the CRE listing's "28 dock doors" corroborates the band. ~26 trailers visible.
- **dropArea = "25-50", dropYard = true.** A large paved truck court along the
  building's SW/SE faces holds ~26 parked trailers — a dedicated trailer-storage area.
- **railServed = true (uncertain).** A rail line runs immediately along the NE side of
  the building behind a tree buffer. No clearly visible active spur into the footprint
  in imagery, but the CRE listing explicitly cites "4 rail doors" — recorded true on
  that basis, flagged uncertain.

## Yard zones & counts

- **perimeter:** building + truck courts + trailer parking + car parking, ~24 acres.
- **truckGate:** probable SW driveway-to-road junction (box approximate).
- **dropYards:** one large truck-court trailer-parking strip along SW/SE faces.
- **dockAprons:** one continuous apron along the SW/SE dock faces.
- **staging:** null — postGateStaging true (open internal court before docks).
- **yardMetrics:** dockDoorCount ~32, trailersVisible ~26, trailerParkingCapacity ~45,
  truckGateCount 1, buildingCount 1, siteAreaAcres ~24, railServed true.

## Web findings

The Shippers Group (acquired by Kenco Jan 2024) operates the Jonesboro facility as a
~500,000 SF ambient distribution warehouse. CRE listings describe it as food-grade
with a ~100k SF cooler, ~28 dock doors and 4 rail doors. South-metro-Atlanta location
on the S Main St / GA-54 industrial corridor.

## Final confidence

**Medium.** The facility is positively confirmed (TSG logo on the building). Dock and
trailer counts are solid mid-range estimates corroborated by the CRE listing. The gate
and guard-shack calls are flagged uncertain because the building's S Main Street
frontage is a thick wooded buffer that hides the exact driveway entrance from Street
View — a chain-link fence is present but no checkpoint structure was confirmable.
