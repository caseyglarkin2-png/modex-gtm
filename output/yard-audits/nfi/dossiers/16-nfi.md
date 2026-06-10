# Deep-Audit Dossier — NFI Distribution Center, Elwood IL (idx 16)

- **Account:** NFI Industries
- **Facility:** NFI Distribution Center Elwood IL — Distribution Center
- **Address:** 27143 S Elwood International Port Rd, Elwood, IL 60421
- **Resolved center:** 41.39140, -88.14310
- **Method:** deep-audit (probe.ts satellite + Street View, web research)
- **Confidence:** high

## Step 0 — Location confirmation
The supplied approximate coordinates (41.391118, -88.143016) landed directly on
the correct building: a large NW-SE oriented distribution warehouse inside the
**CenterPoint Intermodal Center (Joliet/Elwood)**, ringed by extensive trailer
drop yards. Web search corroborated NFI Distribution / National Distribution
Centers at this exact address and phone (815-423-5399). The parcel is bounded on
the **west** by S Elwood International Port Rd (across which sits the CenterPoint
intermodal container yard — rows of stacked containers), and on the **north,
east and south** by grass buffer, woods and a wetland/pond. No ambiguity: this is
the NFI DC, not an office or unrelated property.

## Key views
- **z16/z18 overview:** single long warehouse on a NW-SE axis with trailer drop
  yards wrapping the north and south sides; active dock trailers (Schneider
  orange, green, blue, white) backed into the long walls.
- **NW entrance (z18/z20):** the truck entrance leaves S Elwood International
  Port Rd at the NW corner and curves into the yard; employee car lot with a
  landscaped median sits just south of the throat.
- **Gate close-up (z21 @ 41.39173,-88.14476):** a small dark-roofed **guard
  booth** on a concrete check-in island in the center of the entrance drive,
  with a **barrier/gate arm** across the inbound lane and a yard hostler staged
  beside it. The drive splits into in/out lanes around the booth island.
- **Street View (pano UXPONWUmZVukdZA3Zcq5BQ, May 2025, @ 41.39176,-88.14527):**
  wide entrance throat viewed from the road; a Schneider trailer staged at the
  booth island; no barrier at the public-road property line — control is the
  set-back booth + arm.
- **North-wall / south-wall z19 crops:** dock doors with trailers backed in on
  BOTH long walls — a cross-dock configuration.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Controlled single entrance: gate arm across the inbound
  lane plus a check-in pad (z21), confirmed by the Street View throat geometry.
- **guardShack = true.** Staffed booth (~1-2 stall footprint, set on the median
  island beside the arm). Hence **remoteGs = false**.
- **shipRcvSeparate = true.** Opposing dock banks on the north and south long
  walls (two distinct dock faces).
- **dockDoors = "50+"** (est. ~120 across both ~450m walls).
- **dropArea = "50+"** and **dropYard = true** — dedicated trailer-storage rows
  north and south, hundreds of unhitched trailers.
- **fastLaneOpportunity = true** — wide gate apron and large interior yard leave
  room for an express/bypass lane around the single booth.
- **preGateStaging / postGateStaging = true** — paved road-shoulder staging
  outside the gate, and a large paved interior yard inside it before the docks.
- **entryExitTogether = true** (single gate throat, 1 in / 1 out lane around the
  island). **multiStep = false** (no second checkpoint/scale visible).
- **scale = false; railServed = false** — the rail-served yard is the adjacent
  CenterPoint intermodal facility across the road; the DC itself is truck/drayage
  fed. **urbanRural = Rural** (edge-of-town industrial park amid farmland/woods).

## Yard zones & counts measured
- **perimeter:** 6-vertex polygon traced to the pavement/fence edge, oriented to
  the NW-SE building axis; **~27.6 acres**, ~443m NW-SE diagonal.
- **truckGate:** quad around the NW entrance booth/throat.
- **dropYards (2):** north drop yard and south drop yard, each a rotated quad
  aligned to the trailer rows.
- **dockAprons (2):** two long thin quads hugging the north and south dock walls
  at the building's angle.
- **staging:** thin quad on the road shoulder outside the gate.
- **yardMetrics:** dockDoorCount ~120, trailersVisible ~360, trailerParking
  capacity ~450, truckGateCount 1, buildingCount 1, siteAreaAcres 27.6,
  railServed false. Counts are honest overhead estimates.

## Web findings
NFI Distribution / National Distribution Centers operates this 3PL warehouse at
27143 S Elwood International Port Rd inside CenterPoint Intermodal; listed hours
Mon-Fri ~7:00-18:00. The location is a classic intermodal-fed 3PL DC: drayage
trailers shuttle from the adjacent rail container yard into a high-volume
cross-dock with large drop-yard buffers.

## Uncertain fields
- **multiStep** — no visible second checkpoint; set false.
- **connectivityIssue** — within a major logistics park, coverage likely fine;
  set false but flagged.

## Final confidence: high
Building positively identified; gate, guard booth, cross-dock and drop yards all
confirmed in high-resolution satellite plus corroborating Street View.
