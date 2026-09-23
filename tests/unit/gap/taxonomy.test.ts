import { describe, expect, it } from 'vitest';

import rules from '@/lib/gap/hypothesis/family-rules.json';
import {
  ASSERTIVE_PATTERNS,
  BID_SOURCES,
  BID_TYPES,
  CHANNELS,
  ENROLLMENT_STATUSES,
  HEDGE_TOKENS,
  HYPOTHESIS_STATUSES,
  HYPOTHESIS_TERMINAL_STATUSES,
  LANE_PURPOSE_MAP,
  NON_STOPPING_RESPONSE_CLASSES,
  PERSONAS,
  PIC_BUYING_CENTER_TO_PERSONA,
  POUNCE_THEME_TO_FAMILY,
  PROBLEM_FAMILIES,
  PROBLEM_FAMILY_CATALOG,
  REPLY_HANDLING_KEYS,
  REPLY_HANDLING_TO_RESPONSE_CLASS,
  RESPONSE_CLASSES,
  ROUTING_ACTIONS,
  ROUTING_LANES,
  SEQUENCE_ENGINES,
  SIGNAL_SOURCE_KINDS,
  SIGNAL_SOURCE_TYPES,
  SIGNAL_TYPES,
  STEP_PURPOSES,
  STOP_REASONS,
  UNMAPPED_FAMILY,
  classifyFamilies,
  isPersona,
  isProblemFamily,
  isResponseClass,
} from '@/lib/gap/taxonomy';

const HONDA_SENTENCE =
  'Anna is truck only. No rail, 110 dock doors, 420 trailer spots, and every sequenced part reaches the line through the gate. When a sequenced trailer runs late, does that reach you as a system event or as a phone call?';

type RuleFile = Record<string, { cues: string[] }>;
const ruleFile = rules as RuleFile;

describe('gap taxonomy tuples', () => {
  it('PROBLEM_FAMILIES has the seven families in order', () => {
    expect([...PROBLEM_FAMILIES]).toEqual([
      'network_standardization',
      'hidden_capacity',
      'yard_state_integrity',
      'driver_gate_scale',
      'automation_readiness',
      'cost_to_ship',
      'chain_of_custody',
    ]);
    expect(UNMAPPED_FAMILY).toBe('unmapped');
  });

  it('PERSONAS has nine personas in order', () => {
    expect([...PERSONAS]).toEqual([
      'executive_ops',
      'supply_chain',
      'transportation',
      'distribution',
      'site_ops',
      'automation',
      'security',
      'finance_procurement',
      'technology',
    ]);
  });

  it('SIGNAL_TYPES has eleven types in order', () => {
    expect([...SIGNAL_TYPES]).toEqual([
      'acquisition',
      'new_site',
      'site_expansion',
      'automation_program',
      'job_posting',
      'technology_signal',
      'news',
      'intent',
      'website_behavior',
      'manual_research',
      'other',
    ]);
  });

  it('signal source kinds and types are in order', () => {
    expect([...SIGNAL_SOURCE_KINDS]).toEqual([
      'pounce_trigger',
      'evidence_record',
      'top100_evidence',
      'pic_citation',
      'operator_knowledge',
      'crm',
      'manual',
    ]);
    expect([...SIGNAL_SOURCE_TYPES]).toEqual([
      'public_primary',
      'public_secondary',
      'first_party_intent',
      'first_party',
      'crm',
      'manual',
    ]);
  });

  it('hypothesis statuses are in order and the terminal set is the last five', () => {
    expect([...HYPOTHESIS_STATUSES]).toEqual([
      'draft',
      'review_required',
      'approved',
      'active',
      'confirmed',
      'partially_confirmed',
      'rejected',
      'unresolved',
      'expired',
    ]);
    expect([...HYPOTHESIS_TERMINAL_STATUSES]).toEqual([
      'confirmed',
      'partially_confirmed',
      'rejected',
      'unresolved',
      'expired',
    ]);
    expect([...HYPOTHESIS_TERMINAL_STATUSES]).toEqual(HYPOTHESIS_STATUSES.slice(-5));
  });

  it('routing actions and lanes are in order', () => {
    expect([...ROUTING_ACTIONS]).toEqual([
      'research_required',
      'approve_hypothesis',
      'call_now',
      'enroll_gap_sequence',
      'one_off_email',
      'linkedin_manual_task',
      'nurture',
      'do_not_contact',
    ]);
    expect([...ROUTING_LANES]).toEqual(['work_queue', 'reply_triage', 'blocked']);
  });

  it('response classes are in order and the non-stopping set is four', () => {
    expect([...RESPONSE_CLASSES]).toEqual([
      'problem_confirmed',
      'problem_partially_confirmed',
      'problem_rejected',
      'wrong_person',
      'referral',
      'not_priority',
      'timing',
      'existing_solution',
      'request_information',
      'meeting_accepted',
      'meeting_declined',
      'do_not_contact',
      'bounce',
      'out_of_office',
      'no_signal',
      'no_answer',
      'voicemail',
      'gatekeeper',
    ]);
    expect([...NON_STOPPING_RESPONSE_CLASSES]).toEqual([
      'no_answer',
      'voicemail',
      'gatekeeper',
      'out_of_office',
    ]);
  });

  it('reply handling keys are the Top100 lane ten in order', () => {
    expect([...REPLY_HANDLING_KEYS]).toEqual([
      'positive_interest',
      'referral',
      'already_have_yms',
      '3pl_runs_it',
      'not_now',
      'wrong_person',
      'out_of_office',
      'bounce',
      'opt_out',
      'substantive_rejection',
    ]);
  });

  it('bid types, bid sources and channels are in order', () => {
    expect([...BID_TYPES]).toEqual([
      'current_state',
      'business_problem',
      'root_cause',
      'impact',
      'metric',
      'future_state',
      'priority',
      'constraint',
      'objection',
    ]);
    expect([...BID_SOURCES]).toEqual(['call', 'email', 'meeting', 'linkedin']);
    expect([...CHANNELS]).toEqual(['call', 'email', 'linkedin', 'meeting']);
  });

  it('step purposes are in order and the lane map targets valid purposes', () => {
    expect([...STEP_PURPOSES]).toEqual([
      'intrigue',
      'root_cause',
      'impact',
      'value_offer',
      'hypothesis_test',
      'direct_diagnosis',
      'close_loop',
    ]);
    expect(LANE_PURPOSE_MAP).toEqual({
      earn_reply: 'intrigue',
      clarify_consequence: 'root_cause',
      address_obstacle: 'value_offer',
      next_step_or_close: 'close_loop',
    });
    for (const purpose of Object.values(LANE_PURPOSE_MAP)) {
      expect(STEP_PURPOSES).toContain(purpose);
    }
  });

  it('sequence engines, enrollment statuses and stop reasons are in order', () => {
    expect([...SEQUENCE_ENGINES]).toEqual(['hubspot_native', 'modex_draft_queue', 'manual']);
    expect([...ENROLLMENT_STATUSES]).toEqual([
      'active',
      'paused',
      'stop_pending',
      'stopped',
      'completed',
    ]);
    expect([...STOP_REASONS]).toEqual([
      'replied',
      'unsubscribed',
      'in_thread',
      'bounced',
      'dnc',
      'suppressed',
      'manual',
      'hypothesis_resolved',
      'hypothesis_expired',
      'sequence_retired',
      'legacy_unknown',
    ]);
  });

  it('hedge tokens and assertive patterns are the agreed sets', () => {
    expect([...HEDGE_TOKENS]).toEqual([
      'my guess',
      'i suspect',
      'likely',
      'usually',
      'tends to',
      'might',
      'may be',
      'could be',
      'if ',
      '?',
    ]);
    expect([...ASSERTIVE_PATTERNS]).toEqual([
      'you are losing',
      'your yards are',
      'you have no',
      'you (are|re) (wasting|bleeding)',
    ]);
    for (const source of ASSERTIVE_PATTERNS) {
      expect(() => new RegExp(source, 'i')).not.toThrow();
    }
    expect(new RegExp(ASSERTIVE_PATTERNS[3], 'i').test('You are bleeding money at the gate')).toBe(true);
    expect(new RegExp(ASSERTIVE_PATTERNS[3], 'i').test('you re wasting hours')).toBe(true);
  });
});

describe('gap taxonomy catalog', () => {
  it('has an entry for every family with non-empty content and valid signal types', () => {
    expect(Object.keys(PROBLEM_FAMILY_CATALOG)).toEqual([...PROBLEM_FAMILIES]);
    for (const family of PROBLEM_FAMILIES) {
      const entry = PROBLEM_FAMILY_CATALOG[family];
      expect(entry.problem.length).toBeGreaterThan(10);
      expect(entry.likelyCauses.length).toBeGreaterThanOrEqual(4);
      expect(entry.impacts.length).toBeGreaterThanOrEqual(4);
      expect(entry.signalTypes.length).toBeGreaterThanOrEqual(2);
      for (const signal of entry.signalTypes) {
        expect(SIGNAL_TYPES).toContain(signal);
      }
    }
  });

  it('pins the catalog signal types per family', () => {
    expect(PROBLEM_FAMILY_CATALOG.network_standardization.signalTypes).toEqual([
      'acquisition',
      'new_site',
      'site_expansion',
      'technology_signal',
    ]);
    expect(PROBLEM_FAMILY_CATALOG.hidden_capacity.signalTypes).toEqual([
      'site_expansion',
      'job_posting',
      'news',
    ]);
    expect(PROBLEM_FAMILY_CATALOG.yard_state_integrity.signalTypes).toEqual([
      'technology_signal',
      'automation_program',
    ]);
    expect(PROBLEM_FAMILY_CATALOG.driver_gate_scale.signalTypes).toEqual([
      'new_site',
      'site_expansion',
      'job_posting',
    ]);
    expect(PROBLEM_FAMILY_CATALOG.automation_readiness.signalTypes).toEqual([
      'automation_program',
      'technology_signal',
    ]);
    expect(PROBLEM_FAMILY_CATALOG.cost_to_ship.signalTypes).toEqual(['news', 'intent']);
    expect(PROBLEM_FAMILY_CATALOG.chain_of_custody.signalTypes).toEqual(['news', 'manual_research']);
  });

  it('never uses the word throughput or an em dash in catalog text', () => {
    const text = JSON.stringify(PROBLEM_FAMILY_CATALOG);
    expect(text.toLowerCase()).not.toContain('throughput');
    expect(text).not.toContain('—');
  });
});

describe('family-rules.json', () => {
  it('keys are exactly the seven families with at least six lowercase cues each', () => {
    expect(Object.keys(ruleFile)).toEqual([...PROBLEM_FAMILIES]);
    for (const family of PROBLEM_FAMILIES) {
      const cues = ruleFile[family].cues;
      expect(cues.length).toBeGreaterThanOrEqual(6);
      for (const cue of cues) {
        expect(cue).toBe(cue.toLowerCase());
        expect(cue.trim().length).toBeGreaterThan(0);
      }
      expect(new Set(cues).size).toBe(cues.length);
    }
  });

  it('carries the required anchor cues per family', () => {
    const anchors: Record<string, string[]> = {
      hidden_capacity: ['dock doors', 'trailer spots', 'gate', 'sequenced', 'just-in-time', 'late trailer', 'line starves', 'capacity'],
      driver_gate_scale: ['guard shack', 'check-in', 'paperwork', 'clipboard', 'driver', 'gate queue'],
      automation_readiness: ['robot', 'agv', 'autonomous', 'machine vision', 'automation'],
      network_standardization: ['acquisition', 'acquired', 'integration', 'standardize', 'rollout', 'network'],
      yard_state_integrity: ['rfid', 'tag', 'where a trailer is', 'trailer search', 'yard state', 'visibility'],
      cost_to_ship: ['detention', 'accessorial', 'dwell', 'cost per', 'cost to ship', 'carrier'],
      chain_of_custody: ['seal', 'custody', 'bill of lading', 'claims', 'theft', 'audit'],
    };
    for (const [family, cues] of Object.entries(anchors)) {
      for (const cue of cues) {
        expect(ruleFile[family].cues, `${family} missing cue "${cue}"`).toContain(cue);
      }
    }
  });

  it('never uses the word throughput or an em dash in cues', () => {
    const text = JSON.stringify(ruleFile);
    expect(text.toLowerCase()).not.toContain('throughput');
    expect(text).not.toContain('—');
  });
});

describe('gap taxonomy maps', () => {
  it('every pounce theme maps to exactly one family or null', () => {
    expect(POUNCE_THEME_TO_FAMILY).toEqual({
      autonomy: 'automation_readiness',
      yard_direct: 'yard_state_integrity',
      network_capex: 'hidden_capacity',
      expansion: 'network_standardization',
      cost_restructure: 'cost_to_ship',
      leadership: null,
      digital_ops: 'yard_state_integrity',
      freight: 'cost_to_ship',
    });
    for (const family of Object.values(POUNCE_THEME_TO_FAMILY)) {
      expect(family === null || isProblemFamily(family)).toBe(true);
    }
  });

  it('every PIC buying center maps to a persona', () => {
    expect(PIC_BUYING_CENTER_TO_PERSONA).toEqual({
      economic: 'executive_ops',
      champion: 'supply_chain',
      technical: 'technology',
      blocker: 'finance_procurement',
      user: 'site_ops',
    });
    for (const persona of Object.values(PIC_BUYING_CENTER_TO_PERSONA)) {
      expect(isPersona(persona)).toBe(true);
    }
  });

  it('every reply-handling key maps to a non-empty list of valid response classes', () => {
    expect(Object.keys(REPLY_HANDLING_TO_RESPONSE_CLASS)).toEqual([...REPLY_HANDLING_KEYS]);
    expect(REPLY_HANDLING_TO_RESPONSE_CLASS).toEqual({
      positive_interest: ['problem_confirmed', 'request_information'],
      referral: ['referral'],
      already_have_yms: ['existing_solution'],
      '3pl_runs_it': ['existing_solution'],
      not_now: ['timing', 'not_priority'],
      wrong_person: ['wrong_person'],
      out_of_office: ['out_of_office'],
      bounce: ['bounce'],
      opt_out: ['do_not_contact'],
      substantive_rejection: ['problem_rejected'],
    });
    for (const key of REPLY_HANDLING_KEYS) {
      const classes = REPLY_HANDLING_TO_RESPONSE_CLASS[key];
      expect(classes.length).toBeGreaterThanOrEqual(1);
      for (const cls of classes) {
        expect(isResponseClass(cls)).toBe(true);
      }
    }
  });
});

describe('type guards', () => {
  it('isProblemFamily accepts the seven and rejects unmapped, other strings and non-strings', () => {
    for (const family of PROBLEM_FAMILIES) expect(isProblemFamily(family)).toBe(true);
    expect(isProblemFamily('unmapped')).toBe(false);
    expect(isProblemFamily('Hidden_Capacity')).toBe(false);
    expect(isProblemFamily(42)).toBe(false);
    expect(isProblemFamily(null)).toBe(false);
  });

  it('isResponseClass and isPersona reject near misses', () => {
    expect(isResponseClass('problem_confirmed')).toBe(true);
    expect(isResponseClass('positive_interest')).toBe(false);
    expect(isPersona('site_ops')).toBe(true);
    expect(isPersona('user')).toBe(false);
  });
});

describe('classifyFamilies', () => {
  it('classifies the Honda sentence as hidden_capacity', () => {
    const result = classifyFamilies(HONDA_SENTENCE);
    expect(result.primary).toBe('hidden_capacity');
    expect(result.hits.hidden_capacity).toBeGreaterThanOrEqual(4);
    expect(result.secondary).not.toContain('hidden_capacity');
  });

  it('returns unmapped with zero hits for empty text', () => {
    const result = classifyFamilies('');
    expect(result.primary).toBe('unmapped');
    expect(result.secondary).toEqual([]);
    expect(result.hits).toEqual({
      network_standardization: 0,
      hidden_capacity: 0,
      yard_state_integrity: 0,
      driver_gate_scale: 0,
      automation_readiness: 0,
      cost_to_ship: 0,
      chain_of_custody: 0,
    });
  });

  it('returns unmapped for text with no cues', () => {
    const result = classifyFamilies('The quarterly all-hands is on Thursday.');
    expect(result.primary).toBe('unmapped');
    expect(result.secondary).toEqual([]);
  });

  it('ranks a mixed acquisition and detention text with the higher count primary', () => {
    const text =
      'After the acquisition we still pay detention every week. Detention on the inbound lane, detention on outbound.';
    const result = classifyFamilies(text);
    expect(result.hits.cost_to_ship).toBe(3);
    expect(result.hits.network_standardization).toBe(1);
    expect(result.primary).toBe('cost_to_ship');
    expect(result.secondary).toEqual(['network_standardization']);
  });

  it('counts a cue once per occurrence and is case-insensitive', () => {
    const result = classifyFamilies('DETENTION. detention. Detention.');
    expect(result.hits.cost_to_ship).toBe(3);
  });

  it('orders secondary families by descending hits', () => {
    const text = 'acquisition acquisition acquisition detention detention seal';
    const result = classifyFamilies(text);
    expect(result.primary).toBe('network_standardization');
    expect(result.secondary).toEqual(['cost_to_ship', 'chain_of_custody']);
  });
});
