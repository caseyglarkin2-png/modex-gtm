# Deep-Audit Dossier — CJ Logistics, Romeoville IL Normantown (idx 16)

## Facility
- **Name:** CJ Logistics - Romeoville IL (Normantown)
- **Type:** Distribution Center
- **Address:** 1401 W Normantown Rd, Romeoville, IL 60446
- **Resolved center:** 41.6510, -88.1310

## Location confirmation
Roster geocode (41.649955, -88.132968, ROOFTOP, moved 40 m) landed directly
on a large warehouse on Normantown Rd. Web search (Dun & Bradstreet, Kompass,
CJ Logistics newsroom) confirmed CJ Logistics America operates a DC at 1401 W
Normantown Rd, Romeoville — a former DSC Logistics facility, "conveniently
located off I-55 and Weber Rd." Probed satellite z16-z21 and Street View from
2018-2025 around the Normantown Rd frontage.

## Site layout
- Single large rectangular warehouse, oriented roughly E-W.
- **North:** Normantown Rd; the building's main dock face faces the road,
  fronted by a fenced truck court.
- **South:** A large retention pond / wetland buffer.
- **West:** NW-corner office and employee car parking; adjacent warehouses
  beyond.
- **East:** Trailer drop yard with marked stalls; open land/scrub beyond.

## Key views
- **z16 wide:** Single warehouse; truck court N, drop yard E, pond S.
- **z18/z19:** NW office, car parking; dock doors with trailers along the
  north face.
- **z20/z21 dock face:** Continuous bank of dock doors with trailers backed
  in along the entire north face.
- **Street View (2018, 2022, 2023, 2025):** Black ornamental (wrought-iron-
  style) perimeter fence runs along the whole Normantown Rd frontage with
  trailers backed into docks visible behind it. A driveway opening breaks the
  fence into the truck court.

## Gate / guard-shack / dock determinations
- **truckGate: true.** The truck court is enclosed by a continuous black
  ornamental perimeter fence; the truck driveway passes through a gate
  opening in that fence — a controlled truck entrance.
- **guardShack: false.** No staffed booth structure is visible at the
  truck-court driveway opening in any Street View probe.
- **remoteGs: true.** Gate present, no guard shack — implies kiosk / call-box
  / app check-in.
- **dockDoors: 50+.** Continuous bank of dock doors along the north face with
  trailers backed in; estimated ~90 doors (low-confidence overhead count).
- **dropArea / dropYard: 10-25 / true.** Marked trailer drop stalls on the
  east side of the building.

## Yard zones and counts
- **perimeter:** ~289 m x 466 m of developed property, ≈33.3 acres
  (excludes the retention pond to the south).
- **truckGate zone:** the fence-opening driveway off Normantown Rd.
- **dropYards:** east-side marked trailer stalls.
- **dockApron:** strip along the north dock face.
- **dockDoorCount ~90**, **trailersVisible ~75**, **drop capacity ~60**,
  **buildingCount 1**, **railServed false**.

## Web findings
1401 W Normantown Rd is a CJ Logistics America DC (former DSC Logistics;
DSC was acquired by CJ Logistics in 2018). Cited in CJ Logistics' OneTrack
inventory-resolution case study; D&B/Kompass list it as a Romeoville
warehousing site. Active hiring for forklift operators.

## Confidence
**Medium.** Building identity and layout are clear. The perimeter fence is
unambiguous in Street View; the lack of a visible guard booth supports a
remote (kiosk) check-in classification, though the exact gate hardware could
not be resolved through roadside trees. Dock count is an overhead estimate.
