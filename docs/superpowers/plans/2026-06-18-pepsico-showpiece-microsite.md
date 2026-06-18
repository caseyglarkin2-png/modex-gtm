# PepsiCo Showpiece Microsite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `/for/pepsico` (Flow-State-) and `/demo/pepsico` (modex-gtm) to the `/for/dannon` A+ showpiece bar so PepsiCo can be floated in earnest.

**Architecture:** Two surfaces in two repos, both fronted by yardflow.ai. `/for/pepsico` is a native Flow-State- spear page (`flow-state-site/src/lib/for/pepsico.ts`, registered in `src/lib/for/index.ts`) — convert it from a `buildForContent` override to a fully hand-written `ForContent` modeled on `dannon.ts`. `/demo/pepsico` is a modex-gtm deep-audit microsite rendered from `public/demo-packs/pepsico.json` — add the lead narrative, satellite gallery thumb, gallery curation entry, and OG card. All body copy is gated on a verified fact sheet (no fabrication). The `all-accounts.test.ts` rubric is the automated acceptance gate for `/for`.

**Tech Stack:** Next.js (App Router) in both repos, TypeScript, vitest (Flow-State- unit tests), Google Maps Static API (gallery thumb), the in-repo prize/hero-map generators.

**Key reference files (read before starting):**
- A+ target: `Flow-State-/flow-state-site/src/lib/for/dannon.ts` (the structure to replicate)
- Current override: `Flow-State-/flow-state-site/src/lib/for/pepsico.ts` (verified spear facts to carry forward)
- The builder (field semantics): `Flow-State-/flow-state-site/src/lib/for/build.ts`
- The gate: `Flow-State-/flow-state-site/src/lib/for/__tests__/all-accounts.test.ts` + `content-lint.ts`
- Type shape: `Flow-State-/flow-state-site/src/lib/for/types.ts`
- Demo route: `modex-gtm/src/app/demo/[account]/page.tsx`
- Demo pack: `modex-gtm/public/demo-packs/pepsico.json`
- Gallery curation: `modex-gtm/src/lib/demo/industry-tags.ts`

**Writing law (enforced by the gate, applies to every copy step):** USA Today register. No sentence over 28 words (`findLongSentences` must return `[]`). No em dashes. No sentence starting with "Because". No banned terms: `coexist`, `layer above`, `not a replacement`, `not displacement`. "Yards" always plural. Hero must contain the literal phrase "Yard Network System". No filler.

**Verified in-repo facts (safe to use without re-sourcing):**
- Prize (`data/for-packs/pepsico.prize.json`): `$878.5M/yr`, payback `3.5 mo`, totalFacilities `500`, IRR scenarios present, silo-tax `{auditedCount 30, dropReady 24, gated 16, longDrive 26, fastLane 12, multiCampus 5}`.
- Demo pack totals (`pepsico.json`): 30 audited sites, 1,145 dock doors, 2,998 trailer capacity, 50 gates, 3 rail-served, 990 acres; `featuredSiteId: 27-pepsico-brookshire-tx-1na-mixing-center-dc`; all 30 sites carry a `dossierExcerpt`.
- Spear facts (already in `pepsico.ts`, sourced 2026-06-12): Gatik multi-year driverless agreement; Siemens + NVIDIA digital-twin (20% throughput at a Gatorade plant); private fleet ~12,600 tractors; Wytheville VA Gatorade plant (75 docks, 180 trailer positions, 139 acres, single guarded gate).
- Geo hero map exists: `src/lib/for/_geo/pepsico-map.ts`.

---

## Task 1: Source and verify the PepsiCo fact sheet (gates all copy)

**Files:**
- Create: `modex-gtm/output/intel/pepsico-fact-sheet-2026-06-18.md`

- [ ] **Step 1: Dispatch parallel research agents**

Run four research agents concurrently (one message, multiple Agent calls, `subagent_type: Explore` or `general-purpose` with WebSearch). Each returns findings with a confidence tag per fact (`public` / `measured` / `estimated` / `inferred`) and a source URL where public:
1. PepsiCo supply-chain org post-Frito-Lay integration; named decision-makers (CSCO / Chief Supply Chain Officer, PBNA + Frito-Lay logistics/transportation leadership) with their public mandates and any quotes on capacity, autonomy, or network efficiency.
2. 2025-2026 PepsiCo freight / network / yard / autonomy news; corroborate and date the Gatik multi-year agreement and the Siemens + NVIDIA digital-twin program; capture exact wording and dates.
3. Anchors for the economic case: any public PepsiCo detention/demurrage figure, recent supply-chain capex announcements, peak-season volume multiplier (or category benchmark with that flagged as `estimated`).
4. Current PepsiCo facility footprint counts (plants + DCs), and which product lines drive multi-temp / multi-format complexity (Gatorade, Tropicana, Quaker, beverages).

- [ ] **Step 2: Cross-check and write the fact sheet**

Compile into `pepsico-fact-sheet-2026-06-18.md` with sections: `## Verified facts` (each line: fact — confidence — source), `## People` (name, role, mandate, source), `## Unknowns` (what we could not verify). Drop any fact two agents disagree on into Unknowns. This file is the ONLY external-fact source the copy tasks may draw from.

- [ ] **Step 3: Commit**

```bash
cd /c/Users/casey/modex-gtm
git add output/intel/pepsico-fact-sheet-2026-06-18.md
git commit -m "docs(intel): verified PepsiCo fact sheet for showpiece copy"
```

---

## Task 2: Rewrite `/for/pepsico` as a bespoke hand-written page

**Files:**
- Modify (full rewrite): `Flow-State-/flow-state-site/src/lib/for/pepsico.ts`
- Test (pre-existing, no edit): `Flow-State-/flow-state-site/src/lib/for/__tests__/all-accounts.test.ts`

- [ ] **Step 1: Run the gate against the current page to capture the baseline (it must already pass)**

```bash
cd /c/Users/casey/Flow-State-/flow-state-site
npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts
```
Expected: PASS (pepsico currently passes as a builder override). This is the green bar the rewrite must keep.

- [ ] **Step 2: Replace `pepsico.ts` with a bespoke `ForContent`**

Model the file exactly on `dannon.ts`: import the prize snapshot and `PEPSICO_MAP`, read every prize figure from the snapshot (never hand-type), export a `ForContent` object with hand-written beats. Use the structure below; author each beat body from the verified spear facts + Task 1 fact sheet, obeying the writing law. Do NOT call `buildForContent`.

```typescript
/**
 * PepsiCo bespoke /for content. Hand-written to the dannon.ts bar (2026-06-18).
 * Thesis: PepsiCo already runs driverless trucks on public roads (Gatik) and
 * found hidden capacity in a plant (Siemens twin). The yards are the unfinished
 * half. Every prize figure reads from the snapshot. Scope: the 30 audited
 * flagship US sites; full network modeled at 500.
 * Refresh prize: npx tsx scripts/gen-for-prize.ts pepsico
 * Refresh hero map: node scripts/gen-hero-map.mjs pepsico
 * Writing law: USA Today register, sentences <= 28 words, no em dashes,
 * no "Because" starts, no banned terms, yards always plural.
 */
import type { ForContent } from './types';
import prizeSnapshotJson from '../../../data/for-packs/pepsico.prize.json';
import PEPSICO_MAP from './_geo/pepsico-map';

// Reuse dannon.ts's PrizeSnapshot interface shape (copy it verbatim).
interface PrizeSnapshot { /* identical to dannon.ts PrizeSnapshot */ }
export const pepsicoPrizeSnapshot = prizeSnapshotJson as PrizeSnapshot;
const snap = pepsicoPrizeSnapshot;
const annualNoYr = snap.annualValueLabel.replace('/yr', '');
const payback = snap.paybackLabel ?? 'under 6 months';
const audited = snap.siloTax.auditedCount; // 30
const irrScenarios = snap.irrScenarios ?? [];

// roiPrefill: copy dannon.ts's exact derivation (ymsCount, dropsNoYmsCount, roiPrefill).
const ymsCount = snap.facilityMix.find((m) => m.archetype === 'with-yms')?.facilityCount ?? 0;
const dropsNoYmsCount = snap.facilityMix.find((m) => m.archetype === 'drops-no-yms')?.facilityCount ?? 0;
const roiPrefill = { /* identical shape to dannon.ts roiPrefill, using snap */ };

const ROI_HREF = '/roi/?pack=pepsico&utm_source=for&utm_medium=for-prize&utm_campaign=pepsico';
const CONTACT_HERO_HREF = '/contact/?intent=audit&utm_source=for&utm_medium=for-hero&utm_campaign=pepsico';
const CONTACT_CTA_HREF = '/contact/?intent=audit&utm_source=for&utm_medium=for-cta&utm_campaign=pepsico';
const DEMO_HREF = '/demo/pepsico';

export const pepsicoContent: ForContent = {
  slug: 'pepsico',
  entity: 'PepsiCo',
  auditedCount: audited,
  meta: {
    title: 'YardFlow for PepsiCo. The Yard Network System for every yard.',
    description:
      'PepsiCo is scaling driverless freight with Gatik. A driverless truck cannot check in with a clipboard. YardFlow is the Yard Network System that makes every yard able to receive one: paperless gates, one live trailer map, faster turns. Proven at Primo (turns 48 to 24 minutes); modeled at ' +
      annualNoYr + ' a year across the PepsiCo network.',
    ogHeadline: 'Your yards are the gap in your supply-chain stack. YardFlow fills it.',
  },
  hero: {
    // logo added in Task 3 once the svg exists; omit until then (optional field).
    eyebrow: 'PepsiCo · 30 flagship sites, mapped from satellite',
    kicker: 'The Yard Network System, by FreightRoll.',
    headline: 'Your yards are the gap in your supply-chain stack. YardFlow fills it.',
    subline:
      // PARAGRAPH 1: the Gatik analogy (verified). Keep every sentence <= 28 words.
      'This month you signed Gatik to scale driverless freight across North America. A driverless truck cannot hand a clipboard to a guard. The yard is now the layer that decides how far autonomy scales.\n' +
      // PARAGRAPH 2: what YardFlow is + Primo proof. Author from verified facts.
      'YardFlow is the Yard Network System, the software layer between your TMS and your WMS. It skims the friction out of every yard. Primo Brands implemented it system wide, cut trailer turn times by 50%, and unlocked 5% or more capacity at every location.',
    punches: [
      { label: 'The gap', text: 'Your TMS runs the road, your WMS runs the building, nothing runs the yards.' },
      { label: 'What we do', text: 'EZ-Pass at the gate, air-traffic control for the trailers. No paper, no radios.' },
      { label: 'The proof', text: 'Primo: 5%+ capacity at every location, turns cut 48 to 24, all ~260 sites committed.' },
      { label: 'The payoff', text: 'More volume out the same doors, same headcount. Every site an autonomous load can serve.' },
    ],
    primaryCta: { label: 'See the 30-site model', href: DEMO_HREF, variant: 'primary', external: false },
    secondaryCta: { label: 'Download the PDF', href: '/for/pepsico/yardflow-pepsico-brief.pdf', variant: 'ghost', external: true },
    media: {
      kind: 'network-map',
      geo: PEPSICO_MAP,
      src: '/for/pepsico/network-panel.png', // raster fallback, produced in Task 3
      alt: 'Live YardFlow network map of the PepsiCo flagship sites, coming online site by site',
      pulseStats: [
        { value: '30', label: 'flagship sites mapped' },
        { value: `${snap.siloTax.dropReady} / ${audited}`, label: 'run drop yards' },
        { value: '1,145', label: 'dock doors audited' },
      ],
    },
  },
  beats: [
    // id 'problem' — drift across the 30 flagship sites. Author body from facts.
    { id: 'problem', eyebrow: 'The problem', headline: 'Every yard "does it their own way." That is not strategy. That is drift.',
      body: 'Walk any two PepsiCo sites and you hear the same line: our yard is different. It is not. Same trucks, same trailers, same moves. What differs is the workaround each site improvised, hardened into a process nobody chose. Across the 30 flagship sites we mapped, 1,145 dock doors and almost 3,000 trailer positions still run on guard shacks, radios, and clipboards. Legacy YMS only ever reached the biggest plant. The rest run on a guess.',
      highlights: ['our yard is different. It is not', 'the workaround each site improvised', 'guard shacks, radios, and clipboards', 'The rest run on a guess'] },
    // id 'whyNow' — autonomy meets the turning freight cycle. Author from facts.
    { id: 'whyNow', eyebrow: 'Why now', headline: 'You automated the road. The yard is the half that did not get the upgrade.',
      body: 'Your Siemens twin found 20 percent more throughput hiding inside a Gatorade plant. Your Gatik lanes already touch hundreds of pickup and drop-off points. Every mile Gatik automates still ends at a gate, a yard, and a dock. A driverless truck cannot show a printed BOL or radio for a door. Detention starts at hour two and runs $50 to $100 an hour. Fix the yards and the capacity you could not see starts to surface, which is more loads out the same doors.',
      highlights: ['20 percent more throughput hiding', 'still ends at a gate, a yard, and a dock', 'the capacity you could not see starts to surface'] },
    // id 'identity' — copy dannon.ts identity beat VERBATIM (shared category copy),
    // including its three proofSurfaces (flowdriver, flowgate, operator-console).
    { id: 'identity', /* ...dannon identity beat verbatim... */ } as ForContent['beats'][number],
    // id 'prize' — the $878.5M model, conservative framing. Read all figures from snap.
    { id: 'prize', eyebrow: 'Sized conservatively, on purpose', headline: 'Using actual results from Primo Brands, we modeled the potential prize for PepsiCo.',
      body: 'Primo measured the full gain. We booked only a fraction of it at your own margins, and counted nothing for the sites that do not yet run drop yards. The headline number is the floor, not the ceiling.',
      prize: {
        defend: true,
        annualValueLabel: snap.annualValueLabel,
        paybackLabel: snap.paybackLabel ?? 'under 6 months',
        totalFacilities: snap.totalFacilities,
        perSiteImpliedLabel: snap.perSiteImpliedLabel,
        turnTime: { beforeMin: 48, afterMin: 24, pctCut: 50 },
        irrRangePct: [20, 40],
        stats: [
          { label: 'Turn time at Primo', value: '48 to 24 min', basis: 'measured', note: 'drop-and-hook, cut in half' },
          { label: 'Modeled annual value', value: snap.annualValueLabel, basis: 'modeled', note: `across ~${snap.totalFacilities} sites` },
          { label: 'Payback', value: payback, basis: 'modeled', note: 'before rollout completes' },
          { label: 'Already run drop yards', value: `${snap.siloTax.dropReady} of ${audited}`, basis: 'measured', note: 'where the win lands hardest' },
        ],
        sizingNote: 'Every figure is the YardFlow ROI engine output, the same one /demo/pepsico renders, not a slide number. The paper-only row in the table below is the conservative floor.',
        irrTable: irrScenarios,
        calculatorCta: { label: "See the model on PepsiCo's network", href: ROI_HREF, variant: 'quiet', external: false },
        roiPrefill,
      } },
    // id 'easy' — the Wytheville 60-day pilot (verified). Author from facts.
    { id: 'easy', eyebrow: 'In short', headline: 'We are not asking for a pilot. We are asking for a conversation.',
      body: 'A 30-minute call, direct with Casey. We show you what we found on your network, you tell us straight where it fits. Start at the Wytheville VA Gatorade plant, where 75 dock doors and 180 trailer positions sit on 139 acres behind a single guarded gate. First impact lands in 30 to 60 days, on the metric that hurts: trucks through the gate and onto a door.',
      finalCta: { label: 'Book the 30-minute audit', href: CONTACT_CTA_HREF, variant: 'primary' },
      brief: { href: '/for/pepsico/yardflow-pepsico-brief.pdf', label: 'Take it to your team (PDF)', note: 'The PepsiCo brief. Forward it to people who prefer good old slides.' } },
  ],
  modeledRoi: [
    { value: snap.annualValueLabel, label: 'Value of increased capacity, reduced detention, spot market avoidance, and reduced paper expenses' },
    { value: snap.perSiteImpliedLabel, label: 'added contribution margin per site' },
    { value: payback, label: 'payback, before rollout completes' },
  ],
  modeledRoiIntro: 'Using actual results from Primo Brands, we modeled the potential prize for PepsiCo.',
  modeledRoiCaption: `Proven at Primo, modeled for your ${audited} audited flagship sites`,
  primoProof: {
    // Copy dannon.ts primoProof body VERBATIM (shared, corrected facts), then append
    // the PepsiCo closer as the final sentence:
    headline: 'No company had ever put its whole yard network on one system. Primo just did.',
    body: '/* dannon primoProof body verbatim */ PepsiCo already runs driverless trucks on public roads. The yards are the unfinished half of that story, and PepsiCo would be the first top-five CPG to put its whole yard network on one protocol.',
    sourceNote: 'Result measured on the driver-journey layer, before the YMS rollout. Primo is live at 10 plants today, every production site by the end of Q3.',
    quote: { /* dannon quote verbatim (Mike Schadder) */ },
    brandStrip: { src: '/for/_shared/primo-brands-strip.png', alt: '/* dannon alt verbatim */' },
  },
  media: {
    // Wired now; files land in Task 3 (static) + Task 7 (video/audio). Page renders
    // without them. Match dannon.ts media shape.
    video: { src: '/for/pepsico/pepsico-standardize-yards.mp4', poster: '/for/pepsico/video-poster.png', title: 'Standardizing the PepsiCo yards' },
    audio: { src: '/for/pepsico/pepsico-yard-gap.m4a', title: `Closing PepsiCo's ${annualNoYr} yard gap` },
  },
  audit: {
    intro: "This is PepsiCo's own audit, not a generic benchmark. We mapped 30 flagship sites from satellite. Here is what the handoffs cost today, and where the standard lands first.",
    stats: [
      { label: 'Already run drop yards', value: `${snap.siloTax.dropReady} of ${audited}`, note: 'where the 48 to 24 minute drop-and-hook win lands' },
      { label: 'Gated with a guard or booth', value: `${snap.siloTax.gated} of ${audited}`, note: 'flowGATE automates the check-in step' },
      { label: 'Long entry drives where queues build', value: `${snap.siloTax.longDrive} of ${audited}`, note: 'pre-arrival check-in keeps the queue off the road' },
    ],
    teaser: { src: '/for/pepsico/silo-tax.png', alt: 'The PepsiCo network silo-tax audit, 30 flagship sites mapped from satellite', href: DEMO_HREF },
  },
  integration: { /* copy dannon.ts integration block verbatim, swapping entity language to PepsiCo where it names "Danone" */ } as ForContent['integration'],
  outboundLinks: { demo: DEMO_HREF, roi: ROI_HREF, contact: CONTACT_CTA_HREF },
};
export default pepsicoContent;
```

Refine the `problem`, `whyNow`, `prize`, and `easy` bodies against the Task 1 fact sheet: swap in any verified named leader, detention number, or capex anchor; move anything unverified out. Keep the `identity`, `primoProof` body/quote, and `integration` blocks copied verbatim from `dannon.ts` (shared, already-correct copy).

- [ ] **Step 3: Typecheck**

```bash
cd /c/Users/casey/Flow-State-/flow-state-site
npm run typecheck
```
Expected: PASS, no errors in `src/lib/for/pepsico.ts`.

- [ ] **Step 4: Run the rubric gate**

```bash
npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts
```
Expected: PASS. If `keeps body sentences <= 28 words` fails, split the offending sentence (the failure message names the field + word count). If `passes the content lint` fails, remove the banned term it names. If `links >= 3 live product surfaces` fails, the `identity` proofSurfaces were not copied — copy all three from dannon.

- [ ] **Step 5: Em-dash check**

```bash
npm run lint:dashes
```
Expected: PASS (no em dashes).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/casey/Flow-State-
git add flow-state-site/src/lib/for/pepsico.ts
git commit -m "feat(for): hand-write /for/pepsico to the dannon A+ bar"
```

---

## Task 3: Produce the `/for/pepsico` static assets

**Files:**
- Create: `Flow-State-/flow-state-site/public/for/pepsico/network-panel.png`
- Create: `Flow-State-/flow-state-site/public/for/pepsico/silo-tax.png`
- Create: `Flow-State-/flow-state-site/public/for/pepsico/video-poster.png`
- Create: `Flow-State-/flow-state-site/public/for/pepsico/pepsico-logo.svg`
- Create: `Flow-State-/flow-state-site/public/for/pepsico/yardflow-pepsico-brief.pdf`

- [ ] **Step 1: Create the asset directory**

```bash
mkdir -p /c/Users/casey/Flow-State-/flow-state-site/public/for/pepsico
```

- [ ] **Step 2: Generate the network-panel + silo-tax rasters**

Inspect how Dannon's `network-panel.png` and `silo-tax.png` were produced (check `Flow-State-/flow-state-site/scripts/og-cards.mjs` and any `silo`/`network-panel` generator). Reuse that generator with `pepsico` if one exists; otherwise screenshot the live hero network-map and the audit silo-tax section from a local `npm run dev` render of `/for/pepsico` at 2x DPI and save to the two paths. The raster is only the fallback when the live `geo` map renders, so static accuracy beats pixel polish.

- [ ] **Step 3: Add the PepsiCo logo**

Place a clean PepsiCo wordmark/globe SVG at `pepsico-logo.svg` (kebab-case SVG attributes only, e.g. `stroke-width`, since `/for` injects via dangerouslySetInnerHTML). Then add `logo: { src: '/for/pepsico/pepsico-logo.svg', alt: 'PepsiCo' }` to the `hero` object in `pepsico.ts`.

- [ ] **Step 4: Generate the PDF brief**

Produce a forwardable brief PDF (mirror the content of `yardflow-danone-brief.pdf`: the gap, what we do, the Primo proof, the PepsiCo prize, the 30-site audit, the ask). Render from an HTML template to PDF or export from the page; save to `yardflow-pepsico-brief.pdf`.

- [ ] **Step 5: Verify assets resolve and the page still passes**

```bash
cd /c/Users/casey/Flow-State-/flow-state-site
npm run typecheck && npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts
```
Expected: PASS (the `logo` addition typechecks; assets are static).

- [ ] **Step 6: Commit**

```bash
cd /c/Users/casey/Flow-State-
git add flow-state-site/public/for/pepsico/ flow-state-site/src/lib/for/pepsico.ts
git commit -m "feat(for): pepsico static assets (rasters, logo, PDF brief)"
```

---

## Task 4: Write the `/demo/pepsico` lead narrative (`dossierIntro`)

**Files:**
- Modify: `modex-gtm/public/demo-packs/pepsico.json` (the `account.dossierIntro` field)

- [ ] **Step 1: Confirm the field is empty and read an anchor's intro for tone**

```bash
cd /c/Users/casey/modex-gtm
node -e "const a=require('./public/demo-packs/pepsico.json').account; console.log('pepsico intro len:', (a.dossierIntro||'').length)"
node -e "const a=require('./public/demo-packs/coca-cola.json').account; console.log(a.dossierIntro)"
```
Expected: pepsico length `0`; coca-cola prints a 2-4 sentence grounded intro to match in register.

- [ ] **Step 2: Set `account.dossierIntro`**

Edit `pepsico.json` and set `account.dossierIntro` to a grounded 2-4 sentence lead (no fabrication; use the 30-site totals + the Gatik/autonomy thesis from the fact sheet). Example to adapt:
> "We mapped 30 PepsiCo flagship plants and distribution centers from public satellite imagery: 1,145 dock doors, almost 3,000 trailer positions, 990 acres of yard. PepsiCo is scaling driverless freight with Gatik, yet every one of these yards still checks trucks in on guard shacks, radios, and clipboards. This is what the handoffs cost today, and where one network standard would land first."

Keep the writing law (no em dashes, sentences <= 28 words, yards plural).

- [ ] **Step 3: Validate the pack still parses against the schema (build-time validator)**

```bash
cd /c/Users/casey/modex-gtm
node -e "const {DemoPackSchema}=require('./src/lib/demo/pack-schema'); const p=require('./public/demo-packs/pepsico.json'); DemoPackSchema.parse(p); console.log('pepsico pack valid; intro len:', p.account.dossierIntro.length)"
```
Expected: prints a non-zero intro length and no Zod error. If `require` of the TS schema fails, run via `npx tsx -e "..."` instead.

- [ ] **Step 4: Commit**

```bash
git add public/demo-packs/pepsico.json
git commit -m "feat(demo): pepsico dossierIntro lead narrative"
```

---

## Task 5: Generate the `/demo/pepsico` satellite gallery thumb

**Files:**
- Create: `modex-gtm/public/gallery-thumbs/pepsico.png`

- [ ] **Step 1: Read the featured site coordinates from the pack**

```bash
cd /c/Users/casey/modex-gtm
node -e "const p=require('./public/demo-packs/pepsico.json'); const s=p.network.sites.find(x=>x.id===p.account.featuredSiteId)||p.network.sites[0]; console.log(JSON.stringify({id:s.id,lat:s.lat??s.latitude,lng:s.lng??s.longitude}))"
```
Expected: prints the featured site id + lat/lng. (If the field names differ, inspect one site object: `node -e "console.log(Object.keys(require('./public/demo-packs/pepsico.json').network.sites[0]))"`.)

- [ ] **Step 2: Check for an existing thumb generator**

```bash
ls scripts/ | grep -iE "gallery|thumb"
```
If a generator exists (e.g. `gen-gallery-thumbs`), run it for `pepsico`. Otherwise continue to Step 3.

- [ ] **Step 3: Fetch a zoom-17 satellite tile to the thumb path**

Using `GOOGLE_MAPS_STATIC_API_KEY` from `modex-gtm/.env.local` and the coords from Step 1, fetch a square satellite image and save it. Match the existing anchors' dimensions (inspect one: `node -e "const s=require('fs').statSync('public/gallery-thumbs/coca-cola.png'); console.log(s.size)"`, and check pixel size if needed). Example:

```bash
cd /c/Users/casey/modex-gtm
node -e "
const fs=require('fs'); require('dotenv').config({path:'.env.local'});
const key=process.env.GOOGLE_MAPS_STATIC_API_KEY;
const lat=__LAT__, lng=__LNG__; // from Step 1
const url=\`https://maps.googleapis.com/maps/api/staticmap?center=\${lat},\${lng}&zoom=17&size=640x640&scale=2&maptype=satellite&key=\${key}\`;
fetch(url).then(r=>r.arrayBuffer()).then(b=>{fs.writeFileSync('public/gallery-thumbs/pepsico.png',Buffer.from(b)); console.log('wrote', fs.statSync('public/gallery-thumbs/pepsico.png').size, 'bytes');});
"
```
Replace `__LAT__`/`__LNG__` with the Step 1 values. Expected: a non-trivial byte count (> 50KB).

- [ ] **Step 4: Visually verify the thumb**

Read `public/gallery-thumbs/pepsico.png` with the Read tool. Expected: a recognizable yard/plant satellite view, not a blank/error tile. If blank, the key or coords are wrong; fix and refetch.

- [ ] **Step 5: Commit**

```bash
git add public/gallery-thumbs/pepsico.png
git commit -m "feat(demo): pepsico satellite gallery thumb"
```

---

## Task 6: Feature PepsiCo in the `/demo` gallery + verify OG card

**Files:**
- Modify: `modex-gtm/src/lib/demo/industry-tags.ts` (append to `INDUSTRY_ANCHORS`)

- [ ] **Step 1: Append the PepsiCo anchor**

In `INDUSTRY_ANCHORS` (after the `fedex` entry), add:

```typescript
  {
    id: 'beverage-snacks',
    label: 'CPG · Beverage & Snacks',
    slug: 'pepsico',
    blurb: 'The largest CPG yard footprint in the set. Driverless lanes inbound, multi-temp plants, drop-yard heavy.',
    archetype: 'cpg',
  },
```
Note: `id` must be unique and stable (it appears in tracking + `/roi?industry=`). `coca-cola` keeps `id: 'beverage'`; this adds a distinct PepsiCo tile rather than displacing it.

- [ ] **Step 2: Typecheck the change**

```bash
cd /c/Users/casey/modex-gtm
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "industry-tags" || echo "no industry-tags type errors"
```
Expected: "no industry-tags type errors".

- [ ] **Step 3: Verify the OG card route resolves for pepsico**

```bash
grep -rn "opengraph-image" src/app/demo/ | head
```
Inspect the matched generator route. If it renders from the pack (`dossierIntro` + totals), pepsico now has those, so it works automatically. If a per-slug asset is required and missing, generate it the same way the anchors' cards are produced. Confirm by reading the route file; note in the commit whether the card is dynamic (no action) or needs an asset.

- [ ] **Step 4: Commit**

```bash
git add src/lib/demo/industry-tags.ts
git commit -m "feat(demo): feature pepsico as a beverage-snacks gallery anchor"
```

---

## Task 7: Best-effort AI video + audio (non-blocking)

**Files:**
- Create (best-effort): `Flow-State-/flow-state-site/public/for/pepsico/pepsico-standardize-yards.mp4`
- Create (best-effort): `Flow-State-/flow-state-site/public/for/pepsico/pepsico-yard-gap.m4a`

- [ ] **Step 1: Attempt the narrated audio brief**

Generate a 60-120s narrated audio deep-dive of the PepsiCo yard gap (script from the page copy: the gap, the autonomy thesis, the Primo proof, the prize, the ask). Save to `pepsico-yard-gap.m4a`. The `media.audio.src` path is already wired in Task 2.

- [ ] **Step 2: Attempt the walkthrough video**

Produce a simple walkthrough video (screen-capture the live `/for/pepsico` and `/demo/pepsico` flows, or reuse `scripts/og-loop.mjs` tooling). Save to `pepsico-standardize-yards.mp4`. The `media.video.src` + `poster` paths are already wired.

- [ ] **Step 3: Quality gate — Casey review**

Surface both files to Casey. If they do not clear the dannon bar, DELETE them (the page renders A-grade without the media block) and hand the asset paths to Casey to produce later. Do not ship sub-bar media on the showpiece.

- [ ] **Step 4: Commit (only if kept)**

```bash
cd /c/Users/casey/Flow-State-
git add flow-state-site/public/for/pepsico/pepsico-standardize-yards.mp4 flow-state-site/public/for/pepsico/pepsico-yard-gap.m4a
git commit -m "feat(for): pepsico walkthrough video + audio brief"
```

---

## Task 8: Final verification and deploy

- [ ] **Step 1: Full gate on Flow-State-**

```bash
cd /c/Users/casey/Flow-State-/flow-state-site
npm run typecheck && npm run lint:dashes && npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts
```
Expected: all PASS.

- [ ] **Step 2: Build modex-gtm to validate the demo pack + tags**

```bash
cd /c/Users/casey/modex-gtm
npm run build 2>&1 | tail -30
```
Expected: build succeeds (the prebuild `validate:packs` accepts `pepsico.json`; no type error on `industry-tags.ts`). A heavy build; allow several minutes.

- [ ] **Step 3: Push Flow-State-**

```bash
cd /c/Users/casey/Flow-State-
git push origin main
```
(If on a feature branch, open a PR to main instead.)

- [ ] **Step 4: Push modex-gtm**

```bash
cd /c/Users/casey/modex-gtm
git push origin main
```
Note: the local checkout may be on `feat/qualification-engine`. The demo-pack + industry-tags changes are independent of the intel code; cherry-pick/rebase the three demo commits onto `main` (or open a PR) per the repo's branch hygiene. Do NOT force-push.

- [ ] **Step 5: Watch both Vercel builds**

Use the Vercel MCP / API (`VERCEL_TOKEN` in `.env.local`) to confirm a production deploy was created for each project (`flow-state-klbt` and `modex-gtm`). If `list_deployments` shows nothing after a push, nudge with an empty commit: `git commit --allow-empty -m "chore: nudge vercel" && git push`.

- [ ] **Step 6: Verify live**

Fetch `https://yardflow.ai/for/pepsico` and confirm a marker unique to this diff renders (e.g. the "30 flagship sites mapped" pulse stat and the Wytheville pilot line). Fetch `https://yardflow.ai/demo/pepsico` and confirm the new `dossierIntro` first sentence appears and the satellite thumb hero shows. Both must return 200.

---

## Notes for the executor

- **No fabrication.** Every external fact in `/for/pepsico` and the `dossierIntro` must trace to the Task 1 fact sheet. Unverified claims go to the methodology/unknowns posture, not the body.
- **Prize figures are never hand-typed** — they read from `pepsico.prize.json` via `snap`. If the number looks off, regenerate with `npx tsx scripts/gen-for-prize.ts pepsico`, do not edit the label.
- **The `identity`, `primoProof` body+quote, and `integration` blocks are shared copy** — copy them verbatim from `dannon.ts` (only swapping "Danone" entity language), so corrections to the shared narrative stay consistent.
- **The media block is additive.** The page must render and pass the gate with the video/audio/raster files absent. Never let Task 7 block the ship.
- **Two repos, stage explicitly.** Both carry unrelated WIP. Only add the files named in each task.
