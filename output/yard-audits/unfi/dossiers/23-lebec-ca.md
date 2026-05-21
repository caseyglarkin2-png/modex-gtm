# UNFI — Lebec CA DC (idx 23)

**Type:** Distribution Center (natural / organic grocery wholesale)
**Resolved location:** NOT POSITIVELY LOCATED
**Confidence:** Low — flagged for human verification

## Location resolution — unresolved

The roster supplied only a city-level entry ("Lebec, CA", source: supplyve /
Indeed locations list) with APPROXIMATE coordinates 34.841644, -118.864819 and
no street address.

- **Supplied coordinates:** probing satellite at 34.8416, -118.8648 (zoom
  15-17) lands in the small town of Lebec, CA, in the I-5 Tejon Pass. Imagery
  shows only small roadside commercial buildings — gas stations, a motel, small
  shops — plus rural hillside residential. There is **no distribution center of
  any kind** at or near the supplied point.
- **Tejon Ranch Commerce Center (TRCC):** the only large-scale industrial
  development in the Lebec/Tejon area is TRCC, a major logistics park roughly
  6 km north along I-5 near Wheeler Ridge (~34.97-34.99, -118.95). Probing TRCC
  shows ~8-12 large distribution buildings. TRCC is anchored by a 1.7M sq ft
  IKEA DC and includes L'Oreal, Dollar General, Caterpillar, Famous Footwear,
  Camping World, RectorSeal and other named tenants.

## Why it could not be confirmed

Multiple web searches were run — UNFI corporate locations pages, TRCC tenant
and lease announcements, commercial real-estate trade press, and UNFI job
listings — and **none named UNFI as a TRCC tenant** or produced a specific UNFI
street address in the Lebec 93243 ZIP code. UNFI's own published locations list
does include "Lebec" as a West-region point, but with no confirming address it
is unclear whether this is a mega-DC at TRCC, a smaller West-region branch/
cross-dock, or simply an imprecise roster entry.

With no distinguishing UNFI signage visible in satellite imagery and no
Street-View-confirmable address, the deep-audit Step 0 requirement — positively
identifying the correct building — could not be met. Auditing an unverified
TRCC building would risk classifying the wrong facility.

## Output

Per the deep-audit protocol for an unlocatable facility, the `.json` is written
with `confidence: "low"`, every classification field listed in
`uncertainFields` and left at conservative defaults, and `geofences` /
`yardMetrics` null/zeroed.

## Recommendation

Human verification is needed to pin the exact UNFI Lebec address — most likely
within the Tejon Ranch Commerce Center if a UNFI DC exists there at all. Once a
confirmed address or building is supplied, a full re-audit can be completed
quickly. Until then this site should not be used for outreach geofencing.

## Final confidence

Low. Facility not positively located.
