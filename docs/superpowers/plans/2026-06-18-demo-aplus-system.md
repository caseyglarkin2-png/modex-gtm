# A+ Combined-Asset System Implementation Plan (/for + /demo + /roi)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every account's `/demo` deep audit A+ and fully reconciled with its `/for` and `/roi`, with a verification gate that makes a wrong (divested/closed/phantom/non-yard) facility structurally un-shippable, the numbers consistent across all three surfaces, and the framing a deliberate "core sample" that wins the meeting.

**Architecture:** Two repos. modex-gtm owns the audit pipeline + demo packs + `/demo` surface + the Facility Operation Verification (FOV) gate. Flow-State- owns `/for` + `/roi` + the scope-tier prize model. The build is phased: (0) verification gate + retroactive scrub of what's live, (1) scope-tier prize model + build guard + reconcile shipped prizes, (2) the `/demo` content/rendering system, (3) a repeatable per-account atomic rollout loop. Spec: `docs/superpowers/specs/2026-06-18-demo-aplus-system-design.md`.

**Tech Stack:** TypeScript, Next.js (both repos), Zod (`src/lib/demo/pack-schema.ts`), vitest, the CSV ROI engine (`Flow-State-/.../src/lib/roi/csvModel.ts`), Google Maps Static/Street View, web-research subagents.

**Repo roots:**
- modex: `C:\Users\casey\modex-gtm` (cwd; test: `npm run test:unit` = vitest; gate: `npm run validate:packs`; NO `typecheck` script — use `npx tsc --noEmit -p tsconfig.json`)
- Flow-State: `C:\Users\casey\Flow-State-\flow-state-site` (test: `npm run test:unit`; gate: `all-accounts.test.ts`; `npm run typecheck`; `npm run lint:dashes`)

**Branch hygiene:** work each repo on a feature branch off its `main` (modex: use a worktree off `origin/main` per CLAUDE.md — `git worktree add -b feat/demo-aplus <path> origin/main`, junction node_modules, copy `.env.local`). Flow-State: `git switch -c feat/demo-aplus` off main. Commit per task; do NOT `git stash` (parallel work in tree).

**Pack data flow (critical to hold):** `output/yard-audits/<slug>/roster.json` + `sites/<NN>-<slug>.json` → `scripts/yard-audit/build-demo-pack.ts <slug>` → `public/demo-packs/<slug>.json` → validated by `src/lib/demo/pack-schema.ts` (`DemoPackSchema`) → rendered by `src/app/demo/[account]/page.tsx` via `DemoSurface`. Account fields today: slug, displayName, archetype, siteCount, coverageNote, featuredSiteId, dossierIntro, surprisingFindings. Site fields today: id, name, type, archetype, archetypeName, confidence, uncertainFields, center, geofences, yardMetrics, classification, scenario, dossierExcerpt, mapsUrl, tiles, fieldNotes.

---

## PHASE 0 — Facility Operation Verification (FOV) gate + retroactive scrub

Goal: no site ships without a cited current-operation verdict; fix the live landmines first.

### Task 0.1: Add the `verification` block to the pack schema

**Files:**
- Modify: `C:\Users\casey\modex-gtm\src\lib\demo\pack-schema.ts`
- Modify: `C:\Users\casey\modex-gtm\scripts\yard-audit\schema.json` (the audit-time site schema)
- Test: `C:\Users\casey\modex-gtm\src\lib\demo\__tests__\pack-schema.test.ts` (create if absent)

- [ ] **Step 1: Read the current schema** to match style.

Run: `sed -n '1,200p' src/lib/demo/pack-schema.ts` and note the site Zod object name (e.g. `SiteSchema`) and the account object name.

- [ ] **Step 2: Write a failing test for the verification block**

```ts
// src/lib/demo/__tests__/pack-schema.test.ts
import { describe, it, expect } from 'vitest';
import { DemoPackSchema } from '../pack-schema';
import fs from 'node:fs';
import path from 'node:path';

it('every shipped site carries a verification verdict + citation', () => {
  const dir = path.join(process.cwd(), 'public', 'demo-packs');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const pack = DemoPackSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    for (const s of pack.network.sites) {
      expect(s.verification, `${f}:${s.id} missing verification`).toBeTruthy();
      expect(['confirmed','probable']).toContain(s.verification.verdict); // rejected never ships
      expect(s.verification.citations.length, `${f}:${s.id} needs a citation`).toBeGreaterThanOrEqual(1);
      expect(s.verification.checkedDivestiture).toBe(true);
    }
  }
});
```

- [ ] **Step 3: Run it — expect FAIL** (schema has no `verification`, packs lack it).

Run: `npm run test:unit -- src/lib/demo/__tests__/pack-schema.test.ts`
Expected: FAIL.

- [ ] **Step 4: Add the Zod `verification` schema to the site object** in `pack-schema.ts`:

```ts
const VerificationCitation = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  url: z.string().url(),
  date: z.string(),            // ISO-ish, e.g. "2026-02-14" or "2026-02"
  type: z.string(),            // "10-K Item 2" | "locator" | "press" | ...
  claim: z.string(),
});
const Verification = z.object({
  verdict: z.enum(['confirmed', 'probable', 'rejected']),
  operator: z.enum(['self', '3PL', 'JV', 'unknown']).default('self'),
  tenancy: z.enum(['owned', 'leased', 'unknown']).default('unknown'),
  citations: z.array(VerificationCitation),
  imageryDate: z.string().optional(),
  checkedDivestiture: z.boolean(),
  checkedBankruptcyEra: z.boolean().default(false),
  rationale: z.string(),
  verifiedBy: z.enum(['agent', 'human']).default('agent'),
  verifiedAt: z.string(),
});
```
Add `verification: Verification` to the site schema (required). Mirror the shape in `scripts/yard-audit/schema.json` so audit agents emit it.

- [ ] **Step 5: Run the test — still FAILS** (packs don't carry the field yet). That's expected; the schema is ready, packs are backfilled in Task 0.3. Mark the test `it.skip` temporarily with a comment `// un-skip after Task 0.3 backfill`, OR keep it failing and gate it behind the scrub. Choose skip to keep the suite green between tasks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/demo/pack-schema.ts scripts/yard-audit/schema.json src/lib/demo/__tests__/pack-schema.test.ts
git commit -m "feat(demo): verification block in pack + audit schema (FOV gate foundation)"
```

### Task 0.2: Add the FOV verification step to the audit prompt + a verifier script

**Files:**
- Modify: `C:\Users\casey\modex-gtm\scripts\yard-audit\deep-audit-prompt.md` (add Step -1 ahead of Step 0)
- Create: `C:\Users\casey\modex-gtm\scripts\yard-audit\verify-facility-prompt.md` (the per-site verifier agent instructions)

- [ ] **Step 1: Write `verify-facility-prompt.md`** — the per-site protocol from the spec (V0 entity resolution → V1 Tier-1 positive → V2 divestiture/closure/WARN/bankruptcy-era gauntlet → V3 imagery/signage → V4 owner-vs-operator → V5 adjudicate). Output: the `verification` JSON block with verdict + >=1 cited source. Include the exact V2 query templates and the restructured-companies list (GM, Stellantis/Chrysler legacy, etc. → require `checkedBankruptcyEra: true`).

- [ ] **Step 2: Insert Step -1 into `deep-audit-prompt.md`** before Step 0: "Run verify-facility-prompt.md FIRST. If verdict=rejected, write the rejection to `verification-rejections.md` and STOP — do not image or classify." 

- [ ] **Step 3: Commit**

```bash
git add scripts/yard-audit/deep-audit-prompt.md scripts/yard-audit/verify-facility-prompt.md
git commit -m "feat(audit): FOV per-site verification protocol (Step -1) + verifier prompt"
```

### Task 0.3: Add the build gate to build-demo-pack.ts

**Files:**
- Modify: `C:\Users\casey\modex-gtm\scripts\yard-audit\build-demo-pack.ts`
- Modify: `C:\Users\casey\modex-gtm\scripts\yard-audit\build-all-packs.ts` (propagate)

- [ ] **Step 1: Read build-demo-pack.ts** to find where it assembles `network.sites`.

Run: `sed -n '1,120p' scripts/yard-audit/build-demo-pack.ts`

- [ ] **Step 2: Add the gate** — before writing the pack, for each site assert: `verification` present; `verdict !== 'rejected'`; `verdict==='rejected'` sites are DROPPED (filtered out, logged); non-rejected sites have `citations.length>=1` with `url`+`date`; `checkedDivestiture===true`; for accounts on `RESTRUCTURED_COMPANIES` (a const list incl. `general-motors`), `checkedBankruptcyEra===true`. If a site flagged `hero`/featured fails, `process.exit(1)` with a clear message. Write dropped sites to `output/yard-audits/<slug>/verification-rejections.md`.

```ts
const RESTRUCTURED_COMPANIES = new Set(['general-motors']); // extend as needed
function gateSites(slug, sites) {
  const kept = [], dropped = [];
  for (const s of sites) {
    const v = s.verification;
    const bad =
      !v || !v.verdict ||
      (v.verdict !== 'rejected' && (!v.citations?.length || v.citations.some(c => !c.url || !c.date))) ||
      v.checkedDivestiture !== true ||
      (RESTRUCTURED_COMPANIES.has(slug) && v.checkedBankruptcyEra !== true);
    if (v?.verdict === 'rejected' || bad) { dropped.push({ s, reason: v?.verdict === 'rejected' ? v.rationale : 'failed FOV gate' }); continue; }
    kept.push(s);
  }
  if (s_featured_dropped(dropped, slug)) { console.error(`FOV: featured site dropped for ${slug}`); process.exit(1); }
  return { kept, dropped };
}
```
(Adapt `s_featured_dropped` to the actual featuredSiteId check.)

- [ ] **Step 3: Rebuild a known-good pack to confirm the gate runs.**

Run: `npx tsx scripts/yard-audit/build-demo-pack.ts dannon 2>&1 | tail -20`
Expected: builds, prints any dropped sites, writes `verification-rejections.md` if any.

- [ ] **Step 4: Commit**

```bash
git add scripts/yard-audit/build-demo-pack.ts scripts/yard-audit/build-all-packs.ts
git commit -m "feat(audit): build-gate quarantines unverified/rejected sites (kill-switch)"
```

### Task 0.4: Retroactive scrub — verify every live pack's sites, fix the landmines

**Files:**
- Modify: `output/yard-audits/<slug>/sites/*.json` (add verification blocks), `roster.json`
- Rebuild: `public/demo-packs/*.json`

- [ ] **Step 1: Dispatch verification agents** (subagent-driven: one agent per account, or batched) running `verify-facility-prompt.md` over each site in the live packs. Start with the **12 send-list accounts + dannon** (the urgent set): pepsico, the-home-depot, coca-cola, dannon, frito-lay, ford, caterpillar, mondelez-international, kimberly-clark, georgia-pacific, performance-food-group, fedex. Each agent writes a `verification` block per site and a `verification-rejections.md`.

- [ ] **Step 2: Confirm the known landmines are caught** — Dannon Bridgeton (closing Aug 2026 → verdict downgrade/flag), Jacksonville DC (no address/phantom → rejected), Scottsdale (non-yard office → rejected). The RUN-STATUS-flagged divestitures (Mondelez/Campbell's/Constellation/AB InBev) appear in their rejections.

- [ ] **Step 3: Rebuild the scrubbed packs + un-skip the schema test.**

Run: `for s in pepsico the-home-depot coca-cola dannon frito-lay ford caterpillar mondelez-international kimberly-clark georgia-pacific performance-food-group fedex; do npx tsx scripts/yard-audit/build-demo-pack.ts $s; done`
Then un-skip the Task 0.1 test and run: `npm run test:unit -- src/lib/demo/__tests__/pack-schema.test.ts` — expect PASS for the scrubbed packs (gate remaining accounts in Phase 3).

- [ ] **Step 4: Reconcile /for facts to the scrub** — any `/for/<slug>` pilot site or count that referenced a now-rejected facility (Flow-State `src/lib/for/<slug>.ts`) is corrected. (Dannon pilot must not be the phantom Jacksonville DC; counts exclude Bridgeton/Scottsdale.)

- [ ] **Step 5: Commit** (modex packs; Flow-State /for fixes committed separately on its branch)

```bash
git add output/yard-audits public/demo-packs src/lib/demo/__tests__/pack-schema.test.ts
git commit -m "fix(demo): FOV scrub of live packs — quarantine divested/closed/phantom/non-yard sites"
```

---

## PHASE 1 — Scope-tier prize model + build guard + reconcile shipped prizes (Flow-State)

Goal: make the prize numbers make sense and be structurally enforced.

### Task 1.1: Extend the PrizeSnapshot schema + gen-for-prize guard

**Files:**
- Modify: `C:\Users\casey\Flow-State-\flow-state-site\src\lib\for\types.ts` (PrizeSnapshot/ForPrize)
- Modify: `C:\Users\casey\Flow-State-\flow-state-site\scripts\gen-for-prize.ts`
- Test: `C:\Users\casey\Flow-State-\flow-state-site\scripts\__tests__\gen-for-prize.test.ts` (create)

- [ ] **Step 1: Read gen-for-prize.ts + the PrizeSnapshot type** to learn the current fields + how `totalFacilities`/`siloTax.auditedCount` are computed.

Run (Flow-State): `sed -n '1,200p' scripts/gen-for-prize.ts; grep -n "interface PrizeSnapshot" -A40 src/lib/for/types.ts`

- [ ] **Step 2: Write the failing guard test**

```ts
// scripts/__tests__/gen-for-prize.test.ts
import { describe, it, expect } from 'vitest';
import { assertPrizeScope } from '../gen-for-prize';   // export the guard

it('throws if network>audited without a sourced count + haircut', () => {
  expect(() => assertPrizeScope({ totalFacilities: 400, siloTax: { auditedCount: 18 } } as any))
    .toThrow(/sourced/i);
});
it('passes Tier 1 (audited-only)', () => {
  expect(() => assertPrizeScope({ totalFacilities: 18, siloTax: { auditedCount: 18 } } as any)).not.toThrow();
});
it('passes Tier 2 with source + haircut + additivity', () => {
  expect(() => assertPrizeScope({
    totalFacilities: 400, siloTax: { auditedCount: 18 },
    networkCountSource: 'investor day 2026', extrapolationConfidenceShare: 0.7,
    auditedOnlyAnnualValue: 100, annualValue: 250,
  } as any)).not.toThrow();
});
```

- [ ] **Step 3: Run — expect FAIL** (`assertPrizeScope` undefined).

Run: `npm run test:unit -- scripts/__tests__/gen-for-prize.test.ts`

- [ ] **Step 4: Add fields + the guard.** Extend PrizeSnapshot with `scopeTier: 1|2`, `auditedOnlyAnnualValue`, `auditedOnlyAnnualValueLabel`, `networkCount`, `networkCountSource`, `networkCountAsOf`, `extrapolationConfidenceShare`. Implement + export `assertPrizeScope(snap)`:

```ts
export function assertPrizeScope(s: PrizeSnapshot) {
  const audited = s.siloTax.auditedCount;
  if (s.totalFacilities > audited) {
    if (!s.networkCountSource || s.extrapolationConfidenceShare == null)
      throw new Error(`Tier-2 prize for >audited (${s.totalFacilities}>${audited}) needs networkCountSource + extrapolationConfidenceShare (sourced count required)`);
    if (s.auditedOnlyAnnualValue == null || s.auditedOnlyAnnualValue > s.annualValue)
      throw new Error('additivity: auditedOnly must exist and be <= network annualValue');
  }
}
```
Call `assertPrizeScope(snap)` in gen-for-prize before writing the JSON. Implement the Tier-2 extrapolation (scale incremental archetype counts by `networkCount/audited` × `extrapolationConfidenceShare`, hold per-facility economics) and compute `auditedOnlyAnnualValue` (Tier-1 sum).

- [ ] **Step 5: Run — expect PASS.**

Run: `npm run test:unit -- scripts/__tests__/gen-for-prize.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/lib/for/types.ts scripts/gen-for-prize.ts scripts/__tests__/gen-for-prize.test.ts
git commit -m "feat(roi): scope-tier prize model + build guard + additivity assert"
```

### Task 1.2: Reconcile shipped prizes + the ForPrize disclosure UI

**Files:**
- Modify: `C:\Users\casey\Flow-State-\flow-state-site\src\components\for\` (the prize beat component — find via `grep -rl "irrTable\|annualValueLabel" components`)
- Regenerate: `data/for-packs/*.prize.json` (via gen-for-prize per slug)

- [ ] **Step 1: Regenerate every prize snapshot** so each carries `scopeTier` + audited-only + (Tier-2) source/haircut. For accounts where `totalFacilities>auditedCount` and no `networkCountSource` exists yet, the guard throws — set them to Tier 1 (audited-only) until a sourced count is added in Phase 3.

Run: `for s in $(ls src/lib/for/*.ts | xargs -n1 basename | sed 's/.ts//' | grep -vE 'build|index|types|content-lint|remote'); do npx tsx scripts/gen-for-prize.ts $s; done 2>&1 | tail -40`
Fix any throw by setting that account Tier 1.

- [ ] **Step 2: Add the Tier-2 double-disclosure** to the prize beat component: when `scopeTier===2`, render both the audited-only floor and the network number + the bridge paragraph (spec Layer 5). When Tier 1, render as today.

- [ ] **Step 3: Gate + commit**

Run: `npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts && npm run typecheck`
```bash
git add src/components/for data/for-packs
git commit -m "feat(roi): reconcile shipped prizes to scope-tier + double-disclosure UI"
```

---

## PHASE 2 — The /demo content + rendering system (modex)

Goal: the A+ /demo template — core-sample framing, observed/modeled provenance, the surprising-finding turn, and the handoff to /roi.

### Task 2.1: Add account-level denominator + provenance fields to the pack schema

**Files:**
- Modify: `src/lib/demo/pack-schema.ts` (account object)

- [ ] **Step 1: Add to the account Zod schema:** `networkCount: z.number().optional()`, `networkCountSource: z.string().optional()`, `networkCountAsOf: z.string().optional()`, `sampleRationale: z.string().optional()` (why these sites = the stratification statement). Keep `dossierIntro`, `surprisingFindings` required-ish (surprisingFindings already validated to exactly 3 by validate-microsite-coverage).

- [ ] **Step 2: Confirm schema parses existing packs.**

Run: `npx tsx -e "import {DemoPackSchema} from './src/lib/demo/pack-schema'; import p from './public/demo-packs/pepsico.json'; DemoPackSchema.parse(p); console.log('ok')"`

- [ ] **Step 3: Commit**

```bash
git add src/lib/demo/pack-schema.ts
git commit -m "feat(demo): account-level network denominator + sample-rationale fields"
```

### Task 2.2: DemoSurface rendering — core-sample frame, observed/modeled tags, the turn, the /roi handoff

**Files:**
- Modify: `C:\Users\casey\modex-gtm\src\components\demo\demo-surface.tsx` (+ child components under `src/components/demo/`)
- Reference: `src/app/demo/[account]/page.tsx`

- [ ] **Step 1: Read demo-surface.tsx** to map the current sections (atlas, site detail, archetype mix, journey replay, simulator).

- [ ] **Step 2: Add/adjust four rendering behaviors** (component code follows existing patterns; keep each focused):
  1. **Core-sample header:** if `account.networkCount` present, render "We core-sampled {auditedCount} of ~{networkCount} {facilityNoun} — {sampleRationale}" with the `networkCountSource` as a footnote. Never render "only/partial."
  2. **Observed/modeled tags:** site metric rows show `yardMetrics` as observed (with imagery date from the site `verification.imageryDate` / tiles) and any modeled value (turn-time/scenario) clearly labeled "modeled." Surface `confidence` + `uncertainFields` per site ("what we can't see from orbit — that's the 30-minute audit").
  3. **The turn:** a prominent "What surprised us" section rendering `account.surprisingFindings` as the forward-worthy moment, after the atlas/build.
  4. **The /roi handoff close:** an end-of-page CTA "Turn what you saw into a number for finance" → `https://yardflow.ai/roi/?pack=<slug>&utm_source=demo` + the live booking link; and an inbound note that this is the deep-dive behind `/for/<slug>`. `/demo` renders NO network dollar figure.

- [ ] **Step 3: Verify render locally** (dev server, screenshot a sample account; confirm core-sample header, observed/modeled tags, surprising-finding section, /roi handoff). Read the screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/components/demo
git commit -m "feat(demo): core-sample framing + observed/modeled provenance + surprising-finding turn + /roi handoff"
```

### Task 2.3: Three-surface handoff links on /for and /roi

**Files:**
- Modify: `C:\Users\casey\Flow-State-\flow-state-site\src\lib\for\build.ts` (and the bespoke /for pages' CTA labels) — the /for→/demo CTA reads "See the {N} sites we mapped" (promise→proof), not "see the demo".
- Modify: the /roi page to accept `?pack=<slug>` prefill (confirm it already does via `roiPrefill`).

- [ ] **Step 1:** Update the shared CTA label + confirm /roi `?pack=` seeding reproduces the /for headline (Phase 1 consistency). Gate: `npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/for src/app/roi 2>/dev/null; git commit -m "feat(for): promise->proof /demo CTA + /roi pack-prefill handoff"
```

---

## PHASE 3 — Per-account atomic rollout loop (repeatable unit)

Goal: bring each account's `/demo` to A+ and reconcile its `/for`/`/roi`. This task is the **atomic unit, repeated per account**, run in waves (start with the 12 send-list accounts, then the rest). Dispatch one implementer per account (subagent-driven).

### Task 3.N: A+ a single account `<slug>` (template — repeat per account)

**Files (per account):**
- Modify: `modex output/yard-audits/<slug>/sites/*.json` (verification + imagery dates), `roster.json`
- Modify: `modex public/demo-packs/<slug>.json` (via rebuild): `networkCount`/source/asOf, `sampleRationale`, `dossierIntro`, exactly 3 `surprisingFindings`
- Create: `modex public/gallery-thumbs/<slug>.png` AND copy to `Flow-State-/flow-state-site/public/gallery-thumbs/<slug>.png` (modex Deployment Protection blocks proxying — see project_pepsico_showpiece)
- Modify (if needed): `Flow-State- data/for-packs/<slug>.prize.json` (scope-tier), `src/lib/for/<slug>.ts`

- [ ] **Step 1: Verify every mapped site (FOV).** Run `verify-facility-prompt.md` over the account's sites if not already done in Phase 0. Drop/replace any `rejected` site; re-select a stratified replacement from the confirmed candidate pool (cover archetypes). Each kept site has a `verification` block with >=1 citation + imageryDate + `checkedDivestiture`.

- [ ] **Step 2: Source the network denominator.** Find a citable network size (10-K, investor materials, company facility pages). Set `networkCount`/`networkCountSource`/`networkCountAsOf`. If uncitable, leave unset → account stays Tier 1 (audited-only prize). Write `sampleRationale` (the stratification statement: "biggest, newest, most/least automated; pattern held across all").

- [ ] **Step 3: Write the dossierIntro + exactly 3 surprisingFindings** — grounded, observed-vs-modeled clean, one genuine network-shape insight (gate:dock ratio / drop-vs-live / rail-vs-dray / long-entry-drive / overflow / archetype concentration). Real numbers from the pack only. No fabrication.

- [ ] **Step 4: Rebuild + validate the pack.**

Run (modex): `npx tsx scripts/yard-audit/build-demo-pack.ts <slug> && npm run validate:packs && npm run test:unit -- src/lib/demo/__tests__/pack-schema.test.ts`
Expected: build gate passes (no unverified site), validate:packs OK, schema test green.

- [ ] **Step 5: Gallery thumb to BOTH repos.** Generate `public/gallery-thumbs/<slug>.png` (zoom-17 satellite of a confirmed flagship site via Maps Static), copy into Flow-State `public/gallery-thumbs/<slug>.png`, add the account to the `/demo` gallery curation (`src/lib/demo/industry-tags.ts`) if it should be featured. Read the PNG to confirm it's a real yard, not a blank tile.

- [ ] **Step 6: Reconcile the prize (scope-tier).** Regenerate the Flow-State snapshot: `npx tsx scripts/gen-for-prize.ts <slug>`. If Tier 2, confirm the double-disclosure renders; the additivity guard passes. Confirm `/for` headline == `/roi` seeded headline.

- [ ] **Step 7: Why-now from the account's capital.** Ensure the `/for/<slug>` why-now beat braids a real, dated account capex/expansion/automation fact to the yard-as-dependency framing (refresh if the Phase-0 scrub changed facts).

- [ ] **Step 8: Gate both repos.**

Run (Flow-State): `npm run test:unit -- src/lib/for/__tests__/all-accounts.test.ts && npm run lint:dashes`
Run (modex): `npm run validate:packs`

- [ ] **Step 9: Visual review.** Render `/demo/<slug>` (+ `/for/<slug>`) locally, screenshot full page, read it: core-sample header present + sourced; no dead/phantom facility; observed/modeled tags correct; surprising finding lands; no broken images; /roi handoff works; numbers reconcile with /for.

- [ ] **Step 10: Commit** (per repo)

```bash
# modex
git add public/demo-packs/<slug>.json public/gallery-thumbs/<slug>.png output/yard-audits/<slug> src/lib/demo/industry-tags.ts
git commit -m "feat(demo): <slug> /demo to A+ (verified sample, denominator, surprising finding)"
# Flow-State
git add flow-state-site/public/gallery-thumbs/<slug>.png flow-state-site/data/for-packs/<slug>.prize.json flow-state-site/src/lib/for/<slug>.ts
git commit -m "feat(for/roi): <slug> prize reconciled to scope-tier + demo handoff"
```

### Task 3.FINAL: Deploy + verify the wave

- [ ] **Step 1:** Full gates green in both repos (Flow-State all-accounts + lint:dashes + typecheck; modex validate:packs + pack-schema test + `npm run build`).
- [ ] **Step 2:** Push both repos' branches to `main` (clean fast-forward; nudge Vercel if no build appears).
- [ ] **Step 3:** Poll both prod builds to READY; spot-check live: `/demo/<slug>` 200 + core-sample header + gallery thumb 200 + no rejected facility name present; `/for/<slug>` headline == `/roi?pack=<slug>` seeded headline.
- [ ] **Step 4:** Remove the modex worktree (unlink the node_modules junction first; `git worktree remove`); restore Flow-State to main; delete merged branches.

---

## Self-review notes
- **Spec coverage:** Layer 1 (FOV)→Phase 0; Layer 2 (observed/modeled)→Tasks 2.2/3.1/3.3; Layer 3 (core-sample/denominator)→Tasks 2.1/2.2/3.2; Layer 4 (three-surface contract)→Tasks 2.2/2.3; Layer 5 (scope-tier prize)→Phase 1; Layer 6 (surprising finding + why-now)→Tasks 3.3/3.7. Acceptance criteria + live-landmine Step 0→Phase 0. All covered.
- **Per-account creative steps** (dossierIntro, surprisingFindings, why-now) are authored procedures, not literal code — they are content gated by validate:packs + the schema test + visual review, exactly as the PepsiCo run was. Real facts only; FOV gates accuracy.
- **Order matters:** Phase 0 (accuracy) before everything; Phase 1 (numbers) before per-account prize reconcile; Phase 2 (rendering) before the per-account loop can show the new framing.
