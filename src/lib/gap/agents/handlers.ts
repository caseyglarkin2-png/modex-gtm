/**
 * The agent task handlers by kind (X08, GAP OS sales execution engine, 2026-10-08). One registry the cron and the
 * command handler's `after()` kick both read, so a task runs the same code wherever it is drained. A kind with no
 * handler fails final with `no_handler: <kind>` (tasks.ts), never silently.
 *
 * `revise_message` (X09) is the first; `answer_objection` (X16d) prepares a talking point for a recorded objection;
 * `develop_angle` (I03) develops the angle for an intelligence item Casey chose to pursue; the
 * call, follow-up and meeting kinds follow in their tickets.
 */
import { answerObjection } from './answer-objection';
import { developAngle } from './develop-angle';
import { reviseMessage } from './revise-message';
import type { AgentTaskHandler, AgentTaskKind } from './tasks';

export function agentTaskHandlers(): Partial<Record<AgentTaskKind, AgentTaskHandler>> {
  return { revise_message: (task, ctx) => reviseMessage(task, ctx), answer_objection: (task, ctx) => answerObjection(task, ctx), develop_angle: (task, ctx) => developAngle(task, ctx) };
}
