# Deep Audit — Toyota Logistics Services VDC, Newark NJ (idx 15)

**Facility:** Toyota Logistics Services Vehicle Distribution Center — Port Newark
**Type:** Vehicle Distribution Center (port vehicle processing)
**Resolved coordinates:** 40.6940, -74.1360
**Address:** 390 E Port St (Building 390), Port Newark, NJ 07114
**Confidence:** Medium

## Location resolution

Roster supplied a generic Port Newark point (40.69001, -74.151753) which falls in
the container terminal. Web research resolved the precise TLS facility to
**Building 390, E Port St** — confirmed via Yelp ("Toyota Motor Sales Boston
Region"), CMac, Macrae's Blue Book, Kompass and a Port Authority portfolio page
that names the **Toyota Motor Logistics Center** as one of three vehicle
processors at the Port of NY/NJ (with FAPS and BMW Port Jersey). Satellite at
z16-z20 along E Port St shows a large auto-processing complex — a sawtooth-roof
processing building, an adjacent flat-roof building, extensive vehicle
marshalling lots, a ro/ro wharf, and a dense auto-hauler/tractor yard — matching
the described TLS VDC.

## What the imagery showed

- **z15/z16 overview:** The E Port St auto-processing zone of Port Newark —
  thousands of vehicles in striped marshalling lots, white-roof processing
  structures, ro/ro berths on the channel.
- **z17/z18 building close-up:** The TLS complex — a large sawtooth-roof building
  (auto recon / accessory processing) plus an adjacent flat-roof building with
  dock-style doors, surrounded by vehicle lots; a gatehouse-type structure at the
  SE corner near E Port St.
- **z20 yard close-up:** A packed yard of tractors, trailers and auto-hauler units
  (~45 visible) interleaved with new-vehicle rows — confirms heavy truck activity.
- **Street View (E Port St, 2017-08):** Vehicle marshalling lots, auto-haulers
  staged, reddish processing buildings, chain-link fencing, and rail tracks
  running parallel to E Port St.

## Gate / guard-shack determination

- **truckGate = true.** Port Newark is a TWIC-controlled marine terminal; the
  facility is fenced (chain-link visible in Street View along E Port St) with a
  controlled entrance off E Port St. Controlled gated entry is certain.
- **guardShack = true (inferred, medium confidence).** A small gatehouse-type
  structure sits at the SE corner near the E Port St entrance; TWIC marine
  terminals are staffed at the gate. A discrete booth could not be isolated
  frame-by-frame — flagged uncertain.
- **remoteGs = false** — guard shack inferred present.
- **multiStep = false** — no clear distinct second checkpoint visible.

## Yard zones & counts

- **Perimeter:** ~58 acres of TLS processing buildings + contiguous vehicle lots
  fronting E Port St between the channel wharf and the rail corridor.
- **Drop / marshalling yards:** dominant land use — striped vehicle lots holding
  thousands of finished vehicles, plus a dense auto-hauler/trailer yard.
- **Dock apron / staging:** dock-door bank on the processing buildings with a
  deep apron (`drivewayLong` true).
- **Dock doors:** ~12, banded 10-25 (atypical for a vehicle-processing site).
- **Rail served:** YES — rail along E Port St; Port Newark auto terminals are
  served by on-dock rail.

## Web findings

- TLS-operated Toyota Motor Logistics Center, one of three Port of NY/NJ vehicle
  processors; handles Toyota / Lexus / Scion processor accounts.
- Building 390, E Port St, Port Newark — serves the eastern US.

## Final confidence: MEDIUM

Location and facility identity are certain. Gate presence is certain (TWIC marine
terminal, fenced perimeter). Guard-shack, gate count, dock-door count, lane counts
and scale are inferred from facility type and partial imagery (Street View dates
to 2017) — flagged in uncertainFields. As a vehicle-processing port facility,
conventional dock/trailer metrics are an imperfect fit and should be read as
honest estimates.
