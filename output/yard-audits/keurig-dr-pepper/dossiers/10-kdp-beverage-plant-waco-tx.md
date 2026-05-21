# Deep-Audit Dossier — KDP Beverage Plant, Waco TX (idx 10)

## Facility
- **Name:** KDP Beverage Plant - Waco TX
- **Type:** Manufacturing - Beverage
- **Roster address (wrong / approximate):** 5301 Bagby Ave, Waco, TX 76711
- **Resolved address:** 100 Aviation Pkwy, Waco, TX 76705
  (Waco International Aviation Park, beside TSTC Waco Airport)
- **Resolved center:** 31.626000, -97.063500

## Step 0 — Location confirmation
The roster pin (5301 Bagby Ave, RANGE_INTERPOLATED) landed on a golf
course / apartment complex in south Waco — not an industrial facility.
Web research resolved the correct site: the Greater Waco Chamber
directory, Yelp ("Dr Pepper Seven-Up Bottling"), and the Dennis Group /
Quandel project pages all place KDP at **100 Aviation Pkwy, Waco, TX
76705**, in the **Waco International Aviation Park** next to TSTC Waco
Airport (≈8 nm NE of downtown Waco). KDP purchased a **92-acre former
Kraft-Heinz campus** with a 730,000 SF distribution center and built a
new **~811,000 SF manufacturing & warehouse building**, connected to the
DC by a tram. Satellite probing of the aviation park revealed exactly
this — a large fenced industrial campus SE of the airport hangars at
~31.626,-97.0635. Center locked there.

## What the key views showed
- **Wide z15-z16:** Large white-roof distribution building plus an
  adjacent newer building (the manufacturing addition) forming one
  campus; airport hangars to the NW; a wastewater treatment facility
  nearby; surrounded by farmland — a rural / edge-of-metro setting.
- **z17-z19 campus:** A very long dock bank along the south face of the
  DC with dozens of trailers backed in; trailer staging along the south;
  the new manufacturing building with its own dock positions.
- **Street View (2023-05 and 2025-11):** Continuous chain-link perimeter
  fence on all sides of the campus. The NW access road runs past employee
  parking; the main entrance has fencing, posted signage, a US flag, and
  a portable/modular office building. The newer manufacturing building
  (gray metal panel) was visible with construction activity in 2025-11.

## Gate / guard-shack / dock determinations
- **truckGate: TRUE.** The campus is fully enclosed by a continuous
  chain-link perimeter fence; the entrance off the NW access road is a
  controlled, fenced and signed gateway. A 92-acre flagship KDP
  manufacturing + DC campus of this scale runs a controlled truck gate.
- **guardShack: FALSE (uncertain).** No multi-sided staffed guard booth
  could be definitively confirmed. A portable/modular office building
  sits near the entrance but whether it functions as a gatehouse or a
  site office is not certain — flagged uncertain.
- **remoteGs: TRUE (uncertain).** Set true because a controlled gate
  exists but a staffed booth was not confirmed. Would flip if a manned
  gatehouse is verified.
- **dockDoors: 50+.** Estimated 60-80+ doors — a very long DC dock bank
  plus the manufacturing building's docks. Indirect overhead count.
- **dropArea: 50+.** Large trailer drop/staging yard with well over 50
  trailers along the south face.

## Yard zones and counts
- **Perimeter:** ~92-acre fenced campus.
- **Truck gate zone:** the NW access-road entrance.
- **Drop yard:** the south-face trailer staging/storage lot.
- **Dock apron:** the long south-face apron in front of the DC dock bank.
- **Staging:** post-gate paved area between the entrance and the docks.
- **yardMetrics:** ~70 dock doors, ~110 trailers visible, ~180 capacity,
  1 truck gate, 2 buildings (DC + manufacturing), ~92 acres, not
  rail-served.

## Web findings
Greater Waco Chamber, Yelp, Dennis Group and Quandel confirm KDP at 100
Aviation Pkwy in the Waco International Aviation Park: a 92-acre former
Kraft-Heinz campus (730,000 SF DC) expanded with a new ~811,000 SF
manufacturing/warehouse building connected by tram. KDP is listed as a
major tenant of the aviation park. The facility produces Dr Pepper and
other KDP brands and is operating.

## Final confidence
**Medium.** The facility location was positively re-resolved via multiple
independent web sources and confirmed by satellite. The truck gate call
is well-supported by the fully-fenced perimeter and the scale of the
campus. However the guard-shack vs. remote-check-in distinction could not
be visually confirmed, and satellite tiles span active construction —
so guardShack/remoteGs and the dock/trailer counts are flagged uncertain.

- Gate verdict: YES — controlled truck gate (fully fenced 92-acre campus)
- Guard-shack verdict: NO staffed booth confirmed — likely remote / staffed
  gatehouse unverified
- Confidence: medium
