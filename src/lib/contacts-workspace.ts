export type ContactReadinessKey = 'send-ready' | 'needs-enrichment' | 'blocked-hold' | 'hubspot-linked' | 'recently-touched';

export type ContactSavedView = {
  id: 'all' | ContactReadinessKey;
  label: string;
  description: string;
};

export const contactSavedViews: ContactSavedView[] = [
  { id: 'all', label: 'All', description: 'Every known contact and persona.' },
  { id: 'send-ready', label: 'Send Ready', description: 'Has valid email, not suppressed, and strong quality.' },
  { id: 'needs-enrichment', label: 'Needs Enrichment', description: 'Missing email, weak quality, or stale enrichment.' },
  { id: 'blocked-hold', label: 'Blocked / Hold', description: 'Do-not-contact or invalid email.' },
  { id: 'hubspot-linked', label: 'HubSpot Linked', description: 'Linked to a HubSpot contact.' },
  { id: 'recently-touched', label: 'Recently Touched', description: 'Updated or enriched recently.' },
];

export type ContactReadiness = {
  key: ContactReadinessKey;
  label: string;
  tone: 'success' | 'warning' | 'destructive' | 'secondary';
  reasons: string[];
};

export type ContactReadinessInput = {
  email: string | null;
  email_valid: boolean;
  do_not_contact: boolean;
  quality_score: number;
  quality_band: string;
  hubspot_contact_id: string | null;
  last_enriched_at: Date | null;
  updated_at: Date;
};

export function resolveContactReadiness(contact: ContactReadinessInput, now = new Date()): ContactReadiness {
  if (contact.do_not_contact) {
    return {
      key: 'blocked-hold',
      label: 'Blocked / Hold',
      tone: 'destructive',
      reasons: ['Do-not-contact is enabled.'],
    };
  }

  if (!contact.email_valid) {
    return {
      key: 'blocked-hold',
      label: 'Blocked / Hold',
      tone: 'destructive',
      reasons: ['Email is marked invalid.'],
    };
  }

  const reasons: string[] = [];
  if (!contact.email) reasons.push('Missing email.');
  if (contact.quality_score < 80 && contact.quality_band !== 'A') reasons.push('Quality score below send-ready threshold.');
  if (isStale(contact.last_enriched_at, now)) reasons.push('Enrichment is stale or missing.');

  if (reasons.length > 0) {
    return {
      key: 'needs-enrichment',
      label: 'Needs Enrichment',
      tone: 'warning',
      reasons,
    };
  }

  return {
    key: 'send-ready',
    label: 'Send Ready',
    tone: 'success',
    reasons: ['Valid email, clear suppression, and sufficient contact quality.'],
  };
}

export function contactMatchesSavedView(
  viewId: ContactSavedView['id'],
  contact: ContactReadinessInput & { readinessKey?: ContactReadinessKey },
  now = new Date(),
) {
  if (viewId === 'all') return true;
  if (viewId === 'hubspot-linked') return Boolean(contact.hubspot_contact_id);
  if (viewId === 'recently-touched') return !isStale(contact.updated_at, now, 30);
  return (contact.readinessKey ?? resolveContactReadiness(contact, now).key) === viewId;
}

function isStale(value: Date | null, now: Date, maxAgeDays = 90) {
  if (!value) return true;
  return now.getTime() - value.getTime() > maxAgeDays * 24 * 60 * 60 * 1000;
}
