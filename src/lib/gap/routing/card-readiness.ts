/**
 * The Seller Action Center's coverage invariant (final pass, 2026-09-25).
 *
 * Every routing card resolves to exactly one of:
 *
 *   blocked               a system block (hard compliance suppression, or the
 *                         suppression service could not be read). Nothing to do.
 *   actionable            a real person, their contact data, one clear seller
 *                         action and a usable link to do it (the action pack,
 *                         a tel: link, the LinkedIn profile, the hypothesis
 *                         review). `nurture` is actionable: its action is to
 *                         hold, and the reason is shown.
 *   missing_prerequisite  the exact thing that is missing, and a direct link
 *                         to fix it.
 *
 * There is no fourth state. "Here is a name, good luck" (a card with a person
 * and nothing to do with them) is exactly what this function exists to make
 * unrepresentable; tests/unit/gap/card-readiness.test.ts enumerates every
 * action against every combination of missing data.
 *
 * Pure. Voice: no em dashes.
 */

import type { SuppressionClass } from '../suppression/provenance';
import { SUPPRESSION_CLASS_COPY } from '../suppression/provenance';
import { hubspotCompanyUrl, hubspotContactUrl, telHref } from './seller-action';

export interface ReadinessInput {
  id: string;
  action: string;
  blocked: boolean;
  ruleId: string;
  account: { name: string; hubspotCompanyId: string | null };
  persona: {
    id: number | string | null;
    displayName: string | null;
    email: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    hubspotContactId: string | null;
  };
  hypothesis: { id: string; status?: string } | null;
  suppression?: { class: SuppressionClass; hits: string[] } | null;
}

export interface Link {
  label: string;
  href: string;
}

export type CardReadiness =
  | { state: 'blocked'; title: string; body: string; remediation?: string }
  | {
      state: 'actionable';
      primary: Link | { label: string; href: null; note: string };
      /** Secondary links (the action pack beside a call, for example). */
      secondary: Link[];
      warning?: { title: string; body: string };
    }
  | { state: 'missing_prerequisite'; missing: string; fix: Link; warning?: { title: string; body: string } };

const WARNING_CLASSES: ReadonlySet<SuppressionClass> = new Set(['soft_deliverability', 'hard_invalid_address']);

/** Where a draft hypothesis for any account is reviewed and approved today. */
export const HYPOTHESIS_REVIEW_HREF = '/gap/hypotheses?status=draft';

export function actionPackHref(hypothesisId: string, personaId: number | string | null, decisionId: string): string {
  const q = new URLSearchParams();
  if (personaId !== null && personaId !== undefined && String(personaId) !== '') q.set('personaId', String(personaId));
  q.set('decisionId', decisionId);
  return `/gap/preview/${encodeURIComponent(hypothesisId)}?${q.toString()}`;
}

function firstName(item: ReadinessInput): string {
  return item.persona.displayName?.trim()?.split(/\s+/)[0] || 'them';
}

function contactFix(item: ReadinessInput, label: string): Link {
  const contact = item.persona.hubspotContactId ? hubspotContactUrl(item.persona.hubspotContactId) : null;
  if (contact) return { label, href: contact };
  const company = item.account.hubspotCompanyId ? hubspotCompanyUrl(item.account.hubspotCompanyId) : null;
  if (company) return { label: `${label} (account)`, href: company };
  return { label: 'Find this contact', href: '/contacts' };
}

function accountFix(item: ReadinessInput, label: string): Link {
  const company = item.account.hubspotCompanyId ? hubspotCompanyUrl(item.account.hubspotCompanyId) : null;
  if (company) return { label, href: company };
  return contactFix(item, label);
}

function hypothesisFix(): Link {
  return { label: 'Review or create a hypothesis', href: HYPOTHESIS_REVIEW_HREF };
}

export function cardReadiness(item: ReadinessInput): CardReadiness {
  const cls = item.suppression?.class ?? 'clear';

  if (item.blocked || item.action === 'do_not_contact') {
    if (item.ruleId === 'suppression_unknown' || cls === 'service_unreadable') {
      return {
        state: 'blocked',
        ...SUPPRESSION_CLASS_COPY.service_unreadable,
        remediation: 'Run routing again when the suppression service answers.',
      };
    }
    if (item.ruleId === 'suppressed' || cls === 'hard_compliance') return { state: 'blocked', ...SUPPRESSION_CLASS_COPY.hard_compliance };
    return { state: 'blocked', title: 'System block', body: `GAP refused to recommend an action here (rule ${item.ruleId}).` };
  }

  const warning = WARNING_CLASSES.has(cls) ? SUPPRESSION_CLASS_COPY[cls] : undefined;
  const name = firstName(item);
  const packLink = item.hypothesis
    ? { label: 'Open action pack (email + call script)', href: actionPackHref(item.hypothesis.id, item.persona.id, item.id) }
    : null;

  if (item.ruleId === 'suppression_review' || cls === 'unknown_provenance') {
    const hits = item.suppression?.hits?.join(', ') || 'a do-not-contact flag';
    return {
      state: 'missing_prerequisite',
      missing: `Suppression review: ${hits} is set but its origin cannot be proven. Confirm there is no opt-out or request to stop before any outreach.`,
      fix: contactFix(item, 'Check the contact record'),
    };
  }

  const withWarning = <T extends object>(r: T): T => (warning ? { ...r, warning } : r);

  switch (item.action) {
    case 'enroll_gap_sequence':
    case 'one_off_email': {
      if (!item.hypothesis) return withWarning({ state: 'missing_prerequisite' as const, missing: `No approved hypothesis for ${item.account.name}, so there is no email to send.`, fix: hypothesisFix() });
      if (!item.persona.email) return withWarning({ state: 'missing_prerequisite' as const, missing: `No email address on file for ${name}.`, fix: contactFix(item, 'Add an email in HubSpot') });
      return withWarning({ state: 'actionable' as const, primary: packLink!, secondary: [] });
    }
    case 'call_now': {
      const tel = telHref(item.persona.phone ?? null);
      if (!tel) return withWarning({ state: 'missing_prerequisite' as const, missing: `No usable phone number for ${name}.`, fix: contactFix(item, 'Add a phone in HubSpot') });
      return withWarning({ state: 'actionable' as const, primary: { label: `Call ${name}`, href: tel }, secondary: packLink ? [packLink] : [] });
    }
    case 'linkedin_manual_task': {
      const li = item.persona.linkedinUrl?.trim();
      if (!li) return withWarning({ state: 'missing_prerequisite' as const, missing: `No LinkedIn profile on file for ${name}.`, fix: contactFix(item, 'Add a LinkedIn URL in HubSpot') });
      return withWarning({ state: 'actionable' as const, primary: { label: `Message ${name} on LinkedIn`, href: li }, secondary: packLink ? [packLink] : [] });
    }
    case 'approve_hypothesis':
      return withWarning({ state: 'actionable' as const, primary: { label: 'Review the hypothesis', href: HYPOTHESIS_REVIEW_HREF }, secondary: [] });
    case 'nurture':
      return withWarning({
        state: 'actionable' as const,
        primary: { label: 'Hold for later', href: null, note: 'No outreach now. The routing details say why.' },
        secondary: [],
      });
    case 'research_required':
    default: {
      switch (item.ruleId) {
        case 'no_hypothesis':
          return withWarning({ state: 'missing_prerequisite' as const, missing: `No approved hypothesis for ${item.account.name} yet, so there is no outreach to prepare.`, fix: hypothesisFix() });
        case 'bounced_or_invalid':
          return withWarning({ state: 'missing_prerequisite' as const, missing: `No usable email or phone for ${name}.`, fix: contactFix(item, 'Find a current email or phone') });
        case 'tam_unknown':
          return withWarning({ state: 'missing_prerequisite' as const, missing: `${item.account.name} has no verified TAM status.`, fix: accountFix(item, 'Verify TAM on the account') });
        case 'hyp_stale':
          return withWarning({ state: 'missing_prerequisite' as const, missing: 'The hypothesis rests on stale or expired evidence.', fix: hypothesisFix() });
        case 'disp_wrong_person':
          return withWarning({ state: 'missing_prerequisite' as const, missing: `The last reply said ${name} is the wrong person. Find the right contact.`, fix: accountFix(item, 'Find the right person') });
        default:
          return withWarning({ state: 'missing_prerequisite' as const, missing: `Research required (${item.ruleId.replace(/_/g, ' ')}).`, fix: accountFix(item, 'Open the account') });
      }
    }
  }
}
