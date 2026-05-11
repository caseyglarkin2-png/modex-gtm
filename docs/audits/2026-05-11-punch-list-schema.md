# Punch list row schema

Both audit subagents produce a Markdown table with **exactly** these columns, in this order:

| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|

## Column definitions

- **Severity** — one of: `P0 systemic` · `P1 per-account` · `P2 polish`
- **Scope** — one of: `All 40` · `Tier 1 (20)` · `Tier 1+2 (34)` · or a single slug like `kraft-heinz` (or comma-separated slugs for 2–4 accounts)
- **Surface** — one of: `cover` · `prose` · `marginalia` · `audio-brief` · `soft-action` · `footnote` · `colophon` · `mobile` · or a component path like `memo-shell.tsx`
- **Dimension** — exactly one of the 9 rubric dimension names (see prompts for the lists)
- **Finding** — 1–2 sentences. Specific. Evidence-grounded. No "could be improved" — say what's wrong and why it matters.
- **Evidence** — one of:
  - `file:line` (e.g., `memo-shell.tsx:232`)
  - `screenshot:{slug}-{viewport}.png` (e.g., `screenshot:kraft-heinz-desktop.png`)
  - `copy: "..."` (a verbatim excerpt, ≤140 chars)
- **Fix** — 1 paragraph. For code/design findings: which file changes, what changes, ideally with before→after snippet. For copy findings: the actual rewrite snippet (not a directive like "rewrite to be more X").

## File structure

Each output file is:

```
# {Audit name} punch list — 2026-05-11

**Auditor:** {subagent name}
**Run date:** 2026-05-11
**Accounts covered:** 40 of 40
**Leak-scan status:** CLEAN | ISSUES PATCHED IN-LINE (see notes)

## Notes

(Any leak-scan patches made during the audit, plus any per-tier observations
the auditor wants to call out before the table.)

## Findings

| Severity | Scope | Surface | Dimension | Finding | Evidence | Fix |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |
```

## Coverage rule

Each of the 9 rubric dimensions must yield **at least one row** per account, OR the account must appear once with `Finding = "No issue"` for that dimension. Total minimum rows: 40 accounts × 9 dimensions = 360 rows per audit. Realistically expect 500–800 once systemic + per-account issues are tagged.

## Sorting

Within the table, sort rows by: Severity (P0 first), then Dimension number (1→9), then Scope (All 40 → Tier-grouped → single-account).
