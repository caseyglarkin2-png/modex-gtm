# A+ Combined Asset System — /for + /demo + /roi — Design

Date: 2026-06-18
Author: Casey Larkin (with Claude + a 5-expert panel)
Status: Approved design, pre-plan
Scope: The system that makes every account's `/for` (spear), `/demo` (deep audit),
and `/roi` (model) a single, credible, complementary, contradiction-free argument
— for the accounts we have now and every one yet to be created.

## Why

The `/for` spear pages are all A+. The `/demo` deep audits are anchor-grade for
only ~13 accounts; the rest render the real pack but aren't polished, and — worse
— the audit corpus contains credibility landmines (divested / closed / phantom /
non-yard facilities) that are LIVE on prod today. A single wrong facility kills an
entire account with a senior buyer. The goal: make `/demo` A+ for all accounts,
reconcile it with `/for` and `/roi`, and make the combined asset the most
compelling, thought-provoking, and CREDIBLE version possible — one that wins
hearts, changes minds, and lands "no better time than now to prioritize yards."

## Expert panel (the source of this design)

Five expert subagents were convened and converged:
1. **Yard-ops / supply-chain exec** — what makes an audit credible; the
   network-shape insight; observed-vs-modeled discipline; "core sample" framing.
2. **OSINT facility-verification expert** — the verification gate (FOV) so a
   divested/closed/mis-attributed facility is structurally un-shippable.
3. **B2B narrative strategist** — the three-movement arc (claim/prove/size),
   handoffs, "core sample as strength," why-now braided to the account's capital.
4. **Skeptical CSCO buyer** — read the real data and found live landmines
   (Bridgeton closing, Jacksonville phantom DC, Scottsdale non-yard) + unlabeled
   estimates; named what earns the forward and the meeting.
5. **ROI / financial-defensibility expert** — the scope-tier prize model, the
   cross-surface consistency rules, the build guard + additivity invariant.

## The 5 pillars (panel consensus)

1. **Accuracy is existential and foundational.** One wrong facility discards the
   whole account in the buyer's mind. Verify-first, then build.
2. **Observed vs. modeled is visibly separated.** Counts = facts (with imagery
   date); turn time / dwell / $ / utilization / uplift = labeled model outputs.
   Surface per-site confidence; confessed uncertainty is persuasive.
3. **The sample is a deliberate core sample, not partial coverage.** Sourced
   denominator (real network size) licenses a stratified-by-archetype sample.
4. **Three surfaces, three movements:** /for claims, /demo proves, /roi sizes.
   Mantra: **"Sample proves. Model sizes. Audit confirms."**
5. **Why-now is structural, braided to the account's own committed capital**
   (autonomy needs a legible yard; counter-cyclical capacity; TMS/WMS gap).

## The system — six atomic layers

### Layer 1 — Facility Operation Verification gate (FOV) [foundational, runs first]
No facility enters an audit or ships without a cited, current-operation verdict.
- **Source hierarchy:** Tier 1 self-attested-current (latest 10-K Item 2
  Properties; company facility/location finder containing the address; active
  careers reqs at the address; dated company PR/investor material). Tier 2
  change-events (8-K / press on sale/closure/divestiture/idle; state econ-dev +
  WARN notices; reputable trade press) — the divestiture/closure detectors.
  Tier 3 corroborating only (satellite signage + imagery date; property/parcel
  records; Maps listings; aggregators — never a citation of record).
- **Per-site protocol:** V0 resolve operating legal entity (catch acquired/
  divested brands); V1 positive current-operation search (Tier 1); V2 negative
  change-event gauntlet (sold/closed/divested/WARN + a mandatory **bankruptcy-era
  check** for restructured companies — GM/Chrysler 2009 / Motors Liquidation /
  RACER Trust, the exact GM-Jacksonville failure mode); V3 imagery-date + signage
  sanity; V4 owner-vs-operator (3PL/leased/SPV) disambiguation; V5 adjudicate to
  **confirmed / probable / rejected** with >=1 cited source + date.
- **Ambiguity rules:** include leased + verifiable 3PL-run (caveated); exclude
  co-pack, divested brands, JVs the account doesn't operate, announced/under-
  construction (current-ops audit only), idled, and non-freight sites (HQ/R&D).
  Default: exclude unless verifiably current and account-operated.
- **Kill-switch build gate:** each site JSON carries a required `verification`
  block (verdict, operator, tenancy, citations[], imageryDate, checkedDivestiture,
  checkedBankruptcyEra, rationale). The pack builder EXITS NON-ZERO on a missing/
  rejected/uncited/stale verdict; hero pins must be `confirmed`; probable sites
  capped per pack. Errors become unshippable, not merely unlikely.
- **Retroactive scrub (sprint Step 0):** run FOV across the existing ~58 packs +
  the live `/for` facts (pilot sites, counts). Quarantine landmines already on
  prod (Dannon Bridgeton-closing, Jacksonville phantom DC, Scottsdale non-yard;
  RUN-STATUS-flagged divestitures at Mondelez/Campbell's/Constellation/AB InBev).

### Layer 2 — Observed vs. modeled provenance
- **Observable, state as fact (with imagery date):** dock-door count, gate count,
  ingress/egress, building footprint/acreage, paved vs. overflow, rail spur
  present/served, trailers visible on imagery date, yard-dog/reefer presence,
  layout risks (single long entry drive, shared gate, no internal circulation).
- **Inferable, hedge ("indicative/likely"):** drop vs. live mode (trailer:door
  ratio + shunter), multi-temp (reefers), queue risk (gate:door geometry),
  parking capacity (stripeable positions).
- **Model-only, label + make editable, NEVER claim as observed:** turn time,
  dwell, detention $, utilization %, volume uplift, headcount, incumbent TMS/WMS.
- Surface the existing `confidence` / `uncertainFields` per site. Stamp imagery
  dates. Tag every figure `measured` | `modeled` (extend the existing `basis`).
- Remove/relabel unlabeled estimates currently shown as fact (e.g. "$250 margin/
  shipment," "849 trailer moves/day").

### Layer 3 — Core-sample framing + sourced denominator
- **Denominator first:** state the real network size with a citation
  (`networkCount`, `networkCountSource`, `networkCountAsOf`), tilde'd, with scope
  exclusions ("US plants, not the ~190 global footprint"). Getting the shape of
  the whole network right is what licenses the sample.
- **Stratified selection:** pick the mapped sites to span archetypes + regions
  ("your biggest, newest, most and least automated") and state why each was
  chosen. Verify a 2x candidate pool, then choose from the confirmed set.
- **Language:** "core sample," "representative diagnostic," "read from orbit,"
  "the pattern held across all of them," "earns the full audit." Banned:
  "partial," "preliminary," "only," "so far," "incomplete."
- **Invite ground-truth:** "tell us the 3 sites you'd find most interesting and
  we'll add them to the live audit."

### Layer 4 — Three-surface complementarity contract
- **/for = CLAIM** (problem + stakes + why-now). Cites the prize from the shared
  engine; keeps the sample audit summary visually separate from the network prize.
- **/demo = EVIDENCE.** Their real asphalt + the archetype atlas + **one
  surprising finding** + the turn-time simulator. States NO new thesis and NO
  network dollar figure. Primo appears once as a calibration line, not a re-pitch.
- **/roi = MATH.** The editable model; seeded state reproduces /for's headline to
  the dollar.
- **Handoffs:** /for→/demo = "see the N sites we mapped" (promise→proof);
  /demo→/roi = "turn what you saw into a number for finance" (proof→price);
  all → the live booking close.
- **Structure of /demo:** open (a real, recognizable site with geofence — "we
  actually looked"); build (archetype-clustered atlas, observed metrics only);
  turn (the surprising finding — the forward-worthy moment); close
  (extrapolation logic stated, hand to /roi, then book).

### Layer 5 — Scope-tier prize model (make the numbers make sense)
- **Tier 1 (default): audited-only prize.** `totalFacilities == auditedCount`.
  Modeled only on mapped sites. An unbreakable floor.
- **Tier 2 (opt-in, gated): extrapolated-network prize.** Scale archetype
  `facilityCount` by `networkCount/auditedCount` on incremental facilities only,
  holding the audited per-facility economics + mix; apply an
  `extrapolationConfidenceShare` haircut (start 0.7) to the unaudited remainder;
  require `networkCountSource`. **Double-disclose both numbers** (audited-only AND
  network) with the bridge paragraph.
- **Build guard (`gen-for-prize.ts`):** THROW if `totalFacilities > auditedCount`
  without `networkCountSource` + `extrapolationConfidenceShare`. Assert the
  **additivity invariant:** Σ(audited per-site value) == audited-only prize <=
  network headline; network == audited-only + Σ(extrapolated × haircut). A buyer
  who sums the sites can never surface a contradiction.
- **Cross-surface consistency:** one engine, one snapshot per account; the
  must-match table (headline prize, totalFacilities, auditedCount, facilityMix,
  margin, payback, Primo proof) is byte-identical across /for, /demo, /roi.
  Reconcile already-shipped pages (e.g. PepsiCo $878.5M / ~500) to this standard.
- **Conservatism shown:** book 20% of the measured gain ("floor, not ceiling"),
  the account's own margin (stated + editable), zero for non-drop sites, year-one
  ramp, and the paper-only IRR row as the true floor.

### Layer 6 — Surprising-finding engine + why-now-from-capex
- **Surprising finding (per account, the forward-worthy element):** a true,
  non-obvious network-shape insight from the sample, asserted as a network pattern,
  tied to a YNS lever. Types: gate-to-dock ratio (queueing tax), drop vs. live
  dependence, rail-served vs. dray-dependent, long-entry-drive queue risk,
  overflow/land-constrained capacity, archetype concentration ("fix the archetype,
  fix it 80 times").
- **Why-now:** [account's real recent capex/expansion/automation/autonomy news] →
  [the yard is the ungoverned dependency of that investment] → [now compounds,
  later retrofits]. Sourced to a dated, account-specific fact.

## Acceptance criteria
- No `/demo` or `/for` ships a facility without a `confirmed`/`probable` cited
  verdict; the build gate enforces it; live landmines remediated in Step 0.
- Every number is `measured` (Primo or their audited yards) or `modeled` (named,
  editable) — nothing fake-precise shown as observed.
- Each account states a sourced network denominator + a stratified sample; uses
  core-sample language; surfaces per-site confidence.
- /for, /demo, /roi reconcile (must-match table holds; additivity invariant
  passes; build guard green); /demo states no network dollar figure.
- Each `/demo` carries one genuine surprising finding and a why-now braided to the
  account's own capital.
- The combined asset is forward-worthy: a champion can paste a link, say "they
  actually looked at our yards — see what they found about [site]," with zero
  embarrassment risk.

## Out of scope
- New yard audits for not-yet-audited accounts (separate audit-pipeline run; this
  system defines how those audits must be built when they happen).
- The clawd store-backed `/for` pages (e.g. dhl-supply-chain).
- Any change to the underlying scoring/discovery engine.

## Repos touched
- modex-gtm: the audit pipeline (`scripts/yard-audit/*`), demo packs
  (`public/demo-packs/*`), `/demo` surface (`src/app/demo/*`,
  `src/components/demo/*`), the FOV gate + verification schema.
- Flow-State-: `/for` (`src/lib/for/*`), `/roi` (`src/lib/roi/csvModel.ts`),
  the scope-tier prize model + build guard (`scripts/gen-for-prize.ts`,
  `data/for-packs/*`).
