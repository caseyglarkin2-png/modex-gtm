# Caterpillar — Facility Verification Rejections

FOV scrub run 2026-06-18 (agent). 21 sites verified against the facility-verification protocol
(`scripts/yard-audit/verify-facility-prompt.md`). Watch-note for Caterpillar: CAT sells through
INDEPENDENT DEALERS, so a dealer site is never CAT-operated; CAT-operated = manufacturing plants,
parts/distribution centers, foundries, and demo/research sites with yards. Closure/divestiture
gauntlet run on every site.

Result: **19 confirmed, 0 probable, 2 rejected.**

## Rejected (2)

- **Caterpillar - Aurora (Montgomery) IL Plant** (325 State Route 31, Montgomery IL; ~41.714, -88.3645)
  — REJECTED: Caterpillar announced closure of this wheel-loader plant in 2017 and **SOLD the
  ~4M sq ft campus to Reich Brothers in 2020 for $68.5M**. The site is now "The Grid at Route 31,"
  a multi-tenant industrial park (tenants incl. Tangent Technologies, U.S. Medical Glove). CAT only
  leases back ~200k sq ft of office space for an engineering team — there is no CAT-operated freight
  yard here. The existing audit JSON already flagged "now marketed as 'The Grid at Route 31'" /
  "reportedly listed for sale"; this confirms it as sold/divested.
  [Tier 2: https://thevoice.us/former-caterpillar-plant-in-montgomery-takes-new-life/ , 2020-03]
  [Tier 2: https://www.loopnet.com/Listing/325-State-Route-31-Montgomery-IL/32706736/ , 2024]

- **Caterpillar Work Tools - Wamego KS Plant & Distribution** (Wamego KS; ~39.2038, -96.2933)
  — REJECTED: Caterpillar announced (Jun 2024) it would close its Wamego attachments/work-tools
  facility and end the workforce in mid-2025. The plant was shut down by CAT and the facility was
  then **sold to a new (non-CAT) owner** in 2025; it now operates under that new owner, not
  Caterpillar.
  [Tier 2: https://www.wibw.com/2024/06/06/caterpillar-inc-close-workforce-mid-2025-wamego-facility/ , 2024-06-06]
  [Tier 2: https://www.ksnt.com/news/local-news/wamego-caterpillar-facility-changes-ownership-local-jobs-saved/ , 2025-05]

## Re-pin / follow-up flags

- **Aurora (Montgomery) IL** — drop from the CAT audit corpus. Do NOT image, geofence, or classify
  as a CAT yard. If a CAT IL wheel-loader yard is still wanted, note production moved off this site;
  there is no current CAT-operated replacement yard at this address.
- **Wamego KS** — drop from the CAT corpus. The yard still exists physically but under new ownership;
  not a Caterpillar-operated site.

## Notes on confirmed sites that needed extra disambiguation (kept, not rejected)

- **Winston-Salem NC (axle plant)** — axle/mining production was phased out; the plant was repurposed
  to rail equipment and transferred to **Progress Rail effective Jan 1 2024**. Progress Rail is a
  WHOLLY OWNED Caterpillar subsidiary, so the site remains Caterpillar-operated (operator: self).
  Kept confirmed.
- **South Milwaukee WI (global mining)** — former Bucyrus/P&H site, CAT-owned since 2011. The widely
  reported 2016 "cessation" applied only to the old main building; CAT still operates the site making
  electric rope shovels and draglines (2023 CAT 130-year press release). Kept confirmed.
- **Mossville IL (engine & research campus)** — the historic engine-MANUFACTURING wind-down / 2016
  Building BB demolition is a single vacated building, not a sale of the campus. The Mossville
  Technical Center is CAT-operated and active (current June-2026 onsite CAT R&D requisitions at
  Building K). Kept confirmed.
- **East Peoria, Decatur, Victoria** — only TEMPORARY layoffs found in the gauntlet (demand-driven
  week-long furloughs in 2024; 2019/2020 temp-worker cuts at Victoria), no closure or sale. The
  Illinois plant that was actually sold is Aurora/Montgomery, not these. Kept confirmed.
