# SalSon Logistics — Inland Empire CA (idx 15)

**Facility type:** Intermodal / Warehouse Market
**Roster city:** "Inland Empire (Riverside/San Bernardino area)"
**Roster address:** none supplied
**Roster coords:** none supplied
**Resolved location:** UNRESOLVED
**Confidence:** low

---

## Summary verdict

- **Gate:** undetermined — facility not located.
- **Guard shack:** undetermined — facility not located.
- **Confidence:** low. Not even a city is identified; no address, no coordinates,
  no imagery audited.

## Step 0 — location attempt

This is the vaguest entry on the SalSon roster. The roster does not name a city —
its city field is literally "Inland Empire (Riverside/San Bernardino area)". The
Inland Empire is named only as one of SalSon's California *markets* in the
Aug-2024 merger / footprint coverage (Transport Topics, "SalSon Logistics
Expands New Jersey, California Operations": "Bakersfield, Inland Empire, Long
Beach and Oakland, Calif.").

Research performed:

1. **salson.com** — no Inland Empire / Riverside / San Bernardino / Fontana
   street address on any reachable page.
2. **Indeed company locations page** — lists Torrance as the only California
   city; no Inland Empire city appears.
3. **Submarket sweep** — searched the standard Inland Empire warehouse submarkets
   (Fontana, Mira Loma, Bloomington, Jurupa Valley, Riverside, San Bernardino,
   Ontario) for a SalSon facility; none resolved.
4. **Merged-company trace** — checked the seven Aug-2024 merged companies,
   including TriPack Logistics, for an Inland Empire address; none confirmable.
5. **FMCSA SAFER** — SalSon Logistics Services LLC (USDOT 3968944) registers only
   the Compton CA physical address; no Inland Empire registration.

## Assessment

No specific Inland Empire facility for SalSon can be located. Two plausible
explanations: (a) it is a thin market presence — drivers/dispatch working IE
intermodal lanes with no SalSon-owned building; or (b) "Inland Empire" in the
source coverage is a loose label for what is actually the **Compton CA** build
(roster idx 4) — SalSon's Southern California intermodal/transload hub. If (b),
this entry may be a **duplicate of idx 4** and the run owner should reconcile it.

## Output

`15-inland-empire-ca.json` is written with `confidence: "low"`, all 22
classification fields in `uncertainFields`, null geofences and zeroed
yardMetrics. The classification values present are schema-required placeholders,
not observations.

**Recommended next step:** confirm with SalSon (973-986-0200 / sales@salson.com)
whether a distinct Inland Empire facility exists and, if so, its address — or
fold this entry into idx 4 (Compton) if it proves to be the same operation.
