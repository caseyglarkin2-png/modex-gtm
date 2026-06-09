# Deep-Audit Dossier — Amazon ONT8 Fulfillment Center, Moreno Valley CA

- **Roster idx:** 2
- **Facility:** Amazon ONT8 Fulfillment Center
- **Type:** Fulfillment Center
- **Address:** 24300 Nandina Ave, Moreno Valley, CA 92551
- **Resolved center:** 33.86836, -117.23708
- **Method:** deep-audit (satellite + Street View + web)
- **Confidence:** high

## Step 0 — Facility confirmation

The supplied approximate coordinates (33.869115, -117.235436) landed on a road
intersection inside a dense Inland Empire industrial park crowded with large
distribution buildings, so the exact building had to be pinned down. Web research
confirmed the address (24300 Nandina Ave, Moreno Valley, CA 92551) and an
OSM/Mapcarta-tagged centroid of ~33.86829, -117.23712. Satellite probes at that
point centered cleanly on one very large warehouse.

Identity was then positively confirmed from the ground: a Street View frame on the
east road looking west (pano `_XyVu-d1jCMKtlARiIhQzA`, captured 2026-02) shows the
building's east face carrying the **"amazon fulfillment"** logo and signage, with
the 2-story office and fenced employee parking in front. This is unambiguously the
Amazon FC. Locked center at the building centroid 33.86836, -117.23708.

Note: an adjacent Amazon site (ONT6) exists in the same park; the signed building
at this address/coordinate is the correct ONT8 target.

## Site layout

A single enormous cross-dock fulfillment building (~328m x ~238m roof) on a secured
~36-acre parcel, grid-aligned (edges run essentially N-S / E-W).

- **East side:** 2-story office + large employee car park, screened from the truck
  yard by palisade fence and red curb. This is the human-facing front.
- **North face:** long bank of dock doors with trailers backed in, fronting a
  north dock apron and a trailer drop strip, then the north public road.
- **South face:** a second long dock-door bank plus a detached south dock structure,
  fronting a deep south drop yard full of numbered trailer stalls.
- **West side:** a north-south perimeter drive (shared circulation spine with the
  warehouse to the west) lined with parked trailers; this is the main truck
  circulation artery.
- **Screening:** tilt-up concrete walls run along the south and west streets;
  Street View of the south road shows a solid ~8ft wall with landscaping and **no**
  street-side dock or open driveway — the yard is fully enclosed.

## Truck gate / guard shack determination

- **Truck gate: YES.** The yard is walled/fenced on all street frontages. The only
  truck-side opening is a controlled pinch-point throat at the NW, where the west
  perimeter drive meets the north road (~33.8697, -117.2386). Overhead z21 imagery
  shows STOP striping, lane markings, and a narrowed entrance; a tractor is staged
  in the throat. An open, uncontrolled driveway is ruled out.
- **Guard shack: YES (flagged uncertain).** A small booth-footprint structure sits
  beside the inbound lane at the throat in the tightest satellite crops, and large
  Amazon FCs of this class staff a security guard booth at the inbound truck
  check-in. The decisive Street View frames of the gate are heavily backlit
  (Jan/Feb morning sun due east), partly obscuring the booth, so guardShack is
  listed in `uncertainFields`; the weight of evidence favors a staffed booth over a
  remote kiosk/app check-in, so `remoteGs` is false.
- **Entry/exit:** one truck entrance point (entryExitTogether). Estimated ~2 inbound
  / ~1 outbound lanes from overhead striping (low confidence). The very wide gate
  apron and deep internal yard give clear room to add an express/bypass lane →
  `fastLaneOpportunity: true`.

## Docks, drop yard, staging

- **Dock doors:** cross-dock layout with long door rows on both the north and south
  building faces plus a detached south dock bank. Honest overhead estimate ~180
  doors total → band **50+**. North and south banks are on physically separate
  faces → `shipRcvSeparate: true`.
- **Drop yard:** dedicated trailer-storage with numbered stalls observed into the
  300-365 range across the north and south yards → `dropArea: 50+`, `dropYard: true`.
  Estimated capacity ~350 trailers; ~120 trailers visible in the captured imagery.
- **Post-gate staging:** deep paved yard inside the gate (west perimeter drive +
  trailer stalls) holds queued trucks well before the docks → `postGateStaging: true`,
  `drivewayLong: true`. No street-side pre-gate stalls observed → `preGateStaging: false`.
- **Scale / multi-step:** no truck scale and no visible second checkpoint stage →
  `scale: false`, `multiStep: false`.
- **Rail:** no rail spur enters the property → `railServed: false`.

## Geofences traced

- **perimeter** — the secured ~36-acre parcel (NW/NE/SE/SW), ~365m x ~402m.
- **truckGate** — quad over the NW entrance throat off the north road.
- **dropYards** (array of 2) — south drop yard and north dock-yard trailer strip.
- **dockAprons** (array of 2) — north dock apron and south dock apron, each a thin
  quad hugging the respective building face.
- **staging** — the west perimeter drive (post-gate circulation spine).
- **streetViewMeta** — perimeter pano `_XyVu-d1jCMKtlARiIhQzA` heading 273°
  (east-face Amazon-signage arrival frame); truckGate pano `7VvwH31NgV58HTc4Q3CSmw`
  heading 210° (north-road frame aimed into the gate throat). Both have coverage.

## Setting

Dense Inland Empire (Moreno Valley) logistics corridor surrounded on every side by
large distribution buildings → `urbanRural: Urban`, `connectivityIssue: false`.
Single building cluster → `multipleFacilities: false`.

## Web findings

- ONT8 is a major ~800k sq ft sortable Amazon fulfillment center serving the
  Moreno Valley / Perris corridor, with robotics; phone (951) 243-6060.
- Address corroborated across TruckMap, BusinessYab, NMFC list, and FBA directories.
- OSM/Mapcarta provided the building centroid that the satellite + on-site Amazon
  signage then confirmed.

## Final confidence

**High.** Building identity is confirmed by on-site Amazon signage; the gated,
walled, secured truck yard with controlled NW entrance is clear. The guard-shack
call and the precise lane/door counts are honest estimates (guardShack, entryLanes,
exitLanes, dockDoorCount flagged in `uncertainFields`).
