# PepsiCo Showpiece Microsite — Design

Date: 2026-06-18
Author: Casey Larkin (with Claude)
Status: Approved design, pre-implementation
Scope: Bring `/for/pepsico` and `/demo/pepsico` to the `/for/dannon` A+ bar.

## Why

PepsiCo is the #1 account by real deck engagement (7 people, 12 views on the
Site-vs-Network carousel) and the goal is to float yardflow.ai microsites in
earnest. PepsiCo is the single account Casey wants buttoned up end to end before
the wider wave. Both of its surfaces are below the showpiece bar today, so this
is the highest-leverage single build on the board.

## The two surfaces (and where they really live)

- **`/for/pepsico`** = the 1:1 spear page. Native to **Flow-State-**
  (`flow-state-site/src/lib/for/pepsico.ts`), registered in
  `src/lib/for/index.ts` (line 107). `/for/*` is owned entirely by the native
  dynamic route (`app/for/[slug]`, `dynamicParams=true`); it is live, not
  proxied, not a 404.
- **`/demo/pepsico`** = the deep audit microsite. Native to **modex-gtm**
  (`src/app/demo/[account]/page.tsx`), rendered from
  `public/demo-packs/pepsico.json` via `DemoSurface`. The
  `microsites/accounts/*` registry is **not** what `/demo` renders
  (`getAccountMicrositeData` is used only to resolve `accountName` for
  engagement tracking). Do not build a `microsites/accounts/pepsico.ts` for this
  — it would not show on `/demo`.

Both are surfaced on yardflow.ai (flow-state-klbt) via vercel rewrites.

## Verified current state

### `/for/pepsico` — live, rich override, below bespoke bar
Already carries the account-specific spear via `buildForContent`:
- `heroHook`: Gatik driverless ("a driverless truck cannot hand a clipboard to a
  guard")
- `problemHook`: Siemens twin (20% throughput at a Gatorade plant) + 30 flagship
  sites, 1,145 dock doors, ~3,000 trailer positions
- `pilot`: Wytheville VA Gatorade plant (75 docks, 180 trailer positions, 139
  acres, single guarded gate)
- `proofCloser`: "first top-five CPG to put its whole yard network on one
  protocol"
- `metaDescription`, live `geo` hero map (`_geo/pepsico-map.ts`), `pulseStats`
- Real prize from `data/for-packs/pepsico.prize.json`: $878.5M/yr, 3.5-mo
  payback, IRR scenarios, silo-tax (auditedCount 30, dropReady 24, gated 16,
  longDrive 26, fastLane 12, multiCampus 5)

**Delta to the Dannon bar:**
1. Beat bodies (problem, whyNow, identity, prize, easy) come from the shared
   builder, not PepsiCo-voiced hand-written prose. Dannon hand-writes all five.
2. No media block: no network-panel raster, silo-tax raster, video poster,
   video, audio, logo, or PDF brief.

### `/demo/pepsico` — real audit pack, below anchor bar
- 30 audited sites; totals 1,145 dock doors, 2,998 trailer capacity, 50 gates, 3
  rail-served, 990 acres. All 30 sites carry a `dossierExcerpt`.
- `featuredSiteId`: `27-pepsico-brookshire-tx-1na-mixing-center-dc`

**Delta to the 11-anchor bar:**
1. `account.dossierIntro` is **empty** (the lead narrative every anchor has; also
   feeds OG description + JSON-LD).
2. No `public/gallery-thumbs/pepsico.png` (the zoom-17 satellite hero; absence
   also makes the page skip its hero section and stay out of the gallery).
3. Not in the `/demo` gallery curation (`src/lib/demo/industry-tags.ts`), so not
   featured and not flick-bar eligible.
4. OG card likely generic (`/demo/<account>/opengraph-image`) — verify/generate.

### The hard fact anchor
Real, already in-repo: the 30-site PepsiCo audit (named plants incl. Gatorade
Tolleson AZ, Wytheville VA, Indianapolis IN, Atlanta GA, Brookshire TX; coords,
dock counts, acreage, archetype mix), the $878.5M prize snapshot, the geo map.
External facts (org, named leaders, recent news, detention/capex anchors) are
partially captured in the spear's source notes and must be re-verified.

## The build

### Workstream C — Research & fact-sourcing (runs first; gates A and B)
Parallel research agents source and cross-verify:
- PepsiCo supply-chain org structure post-Frito-Lay integration; named
  decision-makers (CSCO / PBNA + Frito-Lay logistics leadership) with public
  mandates.
- 2025-26 freight / network / yard / autonomy news; corroboration of the Gatik
  multi-year deal and the Siemens + NVIDIA digital-twin program already cited.
- Detention cost anchor, recent capex announcements, peak-season multiplier.

Output: a confidence-tagged fact sheet (public / measured / estimated /
inferred). **Body copy uses only verified facts.** Anything soft goes to the
methodology / unknowns framing, never the pitch. No fabrication — this is the
one unacceptable failure for a page going to the top account.

### Workstream A — `/for/pepsico` to bespoke (Flow-State-)
Convert `pepsico.ts` from a `buildForContent` override to a fully hand-written
`ForContent` modeled on `dannon.ts`:
- Hand-write all five beats in PepsiCo voice: **problem** (drift across 30
  flagship sites), **whyNow** (autonomy meets the turning freight cycle),
  **identity** (the YNS layer between TMS and WMS), **prize** (the $878.5M model,
  framed conservatively — book a fraction, real margins), **easy** (the
  Wytheville 60-day pilot).
- Custom hero: subline carrying the Gatik analogy, four punches, pulse stats.
  Keep the existing `geo` map.
- `primoProof` with the PepsiCo closer.
- `audit` beat with the real silo-tax (24/30 drop, 16/30 gated, 26/30
  long-drive).
- `integration` block.
- Prize figures stay read from the snapshot, never hand-typed. Refresh with
  `npx tsx scripts/gen-for-prize.ts pepsico` if needed.
- Wire the media block (Workstream D) by path so assets light up when present.

**Writing law (enforced):** USA Today register, beat bodies <= 28 words per
sentence cluster, no em dashes, no sentence starts with "Because", no banned
terms ("tile" / "coexist" / "layer above" / "not a replacement"). "Yards" always
plural. Must pass `content-lint.ts` and `src/lib/for/__tests__/all-accounts.test.ts`.

### Workstream B — `/demo/pepsico` to anchor-grade (modex-gtm)
- Write a grounded `account.dossierIntro` into `public/demo-packs/pepsico.json`.
- Generate `public/gallery-thumbs/pepsico.png` — a zoom-17 satellite hero of a
  flagship site (Wytheville VA or another high-signal plant), via
  `scripts/yard-audit/probe.ts` / Maps Static API.
- Add PepsiCo to `src/lib/demo/industry-tags.ts` as a beverage anchor (featured
  + flick-bar eligible).
- Verify/generate the `/demo/pepsico` OG card (neon satellite treatment).
- Spot-check the 30 `dossierExcerpt` strings; enrich only if visibly thin.

### Workstream D — Media (best-effort, AI-gen, non-blocking)
Static assets produced to bar: network-panel raster, silo-tax raster, video
poster, PDF brief (the forwardable slide brief), logo. Then **attempt**
AI-generated audio brief (narrated deep-dive of the PepsiCo yard gap) and a
simple walkthrough video (from the page / sims / og-loop tooling). If they do not
clear the Dannon bar, Casey produces the video + audio later; the page is
A-grade and sendable without them (the media block is additive).

## Sequencing

1. **C** (research) — completes before copy.
2. **A** + **B** copy in parallel, both grounded on C's fact sheet.
3. Static assets (rasters, thumb, OG, PDF, logo).
4. **D** media attempt.
5. Lint + tests (`content-lint`, `all-accounts.test.ts`; modex build validates
   the demo pack).
6. Deploy. Both apps auto-deploy on push to `main`. Stage explicitly — both
   repos carry unrelated WIP. Watch the Vercel builds (webhook can silently miss
   a push; nudge with an empty commit if no build appears).

## Acceptance

- `/for/pepsico` reads as a hand-written PepsiCo page indistinguishable in
  quality from `/for/dannon`; all beats PepsiCo-voiced; prize from snapshot;
  lint + tests green; renders cleanly with and without the media files.
- `/demo/pepsico` has a real `dossierIntro`, a satellite gallery thumb, is
  featured in the `/demo` gallery, and previews with a proper OG card.
- Every external fact in the copy is traceable to a verified source; unknowns are
  disclosed, not invented.
- Both surfaces live on yardflow.ai; the `/for` -> `/demo` handoff works.

## Out of scope

- The other 9 anchor-demo `/for` pages and the NFI / Boston Beer / Coca-Cola
  showpiece upgrades (deferred to the wider wave).
- Person-variant `/for/pepsico/<person>` pages.
- Any rebuild of the underlying scoring / audit pipeline.
