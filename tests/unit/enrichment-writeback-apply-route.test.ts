import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedLoadPreview = vi.fn();
const mockedConsumeToken = vi.fn();
const mockedPrisma = {
  contactEnrichment: {
    upsert: vi.fn(),
  },
  contactEnrichmentField: {
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/enrichment/writeback-approval', () => ({
  loadWritebackPreview: mockedLoadPreview,
  consumeWritebackApprovalToken: mockedConsumeToken,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

describe('enrichment writeback apply route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies accepted fields when approval token is valid', async () => {
    mockedLoadPreview.mockResolvedValue({
      personaId: 42,
      checksum: 'a'.repeat(64),
      createdAt: '2026-05-02T00:00:00.000Z',
      preview: [
        {
          field: 'job_title',
          decision: 'accept_candidate',
          existingValue: 'Director',
          candidateValue: 'VP Operations',
          existingSource: 'hubspot',
          candidateSource: 'apollo',
        },
      ],
    });
    mockedConsumeToken.mockResolvedValue(true);
    mockedPrisma.contactEnrichment.upsert.mockResolvedValue({ id: 77 });
    mockedPrisma.contactEnrichmentField.upsert.mockResolvedValue({});

    const { POST } = await import('@/app/api/enrichment/writeback/apply/route');
    const req = new NextRequest('http://localhost/api/enrichment/writeback/apply', {
      method: 'POST',
      body: JSON.stringify({
        personaId: 42,
        previewChecksum: 'a'.repeat(64),
        approvalToken: 'tok_1',
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.appliedFieldCount).toBe(1);
    expect(mockedPrisma.contactEnrichmentField.upsert).toHaveBeenCalled();
  });
});
