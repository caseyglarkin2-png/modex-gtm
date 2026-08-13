# Tyson Foods — Facility Verification Evidence

STATUS: ACTIVE
Last verified: 2026-08-12

> Filed as `verification-evidence.md`, not `verification-rejections.md`. The FOV
> gate in `scripts/yard-audit/build-demo-pack.ts` **overwrites**
> `verification-rejections.md` on every pack build, so a hand-authored evidence
> record under that name would be destroyed by the next build.

17 candidate sites audited 2026-07-30. This file records the evidence state of
each one against the repo's FOV gate (`scripts/yard-audit/build-demo-pack.ts`),
which requires a verification block, a verdict, at least one identity citation
carrying both a URL and a date, and a completed divestiture check.

**13 of 17 pass. 4 do not and must not ship on any prospect-facing surface.**

None of the 17 is rejected — nothing here is closed, divested, or pre-production.
The four failures are evidence gaps in our own audit, not problems with the
facilities.

## Divestiture / closure gauntlet — run 2026-08-12

The original 2026-07-30 audit set `checkedDivestiture: false` on all 15 records
that had a verification block, with the rationale that the session's WebSearch
budget was exhausted. That gauntlet has now been run.

Tyson's announced closures and divestitures 2023-2026 were swept and each of the
17 audited sites checked against that list by name:

- 2023 poultry: Noel MO, Corydon IN, Glen Allen VA, Van Buren AR
- 2024: Perry IA pork, North Little Rock AR
- 2025: Emporia KS beef; two Original Philly prepared-foods plants, Philadelphia PA
- 2026: Lexington NE beef (closed 2026-01-20, ~3,200 jobs); Rome GA prepared
  foods, operated by Hilshire Brands (closing 2026-05-31, 168 jobs)

**No audited site appears on that list.** `checkedDivestiture` is now `true` on
all 15 records that carry a verification block, with the sweep filed under
`verification.divestitureCitation`. It is deliberately NOT filed in
`verification.citations`: that array is the site's *identity* evidence — the
parcel-was-imaged proof the FOV gate counts — and a closure sweep says nothing
about which parcel was imaged. Filing it there would have flipped two uncited
records to passing on evidence that does not bear on the question.

The two records with no verification block at all (07, 08) were left untouched.
Writing them a verification block would have invented an audit nobody ran.

### Two sites are operating but materially changed

Neither is a divestiture. Both change the yard, so both are flagged rather than
silently carried:

- **03 Amarillo Beef** — cut to one full-capacity shift in January 2026 (~1,700
  workers affected) when Lexington NE closed. Throughput, and therefore yard
  volume, is below what the 2026 imagery shows.
  [Tier 2: https://www.kcur.org/environment-agriculture/2025-12-16/tyson-closing-beef-processing-plant , 2025-12]
- **12 Wilkesboro NC** — the fresh plant was converted to bulk processing, ~500
  of ~2,500 jobs eliminated, further-processing moved off site. The shipping
  profile has changed.
  [Tier 2: https://www.foodprocessing.com/ingredients/animal-proteins/news/55133398/tyson-cuts-more-jobs-shifting-further-processing-out-of-wilkesboro-nc-chicken-plant , 2024]

Storm Lake (06), Waterloo (07) and Columbus Junction (08) were each cited in
2026 coverage as operating, at 17,250 / 19,500 / 10,350 head per day.

## Do NOT ship (4) — evidence gaps, re-audit required

- **07 Waterloo Pork** — no `verification` block at all. The yard was traced and
  classified, but no verdict, operator, tenancy, citation or imagery date was
  ever recorded. Public reporting confirms Tyson operates a Waterloo IA pork
  plant at 19,500 head/day; that establishes the company, not that the imaged
  parcel is it. UNRESOLVED.
- **08 Columbus Junction Pork** — same defect, same reasoning (10,350 head/day).
  UNRESOLVED.
- **11 Shelbyville TN** — verdict `probable`, zero citations. A probable verdict
  with no evidence behind it is an assertion. UNRESOLVED.
- **12 Wilkesboro NC** — verdict `confirmed`, zero citations. The strongest
  verdict in the set with nothing supporting it; this is the one to re-audit
  first. UNRESOLVED.

## Ship-eligible (13)

Confirmed (9): 01 Springdale Complex, 02 Dakota City Beef, 03 Amarillo Beef,
04 Holcomb Beef, 06 Storm Lake Pork, 09 Sherman Poultry TX, 10 Center Poultry
Complex TX, 13 New Holland Poultry, 14 Vicksburg Poultry.

Probable (4): 05 Joslin Beef, 15 Russellville DC, 16 Indianapolis DC,
17 Haltom City DC.

`probable` is ship-eligible by repo precedent — Ford shipped 3 probable sites in
its pack and the FOV gate admits any non-rejected verdict that carries citations.

## Caveats a reader needs

- All 17 sites remain in `sites/` so the account stays consistent with
  `roster.json` (17 facilities) and the 17 dossiers. They therefore all appear in
  `tyson-foods.geojson` and the master index, which are internal audit
  deliverables. **13 is the number that may appear on a prospect-facing surface.**
- The FOV gate defaults to `warn`, which keeps flagged sites. Any Tyson demo pack
  must be built with `FOV_GATE=enforce` or it will ship all 17.
- There is no Tyson demo pack or `/for` page today, so nothing public currently
  quotes any Tyson count.
- Citation tiers on the passing records skew to Tier 3 (Street View signage,
  Google Places). That is the corpus norm for identity, but it is weaker than the
  Tier-1 documentary check (10-K Item 2, careers postings) the deep-audit prompt
  asks for. Seven records say so in their own rationale.
