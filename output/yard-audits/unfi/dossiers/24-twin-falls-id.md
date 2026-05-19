# UNFI — Twin Falls ID DC (idx 24)

**Type:** Distribution Center (natural / organic grocery wholesale)
**Resolved location:** NOT POSITIVELY LOCATED
**Confidence:** Low — flagged for human verification

## Location resolution — unresolved

The roster supplied only a city-level entry ("Twin Falls, ID", source:
supplyve / Indeed locations list) with APPROXIMATE coordinates 42.555838,
-114.470052 and no street address. The roster's own geocode metadata records
`movedMeters: 3492` — a known ~3.5 km geocode error.

- **Supplied coordinates:** probing satellite at 42.5558, -114.4701 lands in
  the downtown / commercial-retail core of Twin Falls — no distribution center.
- **Industrial districts probed:**
  - NW (College of Southern Idaho vicinity) — residential/institutional, no
    DCs.
  - SW industrial cluster along the Snake River canyon — smaller industrial
    buildings, no identifiable grocery DC.
  - SE / east-central industrial corridor — the largest concentration of
    warehouses, but predominantly medium-size buildings and agricultural-
    processing plants (Twin Falls is a major food-processing town). No building
    showed distinguishing UNFI signage or the clear large-grocery-DC profile.

## Why it could not be confirmed

Multiple web searches — UNFI corporate locations pages, warehouse directories
(warehouse.ninja, supplyve), commercial real-estate listings, and UNFI job
postings — confirmed that UNFI lists "Twin Falls" as a location but produced
**no specific street address**. Twin Falls is a relatively small market;
UNFI's West/Mountain region is anchored by larger DCs elsewhere (Centralia WA,
Ridgefield WA, Moreno Valley CA, Rocklin CA — several audited in this same run).
The Twin Falls entry is most plausibly a smaller West/Mountain-region branch or
cross-dock rather than a mega-DC, or the roster entry is simply imprecise.

With no confirmable address and no distinguishing signage in satellite imagery,
the deep-audit Step 0 requirement — positively identifying the correct
building — could not be met. Auditing an unverified Twin Falls building would
risk classifying the wrong (or a non-UNFI) facility.

## Output

Per the deep-audit protocol for an unlocatable facility, the `.json` is written
with `confidence: "low"`, every classification field listed in
`uncertainFields` and left at conservative defaults, and `geofences` /
`yardMetrics` null/zeroed.

## Recommendation

Human verification is needed to pin the exact UNFI Twin Falls street address.
Once a confirmed address or building is supplied, a full re-audit can be
completed quickly. Until then this site should not be used for outreach
geofencing.

## Final confidence

Low. Facility not positively located.
