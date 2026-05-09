# AGENTS.md — Read me first

A second Claude session may be running concurrently against this repo and the sibling repo `caseyglarkin2-png/Flow-State-`.

**Before starting any work, read [`COORDINATION.md`](./COORDINATION.md).** It is the protocol for not stomping each other.

Short version:

- One session is **Architect** (markdown, specs, content, PR review).
- One session is **Builder** (code, deploys, PRs).
- All work flows through GitHub Issues with routing tokens (`[design]`, `[build]`, `[content]`, `[fix]`, `[review]`).
- Claim before you touch — comment `[claimed: <agent>, <iso-timestamp>]` on the issue.
- Locks expire after 4 hours. Casey is the tiebreaker.

If you are about to:

- Push to `main` — don't. Use a branch.
- Touch a file without an open issue claiming it — file the issue first.
- Make a cross-repo change — read `COORDINATION.md § Cross-repo work` before you start.

When in doubt, ask Casey.
