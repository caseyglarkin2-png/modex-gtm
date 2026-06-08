# Deep-Audit Dossier — GM Tonawanda Propulsion, Buffalo NY (idx 14)

**Facility:** GM - Tonawanda Propulsion (Tonawanda Engine), Plant #1
**Type:** Engine / Propulsion Plant
**Address:** 2995 River Rd, Buffalo, NY 14207
**Resolved center:** 42.9670, -78.8960
**Confidence:** Medium

## Step 0 — Locating and confirming the facility

The roster-supplied address (2995 River Rd) is correct. Initial probes around the
city-level point landed first on the large rail yard north of the plant. Stepping
SE (42.9655, -78.8990) revealed the unmistakable GM complex: a run of massive
white-roofed manufacturing buildings on the east bank of the Niagara River, with a
multi-track rail yard to the north and a dense residential street grid to the south.

Web research (Wikipedia, GM media, GM Authority, Buffalo Niagara Partnership)
confirms: Tonawanda Engine/Propulsion is a 3.1-million-sq-ft complex on a ~190-acre
site comprising three plants — Plant #1 (2995 River Rd, built 1938), Plant #4 (2390
Kenmore Ave), and Plant #5 (240 Vulcan St) — building V8s for GM trucks/SUVs and the
Corvette. The traced geofence covers the dominant Plant #1 operational footprint
fronting River Road.

## Key views

- **Wide (z16, 42.9665 / -78.8975):** Whole complex in frame. Long white buildings
  run roughly WNW-ESE (tilted ~12° off east-west). Rail yard north, River Road and
  the brick admin building on the SW frontage, residential grid south.
- **Plant zoom (z17):** Confirms one continuous mega-building mass with sawtooth
  older sections to the NW; trailers staged at the west and east ends.
- **NE drop yard (z19, 42.9686 / -78.8920):** Rows of parked trailers/containers
  (~15-25), a maroon-roofed building, and **rail spurs curving in from the north** —
  clear rail service.
- **SW frontage (z19, 42.9663 / -78.8990):** River Road intersection, employee
  parking with a pedestrian crosswalk/bridge to the plant, trailers staged along the
  service lane.

## Street View determinations

- **Entrance pano `Kygql-B2L6N_3Qc4fl8mnw` (2025-07, 42.96731 / -78.89877):** Looking
  west toward the plant shows the GM-logo building wall, a **black ornamental
  perimeter fence** ringing the employee lot, and a drive curving into the complex
  past the historic brick admin block. A marquee/GM sign sits at the entrance.
- **Gate verdict:** `truckGate: true` — the property is fenced and the entrance is
  controlled, but it reads as a sign-and-fence employee/visitor gate rather than a
  hard barrier-arm checkpoint. The Street View car drove interior service lanes,
  consistent with a relatively open controlled gate.
- **Guard-shack verdict:** `guardShack: false` (uncertain) — no staffed booth
  positively resolved at the River Road entrance. Set `remoteGs: true` (gate present,
  booth unconfirmed), low confidence; a dedicated truck gate with a booth may exist
  off-pano.

## Yard zones and counts (from overhead imagery — estimates)

- **perimeter** — oriented quad tracing the fenced Plant #1 footprint (~102 acres of
  the cited 190-acre campus; remainder is the northern rail yard + Plant #4/#5).
- **truckGate** — quad over the controlled River Road entrance drive.
- **dropYards[0]** — NE-corner trailer storage lot (~15-25 trailers), rail-adjacent.
- **dockAprons[0]** — long thin quad along the north building face (dock line near
  the rail / staging apron).
- **dockDoorCount ≈ 28** (band 25-50); **trailersVisible ≈ 22**;
  **trailerParkingCapacity ≈ 45**; **truckGateCount 2** (River Rd main + NE
  service/rail access); **buildingCount ≈ 4**; **railServed: true**.

## Classification highlights

- `multipleFacilities: true` — multi-plant campus (3 plants, 3.1M sq ft).
- `shipRcvSeparate: true` — north dock apron vs. separate NE drop/storage yard.
- `dropYard: true` — dedicated NE trailer-storage lot.
- `fastLaneOpportunity: true` — wide River Road frontage + deep interior apron.
- `drivewayLong: true`, `postGateStaging: true` — deep approach and interior staging.
- `urbanRural: Urban` — embedded in the Buffalo/Tonawanda metro fabric.
- `scale: false` (uncertain) — no weigh platform positively identified.

## Web findings

- Wikipedia — *Tonawanda Engine*: 3.1M sq ft, ~190 acres, three plants, on the
  Niagara River; builds GM truck/SUV V8s and the Corvette engine.
- GM media / GM Authority: Plant #1 at 2995 River Rd (built 1938); Plant #4 (Kenmore
  Ave, 1941); Plant #5 (Vulcan St, 2001).

## Final confidence

**Medium.** Facility identity, rail service, drop yard, multi-plant campus, and dock
clustering are all well supported by imagery and web sources. Gate-control detail and
guard-shack staffing are unconfirmed from available Street View, and dock/trailer
counts are honest overhead estimates — hence medium with several flagged fields.
