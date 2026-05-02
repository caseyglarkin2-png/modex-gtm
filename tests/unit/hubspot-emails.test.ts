import { beforeEach, describe, expect, it, vi } from 'vitest';

const createEmail = vi.fn();
const searchContactByEmail = vi.fn();
const upsertContact = vi.fn();
const createAssociation = vi.fn();

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: () => true,
  getHubSpotClient: () => ({
    crm: {
      objects: {
        emails: {
          basicApi: {
            create: createEmail,
          },
        },
      },
      associations: {
        v4: {
          basicApi: {
            create: createAssociation,
          },
        },
      },
    },
  }),
  withHubSpotRetry: (fn: () => Promise<unknown>) => fn(),
}));

vi.mock('@/lib/hubspot/contacts', () => ({
  searchContactByEmail,
  upsertContact,
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('hubspot email logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HUBSPOT_LOGGING_ENABLED = 'true';
    process.env.FROM_EMAIL = 'casey@freightroll.com';
    process.env.ALLOW_EXTERNAL_WRITES_IN_TEST = 'true';
    createEmail.mockResolvedValue({ id: 'email-123' });
    searchContactByEmail.mockResolvedValue({ id: 'contact-456' });
    upsertContact.mockResolvedValue('contact-456');
    createAssociation.mockResolvedValue({});
  });

  it('creates HubSpot emails with hs_email_headers-derived sender and recipient fields', async () => {
    const { logSendToHubSpot } = await import('@/lib/hubspot/emails');

    const id = await logSendToHubSpot('Subject', '<p>Hello &amp; welcome</p>', 'buyer@example.com');

    expect(id).toBe('email-123');
    expect(createEmail).toHaveBeenCalledWith({
      properties: expect.objectContaining({
        hs_email_direction: 'FORWARDED_EMAIL',
        hs_email_subject: 'Subject',
        hs_email_text: 'Hello & welcome',
        hs_email_html: 'Hello & welcome',
        hs_email_status: 'SENT',
        hs_email_headers: JSON.stringify({
          from: { email: 'casey@freightroll.com' },
          sender: { email: 'casey@freightroll.com' },
          to: [{ email: 'buyer@example.com' }],
          cc: [],
          bcc: [],
        }),
      }),
      associations: [],
    });
    expect(createEmail.mock.calls[0][0].properties).not.toHaveProperty('hs_email_sender_email');
    expect(createEmail.mock.calls[0][0].properties).not.toHaveProperty('hs_email_to_email');
  });
});
