# Deep-Audit Dossier — idx 47 — Roundy's Commissary (RCK Foods / Kroger)

**Address:** 5500 52nd St, Kenosha, WI 53144
**Resolved center:** 42.590687, -87.874072 (supplied coords were accurate)
**Type:** Deli/Meat & prepared-foods commissary plant
**Confidence:** high

## Location confirmation (Step 0)
Satellite probes z17→z20 at the supplied point landed directly on a large,
complex-roof industrial building with multiple distinct roof sections, heavy
rooftop refrigeration/condenser banks, and food-grade silos at the NW corner —
the signature of a multi-mini-plant commissary, not a clean DC box. Web search
confirmed: the Roundy's Commissary at 5500 52nd St, Kenosha is a ~117,000 sq ft
facility on ~17 acres, comprised of multiple mini-manufacturing rooms (baked
goods, deli processing, soups), running 24/7, supplying ~150 Pick 'n Save /
Metro Market / Copps / Mariano's stores. Acquired by Kroger in 2015, now "RCK
Foods," one of Kroger's manufacturing plants. Building footprint, silos, and
rooftop refrigeration all corroborate. Right building locked.

## Key views
- **z18/z19 overview:** Building sits rotated ~30-35° to north (long axis NW-SE).
  Office/front block on the south face with employee/visitor parking; the
  working dock face is on the **north** edge with trailers backed in and a
  large open paved maneuvering yard beyond.
- **z20 north dock bank:** Continuous dock positions along the north wall, ~11
  trailers backed in at capture, flanked by large refrigeration condenser
  units. Banded **10-25** dock doors (manufacturing plant, modest door count).
- **z20 drop yard:** Big open paved yard north of the docks holds parked
  trailers separate from the active apron → dropYard=true, dropArea 10-25.

## Gate / guard-shack / dock determinations
- **Perimeter fence:** 2023-06 Street View along the north and NE public edge
  shows a continuous **black ornamental steel fence** enclosing the dock yard,
  with trailers visible behind it. So there IS a security perimeter on the
  public-facing sides.
- **Truck gate:** No barrier arm, sliding gate, or pinch-point checkpoint at any
  truck entrance. The working truck access comes off the internal industrial-
  park drives — the west drive and the SW front loop — both **open paved
  aprons** (2012, 2023, 2024 Street View + satellite all open). Ornamental fence
  is perimeter security, not a controlled truck checkpoint. **truckGate=false.**
- **Guard shack:** None visible at any entrance in any era of imagery.
  **guardShack=false**, remoteGs=false (no gate to gate-control).
- **Staging / driveway:** Deep open approach and large internal yard → long
  driveway, postGateStaging true (room to hold a queue inside before docks).
- **Fast lane:** Very wide entrances and apron → fastLaneOpportunity=true.

## Yard zones & counts
- **Perimeter:** 7-vertex ring tracing the fenced property at its true NW-SE
  orientation → ~17 acres (matches the published 17-acre figure).
- **truckGate zone:** the open NW dock-yard entrance off the west drive.
- **dropYard:** one ring over the north open trailer yard.
- **dockApron:** one thin quad hugging the north dock wall at building angle.
- dockDoorCount ~16 (banded 10-25), trailersVisible ~11, trailerParkingCapacity
  ~30, truckGateCount 2 (west + SW loop), buildingCount 1, railServed false.

## Street View
- truckGate pano `s2BrsZ8UvCVIjRIAcfVrVA` (2023-06) @ 42.59187,-87.87449,
  heading 194° toward the NW yard entrance.
- perimeter pano `Ehz2BvvE_nD_mbxPRHCKow` (2023-06) @ 42.59180,-87.87412,
  heading 180° toward the fenced dock yard / north face.

## Web findings
BizTimes / Journal Times / Dairy Foods: 117k sq ft, 17 acres, multi-mini-plant
commissary, 24/7, ~150 stores served, RCK Foods under Kroger, $19.2M upgrade
plan reported. Confirms prepared-foods/deli manufacturing profile.

## Final confidence: high
Building identity, layout, perimeter fence, open truck access, and acreage all
cross-verified across satellite, multi-era Street View, and press. dockDoorCount
and the guardShack-vs-fence nuance flagged uncertain.
