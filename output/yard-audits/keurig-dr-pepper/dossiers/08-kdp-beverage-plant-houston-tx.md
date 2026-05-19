# Deep-Audit Dossier — KDP Beverage Plant, Houston TX (idx 8)

## Facility
- **Name:** KDP Beverage Plant - Houston TX
- **Type:** Manufacturing - Beverage
- **Roster address (approximate / wrong):** 5301 Polk St, Houston, TX 77023
- **Resolved address:** 2400 Holly Hall St, Houston, TX 77054
- **Resolved center:** 29.683800, -95.394000

## Step 0 — Location confirmation
The roster pin (5301 Polk St, GEOMETRIC_CENTER, flagged "Address
approximate, deep-audit to refine") landed in a generic dense-industrial
area of east Houston with no clear KDP facility. Web research resolved the
correct site: TruckMap, iBegin, Kompass, Yelp and Waze all list "Dr Pepper
Bottling Co of Houston" / "Dr Pepper Snapple Group" / Keurig Dr Pepper at
**2400 Holly Hall St, Houston, TX 77054** (intersection Almeda Rd & Holly
Hall St), with reported coordinates near 29.6853,-95.3937. Satellite
probing there revealed a large beverage warehouse/plant with vertical
syrup/concentrate silos and an extensive on-site trailer yard — consistent
with a beverage manufacturing/bottling facility. Center locked on the
building mass at 29.6838,-95.3940.

## What the key views showed
- **Wide z17:** Large gray-roof warehouse/plant building filling most of
  the parcel; trailer yard wrapping the south and east faces; a large
  employee parking lot at the NE; SH-288 freeway + rail corridor along the
  east edge; surrounded by apartment complexes — dense urban setting.
- **z18-z19 south & east:** Dozens of blue/white trailers parked in rows
  along the south building face; the east side shows trailers, tractors,
  and vertical concentrate silos.
- **Street View, west wall (2026-03):** Solid windowless concrete
  warehouse wall fronted by chain-link fence topped with barbed wire — a
  secured perimeter.
- **Street View, NW corner (2024-06):** A gated driveway between the
  building and the syrup silos leads into the fenced truck yard; a
  tractor-trailer parked inside near the building; chain-link fencing
  continuous around the corner.
- **Street View, Holly Hall St frontage:** Tree-lined grassy strip with
  the building wall behind; the NE section is the open employee parking
  lot. Tractor-trailers observed queued/parked along the Holly Hall curb.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE.** The truck yard, docks and trailers are entirely
  inside a fully-enclosed chain-link-plus-barbed-wire perimeter. The truck
  entrance is a gated driveway at the NW corner off Holly Hall St. An
  enclosed urban barbed-wire compound of this type runs a controlled gate.
- **guardShack: FALSE (uncertain).** No multi-sided staffed booth
  straddling the truck lane could be confirmed. A small structure sits
  near the NW driveway but its function is unclear — flagged uncertain.
- **remoteGs: TRUE (uncertain).** Set true because a controlled gate
  exists but no staffed booth was confirmed (implying kiosk / call-box /
  app check-in). Would flip if a manned booth is present.
- **backupSensitive: TRUE.** Tractor-trailers were observed queued along
  the Holly Hall St curb; the gate-to-dock approach is short, so a queue
  at the gate spills onto the public street.
- **dockDoors: 25-50.** ~25-40 doors estimated across the south and east
  building faces — indirect overhead count.
- **dropArea: 50+.** Trailer drop yard wrapping the building with dozens
  of parked trailers.

## Yard zones and counts
- **Perimeter:** ~23-acre compact urban parcel.
- **Truck gate zone:** the NW driveway off Holly Hall St.
- **Drop yards:** two — the south-face trailer rows and the east-side
  trailer/tractor area.
- **Dock apron:** the south-face apron in front of the main dock bank.
- **yardMetrics:** ~30 dock doors, ~90 trailers visible, ~130 capacity,
  1 truck gate, 2 buildings, ~23 acres, not rail-served (rail in the
  adjacent SH-288 corridor only).

## Web findings
TruckMap, iBegin, Kompass, Waze and Yelp consistently identify 2400 Holly
Hall St as the Dr Pepper Bottling Co of Houston / Keurig Dr Pepper
beverage facility (phone 713-799-1024 / 713-799-8783). Consistent with
the observed beverage plant: warehouse footprint, syrup/concentrate
silos, large trailer fleet operations.

## Final confidence
**Medium.** The facility location was positively re-resolved via multiple
independent web sources and confirmed by satellite. The truck gate call
is well-supported by the fully-fenced barbed-wire perimeter. However the
guard-shack vs. remote-check-in distinction could not be visually
confirmed (Street View does not cleanly capture the gate driveway), so
guardShack/remoteGs and the dock/trailer counts are flagged uncertain.

- Gate verdict: YES — controlled truck gate (fenced barbed-wire compound)
- Guard-shack verdict: NO staffed booth confirmed — likely remote check-in
- Confidence: medium
