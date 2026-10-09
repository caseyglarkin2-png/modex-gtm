# GAP handler inventory (C26)

STATUS: ACTIVE. Written 2026-10-08 for ticket C26 of the "GAP OS COMMERCIAL CONTEXT AND EXECUTION AUDIT" (docs/GAP_PROSPECTING_OS.md). It compares every action GAP exposes to the seller with the code that answers it, and names the paths that are declared but unsupported. Nothing was registered by this inventory: no exposed action promises a task kind without a handler. <!-- verified:2026-10-08 -->

Verification is static (SOURCE in the audit's vocabulary): the registries and dispatchers were read at the paths named; the unit tests named are the ones that pin each path.

## 1. Agent task kinds (src/lib/gap/agents/tasks.ts AGENT_TASK_KINDS) against the registry (agents/handlers.ts)

| Declared kind | Handler registered | Queued from | Status |
|---|---|---|---|
| revise_message | reviseMessage (agents/revise-message.ts) | the REVISE email command (replies/commands-apply.ts) and the app's revise control | supported, pinned by tests/unit/gap/revise-message.test.ts |
| answer_objection | answerObjection (agents/answer-objection.ts) | a recorded objection disposition (X16d) | supported, pinned by tests/unit/gap/answer-objection.test.ts |
| develop_angle | developAngle (agents/develop-angle.ts) | Pursue and More on an intelligence item (work/decide.ts queueAngle) | supported, pinned by tests/unit/gap/develop-angle.test.ts and v1-kenco.test.ts; since C21 it reads the commercial-context packet and carries claim references, the context revision and the gaps |
| research_focus | none | nowhere (no `queueAgentTask` call with this kind; grep over src on 2026-10-08) | DECLARED, UNSUPPORTED, UNREACHABLE: a queued row of this kind would fail final with `no_handler: research_focus` (tasks.ts runAgentTasks). No exposed action promises it. |
| prepare_call | none | nowhere | DECLARED, UNSUPPORTED, UNREACHABLE: same failure mode. The call brief the seller sees is not this task: `/gap/call/[personaId]` renders the deterministic pre-call brief over `GET /api/gap/call/[personaId]` (components/gap/pre-call-brief.tsx), with no model call and no task. |
| prepare_follow_up | none | nowhere | DECLARED, UNSUPPORTED, UNREACHABLE: a follow-up is a commitment (work/commitment-model.ts `follow_up`) rendered as a work item; nothing queues an agent to write it. |
| prepare_meeting | none | nowhere | DECLARED, UNSUPPORTED, UNREACHABLE: `prepare_meeting` as a COMMITMENT KIND (work/commitment-model.ts, work/commitments.ts, capture/extract.ts) is a seller obligation on the list, a different thing from the agent task kind of the same name; the obligation path is supported, the agent task is not. |

Rule applied (the audit's ticket discipline): a kind is registered only for a demonstrated missing promise. None of the four unsupported kinds is promised by an exposed action, an email, a link or a page, so none was registered. If a future ticket exposes "prepare the call" or "write the follow-up" as agent work, it registers the handler in the same commit as the control that promises it, scoped to that promise, with the account, deal and source scope on its result (the develop_angle result shape is the model: `contextRevision`, `support`, `contextGaps`).

## 2. Email commands (work/briefing.ts COMMAND_WORDS, replies/commands.ts parseCommand) against the dispatcher (replies/commands-apply.ts)

| Command | Parsed as | Applied on an assignment thread | Applied on the briefing thread |
|---|---|---|---|
| APPROVE, APPROVED | approve | the Gmail draft is created from the assigned revision (agents/approve-request.ts); the send stays CONFIRM + SEND in the app. C39 (builder A, not this inventory) binds revision 0 to its content. | not a briefing command (the help text answers) |
| REVISE: words, or any line of sentence length | revise | queues `revise_message` (supported above) | not a briefing command |
| SKIP | skip | sets the item aside for the day | not a briefing command |
| DEFER <day> | defer | brings the item back on that day | not a briefing command |
| DONE: what happened | done | records the seller's word as the outcome | not a briefing command |
| NEXT | next | sends the next item | sends the next item of the day |
| HELP, or an unknown short line | help / unknown | answers with COMMANDS_HELP once per item per hour | same |
| START | start | not an assignment command | starts the day: the first assignment comes back by email |

Every parsed command kind has a dispatcher case (lines 171 to 275 of commands-apply.ts on 2026-10-08). The help text lists exactly the supported words. Pinned by tests/unit/gap/commands*.test.ts.

## 3. Signed link ops (work/action-token.ts ACTION_OPS) against the pages

| Op | Page | What it does |
|---|---|---|
| start | /gap/item (redirects to /gap/start) and /gap/start | opens the day's first item, signed in |
| open | /gap/item | resolves the item named by the token within the lookback and redirects to where that work runs; an unknown item redirects to /gap/?link=unknown_item (never executes anything) |
| review | /gap/item | same resolution: the review item's href |
| defer | /gap/item | same resolution: a link never defers by itself; the defer is the app's control or the DEFER command |
| decide | /gap/decide | the decision page for an intelligence item (pursue, explore, save, skip, dismiss, more) |

A link never executes an action on its own (item/page.tsx header comment); every op resolves to a signed-in page. Pinned by tests/unit/gap/action-token.test.ts and decide.test.ts (the round trip).

## 4. Intelligence decisions (work/intel.ts DECISIONS) against work/decide.ts

| Decision | Signal | Trigger | Person |
|---|---|---|---|
| pursue | marks use, queues research when it has a link and an account, queues develop_angle | captures as a signal, marks, queues research when the account is known, queues develop_angle | reloads the sources (persona, message, CRM contact, identity, the day's deal read), queues develop_angle with the placement, the deal and the message |
| more | queues develop_angle (and research when possible), without the mark | same as pursue without the mark | same as pursue without the mark |
| explore | records the look | records the look | records the look |
| save | feedback good_context | one decision row | one decision row |
| skip | hides 30 days | one decision row, hides 30 days | one decision row, hides 30 days |
| dismiss | ignore | one decision row | one decision row |

Every decision has a branch for every item kind; the angle task it queues has a registered handler. Since C23 the kept-angle rule compares the context revision carried on the task input. Pinned by decide.test.ts.

## 5. Scope on generated material

The only generated material today is the develop_angle result (and the revise and objection results, which carry their item key and revision). Since C21 the angle result carries `accountName`, `dealId` / `dealIds` (C06), `contextRevision` (the packet fingerprint), `support` (the claim references per sentence, with source id, class and date), `incumbents` and `contextGaps`. A follow-up or call brief generated by an agent in future must carry the same account, deal and source scope; no such agent exists yet (section 1).

## 5a. The promotion service (C24)

`agents/promote-angle.ts` `promoteAngle` is a seller-clicked service, not a task kind: it takes a succeeded `develop_angle` task and one offered person and action, and hands the work to the EXISTING paths (`execution/seller-reply.ts` `createSellerReplyDraft` for a person who wrote in; `story/draft-from-fact.ts` `draftThesisFromFact` for a verified fact at an account; the call brief for a call; words for research). It registers no handler and adds no task kind; each promotion is one `angle.promoted` ledger row on the item with the task id, the context revision, the claim references and the destination. The route and the control that call it are the lead's to wire.

## 6. Debt named, not taken

- The four unsupported kinds stay in AGENT_TASK_KINDS so a stray row fails loudly (`no_handler`) rather than silently; removing them from the union is a separate decision.
- `prepare_meeting` is both a commitment kind and an agent task kind; the shared name is a reading hazard. Renaming the agent kind (or dropping it) is the lead's call.
