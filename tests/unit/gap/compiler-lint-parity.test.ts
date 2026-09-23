import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { GROUP_A_CHECKS } from '@/lib/gap/compiler/checks/c01-evidence';
import { GROUP_B_CHECKS } from '@/lib/gap/compiler/checks/c04-product';
import { BANNED_CLASS_NAMES } from '@/lib/gap/compiler/checks/c11-banned';
import { GROUP_C_CHECKS } from '@/lib/gap/compiler/checks/c13-claims';
import {
  LANE_LINT_COPY_RELATIVE_PATH,
  LANE_LINT_RULES_PORTED,
  extractLaneRuleNames,
  portCheckId,
} from '@/lib/gap/compiler/lint-parity';
import type { Check, CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

const LANE_LINT_PATH = process.env.GAP_LANE_LINT_COPY ?? path.join(os.homedir(), ...LANE_LINT_COPY_RELATIVE_PATH.split('/'));
const laneLintPresent = fs.existsSync(LANE_LINT_PATH);

const PROBE_DRAFT: CompileDraft = {
  subject: 'Ohio gate roles',
  body: 'Hi Kara,\n\nYour Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]].\n\nMy guess is the gate. How many trailers sit past their appointment on a normal Tuesday?\n\nCasey Larkin',
};
const PROBE_CTX: CompileContext = {
  stepIndex: 0,
  hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'hidden_capacity' },
  evidence: [],
  priorStepBodies: [],
  contract: null,
};

/** The check ids the three groups actually emit, read from a live run rather than from constants. */
function emittedCheckIds(checks: Check[]): string[] {
  return checks.map((check) => check(PROBE_DRAFT, PROBE_CTX).code);
}

describe('lint-copy parity ledger', () => {
  it('has no duplicate lane rules', () => {
    const names = LANE_LINT_RULES_PORTED.map((r) => r.laneRule);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every entry a status and every debt entry a note', () => {
    for (const entry of LANE_LINT_RULES_PORTED) {
      expect(['ported', 'debt'], entry.laneRule).toContain(entry.status);
      if (entry.status === 'debt') {
        expect(entry.note, `${entry.laneRule} is debt without a note`).toBeTruthy();
      }
    }
  });

  it('points every ported entry at a check id that groups A, B or C actually emit', () => {
    const ids = new Set([
      ...emittedCheckIds(GROUP_A_CHECKS),
      ...emittedCheckIds(GROUP_B_CHECKS),
      ...emittedCheckIds(GROUP_C_CHECKS),
    ]);
    expect([...ids].sort()).toEqual(['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16']);
    for (const entry of LANE_LINT_RULES_PORTED.filter((r) => r.status === 'ported')) {
      expect(ids, `${entry.laneRule} -> ${entry.portedIn}`).toContain(portCheckId(entry.portedIn));
    }
  });

  it('emits group C in check-code order', () => {
    expect(emittedCheckIds(GROUP_C_CHECKS)).toEqual(['C07', 'C08', 'C09', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16']);
  });

  it('points every C11 port at a real banned class', () => {
    const c11 = LANE_LINT_RULES_PORTED.filter((r) => r.portedIn.startsWith('C11/'));
    expect(c11.length).toBeGreaterThan(10);
    for (const { laneRule, portedIn } of c11) {
      const className = portedIn.slice('C11/'.length);
      expect(BANNED_CLASS_NAMES, `${laneRule} -> ${portedIn}`).toContain(className);
    }
  });

  it('names only compiler checks as port locations', () => {
    for (const { portedIn } of LANE_LINT_RULES_PORTED) {
      expect(portedIn).toMatch(/^C\d{2}(?:\/[a-z0-9_]+)?$/);
    }
  });

  it('extracts rule names from the lane declaration shape', () => {
    const sample = [
      "const X = [['not_a_rule', /x/]];",
      'const RULES = [',
      "  ['alpha_rule', /a/i],",
      "  ['beta_rule', null],",
      "  ['gamma_rule', someFn()],",
      '];',
    ].join('\n');
    expect(extractLaneRuleNames(sample)).toEqual(['alpha_rule', 'beta_rule', 'gamma_rule']);
    expect(extractLaneRuleNames('nothing here')).toEqual([]);
  });
});

describe.skipIf(!laneLintPresent)('lint-copy parity against the real lane file', () => {
  const source = laneLintPresent ? fs.readFileSync(LANE_LINT_PATH, 'utf8') : '';
  const laneRules = extractLaneRuleNames(source);

  it('finds the lane rule list', () => {
    expect(laneRules.length).toBeGreaterThanOrEqual(20);
    console.log(`lane lint rules (${laneRules.length}): ${laneRules.join(', ')}`);
    const debt = LANE_LINT_RULES_PORTED.filter((r) => r.status === 'debt').map((r) => `${r.laneRule} (${r.note})`);
    console.log(`lane rules booked as debt (${debt.length}): ${debt.join('; ') || 'none'}`);
  });

  it('ports every lane rule (a rule added in the lane fails here until ported)', () => {
    const ported = new Set(LANE_LINT_RULES_PORTED.map((r) => r.laneRule));
    const missing = laneRules.filter((name) => !ported.has(name));
    expect(missing, `lane rules with no compiler entry: ${missing.join(', ')}`).toEqual([]);
  });

  it('carries no stale entry the lane no longer declares', () => {
    const live = new Set(laneRules);
    const stale = LANE_LINT_RULES_PORTED.map((r) => r.laneRule).filter((name) => !live.has(name));
    expect(stale, `ledger entries the lane dropped: ${stale.join(', ')}`).toEqual([]);
  });
});
