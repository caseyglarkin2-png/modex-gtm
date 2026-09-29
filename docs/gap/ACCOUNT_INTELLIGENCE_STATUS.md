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

- **J. Entity type != YardFlow fit.** PR #311 (3af3bc46).
  - `entity/fit.ts`.
  - Name rules guess the type; they settle fit only when obvious.
  - Candidates were re-derived.
- **K. Corporate family.** PR #312 (915ac745).
  - `family/family.ts`: parent / subsidiary / sibling, never merged.
  - The action-time family hold is part of the one opportunity check.
  - An audited separate buying motion.
- **L. Grounded provider chain.** PRs #313 (a05d2a00), #314 (4ceecab0), #316 (d7c15aac), #318 (b0d49ddc).
  - `entity/providers.ts`: Gemini, then OpenAI web_search, then the AI Gateway Perplexity search tool (AI SDK).
  - Claims must be cited. A quota is a cooldown plus the next provider.
  - A failed pass is audited and retryable, never a verdict.
  - One Scout at a time; daily success and attempt caps.
- **M. Accents, first-party dates, section outcomes, motion-aware plan.** PR #315 (6fcebe1e).
- **Fit from operations.** PR #317 (77d6b713): an unknown type with corroborated operations is a direct buyer.
- **Final red team (ICP, RevOps, research).** PRs #319 (0c1975fa), #320 (3824ed04), #321 (fc9fa508), #322 (same-company shells).

## MMYQB recovery (production, 2026-09-29, fit vocabulary)

- 117 open companies:
  - DIRECT BUYER 8: AkzoNobel, Costa Farms, DTX Trans Inc, FedEx Supply Chain, Harbor Foods Group, Industrial Electric Mfg., Lineage Logistics, Nestlé.
  - POTENTIAL 3: Brown Dog Carriers & Logistics, plus two likely false positives for Casey's review (Association for Supply Chain Management, Bates College).
  - UNKNOWN 30, of which 19 are an ambiguous identity (for example "Schneider": say which company).
  - PARTNER 10.
  - NOT FIT 24.
  - Not judged yet 42.
- Newly identified direct operators that the old name rules would have rejected: Lineage Logistics, FedEx Supply Chain, DTX Trans Inc.
- Scout ran through the production route:
  - Gemini (Lineage).
  - The AI Gateway Perplexity tool (15 more), while Gemini (free-tier daily quota) and OpenAI (no credits) were cooling.
- It stopped at the daily cap of 60 successful passes. Resume tomorrow with `scout-route.mjs <source> 60` or the Scout button on `/gap/candidates`.
- Report: `docs/gap/mmyqb-recovery-latest.md`.
- Nothing was created, mapped, drafted or sent.

## Named debt

- **Owner items (billing).** OPENAI_API_KEY has no credits, so `openai_web` is skipped. The Gemini key is free-tier (about 20 a day). The AI Gateway Perplexity tool carries Scout and research today.
- **Account creation vs family.** Adding "Frito-Lay" while PepsiCo exists is caught by name, alias, domain or HubSpot id. The parent relationship itself is not a creation check. The action-time family hold covers outreach.
- **Perplexity rate limits.** They arrive as tool output, not errors: refused as no_citations with no cooldown (P2).
- **Candidate-queue false positives.** For example, ASCM and Bates College are POTENTIAL. Casey's review catches them; nothing is created without ADD.
- **Pre-existing lint errors** (not touched here): `thesis-group-review.tsx` (a hook in a callback), `identity/service.ts` (`any`), `account-boundary.test.ts`.

GitHub Actions: the account is locked for billing. The release gate is local checks (GAP suite, typecheck, lint, scratch E2Es) plus the Vercel preview build.
