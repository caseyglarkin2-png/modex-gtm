# Deep-Audit Dossier — KDP Beverage Plant, Northlake IL (idx 9)

## Facility
- **Name:** KDP Beverage Plant - Northlake IL
- **Type:** Manufacturing - Beverage
- **Roster address:** 500 N Wolf Rd, Northlake, IL 60164 (approximate)
- **Web-research address:** 400 N Wolf Rd, Northlake, IL 60164
  (alt. 401 N Railroad Ave)
- **Resolved center:** NOT RESOLVED

## Step 0 — Location confirmation: FAILED
This facility could **not** be positively located, despite a thorough
effort.

- The roster pin (41.918007, -87.903662, RANGE_INTERPOLATED, moved 1 m)
  lands on a **residential intersection** — Wolf Rd & Palmer Ave — beside
  a school campus. Street View (2025-04) confirms ordinary houses and a
  signalized residential intersection. Not an industrial facility.
- Web research (Yelp, YellowPages, Hotfrog, Haystack, D&B, Macrae's)
  consistently lists KDP / "Dr Pepper Seven Up Bottling" at **400 N Wolf
  Rd, Northlake, IL 60164** (one source: 401 N Railroad Ave). Geocoding
  that address also resolves to a **residential block / city park** along
  Wolf Rd. Satellite at that point shows a creek-side park.
- The **entire N Wolf Rd corridor** in the 300-700 block was probed
  (z16-z18): residential housing, schools, parks and athletic fields —
  no large industrial/manufacturing building anywhere on it.
- Northlake's actual industrial corridor, near the Union Pacific Proviso
  rail yard to the south, was probed extensively (multiple z16-z19
  satellite crops; Street View passes along the rail-district streets).
  Many similar warehouse/industrial buildings exist there, a few with
  silos/tanks, but **none could be positively confirmed** as the KDP
  plant — no Dr Pepper signage was visible from any Street View angle.
- Attempts to fetch the MAP Mechanical wastewater-treatment project page,
  the IndustryNet listing, and the D&B profile for a precise address all
  returned login/CAPTCHA walls with no usable location detail.

## Status of the facility
The facility is **confirmed operating** — Teamsters Local 727 represents
575+ Dr Pepper employees across its Northlake and Harvey IL facilities,
with recent (2025) employee reviews. Listing language ("Dr Pepper Seven
Up Bottling", Teamsters "SSRs & Account Managers") suggests the Northlake
site may be a **bottling / DSD distribution operation** rather than a
large standalone manufacturing plant — which would also explain the
modest, hard-to-distinguish footprint.

## Audit result
Because no building could be positively identified, **all 22
classification fields are unverified** and listed in `uncertainFields`.
The geofences are left `null` and `yardMetrics` left at defaults. The only
field inferable with any safety is `urbanRural = "Urban"` (Northlake sits
in dense Chicago-metro fabric). Confidence is **low**.

## Recommendation
Human review with a company-verified address or an exact map pin. The
public address "400 N Wolf Rd" geocodes unreliably and should not be
trusted; the real operating site is likely in Northlake's industrial /
rail district, not on the residential stretch of Wolf Rd.

## Final confidence
**Low.** Facility not located.

- Gate verdict: UNDETERMINED (facility not located)
- Guard-shack verdict: UNDETERMINED (facility not located)
- Confidence: low
