# Claude knowledge inventory (C19)

STATUS: ACTIVE. Written 2026-10-08 for ticket C19 of the "GAP OS COMMERCIAL CONTEXT AND EXECUTION AUDIT" (docs/GAP_PROSPECTING_OS.md). It lists what the Claude Code sessions that built GAP know about the business, where each thing lives, and which of it may be imported into GAP's commercial context as an ATTRIBUTED ARTIFACT (origin and version on every claim), and which may not. <!-- verified:2026-10-08 -->

## 1. Two facts that bound everything below

1. **No model API reads Claude chat, Claude project memory or CLAUDE.md.** GAP's model calls go through `src/lib/gap/ai/spend.ts` (`gapGenerate`) to the AI Gateway with the prompt GAP composes and nothing else. Selecting a Claude model (or any model) grants no access to the Claude Code sessions, their memory directory, their CLAUDE.md files or the chats that produced this repository. Anything a session knows reaches GAP only if it is written into a file GAP reads, with provenance.
2. **A chat instruction is never tool authority.** Text in a memory note, a CLAUDE.md or a plan is DATA to GAP, exactly like a vault note or an email (contract: `context/commercial-context.ts`, the assembler's instruction test in `tests/unit/gap/stream-b-assemble.test.ts`). Nothing in those files can call a tool, change a flag or send anything.

## 2. What the sessions know, and where it lives

| Source | Path (local to Casey's machine) | Owner and versioning | Kind of knowledge |
|---|---|---|---|
| Global operating rules | `C:\Users\casey\.claude\CLAUDE.md` | Casey; edited by hand; no version marker | how Claude works (tests, secrets, sends), nothing commercial |
| Home CLAUDE.md | `C:\Users\casey\CLAUDE.md` | Casey; dated `<!-- verified:... -->` stamps per claim | the system map, HubSpot access, the browser rig, the rig traps; operating facts, not buyer facts |
| Repo CLAUDE.md | `<repo>/CLAUDE.md` | the repo; stamped | the GAP program state, the engineering rules, the pointers to the mandates and the baseline |
| Project memory | `C:\Users\casey\.claude\projects\C--Users-casey-modex-gtm\memory\*.md` (index `MEMORY.md`) | the sessions; frontmatter `last_verified`; overwritten in place | project state as of a session (what shipped, what is open), preferences, references; DRIFTS: see section 4 |
| Skills | `C:\Users\casey\.claude\skills\*` | Casey and the sessions; `last_verified` | how to operate (HubSpot ops, the vault, voice); the voice rules are the only commercial-adjacent content |
| The mandates | `docs/gap/EXECUTION_ENGINE_MANDATE_2026-10-08.md`, `docs/gap/PROSPECTING_FIRST_MANDATE_2026-10-08.md`, `docs/gap/AI_RECOVERY_MANDATE_2026-10-08.md` | Casey's words verbatim; dated in the filename; committed | the product decisions and their reasons |
| The baseline | `docs/gap/STABLE_BASELINE.md` | the lead; the production SHA line, stamped | the contracts that must not change, the truth vocabulary, the feedback rule |
| The ledger | `docs/GAP_PROSPECTING_OS.md` | the lead; per-ticket receipts with commit SHAs | what shipped, when, how it was verified; the open corrective audit |
| The account-first record | `docs/gap/ACCOUNT_FIRST_UX.md` | the lead; sections dated | contracts, measurements, reviews, debt |
| The vault (Casey's brain) | `Documents\Obsidian\YardFlow-GTM-Obsidian-Vault` | Casey and the vault automation; `last_refreshed` per file | the commercial knowledge itself: accounts, people, meetings, transcripts. Already imported through `context/retrieval.ts` (C14 to C16), attributed by path and heading. |

## 3. What may be imported as an attributed artifact

Import means: a `ContextClaim` with `sourceKind`, a `sourceId` naming the file and the heading, `version` (the file's stamp, the mandate's date, the commit SHA), `observedAt` the date the decision was taken (never the file's refresh time, C15), `claimClass` `seller_noted` or `internal_only`, `visibility` `internal`. Nothing from this list is ever `buyer_said` or `external_ok`.

| May be imported | Origin to record | Version to record | Why |
|---|---|---|---|
| A product or commercial decision in a mandate ("the day is for new conversations", "signal age is shown, never a gate") | the mandate file and its heading | the date in the filename | Casey's own words, verbatim, accepted |
| A contract in STABLE_BASELINE ("copied is not sent", "unknown remains unknown") | the file and section | the production SHA line | the lead accepted it and production carries it |
| A shipped receipt in the ledger ("X19 retired the legacy digest, 2026-10-09") | the ledger section and ticket id | the commit SHA in the receipt | dated, attributable, later than any memory note |
| An owner decision recorded in ACCOUNT_FIRST_UX or the ledger (owner choices for an account, a frozen microsite) | the file and section | the section date | a decision, not an inference |
| The voice rules (copy-voice, no em dash, yards plural, production capacity) | the skill or the compiler check that enforces them | `last_verified` | they are already enforced in code; importing them as claims adds nothing but is harmless |

Not yet imported by any code: this inventory names what is eligible; the assembler (`context/assemble.ts`) takes a `publicFacts` and a `knowledge` adapter today and no "canon" adapter. Adding one is a scoped ticket if a packet consumer needs these decisions as claims (none does on 2026-10-08).

## 4. What may NOT be imported

| Never imported | Why |
|---|---|
| Chat instructions and session prompts | not canonical, not accepted by Casey as a record, and an instruction is never tool authority |
| Project memory notes as facts | they record a session's state and drift. Example checked on 2026-10-08: memory `project_gap_execution_engine.md` says "X19 (retire the legacy digest) stays Casey's call" (open); the ledger's later receipt (docs/GAP_PROSPECTING_OS.md, the A06 entry) says X19 was retired on 2026-10-09 on Casey's word, and the baseline's production line carries it. The ledger wins because it is dated and carries the SHA; the memory note is a lead to it, never an override. |
| CLAUDE.md operating facts (ports, tokens, rig traps) | operational, not commercial; some name secrets by variable name |
| Anything a session inferred about a buyer | an inference by a session is `inference`, internal, and it already lives in the vault or the ledger if it was worth keeping; the session itself is not a source |
| Skills' example copy | examples, not decisions |

## 5. Precedence when sources disagree (C17 applied to these files)

1. The CRM for deal existence; the mail provider for sent and received; the buyer's own words for what the buyer said. None of the files above is ever an authority for those.
2. For a product decision: the newest DATED canonical record (a mandate, the baseline, a ledger receipt with a SHA) over any memory note, whatever the memory note's `last_verified`.
3. A memory note that disagrees with a canonical record is drift to fix at the memory file (the operating rule in `C:\Users\casey\CLAUDE.md`: drift discovered is drift fixed), never a reason to doubt the record.

## 6. Residual

- The `project_gap_execution_engine.md` X19 line (section 4) is stale on 2026-10-08 and should be corrected at the memory file by the lead session that owns it; this inventory records the discrepancy, it does not edit memory.
