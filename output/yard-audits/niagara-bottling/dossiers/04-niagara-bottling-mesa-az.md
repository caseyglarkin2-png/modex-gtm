# Deep-Audit Dossier — Niagara Bottling, Mesa AZ (idx 4)

## Resolved location
- **Address:** 3453 S 96th St, Mesa, AZ 85212
- **Locked center:** 33.35260, -111.62580
- **Confirmation:** Roster coordinates landed on a large white-roofed building.
  Street View (captured 2024-12) of the building's west/NW face shows the
  "niagara" wordmark — positively confirmed. Niagara established this Mesa plant
  in 2018; ~450,183 sq ft of water-manufacturing space.

## Setting
SE edge of Mesa, AZ — the plant is surrounded by large tracts of undeveloped
Sonoran desert with only sparse industrial development nearby. Per the rubric
(edge-of-town, open surroundings) this is **Rural**. It is still within the
Phoenix-metro reach, so `connectivityIssue` is left false but flagged.

## Key views
- **Wide satellite:** Single large rectangular building running E-W, set on a
  parcel ringed by desert. Employee parking on the NW; office/admin on the west.
- **North face (z18-19):** A long continuous run of canopied dock doors with
  trailers backed in, plus a row of marked trailer-parking stalls beyond.
- **NE corner (z19):** Dock run continues the full building length; trailer
  parking row holds dozens of trailers.
- **Entrance (Street View + z21 satellite):** Truck access is a driveway off
  S 96th St on the NW. A small standalone structure sits at the road edge by the
  entrance.
- **South / east faces:** Blank tilt-up walls with a perimeter drive; no docks.

## Gate / guard-shack / dock determinations
- **truckGate = true:** The truck dock yard along the north face is fenced. Truck
  access is a controlled driveway off S 96th St.
- **guardShack = true (medium confidence):** A small (~1-2 vehicle footprint)
  standalone building sits at the truck-entrance road edge — consistent with a
  gatehouse / guard booth. Street View pano coverage along 96th St is sparse and
  did not give a direct close-up, so this is classified true at medium confidence
  and flagged in `uncertainFields`.
- **remoteGs = false:** Follows from guardShack = true (flagged because the
  guard-booth call is itself medium confidence).
- **Docks:** Continuous canopied dock run along the full ~430 m north face;
  ~55 doors → band **50+**.
- **Drop yard:** Row of marked trailer-parking stalls north of the dock apron
  with dozens of dropped trailers → `dropYard = true`, `dropArea = 25-50`.
- **fastLaneOpportunity = true:** Wide dock-yard road and generous paved/desert
  width at the entrance leave room for an express lane.

## Yard zones and counts
- **Perimeter:** ~28 acres — building + north dock yard + NW employee parking.
- **Dock apron:** strip along the full north building face.
- **Drop yard:** marked trailer-parking row north of the dock apron.
- **Staging:** paved holding area between the NW gate and the dock yard.
- **Dock doors:** ~55. **Trailers visible:** ~45. **Capacity:** ~65.
  **Truck gates:** 1. **Buildings:** 1. **Rail-served:** no. **Scale:** none.

## Web findings
Niagara Bottling Mesa — established 2018, ~450,183 sq ft of advanced
manufacturing space for purified drinking water production and distribution.
Open 24/7.

## Final confidence
**Medium.** Building identity is certain (wordmark confirmed). The gate is
clearly present (fenced dock yard, controlled driveway). The guard-shack call
rests on a small entrance structure visible in satellite but not directly
imaged in Street View — flagged. Dock/trailer counts are overhead estimates.
