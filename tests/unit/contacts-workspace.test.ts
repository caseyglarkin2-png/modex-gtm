import { describe, expect, it } from 'vitest';
import { contactMatchesSavedView, contactSavedViews, resolveContactReadiness } from '@/lib/contacts-workspace';

const now = new Date('2026-05-02T12:00:00Z');

describe('contacts workspace contract', () => {
  it('declares the canonical saved views', () => {
    expect(contactSavedViews.map((view) => view.label)).toEqual([
      'All',
      'Send Ready',
      'Needs Enrichment',
      'Blocked / Hold',
      'HubSpot Linked',
      'Recently Touched',
    ]);
  });

  it('explains send-ready, enrichment, and hold readiness states', () => {
    expect(resolveContactReadiness({
      email: 'buyer@example.com',
      email_valid: true,
      do_not_contact: false,
      quality_score: 92,
      quality_band: 'A',
      hubspot_contact_id: '501',
      last_enriched_at: new Date('2026-04-15T12:00:00Z'),
      updated_at: now,
    }, now)).toMatchObject({ key: 'send-ready', label: 'Send Ready', tone: 'success' });

    expect(resolveContactReadiness({
      email: null,
      email_valid: true,
      do_not_contact: false,
      quality_score: 55,
      quality_band: 'C',
      hubspot_contact_id: null,
      last_enriched_at: null,
      updated_at: now,
    }, now)).toMatchObject({ key: 'needs-enrichment', label: 'Needs Enrichment', tone: 'warning' });

    expect(resolveContactReadiness({
      email: 'hold@example.com',
      email_valid: true,
      do_not_contact: true,
      quality_score: 90,
      quality_band: 'A',
      hubspot_contact_id: null,
      last_enriched_at: now,
      updated_at: now,
    }, now)).toMatchObject({ key: 'blocked-hold', label: 'Blocked / Hold', tone: 'destructive' });
  });

  it('filters saved views from contact state', () => {
    const contact = {
      email: 'buyer@example.com',
      email_valid: true,
      do_not_contact: false,
      quality_score: 92,
      quality_band: 'A',
      hubspot_contact_id: '501',
      last_enriched_at: now,
      updated_at: now,
      readinessKey: 'send-ready' as const,
    };

    expect(contactMatchesSavedView('send-ready', contact, now)).toBe(true);
    expect(contactMatchesSavedView('hubspot-linked', contact, now)).toBe(true);
    expect(contactMatchesSavedView('recently-touched', contact, now)).toBe(true);
    expect(contactMatchesSavedView('blocked-hold', contact, now)).toBe(false);
  });
});
