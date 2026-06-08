# GM - Flint Engine South (Flint Engine Operations), Flint MI

**Roster idx:** 12
**Type:** Engine / Propulsion Plant
**Address:** 2100 W Bristol Rd, Flint, MI 48507 (48552)
**Resolved center:** 42.9768, -83.7155
**Maps (satellite):** https://www.google.com/maps/@42.97680,-83.71550,400m/data=!3m1!1e3
**Confidence:** medium

## Step 0 - Location confirmation
The roster gives the Bristol Rd address, which is imprecise (the complex spans
both Bristol Rd and Van Slyke Rd). Web research confirmed: Flint Engine
Operations (formerly **Flint Engine South**) is a ~1,165,212 sq ft GM
propulsion plant that opened in 2002, built immediately south of the former
V8 plant along Van Slyke Rd, and produces the 1.5L SGE Turbo I4 "Ecotec" and
the 3.0L "Baby Duramax" I6 turbodiesel (Wikipedia; GM Authority). It sits
inside GM's integrated Flint complex: Flint Assembly (3100 Van Slyke, idx 2)
to the north, Flint Metal Center (idx 21) to the SW, with W Bristol Rd along
the south and Van Slyke Rd along the east.

Satellite probing around the address (z15 -> z19) isolated the distinct large
**sawtooth/multi-bay-roof manufacturing building** on the east side of Van
Slyke Rd, north of Bristol Rd, centered ~42.9768,-83.7155. This footprint and
scale match a ~1.16M sq ft engine plant. (The Wikipedia coordinate string
42.9325,-83.6450 is wrong - it lands SE of the city - so the building was
pinned visually instead.) Confirmed correct building, not an office.

## Key views
- **Wide z15/z16:** the whole GM Flint complex; Van Slyke Rd runs N-S
  separating GM (west) from residential/retail (east); Bristol Rd along the
  south. Engine plant is the gray sawtooth building center-left.
- **z18 building:** roof fills the frame - very large single sawtooth-roof
  manufacturing structure.
- **z19 east face (Van Slyke):** blue dock-door band with trucks/trailers and
  dumpsters backed in; a chain-link-fenced truck yard with a gated entrance
  drive/apron off Van Slyke Rd.
- **z18 south:** employee parking lots and solar canopy arrays front Bristol
  Rd; freight is not on this face.

## Gate / guard-shack / dock determinations
- **truckGate = true.** Street View (2025) along Van Slyke Rd shows a
  continuous chain-link perimeter fence around the east truck yard with a
  gated entrance drive crossing the fence (~42.9760,-83.7135); yellow bollards
  and lane control at the opening. Multiple SV frames confirm the fence is
  unbroken except at the gated drive.
- **guardShack = false / remoteGs = true (uncertain).** No dedicated gate
  booth positively resolved at the truck gate. A blue/white modular office
  trailer sits inside the fence further north but is not clearly a gate guard
  shack. Treated as a controlled fenced gate with likely badge/kiosk truck
  check-in. Flagged uncertain - GM plants often staff a main personnel gate,
  so this may understate.
- **postGateStaging = true.** Deep paved apron between the gate and dock doors
  inside the fence; room to hold/queue trucks. drivewayLong = true.
- **dockDoors = 10-25 (~18).** Blue dock band on the east/NE building face
  with several doors and backed-in trailers; exact count obscured by roof
  angle/shadow - uncertain.

## Yard zones & counts
- **perimeter:** traced around the engine-plant building footprint + its
  east-side truck yard along Van Slyke Rd; ~38 acres.
- **truckGate:** quad over the gated entrance drive/apron off Van Slyke.
- **dropYards:** one ring over the fenced east apron holding parked
  trailers/containers staged off the docks (10-20 visible; capacity ~30).
- **dockAprons:** strip hugging the east/NE dock band.
- **dropArea = 10-25, dropYard = true; trailersVisible ~12.**
- **railServed = false.** No spur enters this building's yard (complex rail
  west of Van Slyke does not reach this footprint).

## Web findings
- Flint Engine Operations (formerly Flint Engine South), opened 2002,
  ~1.16M sq ft, ~706 employees (2022). Produces 1.5L SGE Turbo I4 and 3.0L
  I6 "Baby Duramax." Sources: Wikipedia (Flint Engine Operations), GM
  Authority, Waze/TruckMap (2100 W Bristol Rd address corroboration).

## Final confidence: MEDIUM
Building identity and the fenced, gated east truck yard are confirmed.
Guard-shack vs. remote check-in, exact dock/lane/trailer counts, and
ship/rcv separation are estimated from overhead + Street View and flagged
uncertain.

### 3-line summary
- Gate: YES - fully chain-link-fenced east truck yard with a gated entrance drive off Van Slyke Rd.
- Guard shack: not positively resolved - marked remote/kiosk gate (uncertain); a modular office trailer is inside the fence but not clearly a gate booth.
- Confidence: medium.
