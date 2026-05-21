# Deep-Audit Dossier — idx 07

## DHL Supply Chain — Mann+Hummel DC — Cowpens SC

**Type:** Dedicated Customer Distribution Center (filtration)
**Resolved coordinates:** 35.06105, -81.78200
**Confidence:** High

## Step 0 — Locating the facility

Roster lat/lng (35.062467, -81.776912) was ROOFTOP precision (moved 44m) but landed on
the NE *edge* of the building. Re-centered on the single massive cross-dock warehouse at
35.0610, -81.7820.

Web research confirms this as the **DHL Supply Chain / Mann+Hummel distribution center**,
600 Webber Drive, Cowpens SC — a 1,401,200 sq ft speculative building (Evans General
Contractors / "Project Sunny Slope"), opened July 2021, $92.7M DHL investment, 249 jobs,
dedicated to Mann+Hummel filtration products. It is the largest single building in the
DHL roster.

## Key views

- **Wide satellite (z16-17):** A single, enormous warehouse running diagonally SE-NW,
  parallel to I-85. Dock doors with trailers backed in along BOTH long faces (the NW
  face and the SE/highway face). A perimeter truck-court loop road wraps the entire
  building. Employee parking at the NE end.
- **Entrance (z19-20):** A divided 2-lane entrance drive from Webber Drive on the NE
  side leading into the truck court. No guard booth structure visible.
- **SW end:** Truck-court loop road continues around the SW end; large graded/undeveloped
  area beyond (future expansion).
- **Street View (Apr 2024):** From Webber Drive, the white green-trimmed Mann+Hummel
  building is visible set well back; chain-link perimeter fencing; turn lane painted on
  the road toward the entrance.

## Gate / guard-shack / dock determinations

- **truckGate = true.** Single controlled, fenced entrance off Webber Drive (NE side).
  Divided 2-lane drive, long internal approach.
- **guardShack = false.** No staffed booth visible at the entrance in z20 satellite or
  Street View — modern spec-building controlled entry.
- **remoteGs = true.** Gate present, no guard booth — kiosk/remote check-in inferred.
- **dockDoors = 50+.** Cross-dock with continuous dock-door rhythm on both long faces;
  roster cites 104 dock doors.
- **shipRcvSeparate = true (medium confidence).** Two opposite dock faces suggest split
  shipping/receiving.

## Yard zones & counts

- **Perimeter:** large rural campus parcel; the building runs diagonally ~530m long.
  Estimated fenced parcel ~90 acres (perimeter bounding box overstates the diagonal lot).
- **Drop yards:** trailer rows in the SW yard and on the NE apron.
- **Dock aprons:** the truck courts along both long building faces.
- **Staging:** truck court inside the entrance, ahead of the docks.
- **Metrics:** ~104 dock doors; ~95 trailers visible; ~220 trailer parking capacity;
  1 truck gate; 1 building; ~90 acres (low-medium confidence); not rail-served.

## Web findings

DHL Supply Chain established the Cowpens operations complex in April 2021 ($92.7M, 249
jobs, Cherokee County). Building is a 1,401,200 sq ft spec warehouse with tenant
improvements for Mann+Hummel; operations went live July 2021. Site uses robotics /
LocusBot mobile robots. Sources: SC Governor's office, Cherokee County Development
Board, Evans General Contractors, Mann+Hummel, Area Development, CoStar.

## Final confidence

**High** — facility positively identified and confirmed by web research; recent
imagery clear. Guard-shack/remote-GS, exact dock count, ship/receive split and the
exact site acreage flagged as uncertain.
