/**
 * GAP message compiler (Sprint 3, S3-T8): parity ledger against the Top100
 * lane's `lint-copy.mjs`. Pure: no I/O. The parity test reads the real lane
 * file, extracts its rule names and fails on any rule missing from this list,
 * so a rule added in the lane fails loudly until it is ported.
 *
 * `portedIn` is the compiler check that enforces the rule, with the C11 banned
 * class after a slash when the port is a C11 class (the parity test resolves
 * those against `BANNED_CLASS_NAMES`, and every check id against the ids the
 * group A, B and C check arrays actually emit). `status` is honest: 'ported'
 * means the named check enforces the rule today; 'debt' means it does not yet,
 * and `note` says what is missing.
 */

export type LaneLintPortStatus = 'ported' | 'debt';

export interface LaneLintRulePort {
  laneRule: string;
  portedIn: string;
  status: LaneLintPortStatus;
  note?: string;
}

/** Where the lane's lint lives, relative to the home directory. */
export const LANE_LINT_COPY_RELATIVE_PATH = 'yardflow-hubspot/top100/scripts/lint-copy.mjs';

export const LANE_LINT_RULES_PORTED: readonly LaneLintRulePort[] = [
  { laneRule: 'cr029_family', portedIn: 'C11/cr029_family', status: 'ported' },
  {
    laneRule: 'named_pipeline',
    portedIn: 'C05',
    status: 'ported',
    note: 'C05 matches contract.namedPipeline in subject and body; the orchestrator must inject the lane list (data/pipeline_names.json plus aliases).',
  },
  { laneRule: 'cr029_paraphrase', portedIn: 'C11/cr029_paraphrase', status: 'ported' },
  {
    laneRule: 'invented_primo_integration',
    portedIn: 'C11/invented_primo_integration',
    status: 'ported',
    note: 'C05 does not implement this; the lane regex is a C11 class.',
  },
  { laneRule: 'throughput_word', portedIn: 'C11/throughput_word', status: 'ported' },
  { laneRule: 'stray_capital_subject', portedIn: 'C15', status: 'ported' },
  {
    laneRule: 'handful_narrative',
    portedIn: 'C11/handful_narrative',
    status: 'ported',
    note: 'C05 does not implement this; the lane regex is a C11 class.',
  },
  { laneRule: 'bare_url_last', portedIn: 'C16', status: 'ported' },
  { laneRule: '260_as_live', portedIn: 'C11/260_as_live', status: 'ported' },
  { laneRule: 'measured_5pct', portedIn: 'C11/measured_5pct', status: 'ported' },
  { laneRule: 'simulated_reply', portedIn: 'C11/simulated_reply', status: 'ported' },
  { laneRule: 'em_dash', portedIn: 'C11/em_dash', status: 'ported' },
  {
    laneRule: 'throughput_capacity',
    portedIn: 'C11/throughput_word',
    status: 'ported',
    note: '"throughput capacity" can never fire without "throughput" firing first.',
  },
  { laneRule: 'standardize_paper', portedIn: 'C11/standardize_paper', status: 'ported' },
  { laneRule: 'because_open', portedIn: 'C11/because_open', status: 'ported' },
  { laneRule: 'title_case_subject', portedIn: 'C15', status: 'ported' },
  { laneRule: 'link_in_step1', portedIn: 'C16', status: 'ported' },
  { laneRule: 'wrote_back', portedIn: 'C11/wrote_back', status: 'ported' },
  { laneRule: 'headcount', portedIn: 'C11/headcount', status: 'ported' },
  { laneRule: 'mechanics_exposure', portedIn: 'C11/mechanics_exposure', status: 'ported' },
  { laneRule: 'false_reply_history', portedIn: 'C11/false_reply_history', status: 'ported' },
  { laneRule: 'observed_48_24', portedIn: 'C11/observed_48_24', status: 'ported' },
  { laneRule: 'bespoke_deliverable', portedIn: 'C11/bespoke_deliverable', status: 'ported' },
  { laneRule: 'false_finality', portedIn: 'C11/false_finality', status: 'ported' },
  { laneRule: 'time_relative', portedIn: 'C11/time_relative', status: 'ported' },
  {
    laneRule: 'subject_too_long',
    portedIn: 'C15',
    status: 'ported',
    note: 'The lane capped subjects at five words; C15 uses seven per audit row 18.',
  },
];

/** The check id part of a `portedIn` value ("C11/em_dash" -> "C11"). */
export function portCheckId(portedIn: string): string {
  return portedIn.split('/')[0];
}

/** The lane declares rules as `['name', /regex/]` rows inside `const RULES = [ ... ]`. */
export const LANE_RULE_DECLARATION_RE = /^\s*\[\s*'([a-z0-9_]+)'\s*,/gm;

export function extractLaneRuleNames(source: string): string[] {
  const start = source.indexOf('const RULES = [');
  if (start === -1) return [];
  const re = new RegExp(LANE_RULE_DECLARATION_RE.source, LANE_RULE_DECLARATION_RE.flags);
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source.slice(start))) !== null) names.push(m[1]);
  return names;
}
