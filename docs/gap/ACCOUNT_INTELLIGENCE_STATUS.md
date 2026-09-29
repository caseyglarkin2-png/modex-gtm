# GAP Account Intelligence + Entity Expansion (status ledger)

STATUS: SHIPPED 2026-09-29

<!-- verified:2026-09-29 -->

Baseline: `origin/main` a990e90f (Universal Work Intake shipped). Implementation worktree:
`C:\Users\casey\wt-gap-account-intelligence`, one branch per release.

North star: VERIFIED BUYER TRUTH PER MINUTE OF CASEY'S TIME. Turn "a company we barely know" into a
decision-grade understanding: what is known, modeled, inferred and unknown, who matters, where YardFlow
could fit, and the next justified human action (or "do not contact yet").

## Truth contract (`src/lib/gap/account-intel/truth.ts`)

Every material statement is exactly one of these classes:

- **BUYER_CONFIRMED:** a live, human-confirmed BID on that thesis. A status alone never counts.
- **VERIFIED_PUBLIC:** verified at its source. An evidence or audit source needs a URL, and an audit count needs every counted site cited.
- **MODELED_ESTIMATE:** inputs, formula, a range and assumptions. Never a point.
- **INFERENCE:** must be falsifiable.
- **UNKNOWN**
- **CONTRADICTED:** stays visible until resolved.

A statement missing what its class requires is refused, and the page says so. Section status (KNOWN / PARTIAL / MODELED / UNKNOWN / STALE / CONTRADICTED) is derived, never scored. Buyer truth outranks public truth.

## Releases

- **A. Canonical brief and account surface.** PR #304 (e44b1fd7). `/gap/accounts/[slug]` is linked from Research, In Deals, sources, signals, the watch list, the action pack and account motion.
- **B. Entity expansion.** PR #305 (9aec62e3).
  - Scout; `gap_account_candidates`; ONE creation contract (`createGapAccount`); ambiguous people.
  - Accent-folding normalization with legacy-key compatibility.
  - One additive table, applied to prod with its CHECKs.
- **C. Research orchestrator.** PR #306 (406a5573).
  - `planResearch` offers SCOUT / BRIEF / DEEPEN.
  - `POST /api/gap/accounts/deepen` runs Deepen through the one verification pipeline.
- **D/E. Seller UX and intelligence into motion.** PR #307 (a35e932d).
  - ONE approach decision (`motion/approach.ts`), shared by the account page, the cohort cards and the six-line brief.
  - The planner knows account motion.
- **F. Continuous memory.** PR #308 (e04d492a).
  - THESIS NEEDS REVIEW, never a rewrite; "Reviewed, keep it".
  - Buyer vendor statements are read, not just matched.
  - The Deal Brief appears on the account page.
- **G. MMYQB recovery.** PR #309 (4f298a69).
  - Fixed Scout's cut-off web pass.
  - Free name rules.
  - `scripts/gap/scout-cohort.ts`.
  - Report: `docs/gap/mmyqb-recovery-latest.md`.
- **H/I. Dogfood and four-lens red team.** Branch `feat/gap-dogfood`.
  - Record: `docs/gap/ACCOUNT_INTELLIGENCE_DOGFOOD.md`.
  - Red-team P0/P1 were fixed. Fact-led now means problem-led:
    - a buyer rejection shows;
    - discovery follows GAP order;
    - the truth labels are tightened;
    - the owner and wedge logic is fixed.

## MMYQB recovery (production, 2026-09-29)

- 117 open companies:
  - LIKELY ICP 4: AkzoNobel, Costa Farms, Harbor Foods Group, Nestlé.
  - AMBIGUOUS 8.
  - NOT ICP 74: 62 free by name, the rest by Scout.
  - INSUFFICIENT 31, pending a re-scout.
- The first cohort pass hit a Gemini defect (thinking tokens consumed the output budget). It stored 55 empty verdicts before the fix.
- Re-scouting then hit the Gemini quota on BOTH the local key (free tier: 5 a minute, 20 a day) and the production key.
- Resume with: `scout-route.mjs <source> 60` (the rig script in the session scratchpad), or the Scout button on `/gap/candidates`, once the quota resets.
- Nothing was created.

## Named debt

- **Parent/subsidiary.**
  - Deals and first touches on a parent or child company (HubSpot parent companies) are not unioned.
  - Adding "Frito-Lay" while PepsiCo exists is caught only by name, alias, domain or HubSpot id. The parent relationship is not checked.
- **Gemini quota.**
  - Scout and GAP's existing web research share the GEMINI key.
  - A paid key, or a gateway provider with web search, is an owner decision.
- **First-party freshness.** First-party records (personas, relationships, aliases) are undated, so they never go STALE.
- **Accented names in the old prefix reads.** Fixed in the creation check: it now compares in memory. Other `startsWith` narrowings (the slug and sibling reads in `account-intel/load.ts`) can still miss an accented first letter.
- **Section-specific research outcome.** A DEEPEN run's outcome covers the whole run. The daily per-section cooldown bounds it.
- **Pre-existing lint errors** (not touched here): `thesis-group-review.tsx` (a hook in a callback), `identity/service.ts` (`any`), `account-boundary.test.ts`.

GitHub Actions: the account is locked for billing. The release gate is local checks (GAP suite, typecheck, lint, scratch E2Es) plus the Vercel preview build.
