/**
 * HubSpot API mock fixtures for unit and integration tests.
 * Covers contacts, companies, emails, and error responses.
 */

// ---------- Contacts ----------

export const mockContact = {
  id: '501',
  properties: {
    email: 'casey@freightroll.com',
    firstname: 'Casey',
    lastname: 'Larkin',
    company: 'FreightRoll',
    phone: '(555) 123-4567',
    jobtitle: 'GTM Lead',
    hs_lead_status: 'OPEN',
    createdate: '2026-04-01T12:00:00.000Z',
    lastmodifieddate: '2026-04-10T08:30:00.000Z',
  },
  createdAt: '2026-04-01T12:00:00.000Z',
  updatedAt: '2026-04-10T08:30:00.000Z',
  archived: false,
};

export const mockContactSearchResult = {
  total: 1,
  results: [mockContact],
  paging: undefined,
};

export const mockContactBatchResult = {
  status: 'COMPLETE' as const,
  results: [mockContact],
  requestedAt: '2026-04-10T08:30:00.000Z',
  startedAt: '2026-04-10T08:30:00.000Z',
  completedAt: '2026-04-10T08:30:01.000Z',
};

// ---------- Companies ----------

export const mockCompany = {
  id: '901',
  properties: {
    name: 'General Mills',
    domain: 'generalmills.com',
    industry: 'Food & Beverage',
    city: 'Minneapolis',
    state: 'MN',
    numberofemployees: '35000',
    createdate: '2026-04-01T12:00:00.000Z',
    lastmodifieddate: '2026-04-10T08:30:00.000Z',
  },
  createdAt: '2026-04-01T12:00:00.000Z',
  updatedAt: '2026-04-10T08:30:00.000Z',
  archived: false,
};

export const mockCompanySearchResult = {
  total: 1,
  results: [mockCompany],
  paging: undefined,
};

// ---------- Emails (Emails Object API) ----------

export const mockEmailObject = {
  id: '10001',
  properties: {
    hs_timestamp: '2026-04-10T10:00:00.000Z',
    hs_email_direction: 'EMAIL',
    hs_email_subject: 'Quick question about yard throughput',
    hs_email_text: 'Hi — saw you at MODEX...',
    hs_email_status: 'SENT',
    hs_email_from_email: 'casey@freightroll.com',
    hs_email_from_firstname: 'Casey',
    hs_email_from_lastname: 'Larkin',
    hs_email_to_email: 'john.doe@generalmills.com',
    hs_email_headers: '{}',
  },
  createdAt: '2026-04-10T10:00:00.000Z',
  updatedAt: '2026-04-10T10:00:00.000Z',
  archived: false,
};

// ---------- Association ----------

export const mockAssociation = {
  from: { id: '10001' },
  to: { id: '501' },
  type: 'email_to_contact',
};

// ---------- Error Responses ----------

export const mockError429 = {
  status: 'error',
  message: 'You have reached your secondly limit.',
  correlationId: 'abc-def-123',
  category: 'RATE_LIMITS',
};

export const mockError401 = {
  status: 'error',
  message: 'Authentication credentials not found.',
  correlationId: 'abc-def-456',
  category: 'INVALID_AUTHENTICATION',
};

export const mockError400 = {
  status: 'error',
  message: 'Property values were not valid: [{\"isValid\":false,\"message\":\"email is invalid\",\"error\":\"INVALID_EMAIL\",\"name\":\"email\"}]',
  correlationId: 'abc-def-789',
  category: 'VALIDATION_ERROR',
};

export const mockError404 = {
  status: 'error',
  message: 'resource not found',
  correlationId: 'abc-def-000',
  category: 'OBJECT_NOT_FOUND',
};

export const mockError409 = {
  status: 'error',
  message: 'Contact already exists. Existing ID: 501',
  correlationId: 'abc-def-111',
  category: 'CONFLICT',
};
