/**
 * HubSpot Notes Module — append a Note to a contact's timeline.
 *
 * Used by D7.2 to surface microsite/demo engagement on the contact
 * record in HubSpot, where the sales workflow lives. The Note appears
 * inline on the contact's timeline alongside emails / calls / tasks.
 *
 * Sibling of `emails.ts`: same client + retry + Sentry pattern, same
 * fail-open semantics (HubSpot failure must never block the request
 * that triggered it).
 */
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from './client';
import { HUBSPOT_LOGGING_ENABLED } from '@/lib/feature-flags';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/contacts/models/AssociationSpec';
import { assertExternalWriteAllowed } from '@/lib/enrichment/external-write-guard';
import * as Sentry from '@sentry/nextjs';

/** HubSpot standard association type id: note → contact. */
const NOTE_TO_CONTACT_ASSOC_TYPE_ID = 202;
/** HubSpot standard association type id: note → company. */
const NOTE_TO_COMPANY_ASSOC_TYPE_ID = 190;

export interface CreateNotePayload {
  /** HTML body of the note. HubSpot supports basic HTML + line breaks. */
  body: string;
  /** ISO 8601 timestamp; defaults to now. */
  timestamp?: string;
  /** Existing HubSpot contact ID to associate the note with. */
  contactId: string;
}

/**
 * Create a Note in HubSpot and associate it with a contact. Returns the
 * note ID, or null if HubSpot is not configured / logging disabled.
 * Failures are swallowed (logged + reported to Sentry) so caller routes
 * never break.
 */
export async function createNote(payload: CreateNotePayload): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_LOGGING_ENABLED) {
    return null;
  }
  assertExternalWriteAllowed('hubspot', 'createNote');

  try {
    const client = getHubSpotClient();

    const note = await withHubSpotRetry(
      () =>
        client.crm.objects.notes.basicApi.create({
          properties: {
            hs_note_body: payload.body.slice(0, 65535),
            hs_timestamp: payload.timestamp ?? new Date().toISOString(),
          },
          associations: [],
        }),
      'createNote:create',
    );

    const noteId = note.id;

    try {
      await withHubSpotRetry(
        () =>
          client.crm.associations.v4.basicApi.create('notes', noteId, 'contacts', payload.contactId, [
            {
              associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: NOTE_TO_CONTACT_ASSOC_TYPE_ID,
            },
          ]),
        'createNote:associate',
      );
    } catch (assocErr) {
      // Association failure is non-fatal — note still exists, just unanchored.
      Sentry.captureException(assocErr, { extra: { noteId, contactId: payload.contactId } });
    }

    return noteId;
  } catch (error) {
    console.error('HubSpot note creation failed', {
      contactId: payload.contactId,
      error: error instanceof Error ? error.message : String(error),
    });
    Sentry.captureException(error, { extra: { contactId: payload.contactId } });
    return null;
  }
}

/**
 * Create a Note and associate it with a COMPANY (the Pounce Spine stamps
 * account-level triggers on the company record). Same fail-open semantics as
 * createNote; returns the note id or null.
 */
export async function createCompanyNote(payload: { body: string; companyId: string; timestamp?: string }): Promise<string | null> {
  if (!isHubSpotConfigured() || !HUBSPOT_LOGGING_ENABLED) {
    return null;
  }
  assertExternalWriteAllowed('hubspot', 'createCompanyNote');
  try {
    const client = getHubSpotClient();
    const note = await withHubSpotRetry(
      () =>
        client.crm.objects.notes.basicApi.create({
          properties: {
            hs_note_body: payload.body.slice(0, 65535),
            hs_timestamp: payload.timestamp ?? new Date().toISOString(),
          },
          associations: [],
        }),
      'createCompanyNote:create',
    );
    try {
      await withHubSpotRetry(
        () =>
          client.crm.associations.v4.basicApi.create('notes', note.id, 'companies', payload.companyId, [
            {
              associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
              associationTypeId: NOTE_TO_COMPANY_ASSOC_TYPE_ID,
            },
          ]),
        'createCompanyNote:associate',
      );
    } catch (assocErr) {
      Sentry.captureException(assocErr, { extra: { noteId: note.id, companyId: payload.companyId } });
    }
    return note.id;
  } catch (error) {
    console.error('HubSpot company note creation failed', {
      companyId: payload.companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    Sentry.captureException(error, { extra: { companyId: payload.companyId } });
    return null;
  }
}
