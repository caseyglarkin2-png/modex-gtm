# Microsite Fix Phase 3 — Section Migration (14 Empty-Body Accounts)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 14 empty-section accounts (P0-9 in the master punch list) from `sections: []` to fully-authored memo bodies matching the Tier 1 quality bar (`kraft-heinz.ts`). Remove the "Working analysis · v0" colophon flag on each. The Tier 1 anchor question — empty body + Draft badge on highest-priority prospect surfaces — closes with this phase.

**Architecture:** Each account is one atomic task (own file, no cross-account file conflicts). The work is **register translation + schema migration**, not blank-page authoring — every empty-section .ts file already has 80–150 lines of substantive legacy commented content (named people, facility specifics, town names, mandates). Subagents extract that material, pull supplementary public intel (Drive dossiers, clawd signal feeds, web research), and re-render in the memo voice into the 5-section schema.

**Tech Stack:** TypeScript Next.js 16 app, `MemoMicrositeSection` schema (yns-thesis · observation · comparable · methodology · about · artifact), Vitest for verification, leak-scan grep for voice compliance, kraft-heinz.ts as reference quality bar.

---

## Account roster (20 atomic tasks — updated 2026-05-11 post-recon)

**Update:** Recon revealed 18 empty-section accounts at branch base (not 14). The original punch list deferred the 6 Tier 3 reach accounts to P2; aggregated total = 14 (T1+T2) + 6 (T3) = **20 atomic tasks** if we close the entire empty-body backlog. Per Casey's "exhaustive" directive, Tier 3 folded in as Cohort E.

## Account roster

Sequenced by cohort. Within a cohort, all tasks dispatch in parallel (separate files → no conflicts).

| Cohort | Slug | Tier · Band | Vertical | Intel-density | Notes |
|---|---|---|---|---|---|
| **A** | `ab-inbev` | Tier 1 · A | beverage | High (529 legacy lines) | Highest stakes — validate approach here first |
| **A** | `coca-cola` | Tier 1 · A | beverage | High (499 legacy lines, clawd dossier exists) | |
| **B** | `hormel-foods` | Tier 2 · B | cpg | High (456 lines, Primo Brands hard-freight unlock applies) | |
| **B** | `jm-smucker` | Tier 2 · B | cpg | High (495 lines) | |
| **B** | `keurig-dr-pepper` | Tier 2 · B | beverage | Med (282 lines) | |
| **B** | `constellation-brands` | Tier 2 · B | beverage | Med (278 lines) | |
| **C** | `caterpillar` | Tier 2 · B | heavy-equipment | High (Margaret Poorman, Griffin GA, 360K parts) | Industrial — Primo lift framing applies |
| **C** | `ford` | Tier 2 · B | automotive | High (Drive: business case + 6-month pilot plan) | BlueOval City + EV transition angle |
| **C** | `toyota` | Tier 2 · B | automotive | Med (278 lines) | JIT assembly thesis |
| **C** | `georgia-pacific` | Tier 2 · B | building-materials | Med (454 lines) | |
| **D** | `the-home-depot` | Tier 2 · B | retail | High (495 lines, clawd dossier — Withvector competitive signal) | |
| **D** | `h-e-b` | Tier 2 · B | grocery | High (454 lines) | |
| **D** | `mondelez-international` | Tier 2 · B | cpg | Med (282 lines, 130 plants + integration thesis already in metaDescription) | |
| **D** | `performance-food-group` | Tier 2 · B | grocery | Med (280 lines) | |
| **E** | `barnes-noble` | Tier 3 | retail | Legacy comments TBD | Reach account — previously P2 deferred |
| **E** | `fedex` | Tier 3 | logistics-3pl | Legacy comments TBD | Reach account — pitch-shape note in punch list (CPG frame on carrier) |
| **E** | `honda` | Tier 3 | automotive | Legacy comments TBD | Reach account |
| **E** | `hyundai-motor-america` | Tier 3 | automotive | Legacy comments TBD | Reach account — pitch-shape note (5-facility footprint) |
| **E** | `john-deere` | Tier 3 | heavy-equipment | Legacy comments TBD | Reach account |
| **E** | `kenco-logistics-services` | Tier 3 | logistics-3pl | Legacy comments TBD | Reach account |

Cohort A first (validate approach), then B/C/D/E parallel-dispatch as bandwidth allows.

---

## File touchpoints

Each per-account task modifies exactly one file:
- `src/lib/microsites/accounts/{slug}.ts`

Changes per file:
1. Replace `sections: []` with a 5-section memo array (yns-thesis · observation · comparable · methodology · about). Optional 6th: `artifact` section if redacted evidence available.
2. Set `needsHandTuning: false` (removes the colophon "Working analysis · v0" flag).
3. Rewrite `framingNarrative` + `openingHook` + `stakeStatement` in `personVariants[]` to match memo voice (anti-sales register, observational).
4. Optionally trim the legacy JSDoc comment block — its content has now migrated into structured sections.
5. Leave `proofBlocks: []` alone (deprecated for memo template — `comparable` section carries proof now).

**Hard guardrails (apply to every account):**
- Anchor customer (237-facility CPG) is **un-name-able** — only attribute identifiers ("Tier-1 CPG anchor customer," "the largest bottled-water producer in North America," "a 237-facility CPG network").
- Primo Brands is the **public comparable** — named freely as `comparableName`.
- No event names (MODEX, ProMat, CSCMP EDGE, RILA LINK, year suffixes).
- No sales-tell: "book a call," "schedule audit," "$X in annual savings," "we eliminate," "our solution."
- Event-agnostic copy.

---

## Reference files every subagent reads

- `docs/editorial-style.md` — voice register, leak rules, Primo framing
- `src/lib/microsites/accounts/kraft-heinz.ts` — gold-standard quality bar (248 lines, 5 memo sections)
- `src/lib/microsites/accounts/dannon.ts` — maximalist example (608 lines, deeper sections)
- `src/lib/microsites/accounts/dhl-supply-chain.ts` — alternate vertical reference (277 lines, logistics)
- `src/lib/microsites/schema.ts` — section type definitions
- `docs/audits/2026-05-11-microsite-master-punch-list.md` — per-account findings (P1 rows)

---

## Per-account intel sources to exhaust

Each subagent MUST pull from all four before authoring:

1. **Legacy commented content** in the account's own .ts file (`/\*[\s\S]*?\*/` blocks before/after `export const`).
2. **clawd signal dossier** at `/mnt/c/Users/casey/clawd-control-plane/artifacts/signal_dossiers/{slug_with_underscores}.json` if it exists (coca_cola, the_home_depot, kraft_heinz known to exist).
3. **Drive dossiers** — search via Google Drive MCP for `title contains '{AccountName}' and (title contains 'FREIGHTROLL' or title contains 'PILOT' or title contains 'BUSINESS CASE' or title contains 'DOSSIER' or title contains 'BRIEF')`. Read top hits.
4. **Public web research** — WebSearch for the account's most recent supply chain news, facility expansion announcements, M&A activity, operational programs (Agile@Scale-equivalents), ATA/Aberdeen benchmarks applicable to the vertical.

The subagent's first commit is the recon dump if useful; the second commit is the section migration.

---

## Task structure (atomic unit, repeated 14×)

### Task N: Migrate `{account-slug}.ts` to memo template

**Files:**
- Modify: `src/lib/microsites/accounts/{slug}.ts`

**Step 1: Recon (subagent does in its own context)**

- [ ] Read `src/lib/microsites/accounts/{slug}.ts` — note legacy JSDoc comment specifics, existing `people[]`, `personVariants[]`, `network`, `freight`, `signals` fields
- [ ] Read `kraft-heinz.ts` (quality reference) + `editorial-style.md` (voice)
- [ ] Read clawd signal dossier if exists: `/mnt/c/Users/casey/clawd-control-plane/artifacts/signal_dossiers/{slug_underscores}.json`
- [ ] Drive search via Google Drive MCP for account-specific dossiers (FREIGHTROLL business cases, pilot plans, briefs)
- [ ] WebSearch for: recent facility expansions, M&A, supply chain initiatives, operational programs, public quotes from named decision-makers in `people[]`
- [ ] Read account-specific rows in `docs/audits/2026-05-11-microsite-master-punch-list.md` (Section 2 P1 patterns)

**Step 2: Author 5 sections**

- [ ] **Section 1 — `yns-thesis`**: `{ type: 'yns-thesis' }`. Optional `headlineOverride` if a more specific framing fits the vertical. Default boilerplate is universal (radios + clipboards thesis).

- [ ] **Section 2 — `observation`** (~400–600 words for `hypothesis`): public-data composition list (4–6 items: facility count, plant network, recent capex announcements, existing yard-tech layer, carrier model, working-capital posture) + a bottleneck hypothesis paragraph + a caveat paragraph. This is the analytical core. The hypothesis must read as a network-shape diagnosis, not a pitch — describe what the prospect is likely seeing internally, not what we're selling.

- [ ] **Section 3 — `comparable`**: `comparableName: 'Primo Brands'` (CPG) or `'a Tier-1 CPG anchor'` (industrial — frame as "harder freight that translates down to your category"). `comparableProfile` paragraph with the freight-difficulty case (weight-out before cube-out, low-margin, multi-temp, refill returns, multi-site bottling). `metrics[]` with 3–4 lines (avg turn time 48→24 min, per-site profit impact, dock-office headcount, network rollout cadence — the Primo-public numbers). `timeline` paragraph identifying 1–2 most-leverage pilot sites for THIS account. `referenceAvailable: true`.

- [ ] **Section 4 — `methodology`**: `sources[]` with 4–7 `FootnoteData` entries, every claim citable. Each source includes `id`, `source`, `confidence` (measured/public/estimated/inferred), `detail`, optional `url`. `unknowns[]` is the intellectual-honesty list — 4–6 things we explicitly don't know but the prospect can confirm or deny in conversation.

- [ ] **Section 5 — `about`**: `authorBio` paragraph (Casey Larkin at FreightRoll, what makes THIS account distinctive in the round). `authorEmail: 'casey@freightroll.com'`. `signOff` paragraph (the "push back on what reads wrong" invitation — not a meeting CTA).

- [ ] (Optional Section 6 — `artifact`): only if a redacted screenshot/manifest specifically applies. Skip if no defensible artifact source — better empty than fabricated.

**Step 3: PersonVariant voice tuning**

- [ ] For each `personVariants[]` entry, rewrite:
  - `framingNarrative` (2–3 sentences, why this analysis lands for this specific person — their named mandate, their public language)
  - `openingHook` (the first thing they read, anchored on a fact about THEIR network that the analysis bothered to learn)
  - `stakeStatement` (what's at risk in their language, no $X savings framing)
- [ ] Update `toneShift`, `kpiLanguage`, `proofEmphasis` if they carry sales-template boilerplate

**Step 4: Flag flip**

- [ ] Set `needsHandTuning: false` in the account object (removes the colophon working-analysis chip).

**Step 5: Optional cleanup**

- [ ] Trim the legacy JSDoc comment block if all its substantive content has migrated. Keep the file header JSDoc (Quality Tier, Pitch shape, Angle).

**Step 6: Verify**

- [ ] `cd /mnt/c/Users/casey/modex-gtm && npx vitest run tests/unit/microsites/ 2>&1 | tail -20` — must pass
- [ ] `npx tsc --noEmit 2>&1 | tail -10` — must pass (may time out on WSL; vitest provides equivalent type-checking)
- [ ] Leak-scan: `grep -iE "BlueTriton|Blue Triton|Niagara Bottling|Pure Life|Poland Spring|Stanwood|Cabazon|Breinigsville" src/lib/microsites/accounts/{slug}.ts` — must return 0 hits
- [ ] Sales-tell scan: `grep -iE "book a call|schedule.*audit|annual savings|we eliminate|our solution" src/lib/microsites/accounts/{slug}.ts` — must return 0 hits
- [ ] Event-leak scan: `grep -iE "MODEX|ProMat|CSCMP EDGE|RILA LINK" src/lib/microsites/accounts/{slug}.ts` — must return 0 hits
- [ ] Read the rendered memo once end-to-end (yns-thesis → observation → comparable → methodology → about). It should read as one writer, account-specific, anti-sales.

**Step 7: Commit**

```bash
cd /mnt/c/Users/casey/modex-gtm
git add src/lib/microsites/accounts/{slug}.ts
git commit -m "feat(microsite/{slug}): migrate to memo template — section authoring per Phase 3 P0-9

Sections: yns-thesis · observation · comparable · methodology · about.
Sets needsHandTuning: false (removes Working-analysis v0 chip).
PersonVariant framingNarratives + openingHook + stakeStatement rewritten
in memo voice.

Closes part of P0-9 (16-account section migration)."
```

---

## Cohort execution model

**Cohort A — Tier 1 Band A (parallel, 2 implementers):**
1. ab-inbev — implementer subagent
2. coca-cola — implementer subagent

→ both return → 2 parallel spec reviewers → 2 parallel code-quality reviewers → branch + PR → verify on preview deploy → merge.

**Decision gate after Cohort A:** Casey reviews the rendered ab-inbev + coca-cola memos on prod. If quality lands at T1, proceed to Cohorts B/C/D. If not, iterate the implementer prompt before continuing.

**Cohort B — Tier 2 CPG/Beverage (parallel, 4 implementers):**
3. hormel-foods
4. jm-smucker
5. keurig-dr-pepper
6. constellation-brands

**Cohort C — Tier 2 Industrial/Auto (parallel, 4 implementers):**
7. caterpillar
8. ford
9. toyota
10. georgia-pacific

**Cohort D — Tier 2 Retail/Grocery (parallel, 4 implementers):**
11. the-home-depot
12. h-e-b
13. mondelez-international
14. performance-food-group

**Cohort E — Tier 3 reach accounts (parallel, 6 implementers):**
15. barnes-noble
16. fedex
17. honda
18. hyundai-motor-america
19. john-deere
20. kenco-logistics-services

Each cohort: dispatch all implementers in parallel (single message, multiple Agent calls). After all return, dispatch spec reviewers in parallel. After all approve, dispatch code-quality reviewers in parallel. After all approve, commit the cohort as one PR and merge.

---

## Implementer prompt template

This is the prompt passed to each per-account implementer subagent. Substitute `{ACCOUNT_SLUG}` and `{ACCOUNT_NAME}`.

```
You are migrating the {ACCOUNT_NAME} microsite from sections:[] (Draft state)
to a fully-authored memo body matching the kraft-heinz.ts quality bar.

This is REGISTER TRANSLATION + SCHEMA MIGRATION, not blank-page authoring.
The .ts file already has 80–150 lines of substantive legacy commented
content (named people, facility specifics, town names, mandates). Your job
is to extract that material, supplement it with public intel, and
re-render it in the memo voice into the 5-section schema.

INPUTS TO READ (in this order):

1. /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts
   — extract every specific from legacy JSDoc comments + existing data fields
2. /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/kraft-heinz.ts
   — quality reference (248 lines, 5 memo sections — match this shape)
3. /mnt/c/Users/casey/modex-gtm/docs/editorial-style.md
   — voice register, leak rules, Primo framing (read in full)
4. /mnt/c/Users/casey/modex-gtm/src/lib/microsites/schema.ts
   — section type definitions (lines 380–480 are the memo section types)
5. /mnt/c/Users/casey/modex-gtm/docs/audits/2026-05-11-microsite-master-punch-list.md
   — Section 2 patterns + per-account rows
6. /mnt/c/Users/casey/clawd-control-plane/artifacts/signal_dossiers/{ACCOUNT_SLUG_UNDERSCORES}.json
   — read if exists (will 404 silently if not)
7. Google Drive search:
   title contains '{ACCOUNT_NAME}' and (title contains 'FREIGHTROLL' or
   title contains 'PILOT' or title contains 'BUSINESS CASE' or
   title contains 'DOSSIER' or title contains 'BRIEF')
   — read top 3 hits if any
8. WebSearch for: '{ACCOUNT_NAME} supply chain' '{ACCOUNT_NAME} facility
   expansion' '{ACCOUNT_NAME} modernization' '{ACCOUNT_NAME} operational
   program' — pull recent public-record facts (2024-2026)

HARD VOICE RULES (non-negotiable):

- The 237-facility Tier-1 CPG anchor is UN-NAME-ABLE. Use attribute
  identifiers ONLY: "Tier-1 CPG anchor customer", "the largest
  bottled-water producer in North America", "a 237-facility CPG network".
  Forbidden names: BlueTriton, Blue Triton, Niagara Bottling, Pure Life,
  Poland Spring. Forbidden anchor towns: Stanwood, Cabazon, Breinigsville,
  Hollywood FL, Allentown, Madison GA.
- Primo Brands IS named — it's the public comparable. Use it freely as
  comparableName in the `comparable` section.
- No sales-tell: forbidden phrases include "book a call", "schedule an
  audit", "$X in annual savings", "we eliminate", "our solution",
  "ROI of N%", "payback period of N months" (those belong in /roi/).
- Event-agnostic: forbidden — MODEX 2026, ProMat 2026, CSCMP EDGE,
  RILA LINK, "next week", "Q4 push", any date-relative timing.
- Anti-sales observational register: write as if circulating an
  internal working analysis before sizing a network engagement,
  not as if pitching.
- Specifics beat vague phrases: "30 U.S. plants" beats "many plants";
  "$3B U.S. modernization announced May 2025" beats "recent investment".

SCHEMA OUTPUT — the new sections[] array contains 5 objects in order:

1. { type: 'yns-thesis' } — universal boilerplate; optionally add
   headlineOverride if a vertical-specific framing fits
2. { type: 'observation', headline, composition[], hypothesis, caveat }
   — composition is 4–6 {label, value} pairs of public facts.
   hypothesis is a 400–600 word analytical paragraph describing
   what the prospect is likely seeing internally. caveat is a
   short paragraph acknowledging what we may have wrong.
3. { type: 'comparable', headline, comparableName, comparableProfile,
   metrics[], timeline, referenceAvailable: true } — see kraft-heinz.ts
   lines 63–77 for the canonical shape.
4. { type: 'methodology', headline, sources[], unknowns[] } — 4–7
   FootnoteData sources (id, source, confidence, detail, url),
   4–6 unknowns[] strings.
5. { type: 'about', headline, authorBio, authorEmail: 'casey@freightroll.com',
   signOff }

Then: set `needsHandTuning: false` on the account object.

Then: rewrite framingNarrative + openingHook + stakeStatement on every
personVariants[] entry. The voice rules apply equally to these fields.

Optional: trim the legacy JSDoc comment block — its content has migrated.

VERIFICATION (must pass before reporting DONE):

cd /mnt/c/Users/casey/modex-gtm
npx vitest run tests/unit/microsites/ 2>&1 | tail -20
grep -iE "BlueTriton|Blue Triton|Niagara Bottling|Pure Life|Poland Spring|Stanwood|Cabazon|Breinigsville" src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts
grep -iE "book a call|schedule.*audit|annual savings|we eliminate|our solution" src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts
grep -iE "MODEX|ProMat|CSCMP EDGE|RILA LINK" src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts

All three greps must return 0 hits.

COMMIT MESSAGE:

feat(microsite/{ACCOUNT_SLUG}): migrate to memo template — section authoring per Phase 3 P0-9

Sections: yns-thesis · observation · comparable · methodology · about.
Sets needsHandTuning: false (removes Working-analysis v0 chip).
PersonVariant framingNarratives + openingHook + stakeStatement rewritten
in memo voice.

REPORT STATUS:

- DONE: all sections authored, verification passed, committed
- DONE_WITH_CONCERNS: committed but flagging a concern (state it)
- NEEDS_CONTEXT: missing intel for X — describe what
- BLOCKED: cannot complete because Y

Do not skip the leak-scan greps. The Tier-1 anchor cannot be named.
```

---

## Spec reviewer prompt template

Passed after each implementer reports DONE.

```
You are reviewing the implementer's section migration for {ACCOUNT_SLUG}.

Read:
- /mnt/c/Users/casey/modex-gtm/src/lib/microsites/accounts/{ACCOUNT_SLUG}.ts
  (current state, after implementer's commit)
- /mnt/c/Users/casey/modex-gtm/src/lib/microsites/schema.ts (lines 380–480)
- /mnt/c/Users/casey/modex-gtm/docs/editorial-style.md
- /mnt/c/Users/casey/modex-gtm/docs/superpowers/plans/2026-05-11-microsite-fix-phase-3.md
  (the "Task structure" section above)

Verify each of the following is TRUE. Report any FALSE as a spec gap:

1. sections[] has exactly 5 entries (or 6 with optional artifact) in
   order: yns-thesis · observation · comparable · methodology · about
2. observation.hypothesis is 400+ words and reads as analytical
   diagnosis (not pitch)
3. comparable.comparableName is 'Primo Brands' (for CPG/beverage) or
   an attribute identifier for the anchor (for industrial)
4. comparable.referenceAvailable is true
5. methodology.sources[] has 4+ entries, each with id, source,
   confidence, detail
6. methodology.unknowns[] has 4+ entries
7. about.authorEmail is 'casey@freightroll.com'
8. needsHandTuning is false
9. personVariants[*].framingNarrative is rewritten (not the
   sales-template boilerplate from the generator script)
10. No leaks: grep returns 0 for the BlueTriton/Stanwood etc.
11. No sales-tell: grep returns 0 for book-a-call/eliminate etc.
12. No event-leak: grep returns 0 for MODEX/ProMat etc.

Report:
- ✅ Spec compliant
- ❌ Issues: [list each gap]
```

---

## Code quality reviewer prompt template

Passed after spec review approves.

```
Review the {ACCOUNT_SLUG} migration for code quality.

Read the diff: git show HEAD on /mnt/c/Users/casey/modex-gtm.

Check:
1. TypeScript compiles (or vitest passes — tsc may timeout on WSL)
2. No unused imports; no dead constants left behind
3. JSDoc comment block — either trimmed or rationalized; not stale
4. Long string literals broken across lines reasonably
5. proofBlocks: [] left intact (deprecated for memo template)
6. theme.accentColor — if duplicated with another account in T2
   cohort, note (but don't block — accent dedupe is Phase 5)

Report:
- ✅ Approved
- ❌ Issues: [list, separating "Important" from "Nice-to-have"]
```

---

## Branching + PR strategy

- Branch per cohort: `feat/microsite-phase-3-cohort-{A|B|C|D}-sections`
- All commits in a cohort on its branch
- PR per cohort against `main`
- Verify each PR on its Vercel preview deploy (use `mcp__plugin_vercel_vercel__get_access_to_vercel_url` for SSO bypass)
- Merge cohort PR via merge commit (not squash — preserve per-account commits in history)

---

## Self-review checklist

After writing this plan, the author confirms:

- [x] All 14 empty-section accounts from punch-list P0-9 covered
- [x] Each task is atomic (one file, no cross-account dependencies)
- [x] Per-account intel-source inventory is exhaustive (legacy comments + clawd + Drive + web)
- [x] Voice + leak rules referenced inline in implementer prompt (not assumed)
- [x] Verification commands are exact and copy-paste-ready
- [x] Cohort sequencing has a Cohort-A decision gate before parallelizing the rest
- [x] kraft-heinz.ts referenced as quality bar in every implementer prompt
- [x] No placeholder content ("TBD", "add appropriate", "similar to Task N")
