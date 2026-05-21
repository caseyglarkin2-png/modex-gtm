# Deep-Audit Dossier — idx 21

## FedEx Ground Hub - Middletown PA (Harrisburg)

- **Type:** Ground regional sortation hub
- **Address:** 111 Fulling Mill Rd, Middletown, PA 17057
- **Resolved center:** 40.23310, -76.73080
- **Confidence:** medium

## Location confirmation (Step 0)
The roster geocode (40.232571, -76.730393, ROOFTOP, moved 4478 m) landed on the
central sort building. Satellite probes z15-z20 around the point showed a large
L-shaped distribution building with cross-dock loading doors and massive trailer
drop yards — consistent with a Ground sortation hub. Street View panos along the
internal access driveway (captured 2019 and 2023) clearly show the **FedEx logo**
on the building face and FedEx tractors/trailers parked in the yard, positively
confirming this is the FedEx Ground facility. Address corroborated by Loc8NearMe
and D&B listings for 111 Fulling Mill Rd.

## What the key views showed
- **Wide (z15-z17):** A campus inside a larger industrial park near Middletown.
  Central L-shaped sort building (dark roof), a second long diagonal cross-dock
  building to the north, and extensive trailer drop yards filling the NW. Other
  buildings at the far NW and to the south are separate (non-FedEx) tenants.
- **Tight (z18-z20):** Cross-dock doors with trailers backed in on every face of
  both buildings. Angled and rowed trailer parking. Hundreds of drop trailers in
  the NW yard. Employee car parking and the office/lobby block on the south side.
- **Perimeter fencing:** Thin dark fence lines clearly visible along the N, NW,
  W and NE boundaries of the truck yard — the yard is fully secured.
- **Street View:** The south frontage is an elevated grade behind a retaining
  wall (no entrance). The property is reached by an open industrial driveway off
  the internal park road; FedEx equipment visible inside.

## Gate / guard-shack / dock determinations
- **truckGate = true.** The truck yard is fully fenced (perimeter fence confirmed
  on multiple sides); the truck route enters the secured yard through a
  controlled point.
- **guardShack = false (uncertain).** No staffed booth could be positively
  identified at the yard entrance in any satellite crop or Street View pano.
  Flagged as uncertain.
- **remoteGs = true (uncertain).** Per rubric: gate present, no confirmed booth
  implies kiosk / remote check-in. Flagged uncertain.
- **dockDoors = "50+".** Long banks of cross-dock doors with trailers backed in
  on all faces of two buildings. Estimated ~230 doors total.

## Yard zones and counts
- **perimeter:** ~40.2304 S / -76.7338 W / 40.2360 N / -76.7282 E — ~76 acres
  covering the FedEx campus (both buildings + drop yards + parking).
- **dropYards:** large NW yard (hundreds of trailers in long rows) plus a smaller
  NE yard. dropArea band = 50+, dropYard true.
- **dockAprons:** strips in front of dock banks on the central building (W and E
  faces) and the northern cross-dock building.
- **staging:** paved area on the south side between parking and yard.
- **yardMetrics:** ~230 dock doors, ~420 trailers visible, ~600 trailer capacity,
  1 truck gate, 3 buildings, ~76 acres, no rail spur.

## Web findings
FedEx Ground at 111 Fulling Mill Rd, Middletown PA 17057 — confirmed operational
Ground facility in the Harrisburg-Carlisle metro (Dauphin County). Separate
nearby FedEx Ship Center at 200 Fulling Mill Rd and FedEx Freight at 300 Fulling
Mill Rd — distinct facilities, not this site.

## Final confidence
**Medium.** Facility identity is certain and the layout (campus, drop yards, dock
banks, perimeter fence) is clear. The guard-shack / remote-gate call could not be
visually confirmed from available imagery — those fields are flagged uncertain.
