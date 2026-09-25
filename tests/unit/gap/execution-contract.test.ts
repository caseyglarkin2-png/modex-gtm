import { describe, expect, it } from 'vitest';
import { EXECUTION_GATE_CHAIN } from '@/lib/gap/execution/contract';

describe('EXECUTION_GATE_CHAIN', () => {
  it('runs the kill switch before anything else, and compile verification before sender vetting', () => {
    expect(EXECUTION_GATE_CHAIN).toEqual([
      'kill_switch_and_flags',
      'suppression',
      'active_opportunity',
      'compile_verification',
      'sender_vetting',
    ]);
  });

  it('has no duplicate gate', () => {
    expect(new Set(EXECUTION_GATE_CHAIN).size).toBe(EXECUTION_GATE_CHAIN.length);
  });
});
