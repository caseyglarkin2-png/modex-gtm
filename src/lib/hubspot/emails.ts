/**
 * HubSpot Emails Module — Log email sends and replies to HubSpot via Emails Object API.
 * Uses POST /crm/v3/objects/emails (NOT Timeline Events API, NOT deprecated Engagements API).
 */
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from './client';
import { searchContactByEmail, upsertContact } from './contacts';
import { HUBSPOT_LOGGING_ENABLED } from '@/lib/feature-flags';
import * as Sentry from '@sentry/nextjs';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/AssociationSpec';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';

export interface EmailObjectPayload {
  /** INCOMING_EMAIL for replies, FORWARDED_EMAIL for sends */
  direction: 'INCOMING_EMAIL' | 'FORWARDED_EMAIL';
  subject: string;
  /** Plain text body (HubSpot stores this) */
  bodyText: string;
  /** Sender email */
  fromEmail: string;
  /** Recipient email */
  toEmail: string;
  /** Email status */
  status?: string;
}

function buildEmailHeaders(payload: EmailObjectPayload): string {
  const from = { email: payload.fromEmail };
  const to = [{ email: payload.toEmail }];

  return JSON.stringify({
    from,
    sender: from,
    to,
    cc: [],
    bcc: [],
  });
}

/**
 * Create an Email Object in HubSpot and associate it with a contact.
 * Returns the created email object ID, or null if skipped/failed.
 */
export async function logEmailToHubSpot(
  payload: EmailObjectPayload,
  contactEmail: string,
): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_LOGGING_ENABLED) {
    console.warn('HubSpot email logging skipped', {
      configured: isHubSpotConfigured(),
      enabled: HUBSPOT_LOGGING_ENABLED,
      contactEmail,
    });
    return null;
  }
  assertExternalWriteAllowed('hubspot', 'logEmailToHubSpot');

  try {
    const client = getHubSpotClient();

    // Create email object
    const emailObj = await withHubSpotRetry(
      () =>
        client.crm.objects.emails.basicApi.create({
          properties: {
            hs_email_direction: payload.direction,
            hs_email_subject: payload.subject,
            hs_email_text: payload.bodyText.slice(0, 65535), // HubSpot max
            hs_email_html: payload.bodyText.slice(0, 65535),
            hs_email_status: payload.status || 'SENT',
            hs_email_headers: buildEmailHeaders(payload),
            hs_timestamp: new Date().toISOString(),
          },
          associations: [],
        }),
      'logEmailToHubSpot:create',
    );

    const emailId = emailObj.id;

    // Create or associate contact if possible.
    let contactId: string | null = null;
    const contact = await searchContactByEmail(contactEmail);
    if (contact) {
      contactId = contact.id;
    } else {
      contactId = await upsertContact({ email: contactEmail }).catch(() => null);
    }

    if (contactId) {
      try {
        await withHubSpotRetry(
          () =>
            client.crm.associations.v4.basicApi.create(
              'emails',
              emailId,
              'contacts',
              contactId,
              [{ associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined, associationTypeId: 198 }], // email_to_contact
            ),
          'logEmailToHubSpot:associate',
        );
      } catch (assocErr) {
        // Association failure is non-fatal
        Sentry.captureException(assocErr, {
          extra: { emailId, contactId },
        });
      }
    }

    return emailId;
  } catch (error) {
    console.error('HubSpot email object creation failed', {
      subject: payload.subject,
      to: payload.toEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    Sentry.captureException(error, {
      extra: { subject: payload.subject, to: payload.toEmail },
    });
    throw error;
  }
}

/**
 * Log an outbound email send to HubSpot.
 */
export async function logSendToHubSpot(
  subject: string,
  bodyHtml: string,
  toEmail: string,
): Promise<string | null> {
  const plainText = bodyHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();

  return logEmailToHubSpot(
    {
      direction: 'FORWARDED_EMAIL',
      subject,
      bodyText: plainText,
      fromEmail: process.env.FROM_EMAIL || 'casey@freightroll.com',
      toEmail,
    },
    toEmail,
  );
}

/**
 * Log an incoming reply to HubSpot.
 */
export async function logReplyToHubSpot(
  subject: string,
  snippet: string,
  fromEmail: string,
): Promise<string | null> {
  return logEmailToHubSpot(
    {
      direction: 'INCOMING_EMAIL',
      subject,
      bodyText: snippet,
      fromEmail,
      toEmail: process.env.FROM_EMAIL || 'casey@freightroll.com',
    },
    fromEmail,
  );
}
