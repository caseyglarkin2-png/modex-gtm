# GAP Account Intelligence + Entity Expansion (status ledger)

STATUS: ACTIVE

<!-- verified:2026-09-29 -->

Baseline: `origin/main` a990e90f (Universal Work Intake shipped). Implementation worktree:
`C:\Users\casey\wt-gap-account-intelligence`, one branch per release.

North star: VERIFIED BUYER TRUTH PER MINUTE OF CASEY'S TIME. Turn "a company we barely know" into a
decision-grade understanding: what is known, modeled, inferred and unknown, who matters, where YardFlow
could fit, and the next justified human action (or "do not contact yet").

## Truth contract (`src/lib/gap/account-intel/truth.ts`)

Every material statement is exactly one of these classes:

- **BUYER_CONFIRMED:** a human-confirmed BID, which speaks only to its own hypothesis.
- **VERIFIED_PUBLIC:** verified at its source. An audit counts only with a cited URL.
- **MODELED_ESTIMATE:** inputs, formula, a range and assumptions. Never a point.
- **INFERENCE:** must be falsifiable.
- **UNKNOWN**
- **CONTRADICTED:** stays visible until resolved.

A statement missing what its class requires is refused, and the page says so. Section status (KNOWN / PARTIAL / MODELED / UNKNOWN / STALE / CONTRADICTED) is derived, never scored. Buyer truth outranks public truth.

## Progress

- [x] Bootstrap: worktree from a990e90f, clean.
- [x] **Release A:** canonical AccountIntelligenceBrief (live projection, no new tables) + `/gap/accounts/[slug]`, linked from Research, In Deals, sources, signals, the watch list, the action pack and account motion.
  - PR #304, merged e44b1fd7. Production verified at 390px (General Mills, Kroger, PepsiCo).
- [x] **Release B:** entity expansion (branch `feat/gap-entity-expansion`).
  - B1 Scout (`entity/scout.ts`): name rules first (free), then one grounded web pass. The verdict is derived from cited evidence; a claim without an http(s) URL is never evidence.
  - B2 candidate accounts (`entity/candidates.ts`, table `gap_account_candidates`, one row per normalized company). There is ONE creation contract, `createGapAccount`.
    - It checks the exact name, normalized siblings, aliases (current and legacy key), domain and HubSpot (read only) before creating anything.
    - Casey's click needs a reason.
    - The new account lands in band C (watched).
    - The affected sources are re-planned.
  - B2 also covers MAP (curated alias), RESEARCH MORE and IGNORE. The UI is `/gap/candidates` plus each source page.
  - B3 ambiguous people (`entity/people.ts`): THIS IS EXISTING PERSON / NEW PERSON AT THIS ACCOUNT (staged candidate) / WRONG COMPANY / LEAVE UNRESOLVED. A `casey_*` basis is never overwritten by a re-import or the planner.
  - B4 normalization: accents fold (Nestlé is Nestle) and apostrophes stay inside the word. Keys stored the old way still match: the alias context, `registerAlias`, and intake member keys.
  - Scout leads carry into the account brief as INFERENCE.
  - Scratch E2E: `scripts/gap/e2e-entity.ts` (report `docs/gap/entity-e2e-latest.md`).
- [ ] Release C: research orchestrator (Scout / Brief / Deepen, missing-field priority).
- [ ] Release D/E: seller UX everywhere + intelligence into motion (six-line brief reads the brief).
- [ ] Release F: continuous memory (signals update sections, buyer truth outranks, thesis needs review).
- [ ] Release G/H: MMYQB recovery + real dogfood.
- [ ] Release I: four-lens red team.

## Named debt

- **Accented account names in Postgres prefix reads.** `accountCreationCheck` narrows by `startsWith` on the plain stem, so an account stored as "Émile Foods" is missed when adding "Emile Foods". Postgres `insensitive` does not fold accents.
- **Glance polish.** The network line can show a raw URL, and the watch reasons show identifiers (`audited_for_page`). Planned for Release D.
- **Pre-existing lint errors** (not touched here): `thesis-group-review.tsx` (a hook in a callback), `identity/service.ts` (`any`), `account-boundary.test.ts`.

GitHub Actions: the account is locked for billing. The release gate is local checks (GAP suite, typecheck, lint, scratch E2Es) plus the Vercel preview build.
