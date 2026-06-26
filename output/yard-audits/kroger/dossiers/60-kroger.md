# Deep-Audit Dossier — idx 60: Roundy's Distribution Center, Oconomowoc WI

**Facility:** Roundy's Distribution Center (Kroger subsidiary) — grocery Distribution Center
**Address:** 1120 Distribution Ct, Oconomowoc, WI 53066
**Resolved center:** 43.0598, -88.4762
**Confidence:** high

## Location confirmation (Step 0)
The supplied coords (43.060074, -88.477019) landed directly on a very large
multi-section industrial building with a massive south-facing dock apron and
rows of parked trailers — unambiguously a grocery DC. Web research confirms
Roundy's 1,120 Distribution Ct, a 1.1M sq ft DC built 2005, ~800 employees,
serving Pick 'n Save / Mariano's / Metro Market for the Kroger Co. (Roundy's is
a wholly-owned Kroger subsidiary; the building was sold to Scout Cold Logistics
for $120M). This is the correct building; no relocation needed.

## What each key view showed
- **z16/z17 overview:** Long DC oriented roughly E-W, slightly rotated (east
  end dips south). Employee parking + retention ponds to the north, docks +
  drop yard to the south, farmland/industrial park beyond. Building extends
  ~-88.4807 (W) to ~-88.4716 (E).
- **East edge (z18):** Building east wall with dock apron and trailers backed
  in; Distribution Ct runs N-S along the east buffer (no entry here — landscaped
  setback to the road).
- **SE entry (z18-21):** A single controlled entry where Distribution Ct curves
  into the secured yard at the SE; a small booth-footprint structure sits beside
  the lane (guardhouse).
- **Street View (2007 + 2024):** Continuous chain-link perimeter fence along the
  east and south property line; a checkpoint structure with light poles ahead on
  the in-bound lane. The yard is fully fenced and secured.

## Gate / guard-shack / dock determinations
- **truckGate = true:** Full perimeter chain-link fence (SV-confirmed) with a
  single controlled inbound point off Distribution Ct at the SE. Not an open
  driveway.
- **guardShack = true (flagged):** Small ~1-vehicle-footprint structure beside
  the SE entry lane at z20-21, consistent with a staffed gatehouse. Resolution
  is marginal so it is listed in uncertainFields; remoteGs left false.
- **postGateStaging = true / drivewayLong = true:** Deep paved approach from the
  SE gate into the yard with room to stack 3+ trucks before the docks.
- **dockDoors = 50+:** One continuous south-facing dock bank runs the full length
  of the 1.1M sq ft building plus the east-end face — well over 50 doors
  (est ~110).
- **dropArea = 50+ / dropYard = true:** Large fenced trailer drop yard south of
  the dock apron, many rows of parked trailers (est capacity ~220).
- **fastLaneOpportunity = true:** Wide gate apron + ample paved width at the SE
  entry leave room for an express/bypass lane.
- **scale = false:** No clearly resolved truck-scale pad.
- **railServed = false:** No rail spur enters the property.
- **multipleFacilities = false; buildingCount = 2:** Main DC plus a small
  satellite/fleet building in the SW yard — not a multi-cluster campus.
- **urbanRural = Rural:** Edge-of-town Oconomowoc, farmland + light industrial
  park surroundings.

## Yard zones & counts measured
- **Perimeter:** ~71.5 acres (5-vertex ring tracing the fenced property at true
  orientation, east end dipping south).
- **dockApron:** Long thin oriented quad hugging the south building wall.
- **dropYard:** Oriented quad over the trailer-parking rows south of the apron.
- **truckGate:** Quad over the SE entry/booth.
- dockDoorCount ~110; trailersVisible ~180; trailerParkingCapacity ~220;
  truckGateCount 1; buildingCount 2; siteAreaAcres 71.5; railServed false.

## Street View
- perimeter pano `y7LtGCEG7VU7ey0dZXvTgQ` (43.05825, -88.47400), heading 314°.
- truckGate pano `6puqMVIc_m09o6Pejq_A9Q` (43.05826, -88.47450), heading 242°.
- Both `status: OK`. Panos are 2007-09 on the east/south access road — the frame
  a driver sees on arrival.

## Web findings
1.1M sq ft, built 2005, ~800 employees; Pick 'n Save / Mariano's / Metro Market
distribution; Kroger/Roundy's; recently sold to Scout Cold Logistics for $120M.

## Final confidence: high
Building identity and gate/fence determinations are solid from satellite +
Street View + web. guardShack, scale, and exitLanes flagged as the
lower-certainty calls.
