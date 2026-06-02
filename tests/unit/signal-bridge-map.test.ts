import { describe, it, expect } from 'vitest';
import { mapClawdExport } from '@/lib/signal-bridge/map-export';
import type { ClawdAccountExport } from '@/lib/signal-bridge/types';

// Mirrors the verified-live contract for cargill.com (clawd export endpoint).
function cargillExport(overrides: Partial<ClawdAccountExport> = {}): ClawdAccountExport {
  return {
    company: 'Cargill',
    domain: 'cargill.com',
    in_intent_feed: true,
    fit: { facility_count: 80, segment: 'shipper', fit_tier: 'high' },
    signals: [
      {
        title: 'Cargill Worker Lockout Threatens Beef Supply Chain',
        url: 'https://example.com/cargill-lockout',
        angle: 'Labor disruption magnifies yard congestion and detention risk.',
        published: '2026-05-28',
      },
    ],
    roi_hook: { annual_savings: 4200000, summary: '80 sites · ~$4.2M detention recovery' },
    incumbent_vendor: null,
    brief: 'Cargill runs a large North American shipper network under acute supply-chain pressure.',
    recommended_play: 'Lead with detention recovery across the 80-site network.',
    committee: [
      {
        full_name: 'Joyce Maruniak',
        title: 'VP Supply Chain Excellence',
        email: 'joyce.maruniak@cargill.com',
        email_confidence: 'High',
        role: 'buyer',
      },
      {
        full_name: 'Sam Operator',
        title: 'Director of Yard Operations',
        email: 'sam.operator@cargill.com',
        email_confidence: 'Low',
        role: 'operator',
      },
      {
        full_name: 'Pat Member',
        title: 'Logistics Analyst',
        email: '',
        email_confidence: '',
        role: 'member',
      },
    ],
    ...overrides,
  };
}

describe('mapClawdExport — account', () => {
  it('maps company to a slugified account name and slug', () => {
    const { slug, account } = mapClawdExport(cargillExport());
    expect(account.name).toBe('Cargill');
    expect(slug).toBe('cargill');
  });

  it('carries the facility count from fit into the microsite account', () => {
    const { account } = mapClawdExport(cargillExport());
    expect(account.facility_count).toBe('80');
  });

  it('weaves each clawd signal into a specific pain point with title + angle', () => {
    const { account } = mapClawdExport(cargillExport());
    expect(account.specific_pain_points).toHaveLength(1);
    expect(account.specific_pain_points![0].headline).toBe(
      'Cargill Worker Lockout Threatens Beef Supply Chain',
    );
    expect(account.specific_pain_points![0].description).toContain('Labor disruption');
  });

  it('attributes the source to the clawd intent engine with the signal url', () => {
    const { account } = mapClawdExport(cargillExport());
    expect(account.source).toMatch(/clawd/i);
    expect(account.source_url_1).toBe('https://example.com/cargill-lockout');
  });

  it('maps a high fit tier to a priority A / Tier 1 account', () => {
    const { account } = mapClawdExport(cargillExport());
    expect(account.priority_band).toBe('A');
    expect(account.tier).toBe('Tier 1');
  });
});

describe('mapClawdExport — personas', () => {
  it('produces one persona per committee member', () => {
    const { personasJson } = mapClawdExport(cargillExport());
    expect(personasJson).toHaveLength(3);
  });

  it('maps a buyer to an exec-sponsor / decision-maker lane', () => {
    const { personasJson } = mapClawdExport(cargillExport());
    const buyer = personasJson.find((p) => p.name === 'Joyce Maruniak')!;
    expect(buyer.persona_lane).toBe('Exec sponsor');
    expect(buyer.role_in_deal).toBe('Decision-maker');
    expect(buyer.priority).toBe('P1');
  });

  it('maps an operator to an operator / influencer lane', () => {
    const { personasJson } = mapClawdExport(cargillExport());
    const op = personasJson.find((p) => p.name === 'Sam Operator')!;
    expect(op.persona_lane).toBe('Operator / influencer');
  });

  it('assigns a stable, idempotent persona_id derived from company + name', () => {
    const a = mapClawdExport(cargillExport());
    const b = mapClawdExport(cargillExport());
    const idA = a.personasJson.find((p) => p.name === 'Joyce Maruniak')!.persona_id;
    const idB = b.personasJson.find((p) => p.name === 'Joyce Maruniak')!.persona_id;
    expect(idA).toBe(idB);
    expect(idA).toContain('cargill');
  });
});

describe('mapClawdExport — send-readiness (Prisma personas)', () => {
  it('marks a High-confidence email as verified and contact-ready', () => {
    const { prismaPersonas } = mapClawdExport(cargillExport());
    const buyer = prismaPersonas.find((p) => p.name === 'Joyce Maruniak')!;
    expect(buyer.email_status).toBe('verified');
    expect(buyer.is_contact_ready).toBe(true);
    expect(buyer.company_domain).toBe('cargill.com');
  });

  it('keeps a Low-confidence email unverified and not contact-ready (identified only)', () => {
    const { prismaPersonas } = mapClawdExport(cargillExport());
    const op = prismaPersonas.find((p) => p.name === 'Sam Operator')!;
    expect(op.email_status).toBe('unverified');
    expect(op.is_contact_ready).toBe(false);
  });

  it('does not mark a member with no email as contact-ready', () => {
    const { prismaPersonas } = mapClawdExport(cargillExport());
    const member = prismaPersonas.find((p) => p.name === 'Pat Member')!;
    expect(member.is_contact_ready).toBe(false);
  });
});

describe('mapClawdExport — warm-intro guardrail', () => {
  it('flags a warm-intro-only account and never auto-colds its personas', () => {
    const danone = cargillExport({
      company: 'Dannon',
      domain: 'dannon.com',
      committee: [
        {
          full_name: 'Heiko Gerling',
          title: 'COO North America',
          email: 'heiko.gerling@danone.com',
          email_confidence: 'High',
          role: 'buyer',
        },
      ],
    });
    const { warmIntroOnly, prismaPersonas } = mapClawdExport(danone);
    expect(warmIntroOnly).toBe(true);
    // Even a High-confidence email must not become a cold-send-ready persona.
    expect(prismaPersonas[0].do_not_contact).toBe(true);
    expect(prismaPersonas[0].is_contact_ready).toBe(false);
  });

  it('leaves a normal account cold-outreach eligible', () => {
    const { warmIntroOnly, prismaPersonas } = mapClawdExport(cargillExport());
    expect(warmIntroOnly).toBe(false);
    expect(prismaPersonas.find((p) => p.name === 'Joyce Maruniak')!.do_not_contact).toBe(false);
  });
});
