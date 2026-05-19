# Deep-Audit Dossier — idx 23

## DHL Supply Chain — DC — Houston TX
**Type:** Distribution Center
**Resolved location:** 8609 Citypark Loop, Houston TX 77013 (CityPark / East Freeway logistics park)
**Locked center:** 29.80440, -95.27275
**Confidence:** high

## Step 0 — Location resolution
The roster entry had no address or coordinates ("leased customer sites not
publicly enumerated"). Web research found a **Panjiva import record that
explicitly names "Dhl Supply Chain, 8609 City Park Loop, Houston Texas 77013"**
— a direct DHL Supply Chain shipping address. The Google Geocoding API returned
**ROOFTOP** precision for 8609 Citypark Loop (29.80377, -95.27271). Satellite
probing found a large warehouse; Street View of the SW office front clearly
reads **"8609"**, positively confirming the building. Locked the building
center at 29.80440, -95.27275.

## Key views
- **Wide satellite (z16-17):** A multi-building logistics park (CityPark) east
  of downtown Houston, bounded by US-90 / East Freeway and a large Union
  Pacific rail yard. The target is a long N-S white-roofed warehouse.
- **z18-19:** The building is a cross-dock — dock canopies line BOTH long
  faces. The WEST face opens onto a shared truck court with the "8607"
  building; the EAST face opens onto a court shared with the building to the
  east. Trailers backed in on both faces.
- **Street View (2021-03):** SW office front marked "8609." The west truck
  court is enclosed by chain-link fence; trailers and dock canopies inside.

## Gate / guard-shack / dock determinations
- **Truck gate — TRUE.** The west truck court is enclosed by chain-link fence
  with a gate at the driveway off Citypark Loop, visible in 2021 Street View
  and 2026 satellite. (Gate hardware partly tree-obscured — flagged
  uncertain; the perimeter fence is unambiguous.)
- **Guard shack — FALSE.** No staffed booth at the court entrance in any view.
- **Remote gate system — TRUE.** Gated court with no guard shack implies
  kiosk / call-box / app check-in.
- **Dock doors — 50+.** Dock canopies run both ~400 m long faces; combined
  banded estimate 50+. Exact count not resolvable from overexposed white-roof
  satellite — flagged uncertain.
- **Ship/receive separate — TRUE.** Cross-dock building with dock banks on two
  opposite faces, each with its own truck court.
- **Drop yard — TRUE.** Trailers parked in both shared truck courts.

## Yard zones and counts
- **Perimeter:** ~22.3 acres — building + west court + east court + south
  office/parking.
- **Truck gate:** chain-link gate off Citypark Loop into the west court.
- **Drop yards:** west truck court and east truck court (both shared with
  neighbours).
- **Dock aprons:** the paved strips along both long faces.
- **Staging:** paved apron / parking between Citypark Loop and the court gate
  (pre-gate).
- **Metrics:** ~80 dock doors (banded 50+), ~34 trailers visible, ~45 trailer
  capacity, 1 truck gate, 1 building, no rail spur.

## Web findings
- The Panjiva import record ("Dhl Supply Chain, 8609 City Park Loop") confirms
  active DHL Supply Chain contract-logistics operations at the address.
- A separate Yelp listing places "Exel Logistics" (DHL Supply Chain's legacy
  brand) in the same Houston market, corroborating DHL's presence here.
- A large Union Pacific rail yard borders the park to the north, but the DHL
  building itself is road-served.

## Final confidence
**High.** Building positively identified by a DHL Supply Chain shipping record,
ROOFTOP geocode, and the "8609" Street View sign. The cross-dock layout and
fenced courts are clear. Dock count is a banded estimate and the gate hardware
is partly tree-obscured — both flagged in `uncertainFields`.
