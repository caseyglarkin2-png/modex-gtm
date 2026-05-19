# Deep-Audit Dossier — CJ Logistics, Dallas TX Regal Row (idx 18)

## Facility
- **Name:** CJ Logistics - Dallas TX (Regal Row)
- **Type:** Distribution Center
- **Address:** 151 Regal Row, Dallas, TX 75247
- **Resolved center:** 32.8130, -96.9013

## Location confirmation
Roster geocode (32.812685, -96.901636, ROOFTOP, moved 55 m) landed directly
on a large warehouse. Web search confirmed 151 Regal Row as **Prologis
Stemmons Industrial Center - Building 11**, a 217,290 sq ft warehouse built
in 1974, Class B, 10.49-acre lot, multi-tenant. Panjiva lists CJ Logistics
USA Corp at "151 Regal Row 112" — i.e. CJ occupies a suite within this
multi-tenant building. Probed satellite z16-z20 and Street View (2025).

## Site layout
- Single long rectangular warehouse, oriented E-W, in the dense Stemmons
  industrial corridor along the Trinity River.
- **North:** A dock face and an open truck court / parking lot; Regal Row
  beyond.
- **South:** A second dock face and an open truck court shared with the
  adjacent Stemmons building.
- **East:** The office front (1970s decorative brick-arch facade) faces
  Regal Row.
- **West:** More trailers / open paving; adjacent Stemmons buildings.

## Key views
- **z16/z17:** Confirmed building among a cluster of Stemmons warehouses.
- **z18/z20:** Cross-dock layout — dock doors with trailers backed in on
  BOTH the north and south faces.
- **Street View (2025) Regal Row:** Open public industrial street; the
  building's office front and dock courts are directly accessible. Trucks
  parked along the open north dock court; long bank of dock doors with
  levelers visible. No fence, no gate, no booth anywhere.

## Gate / guard-shack / dock determinations
- **truckGate: false.** Open multi-tenant industrial park. No perimeter
  fence, no barrier arm, no checkpoint. Dock courts on both faces connect to
  Regal Row via open driveways.
- **guardShack: false.** No guard booth on the property.
- **remoteGs: false.** No gate, therefore no remote check-in.
- **shipRcvSeparate: true.** Cross-dock building — distinct dock banks on the
  north face and the south face, each with its own truck court.
- **dockDoors: 50+.** Dock doors on both faces; estimated ~60 total
  (low-confidence overhead count, older building).
- **dropArea: 10-25 / dropYard: false.** Trailers park along the open dock
  courts; no dedicated marked trailer-storage lot.

## Yard zones and counts
- **perimeter:** ~156 m x 262 m, ≈10.1 acres (matches the 10.49-acre listed
  lot).
- **truckGate zone:** the open NE driveway off Regal Row.
- **dockAprons:** north dock court strip and south dock court strip.
- **dropYards:** none distinct.
- **dockDoorCount ~60**, **trailersVisible ~15**, **buildingCount 1**,
  **railServed false**.

## Web findings
151 Regal Row is Prologis Stemmons 11 — a 1974, 217,290 sq ft Class B
multi-tenant warehouse/distribution building, leased NNN, minutes from the
Dallas CBD and Love Field, with easy I-35E and TX-183 access. CJ Logistics
USA Corp operates from Suite 112 (Panjiva buyer report).

## Confidence
**High.** Building identity is firmly established (Prologis listing matches
address, size, and lot). 2025 Street View clearly shows an open,
unfenced, ungated multi-tenant facility. Dock count is an overhead estimate;
because CJ occupies only a suite, exact CJ-specific dock allocation cannot be
isolated from imagery.
