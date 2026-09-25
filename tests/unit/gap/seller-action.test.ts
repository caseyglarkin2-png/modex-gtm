import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hubspotCompanyUrl,
  hubspotContactUrl,
  mailtoHref,
  OUTREACH_ROUTING_ACTIONS,
  sellerActionLabel,
  telHref,
} from '@/lib/gap/routing/seller-action';
import { ROUTING_ACTIONS } from '@/lib/gap/taxonomy';

describe('sellerActionLabel', () => {
  it('translates every routing action into a seller-facing instruction, never the raw enum string', () => {
    for (const action of ROUTING_ACTIONS) {
      const label = sellerActionLabel(action, 'Joey', 'Kroger');
      expect(label).not.toBe(action);
      expect(label).not.toMatch(/_/);
    }
  });

  it('fills the name and account into the template', () => {
    expect(sellerActionLabel('enroll_gap_sequence', 'Joey', 'Kroger')).toBe('Email Joey');
    expect(sellerActionLabel('call_now', 'Joey', 'Kroger')).toBe('Call Joey');
    expect(sellerActionLabel('linkedin_manual_task', 'Joey', 'Kroger')).toBe('Message Joey on LinkedIn');
    expect(sellerActionLabel('research_required', 'Joey', 'Kroger')).toBe('Research Joey / Kroger');
    expect(sellerActionLabel('approve_hypothesis', 'Joey', 'Kroger')).toBe('Review hypothesis');
    expect(sellerActionLabel('nurture', 'Joey', 'Kroger')).toBe('Hold for later');
    expect(sellerActionLabel('do_not_contact', 'Joey', 'Kroger')).toBe('Do not contact');
  });

  it('falls back to "them" when no name is known, never fabricating one', () => {
    expect(sellerActionLabel('call_now', null, 'Kroger')).toBe('Call them');
  });
});

describe('OUTREACH_ROUTING_ACTIONS', () => {
  it('covers exactly the actions whose primary instruction is to send outreach', () => {
    expect(OUTREACH_ROUTING_ACTIONS.has('enroll_gap_sequence')).toBe(true);
    expect(OUTREACH_ROUTING_ACTIONS.has('one_off_email')).toBe(true);
    expect(OUTREACH_ROUTING_ACTIONS.has('call_now')).toBe(false);
    expect(OUTREACH_ROUTING_ACTIONS.has('research_required')).toBe(false);
  });
});

describe('hubspotContactUrl / hubspotCompanyUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds the same URL convention as the rest of the app when the portal id is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_PORTAL_ID', '3819073');
    expect(hubspotContactUrl('900')).toBe('https://app.hubspot.com/contacts/3819073/contact/900');
    expect(hubspotCompanyUrl('123')).toBe('https://app.hubspot.com/contacts/3819073/company/123');
  });

  it('falls back to the YardFlow portal when production never set the env var (final pass)', () => {
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_PORTAL_ID', '');
    vi.stubEnv('HUBSPOT_PORTAL_ID', '');
    expect(hubspotContactUrl('900')).toBe('https://app.hubspot.com/contacts/3819073/contact/900');
    expect(hubspotCompanyUrl('123')).toBe('https://app.hubspot.com/contacts/3819073/company/123');
  });

  it('never invents a link when the id itself is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_PORTAL_ID', '3819073');
    expect(hubspotContactUrl('')).toBeNull();
  });
});

describe('telHref / mailtoHref', () => {
  it('builds a tel: link only from a usable phone number', () => {
    expect(telHref('(555) 123-4567')).toBe('tel:5551234567');
    expect(telHref(null)).toBeNull();
    expect(telHref('123')).toBeNull(); // too short to be usable
  });

  it('builds a mailto: link only when an email exists', () => {
    expect(mailtoHref('joey@kroger.example')).toBe('mailto:joey@kroger.example');
    expect(mailtoHref(null)).toBeNull();
  });
});
