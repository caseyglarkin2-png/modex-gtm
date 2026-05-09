# COORDINATION.md — Two Claude Sessions, One Mission

> **Read this first if you are a Claude Code session opened in this repo.**
> A second Claude session may be running concurrently against the same codebase. This document is the protocol. Follow it.

## The repos in scope

- **`caseyglarkin2-png/modex-gtm`** — the per-prospect microsite app. Renders at `modex-gtm.vercel.app/for/{slug}` and is rewritten through `yardflow.ai/for/{slug}`. 25+ accounts wired in `src/lib/microsites/accounts/`.
- **`caseyglarkin2-png/Flow-State-`** — the `yardflow.ai` marketing-site shell (`flow-state-site/` subdirectory). Owns `/for/*` and `/proposal/*` rewrites to modex-gtm.

Both repos may have a Claude session attached. Coordination across both is mandatory.

## The two roles

This is not parallel duplication. The two sessions specialize and amplify each other.

### Builder

- Lives in code (mostly `modex-gtm` and `flow-state-site`).
- Cadence: fast — claims an issue, branches, ships a PR in the same session.
- Owns: codebase conventions, deploy ops (Vercel, CI, CSP, assetPrefix, Sentry, Prisma), production fires.
- Output: PRs.
- When uncertain: implements pragmatically against existing patterns; doesn't redesign.

### Architect

- Lives in markdown (specs, plans, content drafts, PR review).
- Cadence: slow — drafts once, reviews many times.
- Owns: feature design, content prose (manifestos, Field Reports, copy), PR review using two-stage pattern (spec compliance → code quality), prospect dossier curation.
- Output: GitHub Issues (with full implementation code embedded), content `.md` files, PR reviews.
- When uncertain: proposes 2–3 options + tradeoffs for Casey.

**A session can flex between the two**, but in any given moment must declare which role it is in (see "Claiming work" below). Crossing roles silently is the most common failure mode.

## The single ledger

GitHub Issues. Every piece of work lives as an issue on one of the two repos.

### Routing tokens (issue title prefix)

| Prefix | Meaning | Initial owner |
|---|---|---|
| `[design]` | Needs spec/architecture before code | Architect |
| `[content]` | Needs prose/copy authoring | Architect |
| `[build]` | Implementable as-described | Builder |
| `[fix]` | Production fix or bug | Whoever's online |
| `[review]` | Code review needed on an open PR | Architect |

When an Architect issue is fully specified (full code, full content, no open questions), the Architect re-tags it `[build]` and unassigns. Builder picks it up.

### Issue lifecycle

```
Architect files [design] or [content] issue with full body
       │
       ▼ (when ready to implement)
Architect re-tags to [build] and unassigns
       │
       ▼
Builder claims (see "Claiming work")
       │
       ▼
Builder branches, codes, opens PR linking the issue
       │
       ▼
Architect reviews (spec compliance pass, then code quality pass)
       │
       ▼
Builder iterates if requested
       │
       ▼
PR merges, issue auto-closes
```

## Claiming work (no-stomp protocol)

**Before touching any file:**

1. `git fetch && git status` in both repos. If there are unpulled commits, rebase first.
2. Read the issue you are about to claim. If it has a comment matching `[claimed: <agent>, <ISO timestamp>]` newer than 4 hours, **do not claim it**. The other session is on it.
3. To claim: comment `[claimed: <agent-id>, <ISO timestamp>]` on the issue. Self-assign on GitHub. Then start work.
4. To release a claim without finishing: comment `[released: <agent-id>, <reason>, <ISO timestamp>]` and unassign yourself.
5. When work is shipped (PR merged or closed): the issue auto-closes; the claim is implicit history.

**Locks expire at 4 hours.** A session that walks away without releasing forfeits the claim. Other session can re-claim with a comment noting the prior claim's expiration.

**Agent ID convention:** use whatever short identifier the human (Casey) refers to you by. Common: `agent-windows` for the Windows-side session, `agent-wsl` for the Linux-side session. If unsure, ask Casey before claiming. Consistency matters more than the specific name.

## Cross-repo work

A change that touches both `modex-gtm` and `Flow-State-` (e.g. the recent CSP + assetPrefix coordination):

1. File one **tracking issue** on `modex-gtm` (the more frequently touched repo) describing the cross-cutting change.
2. Open both PRs in dependency order. **Ship the dependency first.** Example: a CSP allowance must merge before code that requires the new origin gets deployed.
3. In each PR description, link the other PR explicitly: `Coordinates with caseyglarkin2-png/<repo>#<n>`.
4. Single agent owns the cross-repo claim until both PRs merge. Don't split the two halves between sessions.

## Pre-push checklist

Every session, before any `git push`:

- [ ] `git fetch origin && git status` shows clean working tree against latest main (or you've rebased onto it).
- [ ] Tests pass locally — at minimum `pnpm test` (or the repo's equivalent) in any package you touched.
- [ ] No commits to `main` directly. All work via branches.
- [ ] PR description names the issue (`Closes #N`) so it auto-closes.
- [ ] If the change touches `next.config.*`, `vercel.json`, CSP, or middleware: explicitly call out the cross-repo deploy ordering in the PR description.

## What Casey owns (the human in the loop)

- **Priority order** on the open issue backlog.
- **Tiebreaker** on architecture or content decisions when sessions disagree.
- **Production deploy approval** (merging is automatic; promotion to prod is not).
- **Hiring/firing** of issues (closing without implementing if the idea is rejected).
- **Cross-session escalation** — the only path for one session to flag the other ("I think the other agent is mid-flight; should I wait?"). The session asks Casey, not the other session directly.

Casey does not coordinate mechanics. The protocol does.

## When the protocol is unclear

Stop. Ask Casey. Don't improvise mechanics.

The cost of one extra question is low. The cost of stomping the other session's work is high (lost PRs, conflicting designs, double-maintenance). Default to asking.

## Common failure modes (don't do these)

1. **Silent role-switching.** Architect sees a "small" code change and ships it without filing an issue. Now Builder doesn't know it happened.
2. **Skipping the lock.** Two sessions both pick up a `[build]` issue without claiming. Two PRs land that touch the same files.
3. **Cross-repo half-finished.** One PR ships that requires the other; the other never opens; production breaks until someone notices.
4. **Stale fetches.** Working off a 4-hour-old `main`. The other session has already changed the file you're about to commit.
5. **No PR review.** Builder self-merges a `[build]` PR without Architect reviewing. Quality drift over time.
6. **Issues without full code.** Architect files an issue with vague description. Builder has to guess the implementation.
7. **Claiming and ghosting.** Session claims issue, walks away mid-work, doesn't release. Lock expires after 4 hours; other session has been blocked.

## What this document is not

- Not a personality / tone guide. (See per-repo style docs for that.)
- Not a ticket workflow tool. (GitHub Issues are the system of record.)
- Not a substitute for talking to Casey when something is genuinely unclear.

## Updating this document

This file is itself a `[build]` issue when it changes. File the issue, claim it, PR the change. Don't push directly to main.

---

*Last reviewed: when this PR merged.*
