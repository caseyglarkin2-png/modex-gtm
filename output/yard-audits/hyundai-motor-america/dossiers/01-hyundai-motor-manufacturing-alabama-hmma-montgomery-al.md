# Deep-Audit Dossier — HMMA Montgomery AL (idx 01)

**Facility:** Hyundai Motor Manufacturing Alabama (HMMA)
**Type:** Auto Assembly Plant
**Address:** 700 Hyundai Blvd, Montgomery, AL 36105
**Resolved center:** 32.281200, -86.323500
**Confidence:** High

## Step 0 — Location confirmation
Roster coords (32.280312, -86.324154, ROOFTOP) landed directly on the HMMA
main assembly building — confirmed by satellite: a giant white building
carrying the "HYUNDAI" wordmark and logo on its roof. Web research
(hmmausa.com, Wikipedia) confirms HMMA is a 1,744-acre campus, 3.4M sq ft of
buildings, producing Santa Fe / Tucson / Elantra / Santa Cruz. No relocation
needed; center nudged slightly to the assembly hall.

## Key views
- **z13/z14 wide:** Defined campus block in rural south Montgomery — assembly
  cluster center-left, a 2-mile test track at the north edge, vast
  finished-vehicle storage lots (lavender), an east logistics/parts warehouse
  complex, surrounded by farmland and woods.
- **z16-18 mid:** Assembly building cluster, employee parking lots flanking the
  main entry road, east warehouse complex with long dock-door banks.
- **z18-20 east complex:** Multiple large logistics/parts warehouses with
  trailers backed into docks on multiple faces; a large dedicated trailer drop
  yard on the SE side off Hyundai Blvd holding ~80-100 trailers.
- **Main entry (32.2769,-86.3253):** Wide multi-lane intersection off Hyundai
  Blvd with a Hyundai monument sign; entry road runs north into the plant.

## Gate / guard-shack / dock determinations
- **truckGate = true.** HMMA operates controlled, numbered gates — web research
  confirms "Gate 2" as the designated visitor entrance, implying a numbered
  gate system. Main truck/visitor entry is the multi-lane apron off Hyundai
  Blvd. Road-edge Street View (2024-04) shows no barrier arm at the public-road
  edge; access control on a campus this size is set back inside the property.
- **guardShack = true (inferred).** A captive-OEM auto assembly plant of this
  scale with numbered, staffed gates is industry standard; a security/check-in
  structure is visible inside the entry road near the dock side
  (~32.2799,-86.3252). Booth footprint not crisply resolvable at the road edge
  — flagged medium on exact location, not on its existence.
- **remoteGs = false** (guard shack present).
- **dockDoors = 50+.** East logistics warehouse complex shows long regular dock
  banks with trailers backed in on multiple building faces; assembly building
  adds more. Overhead estimate ~90 doors.
- **dropArea = 50+ / dropYard = true.** Dedicated SE trailer drop yard plus
  extensive trailer rows along warehouse dock faces — well over 50 stalls.

## Yard zones and counts
- **Perimeter:** developed operational footprint (~620 acres) — the
  YardFlow-relevant geofence; full owned parcel is 1,744 acres.
- **Drop yards:** SE drop yard off Hyundai Blvd; warehouse-face trailer rows.
- **Dock aprons:** east logistics warehouse face; assembly-building dock face.
- **Metrics:** ~90 dock doors, ~220 trailers visible, ~320 trailer capacity,
  2 truck gates, 12+ buildings, ~620 acres operational, no rail spur observed.

## Web findings
- hmmausa.com / Wikipedia: 1,744 acres, 3.4M sq ft, stamping + weld + paint +
  assembly + three engine shops + 2-mile test track; ~399,500 vehicles/yr
  capacity; ~4,200 team members. "Gate 2" = visitor entrance (numbered gates).

## Final confidence
**High.** Facility unambiguous, imagery clear. Uncertain: presence of a truck
scale, exact exit-lane count, and any second checkpoint stage — flagged in
`uncertainFields`.
