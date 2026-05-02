import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedLoadPreview = vi.fn();
const mockedIssueToken = vi.fn();

vi.mock('@/lib/enrichment/writeback-approval', () => ({
  loadWritebackPreview: mockedLoadPreview,
  issueWritebackApprovalToken: mockedIssueToken,
}));

describe('enrichment writeback approve route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns approval token when preview checksum exists', async () => {
    mockedLoadPreview.mockResolvedValue({ personaId: 42, checksum: 'a'.repeat(64), preview: [], createdAt: '2026-05-02T00:00:00Z' });
    mockedIssueToken.mockResolvedValue({ token: 'tok_1', expiresAt: '2099-01-01T00:00:00.000Z' });

    const { POST } = await import('@/app/api/enrichment/writeback/approve/route');
    const req = new NextRequest('http://localhost/api/enrichment/writeback/approve', {
      method: 'POST',
      body: JSON.stringify({ personaId: 42, previewChecksum: 'a'.repeat(64) }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.approvalToken).toBe('tok_1');
  });
});
