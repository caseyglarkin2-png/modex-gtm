export const ADVISORY_ONLY_SEND_STATES = [
  'checklist_incomplete',
  'quality_below_threshold',
  'readiness_below_floor',
  'readiness_stale',
  'canonical_warning',
  'legacy_cta_policy',
] as const;

export type AdvisoryOnlySendState = (typeof ADVISORY_ONLY_SEND_STATES)[number];

export type SendBlockerCode =
  | 'INVALID_JSON'
  | 'INVALID_PAYLOAD'
  | 'PROVIDER_CONFIG_MISSING'
  | 'NO_RECIPIENT'
  | 'NO_EMAIL'
  | 'RECIPIENT_NOT_FOUND'
  | 'UNSUBSCRIBED'
  | 'INELIGIBLE_RECIPIENT'
  | 'NO_SENDABLE_RECIPIENTS'
  | 'GENERATED_CONTENT_MISSING'
  | 'RUNTIME_FAILURE';

export type SendBlocker = {
  code: SendBlockerCode;
  status: number;
  error: string;
  message?: string;
  details?: unknown;
};

function blocker(
  code: SendBlockerCode,
  status: number,
  error: string,
  message?: string,
  details?: unknown,
): SendBlocker {
  return { code, status, error, message, details };
}

export function invalidJsonSendBlocker() {
  return blocker('INVALID_JSON', 400, 'Invalid JSON');
}

export function invalidPayloadSendBlocker(details: unknown) {
  return blocker('INVALID_PAYLOAD', 400, 'Invalid payload', undefined, details);
}

export function providerConfigSendBlocker(message: string) {
  return blocker('PROVIDER_CONFIG_MISSING', 500, 'Send provider configuration missing', message);
}

export function noRecipientSendBlocker() {
  return blocker('NO_RECIPIENT', 400, 'No recipient selected.');
}

export function noEmailSendBlocker(message = 'Recipient has no email address. Add one to the persona first.') {
  return blocker('NO_EMAIL', 400, 'NO_EMAIL', message);
}

export function recipientNotFoundSendBlocker(message = 'Recipient record not found.') {
  return blocker('RECIPIENT_NOT_FOUND', 404, message);
}

export function unsubscribedSendBlocker(email: string) {
  return blocker('UNSUBSCRIBED', 400, 'UNSUBSCRIBED', `Cannot send to ${email} - recipient has unsubscribed.`);
}

export function ineligibleRecipientSendBlocker(reason: string) {
  return blocker('INELIGIBLE_RECIPIENT', 400, reason);
}

export function noSendableRecipientsSendBlocker(details?: unknown) {
  return blocker('NO_SENDABLE_RECIPIENTS', 400, 'No sendable recipients available.', undefined, details);
}

export function generatedContentMissingSendBlocker(ids?: number | number[]) {
  const suffix = Array.isArray(ids)
    ? ids.length > 0
      ? ` Missing ids: ${ids.join(', ')}.`
      : ''
    : typeof ids === 'number'
      ? ` Missing id: ${ids}.`
      : '';
  return blocker('GENERATED_CONTENT_MISSING', 404, `Generated content not found.${suffix}`);
}

export function runtimeSendBlocker(message = 'Email send failed') {
  return blocker('RUNTIME_FAILURE', 500, message);
}

export function serializeSendBlocker(block: SendBlocker, extras?: Record<string, unknown>) {
  return {
    error: block.error,
    code: block.code,
    ...(block.message ? { message: block.message } : {}),
    ...(block.details !== undefined ? { details: block.details } : {}),
    ...(extras ?? {}),
  };
}

