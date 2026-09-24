# Architect drafts

Raw markdown prose drops from the Architect-side Claude session (the WSL one focused on specs/content/PR review).

These are **starting fuel**, not finished assets. The Builder lifts them into the structured \`AccountMicrositeData\` schema (\`src/lib/microsites/schema.ts\`) and the existing memo section types (\`yns-thesis\` / \`observation\` / \`comparable\` / \`methodology\` / \`about\`) — adapting voice, length, and structure to fit the live memo template.

## What's in here

### `field-report-canonical.md` (~1,500 words)
Bloomberg-style investigation of "the largest yard rebuild in North America" — the anchor-customer story, never naming Primo. The narrative spine is general-purpose; per-account memos can lift sections of it as their `comparable` section content.

Already-written variants of this story may exist in the live memo template's `comparable` section across accounts. **Triage first** — if the prose here is redundant, file an issue closing this draft. If it's tighter / sharper than what's live, port it in.

### `kraft-heinz-manifesto.md` (~700 words)
Long-form thesis prose in YardFlow's manifesto register — opening declaration, what-we-know, the-next-problem, what-we'd-do, signoff. **Kraft Heinz is not currently in `accounts/` (the 25-account roster does not include them).** This draft is the seed for adding Kraft as a new account. Use it as the basis for the `yns-thesis` section, with the `What we know` block lifted into `observation` and the `What we'd do` block lifted into `methodology`.

### `kraft-heinz-callouts.md`
Per-account sidebar callouts for Kraft (cost, score, "where Kraft is different", "what's at stake"). Maps to whatever data lives in the right-gutter marginalia on the live memo template.

### `diageo-manifesto.md` (~600 words)
Long-form thesis prose for Diageo — same register as Kraft. **Diageo IS in `accounts/diageo.ts` already.** Compare against the existing memo content; if the live `yns-thesis` is weaker, port this in. If it's already strong, close this draft.

### `diageo-callouts.md`
Per-account sidebar callouts for Diageo.

## Editorial constraints

- **Never name Primo.** Use attribute identifiers ("Tier-1 CPG anchor customer," "237 facilities," "the parent company"). See issue #48 (Editorial style guide) for the full rules.
- The voice is Casey's first-person, direct, slightly polemic — not Bain-deck corporate.
- No invented numbers. Every dollar figure traces to default detention math (facility count × 25K/mo) or comes from the dossier.

## Provenance

Authored by the Architect session as part of the V1 → V2 plan in `caseyglarkin2-png/yardflow-asset` (private). Original location: `yardflow-asset/docs/superpowers/plans/2026-05-10-yard-network-lab-v2-sprint.md` Tasks 8, 16, 17, 19. Lifted here for Builder integration.
