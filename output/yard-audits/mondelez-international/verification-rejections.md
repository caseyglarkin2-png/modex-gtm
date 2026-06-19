# Mondelez International — FOV verification rejections

FOV scrub run 2026-06-19 against the 22 sites in `public/demo-packs/mondelez-international.json`
(`network.sites[]`). Verdicts written in-place onto each site object.

Counts: 22 sites total — **15 confirmed, 2 probable (flagged), 5 rejected.**

## Rejected sites (do NOT ship — controller to remove + recompute totals)

- **13-mondelez-toledo-flour-mill** — Mondelez Toledo Flour Mill (2221 Front St, Toledo OH 43605)
  — REJECTED: DIFFERENT OPERATOR. Mondelez SOLD the mill to Mennel Milling; the deal closed
  Nov 3, 2025. Mennel now owns and operates the mill (it only toll-supplies flour back to
  Mondelez), so the operator is no longer Mondelez.
  [Tier 2: https://www.foodbusinessnews.net/articles/29295-mennel-milling-completes-acquisition-of-mondelez-flour-mill, 2025-11]
  [Tier 2: https://www.toledoblade.com/business/agriculture/2025/11/05/mennel-acquires-toledo-flour-mill-from-mondelez-international/stories/20251105107, 2025-11-05]

- **15-mondelez-aurora-distribution-center** — Mondelez Aurora DC (2380 Sullivan Rd, Aurora IL 60506; DHL/Exel-operated)
  — REJECTED: VACATED / ON THE MARKET FOR LEASE. The exact-address ~530k SF cold-chain DC is
  marketed available (coming available July 2025) by the landlord (Link Logistics), indicating
  DHL/Mondelez wound down or vacated operations. Surviving "DHL Mondelez" aggregator pages are
  stale Tier-3.
  [Tier 2: https://www.showcase.com/2380-sullivan-rd-aurora-il-60506/30754125/, 2025]
  [Tier 2: https://www.linklogistics.com/industrial-properties/il/aurora/2380-sullivan-rd-aurora-il-60506-00100/, 2025]

- **17-whippany-nj** — Mondelez Global R&D Innovation Center (941/945 State Route 10, Whippany NJ 07981)
  — REJECTED: NON-FREIGHT R&D. Currently Mondelez-operated, but it is an R&D / innovation center
  (former Cadbury lab, opened May 2023) with pilot / scale-up lines only — no production-scale
  dock or trailer yard. No yard to audit per the rubric.
  [Tier 1: https://ir.mondelezinternational.com/news-releases/news-release-details/mondelez-international-opens-doors-new-global-rd-innovation, 2023-05]

- **18-chicago-il** — Mondelez Global Headquarters (905 W Fulton Market, Chicago IL 60607)
  — REJECTED: NON-FREIGHT OFFICE. Currently Mondelez-operated global HQ, but a leased 5-story
  downtown office building with no yard, dock bank, or trailer parking. Non-freight corporate
  office per the rubric.
  [Tier 1: https://rejournals.com/mondelez-international-leaving-the-suburbs-headed-to-chicagos-fulton-market/, 2019]
  [Tier 1: https://www.mondelezinternational.com/contact-us/, 2026]

- **22-mondelez-houston-dc** — Mondelez Houston DC (6903 W Sam Houston Pkwy N, Houston TX 77041)
  — REJECTED: DIFFERENT OCCUPANT / MONDELEZ HAS LEFT. The current occupant is Tokyo Gardens
  Company (TGC Sushi / TGC Logistics) per a 2024 TDLR $2.2M office-buildout permit and FMCSA
  carrier registration at the address; the building was sold (new owner GOLEE GROUP LLC). The
  only remaining Mondelez signals are undated aggregator stubs.
  [Tier 2: https://www.tdlr.texas.gov/TABS/Search/Print/TABS2024005770, 2024-05-24]
  [Tier 2: https://www.lanefinder.com/c/tgc_logistics/3343220, 2024]

## Low-confidence (PROBABLE — flagged, shipped caveated/capped, NOT removed)

- **08-mondelez-montgomery-sales-distribution-center** — Mondelez Montgomery Sales DC
  (272 Neelytown Rd, Montgomery NY 12549)
  — PROBABLE: Mondelez built/opened this ~100k SF DC (2019) and still self-lists Montgomery;
  no closure/WARN/relocation found. But the only Tier-1 source is >24 months old and there is a
  272-vs-525 Neelytown St address ambiguity (Mondelez vs UNFI next door). Recommend spot-check.
  [Tier 1: https://arcodb.com/news/recently-completed-mondelez-distribution-facility-montgomery-ny/, 2019-12]

- **24-mondelez-ontario-dc** — Mondelez Ontario DC (5815 Clark St, Ontario CA 91761)
  — PROBABLE: multiple aggregators (D&B, chamber, Yelp "updated Mar 2026") place an active
  ~51-70-employee Mondelez/Nabisco DC at the exact address, with current Ontario job postings and
  no closure/WARN signal — but no clean Tier-1 self-attested locator or address-pinned careers
  req. Recommend spot-check.
  [Tier 3: https://www.yelp.com/biz/nabisco-ontario, 2026-03]

## Notes on premises that did NOT hold (kept as confirmed)

- **03-nabisco-portland-bakery** — the "CLOSED 2023" watch-note premise is FALSE. Every closure
  hit traced back to the Fair Lawn NJ and Atlanta GA closures, not Portland. Portland is a
  retained core US Nabisco biscuit bakery with active 2025-2026 Mondelez careers reqs and no
  WARN/closure source. CONFIRMED.
- **02-nabisco-chicago-bakery** — downsized post-2016 (lines moved to Salinas, Mexico) but still
  operating; active Mondelez production-associate careers req at 7300 S Kedzie dated 2026.
  CONFIRMED.
- **06-tates-bake-shop-factory** (East Moriches NY) — NOT consolidated into the new Shirley
  facility; the original 40k sq ft factory "remained in use" and is described as actively
  producing as of Jan 2026. CONFIRMED.
- **21-mondelez-fort-worth-dc** — borderline confirmed/probable. Mondelez is a named current
  tenant (Ste 172) in a partially-vacant multi-tenant building; the for-lease listing covers the
  OTHER tenants' ~166k SF, not Mondelez's space. Held CONFIRMED (leased) but flagged in-pack for
  human spot-check (evidence is CRE-comp/aggregator, no self-attested careers req at the address).
