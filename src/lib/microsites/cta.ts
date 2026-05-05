import type { CTABlock } from './schema';

const FREIGHTROLL_CONTACT_EMAIL = 'casey@freightroll.com';
const CALENDAR_HOST_PATTERN = /calendar\.google\.com\/calendar/i;
const COLD_MEETING_LANGUAGE_PATTERN = /\b(book|meeting|audit|demo|walk[- ]?through|modex)\b/i;

function buildMailtoHref(accountName?: string) {
  const safeAccountName = accountName?.trim() || 'your network';
  const subject = encodeURIComponent(`Short overview for ${safeAccountName}`);
  const body = encodeURIComponent(
    `We would like the short overview for ${safeAccountName}.\n\nPlease send the 1-page version.\n`,
  );
  return `mailto:${FREIGHTROLL_CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

function looksLikeColdMeetingCta(cta: CTABlock) {
  const combinedCopy = [cta.headline, cta.subtext, cta.buttonLabel].filter(Boolean).join(' ');
  return (
    Boolean(cta.calendarLink && CALENDAR_HOST_PATTERN.test(cta.calendarLink)) ||
    COLD_MEETING_LANGUAGE_PATTERN.test(combinedCopy)
  );
}

export function buildShortOverviewCta(accountName?: string): CTABlock {
  const safeAccountName = accountName?.trim() || 'your network';
  return {
    type: 'warm-intro',
    headline: `Want the short overview for ${safeAccountName}?`,
    subtext:
      'Reply and we will send the one-page version focused on yard flow, throughput, variance reduction, and operator proof.',
    buttonLabel: 'Should we send the short overview?',
    calendarLink: buildMailtoHref(safeAccountName),
  };
}

export function normalizeMicrositeCta(cta: CTABlock, accountName?: string): CTABlock {
  if (!looksLikeColdMeetingCta(cta)) {
    return cta;
  }

  return {
    ...buildShortOverviewCta(accountName),
    personName: cta.personName,
    personContext: cta.personContext,
  };
}
