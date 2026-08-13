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

**7 of 17 pass. 10 do not and must not ship on any prospect-facing surface.**

(This was 13 of 17 until 2026-08-12, when the gate was tightened to require at
least one DURABLE, INDEPENDENT citation. Six records were passing on evidence we
had issued ourselves. See "The six demoted" below — the records are unchanged;
the bar moved to where it should always have been.)

None of the 17 is rejected — nothing here is closed, divested, or pre-production.
Every failure is an evidence gap in our own audit, not a problem with the
facility.

## Divestiture / closure gauntlet — run 2026-08-12

The original 2026-07-30 audit set `checkedDivestiture: false` on all 15 records
that had a verification block, with the rationale that the session's WebSearch
budget was exhausted. That gauntlet has now been run.

Tyson's announced closures and divestitures 2023-2026 were swept and each of the
17 audited sites checked against that list by name. One source per closure, each
with its real publication date — the full list is on every record under
`verification.divestitureCheck.sources`:

| Closure | Source | Published |
|---|---|---|
| Glen Allen VA, Van Buren AR poultry | npr.org | 2023-03-15 |
| Noel MO, Corydon IN, Dexter MO poultry | wattagnet.com | 2023-08 |
| Perry IA pork | nationalhogfarmer.com | 2024 |
| Emporia KS beef; 2x Original Philly, Philadelphia PA | agriculturedive.com | 2024-12-04 |
| Lexington NE beef; Amarillo TX cut to one shift | kcur.org | 2025-12-16 |
| Rome GA prepared foods (Hilshire Brands) | wrdw.com | 2026-04-03 |

**No audited site appears on that list.** `checkedDivestiture` is now `true` on
all 15 records that carry a verification block, with the sweep filed under
`verification.divestitureCheck`. `sweptAt` (2026-08-12) is the date the check was
run and is deliberately kept separate from each source's publication date, so
neither can be mistaken for the other.

Absence from a closure list is **negative** evidence — it shows the plant was not
shut. It is not positive evidence that Tyson still owns the imaged parcel; that
is what `verification.citations` is for. The sweep is deliberately NOT filed in
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

Storm Lake (06), Waterloo (07) and Columbus Junction (08) are absent from every
closure announcement in the table above. Per-plant throughput figures surfaced
during the sweep are deliberately NOT recorded here — no URL for them survived
into this branch, and an uncited number in the evidence file is the exact defect
this file exists to prevent.

## Do NOT ship — 10 of 17

### Four with no usable identity evidence at all

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

### Six with evidence, but none of it independent

03 Amarillo Beef, 04 Holcomb Beef, 05 Joslin Beef, 06 Storm Lake Pork,
13 New Holland Poultry, 14 Vicksburg Poultry.

Their verdicts and their research are untouched. What changed is that
`scripts/yard-audit/evidence.ts` now requires at least one citation that a
reader can open and that we did not issue ourselves. These six were supported
only by `yardflow.ai/for/tyson-foods` (our own page, cited as evidence for our
own claim) and by `places.googleapis.com` / `maps.googleapis.com` lookups our
auditing agent performed — key-gated endpoints that record a query, not a
document.

One durable third-party or Tyson-owned source per site restores each of them
legitimately. That is the highest-value remaining work on this account.

The rule change was dry-run across the whole corpus before shipping: it demotes
6 records, all Tyson, and ZERO sites in any of the 58 public demo packs.

## Ship-eligible — 7 of 17

Confirmed (4): 01 Springdale Complex, 02 Dakota City Beef, 09 Sherman Poultry
Plant TX, 10 Center Poultry Complex TX.

Probable (3): 15 Russellville DC, 16 Indianapolis DC, 17 Haltom City DC.

`probable` is ship-eligible by repo precedent — Ford shipped 3 probable sites in
its pack and the FOV gate admits any non-rejected verdict that carries citations.

## Caveats a reader needs

- All 17 sites remain in `sites/` so the account stays consistent with
  `roster.json` (17 facilities) and the 17 dossiers. They therefore all appear in
  `tyson-foods.geojson` and the master index, which are internal audit
  deliverables. **7 is the number that may appear on a prospect-facing surface.**
- The FOV gate defaults to `warn`, which keeps flagged sites. Any Tyson demo pack
  must be built with `FOV_GATE=enforce` or it will ship all 17.
- There is no Tyson demo pack or `/for` page today, so nothing public currently
  quotes any Tyson count.
- Citation tiers on the passing records skew to Tier 3 (Street View signage,
  Google Places). That is the corpus norm for identity, but it is weaker than the
  Tier-1 documentary check (10-K Item 2, careers postings) the deep-audit prompt
  asks for. Seven records say so in their own rationale — several carry a verdict
  of `confirmed` while their own rationale opens "Session WebSearch budget was
  exhausted, so no Tier-1 documentary check was run." Read those two fields
  together before quoting a Tyson site as verified.
- **The FOV gate only tests that a citation has a URL and a date, not that the
  URL is independent or resolvable.** Two weaknesses show up in this tranche and
  the gate cannot see either:
  - Sites 03, 04 and 05 cite `yardflow.ai/for/tyson-foods` — our own page, as
    evidence for our own claim. That is circular and should be replaced.
  - Several citations are key-gated Google API endpoints
    (`places.googleapis.com/v1/places:searchNearby?...`) that the auditing agent
    issued itself. They are a record of a lookup, not a document a reader can
    open. Treat them as the weakest tier, not as sourcing.
  Neither is unique to Tyson — it is a corpus-wide property of the gate. Fixing
  the gate is out of this lane's scope and is recorded as a follow-up.
