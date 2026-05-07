import { beforeEach, describe, expect, it } from 'vitest';
import { buildAgentActionCacheKey, getAgentActionTtlMs } from '@/lib/agent-actions/cache';
import { listAgentActionCapabilities, sanitizeOutreachDraftText } from '@/lib/agent-actions/broker';

describe('agent action broker helpers', () => {
  const originalClawd = process.env.CLAWD_CONTROL_PLANE_URL;
  const originalSalesAgent = process.env.SALES_AGENT_BASE_URL;

  beforeEach(() => {
    process.env.CLAWD_CONTROL_PLANE_URL = originalClawd;
    process.env.SALES_AGENT_BASE_URL = originalSalesAgent;
  });

  it('builds a stable cache key from the action target', () => {
    const key = buildAgentActionCacheKey({
      action: 'content_context',
      refresh: false,
      depth: 'quick',
      target: {
        accountName: 'John Deere',
        company: 'John Deere',
        email: 'ops@johndeere.com',
      },
    });

    expect(key).toBe('agent-action:content_context:account:john-deere:company:john-deere:email:ops-johndeere-com');
  });

  it('returns the expected TTL for content context', () => {
    expect(getAgentActionTtlMs('content_context')).toBe(6 * 60 * 60 * 1000);
    expect(getAgentActionTtlMs('contact_dossier')).toBe(24 * 60 * 60 * 1000);
  });

  it('prefers sales-agent for enrich and sequence when both services are configured', () => {
    process.env.CLAWD_CONTROL_PLANE_URL = 'https://clawd.example.com';
    process.env.SALES_AGENT_BASE_URL = 'https://sales-agent.example.com';

    const capabilities = listAgentActionCapabilities();
    const enrich = capabilities.find((item) => item.action === 'contact_enrich');
    const sequence = capabilities.find((item) => item.action === 'sequence_recommendation');
    const contentContext = capabilities.find((item) => item.action === 'content_context');

    expect(enrich?.preferredProvider).toBe('sales_agent');
    expect(sequence?.preferredProvider).toBe('sales_agent');
    expect(contentContext?.preferredProvider).toBe('modex');
  });

  it('falls back to modex when no sidecar services are configured', () => {
    delete process.env.CLAWD_CONTROL_PLANE_URL;
    delete process.env.SALES_AGENT_BASE_URL;

    const capabilities = listAgentActionCapabilities();
    const accountResearch = capabilities.find((item) => item.action === 'account_research');

    expect(accountResearch?.preferredProvider).toBe('modex');
    expect(accountResearch?.configured).toBe(false);
  });

  it('sanitizes legacy clawd draft copy to YardFlow voice', () => {
    const dirty = [
      'Thought this might be relevant — especially for network consistency.',
      '',
      'If helpful, I can send a benchmark at dwtb.dev/partners.',
      '',
      '---',
      'DWTB?! Studios | Jacksonville, FL',
      "If you'd prefer not to hear from me, just reply 'unsubscribe'.",
    ].join('\n');

    const cleaned = sanitizeOutreachDraftText(dirty);
    expect(cleaned).not.toContain('—');
    expect(cleaned).not.toContain('dwtb.dev');
    expect(cleaned).not.toContain('DWTB?! Studios');
    expect(cleaned).not.toContain("If you'd prefer not to hear from me");
    expect(cleaned).toContain('yardflow.ai/partners');
  });
});
