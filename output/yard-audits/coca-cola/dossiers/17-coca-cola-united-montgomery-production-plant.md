# Deep-Audit Dossier — idx 17

## Coca-Cola UNITED — Montgomery Production Plant, AL

### Resolved location
- **Roster input:** 2000 Coca Cola Rd, Montgomery AL; lat/lng 32.294107, -86.347673 (GEOMETRIC_CENTER — geocoded to a street centerline).
- **Problem:** The roster coordinate landed on empty/grassy land along Coca-Cola Road; the roster house number (2000) is wrong.
- **Correct facility:** Coca-Cola UNITED Montgomery Production Plant, **300 Coca-Cola Road, Montgomery, AL 36105** — a $35M beverage production facility opened 2016 (home to one of the nation's fastest Dasani lines), ~120 associates, producing ~25M cases/year. Building positively identified at ~**32.2930, -86.3428**, off the east end of Coca-Cola Road beside I-65.
- **Step-0 verification:** Street View shows a red "Coca-Cola" logo and, decisively, a branded canopied truck gate carrying the Coca-Cola script logo.

### Key views
- **z16 overview:** A main production building with an attached east office, a separate NW warehouse, a north trailer yard, and a canopied truck gate on the NE off Coca-Cola Road. I-65 runs along the SE; open fields and a residential subdivision lie to the north.
- **z18 building views:** Dock doors with trailers backed in along the production building's south face; pallet storage and a sawtooth-roof warehouse to the NW.
- **Street View (gate):** A large canopied gatehouse spanning multiple lanes, the red Coca-Cola script logo on the canopy, gate barrier arms across the lanes, a "Do Not Enter" sign on the outbound lane, and a staffed guard booth beneath the canopy.

### Gate / guard-shack / dock determinations
- **truckGate = true (strong):** Street View unambiguously shows a controlled, canopied, multi-lane truck gate with barrier arms off Coca-Cola Road.
- **guardShack = true (strong):** A staffed guard booth structure sits beneath the gate canopy between the lanes — clearly visible in Street View.
- **remoteGs = false:** A guard shack is present, so this is not a remote/kiosk gate.
- **entryLanes ~2 / exitLanes ~2:** The canopied gate spans multiple lanes with the booth in the middle — counts approximate, flagged.
- **fastLaneOpportunity = true:** The wide multi-lane canopied gate apron has room for an express/bypass lane.
- **dockDoors = "25-50":** ~30 doors with trailers backed in along the production building's south face plus the NW warehouse — approximate.
- **shipRcvSeparate = false:** Docks read as a single cluster on one building face.

### Yard zones and counts
- **perimeter:** south 32.2915, west -86.3450, north 32.2950, east -86.3415 — ~390 m N-S × ~329 m E-W ≈ **31.7 acres**.
- **truckGate zone:** canopied gate off Coca-Cola Road, NE.
- **dropYard:** north trailer yard inside the gate.
- **dockApron:** strip along the production building's south face.
- **staging:** paved holding area between the gate canopy and the trailer yard / docks.
- **yardMetrics:** ~30 dock doors; ~55 trailers visible; ~85 trailer capacity; 1 truck gate; 2 buildings; 31.7 acres; rail-served = false.

### Web findings
- The Montgomery Production Center (300 Coca-Cola Road) is a Coca-Cola UNITED facility, a $35M plant dedicated 2016, producing soft drinks, bottled water (Dasani), sports drinks, juices, milk drinks, energy drinks and teas — ~25M cases/year, ~120 associates.

### Final confidence
**High.** Facility positively identified by name, address and the branded canopied gate visible in Street View. The gate and guard-shack determinations are backed by direct Street View evidence (highest-confidence calls in this audit). Only `dockDoorCount` and the exact lane counts are approximate and flagged uncertain.

**Archetype indicators:** Gate + guard shack (staffed, canopied multi-lane gate), drop yard, fast-lane room — a classic guarded production-plant entry.
