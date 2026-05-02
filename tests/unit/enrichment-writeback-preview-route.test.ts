import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  contactEnrichment: {
    findUnique: vi.fn(),
  },
};
const mockedStorePreview = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

vi.mock('@/lib/enrichment/writeback-approval', async () => {
  const actual = await vi.importActual<typeof import('@/lib/enrichment/writeback-approval')>(
    '@/lib/enrichment/writeback-approval',
  );
  return {
    ...actual,
    storeWritebackPreview: mockedStorePreview,
  };
});

describe('enrichment writeback preview route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENRICH_MIN_CONFIDENCE_OVERWRITE = '0.8';
  });

  it('returns field-level dry-run decisions', async () => {
    mockedPrisma.contactEnrichment.findUnique.mockResolvedValue({
      fields: [
        {
          field_name: 'job_title',
          field_value: 'Director',
          source: 'hubspot',
          confidence: 0.7,
          updated_at: new Date('2026-05-01T00:00:00Z'),
        },
      ],
    });

    const { POST } = await import('@/app/api/enrichment/writeback/preview/route');
    const req = new NextRequest('http://localhost/api/enrichment/writeback/preview', {
      method: 'POST',
      body: JSON.stringify({
        personaId: 101,
        candidate: {
          job_title: {
            value: 'VP Operations',
            source: 'apollo',
            confidence: 0.91,
            updatedAt: '2026-05-02T00:00:00.000Z',
          },
        },
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.preview[0]).toMatchObject({
      field: 'job_title',
      decision: 'accept_candidate',
    });
    expect(json.previewChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(mockedStorePreview).toHaveBeenCalled();
  });
});
