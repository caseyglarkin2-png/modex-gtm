# GAP Account Intelligence + Entity Expansion (status ledger)

STATUS: ACTIVE

<!-- verified:2026-09-29 -->

Baseline: `origin/main` a990e90f (Universal Work Intake shipped). Implementation worktree:
`C:\Users\casey\wt-gap-account-intelligence`, branch `feat/gap-account-intelligence` and follow-ups.

North star: VERIFIED BUYER TRUTH PER MINUTE OF CASEY'S TIME. Turn "a company we barely know" into a
decision-grade understanding: what is known, modeled, inferred and unknown, who matters, where YardFlow
could fit, and the next justified human action (or "do not contact yet").

## Truth contract (`src/lib/gap/account-intel/truth.ts`)

Every material statement is exactly one of BUYER_CONFIRMED (a human-confirmed BID), VERIFIED_PUBLIC
(verified at its source, or a dated audit), MODELED_ESTIMATE (inputs, formula, a range, assumptions; never a
point), INFERENCE (falsifiable), UNKNOWN, CONTRADICTED (visible until resolved). A statement missing what its
class requires is refused. Section status (KNOWN / PARTIAL / MODELED / UNKNOWN / STALE / CONTRADICTED) is
derived, never scored. Buyer truth outranks public.

## Progress

- [x] Bootstrap: worktree from a990e90f, clean.
- [x] Truth contract + validators (9 tests).
- [ ] Release A: canonical AccountIntelligenceBrief (live projection) + account surface.
- [ ] Release B: entity expansion (Scout, candidate accounts, ambiguous people, normalization).
- [ ] Release C: research orchestrator (Scout / Brief / Deepen, missing-field priority).
- [ ] Release D/E: seller UX everywhere + intelligence into motion (six-line brief reads the brief).
- [ ] Release F: continuous memory (signals update sections, buyer truth outranks, thesis needs review).
- [ ] Release G/H: MMYQB recovery + real dogfood.
- [ ] Release I: four-lens red team.

GitHub Actions: the account is locked for billing; local checks (GAP suite, typecheck, lint, scratch E2Es)
plus the Vercel preview build are the release gate.
