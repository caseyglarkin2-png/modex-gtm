---
date: 2026-05-10
scope: 15 Tier-1 expansion account microsites — content gap delta between memo-compat fallback render and the underlying dossier intel
audience: Casey (YardFlow / FreightRoll) — pre-implementation review before any per-account hand-tuning
motivation: |
  The 25 "original" hand-tuned accounts (dannon, campbell-s, diageo, frito-lay, general-mills,
  hormel-foods, etc.) ship ~250–600 lines of bespoke `sections` prose, observation tables,
  comparable metrics, persona-aware framingNarratives, and citation footnotes. The 15 new
  Tier-1 expansion accounts (Kraft Heinz, Daimler Truck NA, Nestle USA, Kimberly-Clark,
  Bob Evans Farms, DHL Supply Chain, Pactiv Evergreen, SC Johnson, Boston Beer, Westrock
  Coffee, UNFI, Cost Plus, Universal Logistics, CJ Logistics, SalSon) each ship ~95–110
  lines and declare `sections: [{ type: 'yns-thesis' }]` — which trips the fallback
  branch in `resolveMemoSections()` (memo-compat.ts:61–65) and renders 5 generated
  sections from generic templates. Meanwhile each account has a ~250–500-line dossier in
  `docs/research/<persona>-<account>-dossier.md` with the operational specifics that
  would power a hand-tuned memo. This audit quantifies that gap, account-by-account.

tldr: |
  - All 15 accounts hit the `buildMemoSectionsFromAccount()` fallback path. The yns-thesis
    section is universal (acceptable). The methodology section is universal (acceptable).
    The observation section is generic for every account because `network.facilityCount`,
    `network.dailyTrailerMoves`, and `freight.avgLoadsPerDay` are mostly literal "see dossier"
    or vague placeholders — so the rendered table reads as a placeholder, not a finding.
    The comparable section is identical for every one of the 15 (Primo Brands boilerplate)
    except where a `proofBlocks[0]` is present — in those cases the Kaleris case-study
    quote gets used as the comparable, which is a worse outcome than Primo for accounts
    where Kaleris is the displacement target (Kraft Heinz, Bob Evans, Cost Plus, Westrock
    Coffee), since the rendered comparable then names the incumbent vendor inside the
    "what a comparable did" frame. The about section renders with no person-name and no
    title for 13 of 15 accounts (only people[0] is referenced and it is "[verify]"). 
  - Recommended next step: Phase 1 cheap-fix sweep across `network.*` and `freight.*` fields
    on all 15 accounts (1–2 hrs total) gets every observation table to render specific
    facts instead of placeholders. Phase 2 (per-account proofBlocks rewrite, 4–6 hrs)
    fixes the comparable section. Phase 3 (full hand-author for the top 3–5 accounts most
    likely to receive prospect click-throughs, 1–2 days) brings them up to dannon-level.
---

# Tier-1 Expansion Microsite Content Gap Audit

## TL;DR

Across all 15 Tier-1 expansion accounts (Kraft Heinz, Daimler Truck NA, Nestle USA, Kimberly-Clark, Bob Evans Farms, DHL Supply Chain, Pactiv Evergreen, SC Johnson, Boston Beer, Westrock Coffee, UNFI, Cost Plus, Universal Logistics, CJ Logistics, SalSon), the rendered `/for/<slug>` page is a **fallback render** — not hand-tuned content. The contract works (`needsHandTuning: true` triggers the banner), but it leaves substantial dossier intel un-surfaced.

The three highest-impact gaps to close, in priority order:

1. **The comparable section silently mis-promotes the displacement target.** For the four confirmed Kaleris customers (Kraft Heinz, Bob Evans, Cost Plus, Westrock Coffee), `proofBlocks[0]` is a case-result quoting Kaleris as the *delivery vendor* (e.g., "Kaleris case study: Kraft achieved 50% reduction in truck and driver resources at site level"). The fallback's `pickComparableProof()` (memo-compat.ts:181–188) grabs this block and renders it inside a section headlined *"What a comparable network did when they closed the same gap"* — which reads as if Kaleris is the comparable solution. This is exactly backward from the pitch shape ("displacement / modernization layered above site-level Kaleris"). Either remove these proofBlocks or hand-author the comparable section.

2. **The observation table renders placeholders, not findings.** For 11 of 15 accounts, `network.facilityCount` is a literal string like "Large distributed manufacturing and distribution network (see dossier)" and `dailyTrailerMoves` is the literal string "see dossier". The dossiers contain the actual numbers — `~30 plants in the U.S.` (Kraft Heinz), `9 plants + 10 PDCs + Whitestown RDC` (Daimler Truck NA), `~20 US factories` (Nestle USA), `52 distribution centers` (UNFI), `~95 combined sites` (Pactiv Evergreen via Novolex), `Newark 55-acre / ~2,000 containers/week` (SalSon). The Phase 1 cheap-fix pass below moves all of these from placeholder to fact.

3. **The about section renders empty author/people context for 14 of 15 accounts.** `buildAbout()` doesn't actually pull `data.people[0]` — it returns a Casey Larkin bio block — but the page surface around it (in account templates that include people grids) renders "[verify] / [verify]" because every new account ships placeholder people records. Cheap fix: even just naming one verified person from the dossier per account fixes this.

Phase 1 (cheap, network-field sweep): **1–2 hrs**
Phase 2 (proofBlocks rewrite, comparable section fix): **4–6 hrs**
Phase 3 (full hand-author for top 3–5 accounts): **1–2 days**

---

## How the fallback path works (one paragraph for orientation)

`resolveMemoSections(data)` (memo-compat.ts:61–65) returns native `MemoMicrositeSection` entries when `data.sections` contains ≥3 of them. All 15 expansion accounts ship `sections: [{ type: 'yns-thesis' }]` — one section, only 1 memo-type — so the function falls through to `buildMemoSectionsFromAccount(data)` which emits 5 sections built from `data.network`, `data.freight`, `data.signals`, `data.proofBlocks`, and a Casey-Larkin authored about block. Output:

- **yns-thesis**: identical across all accounts. No data inputs. Acceptable.
- **observation**: composition table from `network.*` + `freight.*`; hypothesis prose from `signals.urgencyDriver` (or supply-chain initiatives / facility count fallback). Two paragraphs that compound the facts in the table.
- **comparable**: if `proofBlocks` is non-empty, picks first proof that mentions Primo, else first case-result, else proofBlocks[0]. Renders as a "what a comparable did" section. If `proofBlocks` is empty, defaults to the Primo Brands boilerplate (memo-compat.ts:167–179) with three universal metrics.
- **methodology**: identical across all accounts. Three universal sources (public network data, ATA + Aberdeen, Primo NDA) + four universal unknowns. Acceptable.
- **about**: identical Casey Larkin bio + signOff that interpolates `data.accountName`. Acceptable.

The leverage is in observation + comparable — those are the two sections that move when you hand-tune.

---

## Per-account sections

### 1. Kraft Heinz

- **Header:** `kraft-heinz` · persona target: Flavio Torres (EVP & Global CSCO) · dossier: `docs/research/flavio-torres-kraft-heinz-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` is non-empty (Kaleris case-result) so the comparable section uses it.
- **What the fallback shows today:**
  - *yns-thesis*: universal.
  - *observation* table renders: `Facility footprint: Large distributed manufacturing and distribution network (see dossier)` · `Facility types: Manufacturing Plants · Distribution Centers` · `Geographic spread: North America (HQ: Chicago, IL / Pittsburgh, PA)`. No `dailyTrailerMoves`, no `avgLoadsPerDay` (both literally "see dossier" — the builder skips empty/placeholder-shaped strings... actually no — it doesn't filter; it renders the literal string "see dossier" as the value). Hypothesis prose pulls `signals.urgencyDriver` = "Network standardization wedge — site-level YMS vs. true network operating model." That reads OK but is generic.
  - *comparable* section: `pickComparableProof()` grabs the case-result block. Renders headline *"What a comparable network did when they closed the same gap"*, comparableName = "Kaleris case study, 2025" (because `proof.quote.company`), comparableProfile = "Kaleris case study: Kraft achieved 50% reduction in truck and driver resources at site level." This is the displacement target being named inside the comparable frame — **actively counterproductive copy**.
  - *methodology*: universal.
  - *about*: universal Casey bio with `${data.accountName}` = "Kraft Heinz" interpolated.
- **Gap delta vs. dossier:**
  - Dossier specifies **~70 plants globally, ~30 in the U.S.**, Holland MI / Davenport IA / Stockton CA / DeKalb IL / Pittsburgh PA named — none of this surfaces.
  - **Stockton 2006 origin** of the PINC relationship (two-decade incumbent) — not surfaced.
  - **DeKalb 2027 greenfield** (775,000 sq ft, $400M, >60% foodservice volume) — the single highest-leverage pitch hook in the dossier — not surfaced.
  - **Kraft Heinz Lighthouse** (Microsoft control tower) — Torres' personal signature project, named hook in the dossier — not surfaced.
  - **Torres' AmBev / AB InBev pedigree** — the "AB InBev for yards" pitch line — not surfaced.
  - **$3B U.S. manufacturing modernization (May 2025)** — surfaced nowhere.
  - **Agile@Scale 20% inventory cut** — turns yard variance into a working-capital lever — not surfaced.
- **Recommendation:** Heavy lift. Kraft Heinz is the dossier-richest account in the cohort and the displacement-target naming bug in the comparable section is actively harmful. **Phase 2 minimum**: replace `proofBlocks[0]` with a real Primo-shaped proof, OR delete it (forcing the Primo boilerplate fallback, which reads better than the Kaleris quote). **Phase 3 ideal**: hand-author observation prose around Lighthouse + DeKalb + 30-plant footprint; hand-author comparable around Primo with reference to the 237-facility anchor pattern; cite the Stockton 2006 origin in methodology.

### 2. Daimler Truck North America

- **Header:** `daimler-truck-north-america` · persona target: Jeff Allen (SVP Operations & Specialty Vehicles) · dossier: `docs/research/jeff-allen-daimler-truck-north-america-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` non-empty (Kaleris/HID/RFID case-result).
- **What the fallback shows today:**
  - *observation* table renders: `Facility footprint: Multi-site manufacturing and parts network (see dossier)` · `Facility types: Manufacturing Plants · Parts Distribution Centers` · `Geographic spread: North America (HQ: Portland, OR)`. `dailyTrailerMoves` and `avgLoadsPerDay` empty/placeholder. Hypothesis pulls `urgencyDriver` = "Modernization wedge — RFID/RTLS visibility versus true network workflow orchestration." Acceptable copy, no Daimler-specific facts.
  - *comparable* section: case-result block selected; renders "Kaleris + HID/RFID.com case studies, 2025" as the comparable. **Same displacement-target-in-comparable bug as Kraft Heinz.**
- **Gap delta vs. dossier:**
  - **9 U.S.+Mexico plants** running PINC since the **Saltillo 2012 pilot** (Portland OR / Cleveland NC / Mt. Holly NC / Gastonia NC / High Point NC / Gaffney SC / Saltillo MX / Detroit Redford MI + 1 more) — none surfaced.
  - **10 PDCs + Whitestown IN 605,000 sq ft RDC (Aug 2023)** — not surfaced.
  - **850,000th truck delivered Cleveland July 2025** — 70 years of layered yard process, exactly where 2012-era RFID config ages worst — not surfaced.
  - **Q1 2026 order intake +85% YoY** — the "ramp without burning carrier goodwill" pitch window — not surfaced.
  - **eCascadia / eM2 battery-electric series production at Portland** — new yard surfaces (battery handling, charging-bay marshalling) the 2012 PINC config wasn't designed for — not surfaced.
  - **Saltillo 500+ trailers in yard at peak** (from PINC case study itself) — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: set `network.facilityCount: '9 U.S.+Mexico plants + 10 PDC parts network'`, `network.dailyTrailerMoves: '500+ in yard at peak (Saltillo)'`. Phase 2: rewrite proofBlock to be either a Primo-shape comparable, or delete and use boilerplate. Phase 3 candidate — DTNA dossier is strong, the pitch hook (Q1 +85% order rebound + eCascadia greenfield yard) is timely.

### 3. Nestle USA

- **Header:** `nestle-usa` · persona target: Jeff Kurtenbach (VP Supply Chain) · dossier: `docs/research/jeff-kurtenbach-nestle-usa-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → comparable section hits the Primo boilerplate (good).
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Large distributed manufacturing and distribution network (see dossier)` · `Geographic spread: North America (HQ: Arlington, VA)`. Placeholder-shaped. Hypothesis prose uses `urgencyDriver` = "Network standardization wedge — confirm PINC/Kaleris footprint in discovery." Reads as internal note bleeding into prospect-facing copy.
  - *comparable*: Primo Brands boilerplate. Acceptable as a fallback.
- **Gap delta vs. dossier:**
  - **~20 U.S. factories** (Solon OH, Jonesboro AR, Gaffney SC, Anderson IN, Glendale AZ ($675M, opened mid-2024), Suffolk VA, etc.) — not surfaced.
  - **Kurtenbach's Frito-Lay finance roots** + **Nestlé Waters NA bridge** (operationally analogous to the unnamed Tier-1 CPG anchor's network — he has personally seen what a bottled-water yard looks like under volume pressure) — the single sharpest insight in the dossier; entirely un-surfaced.
  - **Arlington VA corp HQ vs. Solon OH supply-chain HQ split** + **Glendale CA legacy west-coast core** — Kurtenbach's geographic placement is itself a routing signal.
  - **Gaffney SC $150M expansion (Nov 2024)** + **Glendale AZ $675M plant + DC (mid-2024 greenfield)** — recent investments that put yard pressure on adjacent network — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: `network.facilityCount: '~20 U.S. factories across 28 states'`, `network.geographicSpread: 'North America (corp HQ Arlington VA; supply-chain HQ Solon OH)'`. Strip the "confirm PINC/Kaleris footprint in discovery" internal-note phrasing out of `urgencyDriver` — that bleeds into rendered hypothesis prose. Phase 3 candidate if Kurtenbach intro lands.

### 4. Kimberly-Clark

- **Header:** `kimberly-clark` · persona target: Tamera Fenske (CSCO) · dossier: `docs/research/tamera-fenske-kimberly-clark-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Global manufacturing and distribution network (see dossier)` · `Geographic spread: North America (HQ: Irving, TX)`. `urgencyDriver` again surfaces internal-note language ("verify PINC/Kaleris footprint before outreach") — bleeds into prospect-facing prose.
- **Gap delta vs. dossier:**
  - **~50 facilities globally, 15–20 in North America** — not surfaced.
  - **Powering Care strategy + plant-closure wave (Marinette WI, Cold Spring, Lakeview)** — the operational context that makes yard-throughput-without-capex relevant — not surfaced.
  - **Fenske's Stanley Black & Decker industrial-ops pedigree** — she thinks in OEE, takt-time, throughput-per-sq-ft — the pitch should match that vocabulary — not surfaced.
  - **HQ relocation Neenah WI → Irving TX (2023–2024)** — organizational signal — not surfaced.
  - **2009 PINC Yard Hound legacy signal** is the only thing in `signals.recentNews` and it bleeds into rendered hypothesis text.
- **Recommendation:** Phase 1 cheap-fix: set `network.facilityCount: '~15–20 NA manufacturing facilities (Personal Care + Consumer Tissue + K-C Professional)'`. Strip the verification-language out of `urgencyDriver`. Phase 3 secondary candidate — Fenske dossier is rich but no warm intro path, so direct hand-tuning ROI is lower than for warm-intro accounts.

### 5. Bob Evans Farms

- **Header:** `bob-evans-farms` · persona target: John Ash (Sr. Director Transportation & Warehousing) · dossier: `docs/research/john-ash-bob-evans-farms-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` non-empty (Kaleris 40%-loaded-reefer-hours case-result).
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Multi-site refrigerated food manufacturing and distribution (see dossier)` · `Geographic spread: Midwest US (HQ: Columbus, OH)` · `Detention exposure` is empty.
  - *comparable* section: **same displacement-target-in-comparable bug**. Case-result block renders "Kaleris YMS case study archive, 2026" as the comparable, with the headline *"What a comparable network did when they closed the same gap"* — naming the incumbent vendor inside that frame.
- **Gap delta vs. dossier:**
  - **4 production facilities** (Bob Evans' own public count) + **Springfield OH transportation hub + Forney TX outpost** — not surfaced.
  - **Kaleris 2022 deployment, 3 years old, ~$471K hard year-one savings + 134,000 hours** — the year-3 plateau argument (next-layer-above) is the dossier's main pitch — not surfaced.
  - **Post Holdings parent + Refrigerated Retail segment + Catoggio promotion to COO (Jan 2026)** — corporate-context-windowing the pitch — not surfaced.
  - **USDA FSIS inspection regime at sausage plants** — yard-system rollouts have to clear USDA-aware change control — vendor-filter signal — not surfaced.
  - **Ash's carrier→3PL→shipper career arc** — does not need dwell-cost story told to him — peer-level framing — not surfaced.
- **Recommendation:** Phase 2 minimum: delete or rewrite `proofBlocks[0]` so the comparable section doesn't name Kaleris. Phase 3 candidate — the "what comes after year 3 of a YMS deployment" pitch is one of the cleanest shapes in the cohort.

### 6. DHL Supply Chain

- **Header:** `dhl-supply-chain` · persona target: Adrian Kumar (VP Solutions Design Americas) · dossier: `docs/research/adrian-kumar-dhl-supply-chain-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Very large global logistics network (see dossier)` · `Facility types: Contract Logistics Warehouses · Distribution Centers · Fulfillment Centers`. Hypothesis pulls `urgencyDriver` = "3PL customer visibility wedge — partner on yard standardization as a customer-facing differentiator." Reads OK at a generic level but no DHL-specific anchor.
- **Gap delta vs. dossier:**
  - **1,000+ facilities globally; 52,000 NA associates; NA HQ Westerville OH** — not surfaced.
  - **Kumar's "swarming" AMR architectural preference** — "orchestration over rigid task assignment" — exactly the mental model a yard-execution layer requires — peer-level hook un-surfaced.
  - **2025 M&A buildout (Inmar / IDS / CRYOPDP) + Strategy 2030 + DHL ReTurn Network (Oct 2025) + 10 new dedicated warehouse sites totaling 7M+ sq ft for data-center logistics (Mar 2026)** — three concrete network-expansion vectors, each a yard-standardization opportunity — not surfaced.
  - **Kumar runs ~500 projects/year through a 50-engineer team** — pitch needs to fit his "does this fit the standard stack" framework early — not surfaced.
  - **Diageo Plainfield IL named DHL customer (EV yard trucks + Nikola hydrogen Class 8)** — cross-reference to another existing YardFlow account dossier — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: set `network.facilityCount: '1,000+ facilities globally; 52,000 NA associates'`, `network.geographicSpread: 'Global; NA HQ Westerville OH'`. Phase 3 candidate — partnership-shape pitch lands hardest when DHL-customer-network angle is named, which means full hand-author.

### 7. Pactiv Evergreen

- **Header:** `pactiv-evergreen` · persona target: Chuck Whittington (Chief Transformation Officer, Novolex) · dossier: `docs/research/chuck-whittington-pactiv-evergreen-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation* table: this is the ONE account in the cohort where `network.facilityCount` already contains a specific number — `'50+ manufacturing facilities, 42 distribution centers'`. Renders cleanly. `Geographic spread: North America (HQ: Lake Forest, IL)` — but the dossier flags this as wrong post-April-2025 (combined HQ now Charlotte NC under Novolex; Lake Forest IL is now a major operating site, not HQ).
  - Hypothesis prose pulls `urgencyDriver` = "Manufacturing yard orchestration wedge — verify PINC footprint; then standardize across network." Internal-note language again bleeds into prospect-facing prose.
- **Gap delta vs. dossier:**
  - **Apr 2025 Novolex merger; combined ~95+ sites, 20,000+ employees, 250+ brands, 39,000+ SKUs** — Pactiv is now a Novolex business unit, not a standalone — the entire framing is stale.
  - **Whittington is now Chief Transformation Officer at Novolex** (not VP at Pactiv Evergreen) — running the IMO across the combined entity — title in `people[0]` is wrong.
  - **PINC deployment history at 12 Pactiv sites (Oct 2019 case study)** — Whittington knows the history personally — not surfaced.
  - **Plant closures (Canton NC 2023, Pine Bluff AR 2024 to Suzano, Olmsted Falls OH 2023, Kalamazoo MI Apr 2025)** — context for the integration story — not surfaced.
- **Recommendation:** Phase 1 cheap-fix is *critical* here — the HQ/parent-brand fields are stale post-Novolex-merger. Update `parentBrand: 'Novolex'`, `geographicSpread: 'North America (combined HQ: Charlotte, NC; major operating site: Lake Forest, IL)'`. Update `people[0]` title to "Chief Transformation Officer". Strip verification language out of `urgencyDriver`. Phase 3 not warranted yet — wait for warm-intro signal.

### 8. SC Johnson

- **Header:** `sc-johnson` · persona target: Rick Camacho (Global CSCO) · dossier: `docs/research/rick-camacho-sc-johnson-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation* table: `Facility footprint: Distributed manufacturing network (see dossier)` · `Geographic spread: North America (HQ: Racine, WI)`. `urgencyDriver` = "Manufacturing yard orchestration wedge — manual review required before PINC/Kaleris assertion." Internal note again bleeds into prospect-facing prose.
- **Gap delta vs. dossier:**
  - **Waxdale (Sturtevant WI) — 2.2 million sq ft, largest single aerosol-producing facility in the world, 60M cases/year, 430M aerosol cans/year, 500 aerosols/minute on some lines** — the single most-recognizable CPG flex in the dossier — not surfaced. This is exactly the kind of attribute-identifier the editorial style guide calls for.
  - **Bay City MI Ziploc hub** (350 employees, 500 acres, 6 production buildings) — not surfaced.
  - **Brantford ON $50M Glade expansion (Mar 2024)** — not surfaced.
  - **Camacho's Navy SWO + P&G/Reckitt/Coca-Cola HBC/Hershey/Danone career stack** — operating-discipline framing — not surfaced.
  - **Fisk Johnson 5th-gen family ownership** — long-horizon framing, not quarterly-EPS — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: `network.facilityCount: 'Waxdale (Sturtevant WI 2.2M sq ft, world's largest aerosol plant) + Bay City MI + Brantford ON + global plants'`, `freight.avgLoadsPerDay: 'Waxdale produces 60M cases/year — outbound volume is the constraint'`. This single facility flex changes the entire observation table. Phase 3 candidate — Camacho is a Tier-1 target and Waxdale is the kind of detail that earns peer-level credibility instantly.

### 9. Boston Beer Company

- **Header:** `boston-beer-company` · persona target: Phil Savastano (CSCO) · dossier: `docs/research/phil-savastano-boston-beer-company-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Multi-site brewery and distribution network (see dossier)` · `Geographic spread: North America (HQ: Boston, MA)`. Both `dailyTrailerMoves` and `avgLoadsPerDay` are placeholders. `urgencyDriver` again uses internal-note verification language.
- **Gap delta vs. dossier:**
  - **Savastano just took the CSCO chair (Oct 20, 2025) — new-CSCO window is the highest-leverage timing for a vendor pitch in this account** — not surfaced.
  - **Q1 2026: 95% internal production (up from 85%), gross margin +100bps from procurement + brewery efficiencies** — the operating story the pitch should hook into — not surfaced.
  - **"Yard SOPs designed for peak Truly volume mix; current SKU mix is different"** — the single sharpest YardFlow-shaped insight in the dossier — not surfaced.
  - **Sam Adams + Truly + Twisted Tea + Angry Orchard + Dogfish Head + Hard MTN Dew + Sun Cruiser** brand portfolio + **City Brewing (LaCrosse / Memphis / Latrobe / Irwindale) contract manufacturing relationships** — the multi-site network reality — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: name City Brewing contract sites in `facilityTypes` array; set `freight.specialRequirements: ['Three-tier distribution (alcoholic beverage law)', 'Glass + aluminum SKU mix']`. Phase 3 candidate — new-CSCO window will close; the timing argument is the pitch.

### 10. Westrock Coffee

- **Header:** `westrock-coffee` · persona target: J.T. Hinson (Director Freight Logistics) · dossier: `docs/research/j-t-hinson-westrock-coffee-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` non-empty (Inbound Logistics case-result quoting Kaleris).
- **What the fallback shows today:**
  - *observation* table: `Facility footprint: Offices in 10 countries; inherited S&D multi-site yard operation across 5 county-spread locations` · `Geographic spread: North America / Global (HQ: Little Rock, AR)` · `Daily trailer moves: 400+ trailers across the yard network`. This is one of the better-populated observation tables in the cohort — `dailyTrailerMoves` is a real number.
  - *comparable* section: **same displacement-target naming bug**. Case-result quotes "Inbound Logistics, January 2026" as the comparable, with the headline framing it as the comparable network. But the quote actually names Kaleris ("Westrock Coffee uses Kaleris YMS shared queues...") so the rendered comparable section pitches the incumbent vendor's win as the comparable proof.
- **Gap delta vs. dossier:**
  - **Conway AR campus** (manufacturing + $70M 530,000-sq-ft DC opened Dec 2023, 72 dock doors) — not surfaced.
  - **Concord NC three-node footprint** (main facility + remote yard 2 miles away + roasting plant 8 miles away) — not surfaced.
  - **"From 120-130 trailers to roughly 400"** is the operational story-shape — already in the proofBlocks quote but un-elevated.
  - **Hinson's tech-of-operations origin** (Distribution Operations Technology Supervisor before Director Freight Logistics) — peer-level signal — not surfaced.
  - **"Software vs. shelfware" framing + phone-call-replacement framing** — Hinson's own language; the pitch should mirror it — not surfaced.
- **Recommendation:** Phase 2 minimum: rewrite proofBlocks[0] so it doesn't name Kaleris inside the comparable frame. Phase 3 strong candidate — Hinson is named, single-buyer, peer-level dossier; one of the most actionable pitches in the cohort.

### 11. UNFI

- **Header:** `unfi` · persona target: Mark Bushway (President Natural/Organic/Specialty/Fresh + Enterprise SC) · dossier: `docs/research/mark-bushway-unfi-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Large distribution network (see dossier)` · `Geographic spread: North America (HQ: Providence, RI)`. `urgencyDriver` again carries verification-language internal note.
- **Gap delta vs. dossier:**
  - **52 DCs as of June 2024 (down from 56 at Bushway's CSCO appointment Dec 2021); count will be lower again by FY27** — the network-rationalization story is the entire pitch — not surfaced.
  - **~30,000 customer locations served** — scale flex — not surfaced.
  - **Bushway's C&S Wholesale Grocers origin + 23 years inside UNFI + dual-P&L-and-SC mandate** — the rare "no internal sponsorship layers to navigate" buyer signal — not surfaced.
  - **2025 closures: Fort Wayne IN (Feb 2025), 2 Central region consolidations** — each closure is a forced yard-protocol decision at the receiving facility — not surfaced.
  - **SuperValu integration brought ~30 conventional-grocery DCs + PINC RFID generation yard tooling overnight** — the displacement story — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: `network.facilityCount: '52 distribution centers across the US and Canada (down from 56; consolidating further)'`. Set `urgencyDriver` to the merged-network-standardization frame without the internal verification language. Phase 3 candidate — Bushway dual mandate makes him an unusually accessible single-buyer.

### 12. Cost Plus World Market

- **Header:** `cost-plus-world-market` · persona target: Steve Ming (Sr. Director Logistics & Distribution) · dossier: `docs/research/steve-ming-cost-plus-world-market-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` non-empty (Kaleris case-result).
- **What the fallback shows today:**
  - *observation* table: `Facility footprint: National store network; distribution footprint see dossier` · `Geographic spread: North America (HQ: Alameda, CA)`. Placeholder-shaped.
  - *comparable*: **same displacement-target-in-comparable bug**. "Kaleris YMS case study archive, 2026" rendered as the comparable.
- **Gap delta vs. dossier:**
  - **Two DCs, 2 million sq ft total, 100+ dock doors, 550 trailer positions** — the operational shape, fully public — not surfaced.
  - **Kingswood Capital ownership (since Jan 2021 from Bed Bath & Beyond, $110M)** — corporate-context — not surfaced.
  - **Ming named-on-the-record as the PINC sponsor in the Kaleris case study** — peer-level credibility — not surfaced.
  - **~250 specialty retail stores; heavy international inbound (Asia furniture/textiles + Europe wine/food)** — the import-yard angle that distinguishes Cost Plus from generic specialty retail — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: `network.facilityCount: '2 DCs, 2M sq ft, 550 trailer positions, 100+ dock doors; ~250 specialty retail stores'`. Phase 2: rewrite or delete proofBlocks[0]. The "is the site-level YMS model still right for the current network" pitch is one of the cleaner displacement shapes — Phase 3 candidate.

### 13. Universal Logistics Holdings

- **Header:** `universal-logistics-holdings` · persona target: Jeff Morrish (Director Supply Chain Business Development, LINC) · dossier: `docs/research/jeff-morrish-universal-logistics-holdings-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Distributed logistics network (see dossier)` · `Geographic spread: North America (HQ: Warren, MI)`. `urgencyDriver` carries verification-language.
- **Gap delta vs. dossier:**
  - **ULH structure: Contract Logistics (~67% rev) + Truckload + Intermodal + Dedicated + Parsec (rail terminals, ~$193.6M acquisition Sept 2024, 20+ rail yards US/Canada, ~2,100 employees)** — the multi-subsidiary shape — not surfaced.
  - **Morrish sits inside LINC, the value-added/contract-logistics subsidiary** — door-vs-buyer distinction matters — title in `people[0]` is "VP Operations" which is wrong (should be Director Supply Chain Business Development at LINC).
  - **2025 revenue $1.558B, net loss $(99.9M)** — Universal is operating through a soft cycle — pitch-timing context — not surfaced.
  - **Moroun family control (~73.2% voting equity), Tim Phillips CEO since Jan 2020** — decision-making concentration — not surfaced.
  - **Automotive-vertical specialist** — LINC's customer base — not surfaced.
- **Recommendation:** Phase 1 cheap-fix is critical: fix `people[0]` title to "Director, Supply Chain Business Development (LINC)"; add Parsec rail terminals to `facilityTypes`. Phase 3 not warranted yet — partnership-pitch needs more discovery before hand-tuning.

### 14. CJ Logistics America

- **Header:** `cj-logistics-america` · persona target: Laura Adams (likely TES / Engineering, named in dossier) · dossier: `docs/research/laura-adams-cj-logistics-america-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` non-empty (DSC Logistics PINC selection from 2012 SupplyChainMarket).
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Distributed 3PL network (see dossier)` · `Geographic spread: North America (HQ: Itasca, IL); Mira Loma, CA as known legacy site`. Itasca IL HQ is **stale** — dossier says HQ is now Des Plaines IL (legacy DSC HQ retained post-acquisition). Placeholder-shaped on trailer/load metrics.
  - *comparable*: case-result renders "SupplyChainMarket, 2012" as the comparable. A 14-year-old PINC selection press release rendered inside *"What a comparable network did when they closed the same gap"* — temporally awkward and not actually proof-shaped.
- **Gap delta vs. dossier:**
  - **HQ Des Plaines IL (not Itasca)** — fix this.
  - **~70+ NA locations, ~30M sq ft+ warehousing at integration, materially larger today** — not surfaced.
  - **Gainesville GA cold storage (2024), New Century KS cold storage (Q3 2025, 291,000 sq ft, conveyor bridge to Upfield), Elwood IL 1.1M sq ft (H1 2026, $457M jointly with Korea Ocean Business Corp)** — three concrete network-expansion vectors — not surfaced.
  - **CJ Logistics is explicitly "WMS-agnostic"** — yard-tech that doesn't demand WMS exclusivity is the architectural fit — peer-level signal — not surfaced.
  - **Adams' Purdue Industrial Management + Lucent engineering + 2023 Women in Supply Chain Award** — engineering-first orientation — not surfaced.
- **Recommendation:** Phase 1 cheap-fix is critical: fix HQ (`Des Plaines IL`), add `network.facilityCount: '~70+ NA locations; ~30M sq ft+ warehousing'`. Phase 2: rewrite or delete the 2012 SupplyChainMarket proofBlock — it's stale and renders as comparable-shaped content. Phase 3 candidate — Adams is reachable and the partnership pitch (WMS-agnostic) is well-shaped.

### 15. SalSon Logistics

- **Header:** `salson-logistics` · persona target: Jason Fisk (CEO) · dossier: `docs/research/jason-fisk-salson-logistics-dossier.md`
- **Rendered state:** All 5 sections fall back. `proofBlocks` empty → Primo boilerplate.
- **What the fallback shows today:**
  - *observation*: `Facility footprint: Port and logistics network (see dossier)` · `Geographic spread: Northeast US (HQ: South Plainfield, NJ)`. The HQ field disagrees with the dossier (Newark NJ + Long Beach CA per dossier; South Plainfield NJ is one of the operating sites).
  - `urgencyDriver` carries internal-note language ("manual review required before PINC/Kaleris assertion") that bleeds into rendered hypothesis prose.
- **Gap delta vs. dossier:**
  - **Sun Capital Partners ownership since Aug 2024 roll-up of 7 companies** — the operating-context — not surfaced.
  - **Newark NJ flagship 55-acre campus, 3 yards, ~1M sq ft warehouse, 24/7, ~2,000 containers/week, ~150 SalSon drivers in port daily, ~100,000 containers/year** — the most concrete operating-shape facts in the entire cohort — not surfaced.
  - **Compton CA 260,000 sq ft + 66 dock doors + 20-acre secured yard (under construction)** — not surfaced.
  - **Fisk's PE-track 13 years at Sun Capital → CEO role** — pitch posture (revenue-attached operating stories, not pure efficiency) — not surfaced.
  - **Operations actually buy through Ralph S. (VP Operations) and Mike Stevens (VP Truckload Operations)** — door-vs-buyer distinction — not surfaced.
- **Recommendation:** Phase 1 cheap-fix: fix HQ to `Newark NJ + Long Beach CA`; set `network.facilityCount: 'Newark NJ flagship 55-acre / ~1M sq ft / 24/7 / ~2,000 containers/week + Long Beach CA + Compton CA (260K sq ft) + Florence NJ + 6 additional markets'`, `freight.avgLoadsPerDay: '~2,000 containers/week through Newark flagship alone'`. Strip the verification-language out of `urgencyDriver`. This is the highest-ROI single Phase 1 fix in the cohort — the facts are extraordinary and currently invisible.

---

## TL;DR roadmap (priorities + sequencing)

### Most-impactful gap to fill first

**The comparable section silently mis-promotes Kaleris on four accounts.** Kraft Heinz, Bob Evans Farms, Cost Plus World Market, and Westrock Coffee all ship a `proofBlocks[0]` that is a Kaleris case-result quote. The fallback `pickComparableProof()` grabs that block and renders it inside *"What a comparable network did when they closed the same gap"* — naming the incumbent displacement target as the comparable solution. This is the single most counterproductive copy on any of the 15 pages and it ships today.

Fix is mechanical: delete or rewrite those four `proofBlocks[]` arrays. ~30 minutes of work. Without that fix, the Phase 1 sweep is incomplete because the comparable section will still pitch backwards on the four accounts that matter most for the displacement story.

### Cheapest-wins-per-hour ranking (Phase 1 candidates)

Ordered by impact-per-minute:

1. **SalSon Logistics** — extraordinary operating-shape facts (Newark 55-acre / ~2,000 containers/week / ~100K containers/year) currently invisible. Adding ~5 fields to `network` + `freight` transforms the observation table. ~10 minutes.
2. **Daimler Truck NA** — 9 plants + 10 PDCs + Whitestown RDC + 850,000th truck Cleveland 2025 + Saltillo 500+ trailers in yard at peak. Five concrete fact-fields, all in dossier verbatim. ~10 minutes.
3. **Pactiv Evergreen** — `parentBrand` and `geographicSpread` are stale post-Novolex-merger (April 2025). Critical correctness fix. ~5 minutes.
4. **CJ Logistics America** — HQ stale (Itasca → Des Plaines); add 70+ locations, 30M+ sq ft. ~10 minutes.
5. **Universal Logistics Holdings** — `people[0]` title wrong (VP Operations → Director Supply Chain Business Development at LINC). Correctness. ~5 minutes.
6. **SC Johnson** — Waxdale 2.2M-sq-ft / world's-largest-aerosol flex is the kind of credibility number the editorial style guide explicitly calls for. ~10 minutes.
7. **All 15 accounts** — strip "verify before naming PINC" / "manual review required" internal-note language out of `signals.urgencyDriver`. That field is rendered into the prospect-facing observation hypothesis. ~20 minutes total.
8. **Kraft Heinz / Bob Evans / Cost Plus / Westrock Coffee** — delete or replace `proofBlocks[0]` (the Kaleris-quote-as-comparable bug). ~30 minutes.

### Heavy-lift recommendations

Phase 3 hand-author candidates ranked by likelihood of receiving an actual prospect click-through soon:

1. **Westrock Coffee (J.T. Hinson)** — named single-buyer, peer-level dossier ("software vs. shelfware" framing already cleanly stated), recent Inbound Logistics feature, growing yard story (120→400 trailers). Highest hand-tune ROI.
2. **Kraft Heinz (Flavio Torres)** — dossier-richest account in cohort; Lighthouse + DeKalb + AB-InBev-for-yards angles are unusually crisp; but no warm-intro path yet, so hand-author depends on outreach plan.
3. **Daimler Truck NA (Jeff Allen)** — Q1 2026 +85% order rebound + eCascadia greenfield yard creates a timing window; carrier-trust-during-recovery is a clean pitch.
4. **Cost Plus World Market (Steve Ming)** — Ming named-on-record PINC sponsor; "is the site-level model still right for the current network" is a clean displacement shape.
5. **Bob Evans Farms (John Ash)** — year-3-of-a-YMS-deployment pitch is conceptually clean; Ash's carrier→3PL→shipper arc makes him an unusually receptive buyer.

The remaining 10 (Nestle USA, Kimberly-Clark, DHL Supply Chain, Pactiv Evergreen, SC Johnson, Boston Beer, UNFI, Universal Logistics, CJ Logistics, SalSon) get Phase 1 + Phase 2 treatment now and stay on the fallback path until a warm intro or active conversation justifies the Phase 3 lift.

---

## Suggested phased remediation

### Phase 1 — `network` + `freight` field sweep (1–2 hrs)

Goal: every `/for/<slug>` observation table renders specific facts, not "see dossier" placeholders.

Touch every one of the 15 account files and populate, from the dossier:

- `network.facilityCount` — use the dossier's most specific public-record number (e.g., `'~30 U.S. plants (~70 globally)'` for Kraft Heinz; `'9 U.S.+Mexico plants + 10 PDCs + Whitestown IN RDC'` for Daimler Truck NA; `'52 distribution centers across the US and Canada'` for UNFI; `'2 DCs, 2M sq ft, 550 trailer positions'` for Cost Plus; etc.)
- `network.geographicSpread` — fix the four stale HQ values flagged above (Pactiv, CJ Logistics, SalSon, and adjust where dossier names a supply-chain HQ distinct from corporate HQ, e.g., Nestle USA's Arlington VA / Solon OH split)
- `network.dailyTrailerMoves` — only where the dossier has a real number (Westrock 400, SalSon Newark ~2,000 containers/week, Saltillo 500+ at peak). Where unknown, **delete the field** rather than leave "see dossier" (the builder skips falsy values).
- `freight.avgLoadsPerDay` — same; delete the "see dossier" placeholders.
- `freight.specialRequirements` — add where dossier specifies (Bob Evans cold chain / FSMA, Boston Beer three-tier alcoholic-beverage law, SalSon port logistics, Cost Plus refrigerated-and-dry mix).

Also strip the "verify before naming PINC" / "manual review required" / "[verify]" language out of `signals.urgencyDriver` on every account where it currently appears (Nestle USA, Kimberly-Clark, Pactiv Evergreen, SC Johnson, Boston Beer, UNFI, Universal Logistics, SalSon — 8 of 15). That field is *rendered into prospect-facing prose* via `buildObservationHypothesis()` (memo-compat.ts:120–146) — internal verification language doesn't belong in it.

### Phase 2 — `proofBlocks` rewrite (4–6 hrs)

Goal: the comparable section reads as comparable-network proof on every account.

For each of the four accounts where `proofBlocks[0]` is a Kaleris case-result (Kraft Heinz, Bob Evans, Cost Plus, Westrock Coffee):

- Option A — Delete `proofBlocks[0]`. Comparable section then falls back to Primo Brands boilerplate. Safer, faster.
- Option B — Hand-author a Primo-shaped or 237-facility-anchor-shaped proof block with stats array. Better long-term, more work.

For each account where `proofBlocks` is currently empty (Nestle USA, Kimberly-Clark, DHL Supply Chain, Pactiv Evergreen, SC Johnson, Boston Beer, UNFI, Universal Logistics, SalSon), Phase 2 is optional — the Primo boilerplate is already the fallback. Hand-authoring a per-account proof block adds differentiation but is mostly already covered by the comparable section's structure.

CJ Logistics' 2012 SupplyChainMarket DSC quote should be deleted in Phase 2 — it's 14 years old and reads as stale inside the comparable frame.

### Phase 3 — full `sections` hand-author for top 3–5 accounts (1–2 days)

Goal: bring the priority accounts up to dannon-level richness.

Candidates in order: Westrock Coffee, Kraft Heinz, Daimler Truck NA, Cost Plus, Bob Evans Farms.

Pattern (per account):

- Replace `sections: [{ type: 'yns-thesis' }]` with the full 5-section memo array (yns-thesis + observation + comparable + methodology + about), shaped like dannon.ts:172–245.
- Observation section: hand-author composition table (5 rows max), hypothesis prose (2–3 paragraphs) anchored to the dossier's sharpest insight, caveat line.
- Comparable section: anchor on Primo Brands (public) or the 237-facility CPG anchor (un-named per editorial style guide). Include real metrics array.
- Methodology section: customize sources + unknowns list — replace the universal "your real detention spend" unknowns with account-specific ones (e.g., "Whether the Lighthouse data feed currently consumes Kaleris yard signals in real time" for Kraft Heinz).
- About section: keep the universal Casey bio, customize the signOff with an account-specific push-back hook from the dossier.

Time estimate per account: ~3 hrs for an account with a dossier this rich, including review against editorial style guide.

---

## Constraints respected

- No code changes in this audit pass — markdown only.
- All references to the unnamed Tier-1 CPG anchor follow editorial style: attribute-identifier ("237-facility CPG anchor"), never the company name.
- All Primo references are to the public comparable (Primo Brands), not the anchor.
- No event names baked in (no "MODEX 2026" anchoring).
- Dates referenced (Apr 2025 Novolex merger, Aug 2024 SalSon roll-up, Oct 2025 Savastano CSCO promotion, etc.) are facts about the targets, not planned interactions, per the editorial style guide.

---

*Audit author: Casey Larkin (via working analysis). Last updated: 2026-05-10.*
