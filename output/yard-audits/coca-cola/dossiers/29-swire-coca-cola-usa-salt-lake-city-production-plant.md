# Deep-Audit Dossier — idx 29

## Swire Coca-Cola USA — Salt Lake City Production Plant, UT

**Roster address:** 5405 W 1730 S, Salt Lake City, UT 84104 (incorrect)
**Resolved address:** 2269 S 3270 W, West Valley City, UT 84119
**Best-estimate center:** 40.7287, -111.9712 (NOT positively confirmed)
**Confidence:** low

### Step 0 — Location resolution

The roster supplied "5405 W 1730 S, Salt Lake City" and coords
40.732482, -112.02077. Investigation showed these are wrong:

- A satellite + Street View probe of the roster coordinates found an
  office-style building with a barrier-gate driveway and a "West 1730 South"
  monument sign — **no Coca-Cola branding**.
- "5405 W 1730 S" does **not** appear in Swire Coca-Cola's official Utah
  facility list. Swire's Utah facilities are: Draper HQ (12634 S 265 W),
  **West Valley City production plant (2269 S 3270 W)**, Ogden, Logan, Price,
  and Richfield.
- Multiple directories (Yelp "Swire Coca-Cola - Production Plant"; a Waze
  "Swire Coca-Cola truck staging area" entry; YellowPages) confirm the Swire
  Coca-Cola Salt Lake City production/manufacturing plant is at **2269 S
  3270 W, West Valley City, UT 84119** (phone 801-816-5300). This is the plant
  that won a 2023 environmental award and cut water use 19% in 2022.

So the audit target is 2269 S 3270 W, West Valley City — not the roster's
5405 W 1730 S.

### Key views

Probing the 3270 W industrial corridor of West Valley City (~40.7296,
-111.969) located a dense multi-tenant logistics park. Candidate buildings
include a large warehouse-with-docks complex (~40.7287, -111.9712) and a
building with a red dock canopy. However:

- The red-canopy building's yard was observed handling a **Gatorade** trailer
  (a PepsiCo competitor brand) — so it is not Swire Coca-Cola.
- Other buildings showed third-party logistics tenants in Street View (a UPS
  truck; "PDIIKE Distribution Logistics" signage).
- No Coca-Cola / Swire signage could be resolved on any specific building.

The exact Swire Coca-Cola building footprint therefore could not be
unambiguously isolated.

### Gate / guard-shack / dock determinations

Not determinable. All physical-layout classification flags left `false`/`null`
and listed in `uncertainFields` because the correct facility building could not
be confirmed — attributing a gate, docks, guard booth, or yard to it would be
guesswork.

### Yard zones and counts

Not measurable. `perimeter` is an estimated box around a candidate warehouse
complex; `yardMetrics` set to 0 / defaults.

### Web findings

- Swire Coca-Cola, USA — Utah operations since 1978; 1,400 employees across 6
  Utah facilities; ~$3B revenue; produces/distributes in 13 western states.
- Salt Lake City production plant at 2269 S 3270 W, West Valley City; 2023
  environmental award; 2022 water-system upgrade cut water use 19%.

### Final confidence: low

The roster address and coordinates are wrong. The correct address (2269 S
3270 W, West Valley City) is confirmed, and the general industrial corridor was
located, but the exact Swire Coca-Cola building could not be positively
identified in imagery within a dense multi-tenant logistics park.
**Recommend correcting the roster address and re-auditing once the precise
building footprint is confirmed.**
