# UNFI — Gilroy CA DC — Deep-Audit Dossier

**Roster idx:** 18
**Facility:** UNFI Gilroy Distribution Center
**Address:** 6351 Cameron Blvd, Gilroy, CA 95020
**Resolved center:** 36.99605, -121.54500
**Confidence:** High

---

## Location resolution

The roster coordinate (36.995984, -121.54485) landed on a large
rooftop-solar-clad distribution building in the Gilroy industrial fringe.
Web search confirmed the address (Yelp, BBB, UNFI press release): a ~425,000
sq ft DC at 6351 Cameron Blvd that opened in 2016, built to LEED Gold, serving
Northern California natural/organic/specialty distribution. A 2026-04 Street
View along Cameron Blvd shows the **UNFI** sign and logo with flagpoles at the
property front — positive identification. The large building immediately to
the NW is a separate, unrelated facility on its own parcel. Building locked.

## What the imagery showed

- **Wide satellite (z16-z18):** A single large DC building with extensive
  rooftop solar arrays, set among row-crop farmland on the south and west.
  Docks and the truck court run along the **NW** face; the office sits at the
  SW corner with a circular front drive.
- **Truck side (z19):** Docks line the NW building face with trailers backed
  in; a bank of drop trailers (no tractors) is parked in the wide NW truck
  court. Generous paved holding area.
- **Entrance (z19 + Street View, 2026-04):** The truck court connects to
  Cameron Blvd via open paved driveways at the NE and SW; Cameron Blvd curves
  along the NW side of the property.

## Gate / guard-shack determination

- **truckGate: FALSE.** The truck court connects to Cameron Blvd by open
  paved driveways. z19 satellite of both connections and 2026-04 Street-View
  along Cameron Blvd show no barrier arm, no sliding/swing gate, no checkpoint
  pinch-point, and no perimeter fence at the road. The UNFI monument sign and
  flagpoles are decorative front-of-house — the truck entrances are open.
- **guardShack: FALSE.** No staffed booth — no small 1-3-vehicle-footprint
  structure beside the truck lane in any imagery.
- **remoteGs: FALSE.** Requires a gate to be present; there is none.

## Yard zones and counts

- **Perimeter:** ~33 acres for the developed footprint — the DC, the NW
  truck court / drop yard, employee and office parking. Undeveloped farmland
  on the SE of the parcel is excluded from the active-yard perimeter.
- **Drop yard:** NW truck-court bank of parked drop trailers — `dropArea`
  25-50; `dropYard: true`.
- **Dock apron:** NW face of the building; ~40 dock doors estimated
  (`dockDoors` 25-50). Single dock cluster — `shipRcvSeparate: false`.
- **postGateStaging: true** — wide interior truck court before the docks.
  `drivewayLong: true` — the court runs the full building length, easily
  holding a 3+ truck queue.
- **yardMetrics:** ~40 dock doors, ~32 trailers visible, ~60-trailer parking
  capacity, 1 truck gate, 1 building, ~33 acres, no rail.

## Web findings

UNFI Gilroy opened in 2016 — a ~425,000 sq ft LEED Gold DC distributing
natural, organic and specialty foods, supplements, personal care, and organic
produce across Northern California; built with sustainable practices
(rooftop solar evident in imagery). 100+ employees. Operating M-F.

## Final confidence: HIGH

Facility positively identified, confirmed by the on-site UNFI signage in
2026-04 Street View; imagery clear in all key views. Flagged uncertain:
`dockDoorCount` and `trailerParkingCapacity` (overhead estimates, partly
occluded by backed-in trailers).

**3-line summary:**
Gate: no truck gate — open driveways off Cameron Blvd, no barrier/fence.
Guard shack: none.
Confidence: high.
