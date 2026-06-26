# Deep-Audit Dossier — idx 28 · Vandervoort Dairy (Kroger)

**Type:** Dairy Plant
**Address:** 900 S Main Street, Fort Worth, TX 76104 (Near Southside)
**Resolved center:** 32.734748, -97.32669
**Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coordinates (32.734858, -97.326529) landed on the right
city block but ~the pin sat on the S Main retail frontage. Web research confirmed
this is the genuine operating Kroger/Vandervoort's dairy plant — it appears
verbatim ("Vandervoort Dairy, 900 S. Main Street, Fort Worth, TX 76104") on
Kroger's own Manufacturing Division plant address list, corroborated by current
business listings. Satellite (z17→z20) shows a dense dairy processing complex:
large building with extensive rooftop refrigeration/cooling equipment and a
cluster of milk silos — consistent with the facility type. Recentered the audit
to the plant core at 32.734748, -97.32669.

## Layout (satellite z18–z20)
Urban, multi-parcel campus in Fort Worth's Near Southside, on the street grid:
- **Production block (east):** large plant building, rooftop process equipment,
  milk silos at its NW. Fenced (chain-link + green privacy screen).
- **West yard:** angled trailer rows + a second building; silos/tanks; employee
  parking on the far west.
- **South lots:** open trailer-storage lots packed with parked trailers, several
  backed up to the public-street curb.
Roughly axis-aligned to the N-S/E-W grid; operational footprint ~7.6 acres.

## Gate / guard determination
- **truckGate: true.** The production yard is enclosed by chain-link with green
  privacy screening, with pole-mounted security cameras at the fence openings
  (clearly visible in the 2025-01 Street View on the interior plant road,
  heading 90/270 from pano `7gMutd0wPh_flI4Ghd3Lmw` @ 32.73454,-97.32729).
  Controlled openings function as truck gates.
- **guardShack: false.** No staffed booth was visible at any of the entrances
  street-viewed around the fence line. (Flagged uncertain — not every opening
  could be inspected.)
- **remoteGs: true.** Gate present, no booth → remote/kiosk check-in inferred.

## Docks & yard
- **dockDoors: 10-25.** Trailers backed into docks on multiple building faces
  (north bank and south/west bank) → `shipRcvSeparate: true`. ~20 doors est.
- **dropArea: 50+ / dropYard: true.** Dedicated open trailer-storage lots across
  the west yard and south lots, packed with parked trailers (~70 visible,
  capacity ~90).
- **postGateStaging: true, drivewayLong: true.** Deep interior paved area between
  the gates and the dock faces holds a 3+ truck queue.
- **backupSensitive: true.** Urban block; fence/trailers sit at the public curb
  with little exterior stacking room.
- **scale: false, rail: false.**

## Street View metadata
- truckGate: pano `7gMutd0wPh_flI4Ghd3Lmw`, heading 15° (2025-01), interior road.
- perimeter: pano `k_PdLHdO7DS-Cb_gL-0QEg`, heading 330° (2025-01).

## Web findings
Active Kroger-owned dairy products plant (Vandervoort's brand, founded 1933,
acquired by Kroger). Produces milk, juice/fruit drinks, cottage cheese, sour
cream, yogurt, ice cream; supplies Kroger private-label dairy across North Texas.

## Final confidence: high
Location and facility identity unambiguous; layout, docks, and drop yards clear.
guardShack/remoteGs and exact dock/capacity counts flagged as the soft fields.
